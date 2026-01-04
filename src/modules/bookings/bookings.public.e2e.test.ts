
import request from 'supertest';
import app from '../../app';
import { prisma } from '../../config/prisma';
import { createTestSalon, createTestUser, createTestService, createTestShift } from '../../common/utils/test-utils';
import { add, formatISO } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

describe('POST /api/v1/public/salons/:salonSlug/bookings', () => {
  let salon: any;
  let staff: any;
  let service: any;

  // Setup a clean slate before all tests
  beforeAll(async () => {
    await prisma.booking.deleteMany({});
    await prisma.userService.deleteMany({});
    await prisma.service.deleteMany({});
    await prisma.shift.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.settings.deleteMany({});
    await prisma.salon.deleteMany({});

    salon = await createTestSalon({
      slug: 'test-salon-public-booking',
      settings: {
        create: {
          allowOnlineBooking: true,
          onlineBookingAutoConfirm: false,
          timeZone: 'America/New_York',
        },
      },
    });
    staff = await createTestUser({ salonId: salon.id, role: 'STAFF' });
    service = await createTestService({ salonId: salon.id, durationMinutes: 60 });
    // Make sure shift is for a future-proof day
    await createTestShift({ salonId: salon.id, userId: staff.id, dayOfWeek: add(new Date(), { days: 1 }).getDay(), startTime: '09:00:00', endTime: '17:00:00' });
    await prisma.userService.create({ data: { userId: staff.id, serviceId: service.id } });
  });

  const getFutureTime = () => {
    const nextDayWithShift = add(new Date(), { days: 1 });
    nextDayWithShift.setHours(10, 0, 0, 0); // 10:00 AM
    return nextDayWithShift;
  };

  it('should create a PENDING booking successfully', async () => {
    const startAt = getFutureTime();
    const idempotencyKey = uuidv4();

    const response = await request(app)
      .post(`/api/v1/public/salons/${salon.slug}/bookings`)
      .set('Idempotency-Key', idempotencyKey)
      .send({
        serviceId: service.id,
        staffId: staff.id,
        startAt: formatISO(startAt),
        customer: {
          fullName: 'John Doe',
          phone: '+15551234567',
        },
      });

    expect(response.status).toBe(201);
    expect(response.body.data.status).toBe('PENDING');
    expect(response.body.data.serviceId).toBe(service.id);
    expect(response.body.data.staffId).toBe(staff.id);
  });

  it('should return 403 if online booking is disabled', async () => {
    await prisma.settings.update({ where: { salonId: salon.id }, data: { allowOnlineBooking: false } });

    const response = await request(app)
      .post(`/api/v1/public/salons/${salon.slug}/bookings`)
      .set('Idempotency-Key', uuidv4())
      .send({
        serviceId: service.id,
        staffId: staff.id,
        startAt: formatISO(getFutureTime()),
        customer: { fullName: 'Jane Doe', phone: '+15557654321' },
      });

    expect(response.status).toBe(403);

    await prisma.settings.update({ where: { salonId: salon.id }, data: { allowOnlineBooking: true } });
  });

  it('should return 400 if startAt is in the past', async () => {
    const response = await request(app)
      .post(`/api/v1/public/salons/${salon.slug}/bookings`)
      .set('Idempotency-Key', uuidv4())
      .send({
        serviceId: service.id,
        staffId: staff.id,
        startAt: formatISO(add(new Date(), { hours: -1 })),
        customer: { fullName: 'Past Booker', phone: '+15550000000' },
      });

    expect(response.status).toBe(400);
  });

  it('should return 409 for an overlapping booking', async () => {
    const startAt = getFutureTime();

    await prisma.booking.create({
        data: {
            salonId: salon.id,
            serviceId: service.id,
            staffId: staff.id,
            startAt: startAt,
            endAt: add(startAt, {minutes: 60}),
            customerAccountId: "dummy_account",
            customerProfileId: "dummy_profile",
            createdByUserId: staff.id,
            serviceNameSnapshot: "dummy",
            serviceDurationSnapshot: 60,
            servicePriceSnapshot: 1,
            currencySnapshot: "IRR",
            amountDueSnapshot: 1
        }
    })


    const response = await request(app)
      .post(`/api/v1/public/salons/${salon.slug}/bookings`)
      .set('Idempotency-Key', uuidv4())
      .send({
        serviceId: service.id,
        staffId: staff.id,
        startAt: formatISO(add(startAt, { minutes: 30 })),
        customer: { fullName: 'Second Booker', phone: '+15552222222' },
      });

    expect(response.status).toBe(409);
  });

  it('should allow only one booking when concurrent requests target the same slot', async () => {
    const startAt = add(getFutureTime(), { hours: 2 });
    const endAt = add(startAt, { minutes: service.durationMinutes });
    const payloads = Array.from({ length: 10 }, (_, index) => ({
      serviceId: service.id,
      staffId: staff.id,
      startAt: formatISO(startAt),
      customer: { fullName: `Concurrent Booker ${index}`, phone: `+15556666${index.toString().padStart(2, '0')}` },
    }));

    const responses = await Promise.all(
      payloads.map((payload) =>
        request(app)
          .post(`/api/v1/public/salons/${salon.slug}/bookings`)
          .set('Idempotency-Key', uuidv4())
          .send(payload)
      )
    );

    const successResponses = responses.filter((response) => response.status === 201);
    const conflictResponses = responses.filter((response) => response.status === 409);

    expect(successResponses).toHaveLength(1);
    expect(conflictResponses).toHaveLength(9);
    conflictResponses.forEach((response) => {
      expect(response.body.error.code).toBe('SLOT_NOT_AVAILABLE');
    });

    const activeCount = await prisma.booking.count({
      where: {
        salonId: salon.id,
        staffId: staff.id,
        status: { in: ['PENDING', 'CONFIRMED'] },
        startAt,
        endAt,
      },
    });
    expect(activeCount).toBe(1);

    const booking = await prisma.booking.findFirst({
      where: {
        salonId: salon.id,
        staffId: staff.id,
        startAt,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });
    expect(booking?.status).toBe('PENDING');
  });

  it('should return the same response when replaying a request with the same idempotency key', async () => {
    const startAt = getFutureTime();
    const idempotencyKey = uuidv4();
    const payload = {
      serviceId: service.id,
      staffId: staff.id,
      startAt: formatISO(startAt),
      customer: { fullName: 'Idempotent Booker', phone: '+15553333333' },
    };

    const firstResponse = await request(app)
      .post(`/api/v1/public/salons/${salon.slug}/bookings`)
      .set('Idempotency-Key', idempotencyKey)
      .send(payload);

    expect(firstResponse.status).toBe(201);

    const secondResponse = await request(app)
      .post(`/api/v1/public/salons/${salon.slug}/bookings`)
      .set('Idempotency-Key', idempotencyKey)
      .send(payload);

    expect(secondResponse.status).toBe(201);
    expect(secondResponse.body.data.id).toBe(firstResponse.body.data.id);
  });

  it('should return 409 when reusing an idempotency key with a different payload', async () => {
    const idempotencyKey = uuidv4();

    await request(app)
      .post(`/api/v1/public/salons/${salon.slug}/bookings`)
      .set('Idempotency-Key', idempotencyKey)
      .send({
        serviceId: service.id,
        staffId: staff.id,
        startAt: formatISO(getFutureTime()),
        customer: { fullName: 'Original Payload', phone: '+15554444444' },
      });

    const response = await request(app)
      .post(`/api/v1/public/salons/${salon.slug}/bookings`)
      .set('Idempotency-Key', idempotencyKey)
      .send({
        serviceId: service.id,
        staffId: staff.id,
        startAt: formatISO(getFutureTime()),
        customer: { fullName: 'Modified Payload', phone: '+15555555555' },
      });

    expect(response.status).toBe(409);
  });
});

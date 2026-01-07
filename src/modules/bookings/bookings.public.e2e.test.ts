import request from 'supertest';
import app from '../../app';
import { prisma } from '../../config/prisma';
import { createTestSalon, createTestUser, createTestService, createTestShift } from '../../common/utils/test-utils';
import { add, set } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

describe('POST /api/v1/public/salons/:salonSlug/bookings', () => {
  let salon: any;
  let staff: any;
  let service: any;

  beforeAll(async () => {
    await prisma.booking.deleteMany({});
    await prisma.idempotencyKey.deleteMany({});
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
    await prisma.user.update({ where: { id: staff.id }, data: { isPublic: true } });
    service = await createTestService({ salonId: salon.id, durationMinutes: 60, price: 75000 });

    const startAt = set(add(new Date(), { days: 7 }), { hours: 10, minutes: 0, seconds: 0, milliseconds: 0 });
    await createTestShift({
      salonId: salon.id,
      userId: staff.id,
      dayOfWeek: startAt.getDay(),
      startTime: '09:00:00',
      endTime: '17:00:00',
    });
    await prisma.userService.create({ data: { userId: staff.id, serviceId: service.id } });
  });

  afterAll(async () => {
    await prisma.booking.deleteMany({});
    await prisma.idempotencyKey.deleteMany({});
    await prisma.userService.deleteMany({});
    await prisma.service.deleteMany({});
    await prisma.shift.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.settings.deleteMany({});
    await prisma.salon.deleteMany({});
    await prisma.$disconnect();
  });

  it('creates a pending public booking and replays the same response with the same idempotency key', async () => {
    const startAt = set(add(new Date(), { days: 7 }), { hours: 10, minutes: 0, seconds: 0, milliseconds: 0 });
    const idempotencyKey = uuidv4();
    const payload = {
      serviceId: service.id,
      staffId: staff.id,
      startAt: startAt.toISOString(),
      customer: {
        fullName: 'John Doe',
        phone: '+15551234567',
      },
    };

    const firstResponse = await request(app)
      .post(`/api/v1/public/salons/${salon.slug}/bookings`)
      .set('Idempotency-Key', idempotencyKey)
      .send(payload);

    expect(firstResponse.status).toBe(201);
    expect(firstResponse.body.success).toBe(true);
    expect(firstResponse.body.data.status).toBe('PENDING');
    expect(firstResponse.body.data.serviceId).toBe(service.id);
    expect(firstResponse.body.data.staffId).toBe(staff.id);
    expect(firstResponse.body.data.serviceNameSnapshot).toBe(service.name);
    expect(firstResponse.body.data.serviceDurationSnapshot).toBe(service.durationMinutes);
    expect(firstResponse.body.data.servicePriceSnapshot).toBe(service.price);
    expect(firstResponse.body.data.currencySnapshot).toBe(service.currency);

    const secondResponse = await request(app)
      .post(`/api/v1/public/salons/${salon.slug}/bookings`)
      .set('Idempotency-Key', idempotencyKey)
      .send(payload);

    expect(secondResponse.status).toBe(201);
    expect(secondResponse.body.success).toBe(true);
    expect(secondResponse.body.data.id).toBe(firstResponse.body.data.id);

    const bookingCount = await prisma.booking.count({
      where: {
        salonId: salon.id,
        staffId: staff.id,
        startAt,
      },
    });
    expect(bookingCount).toBe(1);
  });
});

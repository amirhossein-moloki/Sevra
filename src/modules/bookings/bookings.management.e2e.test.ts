import request from 'supertest';
import app from '../../app';
import { prisma } from '../../config/prisma';
import { createTestSalon, createTestUser, createTestService, createTestShift, generateToken } from '../../common/utils/test-utils';
import { add, set } from 'date-fns';
import { UserRole } from '@prisma/client';

describe('Booking Management E2E', () => {
  let salon: any;
  let manager: any;
  let staff: any;
  let service: any;
  let managerToken: string;

  beforeAll(async () => {
    await prisma.booking.deleteMany({});
    await prisma.userService.deleteMany({});
    await prisma.service.deleteMany({});
    await prisma.shift.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.settings.deleteMany({});
    await prisma.salon.deleteMany({});

    salon = await createTestSalon({
      settings: {
        create: {
          allowOnlineBooking: true,
          onlineBookingAutoConfirm: false,
          timeZone: 'America/New_York',
        },
      },
    });
    manager = await createTestUser({ salonId: salon.id, role: UserRole.MANAGER });
    staff = await createTestUser({ salonId: salon.id, role: UserRole.STAFF });
    service = await createTestService({ salonId: salon.id, durationMinutes: 45, price: 120000 });
    await prisma.userService.create({ data: { userId: staff.id, serviceId: service.id } });

    const startAt = set(add(new Date(), { days: 7 }), { hours: 10, minutes: 0, seconds: 0, milliseconds: 0 });
    await createTestShift({
      salonId: salon.id,
      userId: staff.id,
      dayOfWeek: startAt.getDay(),
      startTime: '09:00:00',
      endTime: '17:00:00',
    });

    managerToken = generateToken({
      actorId: manager.id,
      actorType: 'USER',
      salonId: salon.id,
      role: manager.role,
    });
  });

  afterAll(async () => {
    await prisma.booking.deleteMany({});
    await prisma.userService.deleteMany({});
    await prisma.service.deleteMany({});
    await prisma.shift.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.settings.deleteMany({});
    await prisma.salon.deleteMany({});
    await prisma.$disconnect();
  });

  it('creates, reschedules, and completes a booking through the management endpoints', async () => {
    const startAt = set(add(new Date(), { days: 7 }), { hours: 10, minutes: 0, seconds: 0, milliseconds: 0 });

    const createResponse = await request(app)
      .post(`/api/v1/salons/${salon.id}/bookings`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        serviceId: service.id,
        staffId: staff.id,
        startAt: startAt.toISOString(),
        customer: {
          fullName: 'Jane Customer',
          phone: '+15550001111',
          email: 'jane@example.com',
        },
        note: 'Initial booking',
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data.id).toBeDefined();

    const bookingId = createResponse.body.data.id;

    const updatedStartAt = add(startAt, { hours: 1 });
    const updateResponse = await request(app)
      .patch(`/api/v1/salons/${salon.id}/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        startAt: updatedStartAt.toISOString(),
      });

    expect(updateResponse.status).toBe(200);
    expect(new Date(updateResponse.body.data.startAt).toISOString()).toBe(updatedStartAt.toISOString());

    const expectedEndAt = add(updatedStartAt, { minutes: service.durationMinutes });
    expect(new Date(updateResponse.body.data.endAt).toISOString()).toBe(expectedEndAt.toISOString());

    const completeResponse = await request(app)
      .post(`/api/v1/salons/${salon.id}/bookings/${bookingId}/complete`)
      .set('Authorization', `Bearer ${managerToken}`);

    expect(completeResponse.status).toBe(200);
    expect(completeResponse.body.data.status).toBe('DONE');
  });
});

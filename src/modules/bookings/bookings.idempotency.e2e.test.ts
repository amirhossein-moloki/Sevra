
import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { add, set } from 'date-fns';
import httpStatus from 'http-status';

import app from '../../app';
import { prisma } from '../../config/prisma';
import { createTestSalon, createTestService, createTestUser, createTestShift } from '../../common/utils/test-utils';
import { toZonedTime, format } from 'date-fns-tz';

const api = request(app);

describe('Bookings API - Idempotency', () => {
  let salon: any;
  let staff: any;
  let service: any;
  let validBookingPayload: any;
  let nextTuesday: Date;

  beforeAll(async () => {
    salon = await createTestSalon({
      settings: {
        create: {
          allowOnlineBooking: true,
          onlineBookingAutoConfirm: true,
          timeZone: 'Asia/Tehran',
        },
      },
    });
    staff = await createTestUser({ salonId: salon.id, role: 'STAFF' });
    await prisma.user.update({ where: { id: staff.id }, data: { isPublic: true } });
    service = await createTestService({ salonId: salon.id });
    await prisma.userService.create({ data: { userId: staff.id, serviceId: service.id } });
    await createTestShift({ salonId: salon.id, userId: staff.id, dayOfWeek: 2, startTime: '09:00:00', endTime: '17:00:00' });

    const today = new Date();
    let nextTuesdayDate = today;
    while (nextTuesdayDate.getDay() !== 2) {
      nextTuesdayDate = add(nextTuesdayDate, { days: 1 });
    }
    nextTuesday = set(nextTuesdayDate, { hours: 10, minutes: 0, seconds: 0, milliseconds: 0 });

    validBookingPayload = {
      serviceId: service.id,
      staffId: staff.id,
      startAt: nextTuesday.toISOString(),
      customer: {
        fullName: 'John Doe',
        phone: '+989123456789',
      },
      note: 'Test booking',
    };
  });

  afterAll(async () => {
    await prisma.booking.deleteMany();
    await prisma.userService.deleteMany();
    await prisma.service.deleteMany();
    await prisma.shift.deleteMany();
    await prisma.user.deleteMany();
    await prisma.settings.deleteMany();
    await prisma.salon.deleteMany();
    await prisma.idempotencyKey.deleteMany();
  });

  beforeEach(async () => {
    await prisma.booking.deleteMany();
    await prisma.idempotencyKey.deleteMany();
  });

  // Test Case A: Same key + same payload -> same booking
  test('(A) Replaying with the same key and payload should return the same booking and create only one record', async () => {
    const idempotencyKey = uuidv4();

    // First request
    const res1 = await api
      .post(`/api/v1/public/salons/${salon.slug}/bookings`)
      .set('Idempotency-Key', idempotencyKey)
      .send(validBookingPayload);

    expect(res1.status).toBe(httpStatus.CREATED);
    const bookingId1 = res1.body.data.id;

    // Second request (replay)
    const res2 = await api
      .post(`/api/v1/public/salons/${salon.slug}/bookings`)
      .set('Idempotency-Key', idempotencyKey)
      .send(validBookingPayload);

    expect(res2.status).toBe(httpStatus.CREATED);
    const bookingId2 = res2.body.data.id;

    // Assertions
    expect(bookingId1).toEqual(bookingId2);
    const bookingsCount = await prisma.booking.count({ where: { id: bookingId1 } });
    expect(bookingsCount).toBe(1);
  });

  // Test Case B: Same key + different payload -> 409
  test('(B) Reusing a key with a different payload should result in a 409 Conflict', async () => {
    const idempotencyKey = uuidv4();
    const differentPayload = {
      ...validBookingPayload,
      startAt: add(nextTuesday, { hours: 1 }).toISOString(),
    };

    // First request
    await api
      .post(`/api/v1/public/salons/${salon.slug}/bookings`)
      .set('Idempotency-Key', idempotencyKey)
      .send(validBookingPayload)
      .expect(httpStatus.CREATED);

    // Second request with different payload
    const res2 = await api
      .post(`/api/v1/public/salons/${salon.slug}/bookings`)
      .set('Idempotency-Key', idempotencyKey)
      .send(differentPayload);

    expect(res2.status).toBe(httpStatus.CONFLICT);
    expect(res2.body.error.code).toBe('IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD');
  });

  // Test Case C: In-flight behavior -> 409
  test('(C) Sending two requests with the same key concurrently should result in one success and one 409 Conflict', async () => {
    const idempotencyKey = uuidv4();
    const concurrentPayload = {
      ...validBookingPayload,
      startAt: add(nextTuesday, { hours: 2 }).toISOString(),
    };

    const promise1 = api
      .post(`/api/v1/public/salons/${salon.slug}/bookings`)
      .set('Idempotency-Key', idempotencyKey)
      .send(concurrentPayload);

    const promise2 = api
      .post(`/api/v1/public/salons/${salon.slug}/bookings`)
      .set('Idempotency-Key', idempotencyKey)
      .send(concurrentPayload);

    const [res1, res2] = await Promise.all([promise1, promise2]);

    const successfulResponse = res1.status === httpStatus.CREATED ? res1 : res2;
    const conflictResponse = res1.status === httpStatus.CONFLICT ? res1 : res2;

    expect(successfulResponse.status).toBe(httpStatus.CREATED);
    expect(conflictResponse.status).toBe(httpStatus.CONFLICT);
    expect(conflictResponse.body.error.code).toBe('IDEMPOTENCY_REQUEST_IN_PROGRESS');
  });

  // Test Case D: Key missing -> 400
  test('(D) Request without an Idempotency-Key header should fail with 400', async () => {
    const res = await api
      .post(`/api/v1/public/salons/${salon.slug}/bookings`)
      .send(validBookingPayload);

    expect(res.status).toBe(httpStatus.BAD_REQUEST);
    expect(res.body.error.code).toBe('IDEMPOTENCY_KEY_REQUIRED');
  });

  // Test Case E: Idempotency with race-condition -> one 201, one 409 SLOT_NOT_AVAILABLE
  test('(E) Concurrent requests with different keys for the same slot should result in a race condition failure', async () => {
    const racePayload = {
      ...validBookingPayload,
      startAt: add(nextTuesday, { hours: 3 }).toISOString(),
    };
    const key1 = uuidv4();
    const key2 = uuidv4();

    const promise1 = api
      .post(`/api/v1/public/salons/${salon.slug}/bookings`)
      .set('Idempotency-Key', key1)
      .send(racePayload);

    const promise2 = api
      .post(`/api/v1/public/salons/${salon.slug}/bookings`)
      .set('Idempotency-Key', key2)
      .send(racePayload);

    const [res1, res2] = await Promise.all([promise1, promise2]);

    const successfulResponse = res1.status === httpStatus.CREATED ? res1 : res2;
    const conflictResponse = res1.status === httpStatus.CONFLICT ? res1 : res2;

    expect(successfulResponse.status).toBe(httpStatus.CREATED);
    expect(conflictResponse.status).toBe(httpStatus.CONFLICT);
    expect(conflictResponse.body.error.code).toBe('SLOT_NOT_AVAILABLE');
  });
});

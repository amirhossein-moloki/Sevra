import request from 'supertest';
import cuid from 'cuid';
import app from '../../app';
import { prisma } from '../../config/prisma';
import { UserRole } from '@prisma/client';
import { createTestSalon, createTestUser, createTestService, createTestBooking, signToken } from '../../common/utils/test-utils';

describe('Payments Idempotency E2E', () => {
  let salonId: string;
  let bookingId: string;
  let token: string;
  let userId: string;

  beforeEach(async () => {
    // Clean up the database before each test
    await prisma.payment.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.service.deleteMany();
    await prisma.user.deleteMany();
    await prisma.salon.deleteMany();
    await prisma.idempotencyKey.deleteMany();

    const salon = await createTestSalon();
    salonId = salon.id;

    const user = await createTestUser({ salonId, role: UserRole.MANAGER });
    userId = user.id;
    token = signToken({ userId: user.id, salonId: salon.id, role: user.role });

    const service = await createTestService({ salonId });
    const booking = await createTestBooking({ salonId, serviceId: service.id, staffId: userId });
    bookingId = booking.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/v1/salons/:salonId/bookings/:bookingId/payments/init', () => {
    it('should return the same response when replaying a successful request with the same idempotency key', async () => {
      const idempotencyKey = cuid();
      const endpoint = `/api/v1/salons/${salonId}/bookings/${bookingId}/payments/init`;

      // First request
      const res1 = await request(app)
        .post(endpoint)
        .set('Authorization', `Bearer ${token}`)
        .set('Idempotency-Key', idempotencyKey)
        .send()
        .expect(201);

      const paymentId1 = res1.body.data.paymentId;
      expect(paymentId1).toBeDefined();

      // Second request (replay)
      const res2 = await request(app)
        .post(endpoint)
        .set('Authorization', `Bearer ${token}`)
        .set('Idempotency-Key', idempotencyKey)
        .send()
        .expect(201);

      const paymentId2 = res2.body.data.paymentId;
      expect(paymentId2).toBe(paymentId1);

      // Verify that only one payment was created in the database
      const paymentCount = await prisma.payment.count({
        where: { idempotencyKey },
      });
      expect(paymentCount).toBe(1);
    });

    it('should return 409 Conflict when reusing an idempotency key with a different payload', async () => {
      const idempotencyKey = cuid();
      const endpoint = `/api/v1/salons/${salonId}/bookings/${bookingId}/payments/init`;

      // First request with a specific payload
      await request(app)
        .post(endpoint)
        .set('Authorization', `Bearer ${token}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({ amount: 1000 }) // Add a body to be hashed
        .expect(201);

      // Second request with the same key but a different payload
      const res = await request(app)
        .post(endpoint)
        .set('Authorization', `Bearer ${token}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({ amount: 2000 }) // Different body
        .expect(409);

      expect(res.body.errors[0].code).toBe('IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD');
    });

    it('should handle concurrent requests with the same idempotency key, succeeding once and failing others', async () => {
      const idempotencyKey = cuid();
      const endpoint = `/api/v1/salons/${salonId}/bookings/${bookingId}/payments/init`;

      const req = () =>
        request(app)
          .post(endpoint)
          .set('Authorization', `Bearer ${token}`)
          .set('Idempotency-Key', idempotencyKey)
          .send();

      // Send two requests concurrently
      const [res1, res2] = await Promise.all([req(), req()]);

      const successResponse = res1.status === 201 ? res1 : res2;
      const conflictResponse = res1.status === 409 ? res1 : res2;

      expect(successResponse.status).toBe(201);
      expect(conflictResponse.status).toBe(409);
      expect(conflictResponse.body.errors[0].code).toBe('IDEMPOTENCY_REQUEST_IN_PROGRESS');

      // Verify that only one payment was actually created
      const paymentCount = await prisma.payment.count({
        where: { idempotencyKey },
      });
      expect(paymentCount).toBe(1);
    });
  });
});

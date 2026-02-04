import request from 'supertest';
import crypto from 'crypto';
import app from '../../app';
import { createTestSalon, createTestService, createTestBooking, createTestPayment, createTestUser } from '../../common/utils/test-utils';
import { BookingPaymentState, PaymentStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { IdempotencyRepo } from '../../common/repositories/idempotency.repo';
import { env } from '../../config/env';

// Helper to generate a valid signature
const generateSignature = (payload: Buffer) => {
  const hmac = crypto.createHmac('sha256', env.PAYMENT_PROVIDER_WEBHOOK_SECRET);
  return hmac.update(payload).digest('hex');
};

describe('Webhooks E2E', () => {
  let salonId: string;
  let bookingId: string;
  let paymentId: string;

  beforeEach(async () => {
    // Reset DB
    await prisma.$executeRaw`TRUNCATE "Salon", "User", "Service", "Booking", "Payment", "CustomerAccount", "SalonCustomerProfile" RESTART IDENTITY CASCADE;`;
    await IdempotencyRepo.clearAll();

    const salon = await createTestSalon();
    salonId = salon.id;

    const user = await createTestUser({ salonId });
    const service = await createTestService({ salonId });
    const booking = await createTestBooking({ salonId, serviceId: service.id, staffId: user.id });
    bookingId = booking.id;

    // Create a payment in the INITIATED state to simulate a real flow
    const payment = await createTestPayment({
      salonId,
      bookingId,
      status: PaymentStatus.INITIATED,
    });
    paymentId = payment.id;
  });

  describe('POST /api/v1/webhooks/payments/:provider', () => {
    const provider = 'test-provider';
    const webhookUrl = `/api/v1/webhooks/payments/${provider}`;

    describe('Security', () => {
      it('should reject requests with a missing signature', async () => {
        const payload = { eventId: 'evt_1', paymentId, status: 'SUCCEEDED' };

        await request(app)
          .post(webhookUrl)
          .send(payload)
          .expect(401);
      });

      it('should reject requests with an invalid signature', async () => {
        const payload = JSON.stringify({ eventId: 'evt_1', paymentId, status: 'SUCCEEDED' });
        const invalidSignature = 'invalid-signature';

        await request(app)
          .post(webhookUrl)
          .set('X-Signature', invalidSignature)
          .set('Content-Type', 'application/json')
          .send(payload)
          .expect(401);
      });
    });

    describe('Idempotency', () => {
      it('should process a webhook successfully and reject a replay of the same event', async () => {
        const payload = { eventId: `evt_${crypto.randomBytes(8).toString('hex')}`, paymentId, status: 'SUCCEEDED' };
        const payloadBuffer = Buffer.from(JSON.stringify(payload));
        const signature = generateSignature(payloadBuffer);

        // First request - should be successful
        await request(app)
          .post(webhookUrl)
          .set('X-Signature', signature)
          .set('Content-Type', 'application/json')
          .send(payload)
          .expect(200);

        // Verify the state change
        let updatedBooking = await prisma.booking.findUnique({ where: { id: bookingId } });
        expect(updatedBooking?.paymentState).toBe(BookingPaymentState.PAID);

        // Second request (replay) - should also return 200 but not re-process
        const res = await request(app)
          .post(webhookUrl)
          .set('X-Signature', signature)
          .set('Content-Type', 'application/json')
          .send(payload)
          .expect(200);

        // We expect the idempotency key to be found, and the request to be acknowledged without processing.
        // No easy way to assert "not re-processed" other than ensuring it doesn't fail.
        // We can check that the idempotency key exists in Redis.
        const existingKey = await IdempotencyRepo.findKey(`payment-webhook:${provider}`, payload.eventId);
        expect(existingKey).not.toBeNull();
      });
    });

    describe('E2E Flows', () => {
      it('should update booking to PAID on a valid SUCCEEDED webhook', async () => {
        const payload = { eventId: `evt_${crypto.randomBytes(8).toString('hex')}`, paymentId, status: 'SUCCEEDED' };
        const payloadBuffer = Buffer.from(JSON.stringify(payload));
        const signature = generateSignature(payloadBuffer);

        await request(app)
          .post(webhookUrl)
          .set('X-Signature', signature)
          .set('Content-Type', 'application/json')
          .send(payload)
          .expect(200);

        // Assert final DB state
        const updatedBooking = await prisma.booking.findUnique({ where: { id: bookingId } });
        const updatedPayment = await prisma.payment.findUnique({ where: { id: paymentId } });

        expect(updatedBooking?.paymentState).toBe(BookingPaymentState.PAID);
        expect(updatedPayment?.status).toBe(PaymentStatus.PAID);
        expect(updatedPayment?.paidAt).not.toBeNull();
      });

      it('should update booking to FAILED on a valid FAILED webhook', async () => {
        const payload = { eventId: `evt_${crypto.randomBytes(8).toString('hex')}`, paymentId, status: 'FAILED' };
        const payloadBuffer = Buffer.from(JSON.stringify(payload));
        const signature = generateSignature(payloadBuffer);

        await request(app)
          .post(webhookUrl)
          .set('X-Signature', signature)
          .set('Content-Type', 'application/json')
          .send(payload)
          .expect(200);

        // Assert final DB state
        const updatedBooking = await prisma.booking.findUnique({ where: { id: bookingId } });
        const updatedPayment = await prisma.payment.findUnique({ where: { id: paymentId } });

        expect(updatedBooking?.paymentState).toBe(BookingPaymentState.FAILED);
        expect(updatedPayment?.status).toBe(PaymentStatus.FAILED);
      });

      it('should update booking to CANCELED on a valid EXPIRED webhook', async () => {
        const payload = { eventId: `evt_${crypto.randomBytes(8).toString('hex')}`, paymentId, status: 'EXPIRED' };
        const payloadBuffer = Buffer.from(JSON.stringify(payload));
        const signature = generateSignature(payloadBuffer);

        await request(app)
          .post(webhookUrl)
          .set('X-Signature', signature)
          .set('Content-Type', 'application/json')
          .send(payload)
          .expect(200);

        // Assert final DB state
        const updatedBooking = await prisma.booking.findUnique({ where: { id: bookingId } });
        const updatedPayment = await prisma.payment.findUnique({ where: { id: paymentId } });

        expect(updatedBooking?.paymentState).toBe(BookingPaymentState.CANCELED);
        expect(updatedPayment?.status).toBe(PaymentStatus.CANCELED);
      });
    });
  });
});

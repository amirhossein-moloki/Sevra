import request from 'supertest';
import app from '../../app';
import { createTestSalon, createTestService, createTestBooking, createTestPayment, createTestUser } from '../../common/utils/test-utils';
import { BookingPaymentState, PaymentStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';

describe('Webhooks E2E', () => {
  let salonId: string;
  let bookingId: string;
  let paymentId: string;

  beforeEach(async () => {
    // Reset DB
    await prisma.$executeRaw`TRUNCATE "Salon", "User", "Service", "Booking", "Payment", "CustomerAccount", "SalonCustomerProfile" RESTART IDENTITY CASCADE;`;
    const salon = await createTestSalon();
    const user = await createTestUser({ salonId: salon.id });
    salonId = salon.id;
    const service = await createTestService({ salonId });
    const booking = await createTestBooking({ salonId, serviceId: service.id, staffId: user.id });
    bookingId = booking.id;
    const payment = await createTestPayment({ salonId, bookingId });
    paymentId = payment.id;
  });

  describe('POST /api/v1/webhooks/payments/:provider', () => {
    it('should update booking to PAID on a SUCCEEDED webhook', async () => {
      await request(app)
        .post('/api/v1/webhooks/payments/zarinpal')
        .set('X-Signature', 'mock-signature')
        .send({ paymentId, status: 'SUCCEEDED' })
        .expect(200);

      const updatedBooking = await prisma.booking.findUnique({ where: { id: bookingId } });
      expect(updatedBooking?.paymentState).toBe(BookingPaymentState.PAID);
    });

    it('should update booking to UNPAID on a FAILED webhook', async () => {
      await request(app)
        .post('/api/v1/webhooks/payments/zarinpal')
        .set('X-Signature', 'mock-signature')
        .send({ paymentId, status: 'FAILED' })
        .expect(200);

      const updatedBooking = await prisma.booking.findUnique({ where: { id: bookingId } });
      expect(updatedBooking?.paymentState).toBe(BookingPaymentState.UNPAID);
    });
  });
});
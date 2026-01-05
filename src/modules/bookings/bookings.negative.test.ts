
import request from 'supertest';
import app from '../../app';
import { prisma } from '../../config/prisma';
import { User, Salon, Service, Booking, Payment } from '@prisma/client';
import { createTestSalon, createTestUser, createTestService, createTestCustomer, createTestBooking, createToken } from '../../../test-utils/helpers';
import { BookingStatus, PaymentState } from '@prisma/client';
import crypto from 'crypto';
import { env } from '../../config/env';

describe('Bookings Negative Paths E2E', () => {
  let salon: Salon;
  let manager: User;
  let staff: User;
  let service: Service;
  let managerToken: string;
  let booking: Booking;
  let payment: Payment;

  beforeEach(async () => {
    salon = await createTestSalon();
    manager = await createTestUser(salon.id, 'MANAGER');
    staff = await createTestUser(salon.id, 'STAFF');
    service = await createTestService(salon.id, [staff.id]);
    const customer = await createTestCustomer(salon.id);
    managerToken = createToken(manager);

    // Create a confirmed booking to be used in tests
    booking = await createTestBooking(salon.id, staff.id, service.id, customer.customerProfile.id, customer.account.id, manager.id, {
      status: BookingStatus.CONFIRMED,
      paymentState: PaymentState.PENDING,
    });

    payment = await prisma.payment.create({
        data: {
            salonId: salon.id,
            bookingId: booking.id,
            amount: service.price,
            currency: service.currency,
            state: PaymentState.PENDING,
            provider: 'TEST_PROVIDER',
        }
    });
  });

  afterEach(async () => {
    await prisma.payment.deleteMany({});
    await prisma.booking.deleteMany({});
    await prisma.userService.deleteMany({});
    await prisma.service.deleteMany({});
    await prisma.shift.deleteMany({});
    await prisma.salonCustomerProfile.deleteMany({});
    await prisma.customerAccount.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.salon.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/v1/salons/:salonId/bookings/:bookingId/cancel', () => {
    it('should return 409 Conflict when trying to cancel an already-cancelled booking', async () => {
      // First, cancel the booking
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.CANCELLED },
      });

      // Then, try to cancel it again
      const response = await request(app)
        .post(`/api/v1/salons/${salon.id}/bookings/${booking.id}/cancel`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ cancellationReason: 'Trying again' });

      expect(response.status).toBe(409);
    });
  });

  describe('POST /api/v1/salons/:salonId/bookings/:bookingId/payments/init', () => {
    it('should return 409 Conflict when trying to initiate payment for a cancelled booking', async () => {
      // First, cancel the booking
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.CANCELED },
      });

      // Then, try to initiate payment
      const response = await request(app)
        .post(`/api/v1/salons/${salon.id}/bookings/${booking.id}/payments/init`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({});

      expect(response.status).toBe(409);
    });
  });

  describe('POST /webhooks/payments/:provider', () => {
    it('should update booking paymentState to FAILED on a failed payment webhook', async () => {
      const provider = 'test_provider';
      const payload = {
        paymentId: payment.id,
        status: 'FAILED',
      };
      const rawPayload = JSON.stringify(payload);

      const signature = crypto
        .createHmac('sha256', env.PAYMENT_PROVIDER_WEBHOOK_SECRET)
        .update(rawPayload)
        .digest('hex');

      const response = await request(app)
        .post(`/webhooks/payments/${provider}`)
        .set('x-webhook-signature', signature)
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);

      const dbBooking = await prisma.booking.findUnique({
        where: { id: booking.id },
      });
      expect(dbBooking?.paymentState).toBe(PaymentState.FAILED);
    });
  });

  describe('Refund Path', () => {
    test.skip('TODO: Refund endpoint does not exist. This test should be implemented once a refund API is available.', () => {
      // Placeholder for refund test
      expect(true).toBe(true);
    });

    it('should return 404 for a hypothetical refund endpoint', async () => {
        const response = await request(app)
          .post(`/api/v1/salons/${salon.id}/bookings/${booking.id}/refund`)
          .set('Authorization', `Bearer ${managerToken}`)
          .send({});

        expect(response.status).toBe(404);
      });
  });
});

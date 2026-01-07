import request from 'supertest';
import cuid from 'cuid';
import app from '../../app';
import { createTestSalon, createTestService, createTestBooking, createTestUser, generateToken } from '../../common/utils/test-utils';
import { BookingPaymentState, UserRole } from '@prisma/client';
import { prisma } from '../../config/prisma';

describe('Payments E2E', () => {
  let salonId: string;
  let bookingId: string;
  let token: string;

  beforeEach(async () => {
    // Reset DB
    await prisma.$executeRaw`TRUNCATE "Salon", "User", "Service", "Booking", "Payment", "CustomerAccount", "SalonCustomerProfile" RESTART IDENTITY CASCADE;`;
    const salon = await createTestSalon();
    const user = await createTestUser({ salonId: salon.id, role: UserRole.MANAGER });
    salonId = salon.id;
    const service = await createTestService({ salonId });
    const booking = await createTestBooking({ salonId, serviceId: service.id, staffId: user.id });
    bookingId = booking.id;
    token = generateToken({ userId: user.id, salonId: salon.id, role: user.role });
  });

  describe('POST /api/v1/salons/:salonId/bookings/:bookingId/payments/init', () => {
    it('should initiate a payment for a valid booking', async () => {
      const res = await request(app)
        .post(`/api/v1/salons/${salonId}/bookings/${bookingId}/payments/init`)
        .set('Authorization', `Bearer ${token}`)
        .set('Idempotency-Key', cuid())
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('paymentId');
      expect(res.body.data).toHaveProperty('checkoutUrl');
    });

    it('should return 409 if the booking is already paid', async () => {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { paymentState: BookingPaymentState.PAID },
      });

      await request(app)
        .post(`/api/v1/salons/${salonId}/bookings/${bookingId}/payments/init`)
        .set('Authorization', `Bearer ${token}`)
        .set('Idempotency-Key', cuid())
        .expect(409);
    });

    it('should return 404 if a user from another salon tries to initiate a payment', async () => {
      // Create a second salon and a booking within it
      const salonB = await createTestSalon({ name: 'Salon B', slug: 'salon-b' });
      const userB = await createTestUser({ salonId: salonB.id, phone: '9876543210' });
      const serviceB = await createTestService({ salonId: salonB.id });
      const bookingB = await createTestBooking({ salonId: salonB.id, serviceId: serviceB.id, staffId: userB.id });

      // The token belongs to a user from the first salon (salonId)
      await request(app)
        .post(`/api/v1/salons/${salonB.id}/bookings/${bookingB.id}/payments/init`)
        .set('Authorization', `Bearer ${token}`)
        .set('Idempotency-Key', cuid())
        .expect(404);
    });

    it('should allow a user with the STAFF role to initiate a payment', async () => {
      // Create a user with the STAFF role
      const staffUser = await createTestUser({
        salonId,
        role: UserRole.STAFF,
        phone: '1112223333', // a different phone number
      });
      const staffToken = generateToken({ userId: staffUser.id, salonId, role: staffUser.role });

      const res = await request(app)
        .post(`/api/v1/salons/${salonId}/bookings/${bookingId}/payments/init`)
        .set('Authorization', `Bearer ${staffToken}`)
        .set('Idempotency-Key', cuid())
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('paymentId');
      expect(res.body.data).toHaveProperty('checkoutUrl');
    });
  });
});

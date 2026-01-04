import request from 'supertest';
import app from '../../app';
import { createTestSalon, createTestService, createTestBooking, createTestUser } from '../../common/utils/test-utils';
import { signToken } from '../auth/auth.utils';
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
    token = signToken({ userId: user.id, salonId: salon.id, role: user.role });
  });

  describe('POST /api/v1/salons/:salonId/bookings/:bookingId/payments/init', () => {
    it('should initiate a payment for a valid booking', async () => {
      const res = await request(app)
        .post(`/api/v1/salons/${salonId}/bookings/${bookingId}/payments/init`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

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
        .expect(409);
    });
  });
});
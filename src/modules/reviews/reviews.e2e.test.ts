import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../app';
import { prisma } from '../../config/prisma';
import { Salon, User, UserRole, BookingStatus, ReviewTarget, ReviewStatus } from '@prisma/client';
import { createTestUser, createTestSalon, generateToken } from '../../common/utils/test-utils';

describe('Review Routes', () => {
  let salon: Salon;
  let manager: User;
  let managerToken: string;
  let customerAccount: any;
  let profile: any;
  let booking: any;

  beforeAll(async () => {
    await prisma.$connect();
    salon = await createTestSalon();
    manager = await createTestUser({ salonId: salon.id, role: UserRole.MANAGER });
    managerToken = generateToken({ actorId: manager.id, actorType: 'USER' });

    customerAccount = await prisma.customerAccount.create({
      data: { phone: '09129998877', fullName: 'John Doe' }
    });

    profile = await prisma.salonCustomerProfile.create({
      data: {
        salonId: salon.id,
        customerAccountId: customerAccount.id,
        displayName: 'John'
      }
    });

    booking = await prisma.booking.create({
      data: {
        salonId: salon.id,
        customerProfileId: profile.id,
        customerAccountId: customerAccount.id,
        serviceId: (await prisma.service.create({
            data: {
                salonId: salon.id,
                name: 'Test Service',
                durationMinutes: 30,
                price: 1000,
                currency: 'IRR'
            }
        })).id,
        staffId: manager.id,
        createdByUserId: manager.id,
        startAt: new Date(),
        endAt: new Date(Date.now() + 30 * 60000),
        serviceNameSnapshot: 'Test Service',
        serviceDurationSnapshot: 30,
        servicePriceSnapshot: 1000,
        currencySnapshot: 'IRR',
        amountDueSnapshot: 1000,
        status: BookingStatus.DONE,
      }
    });
  });

  afterAll(async () => {
    await prisma.review.deleteMany({});
    await prisma.booking.deleteMany({});
    await prisma.salonCustomerProfile.deleteMany({});
    await prisma.customerAccount.deleteMany({});
    await prisma.service.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.salon.deleteMany({});
    await prisma.$disconnect();
  });

  describe('POST /public/salons/:salonSlug/bookings/:bookingId/reviews', () => {
    it('should submit a review and return 201', async () => {
      const reviewPayload = {
        bookingId: booking.id,
        target: ReviewTarget.SALON,
        rating: 5,
        comment: 'Great service!',
      };

      const res = await request(app)
        .post(`/api/v1/public/salons/${salon.slug}/bookings/${booking.id}/reviews`)
        .send(reviewPayload);

      expect(res.status).toBe(httpStatus.CREATED);
      expect(res.body.success).toBe(true);
      expect(res.body.data.comment).toBe(reviewPayload.comment);
    });

    it('should return 400 if booking is not DONE', async () => {
        const pendingBooking = await prisma.booking.create({
            data: { ...booking, id: undefined, status: BookingStatus.PENDING } as any
        });

        const res = await request(app)
            .post(`/api/v1/public/salons/${salon.slug}/bookings/${pendingBooking.id}/reviews`)
            .send({ bookingId: pendingBooking.id, target: ReviewTarget.SALON, rating: 5 });

        expect(res.status).toBe(httpStatus.BAD_REQUEST);
    });
  });

  describe('GET /public/salons/:salonSlug/reviews', () => {
    it('should list published reviews', async () => {
      const res = await request(app)
        .get(`/api/v1/public/salons/${salon.slug}/reviews`);

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('PATCH /salons/:salonId/reviews/:id/status', () => {
    it('should hide a review', async () => {
      const review = await prisma.review.findFirst({ where: { salonId: salon.id } });

      const res = await request(app)
        .patch(`/api/v1/salons/${salon.id}/reviews/${review?.id}/status`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ status: ReviewStatus.HIDDEN });

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.data.status).toBe(ReviewStatus.HIDDEN);

      // Verify it's no longer in public list
      const publicRes = await request(app)
        .get(`/api/v1/public/salons/${salon.slug}/reviews`);
      const hiddenReview = publicRes.body.data.find((r: any) => r.id === review?.id);
      expect(hiddenReview).toBeUndefined();
    });
  });
});

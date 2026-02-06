import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../app';
import { prisma } from '../../config/prisma';
import { BookingStatus, ReviewTarget, Salon, Service, User } from '@prisma/client';
import {
  createTestSalon,
  createTestService,
  createTestUser,
  generateToken,
} from '../../common/utils/test-utils';

describe('Customer Panel E2E Tests', () => {
  let salon: Salon;
  let service: Service;
  let staff: User;
  let customerAccount: any;
  let customerToken: string;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Cleanup
    await prisma.review.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.salonCustomerProfile.deleteMany();
    await prisma.customerAccount.deleteMany();
    await prisma.userService.deleteMany();
    await prisma.service.deleteMany();
    await prisma.user.deleteMany();
    await prisma.salon.deleteMany();

    // Setup
    salon = await createTestSalon();
    service = await createTestService({ salonId: salon.id });
    staff = await createTestUser({ salonId: salon.id });

    customerAccount = await prisma.customerAccount.create({
      data: {
        phone: '09121112233',
        fullName: 'John Doe',
      },
    });

    customerToken = generateToken({
      actorId: customerAccount.id,
      actorType: 'CUSTOMER',
    });
  });

  describe('GET /api/v1/customer/me', () => {
    it('should return the customer profile', async () => {
      const res = await request(app)
        .get('/api/v1/customer/me')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.phone).toBe('09121112233');
      expect(res.body.data.fullName).toBe('John Doe');
    });

    it('should return 403 if actor is not a customer', async () => {
      const staffToken = generateToken({
        actorId: staff.id,
        actorType: 'USER',
      });

      const res = await request(app)
        .get('/api/v1/customer/me')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(httpStatus.FORBIDDEN);
    });
  });

  describe('GET /api/v1/customer/bookings', () => {
    it('should return an empty list when there are no bookings', async () => {
      const res = await request(app)
        .get('/api/v1/customer/bookings')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.data).toHaveLength(0);
      expect(res.body.meta.totalItems).toBe(0);
    });

    it('should return customer bookings', async () => {
      // Create a profile and a booking for this customer
      const profile = await prisma.salonCustomerProfile.create({
        data: {
          salonId: salon.id,
          customerAccountId: customerAccount.id,
          displayName: 'John',
        },
      });

      await prisma.booking.create({
        data: {
          salonId: salon.id,
          customerAccountId: customerAccount.id,
          customerProfileId: profile.id,
          serviceId: service.id,
          staffId: staff.id,
          startAt: new Date(),
          endAt: new Date(Date.now() + 3600000),
          serviceNameSnapshot: service.name,
          serviceDurationSnapshot: service.durationMinutes,
          servicePriceSnapshot: service.price,
          currencySnapshot: service.currency,
          amountDueSnapshot: service.price,
          createdByUserId: staff.id,
          status: BookingStatus.CONFIRMED,
        },
      });

      const res = await request(app)
        .get('/api/v1/customer/bookings')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].salon.name).toBe(salon.name);
    });
  });

  describe('POST /api/v1/customer/bookings/:bookingId/cancel', () => {
    it('should cancel a pending/confirmed booking', async () => {
      const profile = await prisma.salonCustomerProfile.create({
        data: {
          salonId: salon.id,
          customerAccountId: customerAccount.id,
        },
      });

      const booking = await prisma.booking.create({
        data: {
          salonId: salon.id,
          customerAccountId: customerAccount.id,
          customerProfileId: profile.id,
          serviceId: service.id,
          staffId: staff.id,
          startAt: new Date(),
          endAt: new Date(Date.now() + 3600000),
          serviceNameSnapshot: service.name,
          serviceDurationSnapshot: service.durationMinutes,
          servicePriceSnapshot: service.price,
          currencySnapshot: service.currency,
          amountDueSnapshot: service.price,
          createdByUserId: staff.id,
          status: BookingStatus.CONFIRMED,
        },
      });

      const res = await request(app)
        .post(`/api/v1/customer/bookings/${booking.id}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ reason: 'Changed my mind' });

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.data.status).toBe(BookingStatus.CANCELED);
      expect(res.body.data.cancelReason).toBe('Changed my mind');
    });

    it('should not cancel other people\'s bookings', async () => {
        const otherCustomer = await prisma.customerAccount.create({
            data: { phone: '09129999999' }
        });
        const profile = await prisma.salonCustomerProfile.create({
            data: {
              salonId: salon.id,
              customerAccountId: otherCustomer.id,
            },
        });

        const booking = await prisma.booking.create({
          data: {
            salonId: salon.id,
            customerAccountId: otherCustomer.id,
            customerProfileId: profile.id,
            serviceId: service.id,
            staffId: staff.id,
            startAt: new Date(),
            endAt: new Date(Date.now() + 3600000),
            serviceNameSnapshot: service.name,
            serviceDurationSnapshot: service.durationMinutes,
            servicePriceSnapshot: service.price,
            currencySnapshot: service.currency,
            amountDueSnapshot: service.price,
            createdByUserId: staff.id,
            status: BookingStatus.CONFIRMED,
          },
        });

        const res = await request(app)
          .post(`/api/v1/customer/bookings/${booking.id}/cancel`)
          .set('Authorization', `Bearer ${customerToken}`)
          .send({ reason: 'Malicious attempt' });

        expect(res.status).toBe(httpStatus.NOT_FOUND);
      });
  });

  describe('POST /api/v1/customer/bookings/:bookingId/reviews', () => {
    it('should submit a review for a completed booking', async () => {
      const profile = await prisma.salonCustomerProfile.create({
        data: {
          salonId: salon.id,
          customerAccountId: customerAccount.id,
        },
      });

      const booking = await prisma.booking.create({
        data: {
          salonId: salon.id,
          customerAccountId: customerAccount.id,
          customerProfileId: profile.id,
          serviceId: service.id,
          staffId: staff.id,
          startAt: new Date(),
          endAt: new Date(Date.now() + 3600000),
          serviceNameSnapshot: service.name,
          serviceDurationSnapshot: service.durationMinutes,
          servicePriceSnapshot: service.price,
          currencySnapshot: service.currency,
          amountDueSnapshot: service.price,
          createdByUserId: staff.id,
          status: BookingStatus.DONE,
        },
      });

      const res = await request(app)
        .post(`/api/v1/customer/bookings/${booking.id}/reviews`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          target: ReviewTarget.SALON,
          rating: 5,
          comment: 'Great service!',
        });

      expect(res.status).toBe(httpStatus.CREATED);
      expect(res.body.data.rating).toBe(5);
      expect(res.body.data.comment).toBe('Great service!');
    });

    it('should not allow reviewing a non-completed booking', async () => {
        const profile = await prisma.salonCustomerProfile.create({
            data: {
              salonId: salon.id,
              customerAccountId: customerAccount.id,
            },
          });

          const booking = await prisma.booking.create({
            data: {
              salonId: salon.id,
              customerAccountId: customerAccount.id,
              customerProfileId: profile.id,
              serviceId: service.id,
              staffId: staff.id,
              startAt: new Date(),
              endAt: new Date(Date.now() + 3600000),
              serviceNameSnapshot: service.name,
              serviceDurationSnapshot: service.durationMinutes,
              servicePriceSnapshot: service.price,
              currencySnapshot: service.currency,
              amountDueSnapshot: service.price,
              createdByUserId: staff.id,
              status: BookingStatus.CONFIRMED,
            },
          });

          const res = await request(app)
            .post(`/api/v1/customer/bookings/${booking.id}/reviews`)
            .set('Authorization', `Bearer ${customerToken}`)
            .send({
              target: ReviewTarget.SALON,
              rating: 5,
              comment: 'Great service!',
            });

          expect(res.status).toBe(httpStatus.BAD_REQUEST);
          expect(res.body.message).toContain('Only completed bookings can be reviewed');
    });
  });
});

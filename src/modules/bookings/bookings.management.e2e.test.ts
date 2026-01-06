
import request from 'supertest';
import httpStatus from 'http-status';
import { faker } from '@faker-js/faker';
import app from '../../app';
import { prisma } from '../../config/prisma';
import { createTestSalon, createTestUser, createTestCustomer, createTestService } from '../../../../test-utils/helpers';
import { BookingStatus, UserRole } from '@prisma/client';

describe('Booking Management E2E', () => {
  let salon;
  let manager;
  let staff;
  let customer;
  let service;
  let managerToken;
  let staffToken;

  beforeAll(async () => {
    salon = await createTestSalon();
    manager = await createTestUser(salon.id, UserRole.MANAGER);
    staff = await createTestUser(salon.id, UserRole.STAFF);
    customer = await createTestCustomer(salon.id);
    service = await createTestService(salon.id);

    const managerLoginRes = await request(app).post('/api/v1/auth/login').send({ phone: manager.phone, password: 'password123' });
    managerToken = managerLoginRes.body.data.accessToken;

    const staffLoginRes = await request(app).post('/api/v1/auth/login').send({ phone: staff.phone, password: 'password123' });
    staffToken = staffLoginRes.body.data.accessToken;
  });

  const createBooking = async (status: BookingStatus) => {
    return prisma.booking.create({
      data: {
        salonId: salon.id,
        serviceId: service.id,
        staffId: staff.id,
        customerProfileId: customer.id,
        customerAccountId: customer.customerAccountId,
        createdByUserId: manager.id,
        startAt: faker.date.future(),
        endAt: faker.date.future(),
        status,
        serviceNameSnapshot: service.name,
        serviceDurationSnapshot: service.durationMinutes,
        servicePriceSnapshot: service.price,
        currencySnapshot: service.currency,
        amountDueSnapshot: service.price,
      },
    });
  };

  describe('POST /api/v1/salons/:salonId/bookings/:bookingId/confirm', () => {
    it('should confirm a PENDING booking', async () => {
      const booking = await createBooking(BookingStatus.PENDING);
      const res = await request(app)
        .post(`/api/v1/salons/${salon.id}/bookings/${booking.id}/confirm`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.statusCode).toEqual(httpStatus.OK);
      expect(res.body.data.status).toEqual(BookingStatus.CONFIRMED);
    });

    it('should return 409 for an already CONFIRMED booking', async () => {
      const booking = await createBooking(BookingStatus.CONFIRMED);
      const res = await request(app)
        .post(`/api/v1/salons/${salon.id}/bookings/${booking.id}/confirm`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.statusCode).toEqual(httpStatus.CONFLICT);
    });

    it('should return 403 for STAFF role', async () => {
      const booking = await createBooking(BookingStatus.PENDING);
      const res = await request(app)
        .post(`/api/v1/salons/${salon.id}/bookings/${booking.id}/confirm`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.statusCode).toEqual(httpStatus.FORBIDDEN);
    });
  });

  describe('POST /api/v1/salons/:salonId/bookings/:bookingId/cancel', () => {
    it('should cancel a CONFIRMED booking', async () => {
      const booking = await createBooking(BookingStatus.CONFIRMED);
      const reason = 'Customer request';
      const res = await request(app)
        .post(`/api/v1/salons/${salon.id}/bookings/${booking.id}/cancel`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ reason });

      expect(res.statusCode).toEqual(httpStatus.OK);
      expect(res.body.data.status).toEqual(BookingStatus.CANCELED);
      expect(res.body.data.cancelReason).toEqual(reason);
      expect(res.body.data.canceledByUserId).toEqual(manager.id);
      expect(res.body.data.canceledAt).toBeDefined();
    });

    it('should return 409 for a DONE booking', async () => {
      const booking = await createBooking(BookingStatus.DONE);
      const res = await request(app)
        .post(`/api/v1/salons/${salon.id}/bookings/${booking.id}/cancel`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ reason: 'test' });

      expect(res.statusCode).toEqual(httpStatus.CONFLICT);
    });
  });

  describe('POST /api/v1/salons/:salonId/bookings/:bookingId/complete', () => {
    it('should complete a CONFIRMED booking', async () => {
        const booking = await createBooking(BookingStatus.CONFIRMED);
        const res = await request(app)
            .post(`/api/v1/salons/${salon.id}/bookings/${booking.id}/complete`)
            .set('Authorization', `Bearer ${managerToken}`);

        expect(res.statusCode).toEqual(httpStatus.OK);
        expect(res.body.data.status).toEqual(BookingStatus.DONE);
        expect(res.body.data.completedAt).toBeDefined();
    });

    it('should return 409 for a PENDING booking', async () => {
        const booking = await createBooking(BookingStatus.PENDING);
        const res = await request(app)
            .post(`/api/v1/salons/${salon.id}/bookings/${booking.id}/complete`)
            .set('Authorization', `Bearer ${managerToken}`);

        expect(res.statusCode).toEqual(httpStatus.CONFLICT);
    });
  });

  describe('POST /api/v1/salons/:salonId/bookings/:bookingId/no-show', () => {
    it('should mark a CONFIRMED booking as NO_SHOW', async () => {
        const booking = await createBooking(BookingStatus.CONFIRMED);
        const res = await request(app)
            .post(`/api/v1/salons/${salon.id}/bookings/${booking.id}/no-show`)
            .set('Authorization', `Bearer ${managerToken}`);

        expect(res.statusCode).toEqual(httpStatus.OK);
        expect(res.body.data.status).toEqual(BookingStatus.NO_SHOW);
        expect(res.body.data.noShowAt).toBeDefined();
    });

    it('should return 409 for a CANCELED booking', async () => {
        const booking = await createBooking(BookingStatus.CANCELED);
        const res = await request(app)
            .post(`/api/v1/salons/${salon.id}/bookings/${booking.id}/no-show`)
            .set('Authorization', `Bearer ${managerToken}`);

        expect(res.statusCode).toEqual(httpStatus.CONFLICT);
    });
  });
});

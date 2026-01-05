
import request from 'supertest';
import app from '../../app';
import { prisma } from '../../config/prisma';
import { User, Salon, Service, SalonCustomerProfile, CustomerAccount, Shift } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { add, set, getDay } from 'date-fns';

describe('Bookings API E2E Tests', () => {
  let salon: Salon;
  let manager: User;
  let staff: User;
  let service: Service;
  let customerAccount: CustomerAccount;
  let customerProfile: SalonCustomerProfile;
  let shift: Shift;
  let managerToken: string;

  beforeAll(async () => {
    // 1. Create Salon
    salon = await prisma.salon.create({
      data: {
        name: 'Test Salon for Bookings',
        slug: `test-salon-bookings-${Date.now()}`,
      },
    });

    // 2. Create Manager and Staff
    manager = await prisma.user.create({
      data: {
        fullName: 'Booking Manager',
        phone: `+989120000001${Date.now()}`.slice(0, 14),
        role: 'MANAGER',
        salonId: salon.id,
      },
    });
    staff = await prisma.user.create({
        data: {
          fullName: 'Booking Staff',
          phone: `+989120000002${Date.now()}`.slice(0, 14),
          role: 'STAFF',
          salonId: salon.id,
        },
      });

    // 3. Create Service and assign to Staff
    service = await prisma.service.create({
        data: {
            name: 'Booking Test Service',
            durationMinutes: 60,
            price: 50000,
            currency: 'IRR',
            salon: { connect: { id: salon.id } },
        }
    });
    await prisma.userService.create({
        data: {
            userId: staff.id,
            serviceId: service.id,
        }
    });

    // 4. Create Shift
    const today = new Date();
    const dayToBook = getDay(add(today, { days: 7 })); // A week from now

    shift = await prisma.shift.create({
        data: {
            user: { connect: { id: staff.id } },
            dayOfWeek: dayToBook,
            startTime: '09:00:00',
            endTime: '17:00:00',
            isActive: true,
            salon: { connect: { id: salon.id } },
        }
    });

     // 5. Create Customer Account and Profile
     customerAccount = await prisma.customerAccount.create({
        data: {
            fullName: 'Test Customer',
            phone: '+989121234567',
        }
    });
    customerProfile = await prisma.salonCustomerProfile.create({
        data: {
            salonId: salon.id,
            customerAccountId: customerAccount.id,
        }
    });

    // 6. Generate Token
    managerToken = jwt.sign(
      { actorId: manager.id, actorType: 'USER', salonId: salon.id, role: manager.role },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await prisma.booking.deleteMany({});
    await prisma.shift.deleteMany({});
    await prisma.userService.deleteMany({});
    await prisma.service.deleteMany({});
    await prisma.salonCustomerProfile.deleteMany({});
    await prisma.customerAccount.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.salon.deleteMany({});
    await prisma.$disconnect();
  });

  describe('POST /api/v1/salons/:salonId/bookings', () => {
    it('should create a new booking for a valid time slot', async () => {
      const nextWeek = add(new Date(), { days: 7 });
      const bookingStartTime = set(nextWeek, { hours: 10, minutes: 0, seconds: 0, milliseconds: 0 });
      if (getDay(bookingStartTime) !== shift.dayOfWeek) {
        bookingStartTime.setDate(bookingStartTime.getDate() + (shift.dayOfWeek - getDay(bookingStartTime)));
      }

      const response = await request(app)
        .post(`/api/v1/salons/${salon.id}/bookings`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          serviceId: service.id,
          staffId: staff.id,
          startAt: bookingStartTime.toISOString(),
          customer: {
            fullName: 'John Doe',
            phone: '1234567890',
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.staffId).toBe(staff.id);
      expect(response.body.data.createdByUserId).toBe(manager.id);
    });

    it('should fail with 409 Conflict if time slot is overlapping', async () => {
        const bookingTime = set(add(new Date(), { days: 14 }), { hours: 14, minutes: 0, seconds: 0, milliseconds: 0 });
        if (getDay(bookingTime) !== shift.dayOfWeek) {
            bookingTime.setDate(bookingTime.getDate() + (shift.dayOfWeek - getDay(bookingTime)));
        }

        await prisma.booking.create({
            data: {
                salonId: salon.id,
                serviceId: service.id,
                staffId: staff.id,
                customerAccountId: customerAccount.id,
                customerProfileId: customerProfile.id,
                createdByUserId: manager.id,
                startAt: bookingTime,
                endAt: add(bookingTime, { minutes: service.durationMinutes }),
                serviceNameSnapshot: service.name,
                serviceDurationSnapshot: service.durationMinutes,
                servicePriceSnapshot: service.price,
                currencySnapshot: service.currency,
                amountDueSnapshot: service.price,
            }
        });

        const overlappingTime = add(bookingTime, { minutes: 30 });
        const response = await request(app)
            .post(`/api/v1/salons/${salon.id}/bookings`)
            .set('Authorization', `Bearer ${managerToken}`)
            .send({
                serviceId: service.id,
                staffId: staff.id,
                startAt: overlappingTime.toISOString(),
                customer: { fullName: 'Jane Smith', phone: '0987654321' },
            });

        expect(response.status).toBe(409);
    });
  });

  describe('POST /api/v1/salons/:salonId/bookings/:bookingId/cancel', () => {
    it('should successfully cancel a confirmed booking', async () => {
      const booking = await prisma.booking.create({
        data: {
          salonId: salon.id,
          serviceId: service.id,
          staffId: staff.id,
          customerAccountId: customerAccount.id,
          customerProfileId: customerProfile.id,
          createdByUserId: manager.id,
          startAt: set(add(new Date(), { days: 21 }), { hours: 10, minutes: 0, seconds: 0, milliseconds: 0 }),
          endAt: set(add(new Date(), { days: 21 }), { hours: 11, minutes: 0, seconds: 0, milliseconds: 0 }),
          status: 'CONFIRMED',
          paymentState: 'PENDING',
          serviceNameSnapshot: service.name,
          serviceDurationSnapshot: service.durationMinutes,
          servicePriceSnapshot: service.price,
          currencySnapshot: service.currency,
          amountDueSnapshot: service.price,
        }
      });

      const response = await request(app)
        .post(`/api/v1/salons/${salon.id}/bookings/${booking.id}/cancel`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ cancellationReason: 'Customer request' });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('CANCELED');

      const dbBooking = await prisma.booking.findUnique({
        where: { id: booking.id },
      });
      expect(dbBooking?.status).toBe('CANCELED');
    });
  });
});

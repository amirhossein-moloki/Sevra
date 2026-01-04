import { Booking, Payment, Salon, Service, Shift, User, UserRole } from '@prisma/client';
import { prisma } from '../../config/prisma';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

export const createTestSalon = (options?: { name?: string; slug?: string; settings?: any }): Promise<Salon> => {
  const { name = 'Test Salon', slug = 'test-salon', settings } = options || {};
  return prisma.salon.create({ data: { name, slug, settings } });
};

export const createTestUser = (options: {
  salonId: string;
  role?: UserRole;
  phone?: string;
  passwordHash?: string;
  fullName?: string;
}): Promise<User> => {
  const {
    salonId,
    role = UserRole.STAFF,
    phone = `0912${Math.floor(1000000 + Math.random() * 9000000)}`,
    passwordHash = 'hashedpassword',
    fullName = `${role} User`,
  } = options;
  return prisma.user.create({ data: { salonId, role, fullName, phone, passwordHash } });
};

export const createTestService = (options: {
  salonId: string;
  name?: string;
  durationMinutes?: number;
  price?: number;
  currency?: string;
}): Promise<Service> => {
  const {
    salonId,
    name = 'Test Service',
    durationMinutes = 30,
    price = 50000,
    currency = 'IRR',
  } = options;
  return prisma.service.create({ data: { salonId, name, durationMinutes, price, currency } });
};

export const createTestShift = (options: {
  salonId: string;
  userId: string;
  dayOfWeek: number;
  startTime?: string;
  endTime?: string;
}): Promise<Shift> => {
  const { salonId, userId, dayOfWeek, startTime = '09:00:00', endTime = '17:00:00' } = options;
  return prisma.shift.create({ data: { salonId, userId, dayOfWeek, startTime, endTime } });
};

export const createTestBooking = async (options: {
  salonId: string;
  serviceId: string;
  staffId: string;
  startAt?: Date;
  endAt?: Date;
}): Promise<Booking> => {
  const {
    salonId,
    serviceId,
    staffId,
    startAt = new Date(),
    endAt = new Date(Date.now() + 30 * 60 * 1000),
  } = options;
  const phone = `0912${Math.floor(1000000 + Math.random() * 9000000)}`;
  const customerAccount = await prisma.customerAccount.upsert({
    where: { phone },
    update: {},
    create: { phone },
  });
  const customerProfile = await prisma.salonCustomerProfile.create({
    data: { salonId, customerAccountId: customerAccount.id },
  });

  return prisma.booking.create({
    data: {
      salonId,
      serviceId,
      staffId,
      customerAccountId: customerAccount.id,
      customerProfileId: customerProfile.id,
      startAt,
      endAt,
      serviceNameSnapshot: 'Test Service',
      serviceDurationSnapshot: 30,
      servicePriceSnapshot: 50000,
      currencySnapshot: 'IRR',
      amountDueSnapshot: 50000,
      createdByUserId: staffId,
    },
  });
};

export const createTestPayment = (options: {
  salonId: string;
  bookingId: string;
  amount?: number;
}): Promise<Payment> => {
  const { salonId, bookingId, amount = 50000 } = options;
  return prisma.payment.create({
    data: {
      salonId,
      bookingId,
      amount,
      currency: 'IRR',
    },
  });
};

export const generateToken = (payload: object): string => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });
};
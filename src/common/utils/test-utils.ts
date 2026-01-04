
import { Salon, Service, Shift, User, UserRole } from '@prisma/client';
import { prisma } from '../../config/prisma';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

// Overload for createTestSalon to allow for complex creations
export const createTestSalon = async (options?: {
  name?: string;
  slug?: string;
  settings?: any; // Allow passing settings create object
}): Promise<Salon> => {
  const { name = 'Test Salon', slug = 'test-salon', settings } = options || {};
  return prisma.salon.create({
    data: {
      name,
      slug,
      settings,
    },
  });
};

export const createTestUser = async (options: {
  salonId: string;
  role: UserRole;
  phone?: string;
  passwordHash?: string;
  fullName?: string;
}): Promise<User> => {
  const {
    salonId,
    role,
    phone = '09120000000',
    passwordHash = 'hashedpassword',
    fullName = `${role} User`,
  } = options;
  return prisma.user.create({
    data: {
      salonId,
      role,
      fullName,
      phone,
      passwordHash,
    },
  });
};

export const createTestService = async (options: {
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
  return prisma.service.create({
    data: {
      salonId,
      name,
      durationMinutes,
      price,
      currency,
    },
  });
};

export const createTestShift = async (options: {
  salonId: string;
  userId: string;
  dayOfWeek: number;
  startTime?: string;
  endTime?: string;
}): Promise<Shift> => {
  const {
    salonId,
    userId,
    dayOfWeek,
    startTime = '09:00:00',
    endTime = '17:00:00',
  } = options;
  return prisma.shift.create({
    data: {
      salonId,
      userId,
      dayOfWeek,
      startTime,
      endTime,
    },
  });
};


export const generateToken = (payload: object): string => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });
};

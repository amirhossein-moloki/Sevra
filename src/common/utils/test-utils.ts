import { Salon, User, UserRole } from '@prisma/client';
import { prisma } from '../../config/prisma';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

export const createTestSalon = async (
  name = 'Test Salon',
  slug = 'test-salon',
): Promise<Salon> => {
  return prisma.salon.create({
    data: {
      name,
      slug,
    },
  });
};

export const createTestUser = async (
  salonId: string,
  role: UserRole,
  phone = '09120000000',
  passwordHash = 'hashedpassword',
): Promise<User> => {
  return prisma.user.create({
    data: {
      salonId,
      role,
      fullName: `${role} User`,
      phone,
      passwordHash,
    },
  });
};

export const generateToken = (payload: object): string => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });
};

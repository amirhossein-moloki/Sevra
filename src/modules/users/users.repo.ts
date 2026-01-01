import { prisma } from '../../config/prisma';
import { CreateUserInput, UpdateUserInput } from './users.validators';

export const createUser = async (salonId: string, data: CreateUserInput) => {
  return prisma.user.create({
    data: {
      salonId,
      ...data,
    },
  });
};

export const listUsersBySalon = async (salonId: string) => {
  return prisma.user.findMany({
    where: {
      salonId,
      isActive: true, // Typically, we only want active staff
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
};

export const findUserById = async (salonId: string, userId: string) => {
  return prisma.user.findFirst({
    where: {
      id: userId,
      salonId,
    },
  });
};

export const updateUser = async (
  salonId: string,
  userId: string,
  data: UpdateUserInput
) => {
  return prisma.user.updateMany({
    where: {
      id: userId,
      salonId,
    },
    data,
  });
};

import { prisma } from '../../config/prisma';
import { CreateUserInput, UpdateUserInput } from './users.validators';
import { Prisma } from '@prisma/client';

export const createUser = async (salonId: string, data: CreateUserInput) => {
  const createInput: Prisma.UserUncheckedCreateInput = {
    salonId,
    ...(data as any),
  };
  return prisma.user.create({
    data: createInput as any,
  });
};

export const softDeleteUser = async (salonId: string, userId: string) => {
  return prisma.user.updateMany({
    where: {
      id: userId,
      salonId,
    },
    data: {
      isActive: false,
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

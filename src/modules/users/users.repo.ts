import { prisma } from '../../config/prisma';
import { CreateUserInput, UpdateUserInput, ListUsersQuery } from './users.validators';
import { Prisma } from '@prisma/client';
import { getPaginationParams, formatPaginatedResult } from '../../common/utils/pagination';

export const createUser = async (salonId: string, data: CreateUserInput) => {
  const createInput: Prisma.UserUncheckedCreateInput = {
    salonId,
    ...(data as any), // eslint-disable-line @typescript-eslint/no-explicit-any
  };
  return prisma.user.create({
    data: createInput as any, // eslint-disable-line @typescript-eslint/no-explicit-any
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

export const listUsersBySalon = async (salonId: string, query: ListUsersQuery) => {
  const { page, limit, search, isActive, sortBy, sortOrder, role, isPublic, serviceId } = query;
  const { skip, take } = getPaginationParams(page, limit);

  const where: Prisma.UserWhereInput = {
    salonId,
    isActive: isActive !== undefined ? isActive : true,
  };

  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (role) {
    where.role = role;
  }

  if (isPublic !== undefined) {
    where.isPublic = isPublic;
  }

  if (serviceId) {
    where.userServices = {
      some: {
        serviceId,
      },
    };
  }

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'asc' },
    }),
    prisma.user.count({ where }),
  ]);

  return formatPaginatedResult(data, total, page, limit);
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

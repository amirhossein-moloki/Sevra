import { prisma } from '../../config/prisma';
import { Service, Prisma } from '@prisma/client';
import { AppError } from '../../common/errors/AppError';

export async function create(
  serviceData: Prisma.ServiceCreateInput
): Promise<Service> {
  return prisma.service.create({
    data: serviceData,
  });
}

export async function findMany(
  filter: Partial<{ salonId: string; isActive: boolean }>
): Promise<Service[]> {
  return prisma.service.findMany({
    where: filter,
    orderBy: {
      name: 'asc',
    },
  });
}

export async function findById(
  serviceId: string,
  salonId: string
): Promise<Service | null> {
  return prisma.service.findFirst({
    where: {
      id: serviceId,
      salonId: salonId,
    },
  });
}

export async function update(
  serviceId: string,
  salonId: string,
  updateData: Prisma.ServiceUpdateInput
): Promise<Service> {
  try {
    return await prisma.service.update({
      where: {
        id: serviceId,
        salonId: salonId, // Ensures atomicity and tenancy
      },
      data: updateData,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P2025 is the error code for "Record to update not found."
      if (error.code === 'P2025') {
        throw AppError.notFound('سرویس مورد نظر برای این سالن یافت نشد');
      }
    }
    // Re-throw other errors
    throw error;
  }
}

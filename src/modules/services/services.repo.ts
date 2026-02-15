import { prisma } from '../../config/prisma';
import { CreateServiceInput, UpdateServiceInput } from './services.types';
import { Prisma } from '@prisma/client';
import { ListServicesQuery } from './services.validators';
import { getPaginationParams, formatPaginatedResult } from '../../common/utils/pagination';

/**
 * Creates a new service for a given salon.
 * @param salonId - The ID of the salon.
 * @param data - The data for the new service.
 * @returns The newly created service.
 */
export async function createService(salonId: string, data: CreateServiceInput) {
  const createInput: Prisma.ServiceUncheckedCreateInput = {
    ...(data as any), // eslint-disable-line @typescript-eslint/no-explicit-any
    salonId,
  };
  return prisma.service.create({
    data: createInput as any, // eslint-disable-line @typescript-eslint/no-explicit-any
  });
}

/**
 * Finds a service by its ID for a specific salon.
 * @param serviceId - The ID of the service to find.
 * @param salonId - The ID of the salon.
 * @returns The service if found, otherwise null.
 */
export async function findServiceById(serviceId: string, salonId: string) {
  return prisma.service.findFirst({
    where: { id: serviceId, salonId },
  });
}

/**
 * Retrieves a list of services for a given salon, with optional filtering.
 * @param salonId - The ID of the salon.
 * @param options - Optional filtering criteria (e.g., isActive).
 * @returns A list of services.
 */
export async function findServicesBySalonId(salonId: string, query: ListServicesQuery) {
  const {
    page,
    limit,
    search,
    isActive,
    sortBy,
    sortOrder,
    minPrice,
    maxPrice,
    minDuration,
    maxDuration,
    staffId,
  } = query;
  const { skip, take } = getPaginationParams(page, limit);

  const where: Prisma.ServiceWhereInput = {
    salonId,
    isActive: isActive !== undefined ? isActive : true,
  };

  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {
      gte: minPrice,
      lte: maxPrice,
    };
  }

  if (minDuration !== undefined || maxDuration !== undefined) {
    where.durationMinutes = {
      gte: minDuration,
      lte: maxDuration,
    };
  }

  if (staffId) {
    where.userServices = {
      some: {
        userId: staffId,
      },
    };
  }

  const [data, total] = await Promise.all([
    prisma.service.findMany({
      where,
      skip,
      take,
      orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
    }),
    prisma.service.count({ where }),
  ]);

  return formatPaginatedResult(data, total, page, limit);
}

/**
 * Updates an existing service for a specific salon.
 * @param serviceId - The ID of the service to update.
 * @param salonId - The ID of the salon.
 * @param data - The data to update the service with.
 * @returns The updated service.
 */
export async function updateService(serviceId: string, salonId: string, data: UpdateServiceInput) {
  // Use updateMany to ensure we are only updating a service belonging to the correct salon.
  await prisma.service.updateMany({
    where: { id: serviceId, salonId },
    data,
  });

  // Return the updated service record.
  return findServiceById(serviceId, salonId);
}

/**
 * Deactivates a service (soft delete) for a specific salon.
 * @param serviceId - The ID of the service to deactivate.
 * @param salonId - The ID of the salon.
 * @returns The deactivated service.
 */
export async function deactivateService(serviceId: string, salonId: string) {
  await prisma.service.updateMany({
    where: { id: serviceId, salonId },
    data: { isActive: false },
  });
  return findServiceById(serviceId, salonId);
}

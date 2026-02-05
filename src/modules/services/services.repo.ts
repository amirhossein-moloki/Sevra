import { prisma } from '../../config/prisma';
import { CreateServiceInput, UpdateServiceInput } from './services.types';
import { Prisma } from '@prisma/client';

/**
 * Creates a new service for a given salon.
 * @param salonId - The ID of the salon.
 * @param data - The data for the new service.
 * @returns The newly created service.
 */
export async function createService(salonId: string, data: CreateServiceInput) {
  const createInput: Prisma.ServiceUncheckedCreateInput = {
    ...(data as any),
    salonId,
  };
  return prisma.service.create({
    data: createInput as any,
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
export async function findServicesBySalonId(salonId: string, options: { isActive?: boolean } = {}) {
  return prisma.service.findMany({
    where: {
      salonId,
      ...options,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
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

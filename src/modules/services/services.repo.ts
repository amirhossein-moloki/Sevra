import { prisma } from '../../config/prisma';
import { CreateServiceInput, UpdateServiceInput } from './services.types';

/**
 * Creates a new service for a given salon.
 * @param salonId - The ID of the salon.
 * @param data - The data for the new service.
 * @returns The newly created service.
 */
export async function createService(salonId: string, data: CreateServiceInput) {
  return prisma.service.create({
    data: {
      ...data,
      salonId,
    },
  });
}

/**
 * Finds a service by its ID.
 * @param serviceId - The ID of the service to find.
 * @returns The service if found, otherwise null.
 */
export async function findServiceById(serviceId: string) {
  return prisma.service.findUnique({
    where: { id: serviceId },
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
 * Updates an existing service.
 * @param serviceId - The ID of the service to update.
 * @param data - The data to update the service with.
 * @returns The updated service.
 */
export async function updateService(serviceId: string, data: UpdateServiceInput) {
  return prisma.service.update({
    where: { id: serviceId },
    data,
  });
}

/**
 * Deactivates a service (soft delete).
 * @param serviceId - The ID of the service to deactivate.
 * @returns The deactivated service.
 */
export async function deactivateService(serviceId: string) {
  return prisma.service.update({
    where: { id: serviceId },
    data: { isActive: false },
  });
}

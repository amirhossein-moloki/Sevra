import * as ServiceRepo from './services.repo';
import { CreateServiceInput, UpdateServiceInput } from './services.types';
import createHttpError from 'http-errors';

/**
 * Business logic to create a new service.
 * @param salonId - The ID of the salon.
 * @param data - The data for the new service.
 * @returns The newly created service.
 */
export async function createService(salonId: string, data: CreateServiceInput) {
  // In a real app, you might have more complex logic here,
  // e.g., checking for duplicate service names within the same salon.
  return ServiceRepo.createService(salonId, data);
}

/**
 * Business logic to get a single service by its ID.
 * @param serviceId - The ID of the service.
 * @returns The service object.
 * @throws {HttpError} 404 if the service is not found.
 */
export async function getServiceById(serviceId: string) {
  const service = await ServiceRepo.findServiceById(serviceId);
  if (!service) {
    throw createHttpError(404, 'Service not found');
  }
  return service;
}

/**
 * Business logic to get all services for a salon.
 * @param salonId - The ID of the salon.
 * @param isActive - Optional filter for service status.
 * @returns A list of services.
 */
export async function getServicesForSalon(salonId: string, isActive?: boolean) {
  return ServiceRepo.findServicesBySalonId(salonId, { isActive });
}

/**
 * Business logic to update a service.
 * @param serviceId - The ID of the service to update.
 * @param data - The data to update.
 * @returns The updated service.
 * @throws {HttpError} 404 if the service is not found.
 */
export async function updateService(serviceId: string, data: UpdateServiceInput) {
  // First, ensure the service exists
  await getServiceById(serviceId);
  return ServiceRepo.updateService(serviceId, data);
}

/**
 * Business logic to deactivate a service.
 * @param serviceId - The ID of the service to deactivate.
 * @returns The deactivated service.
 * @throws {HttpError} 404 if the service is not found.
 */
export async function deactivateService(serviceId: string) {
  // First, ensure the service exists
  await getServiceById(serviceId);
  return ServiceRepo.deactivateService(serviceId);
}

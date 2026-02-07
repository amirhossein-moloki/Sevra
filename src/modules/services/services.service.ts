import * as ServiceRepo from './services.repo';
import { CreateServiceInput, UpdateServiceInput } from './services.types';
import AppError from '../../common/errors/AppError';
import httpStatus from 'http-status';

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
 * Business logic to get a single service by its ID for a specific salon.
 * @param serviceId - The ID of the service.
 * @param salonId - The ID of the salon.
 * @returns The service object.
 * @throws {HttpError} 404 if the service is not found in this salon.
 */
export async function getServiceById(serviceId: string, salonId: string) {
  const service = await ServiceRepo.findServiceById(serviceId, salonId);
  if (!service) {
    throw new AppError('Service not found', httpStatus.NOT_FOUND);
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
 * Business logic to update a service for a specific salon.
 * @param serviceId - The ID of the service to update.
 * @param salonId - The ID of the salon.
 * @param data - The data to update.
 * @returns The updated service.
 * @throws {HttpError} 404 if the service is not found in this salon.
 */
export async function updateService(serviceId: string, salonId: string, data: UpdateServiceInput) {
  // First, ensure the service exists within this salon before updating.
  await getServiceById(serviceId, salonId);
  return ServiceRepo.updateService(serviceId, salonId, data);
}

/**
 * Business logic to deactivate a service for a specific salon.
 * @param serviceId - The ID of the service to deactivate.
 *param salonId - The ID of the salon.
 * @returns The deactivated service.
 * @throws {HttpError} 404 if the service is not found in this salon.
 */
export async function deactivateService(serviceId: string, salonId: string) {
  // First, ensure the service exists within this salon before deactivating.
  await getServiceById(serviceId, salonId);
  return ServiceRepo.deactivateService(serviceId, salonId);
}

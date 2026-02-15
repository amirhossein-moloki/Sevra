import { SessionActorType } from '@prisma/client';
import { auditService } from '../audit/audit.service';
import * as ServiceRepo from './services.repo';
import { CreateServiceInput, UpdateServiceInput } from './services.types';
import { ListServicesQuery } from './services.validators';
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
 * @param query - Filtering and pagination criteria.
 * @returns A list of services.
 */
export async function getServicesForSalon(salonId: string, query: ListServicesQuery) {
  return ServiceRepo.findServicesBySalonId(salonId, query);
}

/**
 * Business logic to update a service for a specific salon.
 * @param serviceId - The ID of the service to update.
 * @param salonId - The ID of the salon.
 * @param data - The data to update.
 * @returns The updated service.
 * @throws {HttpError} 404 if the service is not found in this salon.
 */
export async function updateService(
  serviceId: string,
  salonId: string,
  data: UpdateServiceInput,
  actor: { id: string; actorType: SessionActorType },
  context?: { ip?: string; userAgent?: string }
) {
  // First, ensure the service exists within this salon before updating.
  const oldService = await getServiceById(serviceId, salonId);
  const updatedService = await ServiceRepo.updateService(serviceId, salonId, data);

  // Log if price changed
  if (data.price !== undefined && data.price !== oldService.price) {
    await auditService.log(
      salonId,
      actor,
      'SERVICE_PRICE_UPDATE',
      { name: 'Service', id: serviceId },
      { old: oldService, new: updatedService },
      context
    );
  } else {
    await auditService.log(
      salonId,
      actor,
      'SERVICE_UPDATE',
      { name: 'Service', id: serviceId },
      { old: oldService, new: updatedService },
      context
    );
  }

  return updatedService;
}

/**
 * Business logic to deactivate a service for a specific salon.
 * @param serviceId - The ID of the service to deactivate.
 *param salonId - The ID of the salon.
 * @returns The deactivated service.
 * @throws {HttpError} 404 if the service is not found in this salon.
 */
export async function deactivateService(
  serviceId: string,
  salonId: string,
  actor: { id: string; actorType: SessionActorType },
  context?: { ip?: string; userAgent?: string }
) {
  // First, ensure the service exists within this salon before deactivating.
  const oldService = await getServiceById(serviceId, salonId);
  const updatedService = await ServiceRepo.deactivateService(serviceId, salonId);

  await auditService.log(
    salonId,
    actor,
    'SERVICE_DEACTIVATE',
    { name: 'Service', id: serviceId },
    { old: oldService, new: updatedService },
    context
  );

  return updatedService;
}

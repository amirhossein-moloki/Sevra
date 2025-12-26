import * as servicesRepo from './services.repo';
import { Service } from '@prisma/client';
import { CreateServiceInput, UpdateServiceInput } from './services.validators';

// The data for creating a service will come from the controller,
// which already includes salonId.
type CreateServiceData = CreateServiceInput & { salonId: string };

export async function create(
  serviceData: CreateServiceData
): Promise<Service> {
  // Business logic can be added here in the future.
  // For now, it directly calls the repository.
  const service = await servicesRepo.create(serviceData);
  return service;
}

export async function findMany(
  filter: Partial<{ salonId: string; isActive: boolean }>
): Promise<Service[]> {
  const services = await servicesRepo.findMany(filter);
  return services;
}

export async function findById(
  serviceId: string,
  salonId: string
): Promise<Service | null> {
  const service = await servicesRepo.findById(serviceId, salonId);
  return service;
}

export async function update(
  serviceId: string,
  salonId: string,
  updateData: UpdateServiceInput
): Promise<Service> {
  // The repository now handles the atomic update and tenancy check.
  // The separate findById check is no longer needed here.
  const updatedService = await servicesRepo.update(
    serviceId,
    salonId,
    updateData
  );
  return updatedService;
}

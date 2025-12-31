import { Request, Response } from 'express';
import * as ServiceService from './services.service';

/**
 * Handler to create a new service.
 */
export async function createServiceHandler(req: Request, res: Response) {
  const { salonId } = req.params; // Assuming salonId is in params from a higher-level router
  const service = await ServiceService.createService(salonId, req.body);
  res.status(201).json({ success: true, data: service });
}

/**
 * Handler to get a single service by its ID.
 */
export async function getServiceByIdHandler(req: Request, res: Response) {
  const { serviceId } = req.params;
  const service = await ServiceService.getServiceById(serviceId);
  res.status(200).json({ success: true, data: service });
}

/**
 * Handler to get a list of services for a salon.
 */
export async function getServicesForSalonHandler(req: Request, res: Response) {
  const { salonId, salonSlug } = req.params;
  const targetSalonId = salonId || (req.salon?.id); // salonId for private, req.salon.id for public from a slug middleware

  // Handle isActive filter from query string
  const isActiveQuery = req.query.isActive;
  let isActive: boolean | undefined = undefined;
  if (isActiveQuery === 'true') isActive = true;
  if (isActiveQuery === 'false') isActive = false;

  const services = await ServiceService.getServicesForSalon(targetSalonId, isActive);
  res.status(200).json({ success: true, data: services });
}

/**
 * Handler to update a service.
 */
export async function updateServiceHandler(req: Request, res: Response) {
  const { serviceId } = req.params;
  const service = await ServiceService.updateService(serviceId, req.body);
  res.status(200).json({ success: true, data: service });
}

/**
 * Handler to deactivate a service.
 */
export async function deactivateServiceHandler(req: Request, res: Response) {
  const { serviceId } = req.params;
  await ServiceService.deactivateService(serviceId);
  res.status(204).send(); // No content
}

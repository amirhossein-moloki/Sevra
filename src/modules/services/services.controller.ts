import { Request, Response } from 'express';
import * as serviceLogic from './services.service';
import { CreateServiceInput, UpdateServiceInput } from './services.types';
import { Salon } from '@prisma/client';

// Local type extension for Request
interface RequestWithSalon extends Request {
  salon?: Salon;
}

/**
 * Handle request to create a new service.
 */
export async function createService(
  req: Request<{ salonId: string }, unknown, CreateServiceInput>,
  res: Response
) {
  const { salonId } = req.params;
  const newService = await serviceLogic.createService(salonId, req.body);
  res.status(201).json({ message: 'Service created successfully', data: newService });
}

/**
 * Handle request to get all services for a salon.
 */
export async function getServices(
  req: RequestWithSalon,
  res: Response
) {
  const { salonId } = req.params;
  const { isActive } = req.query;

  const targetSalonId = salonId || (req.salon?.id);
  if (!targetSalonId) {
    return res.status(400).json({ message: 'Salon ID or slug is required.' });
  }

  const services = await serviceLogic.getServicesForSalon(targetSalonId, isActive === 'true');
  res.status(200).json({ data: services });
}

/**
 * Handle request to get a single service by its ID.
 */
export async function getServiceById(req: Request<{ serviceId: string }>, res: Response) {
  const { serviceId } = req.params;
  const service = await serviceLogic.getServiceById(serviceId);
  res.status(200).json({ data: service });
}

/**
 * Handle request to update a service.
 */
export async function updateService(
  req: Request<{ serviceId: string }, unknown, UpdateServiceInput>,
  res: Response
) {
  const { serviceId } = req.params;
  const updatedService = await serviceLogic.updateService(serviceId, req.body);
  res.status(200).json({ message: 'Service updated successfully', data: updatedService });
}

/**
 * Handle request to delete (deactivate) a service.
 */
export async function deleteService(req: Request<{ serviceId: string }>, res: Response) {
  const { serviceId } = req.params;
  await serviceLogic.deactivateService(serviceId);
  res.status(204).send();
}

import { NextFunction, Request, Response } from 'express';
import * as serviceLogic from './services.service';
import { CreateServiceInput, UpdateServiceInput } from './services.types';
import { Salon } from '@prisma/client';
import createHttpError from 'http-errors';

// Local type extension for Request
interface RequestWithSalon extends Request {
  salon?: Salon;
}

/**
 * Handle request to create a new service.
 */
export async function createService(
  req: Request<{ salonId: string }, unknown, CreateServiceInput>,
  res: Response,
  next: NextFunction
) {
  try {
    const { salonId } = req.params;
    const newService = await serviceLogic.createService(salonId, req.body);
    res.status(201).json({ success: true, data: newService });
  } catch (error) {
    next(error);
  }
}

/**
 * Handle request to get all services for a salon.
 */
export async function getServices(
  req: RequestWithSalon,
  res: Response,
  next: NextFunction
) {
  try {
    const { salonId } = req.params;
    const { isActive } = req.query;

    const targetSalonId = salonId || req.salon?.id;
    if (!targetSalonId) {
      return next(createHttpError(400, 'Salon ID or slug is required.'));
    }

    const services = await serviceLogic.getServicesForSalon(
      targetSalonId,
      isActive === 'true'
    );
    res.status(200).json({ success: true, data: services });
  } catch (error) {
    next(error);
  }
}

/**
 * Handle request to get a single service by its ID.
 */
export async function getServiceById(
  req: Request<{ salonId: string; serviceId: string }>,
  res: Response,
  next: NextFunction
) {
  try {
    const { salonId, serviceId } = req.params;
    const service = await serviceLogic.getServiceById(serviceId, salonId);
    res.status(200).json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
}

/**
 * Handle request to update a service.
 */
export async function updateService(
  req: Request<{ salonId: string; serviceId: string }, unknown, UpdateServiceInput>,
  res: Response,
  next: NextFunction
) {
  try {
    const { salonId, serviceId } = req.params;
    const updatedService = await serviceLogic.updateService(serviceId, salonId, req.body);
    res.status(200).json({ success: true, data: updatedService });
  } catch (error) {
    next(error);
  }
}

/**
 * Handle request to delete (deactivate) a service.
 */
export async function deleteService(
  req: Request<{ salonId: string; serviceId: string }>,
  res: Response,
  next: NextFunction
) {
  try {
    const { salonId, serviceId } = req.params;
    await serviceLogic.deactivateService(serviceId, salonId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

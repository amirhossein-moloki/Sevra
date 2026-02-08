import { NextFunction, Request, Response } from 'express';
import * as serviceLogic from './services.service';
import { CreateServiceInput, UpdateServiceInput } from './services.types';
import { Salon } from '@prisma/client';
import AppError from '../../common/errors/AppError';
import httpStatus from 'http-status';

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
    res.created(newService);
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
      return next(new AppError('Salon ID or slug is required.', httpStatus.BAD_REQUEST));
    }

    const services = await serviceLogic.getServicesForSalon(
      targetSalonId,
      isActive === 'true'
    );
    res.ok(services);
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
    res.ok(service);
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
    const updatedService = await serviceLogic.updateService(
      serviceId,
      salonId,
      req.body,
      (req as any).actor, // eslint-disable-line @typescript-eslint/no-explicit-any
      { ip: req.ip, userAgent: req.headers['user-agent'] }
    );
    res.ok(updatedService);
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
    await serviceLogic.deactivateService(
      serviceId,
      salonId,
      (req as any).actor, // eslint-disable-line @typescript-eslint/no-explicit-any
      { ip: req.ip, userAgent: req.headers['user-agent'] }
    );
    res.noContent();
  } catch (error) {
    next(error);
  }
}

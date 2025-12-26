import { Request, Response, NextFunction } from 'express';
import * as servicesService from './services.service';
import { CreateServiceInput, UpdateServiceInput } from './services.validators';
import { AppError } from '../../common/errors/AppError';

export async function createServiceHandler(
  req: Request<{ salonId: string }, {}, CreateServiceInput>,
  res: Response,
  next: NextFunction
) {
  try {
    const { salonId } = req.params;
    const serviceData = req.body;

    const service = await servicesService.create({
      ...serviceData,
      salonId,
    });

    res.created(service);
  } catch (error) {
    next(error);
  }
}

export async function getServicesHandler(
  req: Request<{ salonId: string }>,
  res: Response,
  next: NextFunction
) {
  try {
    const { salonId } = req.params;
    // TODO: Add filtering from query params later if needed
    const services = await servicesService.findMany({ salonId });
    res.ok(services);
  } catch (error) {
    next(error);
  }
}

export async function getServiceByIdHandler(
  req: Request<{ salonId: string; serviceId: string }>,
  res: Response,
  next: NextFunction
) {
  try {
    const { salonId, serviceId } = req.params;
    const service = await servicesService.findById(serviceId, salonId);
    if (!service) {
      throw AppError.notFound('سرویس مورد نظر یافت نشد');
    }
    res.ok(service);
  } catch (error) {
    next(error);
  }
}

export async function updateServiceHandler(
  req: Request<{ salonId: string; serviceId: string }, {}, UpdateServiceInput>,
  res: Response,
  next: NextFunction
) {
  try {
    const { salonId, serviceId } = req.params;
    const updateData = req.body;

    const updatedService = await servicesService.update(
      serviceId,
      salonId,
      updateData
    );
     if (!updatedService) {
      throw AppError.notFound('سرویس مورد نظر یافت نشد');
    }
    res.ok(updatedService);
  } catch (error) {
    next(error);
  }
}

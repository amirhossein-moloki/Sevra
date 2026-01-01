import { Router, Request, Response, NextFunction } from 'express';
import * as ServiceController from './services.controller';
import { validate } from '../../common/middleware/validate';
import {
  createServiceSchema,
  updateServiceSchema,
  serviceIdParamSchema,
} from './services.validators';
import { authMiddleware } from '../../common/middleware/auth';
import { requireRole } from '../../common/middleware/requireRole';
import { prisma } from '../../config/prisma';
import createHttpError from 'http-errors';
import { Salon } from '@prisma/client';

// Local type extension for Request
interface RequestWithSalon extends Request {
  salon?: Salon;
}

// Middleware to resolve salon from a public slug and attach it to the request
const resolveSalonBySlug = async (req: RequestWithSalon, res: Response, next: NextFunction) => {
  const { salonSlug } = req.params;
  const salon = await prisma.salon.findUnique({ where: { slug: salonSlug } });
  if (!salon) {
    return next(createHttpError(404, 'Salon not found'));
  }
  req.salon = salon; // Attach salon to the request
  next();
};

// --- Private Router (to be mounted under /api/v1/salons/:salonId/services) ---
export const privateServiceRouter = Router({ mergeParams: true });

privateServiceRouter.post(
  '/',
  authMiddleware,
  requireRole(['MANAGER']),
  validate(createServiceSchema),
  ServiceController.createService
);

privateServiceRouter.get(
  '/',
  authMiddleware,
  requireRole(['MANAGER', 'RECEPTIONIST', 'STAFF']),
  ServiceController.getServices
);

privateServiceRouter.get(
  '/:serviceId',
  authMiddleware,
  requireRole(['MANAGER', 'RECEPTIONIST', 'STAFF']),
  validate(serviceIdParamSchema),
  ServiceController.getServiceById
);

privateServiceRouter.patch(
  '/:serviceId',
  authMiddleware,
  requireRole(['MANAGER']),
  validate(updateServiceSchema),
  ServiceController.updateService
);

privateServiceRouter.delete(
  '/:serviceId',
  authMiddleware,
  requireRole(['MANAGER']),
  validate(serviceIdParamSchema),
  ServiceController.deleteService
);

// --- Public Router (to be mounted under /api/v1/public/salons/:salonSlug/services) ---
export const publicServiceRouter = Router({ mergeParams: true });

publicServiceRouter.get(
  '/',
  resolveSalonBySlug,
  (req: Request, res: Response, next: NextFunction) => {
    // For public-facing routes, we should only show active services.
    req.query.isActive = 'true';
    next();
  },
  ServiceController.getServices
);

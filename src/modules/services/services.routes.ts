import { Router } from 'express';
import { auth } from '../../common/middleware/auth';
import { requireRole } from '../../common/middleware/requireRole';
import { validate } from '../../common/middleware/validate';
import { UserRole } from '@prisma/client';
import { createServiceSchema, updateServiceSchema } from './services.validators';
import {
  createServiceHandler,
  getServicesHandler,
  getServiceByIdHandler,
  updateServiceHandler,
} from './services.controller';

const router = Router({ mergeParams: true });

// Note: All routes in this file are implicitly prefixed with '/api/v1/salons/:salonId/services'

router.post(
  '/',
  auth,
  requireRole(UserRole.MANAGER),
  validate(createServiceSchema),
  createServiceHandler
);

router.get(
  '/',
  auth,
  requireRole(UserRole.MANAGER, UserRole.RECEPTIONIST, UserRole.STAFF),
  getServicesHandler
);

router.get(
  '/:serviceId',
  auth,
  requireRole(UserRole.MANAGER, UserRole.RECEPTIONIST, UserRole.STAFF),
  getServiceByIdHandler
);

router.patch(
  '/:serviceId',
  auth,
  requireRole(UserRole.MANAGER),
  validate(updateServiceSchema),
  updateServiceHandler
);

export default router;

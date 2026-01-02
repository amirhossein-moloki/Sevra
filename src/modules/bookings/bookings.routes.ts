
import { Router } from 'express';
import { validate } from '../../common/middleware/validate';
import * as bookingsController from './bookings.controller';
import { createBookingSchema } from './bookings.validators';
import { authMiddleware } from '../../common/middleware/auth';
import { requireRole } from '../../common/middleware/requireRole';
import { UserRole } from '@prisma/client';

const router = Router();

router.post(
  '/',
  authMiddleware,
  requireRole([UserRole.MANAGER, UserRole.STAFF]),
  validate(createBookingSchema),
  bookingsController.createBooking
);

export default router;

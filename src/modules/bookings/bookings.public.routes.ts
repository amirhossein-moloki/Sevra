
import { Router } from 'express';
import { validate } from '../../common/middleware/validate';
import * as bookingsController from './bookings.controller';
import { createPublicBookingSchema } from './bookings.validators';
import { idempotencyMiddleware } from '../../common/middleware/idempotency';

const router = Router();

// 1. Create Online Booking
router.post(
  '/',
  validate(createPublicBookingSchema),
  idempotencyMiddleware,
  bookingsController.createPublicBooking
);

export default router;

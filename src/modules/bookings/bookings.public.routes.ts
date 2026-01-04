import { Router } from 'express';
import { validate } from '../../common/middleware/validate';
import * as bookingsController from './bookings.controller';
import { createPublicBookingSchema } from './bookings.validators';
import { idempotencyMiddleware } from '../../common/middleware/idempotency';
import { publicBookingRateLimiter } from '../../common/middleware/rateLimit';

const router = Router({ mergeParams: true });

// 1. Create Online Booking
router.post(
  '/',
  publicBookingRateLimiter,
  validate(createPublicBookingSchema),
  idempotencyMiddleware,
  bookingsController.createPublicBooking
);

export default router;

import { Router } from 'express';
import { validate } from '../../common/middleware/validate';
import * as bookingsController from './bookings.controller';
import { createPublicBookingSchema } from './bookings.validators';
import { idempotencyMiddleware } from '../../common/middleware/idempotency';
import { publicBookingRateLimiter } from '../../common/middleware/rateLimit';
import { resolveSalonBySlug } from '../../common/middleware/resolveSalonBySlug';

const router = Router({ mergeParams: true });

// 1. Create Online Booking
router.post(
  '/',
  ...(process.env.NODE_ENV !== 'test' ? [publicBookingRateLimiter] : []),
  resolveSalonBySlug,
  validate(createPublicBookingSchema),
  idempotencyMiddleware,
  bookingsController.createPublicBooking
);

export default router;

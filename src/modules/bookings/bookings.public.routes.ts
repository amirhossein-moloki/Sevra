
import { Router } from 'express';
import { validate } from '../../common/middleware/validate';
import * as bookingsController from './bookings.controller';
import { createPublicBookingSchema } from './bookings.validators';

const router = Router();

// 1. Create Online Booking
router.post(
  '/',
  // Note: No auth middleware for public routes
  validate(createPublicBookingSchema),
  bookingsController.createPublicBooking
);

export default router;

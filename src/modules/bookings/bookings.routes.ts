
import { Router } from 'express';
import { validate } from '../../common/middleware/validate';
import * as bookingsController from './bookings.controller';
import {
  createBookingSchema,
  updateBookingSchema,
  cancelBookingSchema,
  listBookingsQuerySchema,
} from './bookings.validators';
import { authMiddleware } from '../../common/middleware/auth';
import { requireRole } from '../../common/middleware/requireRole';
import { UserRole } from '@prisma/client';
import { idParamSchema } from '../../common/validators/common.validators';

const router = Router();
const M_S = [UserRole.MANAGER, UserRole.STAFF]; // MANAGER or STAFF

// 1. Create Booking
router.post(
  '/',
  authMiddleware,
  requireRole(M_S),
  validate(createBookingSchema),
  bookingsController.createBooking
);

// 2. List Bookings
router.get(
  '/',
  authMiddleware,
  requireRole(M_S),
  validate(listBookingsQuerySchema),
  bookingsController.getBookings
);

// 3. Get Booking by ID
router.get(
  '/:bookingId',
  authMiddleware,
  requireRole(M_S),
  validate(idParamSchema('bookingId')),
  bookingsController.getBookingById
);

// 4. Update Booking Details
router.patch(
  '/:bookingId',
  authMiddleware,
  requireRole(M_S),
  validate(updateBookingSchema),
  bookingsController.updateBooking
);

// 5. Confirm Booking
router.post(
  '/:bookingId/confirm',
  authMiddleware,
  requireRole(M_S),
  validate(idParamSchema('bookingId')),
  bookingsController.confirmBooking
);

// 6. Cancel Booking
router.post(
  '/:bookingId/cancel',
  authMiddleware,
  requireRole(M_S),
  validate(cancelBookingSchema),
  bookingsController.cancelBooking
);

// 7. Complete Booking
router.post(
  '/:bookingId/complete',
  authMiddleware,
  requireRole(M_S),
  validate(idParamSchema('bookingId')),
  bookingsController.completeBooking
);

// 8. Mark as No-Show
router.post(
  '/:bookingId/no-show',
  authMiddleware,
  requireRole(M_S),
  validate(idParamSchema('bookingId')),
  bookingsController.markAsNoShow
);

export default router;

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
import { tenantGuard } from '../../common/middleware/tenantGuard';
import { privateApiRateLimiter } from '../../common/middleware/rateLimit';

const router = Router({ mergeParams: true });

if (process.env.NODE_ENV !== 'test') {
  router.use(privateApiRateLimiter);
}
router.use(authMiddleware, tenantGuard);

const M_R = [UserRole.MANAGER, UserRole.RECEPTIONIST]; // Manager or Receptionist for write actions
const M_R_S = [UserRole.MANAGER, UserRole.RECEPTIONIST, UserRole.STAFF]; // All roles for read actions

// 1. Create Booking
router.post(
  '/',
  requireRole(M_R),
  validate(createBookingSchema),
  bookingsController.createBooking
);

// 2. List Bookings
router.get(
  '/',
  requireRole(M_R_S),
  validate(listBookingsQuerySchema),
  bookingsController.getBookings
);

// 3. Get Booking by ID
router.get(
  '/:bookingId',
  requireRole(M_R_S),
  validate(idParamSchema('bookingId')),
  bookingsController.getBookingById
);

// 4. Update Booking Details
router.patch(
  '/:bookingId',
  requireRole(M_R),
  validate(updateBookingSchema),
  bookingsController.updateBooking
);

// 5. Confirm Booking
router.post(
  '/:bookingId/confirm',
  requireRole(M_R),
  validate(idParamSchema('bookingId')),
  bookingsController.confirmBooking
);

// 6. Cancel Booking
router.post(
  '/:bookingId/cancel',
  requireRole(M_R),
  validate(cancelBookingSchema),
  bookingsController.cancelBooking
);

// 7. Complete Booking
router.post(
  '/:bookingId/complete',
  requireRole(M_R),
  validate(idParamSchema('bookingId')),
  bookingsController.completeBooking
);

// 8. Mark as No-Show
router.post(
  '/:bookingId/no-show',
  requireRole(M_R),
  validate(idParamSchema('bookingId')),
  bookingsController.markAsNoShow
);

export default router;

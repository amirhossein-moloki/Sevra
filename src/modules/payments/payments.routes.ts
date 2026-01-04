import { Router } from 'express';
import { authMiddleware } from '../../common/middleware/auth';
import { salonIdMiddleware } from '../../common/middleware/salonId.middleware';
import { requireRole } from '../../common/middleware/requireRole';
import { UserRole } from '@prisma/client';
import { validate } from '../../common/middleware/validate';
import { PaymentsController } from './payments.controller';
import { InitPaymentValidators } from './payments.validators';

const router = Router();

router.post(
  '/bookings/:bookingId/payments/init', // Path is now relative to `/salons/:salonId/bookings`
  authMiddleware,
  requireRole([UserRole.MANAGER, UserRole.RECEPTIONIST]),
  validate(InitPaymentValidators),
  PaymentsController.initiatePayment
);

export const paymentsRoutes = router;
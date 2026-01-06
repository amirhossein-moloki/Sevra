import { Router } from 'express';
import { authMiddleware } from '../../common/middleware/auth';
import { tenantGuard } from '../../common/middleware/tenantGuard';
import { requireRole } from '../../common/middleware/requireRole';
import { UserRole } from '@prisma/client';
import { validate } from '../../common/middleware/validate';
import { PaymentsController } from './payments.controller';
import { InitPaymentValidators } from './payments.validators';
import { salonIdMiddleware } from '../../common/middleware/salonId.middleware';
import { idempotencyMiddleware } from '../../common/middleware/idempotency';

const router = Router();

router.post(
  '/bookings/:bookingId/payments/init', // Path is now relative to `/salons/:salonId/bookings`
  authMiddleware,
  salonIdMiddleware,
  tenantGuard,
  idempotencyMiddleware,
  requireRole([UserRole.MANAGER, UserRole.RECEPTIONIST, UserRole.STAFF]),
  validate(InitPaymentValidators),
  PaymentsController.initiatePayment
);

export const paymentsRoutes = router;
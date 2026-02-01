import { Router } from 'express';
import * as ReviewsController from './reviews.controller';
import { validate } from '../../common/middleware/validate';
import {
  submitReviewSchema,
  moderateReviewSchema,
  getReviewsSchema,
} from './reviews.validators';
import { authMiddleware } from '../../common/middleware/auth';
import { requireRole } from '../../common/middleware/requireRole';
import { tenantGuard } from '../../common/middleware/tenantGuard';
import { resolveSalonBySlug } from '../../common/middleware/resolveSalonBySlug';
import { UserRole } from '@prisma/client';
import {
  privateApiRateLimiter,
  publicApiRateLimiter,
} from '../../common/middleware/rateLimit';

// --- Private Router (to be mounted under /api/v1/salons/:salonId/reviews) ---
export const privateReviewsRouter = Router({ mergeParams: true });

privateReviewsRouter.use(privateApiRateLimiter, authMiddleware, tenantGuard);

privateReviewsRouter.patch(
  '/:id/status',
  requireRole([UserRole.MANAGER]),
  validate(moderateReviewSchema),
  ReviewsController.moderateReview
);

// --- Public Router (to be mounted under /api/v1/public/salons/:salonSlug) ---
export const publicReviewsRouter = Router({ mergeParams: true });

publicReviewsRouter.use(publicApiRateLimiter, resolveSalonBySlug);

publicReviewsRouter.post(
  '/bookings/:bookingId/reviews',
  validate(submitReviewSchema),
  ReviewsController.submitReview
);

publicReviewsRouter.get(
  '/reviews',
  validate(getReviewsSchema),
  ReviewsController.getReviews
);

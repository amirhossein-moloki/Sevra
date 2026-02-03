
import { Router } from 'express';
import { authMiddleware } from '../../common/middleware/auth';
import { tenantGuard } from '../../common/middleware/tenantGuard';
import { requireRole } from '../../common/middleware/requireRole';
import { UserRole } from '@prisma/client';
import { validate } from '../../common/middleware/validate';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsQuerySchema } from './analytics.validators';

const router = Router({ mergeParams: true });

router.use(authMiddleware);
router.use(tenantGuard);
router.use(requireRole([UserRole.MANAGER]));

router.get('/summary', validate(AnalyticsQuerySchema as any), AnalyticsController.getSummary);
router.get('/staff', validate(AnalyticsQuerySchema as any), AnalyticsController.getStaffPerformance);
router.get('/services', validate(AnalyticsQuerySchema as any), AnalyticsController.getServicePerformance);
router.get('/revenue-chart', validate(AnalyticsQuerySchema as any), AnalyticsController.getRevenueChart);

export const analyticsRoutes = router;

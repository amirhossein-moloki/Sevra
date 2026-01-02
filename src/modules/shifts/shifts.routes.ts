import { Router } from 'express';
import { upsertShiftsController } from './shifts.controller';
import { validate } from '../../common/middleware/validate';
import { upsertShiftsSchema } from './shifts.validators';
import { authMiddleware } from '../../common/middleware/auth';
import { requireRole } from '../../common/middleware/requireRole';
import { UserRole } from '@prisma/client';

const router = Router({ mergeParams: true });

// All routes in this file are for authenticated users
router.use(authMiddleware);

// Define shifts routes
router.put(
  '/',
  requireRole([UserRole.MANAGER]),
  validate(upsertShiftsSchema),
  upsertShiftsController
);

export default router;

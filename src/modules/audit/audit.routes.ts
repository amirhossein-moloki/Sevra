
import { Router } from 'express';
import { getAuditLogs } from './audit.controller';
import { listAuditLogsSchema } from './audit.validators';
import { validate } from '../../common/middleware/validate';
import { authMiddleware } from '../../common/middleware/auth';
import { tenantGuard } from '../../common/middleware/tenantGuard';
import { requireRole } from '../../common/middleware/requireRole';
import { UserRole } from '@prisma/client';

const router = Router({ mergeParams: true });

router.get(
  '/',
  authMiddleware,
  tenantGuard,
  requireRole([UserRole.MANAGER]),
  validate(listAuditLogsSchema),
  getAuditLogs
);

export default router;

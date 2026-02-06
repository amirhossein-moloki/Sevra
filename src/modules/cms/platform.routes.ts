import { Router } from 'express';
import * as PagesController from './pages.controller';
import { validate } from '../../common/middleware/validate';
import { copyAllPagesSchema, copySinglePageSchema } from './pages.validators';
import { authMiddleware } from '../../common/middleware/auth';
import { requireRole } from '../../common/middleware/requireRole';
import { UserRole } from '@prisma/client';

export const platformCmsRouter = Router();

// Protect all platform CMS routes with PLATFORM_ADMIN role
platformCmsRouter.use(authMiddleware, requireRole([UserRole.PLATFORM_ADMIN]));

platformCmsRouter.post(
  '/pages/copy-all',
  validate(copyAllPagesSchema),
  PagesController.copyAllPages
);

platformCmsRouter.post(
  '/pages/copy',
  validate(copySinglePageSchema),
  PagesController.copyPage
);

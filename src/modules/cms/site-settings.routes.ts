import { Router } from 'express';
import { authMiddleware } from '../../common/middleware/auth';
import { tenantGuard } from '../../common/middleware/tenantGuard';
import { requireRole } from '../../common/middleware/requireRole';
import { UserRole } from '@prisma/client';
import { validate } from '../../common/middleware/validate';
import { updateSiteSettingsSchema } from './site-settings.validators';
import * as SiteSettingsController from './site-settings.controller';

export const cmsSiteSettingsRouter = Router({ mergeParams: true });

cmsSiteSettingsRouter.use(
  authMiddleware,
  tenantGuard,
  requireRole([UserRole.MANAGER])
);

cmsSiteSettingsRouter.get('/', SiteSettingsController.getSiteSettings);

cmsSiteSettingsRouter.put(
  '/',
  validate(updateSiteSettingsSchema),
  SiteSettingsController.upsertSiteSettings
);

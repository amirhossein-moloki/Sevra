import { Router } from 'express';
import { cmsPagesRouter } from './pages.routes';
import { cmsMediaRouter } from './media.routes';
import { cmsLinksRouter } from './links.routes';
import { cmsAddressesRouter } from './addresses.routes';
import { cmsSiteSettingsRouter } from './site-settings.routes';
import { authMiddleware } from '../../common/middleware/auth';
import { tenantGuard } from '../../common/middleware/tenantGuard';
import { requireRole } from '../../common/middleware/requireRole';
import { UserRole } from '@prisma/client';

export const cmsRouter = Router({ mergeParams: true });

cmsRouter.use(authMiddleware, tenantGuard, requireRole([UserRole.MANAGER]));

cmsRouter.use('/pages', cmsPagesRouter);
cmsRouter.use('/media', cmsMediaRouter);
cmsRouter.use('/links', cmsLinksRouter);
cmsRouter.use('/addresses', cmsAddressesRouter);
cmsRouter.use('/site-settings', cmsSiteSettingsRouter);

cmsRouter.all('*', (_req, res) => {
  res.status(501).json({ message: 'CMS routes placeholder.' });
});

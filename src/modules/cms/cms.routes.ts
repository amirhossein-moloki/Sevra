import { Router } from 'express';
import { cmsPagesRouter } from './pages.routes';
import { cmsMediaRouter } from './media.routes';
import { cmsLinksRouter } from './links.routes';
import { cmsAddressesRouter } from './addresses.routes';
import { cmsSiteSettingsRouter } from './site-settings.routes';

export const cmsRouter = Router({ mergeParams: true });

cmsRouter.use('/pages', cmsPagesRouter);
cmsRouter.use('/media', cmsMediaRouter);
cmsRouter.use('/links', cmsLinksRouter);
cmsRouter.use('/addresses', cmsAddressesRouter);
cmsRouter.use('/site-settings', cmsSiteSettingsRouter);

cmsRouter.all('*', (_req, res) => {
  res.status(501).json({ message: 'CMS routes placeholder.' });
});

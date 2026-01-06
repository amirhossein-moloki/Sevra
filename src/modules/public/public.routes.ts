import { Router } from 'express';
import { publicApiRateLimiter } from '../../common/middleware/rateLimit';
import { resolveSalonBySlug } from '../../common/middleware/resolveSalonBySlug';
import { getPublicPage } from './pages.public.controller';

export const publicPagesRouter = Router({ mergeParams: true });
export const publicMediaRouter = Router({ mergeParams: true });
export const publicLinksRouter = Router({ mergeParams: true });
export const publicAddressesRouter = Router({ mergeParams: true });

publicPagesRouter.get(
  '/:pageSlug',
  publicApiRateLimiter,
  resolveSalonBySlug,
  getPublicPage
);

publicMediaRouter.all('*', (_req, res) => {
  res.status(501).json({ message: 'Public media routes placeholder.' });
});

publicLinksRouter.all('*', (_req, res) => {
  res.status(501).json({ message: 'Public links routes placeholder.' });
});

publicAddressesRouter.all('*', (_req, res) => {
  res
    .status(501)
    .json({ message: 'Public addresses routes placeholder.' });
});

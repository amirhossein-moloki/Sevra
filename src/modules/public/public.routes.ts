import { Router } from 'express';
import { publicApiRateLimiter } from '../../common/middleware/rateLimit';
import { resolveSalonBySlug } from '../../common/middleware/resolveSalonBySlug';
import { getPublicAddresses } from './addresses.public.controller';
import { getPublicLinks } from './links.public.controller';
import { getPublicMedia } from './media.public.controller';
import {
  getPublicPage,
  getPublicSalonHome,
} from './pages.public.controller';

export const publicSalonRouter = Router({ mergeParams: true });
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

publicMediaRouter.get(
  '/',
  publicApiRateLimiter,
  resolveSalonBySlug,
  getPublicMedia
);

publicLinksRouter.get(
  '/',
  publicApiRateLimiter,
  resolveSalonBySlug,
  getPublicLinks
);

publicAddressesRouter.get(
  '/',
  publicApiRateLimiter,
  resolveSalonBySlug,
  getPublicAddresses
);

publicSalonRouter.get(
  '/',
  publicApiRateLimiter,
  resolveSalonBySlug,
  getPublicSalonHome
);

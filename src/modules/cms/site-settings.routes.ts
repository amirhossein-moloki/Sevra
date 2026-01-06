import { Router } from 'express';
import { validate } from '../../common/middleware/validate';
import { updateSiteSettingsSchema } from './site-settings.validators';
import * as SiteSettingsController from './site-settings.controller';

export const cmsSiteSettingsRouter = Router({ mergeParams: true });

cmsSiteSettingsRouter.get('/', SiteSettingsController.getSiteSettings);

cmsSiteSettingsRouter.put(
  '/',
  validate(updateSiteSettingsSchema),
  SiteSettingsController.upsertSiteSettings
);

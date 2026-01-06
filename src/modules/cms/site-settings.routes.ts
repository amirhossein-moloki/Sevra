import { Router } from 'express';

export const cmsSiteSettingsRouter = Router({ mergeParams: true });

cmsSiteSettingsRouter.all('*', (_req, res) => {
  res
    .status(501)
    .json({ message: 'CMS site settings routes placeholder.' });
});

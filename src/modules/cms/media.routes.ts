import { Router } from 'express';

export const cmsMediaRouter = Router({ mergeParams: true });

cmsMediaRouter.all('*', (_req, res) => {
  res.status(501).json({ message: 'CMS media routes placeholder.' });
});

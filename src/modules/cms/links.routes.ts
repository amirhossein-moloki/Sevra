import { Router } from 'express';

export const cmsLinksRouter = Router({ mergeParams: true });

cmsLinksRouter.all('*', (_req, res) => {
  res.status(501).json({ message: 'CMS links routes placeholder.' });
});

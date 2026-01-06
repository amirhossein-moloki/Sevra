import { Router } from 'express';

export const cmsAddressesRouter = Router({ mergeParams: true });

cmsAddressesRouter.all('*', (_req, res) => {
  res
    .status(501)
    .json({ message: 'CMS addresses routes placeholder.' });
});

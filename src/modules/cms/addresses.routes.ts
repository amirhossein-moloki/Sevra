import { Router } from 'express';
import createHttpError from 'http-errors';

export const cmsAddressesRouter = Router({ mergeParams: true });

cmsAddressesRouter.all('*', (_req, _res, next) => {
  next(createHttpError(501, 'CMS addresses routes placeholder.'));
});

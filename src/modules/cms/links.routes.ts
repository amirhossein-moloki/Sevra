import { Router } from 'express';
import createHttpError from 'http-errors';

export const cmsLinksRouter = Router({ mergeParams: true });

cmsLinksRouter.all('*', (_req, _res, next) => {
  next(createHttpError(501, 'CMS links routes placeholder.'));
});

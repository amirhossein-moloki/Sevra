import { Router } from 'express';

export const cmsPagesRouter = Router({ mergeParams: true });

cmsPagesRouter.all('*', (_req, res) => {
  res
    .status(501)
    .json({ message: 'CMS pages routes placeholder.' });
});

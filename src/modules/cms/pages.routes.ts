import { Router } from 'express';
import { validate } from '../../common/middleware/validate';
import { createPageSchema, updatePageSchema } from './pages.validators';

export const cmsPagesRouter = Router({ mergeParams: true });

cmsPagesRouter.post('/', validate(createPageSchema), (_req, res) => {
  res.status(501).json({ message: 'CMS pages routes placeholder.' });
});

cmsPagesRouter.patch('/:pageId', validate(updatePageSchema), (_req, res) => {
  res.status(501).json({ message: 'CMS pages routes placeholder.' });
});

cmsPagesRouter.all('*', (_req, res) => {
  res
    .status(501)
    .json({ message: 'CMS pages routes placeholder.' });
});

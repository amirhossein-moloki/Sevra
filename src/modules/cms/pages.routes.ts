import { Router } from 'express';
import { validate } from '../../common/middleware/validate';
import {
  createPageSchema,
  getPageSchema,
  listPagesSchema,
  updatePageSchema,
} from './pages.validators';
import * as PagesController from './pages.controller';

export const cmsPagesRouter = Router({ mergeParams: true });

cmsPagesRouter.get('/', validate(listPagesSchema), PagesController.listPages);

cmsPagesRouter.get('/:pageId', validate(getPageSchema), PagesController.getPage);

cmsPagesRouter.post('/', validate(createPageSchema), PagesController.createPage);

cmsPagesRouter.patch('/:pageId', validate(updatePageSchema), PagesController.updatePage);

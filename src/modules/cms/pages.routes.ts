import { Router } from 'express';
import { validate } from '../../common/middleware/validate';
import {
  createPageSchema,
  getPageSchema,
  listPagesSchema,
  updatePageSchema,
} from './pages.validators';
import * as PagesController from './pages.controller';
import { authMiddleware } from '../../common/middleware/auth';
import { tenantGuard } from '../../common/middleware/tenantGuard';
import { requireRole } from '../../common/middleware/requireRole';
import { UserRole } from '@prisma/client';

export const cmsPagesRouter = Router({ mergeParams: true });

cmsPagesRouter.use(authMiddleware, tenantGuard, requireRole([UserRole.MANAGER]));

cmsPagesRouter.get('/', validate(listPagesSchema), PagesController.listPages);

cmsPagesRouter.get('/:pageId', validate(getPageSchema), PagesController.getPage);

cmsPagesRouter.post('/', validate(createPageSchema), PagesController.createPage);

cmsPagesRouter.patch('/:pageId', validate(updatePageSchema), PagesController.updatePage);

import { Router } from 'express';
import { authMiddleware } from '../../common/middleware/auth';
import { tenantGuard } from '../../common/middleware/tenantGuard';
import { requireRole } from '../../common/middleware/requireRole';
import { UserRole } from '@prisma/client';
import { validate } from '../../common/middleware/validate';
import { createMediaSchema, updateMediaSchema } from './media.validators';
import * as MediaController from './media.controller';

export const cmsMediaRouter = Router({ mergeParams: true });

cmsMediaRouter.use(authMiddleware, tenantGuard, requireRole([UserRole.MANAGER]));

cmsMediaRouter.post('/', validate(createMediaSchema), MediaController.createMedia);

cmsMediaRouter.patch(
  '/:mediaId',
  validate(updateMediaSchema),
  MediaController.updateMedia
);

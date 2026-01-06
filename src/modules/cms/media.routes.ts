import { Router } from 'express';
import { validate } from '../../common/middleware/validate';
import { createMediaSchema, updateMediaSchema } from './media.validators';
import * as MediaController from './media.controller';

export const cmsMediaRouter = Router({ mergeParams: true });

cmsMediaRouter.post('/', validate(createMediaSchema), MediaController.createMedia);

cmsMediaRouter.patch(
  '/:mediaId',
  validate(updateMediaSchema),
  MediaController.updateMedia
);

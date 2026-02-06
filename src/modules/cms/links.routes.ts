import { Router } from 'express';
import * as controller from './links.controller';
import { validate } from '../../common/middleware/validate';
import { createLinkSchema, updateLinkSchema } from './links.validators';

export const cmsLinksRouter = Router({ mergeParams: true });

cmsLinksRouter.get('/', controller.getLinks);
cmsLinksRouter.post('/', validate(createLinkSchema), controller.createLink);
cmsLinksRouter.patch('/:linkId', validate(updateLinkSchema), controller.updateLink);
cmsLinksRouter.delete('/:linkId', controller.deleteLink);

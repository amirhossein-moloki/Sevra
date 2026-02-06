import { Router } from 'express';
import * as controller from './addresses.controller';
import { validate } from '../../common/middleware/validate';
import { createAddressSchema, updateAddressSchema } from './addresses.validators';

export const cmsAddressesRouter = Router({ mergeParams: true });

cmsAddressesRouter.get('/', controller.getAddresses);
cmsAddressesRouter.post('/', validate(createAddressSchema), controller.createAddress);
cmsAddressesRouter.patch('/:addressId', validate(updateAddressSchema), controller.updateAddress);
cmsAddressesRouter.delete('/:addressId', controller.deleteAddress);

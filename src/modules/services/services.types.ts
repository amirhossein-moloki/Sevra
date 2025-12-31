import { z } from 'zod';
import { createServiceSchema, updateServiceSchema } from './services.validators';

// Type for the body of the create service request
export type CreateServiceInput = z.infer<typeof createServiceSchema>['body'];

// Type for the body of the update service request
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>['body'];

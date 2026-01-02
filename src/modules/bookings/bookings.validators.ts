
import { z } from 'zod';

const customerSchema = z.object({
  fullName: z.string().min(3, 'Full name is required'),
  phone: z
    .string()
    .min(10, 'A valid phone number is required')
    .max(15)
    .regex(/^[0-9+]+$/, 'Invalid phone number format'),
});

export const createBookingSchema = z.object({
  body: z.object({
    serviceId: z.string().uuid('Invalid service ID format'),
    staffId: z.string().uuid('Invalid staff ID format'),
    startAt: z.string().datetime('Invalid start time format'),
    notes: z.string().optional(),
    customer: customerSchema,
  }),
});

export type CreateBookingBody = z.infer<
  typeof createBookingSchema
>['body'];

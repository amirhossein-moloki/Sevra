import { z } from 'zod';

export const createCustomerSchema = z.object({
  body: z.object({
    phone: z
      .string({ required_error: 'Phone number is required' })
      .min(10, 'Phone number is too short'),
    fullName: z
      .string({ required_error: 'Full name is required' })
      .min(2, 'Full name must be at least 2 characters'),
    displayName: z
      .string()
      .min(2, 'Display name must be at least 2 characters')
      .optional(),
    note: z.string().optional(),
  }),
});

export const updateCustomerSchema = z.object({
  body: z
    .object({
      displayName: z
        .string()
        .min(2, 'Display name must be at least 2 characters'),
      note: z.string().optional(),
    })
    .partial()
    .refine(
      (data) => Object.keys(data).length > 0,
      'At least one field must be provided to update',
    ),
});

export const customerIdParamsSchema = z.object({
  params: z.object({
    customerId: z.string().cuid('Invalid customer ID format'),
  }),
});

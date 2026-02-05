import { z } from 'zod';

export const createSalonSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters long')
    .regex(
      /^[a-z0-9-]+$/,
      'Slug can only contain lowercase letters, numbers, and hyphens',
    ),
  ownerId: z.string().min(1, 'Owner ID is required'),
});

export const updateSalonSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long').optional(),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters long')
    .regex(
      /^[a-z0-9-]+$/,
      'Slug can only contain lowercase letters, numbers, and hyphens',
    )
    .optional(),
  isActive: z.boolean().optional(),
});

import { z } from 'zod';

// Base schema for common fields
const serviceBaseSchema = {
  name: z.string().min(1, 'Name is required'),
  durationMinutes: z.number().int().positive('Duration must be a positive integer'),
  price: z.number().int().min(0, 'Price cannot be negative'),
  currency: z.string().length(3, 'Currency must be a 3-letter code'),
  isActive: z.boolean().optional(),
};

// Schema for creating a new service
export const createServiceSchema = z.object({
  body: z.object({
    ...serviceBaseSchema,
  }),
});

// Schema for updating an existing service
export const updateServiceSchema = z.object({
  body: z.object({
    name: serviceBaseSchema.name.optional(),
    durationMinutes: serviceBaseSchema.durationMinutes.optional(),
    price: serviceBaseSchema.price.optional(),
    currency: serviceBaseSchema.currency.optional(),
    isActive: serviceBaseSchema.isActive.optional(),
  }),
  params: z.object({
    serviceId: z.string().cuid('Invalid service ID format'),
  }),
});

// Schema for URL parameters that include a serviceId
export const serviceIdParamSchema = z.object({
  params: z.object({
    serviceId: z.string().cuid('Invalid service ID format'),
  }),
});

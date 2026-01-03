
import { z } from 'zod';
import { BookingStatus } from '@prisma/client';
import { idParamSchema } from '../../common/validators/common.validators';

const CUID_MESSAGE = 'Invalid CUID';

// =================================
// Panel Schemas
// =================================

export const createBookingSchema = z.object({
  body: z.object({
    customerProfileId: z.string().cuid(CUID_MESSAGE),
    serviceId: z.string().cuid(CUID_MESSAGE),
    staffId: z.string().cuid(CUID_MESSAGE),
    startAt: z.string().datetime(),
    note: z.string().optional(),
  }),
});

export const updateBookingSchema = z.object({
  params: z.object({
    bookingId: z.string().cuid(CUID_MESSAGE),
  }),
  body: z.object({
    serviceId: z.string().cuid(CUID_MESSAGE).optional(),
    staffId: z.string().cuid(CUID_MESSAGE).optional(),
    startAt: z.string().datetime().optional(),
    note: z.string().optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update.',
  }),
});

export const cancelBookingSchema = z.object({
  params: z.object({
    bookingId: z.string().cuid(CUID_MESSAGE),
  }),
  body: z.object({
    reason: z.string().optional(),
  }),
});

export const listBookingsQuerySchema = z.object({
  query: z.object({
    page: z.preprocess(Number, z.number().int().min(1)).optional(),
    pageSize: z.preprocess(Number, z.number().int().min(1).max(100)).optional(),
    sortBy: z.enum(['startAt', 'createdAt', 'status']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    status: z.nativeEnum(BookingStatus).optional(),
    staffId: z.string().cuid(CUID_MESSAGE).optional(),
    customerProfileId: z.string().cuid(CUID_MESSAGE).optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
  }),
});


// =================================
// Public Schemas
// =================================

export const createPublicBookingSchema = z.object({
  body: z.object({
    customer: z.object({
      fullName: z.string().min(2, 'Full name is required'),
      phone: z.string().min(10, 'A valid phone number is required'), // Basic validation
    }),
    serviceId: z.string().cuid(CUID_MESSAGE),
    staffId: z.string().cuid(CUID_MESSAGE),
    startAt: z.string().datetime(),
    note: z.string().optional(),
  }),
});


// = a single source of truth for types
export type CreateBookingInput = z.infer<typeof createBookingSchema>['body'];
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>['body'];
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>['body'];
export type ListBookingsQuery = z.infer<typeof listBookingsQuerySchema>['query'];
export type CreatePublicBookingInput = z.infer<typeof createPublicBookingSchema>['body'];

import { z } from 'zod';
import { BookingStatus, ReviewTarget } from '@prisma/client';

const CUID_MESSAGE = 'Invalid CUID';

export const getCustomerBookingsSchema = z.object({
  query: z.object({
    page: z.preprocess((val) => Number(val), z.number().int().min(1)).optional(),
    pageSize: z.preprocess((val) => Number(val), z.number().int().min(1).max(100)).optional(),
    status: z.nativeEnum(BookingStatus).optional(),
    salonId: z.string().cuid(CUID_MESSAGE).optional(),
  }),
});

export const customerCancelBookingSchema = z.object({
  params: z.object({
    bookingId: z.string().cuid(CUID_MESSAGE),
  }),
  body: z.object({
    reason: z.string().max(500).optional(),
  }),
});

export const customerSubmitReviewSchema = z.object({
  params: z.object({
    bookingId: z.string().cuid(CUID_MESSAGE),
  }),
  body: z.object({
    target: z.nativeEnum(ReviewTarget),
    serviceId: z.string().cuid(CUID_MESSAGE).optional(),
    rating: z.number().min(1).max(5),
    comment: z.string().max(1000).optional(),
  }),
});

export type GetCustomerBookingsQuery = z.infer<typeof getCustomerBookingsSchema>['query'];
export type CustomerCancelBookingInput = z.infer<typeof customerCancelBookingSchema>['body'];
export type CustomerSubmitReviewInput = z.infer<typeof customerSubmitReviewSchema>['body'];

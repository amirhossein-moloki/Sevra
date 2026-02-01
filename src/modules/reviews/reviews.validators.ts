import { z } from 'zod';
import { ReviewStatus, ReviewTarget } from '@prisma/client';

export const submitReviewSchema = z.object({
  body: z.object({
    bookingId: z.string().cuid(),
    target: z.nativeEnum(ReviewTarget),
    serviceId: z.string().cuid().optional(),
    rating: z.number().min(1).max(5),
    comment: z.string().optional(),
  }),
  params: z.object({
    salonSlug: z.string(),
  }),
});

export const moderateReviewSchema = z.object({
  body: z.object({
    status: z.nativeEnum(ReviewStatus),
  }),
  params: z.object({
    salonId: z.string().cuid(),
    id: z.string().cuid(),
  }),
});

export const getReviewsSchema = z.object({
  params: z.object({
    salonSlug: z.string(),
  }),
});

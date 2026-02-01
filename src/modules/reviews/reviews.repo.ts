import { prisma } from '../../config/prisma';
import { ReviewStatus, ReviewTarget } from '@prisma/client';
import { SubmitReviewInput } from './reviews.types';

export async function createReview(salonId: string, customerAccountId: string, input: SubmitReviewInput) {
  return prisma.review.create({
    data: {
      salonId,
      customerAccountId,
      bookingId: input.bookingId,
      target: input.target,
      serviceId: input.serviceId,
      rating: input.rating,
      comment: input.comment,
      status: ReviewStatus.PUBLISHED, // Default to published for now as requested
    },
  });
}

export async function findPublishedReviewsBySalonSlug(salonSlug: string) {
  return prisma.review.findMany({
    where: {
      salon: { slug: salonSlug },
      status: ReviewStatus.PUBLISHED,
    },
    include: {
      customerAccount: {
        select: {
          fullName: true,
        },
      },
      service: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateReviewStatus(reviewId: string, salonId: string, status: ReviewStatus) {
  return prisma.review.update({
    where: {
      id: reviewId,
      salonId, // Safety check
    },
    data: { status },
  });
}

export async function findReviewById(reviewId: string, salonId: string) {
    return prisma.review.findFirst({
        where: { id: reviewId, salonId }
    });
}

import createHttpError from 'http-errors';
import * as reviewsRepo from './reviews.repo';
import { SubmitReviewInput } from './reviews.types';
import { ReviewStatus, BookingStatus } from '@prisma/client';
import { AnalyticsRepo } from '../analytics/analytics.repo';

export async function submitReview(salonSlug: string, input: SubmitReviewInput) {
  // 1. Verify booking exists and belongs to the salon (by slug)
  const booking = await reviewsRepo.findBookingForReview(input.bookingId, salonSlug);

  if (!booking) {
    throw createHttpError(404, 'Booking not found');
  }

  // 2. check if booking is completed
  if (booking.status !== BookingStatus.DONE) {
    throw createHttpError(400, 'Only completed bookings can be reviewed');
  }

  // 3. Create the review
  // Use the customerAccountId from the booking
  const review = await reviewsRepo.createReview(booking.salonId, booking.customerAccountId, input);

  // Sync analytics
  AnalyticsRepo.syncAllStatsForReview(review.id).catch(console.error);

  return review;
}

export async function getPublishedReviews(salonSlug: string) {
  return reviewsRepo.findPublishedReviewsBySalonSlug(salonSlug);
}

export async function moderateReview(salonId: string, reviewId: string, status: ReviewStatus) {
  const review = await reviewsRepo.findReviewById(reviewId, salonId);
  if (!review) {
    throw createHttpError(404, 'Review not found');
  }

  const updatedReview = await reviewsRepo.updateReviewStatus(reviewId, salonId, status);

  // Sync analytics
  AnalyticsRepo.syncAllStatsForReview(reviewId).catch(console.error);

  return updatedReview;
}

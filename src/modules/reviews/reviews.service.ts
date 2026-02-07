import AppError from '../../common/errors/AppError';
import httpStatus from 'http-status';
import * as reviewsRepo from './reviews.repo';
import { SubmitReviewInput } from './reviews.types';
import { ReviewStatus, BookingStatus } from '@prisma/client';
import { AnalyticsRepo } from '../analytics/analytics.repo';

export async function submitReview(salonSlug: string, input: SubmitReviewInput) {
  // 1. Verify booking exists and belongs to the salon (by slug)
  const booking = await reviewsRepo.findBookingForReview(input.bookingId, salonSlug);

  if (!booking) {
    throw new AppError('Booking not found', httpStatus.NOT_FOUND);
  }

  // 2. check if booking is completed
  if (booking.status !== BookingStatus.DONE) {
    throw new AppError('Only completed bookings can be reviewed', httpStatus.BAD_REQUEST);
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
    throw new AppError('Review not found', httpStatus.NOT_FOUND);
  }

  const updatedReview = await reviewsRepo.updateReviewStatus(reviewId, salonId, status);

  // Sync analytics
  AnalyticsRepo.syncAllStatsForReview(reviewId).catch(console.error);

  return updatedReview;
}

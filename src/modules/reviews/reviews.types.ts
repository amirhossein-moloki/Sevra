import { ReviewStatus, ReviewTarget } from '@prisma/client';

export interface SubmitReviewInput {
  bookingId: string;
  target: ReviewTarget;
  serviceId?: string;
  rating: number;
  comment?: string;
}

export interface ModerateReviewInput {
  status: ReviewStatus;
}

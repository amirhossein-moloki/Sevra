import { Request, Response, NextFunction } from 'express';
import * as reviewsService from './reviews.service';

export async function submitReview(req: Request, res: Response, next: NextFunction) {
  try {
    const { salonSlug } = req.params;
    const review = await reviewsService.submitReview(salonSlug, req.body);
    res.created(review);
  } catch (error) {
    next(error);
  }
}

export async function getReviews(req: Request, res: Response, next: NextFunction) {
  try {
    const { salonSlug } = req.params;
    const reviews = await reviewsService.getPublishedReviews(salonSlug);
    res.ok(reviews);
  } catch (error) {
    next(error);
  }
}

export async function moderateReview(req: Request, res: Response, next: NextFunction) {
  try {
    const { salonId, id } = req.params;
    const { status } = req.body;
    const review = await reviewsService.moderateReview(salonId, id, status);
    res.ok(review);
  } catch (error) {
    next(error);
  }
}

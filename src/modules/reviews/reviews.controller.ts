import { Request, Response, NextFunction } from 'express';
import * as reviewsService from './reviews.service';

export async function submitReview(req: Request, res: Response, next: NextFunction) {
  try {
    const { salonSlug } = req.params;
    const review = await reviewsService.submitReview(salonSlug, req.body);
    res.status(201).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
}

export async function getReviews(req: Request, res: Response, next: NextFunction) {
  try {
    const { salonSlug } = req.params;
    const reviews = await reviewsService.getPublishedReviews(salonSlug);
    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
}

export async function moderateReview(req: Request, res: Response, next: NextFunction) {
  try {
    const { salonId, id } = req.params;
    const { status } = req.body;
    const review = await reviewsService.moderateReview(salonId, id, status);
    res.status(200).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
}

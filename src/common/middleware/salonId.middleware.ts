import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { cuid } from 'cuid';
import AppError from '../errors/AppError';
import httpStatus from 'http-status';

const SalonIdSchema = z.string().refine((val) => cuid.isCuid(val), {
  message: 'Invalid salonId format',
});

export const salonIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const result = SalonIdSchema.safeParse(req.params.salonId);

  if (!result.success) {
    throw new AppError('Invalid salon ID provided.', httpStatus.BAD_REQUEST);
  }

  req.salonId = result.data;
  next();
};

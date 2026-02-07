import { Request, Response, NextFunction } from 'express';
import AppError from '../errors/AppError';
import httpStatus from 'http-status';
import { prisma } from '../../config/prisma';

/**
 * Middleware to resolve a salon from a public slug and attach its tenant
 * context to the request. This is used for public-facing routes.
 *
 * It attaches a `tenant` object to the request:
 * `req.tenant = { salonId: string, salonSlug: string }`
 *
 * @throws {HttpError} 404 - If the salon with the given slug is not found.
 */
export const resolveSalonBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { salonSlug } = req.params;

  if (!salonSlug) {
    // This indicates a routing configuration error.
    return next(new AppError('Salon slug is missing from the request params.', httpStatus.BAD_REQUEST));
  }

  const salon = await prisma.salon.findUnique({
    where: { slug: salonSlug, isActive: true },
  });
  if (!salon) {
    return next(new AppError('Salon not found', httpStatus.NOT_FOUND));
  }

  // Attach a standardized tenant context to the request.
  (req as any).tenant = { salonId: salon.id, salonSlug: salon.slug }; // eslint-disable-line @typescript-eslint/no-explicit-any
  (req as any).salonId = salon.id; // eslint-disable-line @typescript-eslint/no-explicit-any

  next();
};

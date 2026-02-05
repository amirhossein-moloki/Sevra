import { Request, Response, NextFunction } from 'express';
import createHttpError from 'http-errors';
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
    return next(createHttpError(400, 'Salon slug is missing from the request params.'));
  }

  const salon = await prisma.salon.findUnique({
    where: { slug: salonSlug, isActive: true },
  });
  if (!salon) {
    return next(createHttpError(404, 'Salon not found'));
  }

  // Attach a standardized tenant context to the request.
  (req as any).tenant = { salonId: salon.id, salonSlug: salon.slug }; // eslint-disable-line @typescript-eslint/no-explicit-any
  (req as any).salonId = salon.id; // eslint-disable-line @typescript-eslint/no-explicit-any

  next();
};

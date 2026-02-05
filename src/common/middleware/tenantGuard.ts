import { Request, Response, NextFunction } from 'express';
import createHttpError from 'http-errors';

/**
 * This middleware enforces tenant isolation for private routes.
 * It ensures that the authenticated user (actor) belongs to the salon
 * they are trying to access.
 *
 * It must be placed AFTER the authMiddleware.
 *
 * @throws {HttpError} 404 - If salonId does not match or user is not part of a salon.
 * @throws {HttpError} 500 - If the actor object is not found on the request.
 */
export const tenantGuard = (req: Request, res: Response, next: NextFunction) => {
  const { salonId } = req.params;
  const actor = (req as any).actor; // eslint-disable-line @typescript-eslint/no-explicit-any

  if (!actor) {
    // This indicates a server-side configuration error.
    // authMiddleware should have been called first.
    return next(
      createHttpError(500, 'User context (actor) not found on request.')
    );
  }

  // Every user accessing a tenant route MUST have a salonId.
  if (!actor.salonId) {
    return next(createHttpError(404, 'Salon not found.'));
  }

  if (actor.salonId !== salonId) {
    // Use 404 to prevent tenant enumeration attacks.
    // The user should not know that a salon with this ID exists.
    return next(createHttpError(404, 'Salon not found.'));
  }

  // Attach tenant context to the request for use in downstream services/repos.
  (req as any).tenant = { salonId }; // eslint-disable-line @typescript-eslint/no-explicit-any

  next();
};

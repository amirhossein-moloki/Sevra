import { Request, Response, NextFunction } from "express";
import createHttpError from "http-errors";
import { UserRole } from "@prisma/client";

// This is a higher-order function that takes an array of allowed roles
// and returns a middleware function.
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // This middleware must run AFTER authMiddleware, so req.actor should exist.
    const actor = (req as any).actor;

    if (!actor || !actor.role) {
      // This indicates a server-side configuration error.
      // authMiddleware should have been called first.
      return next(
        createHttpError(500, "User role could not be determined from the request actor."),
      );
    }

    if (allowedRoles.includes(actor.role)) {
      // User has one of the allowed roles, proceed to the next handler.
      return next();
    } else {
      // User's role is not in the allowed list, deny access.
      return next(
        createHttpError(403, "Forbidden: You do not have the required permissions."),
      );
    }
  };
};

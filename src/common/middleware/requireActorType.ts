import { Request, Response, NextFunction } from 'express';
import createHttpError from 'http-errors';
import { SessionActorType } from '@prisma/client';

export const requireActorType = (allowedType: SessionActorType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const actor = (req as any).actor; // eslint-disable-line @typescript-eslint/no-explicit-any

    if (!actor || !actor.actorType) {
      return next(
        createHttpError(500, 'Actor type could not be determined from the request actor.'),
      );
    }

    if (actor.actorType === allowedType) {
      return next();
    } else {
      return next(
        createHttpError(403, 'Forbidden: This endpoint is restricted to ' + allowedType),
      );
    }
  };
};

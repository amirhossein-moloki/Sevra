import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/prisma';
import createHttpError from 'http-errors';

const JWT_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_ACCESS_TOKEN_SECRET must be defined in the environment variables');
}

export interface AuthRequest extends Request {
  actor?: {
    sessionId: string;
    actorId: string;
    actorType: 'USER' | 'CUSTOMER';
  };
}

export const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(createHttpError(401, 'Unauthorized: No token provided'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { sessionId: string; actorId: string; actorType: 'USER' | 'CUSTOMER', iat: number, exp: number };

    // Attach decoded actor information to the request object
    req.actor = {
        sessionId: decoded.sessionId,
        actorId: decoded.actorId,
        actorType: decoded.actorType,
    };

    // Optional: Check if the session is still valid in the database
    const session = await prisma.session.findUnique({
      where: { id: decoded.sessionId },
    });

    if (!session || session.revokedAt) {
      return next(createHttpError(401, 'Unauthorized: Session is invalid or revoked'));
    }

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
        return next(createHttpError(401, 'Unauthorized: Token has expired'));
    }
    return next(createHttpError(401, 'Unauthorized: Invalid token'));
  }
};

import { Request, Response, NextFunction } from 'express';
import createHttpError from 'http-errors';
import { verifyToken } from '../../modules/auth/auth.tokens';
import { env } from '../../config/env';
import { prisma } from '../../config/prisma';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(createHttpError(401, 'Authorization header is missing or invalid'));
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token, env.JWT_ACCESS_SECRET);
  if (!payload) {
    return next(createHttpError(401, 'Invalid or expired token'));
  }

  let user;
  if (payload.actorType === 'USER') {
    user = await prisma.user.findUnique({ where: { id: payload.actorId } });
  } else {
    if (!payload.actorId) {
      return next(createHttpError(401, 'Invalid token: actorId is missing.'));
    }
    user = await prisma.customerAccount.findUnique({ where: { id: payload.actorId } });
  }

  if (!user) {
    return next(createHttpError(401, 'User not found'));
  }

  (req as any).actor = { ...user, ...payload }; // eslint-disable-line @typescript-eslint/no-explicit-any
  next();
};

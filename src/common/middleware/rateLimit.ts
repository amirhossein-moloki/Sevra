import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { Request, Response, NextFunction } from 'express';
import redis from '../../config/redis';

const mockMiddleware = (req: Request, res: Response, next: NextFunction) => next();

const store = new RedisStore({
  // @ts-expect-error - Known issue with types compatibility between ioredis and rate-limit-redis
  sendCommand: (...args: string[]) => redis.call(...args),
});

// Custom key generator for public routes to limit requests per IP and per salon slug.
const publicApiKeyGenerator = (req: Request): string => {
  const { salonSlug } = req.params;
  const ip = req.ip || 'unknown';
  if (salonSlug && ip) {
    return `${ip}:${salonSlug}`;
  }
  return ip;
};

/**
 * Rate limiter for authenticated (private) API routes.
 */
export const privateApiRateLimiter = process.env.NODE_ENV === 'test'
  ? mockMiddleware
  : rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    store,
    message: 'Too many requests for this session, please try again after 15 minutes',
  });

/**
 * Rate limiter for general public API GET routes.
 */
export const publicApiRateLimiter = process.env.NODE_ENV === 'test'
  ? mockMiddleware
  : rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    store,
    keyGenerator: publicApiKeyGenerator,
    message: 'Too many requests from this IP for this salon, please try again after 15 minutes',
  });

/**
 * Strictest rate limiter for the public booking creation endpoint.
 */
export const publicBookingRateLimiter = process.env.NODE_ENV === 'test'
  ? mockMiddleware
  : rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    store,
    keyGenerator: publicApiKeyGenerator,
    message: 'Too many booking attempts from this IP for this salon, please try again after 15 minutes',
  });

import rateLimit, { KeyGenerator } from 'express-rate-limit';
import { Request } from 'express';

// Custom key generator for public routes to limit requests per IP and per salon slug.
// This helps prevent a single IP from affecting all salons if they attack one.
const publicApiKeyGenerator: KeyGenerator = (req: Request): string => {
  const { salonSlug } = req.params;
  const ip = req.ip;
  if (salonSlug && ip) {
    return `${ip}:${salonSlug}`;
  }
  return ip; // Fallback to IP if salonSlug is not present
};

/**
 * Rate limiter for authenticated (private) API routes.
 * This is more lenient as users are authenticated.
 */
export const privateApiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests for this session, please try again after 15 minutes',
});

/**
 * Rate limiter for general public API GET routes (e.g., listing services).
 * This is stricter than the private one.
 */
export const publicApiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs per salon
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: publicApiKeyGenerator,
  message: 'Too many requests from this IP for this salon, please try again after 15 minutes',
});

/**
 * Strictest rate limiter for the public booking creation endpoint.
 * This helps prevent spam and abuse of the booking system.
 */
export const publicBookingRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs per salon
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: publicApiKeyGenerator,
  message: 'Too many booking attempts from this IP for this salon, please try again after 15 minutes',
});

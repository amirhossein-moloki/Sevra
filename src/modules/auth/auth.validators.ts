import { z } from 'zod';
import { SessionActorType } from '@prisma/client';

export const loginSchema = z.object({
  body: z.object({
    phone: z.string().min(10, 'Phone number must be at least 10 digits'),
    password: z.string().optional(),
    actorType: z.nativeEnum(SessionActorType),
    salonId: z.string().optional(), // Required for USER actorType
  }),
}).refine(data => {
  if (data.body.actorType === 'USER') {
    return !!data.body.password && !!data.body.salonId;
  }
  return true;
}, {
  message: 'Password and Salon ID are required for USER login',
  path: ['body'],
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string(),
  }),
});

export const requestOtpSchema = z.object({
  body: z.object({
    phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    phone: z.string().min(10, 'Phone number must be at least 10 digits'),
    code: z.string().length(6, 'OTP code must be 6 digits'),
  }),
});

export const loginWithOtpSchema = z.object({
  body: z.object({
    phone: z.string().min(10, 'Phone number must be at least 10 digits'),
    salonId: z.string().cuid('Invalid Salon ID format'),
  }),
});

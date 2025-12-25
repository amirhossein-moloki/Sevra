import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, 'fullName must be at least 2 characters long'),
    phone: z.string().min(11, 'phone must be at least 11 characters long'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
  }),
  params: z.object({
    salonId: z.string(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    phone: z.string().min(11, 'phone must be at least 11 characters long'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
  }),
  params: z.object({
    salonId: z.string(),
  }),
});

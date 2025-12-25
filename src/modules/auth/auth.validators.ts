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
    message: "Password and Salon ID are required for USER login",
    path: ["body"],
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string(),
  }),
});

import { z } from 'zod';

export const createServiceSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'نام سرویس باید حداقل ۳ کاراکتر باشد'),
    durationMinutes: z.number().int().positive('مدت زمان باید عدد صحیح مثبت باشد'),
    price: z.number().int().min(0, 'قیمت نمی‌تواند منفی باشد'),
    currency: z.string().default('IRR'),
    isActive: z.boolean().default(true),
  }),
});

export const updateServiceSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'نام سرویس باید حداقل ۳ کاراکتر باشد').optional(),
    durationMinutes: z.number().int().positive('مدت زمان باید عدد صحیح مثبت باشد').optional(),
    price: z.number().int().min(0, 'قیمت نمی‌تواند منفی باشد').optional(),
    currency: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>['body'];
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>['body'];

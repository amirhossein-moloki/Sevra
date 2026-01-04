import { z } from 'zod';
import cuid from 'cuid';

export const InitPaymentValidators = z.object({
  params: z.object({
    salonId: z.string().refine((val) => cuid.isCuid(val), {
      message: 'Invalid salonId',
    }),
    bookingId: z.string().refine((val) => cuid.isCuid(val), {
      message: 'Invalid bookingId',
    }),
  }),
});

import { z } from 'zod';

export const AnalyticsQuerySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type AnalyticsQuery = z.infer<typeof AnalyticsQuerySchema>;

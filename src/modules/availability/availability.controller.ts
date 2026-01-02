import { Request, Response, NextFunction } from 'express';
import { getAvailabilityQuerySchema } from './availability.validators';
import { getAvailableSlots } from './availability.service';
import { z } from 'zod';

// We need a schema for URL params as well
const paramsSchema = z.object({
  salonSlug: z.string(),
});

export const getAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { salonSlug } = paramsSchema.parse(req.params);
    const query = getAvailabilityQuerySchema.parse(req.query);

    const slots = await getAvailableSlots({ ...query, salonSlug });

    res.status(200).json(slots);
  } catch (error) {
    next(error); // Pass errors to the global error handler
  }
};

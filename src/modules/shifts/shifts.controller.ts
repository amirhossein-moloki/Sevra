import { Request, Response, NextFunction } from 'express';
import * as shiftsService from './shifts.service';
import { UpsertShiftsInput } from './shifts.validators';

export const upsertShiftsController = async (
  req: Request<{ salonId: string; userId: string }, {}, UpsertShiftsInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { salonId, userId } = req.params;
    const shifts = await shiftsService.upsertShifts(salonId, userId, req.body);
    res.ok(shifts);
  } catch (error) {
    next(error);
  }
};

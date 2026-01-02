import * as shiftsRepo from './shifts.repo';
import { UpsertShiftsInput } from './shifts.validators';
import * as userRepo from '../users/users.repo';
import AppError from '../../common/errors/AppError';

export const upsertShifts = async (
  salonId: string,
  userId: string,
  shifts: UpsertShiftsInput
) => {
  // First, verify that the user exists
  const user = await userRepo.findUserById(salonId, userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const result = await shiftsRepo.upsertShifts(salonId, userId, shifts);
  return result;
};

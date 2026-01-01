import * as userRepo from './users.repo';
import { CreateUserInput, UpdateUserInput } from './users.validators';
import AppError from '../../common/errors/AppError';

export const createStaffMember = async (
  salonId: string,
  data: CreateUserInput
) => {
  // The database schema has a unique constraint on (salonId, phone),
  // so Prisma will throw a specific error if a duplicate is found.
  // We can catch this in the controller to return a 409 Conflict error.
  const newUser = await userRepo.createUser(salonId, data);
  return newUser;
};

export const getStaffList = async (salonId: string) => {
  const staff = await userRepo.listUsersBySalon(salonId);
  return staff;
};

export const updateStaffMember = async (
  salonId: string,
  userId: string,
  data: UpdateUserInput
) => {
  const existingUser = await userRepo.findUserById(salonId, userId);
  if (!existingUser) {
    throw new AppError('Staff member not found', 404);
  }

  await userRepo.updateUser(salonId, userId, data);

  // Return the updated user data
  const updatedUser = await userRepo.findUserById(salonId, userId);
  return updatedUser;
};

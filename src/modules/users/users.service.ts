import * as userRepo from './users.repo';
import { CreateUserInput, UpdateUserInput, ListUsersQuery } from './users.validators';
import AppError from '../../common/errors/AppError';
import { SessionActorType } from '@prisma/client';
import { auditService } from '../audit/audit.service';

export const createStaffMember = async (
  salonId: string,
  data: CreateUserInput,
  actor: { id: string; actorType: SessionActorType },
  context?: { ip?: string; userAgent?: string }
) => {
  // The database schema has a unique constraint on (salonId, phone),
  // so Prisma will throw a specific error if a duplicate is found.
  // We can catch this in the controller to return a 409 Conflict error.
  const newUser = await userRepo.createUser(salonId, data);

  await auditService.recordLog({
    salonId,
    actorId: actor.id,
    actorType: actor.actorType,
    action: 'USER_CREATE',
    entity: 'User',
    entityId: newUser.id,
    newData: newUser,
    ipAddress: context?.ip,
    userAgent: context?.userAgent,
  });

  return newUser;
};

export const getStaffList = async (salonId: string, query: ListUsersQuery) => {
  const staff = await userRepo.listUsersBySalon(salonId, query);
  return staff;
};

export const getStaffMember = async (salonId: string, userId: string) => {
  const user = await userRepo.findUserById(salonId, userId);
  if (!user) {
    throw new AppError('Staff member not found', 404);
  }
  return user;
};

export const updateStaffMember = async (
  salonId: string,
  userId: string,
  data: UpdateUserInput,
  actor: { id: string; actorType: SessionActorType },
  context?: { ip?: string; userAgent?: string }
) => {
  const existingUser = await userRepo.findUserById(salonId, userId);
  if (!existingUser) {
    throw new AppError('Staff member not found', 404);
  }

  await userRepo.updateUser(salonId, userId, data);

  // Return the updated user data
  const updatedUser = await userRepo.findUserById(salonId, userId);

  await auditService.recordLog({
    salonId,
    actorId: actor.id,
    actorType: actor.actorType,
    action: 'USER_UPDATE',
    entity: 'User',
    entityId: userId,
    oldData: existingUser,
    newData: updatedUser,
    ipAddress: context?.ip,
    userAgent: context?.userAgent,
  });

  return updatedUser;
};

export const deleteStaffMember = async (
  salonId: string,
  userId: string,
  actor: { id: string; actorType: SessionActorType },
  context?: { ip?: string; userAgent?: string }
) => {
  const existingUser = await userRepo.findUserById(salonId, userId);
  if (!existingUser) {
    throw new AppError('Staff member not found', 404);
  }

  await userRepo.softDeleteUser(salonId, userId);

  await auditService.recordLog({
    salonId,
    actorId: actor.id,
    actorType: actor.actorType,
    action: 'USER_DELETE',
    entity: 'User',
    entityId: userId,
    oldData: existingUser,
    newData: { isActive: false },
    ipAddress: context?.ip,
    userAgent: context?.userAgent,
  });
};

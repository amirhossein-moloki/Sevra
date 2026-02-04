import { Response, NextFunction } from 'express';
import * as userService from './users.service';
import { CreateUserInput, UpdateUserInput } from './users.validators';
import { AppRequest } from '../../types/express';

export const createUserController = async (
  req: AppRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { salonId } = req.params;
    const newUser = await userService.createStaffMember(
      salonId,
      req.body,
      req.actor,
      { ip: req.ip, userAgent: req.headers['user-agent'] }
    );
    res.created(newUser);
  } catch (error) {
    next(error);
  }
};

export const deleteUserController = async (
  req: AppRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { salonId, userId } = req.params;
    await userService.deleteStaffMember(
      salonId,
      userId,
      req.actor,
      { ip: req.ip, userAgent: req.headers['user-agent'] }
    );
    res.noContent();
  } catch (error) {
    next(error);
  }
};

export const getUsersController = async (
  req: AppRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { salonId } = req.params;
    const staff = await userService.getStaffList(salonId);
    res.ok(staff);
  } catch (error) {
    next(error);
  }
};

export const getUserController = async (
  req: AppRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { salonId, userId } = req.params;
    const user = await userService.getStaffMember(salonId, userId);
    res.ok(user);
  } catch (error) {
    next(error);
  }
};

export const updateUserController = async (
  req: AppRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { salonId, userId } = req.params;
    const updatedUser = await userService.updateStaffMember(
      salonId,
      userId,
      req.body,
      req.actor,
      { ip: req.ip, userAgent: req.headers['user-agent'] }
    );
    res.ok(updatedUser);
  } catch (error) {
    next(error);
  }
};

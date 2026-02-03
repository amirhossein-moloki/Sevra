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
    res.status(201).json({ success: true, data: newUser });
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
    res.status(204).send();
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
    res.status(200).json({ success: true, data: staff });
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
    res.status(200).json({ success: true, data: user });
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
    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    next(error);
  }
};

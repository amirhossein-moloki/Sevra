import { Request, Response, NextFunction } from 'express';
import * as userService from './users.service';
import { CreateUserInput, UpdateUserInput } from './users.validators';

export const createUserController = async (
  req: Request<{ salonId: string }, {}, CreateUserInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { salonId } = req.params;
    const newUser = await userService.createStaffMember(salonId, req.body);
    res.status(201).json({ success: true, data: newUser });
  } catch (error) {
    next(error);
  }
};

export const deleteUserController = async (
  req: Request<{ salonId: string; userId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { salonId, userId } = req.params;
    await userService.deleteStaffMember(salonId, userId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const getUsersController = async (
  req: Request<{ salonId: string }>,
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
  req: Request<{ salonId: string, userId: string }>,
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
  req: Request<{ salonId: string; userId: string }, {}, UpdateUserInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { salonId, userId } = req.params;
    const updatedUser = await userService.updateStaffMember(
      salonId,
      userId,
      req.body
    );
    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    next(error);
  }
};

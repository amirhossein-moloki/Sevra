import { Request, Response, NextFunction } from 'express';
import * as userService from './users.service';
import { CreateUserInput, UpdateUserInput } from './users.validators';
import { Prisma } from '@prisma/client';

export const createUserController = async (
  req: Request<{ salonId: string }, {}, CreateUserInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { salonId } = req.params;
    const newUser = await userService.createStaffMember(salonId, req.body);
    res.status(201).json(newUser);
  } catch (error) {
    // Handle unique constraint violation (e.g., duplicate phone number)
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return res.status(409).json({ message: 'A user with this phone number already exists in this salon.' });
    }
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
    res.status(200).json(staff);
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
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
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
    res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
};

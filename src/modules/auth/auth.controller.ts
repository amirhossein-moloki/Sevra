import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { SessionActorType } from '@prisma/client';

const authService = new AuthService();

export const login = async (req: Request, res: Response) => {
  const { phone, password, actorType, salonId } = req.body;

  let result;
  if (actorType === SessionActorType.USER) {
    result = await authService.loginUser(phone, password, salonId);
  } else {
    result = await authService.loginCustomer(phone);
  }

  res.success({ data: result });
};

export const refresh = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const result = await authService.refreshAuthToken(refreshToken);
  res.success({ data: result });
};

export const logout = async (req: Request, res: Response) => {
  // Assuming session ID is available on req.user after authentication middleware
  const sessionId = (req as any).user?.sessionId;
  const result = await authService.logout(sessionId);
  res.success({ data: result });
};

export const me = async (req: Request, res: Response) => {
  // The user/customer object should be attached to the request by the auth middleware
  const user = (req as any).user;
  res.success({ data: user });
};

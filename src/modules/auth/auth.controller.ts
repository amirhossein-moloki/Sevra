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

  res.ok(result);
};

export const requestUserOtp = async (req: Request, res: Response) => {
    const { phone } = req.body;
    const result = await authService.requestUserOtp(phone);
    res.ok(result);
};

export const verifyUserOtp = async (req: Request, res: Response) => {
    const { phone, code } = req.body;
    const result = await authService.verifyUserOtp(phone, code);
    res.ok(result);
};

export const loginUserWithOtp = async (req: Request, res: Response) => {
    const { phone, salonId } = req.body;
    const result = await authService.loginUserWithOtp(phone, salonId);
    res.ok(result);
};

export const refresh = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const result = await authService.refreshAuthToken(refreshToken);
  res.ok(result);
};

export const logout = async (req: Request, res: Response) => {
  // Assuming session ID is available on req.actor after authentication middleware
  const sessionId = (req as any).actor?.sessionId;
  const result = await authService.logout(sessionId);
  res.ok(result);
};

export const me = async (req: Request, res: Response) => {
  // The user/customer object should be attached to the request by the auth middleware
  const actor = (req as any).actor;
  res.ok(actor);
};

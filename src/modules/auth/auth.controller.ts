import { Response } from 'express';
import { AuthService } from './auth.service';
import { SessionActorType } from '@prisma/client';
import { AuthRequest } from '../../common/middleware/auth';

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

export const requestUserOtp = async (req: Request, res: Response) => {
    const { phone } = req.body;
    const result = await authService.requestUserOtp(phone);
    res.success({ data: result });
};

export const verifyUserOtp = async (req: Request, res: Response) => {
    const { phone, code } = req.body;
    const result = await authService.verifyUserOtp(phone, code);
    res.success({ data: result });
};

export const loginUserWithOtp = async (req: Request, res: Response) => {
    const { phone, salonId } = req.body;
    const result = await authService.loginUserWithOtp(phone, salonId);
    res.success({ data: result });
};

export const refresh = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const result = await authService.refreshAuthToken(refreshToken);
  res.success({ data: result });
};

export const logout = async (req: AuthRequest, res: Response) => {
  const sessionId = req.actor?.sessionId;
  // We need to ensure sessionId is not undefined.
  // The auth middleware should guarantee this, but it's good practice to check.
  if (!sessionId) {
    return res.status(401).json({ success: false, error: { message: 'Invalid session' } });
  }
  const result = await authService.logout(sessionId);
  res.success({ data: result });
};

export const me = async (req: AuthRequest, res: Response) => {
  // The actor object is attached to the request by the auth middleware
  res.success({ data: req.actor });
};

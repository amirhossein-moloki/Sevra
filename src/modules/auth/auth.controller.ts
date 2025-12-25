import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';

const authService = new AuthService();

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await authService.register({ ...req.body, salonId: req.params.salonId });
    res.status(201).json({ message: 'User registered successfully', user });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user, token } = await authService.login({ ...req.body, salonId: req.params.salonId });
    res.status(200).json({ message: 'Login successful', user, token });
  } catch (error) {
    next(error);
  }
};

export const logout = (req: Request, res: Response) => {
  // In a stateless JWT setup, logout is typically handled on the client-side
  // by deleting the token. The server can provide an endpoint for this for
  // consistency, but there's no server-side session to invalidate.
  res.status(200).json({ message: 'User logged out successfully' });
};

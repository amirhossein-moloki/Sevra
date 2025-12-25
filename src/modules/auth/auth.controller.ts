import { Request, Response } from 'express';

export const register = (req: Request, res: Response) => {
  res.status(200).json({ message: 'User registered successfully' });
};

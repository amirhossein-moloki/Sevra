// src/common/middleware/__mocks__/auth.ts
import { Request, Response, NextFunction } from 'express';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // In our tests, we'll manually set the user on the request object
  // to simulate an authenticated user.
  if (req.headers.authorization) {
    const token = req.headers.authorization.split(' ')[1];
    if (token === 'mock-manager-token') {
      req.user = { id: 'mock-manager-id', role: 'MANAGER' };
    } else if (token === 'mock-staff-token') {
      req.user = { id: 'mock-staff-id', role: 'STAFF' };
    }
  }
  next();
};

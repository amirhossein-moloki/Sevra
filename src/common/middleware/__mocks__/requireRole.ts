// src/common/middleware/__mocks__/requireRole.ts
import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';

export const requireRole = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // In our tests, the user object is manually set.
    // We'll check the role on that object.
    if (req.user && roles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ message: 'Forbidden' });
    }
  };
};

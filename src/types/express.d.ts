
// src/types/express.d.ts
import { User } from '@prisma/client';
import { Request } from 'express';

// Extend the Express Request interface to include our custom properties
declare global {
  namespace Express {
    export interface Request {
      user?: User; // User property is added by authMiddleware
      salonId?: string; // salonId is added by various middlewares for panel routes
      id?: string;
      requestId?: string;
    }
  }
}

// You can also define a custom request type for convenience if you have routes
// where these properties are guaranteed to exist.
export interface AppRequest extends Request {
  // Example of a route where user and salonId are guaranteed
  user: User;
  salonId: string;
}

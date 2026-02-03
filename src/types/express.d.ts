
// src/types/express.d.ts
import { UserRole } from '@prisma/client';
import { Request } from 'express';

// Extend the Express Request interface to include our custom properties
declare global {
  namespace Express {
    export interface Request {
      actor?: {
        id?: string;
        actorId?: string;
        role?: UserRole;
        salonId?: string;
      };
      salonId?: string; // salonId is added by various middlewares for panel routes
      id?: string;
      requestId?: string;
      rawBody?: Buffer;
    }
  }
}

// You can also define a custom request type for convenience if you have routes
// where these properties are guaranteed to exist.
export interface AppRequest extends Request {
  actor: {
    id: string;
    actorId?: string;
    role: UserRole;
    salonId?: string;
  };
  tenant: { salonId: string };
}


// src/types/express.d.ts
import { SessionActorType, UserRole } from '@prisma/client';
import { Request, Response } from 'express';
import { ApiMeta } from '../common/utils/response';

// Extend the Express Request interface to include our custom properties
declare global {
  namespace Express {
    export interface Request {
      actor?: {
        id?: string;
        actorId?: string;
        role?: UserRole;
        salonId?: string;
        actorType?: SessionActorType;
      };
      salonId?: string; // salonId is added by various middlewares for panel routes
      id?: string;
      requestId?: string;
    }

    export interface Response {
      ok<T>(data: T, meta?: Omit<ApiMeta, 'requestId'>): Response;
      created<T>(data: T, meta?: Omit<ApiMeta, 'requestId'>): Response;
      noContent(): Response;
      fail(
        code: string,
        message: string,
        status?: number,
        details?: unknown,
        meta?: Omit<ApiMeta, 'requestId'>
      ): Response;
    }
  }
}

// You can also define a custom request type for convenience if you have routes
// where these properties are guaranteed to exist.
export interface AppRequest extends Request {
  actor: {
    id: string;
    actorId?: string;
    role?: UserRole;
    salonId?: string;
    actorType: SessionActorType;
  };
  tenant: { salonId: string };
}


import { SessionActorType, UserRole } from '@prisma/client';
import { Request, Response } from 'express';
import { ApiMeta } from '../common/utils/response';

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
      salonId?: string;
      id?: string;
      requestId?: string;
      rawBody?: Buffer;
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

export interface AppRequest extends Request {
  actor: {
    id: string;
    actorId?: string;
    role?: UserRole;
    salonId?: string;
    actorType: SessionActorType;
  };
  tenant: { salonId: string };
  salonId?: string;
  id?: string;
}

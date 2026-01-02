// src/types/express.d.ts
import { User, CustomerAccount } from '@prisma/client';
import { Request } from 'express';

// Extend the Express Request interface
declare global {
  namespace Express {
    export interface Request {
      id?: string;
      actor?: (User | CustomerAccount) & { actorId: string; actorType: string; salonId: string; };
    }
  }
}

export interface AppRequest extends Request {
    salonId: string;
    actorId: string;
}

// src/types/express.d.ts
import { User, CustomerAccount } from '@prisma/client';

// Extend the Express Request interface
declare global {
  namespace Express {
    export interface Request {
      id?: string;
      actor?: (User | CustomerAccount) & { actorId: string; actorType: string };
    }
  }
}

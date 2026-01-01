import { Salon } from '@prisma/client';

declare namespace Express {
  export interface Request {
    id: string;
    salon?: Salon;
  }
}

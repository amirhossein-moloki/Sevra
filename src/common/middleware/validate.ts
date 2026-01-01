import { Request, Response, NextFunction } from 'express';
import { ZodObject, ZodError } from 'zod';
import createHttpError from 'http-errors';

export const validate =
  (schema: ZodObject<any>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(error);
      }
      return next(createHttpError(500, 'Internal server error'));
    }
  };

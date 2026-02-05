import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import createHttpError from 'http-errors';

export const validate =
  (schema: ZodSchema<any>) => // eslint-disable-line @typescript-eslint/no-explicit-any
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

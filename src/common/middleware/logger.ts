import { Request, Response, NextFunction } from 'express';

let loggerMiddleware;

if (process.env.NODE_ENV === 'test') {
  // In a test environment, export a mock middleware to avoid pino-http issues with Jest
  loggerMiddleware = (req: Request, res: Response, next: NextFunction) => next();
} else {
  // In other environments, use the actual pino-http logger
  const pinoHttp = require('pino-http');
  const logger = require('../../config/logger').default;

  loggerMiddleware = pinoHttp({
    logger,
    customLogLevel: function (req: Request, res: Response, err?: Error) {
      if (res.statusCode >= 400 && res.statusCode < 500) {
        return 'warn';
      } else if (res.statusCode >= 500 || err) {
        return 'error';
      }
      return 'info';
    },
    customSuccessMessage: function (req: Request, res: Response) {
      if (res.statusCode === 404) {
        return 'resource not found';
      }
      return `${req.method} ${req.url} completed`;
    },
    customProps: function (req: Request, res: Response) {
      return {
        body: req.body,
      };
    },
  });
}

export default loggerMiddleware;

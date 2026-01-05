import { Request, Response, NextFunction } from 'express';

let loggerMiddleware;

if (process.env.NODE_ENV === 'test') {
  // In a test environment, export a mock middleware to avoid pino-http issues with Jest
  loggerMiddleware = (req: Request, res: Response, next: NextFunction) => next();
} else {
  // In other environments, use the actual pino-http logger
  const pinoHttp = require('pino-http');
  const logger = require('../../config/logger').default;
  const { sanitizeLog } = require('../utils/sanitizer');

  const cuid = require('cuid');

  loggerMiddleware = pinoHttp({
    logger,
    genReqId: function (req, res) {
      const existingId = req.id ?? req.headers["x-request-id"];
      if (existingId) return existingId;
      const id = cuid();
      res.setHeader('X-Request-Id', id);
      return id;
    },
    customAttributeKeys: {
      req: 'request',
      res: 'response',
      err: 'error',
      responseTime: 'duration',
      reqId: 'requestId',
    },
    customProps: function (req, res) {
      return {
        actorId: req.actor?.id || null,
        salonId: req.params?.salonId || null,
      };
    },
    // Use serializers to sanitize sensitive fields from the log output.
    serializers: {
      req(req) {
        // Sanitize headers and body before they are logged.
        req.headers = sanitizeLog(req.headers);
        req.body = sanitizeLog(req.body);
        return req;
      },
      res(res) {
        // Sanitize headers from the response.
        res.headers = sanitizeLog(res.headers);
        return res;
      },
    },
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
  });
}

export default loggerMiddleware;

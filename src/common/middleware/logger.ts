import pinoHttp from 'pino-http';
import logger from '../../config/logger';
import { Request } from 'express';

const loggerMiddleware = pinoHttp({
  logger,
  customLogLevel: function (req, res, err) {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      return 'warn';
    } else if (res.statusCode >= 500 || err) {
      return 'error';
    }
    return 'info';
  },
  customSuccessMessage: function (req, res) {
    if (res.statusCode === 404) {
      return 'resource not found';
    }
    return `${req.method} ${req.url} completed`;
  },
  // Use customProps to log the request body
  customProps: function (req, res) {
    return {
      body: (req as Request).body,
    };
  },
});

export default loggerMiddleware;

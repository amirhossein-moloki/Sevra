import pino from 'pino';
import { env } from './env';

const isProduction = env.NODE_ENV === 'production';

const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: ['password', 'token', 'authorization', 'body.password'],
    censor: '[REDACTED]',
  },
  transport: isProduction
    ? {
      target: 'pino/file',
      options: { destination: './app.log' },
    }
    : {
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'pid,hostname',
        translateTime: 'SYS:standard',
      },
    },
});

export default logger;

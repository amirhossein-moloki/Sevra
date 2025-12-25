import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
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

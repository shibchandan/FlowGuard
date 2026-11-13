// src/config/logger.ts
// Pino logger configuration.

import pino from 'pino';

const isDevelopment = process.env['NODE_ENV'] !== 'production';

export const logger = pino(
  {
    level: isDevelopment ? 'debug' : 'info',
    base: {
      pid: process.pid,
      env: process.env['NODE_ENV'],
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label: string) => ({ level: label }),
    },
  },
  isDevelopment
    ? pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      })
    : undefined,
);

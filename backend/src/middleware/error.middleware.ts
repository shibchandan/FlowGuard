// src/middleware/error.middleware.ts
// Global Express error handler.

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/errors/AppError';
import { logger } from '../config/logger';

interface ErrorWithDetails extends AppError {
  details?: unknown;
}

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  const isProduction = process.env['NODE_ENV'] === 'production';

  if (err instanceof AppError && err.isOperational) {
    const appErr = err as ErrorWithDetails;
    res.status(appErr.statusCode).json({
      success: false,
      message: appErr.message,
      error: {
        code: appErr.code,
        ...(appErr.details !== undefined ? { details: appErr.details } : {}),
      },
    });
    return;
  }

  // Unexpected / programmer errors
  logger.error({ err }, 'Unhandled error');

  res.status(500).json({
    success: false,
    message: isProduction ? 'Internal server error' : (err.message || 'Internal server error'),
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      ...(!isProduction && err.stack ? { stack: err.stack } : {}),
    },
  });
}

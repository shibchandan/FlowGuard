// src/shared/utils/response.ts
// Standardised HTTP response helpers.

import { Response } from 'express';
import { PaginationMeta } from '../types';

export function success<T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
): void {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function error(
  res: Response,
  message: string,
  code: string,
  statusCode = 500,
  details?: unknown,
): void {
  res.status(statusCode).json({
    success: false,
    message,
    error: {
      code,
      ...(details !== undefined ? { details } : {}),
    },
  });
}

export function paginated<T>(
  res: Response,
  data: T[],
  pagination: PaginationMeta,
  message = 'Success',
): void {
  res.status(200).json({
    success: true,
    message,
    data,
    pagination,
  });
}

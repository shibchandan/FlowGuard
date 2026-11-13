// src/middleware/validate.middleware.ts
// Zod schema validation middleware factory.

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../shared/errors/AppError';

/**
 * Returns middleware that validates req.body against the given Zod schema.
 * On failure it passes a 422 AppError with field-level details.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const zodError = result.error as ZodError;
      const details = zodError.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));

      return next(
        Object.assign(
          new AppError(422, 'VALIDATION_ERROR', 'Request validation failed'),
          { details },
        ),
      );
    }

    // Replace body with parsed (and coerced) data
    req.body = result.data;
    next();
  };
}

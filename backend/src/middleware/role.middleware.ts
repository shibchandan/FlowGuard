// src/middleware/role.middleware.ts
// Role-based access control middleware factory.

import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../shared/enums';
import { AppError } from '../shared/errors/AppError';

/**
 * Returns middleware that restricts access to users whose role is included
 * in the provided list of allowed roles.
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError(401, 'UNAUTHORIZED', 'Authentication required'));
    }

    if (!roles.includes(req.user.role as UserRole)) {
      return next(
        new AppError(
          403,
          'FORBIDDEN',
          `Access denied. Required roles: ${roles.join(', ')}`,
        ),
      );
    }

    next();
  };
}

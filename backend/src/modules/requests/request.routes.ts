// src/modules/requests/request.routes.ts
import { Router } from 'express';
import {
  submitRequestHandler,
  listRequestsHandler,
  getRequestHandler,
  getRequestHistoryHandler,
} from './request.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import { submitRequestSchema } from './request.schema';
import { UserRole } from '../../shared/enums';

const router = Router();

router.use(authenticate);

// List and view details: all authenticated users
router.get('/', listRequestsHandler);
router.get('/:id', getRequestHandler);
router.get('/:id/history', getRequestHistoryHandler);

// Submit: ADMIN, OPERATOR
router.post(
  '/',
  requireRole(UserRole.ADMIN, UserRole.OPERATOR),
  validate(submitRequestSchema),
  submitRequestHandler,
);

export default router;

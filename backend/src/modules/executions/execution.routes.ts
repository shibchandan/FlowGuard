// src/modules/executions/execution.routes.ts
import { Router } from 'express';
import {
  listExecutionsHandler,
  getExecutionHandler,
  getExecutionAuditHandler,
  retryExecutionHandler,
} from './execution.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { UserRole } from '../../shared/enums';

const router = Router();

router.use(authenticate);

router.get('/', listExecutionsHandler);
router.get('/:id', getExecutionHandler);
router.get('/:id/audit', getExecutionAuditHandler);

// Retry: ADMIN or OPERATOR
router.post(
  '/:id/retry',
  requireRole(UserRole.ADMIN, UserRole.OPERATOR),
  retryExecutionHandler,
);

export default router;

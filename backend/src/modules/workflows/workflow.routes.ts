// src/modules/workflows/workflow.routes.ts
import { Router } from 'express';
import {
  listWorkflowsHandler,
  getWorkflowHandler,
  createWorkflowHandler,
  updateWorkflowHandler,
  getWorkflowVersionsHandler,
  createWorkflowVersionHandler,
  publishWorkflowVersionHandler,
} from './workflow.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createWorkflowSchema, updateWorkflowSchema } from './workflow.schema';
import { UserRole } from '../../shared/enums';

const router = Router();

router.use(authenticate);

// Public to all authenticated users
router.get('/', listWorkflowsHandler);
router.get('/:id', getWorkflowHandler);
router.get('/:id/versions', getWorkflowVersionsHandler);

// Admin only endpoints
router.post(
  '/',
  requireRole(UserRole.ADMIN),
  validate(createWorkflowSchema),
  createWorkflowHandler,
);

router.put(
  '/:id',
  requireRole(UserRole.ADMIN),
  validate(updateWorkflowSchema),
  updateWorkflowHandler,
);

router.post(
  '/:id/versions',
  requireRole(UserRole.ADMIN),
  createWorkflowVersionHandler,
);

router.post(
  '/:id/versions/:versionId/publish',
  requireRole(UserRole.ADMIN),
  publishWorkflowVersionHandler,
);

router.post(
  '/:id/publish',
  requireRole(UserRole.ADMIN),
  publishWorkflowVersionHandler,
);

export default router;

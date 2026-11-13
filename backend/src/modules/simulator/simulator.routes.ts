// src/modules/simulator/simulator.routes.ts
import { Router } from 'express';
import {
  getSimulatorHandler,
  updateSimulatorHandler,
  updateSimulatorSchema,
} from './simulator.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import { UserRole } from '../../shared/enums';

const router = Router();

router.use(authenticate);
router.use(requireRole(UserRole.ADMIN));

router.get('/simulator', getSimulatorHandler);
router.put('/simulator', validate(updateSimulatorSchema), updateSimulatorHandler);

export default router;

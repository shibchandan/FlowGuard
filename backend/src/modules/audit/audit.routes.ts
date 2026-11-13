// src/modules/audit/audit.routes.ts
import { Router } from 'express';
import { listAuditLogsHandler } from './audit.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/', listAuditLogsHandler);

export default router;

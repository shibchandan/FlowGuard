// src/modules/dashboard/dashboard.routes.ts
import { Router } from 'express';
import {
  getSummaryHandler,
  getRecentActivityHandler,
} from './dashboard.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/summary', getSummaryHandler);
router.get('/stats', getSummaryHandler);
router.get('/activity', getRecentActivityHandler);
router.get('/recent-activity', getRecentActivityHandler);

export default router;

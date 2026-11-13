// src/modules/reviews/review.routes.ts
import { Router } from 'express';
import {
  listReviewsHandler,
  getReviewHandler,
  submitDecisionHandler,
  approveReviewHandler,
  rejectReviewHandler,
  reviewDecisionSchema,
} from './review.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import { UserRole } from '../../shared/enums';

const router = Router();

router.use(authenticate);

// List and view: ADMIN, REVIEWER
router.get('/', requireRole(UserRole.ADMIN, UserRole.REVIEWER), listReviewsHandler);
router.get('/:id', requireRole(UserRole.ADMIN, UserRole.REVIEWER), getReviewHandler);

// Decisions: ADMIN, REVIEWER
router.post(
  '/:id/decision',
  requireRole(UserRole.ADMIN, UserRole.REVIEWER),
  validate(reviewDecisionSchema),
  submitDecisionHandler,
);

router.post(
  '/:id/approve',
  requireRole(UserRole.ADMIN, UserRole.REVIEWER),
  approveReviewHandler,
);

router.post(
  '/:id/reject',
  requireRole(UserRole.ADMIN, UserRole.REVIEWER),
  rejectReviewHandler,
);

export default router;

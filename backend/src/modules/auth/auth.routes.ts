// src/modules/auth/auth.routes.ts
import { Router } from 'express';
import { loginHandler, getMeHandler } from './auth.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { loginSchema } from './auth.schema';

const router = Router();

router.post('/login', validate(loginSchema), loginHandler);
router.get('/me', authenticate, getMeHandler);

export default router;

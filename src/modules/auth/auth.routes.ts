import { Router } from 'express';
import { login, refresh, logout, me } from './auth.controller';
import { validate } from '../../common/middleware/validate';
import { loginSchema, refreshSchema } from './auth.validators';
import { authMiddleware } from '../../common/middleware/auth';

const router = Router();

router.post('/login', validate(loginSchema), login);
router.post('/refresh', validate(refreshSchema), refresh);

// Protected routes
router.post('/logout', authMiddleware, logout);
router.get('/me', authMiddleware, me);

export default router;

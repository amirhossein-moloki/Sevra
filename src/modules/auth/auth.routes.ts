import { Router } from 'express';
import { register, login, logout } from './auth.controller';
import { validate } from '../../common/middleware/validate';
import { registerSchema, loginSchema } from './auth.validators';

const router = Router();

router.post('/:salonId/register', validate(registerSchema), register);
router.post('/:salonId/login', validate(loginSchema), login);
router.post('/:salonId/logout', logout);

export default router;

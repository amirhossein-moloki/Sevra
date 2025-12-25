import { Router } from 'express';
import { register } from './auth.controller';
import { validate } from '../../common/middleware/validate';
import { registerSchema } from './auth.validators';

const router = Router();

router.post('/register', validate(registerSchema), register);

export default router;

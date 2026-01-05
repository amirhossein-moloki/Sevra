import { Router } from 'express';
import {
    login,
    refresh,
    logout,
    me,
    requestUserOtp,
    verifyUserOtp,
    loginUserWithOtp
} from './auth.controller';
import { validate } from '../../common/middleware/validate';
import {
    loginSchema,
    refreshSchema,
    requestOtpSchema,
    verifyOtpSchema,
    loginWithOtpSchema
} from './auth.validators';
import { authMiddleware } from '../../common/middleware/auth';
import { publicApiRateLimiter } from '../../common/middleware/rateLimit';

const router = Router();

router.use(publicApiRateLimiter);

// --- User OTP Flow ---
router.post('/user/otp/request', validate(requestOtpSchema), requestUserOtp);
router.post('/user/otp/verify', validate(verifyOtpSchema), verifyUserOtp);
router.post('/user/login/otp', validate(loginWithOtpSchema), loginUserWithOtp);

// --- Classic Login ---
router.post('/login', validate(loginSchema), login);
router.post('/refresh', validate(refreshSchema), refresh);


// --- Protected ---
router.post('/logout', authMiddleware, logout);
router.get('/me', authMiddleware, me);

export default router;

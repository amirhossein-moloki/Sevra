import { Router } from 'express';
import {
  login,
  refresh,
  logout,
  me,
  requestUserOtp,
  verifyUserOtp,
  loginUserWithOtp,
  requestCustomerOtp,
  verifyCustomerOtp
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
import { env } from '../../config/env';

const router = Router();

if (env.NODE_ENV !== 'test') {
  router.use(publicApiRateLimiter);
}

// --- User OTP Flow ---
router.post('/user/otp/request', validate(requestOtpSchema), requestUserOtp);
router.post('/user/otp/verify', validate(verifyOtpSchema), verifyUserOtp);
router.post('/user/login/otp', validate(loginWithOtpSchema), loginUserWithOtp);

// --- Customer OTP Flow ---
router.post('/customer/otp/request', validate(requestOtpSchema), requestCustomerOtp);
router.post('/customer/otp/verify', validate(verifyOtpSchema), verifyCustomerOtp);

// --- Classic Login ---
router.post('/login', validate(loginSchema), login);
router.post('/refresh', validate(refreshSchema), refresh);


// --- Protected ---
router.post('/logout', authMiddleware, logout);
router.get('/me', authMiddleware, me);

export default router;

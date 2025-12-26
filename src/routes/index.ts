import { Router } from 'express';
import healthRouter from './health.routes';
import authRouter from '../modules/auth/auth.routes';
import servicesRouter from '../modules/services/services.routes';

const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);

// Mount services routes under a salon context
router.use('/salons/:salonId/services', servicesRouter);

export default router;

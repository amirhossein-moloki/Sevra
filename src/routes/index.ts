import { Router } from 'express';
import healthRouter from './health.routes';
import authRouter from '../modules/auth/auth.routes';
import salonRouter from '../modules/salon/salon.routes';

// Import the new service routers
import {
  privateServiceRouter,
  publicServiceRouter,
} from '../modules/services/services.routes';
import staffRouter from '../modules/users/users.routes';

const router = Router();

// --- Existing Routes ---
router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/salons', salonRouter);

// --- Service Module Routes ---
// Mount the private router under the salon-specific path
router.use('/salons/:salonId/services', privateServiceRouter);

// Mount the public router under the public salon path
router.use('/public/salons/:salonSlug/services', publicServiceRouter);

// --- Staff Module Routes ---
router.use('/salons/:salonId/staff', staffRouter);


export default router;

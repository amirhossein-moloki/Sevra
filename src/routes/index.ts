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
import shiftsRouter from '../modules/shifts/shifts.routes';
import availabilityRouter from '../modules/availability/availability.routes';
import bookingsRoutes from '../modules/bookings/bookings.routes';
import publicBookingsRoutes from '../modules/bookings/bookings.public.routes';
import { paymentsRoutes } from '../modules/payments/payments.routes';
import { webhooksRoutes } from '../modules/webhooks/webhooks.routes';

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

// --- Shifts Module Routes ---
// Nested under staff for clarity
router.use('/salons/:salonId/staff/:userId/shifts', shiftsRouter);

// --- Availability Module Routes ---
router.use('/public/salons/:salonSlug/availability', availabilityRouter);

// --- Bookings Module Routes ---
router.use('/salons/:salonId/bookings', bookingsRoutes);
router.use('/public/salons/:salonSlug/bookings', publicBookingsRoutes);

// --- Payments Module Routes ---
router.use('/salons/:salonId/bookings', paymentsRoutes); // This will be scoped within the booking

// --- Webhooks Module ---
router.use(webhooksRoutes);


export default router;

import { Router } from 'express';
import { WebhooksController } from './webhooks.controller';

const router = Router();

router.post(
  '/webhooks/payments/:provider',
  WebhooksController.handlePaymentWebhook
);

export const webhooksRoutes = router;
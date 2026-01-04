import { Router, json } from 'express';
import { WebhooksController } from './webhooks.controller';
import { verifyPaymentWebhookSignature } from './middleware/verifyPaymentWebhookSignature';

const router = Router();

// This route requires the raw body for signature verification.
// We use express.json() with a verify function to capture it.
router.post(
  '/webhooks/payments/:provider',
  json({
    verify: (req: any, res, buf) => {
      // Attach raw body to the request object
      req.rawBody = buf;
    },
  }),
  verifyPaymentWebhookSignature,
  WebhooksController.handlePaymentWebhook
);

export const webhooksRoutes = router;

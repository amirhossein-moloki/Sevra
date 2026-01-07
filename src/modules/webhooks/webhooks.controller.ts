import { Request, Response } from 'express';
import { asyncHandler } from '../../common/middleware/asyncHandler';
import { WebhooksService } from './webhooks.service';
import httpStatus from 'http-status';

const handlePaymentWebhook = asyncHandler(async (req: Request, res: Response) => {
  const { provider } = req.params;
  const payload = req.body;
  const signature = req.header('X-Signature'); // Example signature header

  await WebhooksService.processPaymentWebhook({
    provider,
    payload,
    signature: signature ?? null,
  });

  res.status(httpStatus.OK).json({
    success: true,
    data: { message: 'Webhook received and processed.' },
  });
});

export const WebhooksController = {
  handlePaymentWebhook,
};

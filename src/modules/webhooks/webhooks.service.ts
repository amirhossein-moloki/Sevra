import { PaymentStatus, IdempotencyStatus, Prisma } from '@prisma/client';
import AppError from '../../common/errors/AppError';
import httpStatus from 'http-status';
import { prisma } from '../../config/prisma';
import { PaymentsRepo } from '../payments/payments.repo';

const processPaymentWebhook = async ({
  provider,
  payload,
}: {
  provider: string;
  payload: { eventId: string; paymentId: string; status: 'SUCCEEDED' | 'FAILED' | 'EXPIRED' };
  signature?: string | null;
}) => {
  const { eventId, paymentId, status: eventStatus } = payload;

  if (!eventId || !paymentId || !eventStatus) {
    throw new AppError('Invalid payload.', httpStatus.BAD_REQUEST);
  }

  const idempotencyScope = `payment-webhook:${provider}`;

  // 1. Check if this event has been processed before
  const existingKey = await prisma.idempotencyKey.findUnique({
    where: { scope_key: { scope: idempotencyScope, key: eventId } },
  });

  if (existingKey) {
    // If it's completed, we're done. Acknowledge receipt.
    // If it failed, we could allow a retry, but for now, we'll just acknowledge.
    // If it's in progress, this is a race condition. Let the provider retry.
    if (existingKey.status === IdempotencyStatus.IN_PROGRESS) {
      throw new AppError('Request is already being processed.', httpStatus.CONFLICT);
    }
    // For COMPLETED or FAILED, we return success to stop retries.
    return;
  }

  // 2. Create the idempotency key before processing
  try {
    await prisma.idempotencyKey.create({
      data: {
        key: eventId,
        scope: idempotencyScope,
        status: IdempotencyStatus.IN_PROGRESS,
        requestHash: eventId, // In a real scenario, hash the whole payload
        // Set a reasonable expiry, e.g., 24 hours
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const racedKey = await prisma.idempotencyKey.findUnique({
        where: { scope_key: { scope: idempotencyScope, key: eventId } },
      });

      if (racedKey) {
        if (racedKey.status === IdempotencyStatus.IN_PROGRESS) {
          throw new AppError('Request is already being processed.', httpStatus.CONFLICT);
        }
        return;
      }
    }
    throw error;
  }

  // 3. Process the event in a transaction
  try {
    await prisma.$transaction(async (tx) => {
      // Find the payment record
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: { booking: true },
      });

      if (!payment) {
        // We still need to mark the idempotency key as failed
        throw new AppError('Payment not found.', httpStatus.NOT_FOUND);
      }

      // Apply the state machine logic
      switch (eventStatus) {
        case 'SUCCEEDED':
          await PaymentsRepo.handleSuccessfulPayment(tx, paymentId);
          break;
        case 'FAILED':
          await PaymentsRepo.handleFailedPayment(tx, paymentId);
          break;
        case 'EXPIRED':
          // Assuming EXPIRED is a type of failure for the booking state
          await PaymentsRepo.handleFailedPayment(tx, paymentId, PaymentStatus.CANCELED);
          break;
        default:
          // Should not happen if payload validation is good
          throw new AppError(`Unknown event status: ${eventStatus}`, httpStatus.BAD_REQUEST);
      }

      // Mark the idempotency key as completed
      await tx.idempotencyKey.update({
        where: { scope_key: { scope: idempotencyScope, key: eventId } },
        data: { status: IdempotencyStatus.COMPLETED },
      });
    });
  } catch (error) {
    // If anything goes wrong, mark the key as failed to allow for potential retries
    await prisma.idempotencyKey.update({
      where: { scope_key: { scope: idempotencyScope, key: eventId } },
      data: { status: IdempotencyStatus.FAILED },
    });
    // Re-throw the original error
    throw error;
  }
};

export const WebhooksService = {
  processPaymentWebhook,
};

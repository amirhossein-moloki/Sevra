import { PaymentStatus, BookingPaymentState, PaymentProvider } from '@prisma/client';
import AppError from '../../common/errors/AppError';
import httpStatus from 'http-status';
import { prisma } from '../../config/prisma';

const processPaymentWebhook = async ({
  provider,
  payload,
  signature,
}: {
  provider: string;
  payload: any;
  signature: string | null;
}) => {
  // 1. Verify signature (mocked for MVP)
  if (!signature) {
    throw new AppError('Signature missing.', httpStatus.UNAUTHORIZED);
  }
  // In a real scenario, we'd use a library to verify the signature against a secret.
  const isVerified = true; // Assume verified for MVP
  if (!isVerified) {
    throw new AppError('Invalid signature.', httpStatus.UNAUTHORIZED);
  }

  // 2. Parse payload and check for idempotency (simplified for MVP)
  const { paymentId, status: eventStatus } = payload;
  if (!paymentId || !eventStatus) {
    throw new AppError('Invalid payload.', httpStatus.BAD_REQUEST);
  }

  // 3. Find the payment and booking
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { booking: true },
  });

  if (!payment) {
    throw new AppError('Payment not found.', httpStatus.NOT_FOUND);
  }

  // 4. Handle out-of-order webhooks
  if (payment.booking.paymentState === BookingPaymentState.PAID) {
    // Already paid, do nothing.
    return;
  }

  // 5. Update payment and booking status in a transaction
  const newPaymentStatus =
    eventStatus === 'SUCCEEDED' ? PaymentStatus.PAID : PaymentStatus.FAILED;
  const newBookingPaymentState =
    eventStatus === 'SUCCEEDED' ? BookingPaymentState.PAID : BookingPaymentState.UNPAID;

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: paymentId },
      data: { status: newPaymentStatus, paidAt: new Date() },
    });
    await tx.booking.update({
      where: { id: payment.bookingId },
      data: { paymentState: newBookingPaymentState },
    });
  });
};

export const WebhooksService = {
  processPaymentWebhook,
};
import { Prisma, BookingPaymentState, PaymentStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { PrismaClient } from '@prisma/client/extension';
import { validateBookingTransition, validatePaymentTransition } from './payments.state';
import AppError from '../../common/errors/AppError';
import httpStatus from 'http-status';
import { commissionsService } from '../commissions/commissions.service';

type Tx = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

const findBookingForUpdate = (bookingId: string, salonId: string) => {
  return prisma.booking.findFirst({
    where: { id: bookingId, salonId },
  });
};

const createPaymentAndUpdateBooking = ({
  bookingId,
  paymentData,
}: {
  bookingId: string;
  paymentData: Prisma.PaymentCreateInput;
}) => {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({ data: paymentData });
    const booking = await tx.booking.update({
      where: { id: bookingId },
      data: { paymentState: BookingPaymentState.PENDING },
    });

    return { payment, booking };
  });
};

const handleSuccessfulPayment = async (tx: Tx, paymentId: string) => {
  const payment = await tx.payment.findUnique({
    where: { id: paymentId },
    include: { booking: true },
  });

  if (!payment) {
    throw new AppError('Payment not found.', httpStatus.NOT_FOUND);
  }

  // Idempotency check: If already paid, do nothing.
  if (payment.status === PaymentStatus.PAID && payment.booking.paymentState === BookingPaymentState.PAID) {
    return;
  }

  // Validate state transitions
  validatePaymentTransition(payment.status, PaymentStatus.PAID);
  validateBookingTransition(payment.booking.paymentState, BookingPaymentState.PAID);

  // Update records
  await tx.payment.update({
    where: { id: paymentId },
    data: { status: PaymentStatus.PAID, paidAt: new Date() },
  });

  await tx.booking.update({
    where: { id: payment.bookingId },
    data: { paymentState: BookingPaymentState.PAID },
  });

  // Trigger commission calculation (async, non-blocking for the transaction)
  // We use the bookingId from the payment record
  commissionsService.calculateCommission(payment.bookingId).catch((err) => {
    console.error('Failed to calculate commission for booking after payment:', payment.bookingId, err);
  });
};

const handleFailedPayment = async (
  tx: Tx,
  paymentId: string,
  newStatus: PaymentStatus = PaymentStatus.FAILED
) => {
  const payment = await tx.payment.findUnique({
    where: { id: paymentId },
    include: { booking: true },
  });

  if (!payment) {
    throw new AppError('Payment not found.', httpStatus.NOT_FOUND);
  }

  // Idempotency check: If already in a final failed/canceled state, do nothing.
  if (payment.status === newStatus) {
    return;
  }

  // Validate state transitions
  const newBookingState = newStatus === PaymentStatus.CANCELED ? BookingPaymentState.CANCELED : BookingPaymentState.FAILED;
  validatePaymentTransition(payment.status, newStatus);
  validateBookingTransition(payment.booking.paymentState, newBookingState);

  // Update records
  await tx.payment.update({
    where: { id: paymentId },
    data: { status: newStatus },
  });

  await tx.booking.update({
    where: { id: payment.bookingId },
    data: { paymentState: newBookingState },
  });
};

const updatePayment = (paymentId: string, data: Prisma.PaymentUpdateInput) => {
  return prisma.payment.update({
    where: { id: paymentId },
    data,
  });
};

export const PaymentsRepo = {
  findBookingForUpdate,
  createPaymentAndUpdateBooking,
  handleSuccessfulPayment,
  handleFailedPayment,
  updatePayment,
  transaction: <T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) => prisma.$transaction(fn),
};

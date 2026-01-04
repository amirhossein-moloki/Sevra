import { PaymentStatus, BookingPaymentState } from '@prisma/client';
import AppError from '../../common/errors/AppError';
import httpStatus from 'http-status';

/**
 * Defines the state machine for PaymentStatus.
 * For a given 'from' state, it returns the valid 'to' states.
 */
const paymentTransitions: Record<PaymentStatus, PaymentStatus[]> = {
  [PaymentStatus.INITIATED]: [PaymentStatus.PENDING, PaymentStatus.PAID, PaymentStatus.FAILED, PaymentStatus.CANCELED],
  [PaymentStatus.PENDING]: [PaymentStatus.PAID, PaymentStatus.FAILED, PaymentStatus.CANCELED],
  [PaymentStatus.PAID]: [PaymentStatus.REFUNDED],
  [PaymentStatus.FAILED]: [],
  [PaymentStatus.CANCELED]: [],
  [PaymentStatus.REFUNDED]: [],
  [PaymentStatus.VOID]: [],
};

/**
 * Defines the state machine for BookingPaymentState.
 */
const bookingTransitions: Record<BookingPaymentState, BookingPaymentState[]> = {
  [BookingPaymentState.UNPAID]: [BookingPaymentState.PENDING, BookingPaymentState.PAID],
  [BookingPaymentState.PENDING]: [BookingPaymentState.PAID, BookingPaymentState.UNPAID],
  [BookingPaymentState.PARTIALLY_PAID]: [BookingPaymentState.PAID, BookingPaymentState.REFUNDED, BookingPaymentState.OVERPAID],
  [BookingPaymentState.PAID]: [BookingPaymentState.REFUNDED],
  [BookingPaymentState.REFUNDED]: [],
  [BookingPaymentState.OVERPAID]: [BookingPaymentState.REFUNDED],
};

/**
 * Validates a transition for the PaymentStatus.
 * @throws {AppError} if the transition is invalid.
 */
export function validatePaymentTransition(from: PaymentStatus, to: PaymentStatus): void {
  const allowedTransitions = paymentTransitions[from];
  if (!allowedTransitions || !allowedTransitions.includes(to)) {
    throw new AppError(`Invalid payment state transition from ${from} to ${to}.`, httpStatus.CONFLICT);
  }
}

/**
 * Validates a transition for the BookingPaymentState.
 * @throws {AppError} if the transition is invalid.
 */
export function validateBookingTransition(from: BookingPaymentState, to: BookingPaymentState): void {
  const allowedTransitions = bookingTransitions[from];
  if (!allowedTransitions || !allowedTransitions.includes(to)) {
    throw new AppError(`Invalid booking payment state transition from ${from} to ${to}.`, httpStatus.CONFLICT);
  }
}

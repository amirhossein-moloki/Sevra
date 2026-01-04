import { BookingPaymentState, PaymentProvider, PaymentStatus } from '@prisma/client';
import AppError from '../../common/errors/AppError';
import httpStatus from 'http-status';
import { PaymentsRepo } from './payments.repo';

const initiatePayment = async ({
  salonId,
  bookingId,
  idempotencyKey,
}: {
  salonId: string;
  bookingId: string;
  idempotencyKey: string | null;
}) => {
  // 1. Fetch the booking
  const booking = await PaymentsRepo.findBookingForUpdate(bookingId, salonId);

  if (!booking) {
    throw new AppError('Booking not found.', httpStatus.NOT_FOUND);
  }

  // 2. Check if the booking is already paid
  if (booking.paymentState === BookingPaymentState.PAID) {
    throw new AppError('Booking is already paid.', httpStatus.CONFLICT);
  }

  // 3. Idempotency check (simplified for MVP)
  // A full implementation would use the IdempotencyKey model.
  if (idempotencyKey) {
    // In a real scenario, we would check if a payment with this key already exists.
    // For MVP, we'll assume the client behaves correctly.
  }

  // 4. Create the payment record
  const { payment } = await PaymentsRepo.createPaymentAndUpdateBooking({
    bookingId,
    paymentData: {
      salon: { connect: { id: salonId } },
      booking: { connect: { id: bookingId } },
      amount: booking.amountDueSnapshot,
      currency: booking.currencySnapshot,
      provider: PaymentProvider.ZARINPAL, // Hardcoded for MVP
      status: PaymentStatus.INITIATED,
      idempotencyKey,
    },
  });

  // 5. Simulate provider interaction and return a checkout URL
  const checkoutUrl = `https://sandbox.zarinpal.com/pg/StartPay/${payment.id}`; // Mock URL

  return {
    paymentId: payment.id,
    paymentStatus: payment.status,
    checkoutUrl,
  };
};

export const PaymentsService = {
  initiatePayment,
};
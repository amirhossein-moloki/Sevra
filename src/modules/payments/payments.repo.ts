import { Prisma, Payment, BookingPaymentState } from '@prisma/client';
import { prisma } from '../../config/prisma';

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

export const PaymentsRepo = {
  findBookingForUpdate,
  createPaymentAndUpdateBooking,
};
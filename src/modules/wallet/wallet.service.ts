import { Prisma, WalletTransactionType, BookingPaymentState, PaymentStatus } from '@prisma/client';
import { WalletRepo } from './wallet.repo';
import { prisma } from '../../config/prisma';

export const WalletService = {
  async credit(
    customerAccountId: string,
    amount: number,
    type: WalletTransactionType,
    currency: string,
    bookingId?: string,
    note?: string,
    tx?: Prisma.TransactionClient
  ) {
    if (amount <= 0) return;

    const execute = async (t: Prisma.TransactionClient) => {
      await WalletRepo.updateBalance(customerAccountId, amount, t);
      await WalletRepo.createTransaction({
        customerAccountId,
        amount,
        type,
        currency,
        bookingId,
        note,
      }, t);
    };

    if (tx) {
      await execute(tx);
    } else {
      await prisma.$transaction(async (t) => {
        await execute(t);
      });
    }
  },

  async refundBookingToWallet(bookingId: string, tx?: Prisma.TransactionClient) {
    const execute = async (t: Prisma.TransactionClient) => {
      const booking = await WalletRepo.findBooking(bookingId, t);
      if (!booking) return;

      const totalPaid = await WalletRepo.findTotalPaidForBooking(bookingId, t);
      if (totalPaid <= 0) return;

      // Check if already refunded to avoid double refund
      const existingRefund = await t.walletTransaction.findFirst({
        where: {
          bookingId,
          type: WalletTransactionType.REFUND,
        }
      });

      if (existingRefund) return;

      await WalletService.credit(
        booking.customerAccountId,
        totalPaid,
        WalletTransactionType.REFUND,
        booking.currencySnapshot,
        bookingId,
        `Refund for booking ${bookingId}`,
        t
      );

      // Update booking payment state to REFUNDED
      await t.booking.update({
        where: { id: bookingId },
        data: { paymentState: BookingPaymentState.REFUNDED }
      });

      // Mark successful payments as REFUNDED
      await t.payment.updateMany({
        where: { bookingId, status: PaymentStatus.PAID },
        data: { status: PaymentStatus.REFUNDED }
      });
    };

    if (tx) {
      await execute(tx);
    } else {
      await prisma.$transaction(async (t) => {
        await execute(t);
      });
    }
  }
};

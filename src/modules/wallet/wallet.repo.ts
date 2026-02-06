import { Prisma, PaymentStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';

export const WalletRepo = {
  async updateBalance(customerAccountId: string, amount: number, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    return client.customerAccount.update({
      where: { id: customerAccountId },
      data: {
        walletBalance: {
          increment: amount,
        },
      },
    });
  },

  async createTransaction(data: Prisma.WalletTransactionUncheckedCreateInput, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    return client.walletTransaction.create({ data });
  },

  async findTotalPaidForBooking(bookingId: string, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    const payments = await client.payment.findMany({
      where: {
        bookingId,
        status: PaymentStatus.PAID,
      },
    });

    if (payments.length === 0) return 0;

    return payments.reduce((acc, p) => acc + p.amount, 0);
  },

  async findBooking(bookingId: string, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    return client.booking.findUnique({
      where: { id: bookingId },
      include: {
        customerAccount: true,
      },
    });
  }
};

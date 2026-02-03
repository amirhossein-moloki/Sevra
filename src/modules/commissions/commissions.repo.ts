
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';

export const CommissionsRepo = {
  // Policy operations
  async findPolicyBySalonId(salonId: string, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    return client.salonCommissionPolicy.findUnique({
      where: { salonId },
    });
  },

  async upsertPolicy(salonId: string, data: Prisma.SalonCommissionPolicyCreateInput) {
    return prisma.salonCommissionPolicy.upsert({
      where: { salonId },
      create: data,
      update: data,
    });
  },

  // Booking Commission operations
  async findBookingCommission(bookingId: string, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    return client.bookingCommission.findUnique({
      where: { bookingId },
    });
  },

  async createBookingCommission(data: Prisma.BookingCommissionUncheckedCreateInput, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    return client.bookingCommission.create({
      data,
    });
  },

  async updateBookingCommission(id: string, data: Prisma.BookingCommissionUpdateInput, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    return client.bookingCommission.update({
      where: { id },
      data,
    });
  },

  async listCommissions(salonId: string, where: Prisma.BookingCommissionWhereInput, skip: number, take: number) {
    const [commissions, totalItems] = await prisma.$transaction([
      prisma.bookingCommission.findMany({
        where: { ...where, salonId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          booking: {
            select: {
              id: true,
              startAt: true,
              serviceNameSnapshot: true,
              customerProfile: {
                select: { displayName: true }
              }
            }
          }
        }
      }),
      prisma.bookingCommission.count({
        where: { ...where, salonId },
      }),
    ]);

    return { commissions, totalItems };
  },

  // Commission Payment operations
  async createCommissionPayment(data: Prisma.CommissionPaymentUncheckedCreateInput, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    return client.commissionPayment.create({
      data,
    });
  },

  async findCommissionPayments(commissionId: string, status?: any, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    return client.commissionPayment.findMany({
      where: { commissionId, status },
    });
  },

  async findCommissionWithPayments(id: string) {
    return prisma.bookingCommission.findUnique({
      where: { id },
      include: { payments: true },
    });
  },

  async findBookingForCommission(bookingId: string, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    return client.booking.findUnique({
      where: { id: bookingId },
      include: { commission: true },
    });
  },

  async findCommissionById(id: string, salonId: string, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    return client.bookingCommission.findFirst({
      where: { id, salonId },
    });
  },

  async transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) {
    return prisma.$transaction(fn);
  }
};


import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';

export const CommissionsRepo = {
  // Policy operations
  async findPolicyBySalonId(salonId: string) {
    return prisma.salonCommissionPolicy.findUnique({
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
  async findBookingCommission(bookingId: string) {
    return prisma.bookingCommission.findUnique({
      where: { bookingId },
    });
  },

  async createBookingCommission(data: Prisma.BookingCommissionCreateInput) {
    return prisma.bookingCommission.create({
      data,
    });
  },

  async updateBookingCommission(id: string, data: Prisma.BookingCommissionUpdateInput) {
    return prisma.bookingCommission.update({
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
  async createCommissionPayment(data: Prisma.CommissionPaymentCreateInput) {
    return prisma.commissionPayment.create({
      data,
    });
  },

  async findCommissionWithPayments(id: string) {
    return prisma.bookingCommission.findUnique({
      where: { id },
      include: { payments: true },
    });
  }
};


import { Prisma, BookingStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';

export const AnalyticsRepo = {
  async getBookingsData(salonId: string, startDate: Date, endDate: Date) {
    return prisma.booking.findMany({
      where: {
        salonId,
        startAt: { gte: startDate, lte: endDate },
      },
      select: {
        status: true,
        amountDueSnapshot: true,
        staffId: true,
        serviceId: true,
        startAt: true,
      },
    });
  },

  async getPaidPaymentsSum(salonId: string, startDate: Date, endDate: Date) {
    return prisma.payment.aggregate({
      where: {
        salonId,
        status: 'PAID',
        paidAt: { gte: startDate, lte: endDate },
      },
      _sum: {
        amount: true,
      },
    });
  },

  async getNewCustomersCount(salonId: string, startDate: Date, endDate: Date) {
    return prisma.salonCustomerProfile.count({
      where: {
        salonId,
        createdAt: { gte: startDate, lte: endDate },
      },
    });
  },

  async getStaffDetails(salonId: string) {
    return prisma.user.findMany({
      where: { salonId, role: 'STAFF' },
      select: { id: true, fullName: true },
    });
  },

  async getServiceDetails(salonId: string) {
    return prisma.service.findMany({
      where: { salonId },
      select: { id: true, name: true },
    });
  },

  async getBookingsWithReviews(salonId: string, startDate: Date, endDate: Date) {
      return prisma.booking.findMany({
          where: {
              salonId,
              startAt: { gte: startDate, lte: endDate },
              reviews: { some: {} }
          },
          select: {
              staffId: true,
              reviews: {
                  select: { rating: true }
              }
          }
      })
  }
};

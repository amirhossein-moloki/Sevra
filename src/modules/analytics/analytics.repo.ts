
import { prisma } from '../../config/prisma';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

export const AnalyticsRepo = {
  async getSummaryStats(salonId: string, startDate: Date, endDate: Date) {
    const stats = await prisma.salonAnalytics.aggregate({
      where: {
        salonId,
        date: { gte: startDate, lte: endDate },
      },
      _sum: {
        totalBookings: true,
        completedBookings: true,
        canceledBookings: true,
        revenue: true,
        realizedCash: true,
      },
    });
    return stats._sum;
  },

  async getStaffPerformanceStats(salonId: string, startDate: Date, endDate: Date) {
    return prisma.staffAnalytics.groupBy({
      by: ['staffId'],
      where: {
        salonId,
        date: { gte: startDate, lte: endDate },
      },
      _sum: {
        completedBookings: true,
        revenue: true,
        totalRating: true,
        ratingCount: true,
      },
    });
  },

  async getServicePerformanceStats(salonId: string, startDate: Date, endDate: Date) {
    return prisma.serviceAnalytics.groupBy({
      by: ['serviceId'],
      where: {
        salonId,
        date: { gte: startDate, lte: endDate },
      },
      _sum: {
        completedBookings: true,
        revenue: true,
      },
    });
  },

  async getDailyRevenue(salonId: string, startDate: Date, endDate: Date) {
    return prisma.salonAnalytics.findMany({
      where: {
        salonId,
        date: { gte: startDate, lte: endDate },
      },
      select: {
        date: true,
        revenue: true,
      },
      orderBy: { date: 'asc' },
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
        reviews: { some: {} },
      },
      select: {
        staffId: true,
        reviews: {
          select: { rating: true },
        },
      },
    });
  },

  async syncSalonStats(salonId: string, date: Date) {
    const settings = await prisma.settings.findUnique({ where: { salonId } });
    const timeZone = settings?.timeZone || 'UTC';
    const dateStr = formatInTimeZone(date, timeZone, 'yyyy-MM-dd');
    const dayStart = fromZonedTime(`${dateStr} 00:00:00`, timeZone);
    const dayEnd = fromZonedTime(`${dateStr} 23:59:59.999`, timeZone);

    const [bookingStats, realizedCashStats] = await Promise.all([
      prisma.booking.groupBy({
        by: ['status'],
        where: { salonId, startAt: { gte: dayStart, lte: dayEnd } },
        _count: { _all: true },
        _sum: { amountDueSnapshot: true },
      }),
      prisma.payment.aggregate({
        where: { salonId, status: 'PAID', paidAt: { gte: dayStart, lte: dayEnd } },
        _sum: { amount: true },
      }),
    ]);

    const totalBookings = bookingStats.reduce((sum, s) => sum + s._count._all, 0);
    const completedStats = bookingStats.find((s) => s.status === 'DONE');
    const canceledStats = bookingStats.find((s) => s.status === 'CANCELED');

    await prisma.salonAnalytics.upsert({
      where: { salonId_date: { salonId, date: new Date(dateStr) } },
      create: {
        salonId,
        date: new Date(dateStr),
        totalBookings,
        completedBookings: completedStats?._count._all || 0,
        canceledBookings: canceledStats?._count._all || 0,
        revenue: completedStats?._sum.amountDueSnapshot || 0,
        realizedCash: realizedCashStats._sum.amount || 0,
      },
      update: {
        totalBookings,
        completedBookings: completedStats?._count._all || 0,
        canceledBookings: canceledStats?._count._all || 0,
        revenue: completedStats?._sum.amountDueSnapshot || 0,
        realizedCash: realizedCashStats._sum.amount || 0,
        updatedAt: new Date(),
      },
    });
  },

  async syncStaffStats(salonId: string, staffId: string, date: Date) {
    const settings = await prisma.settings.findUnique({ where: { salonId } });
    const timeZone = settings?.timeZone || 'UTC';
    const dateStr = formatInTimeZone(date, timeZone, 'yyyy-MM-dd');
    const dayStart = fromZonedTime(`${dateStr} 00:00:00`, timeZone);
    const dayEnd = fromZonedTime(`${dateStr} 23:59:59.999`, timeZone);

    const [bookingStats, reviewStats] = await Promise.all([
      prisma.booking.aggregate({
        where: {
          salonId,
          staffId,
          status: 'DONE',
          startAt: { gte: dayStart, lte: dayEnd },
        },
        _count: { _all: true },
        _sum: { amountDueSnapshot: true },
      }),
      prisma.review.aggregate({
        where: {
          salonId,
          booking: {
            staffId,
            startAt: { gte: dayStart, lte: dayEnd },
          },
          status: 'PUBLISHED',
        },
        _count: { _all: true },
        _sum: { rating: true },
      }),
    ]);

    await prisma.staffAnalytics.upsert({
      where: {
        salonId_staffId_date: {
          salonId,
          staffId,
          date: new Date(dateStr),
        },
      },
      create: {
        salonId,
        staffId,
        date: new Date(dateStr),
        completedBookings: bookingStats._count._all || 0,
        revenue: bookingStats._sum.amountDueSnapshot || 0,
        totalRating: reviewStats._sum.rating || 0,
        ratingCount: reviewStats._count._all || 0,
      },
      update: {
        completedBookings: bookingStats._count._all || 0,
        revenue: bookingStats._sum.amountDueSnapshot || 0,
        totalRating: reviewStats._sum.rating || 0,
        ratingCount: reviewStats._count._all || 0,
        updatedAt: new Date(),
      },
    });
  },

  async syncServiceStats(salonId: string, serviceId: string, date: Date) {
    const settings = await prisma.settings.findUnique({ where: { salonId } });
    const timeZone = settings?.timeZone || 'UTC';
    const dateStr = formatInTimeZone(date, timeZone, 'yyyy-MM-dd');
    const dayStart = fromZonedTime(`${dateStr} 00:00:00`, timeZone);
    const dayEnd = fromZonedTime(`${dateStr} 23:59:59.999`, timeZone);

    const stats = await prisma.booking.aggregate({
      where: {
        salonId,
        serviceId,
        status: 'DONE',
        startAt: { gte: dayStart, lte: dayEnd },
      },
      _count: { _all: true },
      _sum: { amountDueSnapshot: true },
    });

    await prisma.serviceAnalytics.upsert({
      where: {
        salonId_serviceId_date: {
          salonId,
          serviceId,
          date: new Date(dateStr),
        },
      },
      create: {
        salonId,
        serviceId,
        date: new Date(dateStr),
        completedBookings: stats._count._all || 0,
        revenue: stats._sum.amountDueSnapshot || 0,
      },
      update: {
        completedBookings: stats._count._all || 0,
        revenue: stats._sum.amountDueSnapshot || 0,
        updatedAt: new Date(),
      },
    });
  },

  async syncAllStatsForBooking(bookingId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) return;

    await this.syncSpecificStats(booking.salonId, booking.startAt, booking.staffId, booking.serviceId);
  },

  async syncSpecificStats(salonId: string, date: Date, staffId: string, serviceId: string) {
    await Promise.all([
      this.syncSalonStats(salonId, date),
      this.syncStaffStats(salonId, staffId, date),
      this.syncServiceStats(salonId, serviceId, date),
    ]);
  },

  async syncAllStatsForPayment(paymentId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { booking: true },
    });
    if (!payment) return;

    // Payment realizedCash is based on paidAt
    if (payment.status === 'PAID' && payment.paidAt) {
      await this.syncSalonStats(payment.salonId, payment.paidAt);
    }

    // Also sync the booking's date stats just in case
    await this.syncAllStatsForBooking(payment.bookingId);
  },

  async syncAllStatsForReview(reviewId: string) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { booking: true },
    });
    if (!review) return;

    await this.syncStaffStats(review.salonId, review.booking.staffId, review.booking.startAt);
  },
};

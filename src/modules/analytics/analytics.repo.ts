
import { prisma } from '../../config/prisma';
import { formatInTimeZone } from 'date-fns-tz';

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

    await prisma.$executeRaw`
      INSERT INTO "SalonAnalytics" ("salonId", "date", "totalBookings", "completedBookings", "canceledBookings", "revenue", "realizedCash", "updatedAt", "createdAt")
      SELECT
          ${salonId} as "salonId",
          ${dateStr}::date as "date",
          (SELECT count(*)::int FROM "Booking" WHERE "salonId" = ${salonId} AND ("startAt" AT TIME ZONE 'UTC' AT TIME ZONE ${timeZone})::date = ${dateStr}::date) as "totalBookings",
          (SELECT count(*)::int FROM "Booking" WHERE "salonId" = ${salonId} AND ("startAt" AT TIME ZONE 'UTC' AT TIME ZONE ${timeZone})::date = ${dateStr}::date AND "status" = 'DONE') as "completedBookings",
          (SELECT count(*)::int FROM "Booking" WHERE "salonId" = ${salonId} AND ("startAt" AT TIME ZONE 'UTC' AT TIME ZONE ${timeZone})::date = ${dateStr}::date AND "status" = 'CANCELED') as "canceledBookings",
          (SELECT COALESCE(sum("amountDueSnapshot"), 0)::int FROM "Booking" WHERE "salonId" = ${salonId} AND ("startAt" AT TIME ZONE 'UTC' AT TIME ZONE ${timeZone})::date = ${dateStr}::date AND "status" = 'DONE') as "revenue",
          (SELECT COALESCE(sum("amount"), 0)::int FROM "Payment" WHERE "salonId" = ${salonId} AND ("paidAt" AT TIME ZONE 'UTC' AT TIME ZONE ${timeZone})::date = ${dateStr}::date AND "status" = 'PAID') as "realizedCash",
          NOW(),
          NOW()
      ON CONFLICT ("salonId", "date") DO UPDATE SET
          "totalBookings" = EXCLUDED."totalBookings",
          "completedBookings" = EXCLUDED."completedBookings",
          "canceledBookings" = EXCLUDED."canceledBookings",
          "revenue" = EXCLUDED."revenue",
          "realizedCash" = EXCLUDED."realizedCash",
          "updatedAt" = EXCLUDED."updatedAt";
    `;
  },

  async syncStaffStats(salonId: string, staffId: string, date: Date) {
    const settings = await prisma.settings.findUnique({ where: { salonId } });
    const timeZone = settings?.timeZone || 'UTC';
    const dateStr = formatInTimeZone(date, timeZone, 'yyyy-MM-dd');

    await prisma.$executeRaw`
      INSERT INTO "StaffAnalytics" ("salonId", "staffId", "date", "completedBookings", "revenue", "totalRating", "ratingCount", "updatedAt", "createdAt")
      SELECT
          ${salonId} as "salonId",
          ${staffId} as "staffId",
          ${dateStr}::date as "date",
          (SELECT count(*)::int FROM "Booking" WHERE "salonId" = ${salonId} AND "staffId" = ${staffId} AND ("startAt" AT TIME ZONE 'UTC' AT TIME ZONE ${timeZone})::date = ${dateStr}::date AND "status" = 'DONE') as "completedBookings",
          (SELECT COALESCE(sum("amountDueSnapshot"), 0)::int FROM "Booking" WHERE "salonId" = ${salonId} AND "staffId" = ${staffId} AND ("startAt" AT TIME ZONE 'UTC' AT TIME ZONE ${timeZone})::date = ${dateStr}::date AND "status" = 'DONE') as "revenue",
          (SELECT COALESCE(sum(r."rating"), 0)::int FROM "Review" r JOIN "Booking" b ON r."bookingId" = b."id" WHERE b."salonId" = ${salonId} AND b."staffId" = ${staffId} AND ("startAt" AT TIME ZONE 'UTC' AT TIME ZONE ${timeZone})::date = ${dateStr}::date AND r."status" = 'PUBLISHED') as "totalRating",
          (SELECT count(*)::int FROM "Review" r JOIN "Booking" b ON r."bookingId" = b."id" WHERE b."salonId" = ${salonId} AND b."staffId" = ${staffId} AND ("startAt" AT TIME ZONE 'UTC' AT TIME ZONE ${timeZone})::date = ${dateStr}::date AND r."status" = 'PUBLISHED') as "ratingCount",
          NOW(),
          NOW()
      ON CONFLICT ("salonId", "staffId", "date") DO UPDATE SET
          "completedBookings" = EXCLUDED."completedBookings",
          "revenue" = EXCLUDED."revenue",
          "totalRating" = EXCLUDED."totalRating",
          "ratingCount" = EXCLUDED."ratingCount",
          "updatedAt" = EXCLUDED."updatedAt";
    `;
  },

  async syncServiceStats(salonId: string, serviceId: string, date: Date) {
    const settings = await prisma.settings.findUnique({ where: { salonId } });
    const timeZone = settings?.timeZone || 'UTC';
    const dateStr = formatInTimeZone(date, timeZone, 'yyyy-MM-dd');

    await prisma.$executeRaw`
      INSERT INTO "ServiceAnalytics" ("salonId", "serviceId", "date", "completedBookings", "revenue", "updatedAt", "createdAt")
      SELECT
          ${salonId} as "salonId",
          ${serviceId} as "serviceId",
          ${dateStr}::date as "date",
          (SELECT count(*)::int FROM "Booking" WHERE "salonId" = ${salonId} AND "serviceId" = ${serviceId} AND ("startAt" AT TIME ZONE 'UTC' AT TIME ZONE ${timeZone})::date = ${dateStr}::date AND "status" = 'DONE') as "completedBookings",
          (SELECT COALESCE(sum("amountDueSnapshot"), 0)::int FROM "Booking" WHERE "salonId" = ${salonId} AND "serviceId" = ${serviceId} AND ("startAt" AT TIME ZONE 'UTC' AT TIME ZONE ${timeZone})::date = ${dateStr}::date AND "status" = 'DONE') as "revenue",
          NOW(),
          NOW()
      ON CONFLICT ("salonId", "serviceId", "date") DO UPDATE SET
          "completedBookings" = EXCLUDED."completedBookings",
          "revenue" = EXCLUDED."revenue",
          "updatedAt" = EXCLUDED."updatedAt";
    `;
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

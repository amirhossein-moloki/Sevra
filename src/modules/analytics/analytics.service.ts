
import { AnalyticsRepo } from './analytics.repo';
import { BookingStatus } from '@prisma/client';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { prisma } from '../../config/prisma';

export const AnalyticsService = {
  async getSummary(salonId: string, startDate: Date, endDate: Date) {
    const [bookings, paymentsSum, newCustomers] = await Promise.all([
      AnalyticsRepo.getBookingsData(salonId, startDate, endDate),
      AnalyticsRepo.getPaidPaymentsSum(salonId, startDate, endDate),
      AnalyticsRepo.getNewCustomersCount(salonId, startDate, endDate),
    ]);

    const totalBookings = bookings.length;
    const completedBookings = bookings.filter((b) => b.status === BookingStatus.DONE).length;
    const canceledBookings = bookings.filter((b) => b.status === BookingStatus.CANCELED).length;

    const totalRevenue = bookings
      .filter((b) => b.status === BookingStatus.DONE)
      .reduce((sum, b) => sum + b.amountDueSnapshot, 0);

    const completionRate =
      totalBookings > 0
        ? (completedBookings / (totalBookings - canceledBookings || 1)) * 100
        : 0;

    const averageBookingValue = completedBookings > 0 ? totalRevenue / completedBookings : 0;

    return {
      totalRevenue,
      realizedCash: paymentsSum._sum.amount || 0,
      totalBookings,
      completedBookings,
      canceledBookings,
      completionRate: Math.round(completionRate * 100) / 100,
      averageBookingValue: Math.round(averageBookingValue),
      newCustomers,
    };
  },

  async getStaffPerformance(salonId: string, startDate: Date, endDate: Date) {
    const [bookings, staffList, bookingsWithReviews] = await Promise.all([
      AnalyticsRepo.getBookingsData(salonId, startDate, endDate),
      AnalyticsRepo.getStaffDetails(salonId),
      AnalyticsRepo.getBookingsWithReviews(salonId, startDate, endDate),
    ]);

    const performance = staffList.map((staff) => {
      const staffBookings = bookings.filter(
        (b) => b.staffId === staff.id && b.status === BookingStatus.DONE
      );
      const revenue = staffBookings.reduce((sum, b) => sum + b.amountDueSnapshot, 0);

      const staffReviews = bookingsWithReviews.filter((b) => b.staffId === staff.id);
      const totalRating = staffReviews.reduce(
        (sum, b) => sum + b.reviews.reduce((s, r) => s + r.rating, 0),
        0
      );
      const reviewsCount = staffReviews.reduce((sum, b) => sum + b.reviews.length, 0);

      return {
        staffId: staff.id,
        staffName: staff.fullName,
        bookingsCount: staffBookings.length,
        revenue,
        averageRating: reviewsCount > 0 ? Math.round((totalRating / reviewsCount) * 10) / 10 : 0,
      };
    });

    return performance;
  },

  async getServicePerformance(salonId: string, startDate: Date, endDate: Date) {
    const [bookings, servicesList] = await Promise.all([
      AnalyticsRepo.getBookingsData(salonId, startDate, endDate),
      AnalyticsRepo.getServiceDetails(salonId),
    ]);

    const performance = servicesList.map((service) => {
      const serviceBookings = bookings.filter(
        (b) => b.serviceId === service.id && b.status === BookingStatus.DONE
      );
      const revenue = serviceBookings.reduce((sum, b) => sum + b.amountDueSnapshot, 0);

      return {
        serviceId: service.id,
        serviceName: service.name,
        bookingsCount: serviceBookings.length,
        revenue,
      };
    });

    return performance;
  },

  async getRevenueChart(salonId: string, startDate: Date, endDate: Date) {
    const settings = await prisma.settings.findUnique({ where: { salonId } });
    const timeZone = settings?.timeZone || 'UTC';

    const bookings = await AnalyticsRepo.getBookingsData(salonId, startDate, endDate);
    const doneBookings = bookings.filter((b) => b.status === BookingStatus.DONE);

    const revenueByDate: Record<string, number> = {};

    doneBookings.forEach((b) => {
      const dateStr = formatInTimeZone(b.startAt, timeZone, 'yyyy-MM-dd');
      revenueByDate[dateStr] = (revenueByDate[dateStr] || 0) + b.amountDueSnapshot;
    });

    const sortedDates = Object.keys(revenueByDate).sort();

    return sortedDates.map((date) => ({
      date,
      revenue: revenueByDate[date],
    }));
  },
};

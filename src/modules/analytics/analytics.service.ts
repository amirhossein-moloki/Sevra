
import { AnalyticsRepo } from './analytics.repo';
import { BookingStatus } from '@prisma/client';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { prisma } from '../../config/prisma';

export const AnalyticsService = {
  async getSummary(salonId: string, startDate: Date, endDate: Date) {
    const [stats, newCustomers] = await Promise.all([
      AnalyticsRepo.getSummaryStats(salonId, startDate, endDate),
      AnalyticsRepo.getNewCustomersCount(salonId, startDate, endDate),
    ]);

    const totalBookings = stats.totalBookings || 0;
    const completedBookings = stats.completedBookings || 0;
    const canceledBookings = stats.canceledBookings || 0;
    const totalRevenue = stats.revenue || 0;

    const completionRate =
      totalBookings > 0
        ? (completedBookings / (totalBookings - canceledBookings || 1)) * 100
        : 0;

    const averageBookingValue = completedBookings > 0 ? totalRevenue / completedBookings : 0;

    return {
      totalRevenue,
      realizedCash: stats.realizedCash || 0,
      totalBookings,
      completedBookings,
      canceledBookings,
      completionRate: Math.round(completionRate * 100) / 100,
      averageBookingValue: Math.round(averageBookingValue),
      newCustomers,
    };
  },

  async getStaffPerformance(salonId: string, startDate: Date, endDate: Date) {
    const [staffStats, staffList] = await Promise.all([
      AnalyticsRepo.getStaffPerformanceStats(salonId, startDate, endDate),
      AnalyticsRepo.getStaffDetails(salonId),
    ]);

    const performance = staffList.map((staff) => {
      const stats = staffStats.find((s) => s.staffId === staff.id);
      const revenue = stats?._sum?.revenue || 0;
      const completedBookings = stats?._sum?.completedBookings || 0;
      const totalRating = stats?._sum?.totalRating || 0;
      const ratingCount = stats?._sum?.ratingCount || 0;

      return {
        staffId: staff.id,
        staffName: staff.fullName,
        bookingsCount: completedBookings,
        revenue,
        averageRating: ratingCount > 0 ? Math.round((totalRating / ratingCount) * 10) / 10 : 0,
      };
    });

    return performance;
  },

  async getServicePerformance(salonId: string, startDate: Date, endDate: Date) {
    const [serviceStats, servicesList] = await Promise.all([
      AnalyticsRepo.getServicePerformanceStats(salonId, startDate, endDate),
      AnalyticsRepo.getServiceDetails(salonId),
    ]);

    const performance = servicesList.map((service) => {
      const stats = serviceStats.find((s) => s.serviceId === service.id);
      const revenue = stats?._sum?.revenue || 0;
      const completedBookings = stats?._sum?.completedBookings || 0;

      return {
        serviceId: service.id,
        serviceName: service.name,
        bookingsCount: completedBookings,
        revenue,
      };
    });

    return performance;
  },

  async getRevenueChart(salonId: string, startDate: Date, endDate: Date) {
    const dailyStats = await AnalyticsRepo.getDailyRevenue(salonId, startDate, endDate);

    return dailyStats.map((s) => ({
      date: format(s.date, 'yyyy-MM-dd'),
      revenue: s.revenue,
    }));
  },
};

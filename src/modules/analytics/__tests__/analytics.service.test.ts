
import { AnalyticsService } from '../analytics.service';
import { AnalyticsRepo } from '../analytics.repo';
import { BookingStatus } from '@prisma/client';

jest.mock('../analytics.repo');

describe('AnalyticsService (Unit Tests)', () => {
  const salonId = 'test-salon';
  const startDate = new Date('2023-10-01');
  const endDate = new Date('2023-10-31');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return correct summary', async () => {
    (AnalyticsRepo.getSummaryStats as jest.Mock).mockResolvedValue({
      totalBookings: 4,
      completedBookings: 2,
      canceledBookings: 1,
      revenue: 80000,
      realizedCash: 80000,
    });
    (AnalyticsRepo.getNewCustomersCount as jest.Mock).mockResolvedValue(5);

    const summary = await AnalyticsService.getSummary(salonId, startDate, endDate);

    expect(summary.totalBookings).toBe(4);
    expect(summary.completedBookings).toBe(2);
    expect(summary.canceledBookings).toBe(1);
    expect(summary.totalRevenue).toBe(80000);
    expect(summary.realizedCash).toBe(80000);
    expect(summary.newCustomers).toBe(5);
    expect(summary.completionRate).toBe(Math.round((2 / 3) * 100 * 100) / 100);
  });

  it('should return staff performance', async () => {
    (AnalyticsRepo.getStaffPerformanceStats as jest.Mock).mockResolvedValue([
      {
        staffId: 'staff-1',
        _sum: { completedBookings: 2, revenue: 80000, totalRating: 9, ratingCount: 2 },
      },
      {
        staffId: 'staff-2',
        _sum: { completedBookings: 1, revenue: 40000, totalRating: 0, ratingCount: 0 },
      },
    ]);
    (AnalyticsRepo.getStaffDetails as jest.Mock).mockResolvedValue([
      { id: 'staff-1', fullName: 'Staff One' },
      { id: 'staff-2', fullName: 'Staff Two' },
    ]);

    const performance = await AnalyticsService.getStaffPerformance(salonId, startDate, endDate);

    expect(performance).toHaveLength(2);

    const staff1 = performance.find((p) => p.staffId === 'staff-1');
    expect(staff1?.bookingsCount).toBe(2);
    expect(staff1?.revenue).toBe(80000);
    expect(staff1?.averageRating).toBe(4.5);

    const staff2 = performance.find((p) => p.staffId === 'staff-2');
    expect(staff2?.bookingsCount).toBe(1);
    expect(staff2?.revenue).toBe(40000);
    expect(staff2?.averageRating).toBe(0);
  });

  it('should return service performance', async () => {
    (AnalyticsRepo.getServicePerformanceStats as jest.Mock).mockResolvedValue([
      {
        serviceId: 'service-1',
        _sum: { completedBookings: 1, revenue: 50000 },
      },
      {
        serviceId: 'service-2',
        _sum: { completedBookings: 1, revenue: 40000 },
      },
    ]);
    (AnalyticsRepo.getServiceDetails as jest.Mock).mockResolvedValue([
      { id: 'service-1', name: 'Service One' },
      { id: 'service-2', name: 'Service Two' },
    ]);

    const performance = await AnalyticsService.getServicePerformance(salonId, startDate, endDate);

    expect(performance).toHaveLength(2);
    expect(performance.find((p) => p.serviceId === 'service-1')?.revenue).toBe(50000);
    expect(performance.find((p) => p.serviceId === 'service-2')?.revenue).toBe(40000);
  });
});

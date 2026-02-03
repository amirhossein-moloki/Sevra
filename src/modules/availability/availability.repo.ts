import { prisma } from '../../config/prisma';

export const AvailabilityRepo = {
  async findServiceWithSalon(serviceId: string, salonSlug: string) {
    return prisma.service.findFirst({
      where: {
        id: serviceId,
        salon: { slug: salonSlug },
      },
      include: {
        salon: {
          include: {
            settings: true,
          },
        },
      },
    });
  },

  async findStaff(staffId: string, salonId: string, serviceId: string) {
    return prisma.user.findFirst({
      where: {
        id: staffId,
        salonId,
        userServices: { some: { serviceId } },
      },
    });
  },

  async findStaffList(salonId: string, serviceId: string) {
    return prisma.user.findMany({
      where: {
        salonId,
        userServices: { some: { serviceId } },
        isActive: true,
      },
    });
  },

  async findShifts(staffIds: string[]) {
    return prisma.shift.findMany({
      where: { userId: { in: staffIds }, isActive: true },
    });
  },

  async findBookings(staffIds: string[], startDate: Date, endDate: Date) {
    return prisma.booking.findMany({
      where: {
        staffId: { in: staffIds },
        status: { notIn: ['CANCELED', 'NO_SHOW'] },
        startAt: { gte: startDate },
        endAt: { lte: endDate },
      },
    });
  }
};

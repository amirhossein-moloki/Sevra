import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';

export const CustomerPanelRepo = {
  async findCustomerAccountById(id: string) {
    return prisma.customerAccount.findUnique({
      where: { id },
      include: {
        profiles: {
          include: {
            salon: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });
  },

  async findManyBookings(
    where: Prisma.BookingWhereInput,
    skip: number,
    take: number,
    orderBy: Prisma.BookingOrderByWithRelationInput = { startAt: 'desc' }
  ) {
    return prisma.booking.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        salon: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        staff: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  },

  async countBookings(where: Prisma.BookingWhereInput) {
    return prisma.booking.count({ where });
  },

  async findBookingById(id: string, customerAccountId: string) {
    return prisma.booking.findFirst({
      where: {
        id,
        customerAccountId,
      },
      include: {
        salon: {
          include: {
            settings: true,
          },
        },
        staff: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  },

  async updateBooking(id: string, data: Prisma.BookingUpdateInput) {
    return prisma.booking.update({
      where: { id },
      data,
    });
  },
};

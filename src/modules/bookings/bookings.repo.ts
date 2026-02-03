import { Prisma, BookingStatus, BookingSource } from '@prisma/client';
import { prisma } from '../../config/prisma';

export const BookingsRepo = {
  async findService(id: string, salonId: string, isActive?: boolean, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    return client.service.findFirst({
      where: { id, salonId, isActive },
    });
  },

  async findStaff(id: string, salonId: string, serviceId?: string, isPublic?: boolean, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    return client.user.findFirst({
      where: {
        id,
        salonId,
        isActive: true,
        isPublic,
        ...(serviceId ? { userServices: { some: { serviceId } } } : {}),
      },
      select: { id: true },
    });
  },

  async findSalonWithSettings(id: string, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    return client.salon.findUnique({
      where: { id },
      include: { settings: true },
    });
  },

  async findSalonBySlugWithSettings(slug: string, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    return client.salon.findUnique({
      where: { slug },
      include: { settings: true },
    });
  },

  async findShift(salonId: string, userId: string, dayOfWeek: number, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    return client.shift.findFirst({
      where: {
        salonId,
        userId,
        dayOfWeek,
        isActive: true,
      },
    });
  },

  async findOverlappingBooking(salonId: string, staffId: string, startAt: Date, endAt: Date, excludeBookingId?: string, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    return client.booking.findFirst({
      where: {
        salonId,
        staffId,
        id: excludeBookingId ? { not: excludeBookingId } : undefined,
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.DONE] },
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
      select: { id: true },
    });
  },

  async findCustomerAccountByPhone(phone: string, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    return client.customerAccount.findUnique({
      where: { phone },
    });
  },

  async createCustomerAccount(data: Prisma.CustomerAccountCreateInput, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    return client.customerAccount.create({ data });
  },

  async findCustomerProfile(salonId: string, customerAccountId: string, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    return client.salonCustomerProfile.findUnique({
      where: {
        salonId_customerAccountId: {
          salonId,
          customerAccountId,
        },
      },
    });
  },

  async createCustomerProfile(data: Prisma.SalonCustomerProfileUncheckedCreateInput, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    return client.salonCustomerProfile.create({ data });
  },

  async createBooking(data: Prisma.BookingUncheckedCreateInput, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    return client.booking.create({ data });
  },

  async findBookingById(id: string, salonId: string, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    return client.booking.findFirst({
      where: { id, salonId },
    });
  },

  async findManyBookings(where: Prisma.BookingWhereInput, skip: number, take: number, orderBy: any) {
    return prisma.booking.findMany({
      where,
      skip,
      take,
      orderBy,
    });
  },

  async countBookings(where: Prisma.BookingWhereInput) {
    return prisma.booking.count({ where });
  },

  async updateBooking(id: string, data: Prisma.BookingUncheckedUpdateInput, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    return client.booking.update({
      where: { id },
      data,
    });
  },

  async updateBookingWithInclude(id: string, data: Prisma.BookingUncheckedUpdateInput, include: Prisma.BookingInclude, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    return client.booking.update({
      where: { id },
      data,
      include,
    });
  },

  async findSettings(salonId: string, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    return client.settings.findUnique({
      where: { salonId },
    });
  },

  async transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>, options?: { isolationLevel?: Prisma.TransactionIsolationLevel }) {
    return prisma.$transaction(fn, options);
  }
};

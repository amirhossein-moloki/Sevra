
import { addMinutes, isBefore } from 'date-fns';
import { Booking, BookingStatus, Prisma, UserRole } from '@prisma/client';
import { prisma } from '../../config/prisma';
import AppError from '../../common/errors/AppError';
import httpStatus from 'http-status';
import {
  CancelBookingInput,
  CreateBookingInput,
  CreatePublicBookingInput,
  ListBookingsQuery,
  UpdateBookingInput,
} from './bookings.validators';
import { toZonedTime } from 'date-fns-tz';

const findAndValidateBooking = async (
  bookingId: string,
  salonId: string
): Promise<Booking> => {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.salonId !== salonId) {
    throw new AppError('Booking not found.', httpStatus.NOT_FOUND);
  }
  return booking;
};

export const bookingsService = {
  async createBooking(input: CreateBookingInput & { salonId: string; createdByUserId: string; }) {
    return prisma.$transaction(async (tx) => {
      const { salonId, serviceId, staffId, customerProfileId, startAt: startAtString, createdByUserId, note } = input;
      const startAt = new Date(startAtString);

      // 1. Fetch Service and Customer Profile details
      const service = await tx.service.findFirst({
        where: { id: serviceId, salonId: salonId, isActive: true },
      });

      if (!service) {
        throw new AppError('Service not found or is not active.', httpStatus.NOT_FOUND);
      }

      const customerProfile = await tx.salonCustomerProfile.findFirst({
        where: { id: customerProfileId, salonId: salonId },
      });

      if (!customerProfile) {
        throw new AppError('Customer profile not found.', httpStatus.NOT_FOUND);
      }

      // 2. Calculate endAt and create booking
      const endAt = addMinutes(startAt, service.durationMinutes);

      const booking = await tx.booking.create({
        data: {
          salonId,
          serviceId,
          staffId,
          customerProfileId,
          customerAccountId: customerProfile.customerAccountId,
          createdByUserId,
          startAt,
          endAt,
          note,
          status: BookingStatus.CONFIRMED,
          // Snapshots
          serviceNameSnapshot: service.name,
          serviceDurationSnapshot: service.durationMinutes,
          servicePriceSnapshot: service.price,
          currencySnapshot: service.currency,
          amountDueSnapshot: service.price,
        },
      });

      return booking;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
    });
  },

  async createPublicBooking(salonSlug: string, input: CreatePublicBookingInput, requestId: string) {
    // This is a placeholder and would need to be implemented
    return {} as Booking;
  },

  async getBookings(salonId: string, query: ListBookingsQuery, actor: { id: string, role: UserRole }) {
    const { page = 1, pageSize = 20, sortBy = 'startAt', sortOrder = 'asc', status, staffId, customerProfileId, dateFrom, dateTo } = query;
    const where: Prisma.BookingWhereInput = {
      salonId,
      status,
      staffId,
      customerProfileId,
      startAt: {
        gte: dateFrom ? new Date(dateFrom) : undefined,
        lt: dateTo ? new Date(dateTo) : undefined,
      },
    };

    if (actor.role === 'STAFF') {
      where.staffId = actor.id;
    }

    const [bookings, totalItems] = await prisma.$transaction([
      prisma.booking.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.booking.count({ where }),
    ]);

    return {
      data: bookings,
      meta: { page, pageSize, totalItems, totalPages: Math.ceil(totalItems / pageSize) },
    };
  },

  async getBookingById(bookingId: string, salonId: string, actor: { id: string, role: UserRole }) {
    const booking = await findAndValidateBooking(bookingId, salonId);

    if (actor.role === 'STAFF' && booking.staffId !== actor.id) {
      throw new AppError('Booking not found.', httpStatus.NOT_FOUND);
    }

    return booking;
  },

  async updateBooking(bookingId: string, salonId: string, data: UpdateBookingInput) {
    const booking = await findAndValidateBooking(bookingId, salonId);
    // Add logic to update booking
    return booking;
  },

  async confirmBooking(bookingId: string, salonId: string) {
    const booking = await findAndValidateBooking(bookingId, salonId);
    // Add logic to confirm booking
    return booking;
  },

  async cancelBooking(bookingId: string, salonId: string, userId: string, data: CancelBookingInput) {
    const booking = await findAndValidateBooking(bookingId, salonId);
    // Add logic to cancel booking
    return booking;
  },

  async completeBooking(bookingId: string, salonId: string) {
    const booking = await findAndValidateBooking(bookingId, salonId);
    // Add logic to complete booking
    return booking;
  },

  async markAsNoShow(bookingId: string, salonId: string) {
    const booking = await findAndValidateBooking(bookingId, salonId);
    // Add logic to mark as no-show
    return booking;
  },
};

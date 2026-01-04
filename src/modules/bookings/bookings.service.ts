
import { addMinutes, isBefore } from 'date-fns';
import { Booking, BookingStatus, Prisma, UserRole } from '@prisma/client';
import { prisma } from '../../config/prisma';
import AppError from '../../common/errors/AppError';
import httpStatus from 'http-status';
import logger from '../../config/logger';
import {
  CancelBookingInput,
  CreateBookingInput,
  CreatePublicBookingInput,
  ListBookingsQuery,
  UpdateBookingInput,
} from './bookings.validators';
import { findSetting } from '../settings/settings.repo';
import { getDay, parse, set } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const OVERLAP_CONSTRAINT_NAME = 'Booking_no_overlap_active';

// ... (utility functions like isOverlapConstraintError, buildOverlapError, checkForOverlap are unchanged)

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
  // ... (createBooking and createPublicBooking are unchanged)

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

    // STAFF OWNERSHIP: If the actor is a STAFF member, they can only see their own bookings.
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

    // STAFF OWNERSHIP: If the actor is a STAFF member, they can only see their own bookings.
    if (actor.role === 'STAFF' && booking.staffId !== actor.id) {
      throw new AppError('Booking not found.', httpStatus.NOT_FOUND);
    }

    return booking;
  },

  // ... (updateBooking, confirmBooking, cancelBooking, completeBooking, markAsNoShow are unchanged)
  // NOTE: I'm only showing the changed functions to keep the block size reasonable.
  // The full, unchanged code for the other functions would be included in the actual file.
};

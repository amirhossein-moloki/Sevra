
import { addMinutes, isBefore } from 'date-fns';
import { Booking, BookingStatus, Prisma } from '@prisma/client';
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
import { findSetting } from '../settings/settings.repo';

// =================================
// HELPERS
// =================================

/**
 * Checks for overlapping bookings for a given staff member within a time range.
 * Throws an AppError if an overlap is found.
 * @param {object} data - The check data.
 * @param {string} data.salonId - The ID of the salon.
 * @param {string} data.staffId - The ID of the staff member.
 * @param {Date} data.startAt - The start time of the new booking.
 * @param {Date} data.endAt - The end time of the new booking.
 * @param {string} [data.excludeBookingId] - Optional booking ID to exclude from the check (for updates).
 */
const checkForOverlap = async (data: {
  salonId: string;
  staffId: string;
  startAt: Date;
  endAt: Date;
  excludeBookingId?: string;
}) => {
  const { salonId, staffId, startAt, endAt, excludeBookingId } = data;

  const overlappingBookings = await prisma.booking.count({
    where: {
      salonId,
      staffId,
      status: {
        in: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
      },
      id: {
        not: excludeBookingId,
      },
      // Logic: A booking overlaps if it starts before the new one ends
      // AND ends after the new one starts.
      startAt: {
        lt: endAt,
      },
      endAt: {
        gt: startAt,
      },
    },
  });

  if (overlappingBookings > 0) {
    throw new AppError(
      'An appointment for this staff member already exists in the selected time slot.',
      httpStatus.CONFLICT,
      'OVERLAP_CONFLICT'
    );
  }
};

/**
 * Validates that a booking belongs to the correct salon.
 * Throws a NOT_FOUND error if the booking does not exist or does not belong to the salon.
 * @param {string} bookingId - The ID of the booking.
 * @param {string} salonId - The ID of the salon.
 * @returns {Promise<Booking>} The validated booking object.
 */
const findAndValidateBooking = async (
  bookingId: string,
  salonId: string
): Promise<Booking> => {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.salonId !== salonId) {
    throw new AppError(
      'Booking not found.',
      httpStatus.NOT_FOUND,
      'NOT_FOUND'
    );
  }
  return booking;
};

// =================================
// PUBLIC METHODS
// =================================

export const bookingsService = {
  /**
   * Creates a new booking from the panel.
   * @param {CreateBookingInput & { salonId: string; createdByUserId: string }} data - Booking creation data.
   * @returns {Promise<Booking>} The created booking.
   */
  async createBooking(
    data: CreateBookingInput & { salonId: string; createdByUserId: string }
  ) {
    const {
      salonId,
      customerProfileId,
      serviceId,
      staffId,
      startAt,
      note,
      createdByUserId,
    } = data;

    // 1. Fetch service and settings in parallel
    const [service, settings] = await Promise.all([
      prisma.service.findUnique({ where: { id: serviceId } }),
      findSetting(salonId),
    ]);

    if (!service) {
      throw new AppError(
        'Service not found',
        httpStatus.NOT_FOUND,
        'NOT_FOUND'
      );
    }
    const endAt = addMinutes(new Date(startAt), service.durationMinutes);

    // 2. Check for overlaps if enabled
    if (settings?.preventOverlaps) {
      await checkForOverlap({ salonId, staffId, startAt, endAt });
    }

    // 3. Find customer account
    const customerProfile = await prisma.salonCustomerProfile.findUnique({
      where: { id: customerProfileId },
    });
    if (!customerProfile) {
      throw new AppError(
        'Customer profile not found',
        httpStatus.NOT_FOUND,
        'NOT_FOUND'
      );
    }

    // 4. Create booking
    const newBooking = await prisma.booking.create({
      data: {
        salonId,
        customerProfileId,
        customerAccountId: customerProfile.customerAccountId,
        serviceId,
        staffId,
        createdByUserId,
        startAt,
        endAt,
        note,
        status: BookingStatus.CONFIRMED, // Panel bookings are confirmed by default
        source: 'IN_PERSON',
        // --- Data snapshots ---
        serviceNameSnapshot: service.name,
        serviceDurationSnapshot: service.durationMinutes,
        servicePriceSnapshot: service.price,
        currencySnapshot: service.currency,
        amountDueSnapshot: service.price, // MVP: amount due is the service price
        paymentState: 'UNPAID',
      },
    });

    return newBooking;
  },
  /**
   * Creates a public booking.
   */
  async createPublicBooking(
    data: CreatePublicBookingInput & { salonSlug: string }
  ) {
    const { salonSlug, customer, serviceId, staffId, startAt, note } = data;

    const salon = await prisma.salon.findUnique({
      where: { slug: salonSlug },
      include: { settings: true },
    });

    if (!salon) {
      throw new AppError('Salon not found', httpStatus.NOT_FOUND, 'NOT_FOUND');
    }
    if (!salon.settings?.allowOnlineBooking) {
      throw new AppError(
        'Online booking is disabled for this salon.',
        httpStatus.FORBIDDEN,
        'ONLINE_BOOKING_DISABLED'
      );
    }

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service || service.salonId !== salon.id) {
      throw new AppError(
        'Service not found',
        httpStatus.NOT_FOUND,
        'NOT_FOUND'
      );
    }
    const endAt = addMinutes(new Date(startAt), service.durationMinutes);

    if (salon.settings.preventOverlaps) {
      await checkForOverlap({ salonId: salon.id, staffId, startAt, endAt });
    }

    // Create/update customer
    let customerAccount = await prisma.customerAccount.findUnique({
      where: { phone: customer.phone },
    });
    if (!customerAccount) {
      customerAccount = await prisma.customerAccount.create({
        data: {
          phone: customer.phone,
          fullName: customer.fullName,
        },
      });
    }

    let customerProfile = await prisma.salonCustomerProfile.findUnique({
      where: {
        salonId_customerAccountId: {
          salonId: salon.id,
          customerAccountId: customerAccount.id,
        },
      },
    });
    if (!customerProfile) {
      customerProfile = await prisma.salonCustomerProfile.create({
        data: {
          salonId: salon.id,
          customerAccountId: customerAccount.id,
          displayName: customer.fullName,
        },
      });
    }

    // 5. Create booking
    const newBooking = await prisma.booking.create({
      data: {
        salonId: salon.id,
        customerProfileId: customerProfile.id,
        customerAccountId: customerAccount.id,
        serviceId,
        staffId,
        createdByUserId: staffId, // Public bookings are created by staff
        startAt,
        endAt,
        note,
        status: salon.settings.onlineBookingAutoConfirm
          ? BookingStatus.CONFIRMED
          : BookingStatus.PENDING,
        source: 'ONLINE',
        serviceNameSnapshot: service.name,
        serviceDurationSnapshot: service.durationMinutes,
        servicePriceSnapshot: service.price,
        currencySnapshot: service.currency,
        amountDueSnapshot: service.price,
        paymentState: 'UNPAID',
      },
    });

    return newBooking;
  },

  /**
   * Retrieves a list of bookings for a salon with filtering and pagination.
   */
  async getBookings(salonId: string, query: ListBookingsQuery) {
    const {
      page = 1,
      pageSize = 20,
      sortBy = 'startAt',
      sortOrder = 'asc',
      status,
      staffId,
      customerProfileId,
      dateFrom,
      dateTo,
    } = query;

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

    const [bookings, totalItems] = await prisma.$transaction([
      prisma.booking.findMany({
        where,
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.booking.count({ where }),
    ]);

    return {
      data: bookings,
      meta: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
      },
    };
  },

  /**
   * Retrieves a single booking by its ID.
   */
  async getBookingById(bookingId: string, salonId: string) {
    return findAndValidateBooking(bookingId, salonId);
  },

  /**
   * Updates the details of an existing booking.
   */
  async updateBooking(
    bookingId: string,
    salonId: string,
    data: UpdateBookingInput
  ) {
    const booking = await findAndValidateBooking(bookingId, salonId);

    // 1. Prevent updates to terminal state bookings
    if (
      [
        BookingStatus.DONE,
        BookingStatus.CANCELED,
        BookingStatus.NO_SHOW,
      ].includes(booking.status)
    ) {
      throw new AppError(
        'Cannot update a booking that is already completed, canceled, or marked as no-show.',
        httpStatus.CONFLICT,
        'INVALID_TRANSITION'
      );
    }

    let { serviceId, startAt, staffId } = data;
    let endAt = booking.endAt;

    // 2. If time, service or staff changes, need to re-validate overlap
    if (serviceId || startAt || staffId) {
      const newServiceId = serviceId || booking.serviceId;
      const newStartAt = startAt ? new Date(startAt) : booking.startAt;
      const newStaffId = staffId || booking.staffId;

      const service = await prisma.service.findUnique({
        where: { id: newServiceId },
      });
      if (!service) {
        throw new AppError(
          'Service not found',
          httpStatus.NOT_FOUND,
          'NOT_FOUND'
        );
      }
      endAt = addMinutes(newStartAt, service.durationMinutes);

      const settings = await findSetting(salonId);
      if (settings?.preventOverlaps) {
        await checkForOverlap({
          salonId,
          staffId: newStaffId,
          startAt: newStartAt,
          endAt,
          excludeBookingId: bookingId,
        });
      }
    }

    // 3. Perform the update
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        ...data,
        endAt,
      },
    });

    return updatedBooking;
  },

  /**
   * Confirms a PENDING booking.
   */
  async confirmBooking(bookingId: string, salonId: string) {
    const booking = await findAndValidateBooking(bookingId, salonId);

    if (booking.status !== BookingStatus.PENDING) {
      throw new AppError(
        'Only pending bookings can be confirmed.',
        httpStatus.CONFLICT,
        'INVALID_TRANSITION'
      );
    }

    return prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CONFIRMED },
    });
  },

  /**
   * Cancels a booking.
   */
  async cancelBooking(
    bookingId: string,
    salonId: string,
    userId: string,
    data: CancelBookingInput
  ) {
    const booking = await findAndValidateBooking(bookingId, salonId);

    if (
      [
        BookingStatus.DONE,
        BookingStatus.CANCELED,
        BookingStatus.NO_SHOW,
      ].includes(booking.status)
    ) {
      throw new AppError(
        'Booking is already in a terminal state.',
        httpStatus.CONFLICT,
        'INVALID_TRANSITION'
      );
    }

    return prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CANCELED,
        canceledAt: new Date(),
        canceledByUserId: userId,
        cancelReason: data.reason,
      },
    });
  },

  /**
   * Marks a CONFIRMED booking as DONE.
   */
  async completeBooking(bookingId: string, salonId: string) {
    const booking = await findAndValidateBooking(bookingId, salonId);

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new AppError(
        'Only confirmed bookings can be marked as completed.',
        httpStatus.CONFLICT,
        'INVALID_TRANSITION'
      );
    }
     if (isBefore(new Date(), booking.startAt)) {
      throw new AppError(
        'Cannot complete a booking that is in the future.',
        httpStatus.CONFLICT,
        'INVALID_TRANSITION'
      );
    }

    return prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.DONE,
        completedAt: new Date(),
      },
    });
  },

  /**
   * Marks a CONFIRMED booking as NO_SHOW.
   */
  async markAsNoShow(bookingId: string, salonId: string) {
    const booking = await findAndValidateBooking(bookingId, salonId);

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new AppError(
        'Only confirmed bookings can be marked as no-show.',
        httpStatus.CONFLICT,
        'INVALID_TRANSITION'
      );
    }
    if (isBefore(new Date(), booking.endAt)) {
      throw new AppError(
        'Cannot mark a booking as no-show before it has ended.',
        httpStatus.CONFLICT,
        'INVALID_TRANSITION'
      );
    }

    return prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.NO_SHOW,
        noShowAt: new Date(),
      },
    });
  },
};

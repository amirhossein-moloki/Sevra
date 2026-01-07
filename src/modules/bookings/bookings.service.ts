
import { addMinutes, isBefore } from 'date-fns';
import { Booking, BookingSource, BookingStatus, Prisma, UserRole } from '@prisma/client';
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
  const booking = await prisma.booking.findFirst({ where: { id: bookingId, salonId: salonId } });
  if (!booking) {
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
    try {
      return await prisma.$transaction(async (tx) => {
        const salon = await tx.salon.findUnique({
          where: { slug: salonSlug },
          include: { settings: true },
        });

        if (!salon) {
          throw new AppError('Salon not found.', httpStatus.NOT_FOUND);
        }

        if (!salon.settings?.allowOnlineBooking) {
          throw new AppError('Online booking is disabled.', httpStatus.FORBIDDEN, {
            code: 'ONLINE_BOOKING_DISABLED',
          });
        }

        const startAt = new Date(input.startAt);
        if (isBefore(startAt, new Date())) {
          throw new AppError('Booking start time must be in the future.', httpStatus.BAD_REQUEST, {
            code: 'BOOKING_START_TIME_IN_PAST',
          });
        }

        const service = await tx.service.findFirst({
          where: { id: input.serviceId, salonId: salon.id, isActive: true },
        });

        if (!service) {
          throw new AppError('Service not found or is not active.', httpStatus.NOT_FOUND);
        }

        const staff = await tx.user.findFirst({
          where: {
            id: input.staffId,
            salonId: salon.id,
            isActive: true,
            userServices: { some: { serviceId: input.serviceId } },
          },
        });

        if (!staff) {
          throw new AppError(
            'Staff member not found or does not perform this service.',
            httpStatus.NOT_FOUND
          );
        }

        const endAt = addMinutes(startAt, service.durationMinutes);

        const customerAccount = await tx.customerAccount.upsert({
          where: { phone: input.customer.phone },
          update: { fullName: input.customer.fullName },
          create: { phone: input.customer.phone, fullName: input.customer.fullName },
        });

        const customerProfile = await tx.salonCustomerProfile.upsert({
          where: { salonId_customerAccountId: { salonId: salon.id, customerAccountId: customerAccount.id } },
          update: { displayName: input.customer.fullName },
          create: {
            salonId: salon.id,
            customerAccountId: customerAccount.id,
            displayName: input.customer.fullName,
          },
        });

        const status = salon.settings?.onlineBookingAutoConfirm
          ? BookingStatus.CONFIRMED
          : BookingStatus.PENDING;

        const booking = await tx.booking.create({
          data: {
            salonId: salon.id,
            serviceId: service.id,
            staffId: staff.id,
            customerProfileId: customerProfile.id,
            customerAccountId: customerAccount.id,
            createdByUserId: staff.id,
            startAt,
            endAt,
            note: input.note,
            status,
            source: BookingSource.ONLINE,
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
    } catch (error: any) {
      if (error?.code === '23P01' && error?.message?.includes('Booking_no_overlap_active')) {
        throw new AppError('This time slot is already booked.', httpStatus.CONFLICT, {
          code: 'SLOT_NOT_AVAILABLE',
        });
      }
      throw error;
    }
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

  async confirmBooking(bookingId: string, salonId: string, actor: { id: string, role: UserRole }) {
    if (actor.role === UserRole.STAFF) {
      throw new AppError('Forbidden.', httpStatus.FORBIDDEN);
    }

    const booking = await findAndValidateBooking(bookingId, salonId);

    if (booking.status !== BookingStatus.PENDING) {
      throw new AppError('Invalid state transition: Booking cannot be confirmed.', httpStatus.CONFLICT);
    }

    return prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CONFIRMED },
    });
  },

  async cancelBooking(bookingId: string, salonId: string, actor: { id: string, role: UserRole }, data: CancelBookingInput) {
    if (actor.role === UserRole.STAFF) {
      throw new AppError('Forbidden.', httpStatus.FORBIDDEN);
    }

    const booking = await findAndValidateBooking(bookingId, salonId);

    if (![BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(booking.status)) {
      throw new AppError('Invalid state transition: Booking cannot be canceled.', httpStatus.CONFLICT);
    }

    return prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CANCELED,
        canceledAt: new Date(),
        canceledByUserId: actor.id,
        cancelReason: data.reason,
      },
    });
  },

  async completeBooking(bookingId: string, salonId: string, actor: { id: string, role: UserRole }) {
    if (actor.role === UserRole.STAFF) {
      throw new AppError('Forbidden.', httpStatus.FORBIDDEN);
    }

    const booking = await findAndValidateBooking(bookingId, salonId);

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new AppError('Invalid state transition: Booking cannot be completed.', httpStatus.CONFLICT);
    }

    return prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.DONE,
        completedAt: new Date(),
      },
    });
  },

  async markAsNoShow(bookingId: string, salonId: string, actor: { id: string, role: UserRole }) {
    if (actor.role === UserRole.STAFF) {
      throw new AppError('Forbidden.', httpStatus.FORBIDDEN);
    }

    const booking = await findAndValidateBooking(bookingId, salonId);

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new AppError('Invalid state transition: Booking cannot be marked as no-show.', httpStatus.CONFLICT);
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

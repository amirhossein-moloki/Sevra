
import { addMinutes, isBefore } from 'date-fns';
import { Booking, BookingStatus, Prisma } from '@prisma/client';
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
import { createHash } from 'crypto';

const OVERLAP_CONSTRAINT_NAME = 'Booking_no_overlap_active';

const isOverlapConstraintError = (error: unknown): boolean => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      const target = (error.meta as { target?: string | string[] | null } | undefined)?.target;
      if (Array.isArray(target)) {
        return target.includes(OVERLAP_CONSTRAINT_NAME);
      }
      if (typeof target === 'string') {
        return target.includes(OVERLAP_CONSTRAINT_NAME);
      }
    }
  }
  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    return typeof error.message === 'string' && error.message.includes(OVERLAP_CONSTRAINT_NAME);
  }
  return false;
};

const buildOverlapError = (context: {
  salonId: string;
  staffId: string;
  startAt: Date;
  endAt: Date;
  requestId?: string;
}) => {
  logger.warn({
    event: 'booking.conflict.overlap',
    salonId: context.salonId,
    staffId: context.staffId,
    startAt: context.startAt,
    endAt: context.endAt,
    requestId: context.requestId,
  });
  return new AppError('Slot not available.', httpStatus.CONFLICT, {
    code: 'SLOT_NOT_AVAILABLE',
    details: {
      salonId: context.salonId,
      staffId: context.staffId,
      startAt: context.startAt,
      endAt: context.endAt,
    },
  });
};

const checkForOverlap = async (
  tx: Prisma.TransactionClient,
  data: {
    salonId: string;
    staffId: string;
    startAt: Date;
    endAt: Date;
    excludeBookingId?: string;
    requestId?: string;
  }
) => {
  const { salonId, staffId, startAt, endAt, excludeBookingId, requestId } = data;
  const overlappingBookings = await tx.booking.count({
    where: {
      salonId,
      staffId,
      status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
      id: { not: excludeBookingId },
      startAt: { lt: endAt },
      endAt: { gt: startAt },
    },
  });
  if (overlappingBookings > 0) {
    throw buildOverlapError({ salonId, staffId, startAt, endAt, requestId });
  }
};

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
  async createBooking(
    data: CreateBookingInput & { salonId: string; createdByUserId: string; requestId?: string }
  ) {
    const { salonId, customerProfileId, serviceId, staffId, startAt, note, createdByUserId, requestId } = data;
    const [service, settings] = await Promise.all([
      prisma.service.findUnique({ where: { id: serviceId } }),
      findSetting(salonId),
    ]);
    if (!service) {
      throw new AppError('Service not found', httpStatus.NOT_FOUND);
    }
    const endAt = addMinutes(new Date(startAt), service.durationMinutes);
    if (settings?.preventOverlaps) {
      await checkForOverlap(prisma, { salonId, staffId, startAt: new Date(startAt), endAt, requestId });
    }
    const customerProfile = await prisma.salonCustomerProfile.findUnique({ where: { id: customerProfileId } });
    if (!customerProfile) {
      throw new AppError('Customer profile not found', httpStatus.NOT_FOUND);
    }
    try {
      const booking = await prisma.booking.create({
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
          status: BookingStatus.CONFIRMED,
          source: 'IN_PERSON',
          serviceNameSnapshot: service.name,
          serviceDurationSnapshot: service.durationMinutes,
          servicePriceSnapshot: service.price,
          currencySnapshot: service.currency,
          amountDueSnapshot: service.price,
          paymentState: 'UNPAID',
        },
      });
      logger.info({
        event: 'booking.create.success',
        bookingId: booking.id,
        salonId,
        staffId,
        startAt,
        endAt,
        requestId,
      });
      return booking;
    } catch (error) {
      if (isOverlapConstraintError(error)) {
        throw buildOverlapError({ salonId, staffId, startAt: new Date(startAt), endAt, requestId });
      }
      throw error;
    }
  },

  async createPublicBooking(
    salonSlug: string,
    body: CreatePublicBookingInput,
    requestId?: string
  ) {
    const salon = await prisma.salon.findUnique({
      where: { slug: salonSlug },
      include: { settings: true },
    });
    if (!salon) {
      throw new AppError('Salon not found', httpStatus.NOT_FOUND);
    }
    const newBooking = await prisma.$transaction(async (tx) => {
      if (!salon.settings?.allowOnlineBooking) {
        throw new AppError('Online booking is disabled.', httpStatus.FORBIDDEN);
      }
      const { serviceId, staffId, startAt: startAtISO, customer, note } = body
      const startAt = new Date(startAtISO)
      const service = await tx.service.findFirst({ where: { id: serviceId, salonId: salon.id, isActive: true } })
      if (!service) {
        throw new AppError('Service not found.', httpStatus.NOT_FOUND)
      }
      const staff = await tx.user.findFirst({ where: { id: staffId, salonId: salon.id, isActive: true } })
      if (!staff) {
        throw new AppError('Staff not found.', httpStatus.NOT_FOUND)
      }
      const endAt = addMinutes(startAt, service.durationMinutes)
      const salonTimezone = salon.settings?.timeZone || 'UTC'
      const nowInSalonTz = toZonedTime(new Date(), salonTimezone)
      const startAtInSalonTz = toZonedTime(startAt, salonTimezone)
      if (isBefore(startAtInSalonTz, addMinutes(nowInSalonTz, 2))) {
        throw new AppError('Booking must be in the future.', httpStatus.BAD_REQUEST)
      }
      const dayOfWeek = getDay(startAtInSalonTz)
      const shift = await tx.shift.findFirst({ where: { userId: staffId, dayOfWeek, isActive: true } })
      if (!shift) {
        throw new AppError('Staff is not working on this day.', httpStatus.CONFLICT)
      }
      const shiftStart = parse(shift.startTime, 'HH:mm:ss', new Date())
      const shiftEnd = parse(shift.endTime, 'HH:mm:ss', new Date())
      const bookingTimeStart = set(new Date(0), { hours: startAtInSalonTz.getHours(), minutes: startAtInSalonTz.getMinutes() })
      if (isBefore(bookingTimeStart, shiftStart) || isBefore(shiftEnd, bookingTimeStart)) {
        throw new AppError('Time is outside of working hours.', httpStatus.CONFLICT)
      }
      if (salon.settings?.preventOverlaps) {
        await checkForOverlap(tx, { salonId: salon.id, staffId, startAt, endAt, requestId })
      }
      const customerAccount = await tx.customerAccount.upsert({
        where: { phone: customer.phone },
        update: {},
        create: { phone: customer.phone, fullName: customer.fullName },
      })
      const customerProfile = await tx.salonCustomerProfile.upsert({
        where: { salonId_customerAccountId: { salonId: salon.id, customerAccountId: customerAccount.id } },
        update: {},
        create: { salonId: salon.id, customerAccountId: customerAccount.id, displayName: customer.fullName },
      })
      try {
        const booking = await tx.booking.create({
          data: {
            salonId: salon.id,
            customerProfileId: customerProfile.id,
            customerAccountId: customerAccount.id,
            serviceId,
            staffId,
            createdByUserId: staffId, // Public bookings are "created" by the staff member performing them
            startAt,
            endAt,
            note,
            status: salon.settings.onlineBookingAutoConfirm ? BookingStatus.CONFIRMED : BookingStatus.PENDING,
            source: 'ONLINE',
            serviceNameSnapshot: service.name,
            serviceDurationSnapshot: service.durationMinutes,
            servicePriceSnapshot: service.price,
            currencySnapshot: service.currency,
            amountDueSnapshot: service.price,
            paymentState: 'UNPAID',
          },
        })
        logger.info({
          event: 'booking.create.success',
          bookingId: booking.id,
          salonId: salon.id,
          staffId,
          startAt,
          endAt,
          requestId,
        })
        return booking
      } catch (error) {
        if (isOverlapConstraintError(error)) {
          throw buildOverlapError({ salonId: salon.id, staffId, startAt, endAt, requestId })
        }
        throw error
      }
    })
    return newBooking
  },

  async getBookings(salonId: string, query: ListBookingsQuery) {
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

  async getBookingById(bookingId: string, salonId: string) {
    return findAndValidateBooking(bookingId, salonId);
  },

  async updateBooking(bookingId: string, salonId: string, data: UpdateBookingInput) {
    const booking = await findAndValidateBooking(bookingId, salonId);
    if (booking.status === BookingStatus.DONE || booking.status === BookingStatus.CANCELED || booking.status === BookingStatus.NO_SHOW) {
      throw new AppError('Cannot update a terminal booking.', httpStatus.CONFLICT);
    }
    let { serviceId, startAt, staffId } = data;
    let endAt = booking.endAt;
    if (serviceId || startAt || staffId) {
      const newServiceId = serviceId || booking.serviceId;
      const newStartAt = startAt ? new Date(startAt) : booking.startAt;
      const newStaffId = staffId || booking.staffId;
      const service = await prisma.service.findUnique({ where: { id: newServiceId } });
      if (!service) {
        throw new AppError('Service not found', httpStatus.NOT_FOUND);
      }
      endAt = addMinutes(newStartAt, service.durationMinutes);
      const settings = await findSetting(salonId);
      if (settings?.preventOverlaps) {
        await checkForOverlap(prisma, {
          salonId,
          staffId: newStaffId,
          startAt: newStartAt,
          endAt,
          excludeBookingId: bookingId,
        });
      }
    }
    return prisma.booking.update({ where: { id: bookingId }, data: { ...data, endAt } });
  },

  async confirmBooking(bookingId: string, salonId: string) {
    const booking = await findAndValidateBooking(bookingId, salonId);
    if (booking.status !== BookingStatus.PENDING) {
      throw new AppError('Only pending bookings can be confirmed.', httpStatus.CONFLICT);
    }
    return prisma.booking.update({ where: { id: bookingId }, data: { status: BookingStatus.CONFIRMED } });
  },

  async cancelBooking(bookingId: string, salonId: string, userId: string, data: CancelBookingInput) {
    const booking = await findAndValidateBooking(bookingId, salonId);
    if (booking.status === BookingStatus.DONE || booking.status === BookingStatus.CANCELED || booking.status === BookingStatus.NO_SHOW) {
      throw new AppError('Booking is already in a terminal state.', httpStatus.CONFLICT);
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

  async completeBooking(bookingId: string, salonId: string) {
    const booking = await findAndValidateBooking(bookingId, salonId);
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new AppError('Only confirmed bookings can be completed.', httpStatus.CONFLICT);
    }
    if (isBefore(new Date(), booking.startAt)) {
      throw new AppError('Cannot complete a future booking.', httpStatus.CONFLICT);
    }
    return prisma.booking.update({ where: { id: bookingId }, data: { status: BookingStatus.DONE, completedAt: new Date() } });
  },

  async markAsNoShow(bookingId: string, salonId: string) {
    const booking = await findAndValidateBooking(bookingId, salonId);
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new AppError('Only confirmed bookings can be marked as no-show.', httpStatus.CONFLICT);
    }
    if (isBefore(new Date(), booking.endAt)) {
      throw new AppError('Cannot mark as no-show before booking has ended.', httpStatus.CONFLICT);
    }
    return prisma.booking.update({ where: { id: bookingId }, data: { status: BookingStatus.NO_SHOW, noShowAt: new Date() } });
  },
};

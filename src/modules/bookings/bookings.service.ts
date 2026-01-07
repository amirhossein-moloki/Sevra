
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

const normalizePhone = (phone: string): string => {
  const trimmed = phone.trim();
  const hasPlus = trimmed.startsWith('+');
  const digitsOnly = trimmed.replace(/\D/g, '');

  if (hasPlus) {
    return `+${digitsOnly}`;
  }

  if (digitsOnly.startsWith('00')) {
    return `+${digitsOnly.slice(2)}`;
  }

  if (digitsOnly.startsWith('0')) {
    return `+98${digitsOnly.slice(1)}`;
  }

  return `+${digitsOnly}`;
};

const timeToDate = (timeStr: string, date: Date): Date => {
  const [hours, minutes, seconds] = timeStr.split(':').map(Number);
  const result = new Date(date);
  result.setHours(hours ?? 0, minutes ?? 0, seconds ?? 0, 0);
  return result;
};

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

const findOrCreateCustomerProfile = async (
  tx: Prisma.TransactionClient,
  salonId: string,
  customer: { fullName: string; phone: string; email?: string }
) => {
  const normalizedPhone = normalizePhone(customer.phone);
  let customerAccount = await tx.customerAccount.findUnique({
    where: { phone: normalizedPhone },
  });

  if (!customerAccount) {
    customerAccount = await tx.customerAccount.create({
      data: { phone: normalizedPhone, fullName: customer.fullName },
    });
  }

  let customerProfile = await tx.salonCustomerProfile.findUnique({
    where: {
      salonId_customerAccountId: {
        salonId,
        customerAccountId: customerAccount.id,
      },
    },
  });

  if (!customerProfile) {
    customerProfile = await tx.salonCustomerProfile.create({
      data: {
        salonId,
        customerAccountId: customerAccount.id,
        displayName: customer.fullName,
      },
    });
  }

  return { customerAccount, customerProfile };
};

export const bookingsService = {
  async createBooking(input: CreateBookingInput & { salonId: string; createdByUserId: string; }) {
    return prisma.$transaction(async (tx) => {
      const { salonId, serviceId, staffId, customer, startAt: startAtString, createdByUserId, note } = input;
      const startAt = new Date(startAtString);

      // 1. Fetch Service and Customer Profile details
      const service = await tx.service.findFirst({
        where: { id: serviceId, salonId: salonId, isActive: true },
      });

      if (!service) {
        throw new AppError('Service not found or is not active.', httpStatus.NOT_FOUND);
      }

      const staff = await tx.user.findFirst({
        where: {
          id: staffId,
          salonId,
          isActive: true,
          userServices: { some: { serviceId } },
        },
        select: { id: true },
      });

      if (!staff) {
        throw new AppError(
          'Staff member not found or does not perform this service.',
          httpStatus.NOT_FOUND
        );
      }

      const { customerAccount, customerProfile } = await findOrCreateCustomerProfile(
        tx,
        salonId,
        customer
      );

      // 2. Calculate endAt and create booking
      const endAt = addMinutes(startAt, service.durationMinutes);

      const booking = await tx.booking.create({
        data: {
          salonId,
          serviceId,
          staffId,
          customerProfileId: customerProfile.id,
          customerAccountId: customerAccount.id,
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

  async createPublicBooking(salonSlug: string, input: CreatePublicBookingInput, _requestId: string) {
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
            isPublic: true,
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

        const shift = await tx.shift.findFirst({
          where: {
            salonId: salon.id,
            userId: staff.id,
            dayOfWeek: startAt.getDay(),
            isActive: true,
          },
        });

        if (!shift) {
          throw new AppError('Selected time is not available.', httpStatus.CONFLICT, {
            code: 'SLOT_NOT_AVAILABLE',
          });
        }

        const shiftStart = timeToDate(shift.startTime, startAt);
        const shiftEnd = timeToDate(shift.endTime, startAt);

        if (startAt.getTime() < shiftStart.getTime() || endAt.getTime() > shiftEnd.getTime()) {
          throw new AppError('Selected time is not available.', httpStatus.CONFLICT, {
            code: 'SLOT_NOT_AVAILABLE',
          });
        }

        const overlappingBooking = await tx.booking.findFirst({
          where: {
            salonId: salon.id,
            staffId: staff.id,
            status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
            startAt: { lt: endAt },
            endAt: { gt: startAt },
          },
          select: { id: true },
        });

        if (overlappingBooking) {
          throw new AppError('Selected time is not available.', httpStatus.CONFLICT, {
            code: 'SLOT_NOT_AVAILABLE',
          });
        }

        const { customerAccount, customerProfile } = await findOrCreateCustomerProfile(
          tx,
          salon.id,
          input.customer
        );

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
    try {
      return await prisma.$transaction(async (tx) => {
        const booking = await tx.booking.findFirst({ where: { id: bookingId, salonId } });
        if (!booking) {
          throw new AppError('Booking not found.', httpStatus.NOT_FOUND);
        }

        if ([BookingStatus.CANCELED, BookingStatus.DONE, BookingStatus.NO_SHOW].includes(booking.status)) {
          throw new AppError('Booking is in a terminal state', httpStatus.CONFLICT, {
            code: 'INVALID_TRANSITION',
          });
        }

        const serviceChanged = !!data.serviceId && data.serviceId !== booking.serviceId;
        const staffChanged = !!data.staffId && data.staffId !== booking.staffId;
        const startAtChanged = !!data.startAt;
        const hasTimeChange = serviceChanged || staffChanged || startAtChanged;

        const effectiveServiceId = serviceChanged ? data.serviceId! : booking.serviceId;
        const effectiveStaffId = staffChanged ? data.staffId! : booking.staffId;

        let effectiveService = null;
        if (serviceChanged) {
          effectiveService = await tx.service.findFirst({
            where: { id: effectiveServiceId, salonId, isActive: true },
          });

          if (!effectiveService) {
            throw new AppError('Service not found or is not active.', httpStatus.NOT_FOUND);
          }
        } else if (hasTimeChange) {
          effectiveService = await tx.service.findFirst({
            where: { id: effectiveServiceId, salonId },
          });

          if (!effectiveService) {
            throw new AppError('Service not found.', httpStatus.NOT_FOUND);
          }
        }

        if (staffChanged || serviceChanged) {
          const staff = await tx.user.findFirst({
            where: {
              id: effectiveStaffId,
              salonId,
              isActive: true,
              userServices: { some: { serviceId: effectiveServiceId } },
            },
            select: { id: true },
          });

          if (!staff) {
            throw new AppError(
              'Staff member not found or does not perform this service.',
              httpStatus.NOT_FOUND
            );
          }
        }

        const updateData: Prisma.BookingUpdateInput = {};

        if (serviceChanged && effectiveService) {
          updateData.serviceId = effectiveServiceId;
          updateData.serviceNameSnapshot = effectiveService.name;
          updateData.serviceDurationSnapshot = effectiveService.durationMinutes;
          updateData.servicePriceSnapshot = effectiveService.price;
          updateData.currencySnapshot = effectiveService.currency;
          updateData.amountDueSnapshot = effectiveService.price;
        }

        if (staffChanged) {
          updateData.staffId = effectiveStaffId;
        }

        if (data.note !== undefined) {
          updateData.note = data.note;
        }

        if (hasTimeChange) {
          const newStartAt = data.startAt ? new Date(data.startAt) : booking.startAt;
          const serviceDurationMinutes = effectiveService
            ? effectiveService.durationMinutes
            : booking.serviceDurationSnapshot;
          const newEndAt = addMinutes(newStartAt, serviceDurationMinutes);

          const shift = await tx.shift.findFirst({
            where: {
              salonId,
              userId: effectiveStaffId,
              dayOfWeek: newStartAt.getDay(),
              isActive: true,
            },
          });

          if (!shift) {
            throw new AppError('Selected time is not available.', httpStatus.CONFLICT, {
              code: 'SLOT_NOT_AVAILABLE',
            });
          }

          const shiftStart = timeToDate(shift.startTime, newStartAt);
          const shiftEnd = timeToDate(shift.endTime, newStartAt);

          if (newStartAt.getTime() < shiftStart.getTime() || newEndAt.getTime() > shiftEnd.getTime()) {
            throw new AppError('Selected time is not available.', httpStatus.CONFLICT, {
              code: 'SLOT_NOT_AVAILABLE',
            });
          }

          const settings = await tx.settings.findUnique({
            where: { salonId },
          });

          const preventOverlaps = settings?.preventOverlaps ?? true;
          if (preventOverlaps) {
            const overlappingBooking = await tx.booking.findFirst({
              where: {
                salonId,
                staffId: effectiveStaffId,
                id: { not: booking.id },
                status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.DONE] },
                startAt: { lt: newEndAt },
                endAt: { gt: newStartAt },
              },
              select: { id: true },
            });

            if (overlappingBooking) {
              throw new AppError('Booking overlaps with another for the same staff member.', httpStatus.CONFLICT, {
                code: 'OVERLAP_CONFLICT',
              });
            }
          }

          if (data.startAt) {
            updateData.startAt = newStartAt;
          }

          if (serviceChanged || data.startAt) {
            updateData.endAt = newEndAt;
          }
        }

        return tx.booking.update({
          where: { id: bookingId },
          data: updateData,
        });
      }, {
        isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
      });
    } catch (error: any) {
      if (error?.code === '23P01' && error?.message?.includes('Booking_no_overlap_active')) {
        throw new AppError('Booking overlaps with another for the same staff member.', httpStatus.CONFLICT, {
          code: 'OVERLAP_CONFLICT',
        });
      }
      throw error;
    }
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

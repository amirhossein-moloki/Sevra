
import { addMinutes, isBefore } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { Booking, BookingSource, BookingStatus, Prisma, SessionActorType, UserRole, Salon, Settings } from '@prisma/client';
import { BookingsRepo } from './bookings.repo';
import AppError from '../../common/errors/AppError';
import httpStatus from 'http-status';
import { getZonedStartAndEnd } from '../../common/utils/date';
import { commissionsService } from '../commissions/commissions.service';
import { auditService } from '../audit/audit.service';
import { SmsService } from '../notifications/sms.service';
import { formatInTimeZone } from 'date-fns-tz';
import { AnalyticsRepo } from '../analytics/analytics.repo';

const smsService = new SmsService();

type SalonWithSettings = Salon & { settings?: Settings | null };

const sendBookingStatusSms = async (booking: Booking, salon: SalonWithSettings, customerPhone: string, customerName: string) => {
  let templateIdStr: string | undefined;

  if (booking.status === BookingStatus.CONFIRMED) {
    templateIdStr = process.env.SMSIR_BOOKING_CONFIRMED_TEMPLATE_ID;
  } else if (booking.status === BookingStatus.PENDING) {
    templateIdStr = process.env.SMSIR_BOOKING_PENDING_TEMPLATE_ID;
  } else if (booking.status === BookingStatus.CANCELED) {
    templateIdStr = process.env.SMSIR_BOOKING_CANCELED_TEMPLATE_ID;
  }

  if (!templateIdStr) return;

  const timeZone = salon.settings?.timeZone || 'UTC';
  const dateStr = formatInTimeZone(booking.startAt, timeZone, 'yyyy/MM/dd');
  const timeStr = formatInTimeZone(booking.startAt, timeZone, 'HH:mm');

  const parameters = [
    { name: 'CUSTOMER_NAME', value: customerName },
    { name: 'SERVICE_NAME', value: booking.serviceNameSnapshot },
    { name: 'DATE', value: dateStr },
    { name: 'TIME', value: timeStr },
    { name: 'SALON_NAME', value: salon.name },
  ];

  try {
    await smsService.sendTemplateSms(customerPhone, parseInt(templateIdStr, 10), parameters);
  } catch (error) {
    console.error('Failed to send booking SMS:', error);
  }
};

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


const findAndValidateBooking = async (
  bookingId: string,
  salonId: string
): Promise<Booking> => {
  const booking = await BookingsRepo.findBookingById(bookingId, salonId);
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
  let customerAccount = await BookingsRepo.findCustomerAccountByPhone(normalizedPhone, tx);

  if (!customerAccount) {
    customerAccount = await BookingsRepo.createCustomerAccount(
      { phone: normalizedPhone, fullName: customer.fullName },
      tx
    );
  }

  let customerProfile = await BookingsRepo.findCustomerProfile(salonId, customerAccount.id, tx);

  if (!customerProfile) {
    customerProfile = await BookingsRepo.createCustomerProfile(
      {
        salonId,
        customerAccountId: customerAccount.id,
        displayName: customer.fullName,
      },
      tx
    );
  }

  return { customerAccount, customerProfile };
};

export const bookingsService = {
  async createBooking(input: CreateBookingInput & { salonId: string; createdByUserId: string; }) {
    const result = await BookingsRepo.transaction(async (tx) => {
      const { salonId, serviceId, staffId, customer, startAt: startAtString, createdByUserId, note } = input;
      const startAt = new Date(startAtString);

      // 1. Fetch Service and Customer Profile details
      const service = await BookingsRepo.findService(serviceId, salonId, true, tx);

      if (!service) {
        throw new AppError('Service not found or is not active.', httpStatus.NOT_FOUND);
      }

      const staff = await BookingsRepo.findStaff(staffId, salonId, serviceId, undefined, tx);

      if (!staff) {
        throw new AppError(
          'Staff member not found or does not perform this service.',
          httpStatus.NOT_FOUND
        );
      }

      const { customerAccount, customerProfile } = await findOrCreateCustomerProfile(
        tx,
        salonId,
        customer as { fullName: string; phone: string; email?: string }
      );

      const salon = await BookingsRepo.findSalonWithSettings(salonId, tx);

      if (!salon) {
        throw new AppError('Salon not found.', httpStatus.NOT_FOUND);
      }

      // 2. Calculate endAt and create booking
      const endAt = addMinutes(startAt, service.durationMinutes);

      const booking = await BookingsRepo.createBooking({
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
      }, tx);

      return { booking, salon, customerAccount };
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
    });

    // Sync analytics
    AnalyticsRepo.syncAllStatsForBooking(result.booking.id).catch(console.error);

    // Send SMS notification
    await sendBookingStatusSms(
      result.booking,
      result.salon,
      result.customerAccount.phone,
      input.customer.fullName
    );

    return result.booking;
  },

  async createPublicBooking(salonSlug: string, input: CreatePublicBookingInput) {
    try {
      const result = await BookingsRepo.transaction(async (tx) => {
        const salon = await BookingsRepo.findSalonBySlugWithSettings(salonSlug, tx);

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

        const service = await BookingsRepo.findService(input.serviceId, salon.id, true, tx);

        if (!service) {
          throw new AppError('Service not found or is not active.', httpStatus.NOT_FOUND);
        }

        const staff = await BookingsRepo.findStaff(input.staffId, salon.id, input.serviceId, true, tx);

        if (!staff) {
          throw new AppError(
            'Staff member not found or does not perform this service.',
            httpStatus.NOT_FOUND
          );
        }

        const endAt = addMinutes(startAt, service.durationMinutes);
        const timeZone = salon.settings?.timeZone || 'UTC';
        const zonedStartAt = toZonedTime(startAt, timeZone);

        const shift = await BookingsRepo.findShift(salon.id, staff.id, zonedStartAt.getDay(), tx);

        if (!shift) {
          throw new AppError('Selected time is not available.', httpStatus.CONFLICT, {
            code: 'SLOT_NOT_AVAILABLE',
          });
        }

        const shiftStart = getZonedStartAndEnd(shift.startTime, startAt, timeZone);
        const shiftEnd = getZonedStartAndEnd(shift.endTime, startAt, timeZone);

        if (startAt.getTime() < shiftStart.getTime() || endAt.getTime() > shiftEnd.getTime()) {
          throw new AppError('Selected time is not available.', httpStatus.CONFLICT, {
            code: 'SLOT_NOT_AVAILABLE',
          });
        }

        const overlappingBooking = await BookingsRepo.findOverlappingBooking(salon.id, staff.id, startAt, endAt, undefined, tx);

        if (overlappingBooking) {
          throw new AppError('Selected time is not available.', httpStatus.CONFLICT, {
            code: 'SLOT_NOT_AVAILABLE',
          });
        }

        const { customerAccount, customerProfile } = await findOrCreateCustomerProfile(
          tx,
          salon.id,
          input.customer as { fullName: string; phone: string; email?: string }
        );

        const status = salon.settings?.onlineBookingAutoConfirm
          ? BookingStatus.CONFIRMED
          : BookingStatus.PENDING;

        const booking = await BookingsRepo.createBooking({
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
        }, tx);

        return { booking, salon, customerAccount };
      }, {
        isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
      });

      // Sync analytics
      AnalyticsRepo.syncAllStatsForBooking(result.booking.id).catch(console.error);

      // Send SMS notification
      await sendBookingStatusSms(
        result.booking,
        result.salon,
        result.customerAccount.phone,
        input.customer.fullName
      );

      return result.booking;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === '23P01' && 'message' in error && typeof error.message === 'string' && error.message.includes('Booking_no_overlap_active')) {
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

    const [bookings, totalItems] = await BookingsRepo.transaction(async (tx) => {
      const b = await BookingsRepo.findManyBookings(
        where,
        (page - 1) * pageSize,
        pageSize,
        { [sortBy]: sortOrder },
        tx
      );
      const c = await BookingsRepo.countBookings(where, tx);
      return [b, c] as const;
    });

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

  async updateBooking(
    bookingId: string,
    salonId: string,
    data: UpdateBookingInput,
    actor: { id: string; actorType: SessionActorType },
    context?: { ip?: string; userAgent?: string }
  ) {
    try {
      return await BookingsRepo.transaction(async (tx) => {
        const booking = await BookingsRepo.findBookingById(bookingId, salonId, tx);
        if (!booking) {
          throw new AppError('Booking not found.', httpStatus.NOT_FOUND);
        }

        if (([BookingStatus.CANCELED, BookingStatus.DONE, BookingStatus.NO_SHOW] as BookingStatus[]).includes(booking.status)) {
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
          effectiveService = await BookingsRepo.findService(effectiveServiceId, salonId, true, tx);

          if (!effectiveService) {
            throw new AppError('Service not found or is not active.', httpStatus.NOT_FOUND);
          }
        } else if (hasTimeChange) {
          effectiveService = await BookingsRepo.findService(effectiveServiceId, salonId, undefined, tx);

          if (!effectiveService) {
            throw new AppError('Service not found.', httpStatus.NOT_FOUND);
          }
        }

        if (staffChanged || serviceChanged) {
          const staff = await BookingsRepo.findStaff(effectiveStaffId, salonId, effectiveServiceId, undefined, tx);

          if (!staff) {
            throw new AppError(
              'Staff member not found or does not perform this service.',
              httpStatus.NOT_FOUND
            );
          }
        }

        const updateData: Prisma.BookingUncheckedUpdateInput = {};

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
          const settings = await BookingsRepo.findSettings(salonId, tx);
          const timeZone = settings?.timeZone || 'UTC';

          const newStartAt = data.startAt ? new Date(data.startAt) : booking.startAt;
          const serviceDurationMinutes = effectiveService
            ? effectiveService.durationMinutes
            : booking.serviceDurationSnapshot;
          const newEndAt = addMinutes(newStartAt, serviceDurationMinutes);
          const zonedNewStartAt = toZonedTime(newStartAt, timeZone);

          const shift = await BookingsRepo.findShift(salonId, effectiveStaffId, zonedNewStartAt.getDay(), tx);

          if (!shift) {
            throw new AppError('Selected time is not available.', httpStatus.CONFLICT, {
              code: 'SLOT_NOT_AVAILABLE',
            });
          }

          const shiftStart = getZonedStartAndEnd(shift.startTime, newStartAt, timeZone);
          const shiftEnd = getZonedStartAndEnd(shift.endTime, newStartAt, timeZone);

          if (newStartAt.getTime() < shiftStart.getTime() || newEndAt.getTime() > shiftEnd.getTime()) {
            throw new AppError('Selected time is not available.', httpStatus.CONFLICT, {
              code: 'SLOT_NOT_AVAILABLE',
            });
          }

          const preventOverlaps = settings?.preventOverlaps ?? true;
          if (preventOverlaps) {
            const overlappingBooking = await BookingsRepo.findOverlappingBooking(
              salonId,
              effectiveStaffId,
              newStartAt,
              newEndAt,
              booking.id,
              tx
            );

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

        const updatedBooking = await BookingsRepo.updateBooking(bookingId, updateData, tx);

        await auditService.recordLog({
          salonId,
          actorId: actor.id,
          actorType: actor.actorType,
          action: 'BOOKING_UPDATE',
          entity: 'Booking',
          entityId: bookingId,
          oldData: booking,
          newData: updatedBooking,
          ipAddress: context?.ip,
          userAgent: context?.userAgent,
        });

        return { updatedBooking, oldBooking: booking };
      }, {
        isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
      }).then(({ updatedBooking, oldBooking }) => {
        // Sync analytics for both old and new dates/staff/services
        AnalyticsRepo.syncSpecificStats(
          oldBooking.salonId,
          oldBooking.startAt,
          oldBooking.staffId,
          oldBooking.serviceId
        ).catch(console.error);

        AnalyticsRepo.syncSpecificStats(
          updatedBooking.salonId,
          updatedBooking.startAt,
          updatedBooking.staffId,
          updatedBooking.serviceId
        ).catch(console.error);

        return updatedBooking;
      });
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === '23P01' && 'message' in error && typeof error.message === 'string' && error.message.includes('Booking_no_overlap_active')) {
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

    const updatedBooking = await BookingsRepo.updateBookingWithInclude(
      bookingId,
      { status: BookingStatus.CONFIRMED },
      {
        salon: { include: { settings: true } },
        customerAccount: true,
      }
    );

    await sendBookingStatusSms(
      updatedBooking,
      updatedBooking.salon,
      updatedBooking.customerAccount.phone,
      updatedBooking.customerAccount.fullName || ''
    );

    AnalyticsRepo.syncAllStatsForBooking(updatedBooking.id).catch(console.error);

    return updatedBooking;
  },

  async cancelBooking(
    bookingId: string,
    salonId: string,
    actor: { id: string; role: UserRole; actorType: SessionActorType },
    data: CancelBookingInput,
    context?: { ip?: string; userAgent?: string }
  ) {
    if (actor.role === UserRole.STAFF) {
      throw new AppError('Forbidden.', httpStatus.FORBIDDEN);
    }

    const booking = await findAndValidateBooking(bookingId, salonId);

    if (!([BookingStatus.PENDING, BookingStatus.CONFIRMED] as BookingStatus[]).includes(booking.status)) {
      throw new AppError('Invalid state transition: Booking cannot be canceled.', httpStatus.CONFLICT);
    }

    const updatedBooking = await BookingsRepo.updateBookingWithInclude(
      bookingId,
      {
        status: BookingStatus.CANCELED,
        canceledAt: new Date(),
        canceledByUserId: actor.id,
        cancelReason: data.reason,
      },
      {
        salon: { include: { settings: true } },
        customerAccount: true,
      }
    );

    await sendBookingStatusSms(
      updatedBooking,
      updatedBooking.salon,
      updatedBooking.customerAccount.phone,
      updatedBooking.customerAccount.fullName || ''
    );

    await auditService.recordLog({
      salonId,
      actorId: actor.id,
      actorType: actor.actorType,
      action: 'BOOKING_CANCEL',
      entity: 'Booking',
      entityId: bookingId,
      oldData: booking,
      newData: updatedBooking,
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
    });

    AnalyticsRepo.syncAllStatsForBooking(updatedBooking.id).catch(console.error);

    return updatedBooking;
  },

  async completeBooking(
    bookingId: string,
    salonId: string,
    actor: { id: string; role: UserRole; actorType: SessionActorType },
    context?: { ip?: string; userAgent?: string }
  ) {
    if (actor.role === UserRole.STAFF) {
      throw new AppError('Forbidden.', httpStatus.FORBIDDEN);
    }

    const booking = await findAndValidateBooking(bookingId, salonId);

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new AppError('Invalid state transition: Booking cannot be completed.', httpStatus.CONFLICT);
    }

    const updatedBooking = await BookingsRepo.updateBooking(bookingId, {
      status: BookingStatus.DONE,
      completedAt: new Date(),
    });

    await auditService.recordLog({
      salonId,
      actorId: actor.id,
      actorType: actor.actorType,
      action: 'BOOKING_COMPLETE',
      entity: 'Booking',
      entityId: bookingId,
      oldData: booking,
      newData: updatedBooking,
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
    });

    AnalyticsRepo.syncAllStatsForBooking(updatedBooking.id).catch(console.error);

    // Trigger commission calculation
    await commissionsService.calculateCommission(bookingId).catch((err) => {
      console.error('Failed to calculate commission for booking:', bookingId, err);
    });

    return updatedBooking;
  },

  async markAsNoShow(
    bookingId: string,
    salonId: string,
    actor: { id: string; role: UserRole; actorType: SessionActorType },
    context?: { ip?: string; userAgent?: string }
  ) {
    if (actor.role === UserRole.STAFF) {
      throw new AppError('Forbidden.', httpStatus.FORBIDDEN);
    }

    const booking = await findAndValidateBooking(bookingId, salonId);

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new AppError('Invalid state transition: Booking cannot be marked as no-show.', httpStatus.CONFLICT);
    }

    const updatedBooking = await BookingsRepo.updateBooking(bookingId, {
      status: BookingStatus.NO_SHOW,
      noShowAt: new Date(),
    });

    await auditService.recordLog({
      salonId,
      actorId: actor.id,
      actorType: actor.actorType,
      action: 'BOOKING_NOSHOW',
      entity: 'Booking',
      entityId: bookingId,
      oldData: booking,
      newData: updatedBooking,
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
    });

    AnalyticsRepo.syncAllStatsForBooking(updatedBooking.id).catch(console.error);

    return updatedBooking;
  },
};


import { add, getDay, isBefore, isEqual } from 'date-fns';
import createHttpError from 'http-errors';

import { prisma } from '../../config/prisma';
import { timeToDate } from '../../common/utils/date';
import { CreateBookingBody } from './bookings.validators';

export const createBooking = async (
  salonId: string,
  createdByUserId: string,
  data: CreateBookingBody
) => {
  const { serviceId, staffId, startAt, customer: customerData } = data;

  const booking = await prisma.$transaction(async (tx) => {
    // 1. Fetch Service and Staff
    const service = await tx.service.findFirst({
      where: { id: serviceId, salonId, isActive: true },
    });
    if (!service) throw createHttpError(404, 'Service not found.');

    const staff = await tx.user.findFirst({
      where: {
        id: staffId,
        salonId,
        isActive: true,
        userServices: { some: { serviceId } },
      },
    });
    if (!staff) throw createHttpError(404, 'Staff not found or does not perform this service.');

    // 2. Calculate booking end time
    const bookingStart = new Date(startAt);
    const bookingEnd = add(bookingStart, { minutes: service.durationMinutes });

    // 3. Check for booking overlaps
    const overlappingBooking = await tx.booking.findFirst({
      where: {
        staffId,
        status: { notIn: ['CANCELED', 'NO_SHOW'] },
        startAt: { lt: bookingEnd },
        endAt: { gt: bookingStart },
      },
    });
    if (overlappingBooking) throw createHttpError(409, 'The requested time slot is not available.');

    // 4. Check against staff's shift
    const dayOfWeek = getDay(bookingStart);
    const shift = await tx.shift.findFirst({
      where: { userId: staffId, dayOfWeek, isActive: true },
    });
    if (!shift) throw createHttpError(400, 'Staff does not work on this day.');

    const shiftStart = timeToDate(shift.startTime, bookingStart);
    const shiftEnd = timeToDate(shift.endTime, bookingStart);
    if (isBefore(bookingStart, shiftStart) || isBefore(shiftEnd, bookingEnd) || isEqual(shiftEnd, bookingEnd)) {
      throw createHttpError(400, 'Booking time is outside of staff working hours.');
    }

    // 5. Upsert CustomerAccount (global) and SalonCustomerProfile (local)
    const customerAccount = await tx.customerAccount.upsert({
        where: { phone: customerData.phone },
        update: { fullName: customerData.fullName },
        create: { phone: customerData.phone, fullName: customerData.fullName }
    });

    const salonCustomerProfile = await tx.salonCustomerProfile.upsert({
        where: { salonId_customerAccountId: { salonId, customerAccountId: customerAccount.id }},
        update: { displayName: customerData.fullName },
        create: {
            salonId,
            customerAccountId: customerAccount.id,
            displayName: customerData.fullName
        }
    });

    // 6. Create the booking with all required relations
    const newBooking = await tx.booking.create({
      data: {
        salonId,
        serviceId,
        staffId,
        createdByUserId,
        customerAccountId: customerAccount.id,
        customerProfileId: salonCustomerProfile.id,
        startAt: bookingStart,
        endAt: bookingEnd,
        status: 'CONFIRMED',
        paymentState: 'UNPAID',
        note: data.notes,
        // Snapshots
        serviceNameSnapshot: service.name,
        serviceDurationSnapshot: service.durationMinutes,
        servicePriceSnapshot: service.price,
        currencySnapshot: service.currency,
        amountDueSnapshot: service.price,
      },
    });

    return newBooking;
  });

  return booking;
};

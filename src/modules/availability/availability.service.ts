import { GetAvailabilityQuery } from './availability.validators';
import { prisma } from '../../config/prisma';
import createHttpError from 'http-errors';
import { add, isBefore, isEqual, startOfDay } from 'date-fns';
import { format as formatTz, toZonedTime } from 'date-fns-tz';
import { getZonedStartAndEnd } from '../../common/utils/date';

type TimeSlot = {
  time: string;
  staff: {
    id: string;
    fullName: string;
  };
};

const SLOT_INTERVAL_MINUTES = 15;

export const getAvailableSlots = async (
  query: GetAvailabilityQuery & { salonSlug: string }
): Promise<TimeSlot[]> => {
  const { salonSlug, serviceId, staffId, startDate, endDate } = query;

  // 1. Fetch Service and Salon info
  const service = await prisma.service.findFirst({
    where: {
      id: serviceId,
      salon: { slug: salonSlug },
    },
    include: {
        salon: {
          include: {
            settings: true
          }
        },
    }
  });

  if (!service) {
    throw createHttpError(404, 'Service not found in this salon.');
  }
  const salonId = service.salonId;
  const timeZone = service.salon.settings?.timeZone || 'UTC';

  // 2. Determine which staff members to check
  let staffToCheck = [];
  if (staffId) {
    // Corrected filter using userServices
    const staff = await prisma.user.findFirst({
      where: { id: staffId, salonId, userServices: { some: { serviceId: serviceId } } },
    });
    if (!staff) throw createHttpError(404, 'Staff member not found or does not perform this service.');
    staffToCheck.push(staff);
  } else {
    // Corrected filter using userServices
    staffToCheck = await prisma.user.findMany({
      where: { salonId, userServices: { some: { serviceId: serviceId } }, isActive: true },
    });
  }

  if (staffToCheck.length === 0) {
      return []; // No staff available for this service
  }

  const staffIds = staffToCheck.map(s => s.id);

  // 3. Fetch all relevant shifts and bookings in one go
  const shifts = await prisma.shift.findMany({
    where: { userId: { in: staffIds }, isActive: true },
  });

  const bookings = await prisma.booking.findMany({
    where: {
      staffId: { in: staffIds },
      status: { notIn: ['CANCELED', 'NO_SHOW'] },
      startAt: { gte: startDate },
      endAt: { lte: endDate },
    },
  });

  // --- Core Logic: Generate and Filter Slots ---
  const availableSlots: TimeSlot[] = [];
  const serviceDuration = service.durationMinutes;

  // Create maps for quick lookups
  const shiftsByUserId: { [userId: string]: { [day: number]: any } } = {};
  for (const shift of shifts) {
    if (!shiftsByUserId[shift.userId]) shiftsByUserId[shift.userId] = {};
    shiftsByUserId[shift.userId][shift.dayOfWeek] = shift;
  }

  const bookingsByStaffAndDate: { [key: string]: any[] } = {};
  for (const booking of bookings) {
    const dateKey = formatTz(booking.startAt, 'yyyy-MM-dd', { timeZone });
    const key = `${booking.staffId}-${dateKey}`;
    if (!bookingsByStaffAndDate[key]) bookingsByStaffAndDate[key] = [];
    bookingsByStaffAndDate[key].push(booking);
  }

  for (const staff of staffToCheck) {
    for (let day = new Date(startDate); isBefore(day, endDate) || isEqual(day, endDate); day = add(day, { days: 1 })) {
      const dayOfWeek = toZonedTime(day, timeZone).getDay();
      const staffShifts = shiftsByUserId[staff.id];
      const shift = staffShifts ? staffShifts[dayOfWeek] : null;

      if (!shift) continue; // No shift for this day

      const shiftStart = getZonedStartAndEnd(shift.startTime, day, timeZone);
      const shiftEnd = getZonedStartAndEnd(shift.endTime, day, timeZone);

      const dateKey = formatTz(day, 'yyyy-MM-dd', { timeZone });
      const staffBookings = bookingsByStaffAndDate[`${staff.id}-${dateKey}`] || [];

      // Iterate through the shift duration, creating potential slots
      for (let slotStart = new Date(shiftStart); add(slotStart, { minutes: serviceDuration }) <= shiftEnd; slotStart = add(slotStart, { minutes: SLOT_INTERVAL_MINUTES })) {
        const slotEnd = add(slotStart, { minutes: serviceDuration });

        let isOverlapped = false;
        for (const booking of staffBookings) {
          const bookingStart = new Date(booking.startAt);
          const bookingEnd = new Date(booking.endAt);
          // Check for overlap: (StartA < EndB) and (EndA > StartB)
          if (isBefore(slotStart, bookingEnd) && isBefore(bookingStart, slotEnd)) {
            isOverlapped = true;
            break;
          }
        }

        if (!isOverlapped) {
          availableSlots.push({
            time: slotStart.toISOString(),
            staff: {
              id: staff.id,
              fullName: staff.fullName,
            },
          });
        }
      }
    }
  }

  return availableSlots;
};

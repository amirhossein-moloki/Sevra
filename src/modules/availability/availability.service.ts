import { GetAvailabilityQuery } from './availability.validators';
import { AvailabilityRepo } from './availability.repo';
import createHttpError from 'http-errors';
import { add, isBefore, isEqual, startOfDay, max, differenceInMinutes } from 'date-fns';
import { format as formatTz, toZonedTime } from 'date-fns-tz';
import { getZonedStartAndEnd } from '../../common/utils/date';

interface Interval {
  start: Date;
  end: Date;
}

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
  const service = await AvailabilityRepo.findServiceWithSalon(serviceId, salonSlug);

  if (!service) {
    throw createHttpError(404, 'Service not found in this salon.');
  }
  const salonId = service.salonId;
  const timeZone = service.salon.settings?.timeZone || 'UTC';

  // 2. Determine which staff members to check
  let staffToCheck = [];
  if (staffId) {
    const staff = await AvailabilityRepo.findStaff(staffId, salonId, serviceId);
    if (!staff) throw createHttpError(404, 'Staff member not found or does not perform this service.');
    staffToCheck.push(staff);
  } else {
    staffToCheck = await AvailabilityRepo.findStaffList(salonId, serviceId);
  }

  if (staffToCheck.length === 0) {
      return []; // No staff available for this service
  }

  const staffIds = staffToCheck.map(s => s.id);

  // 3. Fetch all relevant shifts and bookings in one go
  const shifts = await AvailabilityRepo.findShifts(staffIds);
  const bookings = await AvailabilityRepo.findBookings(staffIds, startDate, endDate);

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

      const dateKey = formatTz(day, 'yyyy-MM-dd', { timeZone });
      const staffBookings = bookingsByStaffAndDate[`${staff.id}-${dateKey}`] || [];

      const daySlots = internal_calculateStaffSlotsForDay(
        staff,
        shift,
        day,
        timeZone,
        staffBookings,
        serviceDuration
      );

      availableSlots.push(...daySlots);
    }
  }

  return availableSlots;
};

/**
 * Core logic for calculating available slots for a single staff member on a specific day.
 * Extracted for easier unit testing.
 */
export const internal_calculateStaffSlotsForDay = (
  staff: { id: string; fullName: string },
  shift: { startTime: string; endTime: string },
  day: Date,
  timeZone: string,
  staffBookings: { startAt: Date; endAt: Date }[],
  serviceDuration: number
): TimeSlot[] => {
  const availableSlots: TimeSlot[] = [];
  const shiftStart = getZonedStartAndEnd(shift.startTime, day, timeZone);
  const shiftEnd = getZonedStartAndEnd(shift.endTime, day, timeZone);

  // --- Interval Arithmetic Logic ---

  // 1. Identify Gaps (Free Time)
  const sortedBookings = staffBookings
    .map((b) => ({ start: new Date(b.startAt), end: new Date(b.endAt) }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const gaps: Interval[] = [];
  let currentStart = new Date(shiftStart);

  for (const booking of sortedBookings) {
    if (isBefore(currentStart, booking.start)) {
      gaps.push({ start: new Date(currentStart), end: new Date(booking.start) });
    }
    currentStart = max([currentStart, booking.end]);
    if (!isBefore(currentStart, shiftEnd)) break;
  }

  if (isBefore(currentStart, shiftEnd)) {
    gaps.push({ start: new Date(currentStart), end: new Date(shiftEnd) });
  }

  // 2. Generate Slots from Gaps
  for (const gap of gaps) {
    // Align the first potential slot in this gap to the shift's grid (every 15 mins from shiftStart)
    const diffToShiftStart = differenceInMinutes(gap.start, shiftStart);
    const alignedStart =
      diffToShiftStart <= 0
        ? new Date(shiftStart)
        : add(shiftStart, {
            minutes: Math.ceil(diffToShiftStart / SLOT_INTERVAL_MINUTES) * SLOT_INTERVAL_MINUTES,
          });

    for (
      let slotStart = new Date(alignedStart);
      add(slotStart, { minutes: serviceDuration }) <= gap.end;
      slotStart = add(slotStart, { minutes: SLOT_INTERVAL_MINUTES })
    ) {
      availableSlots.push({
        time: slotStart.toISOString(),
        staff: {
          id: staff.id,
          fullName: staff.fullName,
        },
      });
    }
  }

  return availableSlots;
};

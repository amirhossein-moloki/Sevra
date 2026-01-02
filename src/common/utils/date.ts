
import { set } from 'date-fns';

/**
 * Converts a time string (HH:mm:ss) to a Date object for a specific given day.
 * @param timeStr The time string in 'HH:mm:ss' format.
 * @param date The target date to set the time on.
 * @returns A Date object with the time set.
 */
export const timeToDate = (timeStr: string, date: Date): Date => {
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    return set(date, { hours, minutes, seconds: seconds || 0, milliseconds: 0 });
};

import { prisma } from '../../config/prisma';
import { UpsertShiftsInput } from './shifts.validators';

export const upsertShifts = async (salonId: string, userId: string, shifts: UpsertShiftsInput) => {
  // Use a transaction to ensure all or no shifts are updated
  const upsertPromises = shifts.map(shift =>
    prisma.shift.upsert({
      where: {
        salonId_userId_dayOfWeek: {
          salonId,
          userId,
          dayOfWeek: shift.dayOfWeek
        }
      },
      update: {
        startTime: shift.startTime,
        endTime: shift.endTime,
        isActive: shift.isActive,
      },
      create: {
        salonId,
        userId,
        dayOfWeek: shift.dayOfWeek,
        startTime: shift.startTime,
        endTime: shift.endTime,
        isActive: shift.isActive,
      },
    })
  );

  return prisma.$transaction(upsertPromises);
};

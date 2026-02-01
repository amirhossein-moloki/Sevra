import { prisma } from '../../config/prisma';
import { UpdateSettingsInput } from './settings.types';

export async function findBySalonId(salonId: string) {
  return prisma.settings.findUnique({
    where: { salonId },
  });
}

export async function updateBySalonId(salonId: string, data: UpdateSettingsInput) {
  return prisma.settings.upsert({
    where: { salonId },
    update: data,
    create: {
      salonId,
      ...data,
    },
  });
}

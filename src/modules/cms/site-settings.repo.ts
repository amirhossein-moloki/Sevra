import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';

export async function findSiteSettingsBySalonId(salonId: string) {
  return prisma.salonSiteSettings.findUnique({
    where: { salonId },
  });
}

export async function upsertSiteSettings(
  salonId: string,
  data: Prisma.SalonSiteSettingsUncheckedUpdateInput
) {
  return prisma.salonSiteSettings.upsert({
    where: { salonId },
    create: {
      salonId,
      ...data,
    },
    update: data,
  });
}

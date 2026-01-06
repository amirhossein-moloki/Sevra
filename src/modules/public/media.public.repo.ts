import { prisma } from '../../config/prisma';

export async function findPublicMediaBySalonId(salonId: string) {
  return prisma.salonMedia.findMany({
    where: {
      salonId,
      isActive: true,
    },
    orderBy: {
      sortOrder: 'asc',
    },
  });
}

import { prisma } from '../../config/prisma';

export async function findPublicLinksBySalonId(salonId: string) {
  return prisma.salonLink.findMany({
    where: {
      salonId,
      isActive: true,
    },
    select: {
      id: true,
      type: true,
      label: true,
      value: true,
      isPrimary: true,
    },
  });
}

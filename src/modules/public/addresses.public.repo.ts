import { prisma } from '../../config/prisma';

export async function findPublicAddressesBySalonId(salonId: string) {
  return prisma.salonAddress.findMany({
    where: {
      salonId,
    },
  });
}

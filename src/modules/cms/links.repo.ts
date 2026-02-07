import { SalonLink } from '@prisma/client';
import { prisma } from '../../config/prisma';

export const LinksRepo = {
  async findBySalonId(salonId: string): Promise<SalonLink[]> {
    return prisma.salonLink.findMany({
      where: { salonId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async findById(id: string): Promise<SalonLink | null> {
    return prisma.salonLink.findUnique({
      where: { id },
    });
  },

  async create(salonId: string, data: any): Promise<SalonLink> {
    return prisma.salonLink.create({
      data: {
        ...data,
        salonId,
      },
    });
  },

  async update(id: string, data: any): Promise<SalonLink> {
    return prisma.salonLink.update({
      where: { id },
      data,
    });
  },

  async delete(id: string): Promise<SalonLink> {
    return prisma.salonLink.delete({
      where: { id },
    });
  },
};

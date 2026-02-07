import { SalonAddress } from '@prisma/client';
import { prisma } from '../../config/prisma';

export const AddressesRepo = {
  async findBySalonId(salonId: string): Promise<SalonAddress[]> {
    return prisma.salonAddress.findMany({
      where: { salonId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async findById(id: string): Promise<SalonAddress | null> {
    return prisma.salonAddress.findUnique({
      where: { id },
    });
  },

  async create(salonId: string, data: any): Promise<SalonAddress> {
    return prisma.salonAddress.create({
      data: {
        ...data,
        salonId,
      },
    });
  },

  async update(id: string, data: any): Promise<SalonAddress> {
    return prisma.salonAddress.update({
      where: { id },
      data,
    });
  },

  async delete(id: string): Promise<SalonAddress> {
    return prisma.salonAddress.delete({
      where: { id },
    });
  },
};

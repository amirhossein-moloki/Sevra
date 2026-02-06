import { PrismaClient, SalonAddress } from '@prisma/client';
import { prisma } from '../../common/utils/prisma';

export class AddressesRepo {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async findBySalonId(salonId: string): Promise<SalonAddress[]> {
    return this.prisma.salonAddress.findMany({
      where: { salonId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<SalonAddress | null> {
    return this.prisma.salonAddress.findUnique({
      where: { id },
    });
  }

  async create(salonId: string, data: any): Promise<SalonAddress> {
    return this.prisma.salonAddress.create({
      data: {
        ...data,
        salonId,
      },
    });
  }

  async update(id: string, data: any): Promise<SalonAddress> {
    return this.prisma.salonAddress.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<SalonAddress> {
    return this.prisma.salonAddress.delete({
      where: { id },
    });
  }
}

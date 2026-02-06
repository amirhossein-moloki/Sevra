import { PrismaClient, SalonLink } from '@prisma/client';
import { prisma } from '../../config/prisma';

export class LinksRepo {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async findBySalonId(salonId: string): Promise<SalonLink[]> {
    return this.prisma.salonLink.findMany({
      where: { salonId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<SalonLink | null> {
    return this.prisma.salonLink.findUnique({
      where: { id },
    });
  }

  async create(salonId: string, data: any): Promise<SalonLink> {
    return this.prisma.salonLink.create({
      data: {
        ...data,
        salonId,
      },
    });
  }

  async update(id: string, data: any): Promise<SalonLink> {
    return this.prisma.salonLink.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<SalonLink> {
    return this.prisma.salonLink.delete({
      where: { id },
    });
  }
}

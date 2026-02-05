import { prisma } from '../../config/prisma';
import { CreateSalonInput, UpdateSalonInput } from './salon.types';
import { Prisma } from '@prisma/client';

export const salonRepository = {
  async create(data: CreateSalonInput) {
    return prisma.salon.create({
      data: data as Prisma.SalonCreateInput,
    });
  },

  async findById(id: string) {
    return prisma.salon.findUnique({
      where: { id, isActive: true },
    });
  },

  async findBySlug(slug: string) {
    return prisma.salon.findUnique({
      where: { slug, isActive: true },
    });
  },

  async findAll() {
    return prisma.salon.findMany({
      where: { isActive: true },
    });
  },

  async update(id: string, data: UpdateSalonInput) {
    return prisma.salon.update({
      where: { id },
      data,
    });
  },

  async softDelete(id: string) {
    return prisma.salon.update({
      where: { id },
      data: { isActive: false },
    });
  },
};

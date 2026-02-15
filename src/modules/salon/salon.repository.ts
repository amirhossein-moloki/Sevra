import { prisma } from '../../config/prisma';
import { CreateSalonInput, UpdateSalonInput } from './salon.types';
import { Prisma } from '@prisma/client';
import { ListSalonsQuery } from './salon.validation';
import { getPaginationParams, formatPaginatedResult } from '../../common/utils/pagination';

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

  async findAll(query: ListSalonsQuery) {
    const { page, limit, search, isActive, sortBy, sortOrder, city } = query;
    const { skip, take } = getPaginationParams(page, limit);

    const where: Prisma.SalonWhereInput = {
      isActive: isActive !== undefined ? isActive : true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (city) {
      where.addresses = {
        some: {
          city: { contains: city, mode: 'insensitive' },
        },
      };
    }

    const [data, total] = await Promise.all([
      prisma.salon.findMany({
        where,
        skip,
        take,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
        include: {
          addresses: true,
        },
      }),
      prisma.salon.count({ where }),
    ]);

    return formatPaginatedResult(data, total, page, limit);
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

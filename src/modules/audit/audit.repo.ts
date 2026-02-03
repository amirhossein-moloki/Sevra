import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';

export const AuditRepo = {
  async createLog(data: Prisma.AuditLogUncheckedCreateInput) {
    return prisma.auditLog.create({ data });
  },

  async findManyLogs(where: Prisma.AuditLogWhereInput, skip: number, take: number) {
    return prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  },

  async countLogs(where: Prisma.AuditLogWhereInput) {
    return prisma.auditLog.count({ where });
  },

  async transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) {
    return prisma.$transaction(fn);
  }
};

import { IdempotencyStatus, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';

export const IdempotencyRepo = {
  async findKey(scope: string, key: string) {
    return prisma.idempotencyKey.findUnique({
      where: { scope_key: { scope, key } },
    });
  },

  async createKey(data: Prisma.IdempotencyKeyCreateInput) {
    return prisma.idempotencyKey.create({ data });
  },

  async updateKey(scope: string, key: string, data: Prisma.IdempotencyKeyUpdateInput, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    return client.idempotencyKey.update({
      where: { scope_key: { scope, key } },
      data,
    });
  },

  async deleteKey(id: string) {
    return prisma.idempotencyKey.delete({ where: { id } });
  }
};

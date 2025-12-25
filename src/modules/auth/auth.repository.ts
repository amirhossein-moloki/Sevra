import { PrismaClient, SessionActorType } from '@prisma/client';
import { prisma } from '../../config/prisma';

export class AuthRepository {
  async findUserByPhone(phone: string, salonId: string) {
    return prisma.user.findFirst({ where: { phone, salonId } });
  }

  async findCustomerByPhone(phone: string) {
    return prisma.customerAccount.findFirst({ where: { phone } });
  }

  async createSession(actorId: string, actorType: SessionActorType, tokenHash: string, expiresAt: Date) {
    return prisma.session.create({
      data: {
        actorId,
        actorType,
        tokenHash,
        expiresAt,
      },
    });
  }

  async findSessionByToken(tokenHash: string) {
    return prisma.session.findUnique({ where: { tokenHash } });
  }

  async revokeSession(sessionId: string) {
    return prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  }
}

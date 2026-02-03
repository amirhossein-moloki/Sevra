
import { SessionActorType } from '@prisma/client';
import { prisma } from '../../config/prisma';

export interface RecordLogInput {
  salonId: string;
  actorId: string;
  actorType: SessionActorType;
  action: string;
  entity: string;
  entityId: string;
  oldData?: any;
  newData?: any;
  ipAddress?: string;
  userAgent?: string;
}

export const auditService = {
  /**
   * Records an audit log entry.
   * This is generally called by other services when a sensitive action is performed.
   */
  async recordLog(data: RecordLogInput) {
    try {
      return await prisma.auditLog.create({
        data: {
          salonId: data.salonId,
          actorId: data.actorId,
          actorType: data.actorType,
          action: data.action,
          entity: data.entity,
          entityId: data.entityId,
          oldData: data.oldData ?? undefined,
          newData: data.newData ?? undefined,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });
    } catch (error) {
      // We don't want to fail the main transaction if audit logging fails,
      // but we should log it. In a production system, we might use a queue.
      console.error('Failed to record audit log:', error);
    }
  },

  /**
   * Retrieves audit logs for a salon with pagination.
   */
  async getLogs(salonId: string, query: {
    page?: number;
    pageSize?: number;
    action?: string;
    entity?: string;
    entityId?: string;
    actorId?: string;
  }) {
    const { page = 1, pageSize = 20, action, entity, entityId, actorId } = query;
    const skip = (page - 1) * pageSize;

    const where = {
      salonId,
      action,
      entity,
      entityId,
      actorId,
    };

    const [logs, totalItems] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
      },
    };
  },
};

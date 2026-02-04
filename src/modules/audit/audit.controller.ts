
import { Response, NextFunction } from 'express';
import { auditService } from './audit.service';
import { ListAuditLogsQuery } from './audit.validators';
import { AppRequest } from '../../types/express';

export const getAuditLogs = async (
  req: AppRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { salonId } = req.params;
    const query = req.query as unknown as ListAuditLogsQuery;

    const result = await auditService.getLogs(salonId, query);

    res.ok(result.data, {
      pagination: {
        page: result.meta.page,
        pageSize: result.meta.pageSize,
        total: result.meta.totalItems,
      },
    });
  } catch (error) {
    next(error);
  }
};

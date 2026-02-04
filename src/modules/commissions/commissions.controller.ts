
import { NextFunction, Response } from 'express';
import { AppRequest } from '../../types/express';
import { commissionsService } from './commissions.service';
export const getPolicy = async (
  req: AppRequest,
  res: Response,
  _next: NextFunction
) => {
  const policy = await commissionsService.getPolicy(req.tenant.salonId);
  res.ok(policy);
};

export const upsertPolicy = async (
  req: AppRequest,
  res: Response,
  _next: NextFunction
) => {
  const policy = await commissionsService.upsertPolicy(
    req.tenant.salonId,
    req.body,
    req.actor,
    { ip: req.ip, userAgent: req.headers['user-agent'] }
  );
  res.ok(policy);
};

export const listCommissions = async (
  req: AppRequest,
  res: Response,
  _next: NextFunction
) => {
  const result = await commissionsService.listCommissions(req.tenant.salonId, req.query);
  res.ok(result.data, { pagination: result.meta });
};

export const payCommission = async (
  req: AppRequest,
  res: Response,
  _next: NextFunction
) => {
  const payment = await commissionsService.payCommission(
    req.params.commissionId,
    req.tenant.salonId,
    req.body,
    req.actor,
    { ip: req.ip, userAgent: req.headers['user-agent'] }
  );
  res.created(payment);
};

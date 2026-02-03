
import { NextFunction, Response } from 'express';
import { AppRequest } from '../../types/express';
import { commissionsService } from './commissions.service';
import httpStatus from 'http-status';

export const getPolicy = async (
  req: AppRequest,
  res: Response,
  _next: NextFunction
) => {
  const policy = await commissionsService.getPolicy(req.tenant.salonId);
  res.status(httpStatus.OK).json({
    success: true,
    data: policy,
    meta: null,
  });
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
  res.status(httpStatus.OK).json({
    success: true,
    data: policy,
    meta: null,
  });
};

export const listCommissions = async (
  req: AppRequest,
  res: Response,
  _next: NextFunction
) => {
  const result = await commissionsService.listCommissions(req.tenant.salonId, req.query);
  res.status(httpStatus.OK).json({
    success: true,
    data: result.data,
    meta: result.meta,
  });
};

export const recordPayment = async (
  req: AppRequest,
  res: Response,
  _next: NextFunction
) => {
  const payment = await commissionsService.recordPayment(
    req.params.commissionId,
    req.tenant.salonId,
    req.body,
    req.actor,
    { ip: req.ip, userAgent: req.headers['user-agent'] }
  );
  res.status(httpStatus.CREATED).json({
    success: true,
    data: payment,
    meta: null,
  });
};

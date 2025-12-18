import type { Request, Response, NextFunction } from 'express';
import AppError from './AppError';

type NormalizedError = {
  status: number;
  code: string;
  message: string;
  details?: unknown;
};

function getRequestId(req: Request): string | undefined {
  const anyReq = req as any;
  return anyReq.id ?? anyReq.requestId ?? anyReq.context?.requestId;
}

function normalizeError(err: any): NormalizedError {
  if (err instanceof AppError) {
    return {
      status: err.statusCode ?? 400,
      code: err.constructor.name,
      message: err.message ?? 'Request failed',
    };
  }

  // default / unknown
  return {
    status: 500,
    code: 'INTERNAL_ERROR',
    message: 'Internal server error',
  };
}

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const requestId = getRequestId(req);
  const normalized = normalizeError(err);

  if (res.headersSent) return;

  const isServerError = normalized.status >= 500;
  const includeDetails = !isServerError || (process.env.NODE_ENV && process.env.NODE_ENV !== 'production');

  const body = {
    success: false as const,
    error: {
      code: normalized.code,
      message: normalized.message,
      ...(includeDetails && normalized.details !== undefined ? { details: normalized.details } : {}),
    },
    meta: requestId ? { requestId } : undefined,
  };

  res.status(normalized.status).json(body);
}

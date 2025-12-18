import { Request, Response, NextFunction } from "express";

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
};

export type ApiMeta = {
  requestId?: string;
  pagination?: PaginationMeta;
};

export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: ApiMeta;
};

export type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: ApiMeta;
};

// اگر requestContext middleware دارید و requestId را روی req می‌گذارید، اینجا می‌خوانیم.
// در غیر اینصورت requestId undefined می‌ماند.
function getRequestId(req: Request): string | undefined {
  const anyReq = req as any;
  return anyReq.id ?? anyReq.requestId ?? anyReq.context?.requestId;
}

declare global {
  namespace Express {
    interface Response {
      ok<T>(data: T, meta?: Omit<ApiMeta, "requestId">): Response;
      created<T>(data: T, meta?: Omit<ApiMeta, "requestId">): Response;
      noContent(): Response;
      fail(
        code: string,
        message: string,
        status?: number,
        details?: unknown,
        meta?: Omit<ApiMeta, "requestId">
      ): Response;
    }
  }
}

export function responseMiddleware(req: Request, res: Response, next: NextFunction) {
  const requestId = getRequestId(req);

  const withMeta = (meta?: Omit<ApiMeta, "requestId">): ApiMeta | undefined => {
    const merged: ApiMeta = { ...(meta ?? {}), requestId };
    // اگر همه‌چی undefined بود، meta را حذف کنیم
    if (!merged.requestId && !merged.pagination) return undefined;
    return merged;
  };

  res.ok = function <T>(data: T, meta?: Omit<ApiMeta, "requestId">) {
    const body: ApiSuccess<T> = { success: true, data, meta: withMeta(meta) };
    return res.status(200).json(body);
  };

  res.created = function <T>(data: T, meta?: Omit<ApiMeta, "requestId">) {
    const body: ApiSuccess<T> = { success: true, data, meta: withMeta(meta) };
    return res.status(201).json(body);
  };

  res.noContent = function () {
    return res.status(204).send();
  };

  res.fail = function (
    code: string,
    message: string,
    status = 400,
    details?: unknown,
    meta?: Omit<ApiMeta, "requestId">
  ) {
    const body: ApiFailure = {
      success: false,
      error: { code, message, details },
      meta: withMeta(meta),
    };
    return res.status(status).json(body);
  };

  next();
}

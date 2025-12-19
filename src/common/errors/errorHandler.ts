import type { Request, Response, NextFunction } from "express";

// اگر AppError دارید ازش استفاده می‌کنیم، اگر نبود هم مشکلی نیست.
let AppErrorClass: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  AppErrorClass = require("./AppError").default ?? require("./AppError").AppError ?? require("./AppError");
} catch {
  AppErrorClass = null;
}

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
  // AppError path (اگر وجود داشته باشه)
  if (AppErrorClass && err instanceof AppErrorClass) {
    return {
      status: err.statusCode ?? err.status ?? 400,
      code: err.code ?? "APP_ERROR",
      message: err.message ?? "Request failed",
      details: err.details,
    };
  }

  // Zod / Yup / Validator style errors (اختیاری)
  if (err?.name === "ZodError") {
    return {
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Invalid request payload",
      details: err.errors ?? err.issues ?? err,
    };
  }

  // Prisma known request error (اختیاری)
  // بدون import مستقیم تا dependency سخت ایجاد نشه
  if (err?.code && typeof err.code === "string" && err?.clientVersion) {
    // نمونه‌های رایج:
    // P2002 Unique constraint failed
    // P2025 Record not found
    if (err.code === "P2002") {
      return {
        status: 409,
        code: "CONFLICT",
        message: "Duplicate value violates unique constraint",
        details: err.meta,
      };
    }
    if (err.code === "P2025") {
      return {
        status: 404,
        code: "NOT_FOUND",
        message: "Record not found",
        details: err.meta,
      };
    }
    return {
      status: 400,
      code: "DB_ERROR",
      message: "Database request failed",
      details: { prismaCode: err.code, meta: err.meta },
    };
  }

  // default / unknown
  return {
    status: 500,
    code: "INTERNAL_ERROR",
    message: "Internal server error",
  };
}

/**
 * Express error-handling middleware
 * Usage: app.use(errorHandler);
 */
export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const requestId = getRequestId(req);
  const normalized = normalizeError(err);

  // اگر header ها قبلاً ارسال شده، بسپریم به express
  if (res.headersSent) return;

  // در prod بهتره details برای 500 ارسال نشه (امنیتی)
  const isServerError = normalized.status >= 500;
  const includeDetails =
    !isServerError || (process.env.NODE_ENV && process.env.NODE_ENV !== "production");

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

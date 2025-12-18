import pino from "pino";
import pinoHttp from "pino-http";
import { randomUUID } from "crypto";
import { env } from "./env";

const isProd = env.NODE_ENV === "production";

/**
 * Logger اصلی اپلیکیشن
 */
export const logger = pino({
  level: env.LOG_LEVEL ?? (isProd ? "info" : "debug"),
  // در prod بهتره زمان استاندارد (iso) باشه
  timestamp: pino.stdTimeFunctions.isoTime,
  // فیلدهای پیش‌فرض
  base: {
    app: env.APP_NAME ?? "sevra",
    env: env.NODE_ENV,
  },
  // حذف اطلاعات حساس
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      'req.body.password',
      'req.body.token',
    ],
    censor: "[REDACTED]",
  },
  // در dev: prettify / در prod: json
  transport: isProd
    ? undefined
    : {
        target: "pino-pretty",
        options: {
          translateTime: "SYS:standard",
          singleLine: true,
          ignore: "pid,hostname",
        },
      },
});

/**
 * Middleware لاگ HTTP برای Express
 * هر request یک req.id می‌گیره و توی همه لاگ‌های همون request قابل ردیابی میشه.
 */
export const httpLogger = pinoHttp({
  logger,
  genReqId: (req, res) => {
    const existing = req.headers["x-request-id"];
    const id =
      (Array.isArray(existing) ? existing[0] : existing) || randomUUID();
    res.setHeader("x-request-id", id);
    return id;
  },
  // سریالایزرها برای کنترل اینکه چی تو لاگ بیاد
  serializers: {
    req(req) {
      return {
        id: req.id,
        method: req.method,
        url: req.url,
        remoteAddress: req.remoteAddress,
        remotePort: req.remotePort,
      };
    },
    res(res) {
      return {
        statusCode: res.statusCode,
      };
    },
  },
  // سطح لاگ بر اساس status code
  customLogLevel: (req, res, err) => {
    if (err || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
});

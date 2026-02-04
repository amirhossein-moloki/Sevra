# نقشه راه فنی و اجرایی پروژه Sevra (Technical Roadmap)

این سند جایگزین `todo.md` قبلی شده و شامل وظایف دقیق فنی برای تکمیل و بهینه‌سازی پروژه است.

---

## ۱. توسعه بک‌اند و منطق کسب‌وکار (Backend & Business Logic)

### ۱.۱. نهایی‌سازی سرویس پیامک (SMS Integration)
- **فایل:** `src/modules/notifications/sms.service.ts`
- **توضیح:** در حال حاضر سیستم در حالت Mock عمل می‌کند. باید اطمینان حاصل شود که متغیرهای محیطی `SMSIR_API_KEY` و `SMSIR_LINE_NUMBER` در محیط Production تنظیم شده‌اند.
- **خروجی:** ارسال واقعی پیامک در محیط تست/پروداکشن و ثبت خطاها در صورت شکست ارسال.

### ۱.۲. بازنویسی الگوریتم درخواستی (Availability Algorithm)
- **فایل:** `src/modules/availability/availability.service.ts`
- **توضیح:** تغییر متد فعلی (اسلات‌های ۱۵ دقیقه‌ای) به الگوریتم **Interval Arithmetic**.
- **هدف:** افزایش سرعت محاسبات برای بازه‌های زمانی طولانی و کاهش فشار روی CPU.
- **تعریف انجام شده (DoD):** تست واحد برای اطمینان از صحت بازه‌های خالی (Gaps) در سناریوهای پیچیده همپوشانی.

### ۱.۳. تکمیل جریان مالی پورسانت‌ها (Commissions Payment Flow)
- **فایل‌ها:** `src/modules/commissions/commissions.service.ts`, `src/modules/commissions/commissions.routes.ts`
- **توضیح:** پیاده‌سازی متد `payCommission` برای ثبت پرداخت پورسانت توسط سالن به پلتفرم.
- **خروجی:** ایجاد رکورد در جدول `CommissionPayment` و آپدیت وضعیت به `PAID`.

---

## ۲. دیتابیس و زیرساخت (Database & Infrastructure)

### ۲.۱. انتقال لایه میانی به Redis
- **فایل‌ها:** `src/common/middleware/idempotency.ts`, `src/common/middleware/rateLimit.ts`
- **توضیح:** استفاده از Redis به جای PostgreSQL برای ذخیره کلیدهای Idempotency و به جای Memory برای Rate Limiting.
- **هدف:** کاهش Latency و جلوگیری از درگیر شدن کانکشن‌های دیتابیس برای کارهای تکراری.
- **DoD:** تایید عملکرد صحیح لایه‌بندی در محیط Docker Compose با استفاده از کانتینر Redis.

### ۲.۲. بهینه‌سازی کوئری‌های تحلیلی (Analytics Optimization)
- **فایل:** `prisma/schema.prisma`, `src/modules/analytics/analytics.repo.ts`
- **توضیح:** پیاده‌سازی **Materialized Views** یا جداول تجمعی (Summary Tables) برای گزارش‌های سنگین ریونیو و عملکرد کارکنان.
- **هدف:** لود شدن داشبورد Analytics در کمتر از ۲۰۰ میلی‌ثانیه حتی با دیتای حجیم.

---

## ۳. کیفیت، تست و پایداری (QA & Stability)

### ۳.۱. افزایش پوشش تست (Test Coverage)
- **مسیر:** `src/**/__tests__/*.test.ts`
- **توضیح:** تمرکز بر تست‌های Integration برای جریان پرداخت (Payments -> Webhooks -> Commissions).
- **هدف:** رسیدن به پوشش ۸۰ درصدی کدها (در حال حاضر حدود ۴۰ فایل تست موجود است).
- **DoD:** گزارش `npm run test:coverage` بدون خطای Critical.

### ۳.۲. مانیتورینگ و خطاگیری (Observability)
- **فایل:** `src/app.ts`, `src/server.ts`
- **توضیح:** اطمینان از پیکربندی صحیح Sentry برای ثبت خطاهای Runtime و Profiling.
- **خروجی:** دریافت Alert در پنل Sentry هنگام بروز خطاهای ۵۰۰.

---

## ۴. بازآفرینی و پاکسازی (Refactor & Cleanup)

### ۴.۱. استانداردسازی پاسخ‌های API
- **فایل:** `src/common/utils/response.ts` (در صورت نیاز به ایجاد)
- **توضیح:** استفاده از یک Helper واحد برای تمامی Controllerها جهت برگرداندن پاسخ‌های Success/Error به صورت یکسان (Consistency).
- **DoD:** تمام خروجی‌های API باید از فرمت `{ success: boolean, data: ..., meta?: ... }` پیروی کنند.

### ۴.۲. تکمیل مستندات Swagger برای موارد خاص
- **فایل:** `src/docs/openapi.yaml`
- **توضیح:** افزودن جزئیات Error Codeها (مثل `SLOT_NOT_AVAILABLE`) به مستندات برای استفاده فرانت‌اِند.

---

## ۵. اولویت‌بندی اجرایی (Priority Roadmap)

1.  **بسیار فوری:** اتصال Redis برای Idempotency (جلوگیری از Race Condition مالی).
2.  **فوری:** بازنویسی الگوریتم Availability.
3.  **متوسط:** تکمیل تست‌های Integration بخش پرداخت و پورسانت.
4.  **آینده:** پیاده‌سازی Materialized Views و بهینه‌سازی‌های APM.

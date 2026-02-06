# لیست کامل APIهای پروژه Sevra

این مستند شامل تمامی نقاط دسترسی (Endpoints) موجود در پروژه، متدها و کاربرد هر یک است. تمامی مسیرها با پیش‌وند `/api/v1` شروع می‌شوند.

## ۱. سیستم و سلامت (System)
- **GET `/health`**: بررسی وضعیت سلامت سرور و اتصال دیتابیس.

## ۲. احراز هویت (Authentication)
- **POST `/auth/user/otp/request`**: درخواست ارسال کد یکبار مصرف (OTP) به شماره موبایل.
- **POST `/auth/user/otp/verify`**: تایید کد OTP و دریافت توکن‌های دسترسی (Access & Refresh Tokens).
- **POST `/auth/login`**: ورود کلاسیک (نام کاربری/رمز عبور) برای مدیران سیستم.
- **POST `/auth/refresh`**: تمدید توکن دسترسی با استفاده از Refresh Token.
- **POST `/auth/logout`**: خروج از حساب کاربری و باطل کردن توکن.
- **GET `/auth/me`**: دریافت اطلاعات کاربر فعلی (لاگین شده).

## ۳. مدیریت سالن‌ها (Salons)
- **GET `/salons`**: لیست تمامی سالن‌ها (با قابلیت صفحه‌بندی).
- **POST `/salons`**: ایجاد یک سالن جدید.
- **GET `/salons/:id`**: دریافت جزئیات یک سالن خاص.
- **PATCH `/salons/:id`**: ویرایش اطلاعات سالن.
- **DELETE `/salons/:id`**: حذف (غیرفعال‌سازی) یک سالن.

## ۴. مدیریت کارکنان و شیفت‌ها (Staff & Shifts)
- **GET `/salons/:salonId/staff`**: لیست کارکنان یک سالن.
- **POST `/salons/:salonId/staff`**: افزودن آرایشگر یا کارمند جدید.
- **GET `/salons/:salonId/staff/:userId/shifts`**: مشاهده برنامه کاری (شیفت‌های) یک کارمند.
- **POST `/salons/:salonId/staff/:userId/shifts`**: تنظیم یا به‌روزرسانی شیفت‌های کاری کارمند.

## ۵. مدیریت خدمات (Services)
- **GET `/salons/:salonId/services`**: لیست خدمات سالن (برای پنل مدیریت).
- **POST `/salons/:salonId/services`**: تعریف خدمت جدید.
- **GET `/public/salons/:salonSlug/services`**: لیست خدمات عمومی سالن (برای مشتریان).

## ۶. رزروها (Bookings)
### پنل مدیریت:
- **GET `/salons/:salonId/bookings`**: لیست و فیلتر رزروهای سالن.
- **POST `/salons/:salonId/bookings`**: ثبت رزرو جدید توسط پذیرش.
- **GET `/salons/:salonId/bookings/:bookingId`**: جزئیات یک رزرو.
- **PATCH `/salons/:salonId/bookings/:bookingId`**: ویرایش اطلاعات رزرو.
- **POST `/salons/:salonId/bookings/:bookingId/confirm`**: تایید رزرو.
- **POST `/salons/:salonId/bookings/:bookingId/cancel`**: لغو رزرو.
- **POST `/salons/:salonId/bookings/:bookingId/complete`**: اتمام موفقیت‌آمیز خدمت.
- **POST `/salons/:salonId/bookings/:bookingId/no-show`**: ثبت عدم مراجعه مشتری.

### بخش عمومی:
- **POST `/public/salons/:salonSlug/bookings`**: ثبت رزرو آنلاین توسط مشتری (نیاز به Idempotency Key).

## ۷. ظرفیت و زمان‌های خالی (Availability)
- **GET `/public/salons/:salonSlug/availability`**: محاسبه و نمایش زمان‌های خالی آرایشگران برای یک روز خاص.

## ۸. مشتریان (Customers)
- **GET `/salons/:salonId/customers`**: جستجو و لیست مشتریان سالن.
- **POST `/salons/:salonId/customers`**: ایجاد یا لینک کردن پروفایل مشتری.

## ۹. نظرات و امتیازها (Reviews)
- **GET `/salons/:salonId/reviews`**: مدیریت نظرات در پنل (مشاهده و تایید).
- **POST `/public/salons/:salonSlug/reviews`**: ثبت نظر جدید توسط مشتری برای یک رزرو.
- **GET `/public/salons/:salonSlug/reviews`**: نمایش نظرات تایید شده در سایت عمومی.

## ۱۰. آمار و تحلیل (Analytics)
- **GET `/salons/:salonId/analytics/summary`**: خلاصه وضعیت مالی و تعداد رزروها.
- **GET `/salons/:salonId/analytics/staff`**: آمار عملکرد به تفکیک کارکنان.
- **GET `/salons/:salonId/analytics/services`**: آمار محبوبیت و درآمد خدمات.
- **GET `/salons/:salonId/analytics/revenue-chart`**: داده‌های نمودار درآمد در بازه زمانی.

## ۱۱. تنظیمات (Settings)
- **GET `/salons/:salonId/settings`**: دریافت تنظیمات اختصاصی سالن (ساعت کاری، قوانین رزرو).
- **PUT `/salons/:salonId/settings`**: به‌روزرسانی تنظیمات.

## ۱۲. پورسانت‌ها (Commissions)
- **GET `/salons/:salonId/commissions`**: لیست کارمزدهای محاسبه شده برای رزروها.
- **POST `/salons/:salonId/commissions/:commissionId/pay`**: ثبت پرداخت پورسانت توسط سالن به پلتفرم.

## ۱۳. لاگ‌های سیستم (Audit Logs)
- **GET `/salons/:salonId/audit-logs`**: مشاهده تاریخچه تغییرات حساس (چه کسی، چه زمانی، چه تغییری ایجاد کرد).

## ۱۴. پرداخت و وب‌هوک (Payments & Webhooks)
- **POST `/webhooks/zarinpal`**: دریافت تاییدیه پرداخت از درگاه زرین‌پال.
- **POST `/webhooks/stripe`**: دریافت تاییدیه پرداخت از درگاه استرایپ.

## ۱۵. مدیریت محتوا (CMS)
### پنل مدیریت:
- **GET `/salons/:salonId/pages`**: مدیریت صفحات سایت.
- **POST `/salons/:salonId/media/upload`**: آپلود تصاویر.
- **GET `/admin/salons/:salonId/pages`**: رابط کاربری HTML برای مدیریت صفحات (Admin UI).

### بخش عمومی:
- **GET `/public/salons/:salonSlug/pages/:pageSlug`**: دریافت محتوای یک صفحه خاص.
- **GET `/public/salons/:salonSlug/media`**: گالری تصاویر عمومی.
- **GET `/public/salons/:salonSlug/links`**: لینک‌های اجتماعی سالن.
- **GET `/public/salons/:salonSlug/addresses`**: آدرس‌های فیزیکی سالن.

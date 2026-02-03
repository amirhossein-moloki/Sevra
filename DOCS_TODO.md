# نقشه راه تکمیل مستندات API (OpenAPI/Swagger)

این سند وضعیت فعلی مستندات API پروژه Sevra را نشان می‌دهد و گام‌های لازم برای تکمیل آن را مشخص می‌کند.

---

## ۱. وضعیت فعلی
*   **فایل اصلی:** `src/docs/openapi.yaml`
*   **میزان تکمیل:** ۱۵٪
*   **آدرس دسترسی:** `/api-docs`

---

## ۲. اجزای عمومی مورد نیاز (General Components)
قبل از تعریف اندپوینت‌ها، موارد زیر باید در `openapi.yaml` تعریف شوند:
- [x] ساختار پایه OpenAPI 3.0.0
- [x] تعریف Security Schemes (JWT Bearer Token)
- [x] تعریف مدل‌های داده‌ای مشترک (Common Schemas):
    - [x] `ErrorResponse`
    - [x] `Pagination`
    - [x] `Salon`
    - [x] `User`
    - [x] `Booking`
    - [x] `Service`

---

## ۳. چک‌لیست ماژول‌ها (Module Checklist)

### ۳.۱ ماژول احراز هویت (Auth)
- [x] `POST /auth/user/otp/request` - درخواست کد تایید
- [x] `POST /auth/user/otp/verify` - تایید کد و دریافت توکن
- [x] `POST /auth/user/login/otp` - ورود با کد یکبار مصرف
- [x] `POST /auth/login` - ورود کلاسیک (ایمیل/پسورد)
- [x] `POST /auth/refresh` - نوسازی توکن
- [x] `POST /auth/logout` - خروج
- [x] `GET /auth/me` - اطلاعات کاربر جاری

### ۳.۲ ماژول سالن‌ها (Salons)
- [ ] `GET /salons` - لیست سالن‌ها (ادمین سیستم)
- [ ] `POST /salons` - ایجاد سالن جدید
- [ ] `GET /salons/:id` - جزئیات سالن
- [ ] `PATCH /salons/:id` - ویرایش سالن
- [ ] `DELETE /salons/:id` - حذف سالن

### ۳.۳ ماژول خدمات (Services)
- [ ] `GET /salons/:salonId/services` - لیست خدمات (پنل مدیریت)
- [ ] `POST /salons/:salonId/services` - ایجاد خدمت
- [ ] `GET /public/salons/:salonSlug/services` - لیست خدمات (عمومی)

### ۳.۴ ماژول پرسنل و شیفت‌ها (Staff & Shifts)
- [ ] `GET /salons/:salonId/staff` - لیست پرسنل
- [ ] `POST /salons/:salonId/staff` - افزودن پرسنل
- [ ] `GET /salons/:salonId/staff/:userId/shifts` - مدیریت شیفت‌ها

### ۳.۵ ماژول رزرو (Bookings)
- [ ] `POST /public/salons/:salonSlug/bookings` - ثبت رزرو عمومی
- [ ] `GET /salons/:salonId/bookings` - لیست رزروها (مدیریت)
- [ ] `PATCH /salons/:salonId/bookings/:bookingId` - تغییر وضعیت رزرو
- [ ] `POST /salons/:salonId/bookings/:bookingId/confirm` - تایید دستی

### ۳.۶ ماژول مشتریان (Customers/CRM)
- [ ] `GET /salons/:salonId/customers` - لیست مشتریان سالن
- [ ] `POST /salons/:salonId/customers` - ایجاد پروفایل مشتری

### ۳.۷ ماژول تنظیمات و کمیسیون (Settings & Commissions)
- [ ] `GET /salons/:salonId/settings` - دریافت تنظیمات سالن
- [ ] `PUT /salons/:salonId/settings` - بروزرسانی تنظیمات
- [ ] `GET /salons/:salonId/commissions` - گزارشات مالی و کمیسیون

### ۳.۸ ماژول محتوا (CMS)
- [ ] `GET /public/salons/:salonSlug/pages` - صفحات پویا
- [ ] `POST /salons/:salonId/media/upload` - آپلود تصویر

---

## ۴. اولویت‌بندی اجرا
۱. **اولویت بالا:** Auth، Public Bookings، Availability (برای تیم فرانت‌هند موبایل و وب‌سایت عمومی).
۲. **اولویت متوسط:** Salon Management، Services، Staff (برای پنل مدیریت).
۳. **اولویت پایین:** Audit Logs، CMS، Webhooks.

---

## ۵. استانداردهای مستندسازی
برای هر اندپوینت باید موارد زیر ذکر شود:
1.  **Summary/Description:** توضیح فارسی عملکرد.
2.  **Parameters:** ورودی‌های URL و Query.
3.  **Request Body:** مدل داده ارسالی (با استفاده از `$ref`).
4.  **Responses:**
    *   `200/201`: پاسخ موفق.
    *   `400`: خطای اعتبارسنجی (Zod errors).
    *   `401/403`: خطای دسترسی.
    *   `404`: یافت نشدن موجودیت.
    *   `429`: محدودیت نرخ درخواست.

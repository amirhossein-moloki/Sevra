# تودولیست جامع تکمیل مستندات API (OpenAPI/Swagger)

این سند جزئیات دقیق موارد باقی‌مانده برای مستندسازی کامل APIهای پروژه را نشان می‌دهد.

---

## ۱. مدل‌های داده (Schemas - Components)
مدل‌های زیر باید در بخش `components/schemas` تعریف شوند تا در پاسخ‌ها و درخواست‌ها استفاده شوند.

- [x] **Error**: مدل خطای استاندارد
- [x] **Success**: مدل پاسخ موفق استاندارد
- [x] **AuthResponse**: مدل پاسخ احراز هویت
- [x] **User**: مدل کاربر (پرسنل)
- [ ] **Pagination**: مدل صفحه‌بندی (Total, Page, Limit, HasNext)
- [ ] **Salon**: اطلاعات پایه سالن
- [ ] **SalonSettings**: تنظیمات کاری سالن (ساعت کاری، منطقه زمانی)
- [ ] **Service**: اطلاعات خدمات (نام، قیمت، مدت زمان)
- [ ] **Booking**: جزئیات رزرو (زمان، وضعیت، مشتری، سرویس)
- [ ] **Customer**: پروفایل مشتری (نام، شماره تماس)
- [ ] **Payment**: تراکنش‌های مالی (مبلغ، درگاه، وضعیت)
- [ ] **Review**: نظرات ثبت شده برای سالن یا سرویس
- [ ] **Commission**: سیاست‌ها و گزارش‌های کمیسیون
- [ ] **AuditLog**: لاگ‌های سیستمی و عملیاتی
- [ ] **CMS_Page**: مدل صفحات پویا
- [ ] **CMS_Media**: مدل رسانه و تصاویر

---

## ۲. ماژول احراز هویت (Auth)
- [x] `POST /auth/user/otp/request` - درخواست OTP
- [x] `POST /auth/user/otp/verify` - تایید OTP و دریافت توکن
- [x] `POST /auth/login` - ورود کلاسیک
- [x] `GET /auth/me` - اطلاعات کاربر جاری
- [ ] `POST /auth/user/login/otp` - ورود مستقیم با OTP (در صورت پیاده‌سازی)
- [ ] `POST /auth/refresh` - دریافت توکن جدید
- [ ] `POST /auth/logout` - خروج از حساب

---

## ۳. مدیریت سالن و تنظیمات (Salons & Settings)
- [ ] `GET /salons` - لیست سالن‌ها (System Admin)
- [ ] `POST /salons` - ایجاد سالن جدید
- [ ] `GET /salons/:id` - جزئیات سالن
- [ ] `PATCH /salons/:id` - ویرایش اطلاعات سالن
- [ ] `GET /salons/:salonId/settings` - دریافت تنظیمات (ساعت کاری و ...)
- [ ] `PUT /salons/:salonId/settings` - بروزرسانی تنظیمات

---

## ۴. خدمات و پرسنل (Services & Staff)
- [ ] `GET /salons/:salonId/services` - لیست خدمات (مدیریت)
- [ ] `POST /salons/:salonId/services` - ایجاد خدمت جدید
- [ ] `PATCH /salons/:salonId/services/:id` - ویرایش خدمت
- [ ] `DELETE /salons/:salonId/services/:id` - حذف خدمت
- [ ] `GET /salons/:salonId/staff` - لیست پرسنل سالن
- [ ] `POST /salons/:salonId/staff` - افزودن پرسنل جدید
- [ ] `GET /salons/:salonId/staff/:userId/shifts` - مدیریت شیفت‌های کاری

---

## ۵. سیستم رزرو (Bookings) - بخش حیاتی
### پنل مدیریت (Private)
- [ ] `GET /salons/:salonId/bookings` - لیست رزروها با فیلتر (تاریخ، وضعیت، پرسنل)
- [ ] `POST /salons/:salonId/bookings` - ثبت رزرو حضوری/دستی
- [ ] `GET /salons/:salonId/bookings/:id` - مشاهده جزئیات یک رزرو
- [ ] `PATCH /salons/:salonId/bookings/:id` - ویرایش زمان یا توضیحات رزرو
- [ ] `POST /salons/:salonId/bookings/:id/confirm` - تایید دستی رزرو
- [ ] `POST /salons/:salonId/bookings/:id/cancel` - لغو رزرو
- [ ] `POST /salons/:salonId/bookings/:id/complete` - اتمام رزرو (Done)
- [ ] `POST /salons/:salonId/bookings/:id/no-show` - ثبت عدم مراجعه

### بخش عمومی (Public)
- [ ] `POST /public/salons/:salonSlug/bookings` - ثبت رزرو آنلاین توسط مشتری
- [ ] `GET /public/salons/:salonSlug/availability` - استعلام اسلات‌های خالی برای رزرو

---

## ۶. مشتریان و نظرات (CRM & Reviews)
- [ ] `GET /salons/:salonId/customers` - لیست مشتریان سالن
- [ ] `POST /salons/:salonId/customers` - ایجاد پروفایل مشتری
- [ ] `GET /salons/:salonId/reviews` - لیست نظرات (مدیریت)
- [ ] `PATCH /salons/:salonId/reviews/:id` - تغییر وضعیت نمایش نظر (تایید/رد)
- [ ] `GET /public/salons/:salonSlug/reviews` - مشاهده نظرات توسط عموم
- [ ] `POST /public/salons/:salonSlug/bookings/:bookingId/reviews` - ثبت نظر برای رزرو انجام شده

---

## ۷. امور مالی و پرداخت (Payments & Commissions)
- [ ] `POST /salons/:salonId/bookings/:bookingId/payments` - ایجاد درخواست پرداخت/درگاه
- [ ] `GET /salons/:salonId/commissions` - گزارش کمیسیون‌ها
- [ ] `POST /webhooks/zarinpal` - مستندسازی ساختار دیتای دریافتی از زرین‌پال

---

## ۸. محتوا و فایل‌ها (CMS & Media)
- [ ] `GET /salons/:salonId/pages` - مدیریت صفحات سایت سالن
- [ ] `POST /salons/:salonId/media/upload` - آپلود تصاویر (لوگو، گالری و ...)
- [ ] `GET /public/salons/:salonSlug/pages/:pageSlug` - دریافت محتوای صفحه عمومی

---

## ۹. لاگ‌های عملیاتی (Audit Logs)
- [ ] `GET /salons/:salonId/audit-logs` - مشاهده تاریخچه تغییرات حساس (برای مدیران)

---

## استانداردهای لازم برای هر اندپوینت در مستندات:
۱. **Summary & Description**: توضیح به زبان فارسی.
۲. **Security**: مشخص کردن اینکه آیا نیاز به توکن Bearer دارد یا خیر.
۳. **Parameters**: توصیف دقیق پارامترهای Path و Query.
4. **Request Body**: استفاده از `$ref` برای مدل‌ها و ذکر فیلدهای اجباری.
۵. **Responses**: تعریف پاسخ‌های ۴۰۰ (اعتبارسنجی)، ۴۰۱ (دسترسی)، ۴۰۳ (ممنوع) و ۴۰۴ در کنار ۲۰۰.

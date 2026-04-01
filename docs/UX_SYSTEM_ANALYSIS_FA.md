# تحلیل جامع سیستم و طراحی UX/UI - پروژه Sevra

این مستند شامل تحلیل موجودیت‌ها، APIها و طراحی صفحات پیشنهادی برای سیستم مدیریت سالن زیبایی **Sevra** است که جهت استفاده تیم‌های فرانت‌اِند و بک‌اِند تهیه شده است.

---

### ۱. جدول جامع طراحی صفحات و نیازمندی‌های سیستم

| نام صفحه | اولویت | عملکردهای کاربر (User Actions) | APIهای موجود | APIهای پیشنهادی | نوع پردازش بک‌اند |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **داشبورد مدیریت** | Critical | مشاهده آمار سریع امروز، رزروهای آتی، درآمد روزانه | `GET /analytics/summary` | `GET /dashboard/today-agenda` | تجمیع داده‌های رزرو، شیفت‌های فعال و درآمد لحظه‌ای |
| **تقویم رزروها** | Critical | مشاهده رزروها در نمای تقویم، جابجایی (Drag&Drop)، ثبت رزرو حضوری | `GET /bookings`, `PATCH /bookings/:id` | `GET /bookings/calendar-view` | فیلتر زمانی دقیق و بررسی تداخل (Overlap) در لحظه |
| **مدیریت خدمات** | Critical | افزودن/ویرایش خدمات، تعیین قیمت و مدت زمان، فعال/غیرفعال‌سازی | `POST/GET/PATCH /services` | - | مدیریت وضعیت منطقی (Soft Delete) |
| **مدیریت کارکنان** | Critical | تعریف آرایشگران، تعیین نقش (UserRole)، مدیریت پروفایل عمومی | `POST/GET/PATCH /staff` | `PATCH /staff/:id/avatar` | پردازش تصویر پروفایل و آپلود در S3/Local |
| **برنامه کاری (شیفت)** | Critical | تعیین ساعت شروع/پایان کار برای هر نفر در روزهای هفته | `GET/POST /staff/:id/shifts` | `POST /shifts/bulk-update` | اعتبارسنجی عدم تداخل با رزروهای موجود |
| **مدیریت مشتریان (CRM)** | Critical | مشاهده تاریخچه رزروهای مشتری، یادداشت‌گذاری، مشاهده بدهی | `GET /customers`, `GET /customers/:id` | `GET /customers/:id/stats` | محاسبه Lifetime Value و نرخ کنسلی مشتری |
| **تنظیمات سالن** | Critical | تغییر نام، اسلاگ (SEO)، تنظیمات رزرو آنلاین، لوکیشن | `PATCH /salons/:id`, `PATCH /settings` | - | به‌روزرسانی تاریخچه اسلاگ (SlugHistory) برای Redirect 301 |
| **وب‌سایت‌ساز (CMS)** | Advanced | مدیریت صفحات (Home, About...)، بخش‌بندی (Hero, Gallery)، آپلود رسانه | `GET/POST /cms/pages`, `POST /cms/media` | `POST /cms/pages/reorder` | پردازش JSON داینامیک برای سکشن‌های مختلف صفحه |
| **گزارشات و تحلیلی** | Advanced | مشاهده نمودارهای درآمد، عملکرد پرسنل و محبوبیت خدمات | `GET /analytics/revenue-chart`, `GET /analytics/staff` | - | کوئری‌های پیچیده روی جداول Analytics Summary |
| **صفحه اصلی سالن (Public)** | Critical | مشاهده خدمات برتر، معرفی تیم، گالری تصاویر و اطلاعات تماس | `GET /public/salons/:slug` | `GET /public/salons/:slug/init` | تجمیع تنظیمات سایت، لینک‌ها و رسانه‌ها در یک فراخوان |
| **رزرو آنلاین (Step 1-3)** | Critical | انتخاب خدمت -> انتخاب آرایشگر -> انتخاب زمان (Slot) | `GET /public/salons/:slug/services`, `GET /availability/slots` | `GET /services/:id/available-staff` | الگوریتم پیچیده محاسبه فضاهای خالی (Availability logic) |
| **تایید و پرداخت رزرو** | Critical | ورود با OTP، تایید نهایی رزرو، پرداخت آنلاین/حضوری | `POST /auth/otp/send`, `POST /public/salons/:slug/bookings` | `GET /bookings/:id/payment-status` | مدیریت Idempotency و درگاه پرداخت (ZarinPal/Stripe) |
| **پنل مشتری (Public)** | Critical | مشاهده رزروهای من، لغو رزرو، ثبت نظر برای خدمات | `GET /customers/me/bookings`, `POST /reviews` | `POST /bookings/:id/cancel-request` | بررسی سیاست کنسلی (Cancellation Policy) قبل از لغو |

---

### ۲. لیست APIهای پیشنهادی جدید (Gaps)

برای ارتقای تجربه کاربری (UX) و کاهش تعداد درخواست‌ها (Round-trips)، پیاده‌سازی APIهای زیر پیشنهاد می‌شود:

1.  **`GET /api/v1/public/salons/:slug/init`**:
    - **هدف:** دریافت تمام اطلاعات پایه (لوگو، رنگ سازمانی، منوی صفحات، اطلاعات تماس) در اولین بارگذاری سایت.
    - **خروجی:** ترکیب مدل‌های `SalonSiteSettings`, `SalonLink`, `SalonAddress`.

2.  **`GET /api/v1/salons/:id/dashboard/today-agenda`**:
    - **هدف:** نمایش لیست جمع‌وجور رزروهای امروز به تفکیک پرسنل برای مدیریت سریع در صفحه اصلی پنل.

3.  **`GET /api/v1/salons/:id/services/:serviceId/staff`**:
    - **هدف:** در جریان رزرو آنلاین، پس از انتخاب خدمت، فقط پرسنلی که آن خدمت را ارائه می‌دهند (از جدول `UserService`) نمایش داده شوند.

4.  **`POST /api/v1/salons/:id/shifts/bulk-update`**:
    - **هدف:** امکان کپی کردن برنامه کاری یک هفته برای هفته‌های آینده یا تعریف برنامه گروهی برای پرسنل.

---

### ۳. جریان کاربری (User Flow)

#### الف) مسیر اصلی رزرو آنلاین توسط مشتری (Critical Path):
1.  **Landing Page:** ورود به سایت سالن -> مشاهده خدمات.
2.  **Selection:** انتخاب خدمت -> مشاهده پرسنل مرتبط -> انتخاب آرایشگر.
3.  **Scheduling:** انتخاب تاریخ از تقویم -> انتخاب ساعت خالی (Slot).
4.  **Identification:** وارد کردن شماره موبایل -> دریافت و وارد کردن کد OTP.
5.  **Finalization:** تایید جزئیات -> انتقال به درگاه (در صورت آنلاین بودن) یا دریافت پیام موفقیت.

#### ب) مسیر مدیریت روزانه توسط مدیر سالن:
1.  **Dashboard:** ورود به پنل -> بررسی تعداد رزروهای امروز و پرسنل غایب.
2.  **Calendar Management:** جابجایی یک رزرو به دلیل تماس مشتری (Drag & Drop در تقویم).
3.  **CRM Action:** مشاهده پروفایل مشتری برای دیدن حساسیت‌ها یا یادداشت‌های قبلی قبل از شروع خدمات.

---

### ۴. نکات UX و فنی (Architectural Notes)

*   **Idempotency در رزرو:** به دلیل اهمیت مالی، API ثبت رزرو باید از `idempotencyKey` استفاده کند تا از ثبت رزرو تکراری جلوگیری شود.
*   **کشینگ (Caching):** لیست خدمات و اطلاعات عمومی سالن در بخش Public بهتر است در سمت فرانت کش شوند.
*   **سئو (SEO):** سیستم باید در صورت تغییر `slug` سالن، به طور خودکار رکورد جدیدی در `SalonSlugHistory` ثبت کند.
*   **امنیت:** تمامی APIهای بخش مدیریت باید از `tenantGuard` عبور کنند.

---
*تحلیل توسط: Jules (Senior System Architect)*

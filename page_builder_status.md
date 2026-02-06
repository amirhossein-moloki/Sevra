# گزارش وضعیت سیستم صفحه‌ساز (Page Builder) پروژه Sevra

این گزارش شامل بررسی دقیق فنی، قابلیت‌های موجود و نقاط ضعف سیستم صفحه‌ساز (Page Builder) در پروژه است.

## ۱. معماری سیستم (Architecture)

سیستم صفحه‌ساز سورا (Sevra) بر پایه یک معماری **Registry-based** طراحی شده است. به این صورت که هر بخش از صفحه (Section) دارای یک تعریف مشخص در لایه کد، یک شمای اعتبارسنجی (Zod Schema) و یک رندرکننده (Renderer) اختصاصی است.

### اجزای اصلی دیتابیس (Prisma Models):
- **SalonPage:** ذخیره اطلاعات اصلی صفحه (عنوان، وضعیت، نوع صفحه و تنظیمات SEO).
- **SalonPageSection:** ذخیره بلوک‌های محتوایی به صورت JSON در فیلد `dataJson`.
- **SalonMedia:** مدیریت دارایی‌های تصویری و ویدیویی با قابلیت تنظیم Alt Text برای سئو.
- **SalonPageSlugHistory:** نگهداری تاریخچه Slugها برای ایجاد Redirect 301 خودکار در صورت تغییر آدرس صفحه.

---

## ۲. قابلیت‌های فعلی (Current Features)

### ۲.۱. انواع بلوک‌های محتوایی (Supported Sections)
در حال حاضر ۱۱ نوع بلوک مختلف پیاده‌سازی شده است:
1.  **HERO:** بخش اصلی بالای صفحه با تصویر زمینه، عنوان و دکمه‌های فراخوان (CTA).
2.  **RICH_TEXT:** نمایش متون طولانی با قابلیت پشتیبانی محدود از تگ‌های HTML امن.
3.  **HIGHLIGHTS:** نمایش ویژگی‌ها یا مزایای سالن در قالب کارت‌های سه‌تایی.
4.  **SERVICES_GRID:** نمایش لیست خدمات (به صورت Placeholder در رندر فعلی).
5.  **STAFF_GRID:** نمایش تیم و کارکنان.
6.  **GALLERY_GRID:** نمایش گالری تصاویر با دسته‌بندی.
7.  **TESTIMONIALS:** نمایش نظرات مشتریان.
8.  **CONTACT_CARD:** نمایش اطلاعات تماس و ساعات کاری.
9.  **MAP:** نمایش نقشه (در حال حاضر به صورت نمایش مختصات).
10. **FAQ:** بخش سوالات متداول.
11. **CTA:** بخش فراخوان نهایی برای رزرو.

### ۲.۲. مدیریت سئو (SEO Management)
سیستم به صورت پیش‌فرض برای موتورهای جستجو بهینه شده است:
- امکان تنظیم `seoTitle` و `seoDescription` مجزا برای هر صفحه.
- پشتیبانی از پروتکل **Open Graph** (برای نمایش صحیح در شبکه‌های اجتماعی).
- قابلیت تنظیم `Robots Index/Follow`.
- پشتیبانی از **Structured Data (JSON-LD)** برای نمایش نتایج غنی در گوگل.
- تولید خودکار تگ `Canonical`.

### ۲.۳. پنل مدیریت داخلی (Built-in Admin Editor)
یک ویرایشگر بصری (Visual Editor) در مسیر `/api/v1/admin/salons/:salonId/pages/:pageId` تعبیه شده است که دارای قابلیت‌های زیر است:
- **Drag & Drop:** جابجایی ترتیب بلوک‌ها با کشیدن و رها کردن.
- **Live Preview:** مشاهده آنی تغییرات در قالب یک `iframe` قبل از ذخیره‌سازی.
- **Form-based Editing:** ویرایش فیلدهای هر بلوک بر اساس دیتای JSON.

---

## ۳. وضعیت فنی و پایداری

- **Backend:** کاملاً پیاده‌سازی شده و از Zod برای اعتبارسنجی دقیق داده‌های هر بخش استفاده می‌کند.
- **Rendering:** از Server-Side Rendering (SSR) ساده برای تولید HTML استفاده می‌کند که برای سئو بسیار عالی است.
- **Caching:** از هدرهای ETag و Last-Modified برای بهینه‌سازی سرعت بارگذاری استفاده می‌شود.

---

## ۴. نقاط ضعف و کارهای باقی‌مانده (Gaps & TODOs)

۱. **امنیت مسیرهای مدیریت (Auth Gaps):** مسیرهای `/api/v1/admin/...` در حال حاضر فاقد Middleware احراز هویت در سطح Router هستند. گرچه برای فراخوانی APIها نیاز به توکن است، اما خودِ صفحه ویرایشگر به صورت عمومی در دسترس است.
۲. **بخش‌های نیمه‌تمام (Placeholders):** مسیرهای مربوط به مدیریت لینک‌ها (`SalonLink`) و آدرس‌ها (`SalonAddress`) در لایه CMS در حال حاضر پاسخ `501 Not Implemented` برمی‌گردانند.
۳. **تجربه کاربری ویرایشگر:** ویرایشگر فعلی با Vanilla JS نوشته شده است. برای پروژه‌های بزرگتر، بازنویسی این بخش با React یا Vue پیشنهاد می‌شود.
۴. **اعتبارسنجی فرانت‌اِند:** بخش زیادی از اعتبارسنجی‌ها در سمت سرور انجام می‌شود و در ویرایشگر فعلی، خطاهای لحظه‌ای (Real-time) به صورت کامل پوشش داده نشده‌اند.

---

## ۵. جمع‌بندی (Summary)

وضعیت صفحه‌ساز در پروژه **"عملیاتی و آماده استفاده" (Production-Ready Core)** است. زیرساخت دیتابیس و رندرینگ بسیار قوی طراحی شده و تمام نیازهای یک سایت سالن زیبایی برای سئو و نمایش محتوا را پوشش می‌دهد. اولویت بعدی باید بر روی تکمیل بخش‌های ۵۰۱ و ایمن‌سازی مسیرهای ادمین باشد.

---

## English Summary

The Page Builder in Sevra is a robust, registry-based system integrated with Prisma and Zod. It supports 11 section types (Hero, Rich Text, Services, etc.) and features a built-in Vanilla JS editor with live preview and drag-and-drop capabilities. It is highly optimized for SEO with support for Open Graph, JSON-LD, and automatic 301 redirects via slug history. Current gaps include missing authentication on admin UI routes and placeholder (501) routes for salon links and addresses management. Overall, the core system is functional and performant.

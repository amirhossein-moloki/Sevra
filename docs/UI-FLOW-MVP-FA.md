````md
# UI Flow حرفه‌ای — پلتفرم مدیریت سالن (MVP)
نسخه: 0.1  
دامنه: فقط امکانات MVP (رزرو، خدمات، کارکنان، مشتریان، مالی پایه، داشبورد پایه، تنظیمات حداقلی، نقش‌ها)

---

## 0) نقش‌ها و سطح دسترسی (MVP)

- **مدیر**: دسترسی کامل به همه ماژول‌ها + تنظیمات
- **منشی**: رزرو/مشتری/پرداخت + مشاهده داشبورد پایه
- **کارکن**: مشاهده برنامه خودش + مشاهده رزروهای خودش (MVP: فقط مشاهده)

---

## 1) نقشه صفحات (Information Architecture / Sitemap)

### صفحات عمومی
- `/login` ورود
- `/forgot-password` بازیابی رمز (اختیاری MVP)
- `/403` عدم دسترسی
- `/404` صفحه وجود ندارد

### صفحات داخل پنل (Authenticated)
- `/dashboard` داشبورد پایه

#### رزرو
- `/appointments` لیست رزروها
- `/appointments/calendar` تقویم رزرو
- `/appointments/new` ایجاد رزرو
- `/appointments/:id` جزئیات رزرو
- `/appointments/:id/edit` ویرایش رزرو (پیشنهاد: در MVP باشد)

#### مشتریان (CRM پایه)
- `/customers` لیست مشتریان
- `/customers/new` مشتری جدید
- `/customers/:id` پروفایل مشتری (تاریخچه رزروها + یادداشت)
- `/customers/:id/edit` ویرایش مشتری

#### خدمات
- `/services` لیست خدمات
- `/services/new` خدمت جدید
- `/services/:id/edit` ویرایش خدمت

#### کارکنان
- `/staff` لیست کارکنان
- `/staff/new` کارکن جدید
- `/staff/:id` پروفایل کارکن (خدمات + شیفت ساده)
- `/staff/:id/edit` ویرایش کارکن

#### مالی پایه
- `/finance` نمای کلی مالی
- `/finance/reports/daily` گزارش روزانه
- `/finance/reports/monthly` گزارش ماهانه

#### تنظیمات حداقلی (فقط مدیر)
- `/settings/salon` نام سالن + واحد پول
- `/settings/hours` ساعات کاری عمومی
- `/settings/rules` قوانین رزرو (جلوگیری از تداخل = روشن)

---

## 2) استانداردهای ناوبری و الگوهای UI (MVP)

### ناوبری اصلی (Sidebar / Tab)
- داشبورد
- رزروها
- مشتریان
- خدمات
- کارکنان
- مالی
- تنظیمات (فقط مدیر)

### الگوی صفحات CRUD
- لیست (Table + Search ساده)
- ایجاد/ویرایش (Form)
- جزئیات (Summary + Actions)

### وضعیت‌ها (State)
- Loading / Empty / Error
- Empty State باید CTA واضح داشته باشد (مثلاً «رزرو جدید بساز»)

---

## 3) Flow کلی ورود و مسیر نقش‌ها (GitHub-friendly Mermaid)

```mermaid
flowchart TD
    A["ورود به سیستم"] --> B["/login"]
    B -->|موفق| C{نقش کاربر؟}
    B -->|ناموفق| E["نمایش خطا + تلاش مجدد"]

    C -->|مدیر| D1["/dashboard (مدیر)"]
    C -->|منشی| D2["/dashboard (منشی)"]
    C -->|کارکن| D3["/dashboard (کارکن - محدود)"]

    D1 --> S1["/settings (مدیر)"]
    D2 --> AP1["/appointments"]
    D3 --> MY1["/appointments?filter=mine"]
````

---

## 4) Flow رزرو (Core)

### 4.1 ایجاد رزرو توسط منشی (Happy Path + تداخل)

```mermaid
flowchart TD
    A["/dashboard یا /appointments"] --> B["کلیک: رزرو جدید"]
    B --> C["/appointments/new"]
    C --> D["انتخاب مشتری یا ایجاد مشتری جدید"]
    D --> E["انتخاب خدمت"]
    E --> F["انتخاب کارکن (اختیاری)"]
    F --> G["انتخاب تاریخ"]
    G --> H["نمایش زمان‌های آزاد (بر اساس شیفت + مدت خدمت)"]
    H --> I["انتخاب ساعت"]
    I --> J{تداخل دارد؟}
    J -->|خیر| K["ثبت رزرو"]
    J -->|بله| X["نمایش خطا + پیشنهاد زمان‌های آزاد/نزدیک"]
    X --> H
    K --> L["/appointments/:id (جزئیات رزرو)"]
    L --> M["اکشن: ثبت پرداخت (اختیاری)"]
    M --> N["ثبت پرداخت + تغییر وضعیت پرداخت"]
```

### 4.2 تغییر وضعیت رزرو (MVP)

```mermaid
stateDiagram-v2
    [*] --> Confirmed: "تایید شده"
    Confirmed --> Completed: "انجام شده"
    Confirmed --> Cancelled: "لغو شده"
    Completed --> [*]
    Cancelled --> [*]
```

---

## 5) Flow رزرو آنلاین (MVP ساده)

```mermaid
flowchart TD
    A["مشتری"] --> B["صفحه رزرو آنلاین"]
    B --> C["انتخاب خدمت"]
    C --> D["انتخاب کارکن (اختیاری)"]
    D --> E["انتخاب تاریخ"]
    E --> F["نمایش زمان‌های آزاد"]
    F --> G["ثبت نام و شماره تماس"]
    G --> H["ثبت رزرو"]
    H --> I["نمایش تایید رزرو + شناسه رزرو"]
```

---

## 6) Flow مشتریان (CRM پایه)

### 6.1 ایجاد مشتری از داخل رزرو (Inline Create)

```mermaid
flowchart TD
    A["/appointments/new"] --> B["جستجوی شماره/نام مشتری"]
    B --> C{مشتری موجود است؟}
    C -->|بله| D["انتخاب مشتری"]
    C -->|خیر| E["کلیک: ایجاد مشتری"]
    E --> F["/customers/new (مودال/صفحه)"]
    F --> G["ثبت مشتری"]
    G --> H["بازگشت به رزرو جدید + انتخاب خودکار مشتری"]
```

### 6.2 پروفایل مشتری

```mermaid
flowchart TD
    A["/customers"] --> B["کلیک روی مشتری"]
    B --> C["/customers/:id"]
    C --> D["نمایش اطلاعات + یادداشت"]
    C --> E["نمایش تاریخچه رزروها"]
    C --> F["اکشن: رزرو جدید برای این مشتری"]
    F --> G["/appointments/new?customer=:id"]
```

---

## 7) Flow خدمات (Service Management)

```mermaid
flowchart TD
    A["/services"] --> B["خدمت جدید"]
    B --> C["/services/new"]
    C --> D["فرم: نام، مدت، قیمت، وضعیت"]
    D --> E["ثبت"]
    E --> F["بازگشت به لیست خدمات"]
    F --> G["ویرایش خدمت"]
    G --> H["/services/:id/edit"]
    H --> I["ثبت تغییرات"]
```

> ستون‌های لیست خدمات (پیشنهادی): نام | مدت | قیمت | وضعیت | عملیات

---

## 8) Flow کارکنان + شیفت ساده

```mermaid
flowchart TD
    A["/staff"] --> B["کارکن جدید"]
    B --> C["/staff/new"]
    C --> D["فرم: نام، شماره، نقش"]
    D --> E["انتخاب خدمات قابل ارائه"]
    E --> F["تعریف شیفت: روزها + ساعت شروع/پایان"]
    F --> G["ثبت"]
    G --> H["/staff/:id"]
```

---

## 9) Flow مالی پایه (ثبت پرداخت + گزارش)

### 9.1 ثبت پرداخت از جزئیات رزرو

```mermaid
flowchart TD
    A["/appointments/:id"] --> B["اکشن: ثبت پرداخت"]
    B --> C["فرم: مبلغ + وضعیت پرداخت"]
    C --> D{اعتبارسنجی مبلغ}
    D -->|اوکی| E["ثبت"]
    D -->|خطا| F["نمایش خطا + اصلاح"]
    E --> G["به‌روزرسانی وضعیت پرداخت"]
```

### 9.2 گزارش روزانه/ماهانه

```mermaid
flowchart TD
    A["/finance"] --> B["گزارش روزانه"]
    A --> C["گزارش ماهانه"]
    B --> D["/finance/reports/daily"]
    C --> E["/finance/reports/monthly"]
```

---

## 10) Flow داشبورد پایه (Numbers-first)

```mermaid
flowchart TD
    A["/dashboard"] --> B["کارت: تعداد رزرو امروز"]
    A --> C["کارت: درآمد امروز"]
    A --> D["لیست: رزروهای پیش‌رو"]
    D --> E["کلیک روی رزرو"]
    E --> F["/appointments/:id"]
```

---

## 11) Flow تنظیمات حداقلی (فقط مدیر)

```mermaid
flowchart TD
    A["/settings"] --> B["/settings/salon"]
    A --> C["/settings/hours"]
    A --> D["/settings/rules"]

    B --> B1["نام سالن + واحد پول"] --> B2["ذخیره"]
    C --> C1["ساعات کاری عمومی"] --> C2["ذخیره"]
    D --> D1["جلوگیری از تداخل رزرو = روشن"] --> D2["ذخیره"]
```

---

## 12) Guardrails (چک‌لیست UX برای MVP)

### رزرو

* جستجوی سریع مشتری (با شماره موبایل)
* نمایش فقط زمان‌های مجاز (ترجیحاً به‌جای انتخاب آزاد و خطا)
* پیام واضح تداخل + پیشنهاد زمان‌های نزدیک

### لیست‌ها

* Search ساده در: رزروها، مشتریان، خدمات، کارکنان
* Empty State با CTA

### نقش‌ها

* کارکن فقط رزروهای خودش را ببیند (Read-only)
* منشی به تنظیمات دسترسی نداشته باشد

---

## 13) حداقل صفحات ضروری برای شروع توسعه (MVP Starter Set)

* Login
* Dashboard
* Appointments: List + Calendar + New + Detail + Edit
* Customers: List + New + Detail + Edit
* Services: List + New + Edit
* Staff: List + New + Profile + Edit
* Finance: Overview + Daily + Monthly
* Settings (Admin-only): Salon + Hours + Rules

```
```

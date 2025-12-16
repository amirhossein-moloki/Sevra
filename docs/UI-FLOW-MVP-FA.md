
# UI Flow Ø­Ø±ÙÙ‡â€ŒØ§ÛŒ â€” Ù¾Ù„ØªÙØ±Ù… Ù…Ø¯ÛŒØ±ÛŒØª Ø³Ø§Ù„Ù† (MVP)

Ù†Ø³Ø®Ù‡: 0.1  
Ø¯Ø§Ù…Ù†Ù‡: ÙÙ‚Ø· Ø§Ù…Ú©Ø§Ù†Ø§Øª MVP (Ø±Ø²Ø±ÙˆØŒ Ø®Ø¯Ù…Ø§ØªØŒ Ú©Ø§Ø±Ú©Ù†Ø§Ù†ØŒ Ù…Ø´ØªØ±ÛŒØ§Ù†ØŒ Ù…Ø§Ù„ÛŒ Ù¾Ø§ÛŒÙ‡ØŒ Ø¯Ø§Ø´Ø¨ÙˆØ±Ø¯ Ù¾Ø§ÛŒÙ‡ØŒ ØªÙ†Ø¸ÛŒÙ…Ø§Øª Ø­Ø¯Ø§Ù‚Ù„ÛŒØŒ Ù†Ù‚Ø´â€ŒÙ‡Ø§)

---

## 0) Ù†Ù‚Ø´â€ŒÙ‡Ø§ Ùˆ Ø³Ø·Ø­ Ø¯Ø³ØªØ±Ø³ÛŒ (MVP)

- **Ù…Ø¯ÛŒØ±**: Ø¯Ø³ØªØ±Ø³ÛŒ Ú©Ø§Ù…Ù„ Ø¨Ù‡ Ù‡Ù…Ù‡ Ù…Ø§Ú˜ÙˆÙ„â€ŒÙ‡Ø§ + ØªÙ†Ø¸ÛŒÙ…Ø§Øª
- **Ù…Ù†Ø´ÛŒ**: Ø±Ø²Ø±ÙˆØŒ Ù…Ø´ØªØ±ÛŒØŒ Ù¾Ø±Ø¯Ø§Ø®Øª + Ù…Ø´Ø§Ù‡Ø¯Ù‡ Ø¯Ø§Ø´Ø¨ÙˆØ±Ø¯ Ù¾Ø§ÛŒÙ‡
- **Ú©Ø§Ø±Ú©Ù†**: ÙÙ‚Ø· Ù…Ø´Ø§Ù‡Ø¯Ù‡ Ø¨Ø±Ù†Ø§Ù…Ù‡ Ùˆ Ø±Ø²Ø±ÙˆÙ‡Ø§ÛŒ Ø®ÙˆØ¯Ø´ (Read-only)

---

## 1) Ù†Ù‚Ø´Ù‡ ØµÙØ­Ø§Øª (Information Architecture)

### ØµÙØ­Ø§Øª Ø¹Ù…ÙˆÙ…ÛŒ
- /login
- /forgot-password (Ø§Ø®ØªÛŒØ§Ø±ÛŒ MVP)
- /403
- /404

### ØµÙØ­Ø§Øª Ù¾Ù†Ù„ (Authenticated)
- /dashboard

#### Ø±Ø²Ø±Ùˆ
- /appointments
- /appointments/calendar
- /appointments/new
- /appointments/:id
- /appointments/:id/edit

#### Ù…Ø´ØªØ±ÛŒØ§Ù†
- /customers
- /customers/new
- /customers/:id
- /customers/:id/edit

#### Ø®Ø¯Ù…Ø§Øª
- /services
- /services/new
- /services/:id/edit

#### Ú©Ø§Ø±Ú©Ù†Ø§Ù†
- /staff
- /staff/new
- /staff/:id
- /staff/:id/edit

#### Ù…Ø§Ù„ÛŒ
- /finance
- /finance/reports/daily
- /finance/reports/monthly

#### ØªÙ†Ø¸ÛŒÙ…Ø§Øª (ÙÙ‚Ø· Ù…Ø¯ÛŒØ±)
- /settings
- /settings/salon
- /settings/hours
- /settings/rules

---

## 2) Ù†Ø§ÙˆØ¨Ø±ÛŒ Ùˆ Ø§Ù„Ú¯ÙˆÙ‡Ø§ÛŒ UI (MVP)

- Sidebar:
  - Ø¯Ø§Ø´Ø¨ÙˆØ±Ø¯
  - Ø±Ø²Ø±ÙˆÙ‡Ø§
  - Ù…Ø´ØªØ±ÛŒØ§Ù†
  - Ø®Ø¯Ù…Ø§Øª
  - Ú©Ø§Ø±Ú©Ù†Ø§Ù†
  - Ù…Ø§Ù„ÛŒ
  - ØªÙ†Ø¸ÛŒÙ…Ø§Øª (Ù…Ø¯ÛŒØ±)

- Ø§Ù„Ú¯ÙˆÛŒ CRUD:
  - List (Table + Search)
  - Create / Edit (Form)
  - Detail (Summary + Actions)

- StateÙ‡Ø§:
  - Loading / Empty / Error
  - Empty State Ø¨Ø§ CTA ÙˆØ§Ø¶Ø­

---

## 3) Flow ÙˆØ±ÙˆØ¯ Ùˆ Ù†Ù‚Ø´â€ŒÙ‡Ø§

```mermaid
flowchart TD
    A["ÙˆØ±ÙˆØ¯"] --> B["/login"]
    B -->|Ù…ÙˆÙÙ‚| C{Ù†Ù‚Ø´ØŸ}
    B -->|Ù†Ø§Ù…ÙˆÙÙ‚| E["Ø®Ø·Ø§"]
    C -->|Ù…Ø¯ÛŒØ±| D1["/dashboard"]
    C -->|Ù…Ù†Ø´ÛŒ| D2["/dashboard"]
    C -->|Ú©Ø§Ø±Ú©Ù†| D3["/dashboard"]
    D1 --> S1["/settings"]
    D2 --> AP1["/appointments"]
    D3 --> MY1["/appointments (mine only)"]
```

---

## 4) Flow Ø±Ø²Ø±Ùˆ (Core)

```mermaid
flowchart TD
    A["/appointments"] --> B["Ø±Ø²Ø±Ùˆ Ø¬Ø¯ÛŒØ¯"]
    B --> C["/appointments/new"]
    C --> D["Ø§Ù†ØªØ®Ø§Ø¨/Ø§ÛŒØ¬Ø§Ø¯ Ù…Ø´ØªØ±ÛŒ"]
    D --> E["Ø§Ù†ØªØ®Ø§Ø¨ Ø®Ø¯Ù…Øª"]
    E --> F["Ø§Ù†ØªØ®Ø§Ø¨ Ú©Ø§Ø±Ú©Ù†"]
    F --> G["Ø§Ù†ØªØ®Ø§Ø¨ ØªØ§Ø±ÛŒØ®"]
    G --> H["Ù†Ù…Ø§ÛŒØ´ Ø²Ù…Ø§Ù†â€ŒÙ‡Ø§ÛŒ Ø¢Ø²Ø§Ø¯"]
    H --> I["Ø§Ù†ØªØ®Ø§Ø¨ Ø³Ø§Ø¹Øª"]
    I --> J{ØªØ¯Ø§Ø®Ù„ØŸ}
    J -->|Ø®ÛŒØ±| K["Ø«Ø¨Øª Ø±Ø²Ø±Ùˆ"]
    J -->|Ø¨Ù„Ù‡| X["Ù¾ÛŒØ§Ù… Ø®Ø·Ø§ + Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯ Ø²Ù…Ø§Ù†"]
    X --> H
    K --> L["Ø¬Ø²Ø¦ÛŒØ§Øª Ø±Ø²Ø±Ùˆ"]
```

---

## 5) ÙˆØ¶Ø¹ÛŒØª Ø±Ø²Ø±Ùˆ

```mermaid
stateDiagram-v2
    [*] --> Confirmed
    Confirmed --> Completed
    Confirmed --> Cancelled
    Completed --> [*]
    Cancelled --> [*]
```

---

## 6) Flow Ù…Ø´ØªØ±ÛŒØ§Ù†

```mermaid
flowchart TD
    A["/customers"] --> B["Ù¾Ø±ÙˆÙØ§ÛŒÙ„ Ù…Ø´ØªØ±ÛŒ"]
    B --> C["ØªØ§Ø±ÛŒØ®Ú†Ù‡ Ø±Ø²Ø±Ùˆ"]
    B --> D["Ø±Ø²Ø±Ùˆ Ø¬Ø¯ÛŒØ¯"]
```

---

## 7) Flow Ø®Ø¯Ù…Ø§Øª

```mermaid
flowchart TD
    A["/services"] --> B["Ø®Ø¯Ù…Øª Ø¬Ø¯ÛŒØ¯"]
    B --> C["Ø«Ø¨Øª"]
    C --> D["Ù„ÛŒØ³Øª Ø®Ø¯Ù…Ø§Øª"]
```

---

## 8) Flow Ú©Ø§Ø±Ú©Ù†Ø§Ù†

```mermaid
flowchart TD
    A["/staff"] --> B["Ú©Ø§Ø±Ú©Ù† Ø¬Ø¯ÛŒØ¯"]
    B --> C["ØªØ¹Ø±ÛŒÙ Ø®Ø¯Ù…Ø§Øª + Ø´ÛŒÙØª"]
    C --> D["Ù¾Ø±ÙˆÙØ§ÛŒÙ„ Ú©Ø§Ø±Ú©Ù†"]
```

---

## 9) Flow Ù…Ø§Ù„ÛŒ Ù¾Ø§ÛŒÙ‡

```mermaid
flowchart TD
    A["Ø¬Ø²Ø¦ÛŒØ§Øª Ø±Ø²Ø±Ùˆ"] --> B["Ø«Ø¨Øª Ù¾Ø±Ø¯Ø§Ø®Øª"]
    B --> C["Ø¨Ù‡â€ŒØ±ÙˆØ²Ø±Ø³Ø§Ù†ÛŒ ÙˆØ¶Ø¹ÛŒØª Ù¾Ø±Ø¯Ø§Ø®Øª"]
```

---

## 10) Ø¯Ø§Ø´Ø¨ÙˆØ±Ø¯ Ù¾Ø§ÛŒÙ‡

```mermaid
flowchart TD
    A["/dashboard"] --> B["Ø±Ø²Ø±Ùˆ Ø§Ù…Ø±ÙˆØ²"]
    A --> C["Ø¯Ø±Ø¢Ù…Ø¯ Ø§Ù…Ø±ÙˆØ²"]
    A --> D["Ø±Ø²Ø±ÙˆÙ‡Ø§ÛŒ Ù¾ÛŒØ´â€ŒØ±Ùˆ"]
```

---

## 11) Guardrails UX

- Ø¬Ø³ØªØ¬ÙˆÛŒ Ø³Ø±ÛŒØ¹ Ù…Ø´ØªØ±ÛŒ Ø¨Ø§ Ø´Ù…Ø§Ø±Ù‡
- Ø¬Ù„ÙˆÚ¯ÛŒØ±ÛŒ Ø§Ø² ØªØ¯Ø§Ø®Ù„ Ø±Ø²Ø±Ùˆ
- Ù†Ù…Ø§ÛŒØ´ ÙÙ‚Ø· Ø²Ù…Ø§Ù†â€ŒÙ‡Ø§ÛŒ Ù…Ø¬Ø§Ø²
- Ù…Ø­Ø¯ÙˆØ¯ÛŒØª Ø¯Ø³ØªØ±Ø³ÛŒ Ø¨Ø± Ø§Ø³Ø§Ø³ Ù†Ù‚Ø´

---

## 12) MVP Starter Pages

- Login
- Dashboard
- Appointments (List, Calendar, New, Detail, Edit)
- Customers (List, New, Detail, Edit)
- Services (List, New, Edit)
- Staff (List, New, Profile, Edit)
- Finance (Overview, Daily, Monthly)
- Settings (Salon, Hours, Rules)- `/appointments/calendar` تقویم رزرو
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

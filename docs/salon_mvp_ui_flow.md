
# UI Flow حرفه‌ای — پلتفرم مدیریت سالن (MVP)

نسخه: 0.1  
دامنه: فقط امکانات MVP (رزرو، خدمات، کارکنان، مشتریان، مالی پایه، داشبورد پایه، تنظیمات حداقلی، نقش‌ها)

---

## 0) نقش‌ها و سطح دسترسی (MVP)

- **مدیر**: دسترسی کامل به همه ماژول‌ها + تنظیمات
- **منشی**: رزرو، مشتری، پرداخت + مشاهده داشبورد پایه
- **کارکن**: فقط مشاهده برنامه و رزروهای خودش (Read-only)

---

## 1) نقشه صفحات (Information Architecture)

### صفحات عمومی
- /login
- /forgot-password (اختیاری MVP)
- /403
- /404

### صفحات پنل (Authenticated)
- /dashboard

#### رزرو
- /appointments
- /appointments/calendar
- /appointments/new
- /appointments/:id
- /appointments/:id/edit

#### مشتریان
- /customers
- /customers/new
- /customers/:id
- /customers/:id/edit

#### خدمات
- /services
- /services/new
- /services/:id/edit

#### کارکنان
- /staff
- /staff/new
- /staff/:id
- /staff/:id/edit

#### مالی
- /finance
- /finance/reports/daily
- /finance/reports/monthly

#### تنظیمات (فقط مدیر)
- /settings
- /settings/salon
- /settings/hours
- /settings/rules

---

## 2) ناوبری و الگوهای UI (MVP)

- Sidebar:
  - داشبورد
  - رزروها
  - مشتریان
  - خدمات
  - کارکنان
  - مالی
  - تنظیمات (مدیر)

- الگوی CRUD:
  - List (Table + Search)
  - Create / Edit (Form)
  - Detail (Summary + Actions)

- Stateها:
  - Loading / Empty / Error
  - Empty State با CTA واضح

---

## 3) Flow ورود و نقش‌ها

```mermaid
flowchart TD
    A["ورود"] --> B["/login"]
    B -->|موفق| C{نقش؟}
    B -->|ناموفق| E["خطا"]
    C -->|مدیر| D1["/dashboard"]
    C -->|منشی| D2["/dashboard"]
    C -->|کارکن| D3["/dashboard"]
    D1 --> S1["/settings"]
    D2 --> AP1["/appointments"]
    D3 --> MY1["/appointments (mine only)"]
```

---

## 4) Flow رزرو (Core)

```mermaid
flowchart TD
    A["/appointments"] --> B["رزرو جدید"]
    B --> C["/appointments/new"]
    C --> D["انتخاب/ایجاد مشتری"]
    D --> E["انتخاب خدمت"]
    E --> F["انتخاب کارکن"]
    F --> G["انتخاب تاریخ"]
    G --> H["نمایش زمان‌های آزاد"]
    H --> I["انتخاب ساعت"]
    I --> J{تداخل؟}
    J -->|خیر| K["ثبت رزرو"]
    J -->|بله| X["پیام خطا + پیشنهاد زمان"]
    X --> H
    K --> L["جزئیات رزرو"]
```

---

## 5) وضعیت رزرو

```mermaid
stateDiagram-v2
    [*] --> Confirmed
    Confirmed --> Completed
    Confirmed --> Cancelled
    Completed --> [*]
    Cancelled --> [*]
```

---

## 6) Flow مشتریان

```mermaid
flowchart TD
    A["/customers"] --> B["پروفایل مشتری"]
    B --> C["تاریخچه رزرو"]
    B --> D["رزرو جدید"]
```

---

## 7) Flow خدمات

```mermaid
flowchart TD
    A["/services"] --> B["خدمت جدید"]
    B --> C["ثبت"]
    C --> D["لیست خدمات"]
```

---

## 8) Flow کارکنان

```mermaid
flowchart TD
    A["/staff"] --> B["کارکن جدید"]
    B --> C["تعریف خدمات + شیفت"]
    C --> D["پروفایل کارکن"]
```

---

## 9) Flow مالی پایه

```mermaid
flowchart TD
    A["جزئیات رزرو"] --> B["ثبت پرداخت"]
    B --> C["به‌روزرسانی وضعیت پرداخت"]
```

---

## 10) داشبورد پایه

```mermaid
flowchart TD
    A["/dashboard"] --> B["رزرو امروز"]
    A --> C["درآمد امروز"]
    A --> D["رزروهای پیش‌رو"]
```

---

## 11) Guardrails UX

- جستجوی سریع مشتری با شماره
- جلوگیری از تداخل رزرو
- نمایش فقط زمان‌های مجاز
- محدودیت دسترسی بر اساس نقش

---

## 12) MVP Starter Pages

- Login
- Dashboard
- Appointments (List, Calendar, New, Detail, Edit)
- Customers (List, New, Detail, Edit)
- Services (List, New, Edit)
- Staff (List, New, Profile, Edit)
- Finance (Overview, Daily, Monthly)
- Settings (Salon, Hours, Rules)

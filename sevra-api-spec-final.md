# Sevra REST API Specification (Final) — v1

این سند نسخه‌ی نهایی طراحی REST API برای پروژه **Sevra** است (بر اساس مدل Prisma که ارسال کردید).
هدف: API استاندارد، مقیاس‌پذیر، سازگار با multi-tenant، و مناسب MVP + توسعه آینده.

---

## 0) خلاصه معماری API

- **Base URL**: `/api/v1`
- **داشبورد/پنل (Private)**: مسیرهای مدیریتی با `salonId`
  - مثال: `/api/v1/salons/{salonId}/bookings`
- **وب‌سایت/رزرو آنلاین (Public)**: مسیرهای عمومی با `salonSlug`
  - مثال: `/api/v1/public/salons/{salonSlug}/services`

> دلیل: در جریان‌های عمومی معمولاً نمی‌خواهیم `salonId` داخلی لو برود و SEO/UX بهتر با slug است.

---

## 1) استانداردهای عمومی

### 1.1 Naming
- Pathها: `lowercase`، چندکلمه‌ای‌ها با `-` (kebab-case) در صورت نیاز
- JSON Keys: `camelCase`

### 1.2 Response Envelope
**Success**
```json
{
  "success": true,
  "data": {},
  "meta": { "requestId": "uuid" }
}
```

**List + Pagination**
```json
{
  "success": true,
  "data": [],
  "meta": {
    "requestId": "uuid",
    "page": 1,
    "pageSize": 20,
    "totalItems": 120,
    "totalPages": 6
  }
}
```

### 1.3 Error Format
(طبق `errorHandler.ts`)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request payload",
    "details": [{ "path": ["phone"], "message": "Phone is required" }]
  },
  "meta": { "requestId": "uuid" }
}
```

### 1.4 Filtering / Sorting / Pagination
- Filtering: `?status=CONFIRMED&staffId=...`
- Sorting: `?sortBy=createdAt&sortOrder=asc|desc`
- Pagination: `?page=1&pageSize=20`

### 1.5 Timezone
- تمام تاریخ‌ها در API با **ISO8601** و به صورت **UTC** ارسال/دریافت شوند.
- هر Salon می‌تواند `Settings.timeZone` داشته باشد؛ ولی در storage و API، UTC را معیار نگه دارید.

### 1.6 Idempotency (ضروری)
برای عملیات حساس:
- ایجاد رزرو آنلاین
- ثبت پرداخت
هدر:
- `Idempotency-Key: <uuid>`

**رفتار پیشنهادی**
- Scope: به ازای `salonId` یا `salonSlug` + endpoint + key
- TTL: 24h
- اگر درخواست با همان key دوباره آمد: همان پاسخ قبلی برگردد (و رکورد جدید نسازد).

### 1.7 Status Codes
- `200 OK`, `201 Created`, `204 No Content`
- `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`
- `409 Conflict` (overlap/unique constraint)
- `429 Too Many Requests`

---

## 2) احراز هویت و دسترسی‌ها (AuthN/AuthZ)

### 2.1 JWT + Sessions
- Access Token: ~15m
- Refresh Token: ~7d
- Refresh token در جدول `Session` ذخیره/کنترل شود (`tokenHash`, `revokedAt`, `expiresAt`)

### 2.2 Roles (RBAC)
- **MANAGER**: همه چیز
- **RECEPTIONIST**: مدیریت booking/customer/payment + مشاهده staff/services/settings (بدون تغییر role/settings/commission/cms)
- **STAFF**: مشاهده پروفایل و شیفت‌های خود + رزروهای خود (read-only)

قواعد Ownership:
- STAFF فقط bookingهایی را می‌بیند که `booking.staffId == currentUser.id`

---

## 3) ماژول‌ها و مسئولیت پیاده‌سازی

### 3.1 Common / Infra (زیرساخت مشترک)
**مسیرها/فایل‌ها پیشنهادی**
- `src/common/middleware/auth.ts` → verify JWT + attach currentUser
- `src/common/middleware/requireRole.ts` → RBAC
- `src/common/middleware/validate.ts` → Zod validation
- `src/common/middleware/response.ts` → response envelope
- `src/common/middleware/rateLimit.ts` → rate limiting
- `src/common/errors/errorHandler.ts` → normalize errors
- `src/config/logger.ts` → pino
- `src/config/prisma.ts` → prisma client

---

## 4) Endpointهای نهایی (MVP + قابل توسعه)

> در جدول‌ها «ماژول پیاده‌سازی» به ساختار `src/modules/<module>` اشاره دارد.

---

# 4.1 Health
| Method | Path | Auth | Role | Description | Module |
|---|---|---:|---|---|---|
| GET | `/health` | No | - | Liveness check | `src/routes/health.routes.ts` |

---

# 4.2 Auth
Base: `/api/v1/auth`

| Method | Path | Auth | Role | Description | Module |
|---|---|---:|---|---|---|
| POST | `/auth/login` | No | - | phone+password → access+refresh + user | `src/modules/auth` |
| POST | `/auth/refresh` | No | - | refresh → access+refresh جدید (rotation) | `src/modules/auth` |
| POST | `/auth/logout` | Yes | Any | revoke current session | `src/modules/auth` |
| GET | `/auth/me` | Yes | Any | get current user profile | `src/modules/auth` |

**Auth module components**
- `auth.controller.ts` (HTTP)
- `auth.service.ts` (business rules)
- `auth.validators.ts` (Zod)
- `auth.repo.ts` (Prisma Session/User)
- Password hashing: `argon2`

---

# 4.3 Onboarding (اختیاری ولی پیشنهادی برای MVP)
Base: `/api/v1/onboarding`

| Method | Path | Auth | Role | Description | Module |
|---|---|---:|---|---|---|
| POST | `/onboarding/salons` | No | - | ایجاد Salon + Settings اولیه + Manager user + tokens | `src/modules/onboarding` |

> اگر نمی‌خواهید ماژول جدا بسازید، می‌توانید داخل `auth` نگه دارید؛ ولی جدا بودن تمیزتر است.

---

# 4.4 Salons (Private)
Base: `/api/v1/salons/{salonId}`

| Method | Path | Auth | Role | Description | Module |
|---|---|---:|---|---|---|
| GET | `/salons/{salonId}` | Yes | MANAGER, RECEPTIONIST | دریافت اطلاعات سالن برای پنل | `src/modules/salons` |
| PATCH | `/salons/{salonId}` | Yes | MANAGER | ویرایش نام/description/seo fields | `src/modules/salons` |
| GET | `/salons/{salonId}/settings` | Yes | MANAGER, RECEPTIONIST | دریافت Settings | `src/modules/settings` |
| PATCH | `/salons/{salonId}/settings` | Yes | MANAGER | تغییر preventOverlaps/timeZone/online flags | `src/modules/settings` |

---

# 4.5 Users / Staff (Private)
Base: `/api/v1/salons/{salonId}/users`

| Method | Path | Auth | Role | Description | Module |
|---|---|---:|---|---|---|
| GET | `/salons/{salonId}/users` | Yes | MANAGER, RECEPTIONIST | لیست staff + فیلتر `role,isActive,isPublic` | `src/modules/users` |
| POST | `/salons/{salonId}/users` | Yes | MANAGER | ایجاد user (staff/receptionist/manager) | `src/modules/users` |
| GET | `/salons/{salonId}/users/{userId}` | Yes | MANAGER, RECEPTIONIST (STAFF self) | جزئیات user | `src/modules/users` |
| PATCH | `/salons/{salonId}/users/{userId}` | Yes | MANAGER | تغییر role/isActive/profile/services | `src/modules/users` |
| DELETE | `/salons/{salonId}/users/{userId}` | Yes | MANAGER | deactivate (soft) | `src/modules/users` |
| PUT | `/salons/{salonId}/users/{userId}/shifts` | Yes | MANAGER | upsert weekly shifts | `src/modules/shifts` |

**نکته**: برای شیفت‌ها `PUT` مناسب است چون «کل برنامه هفتگی» را جایگزین می‌کند.

---

# 4.6 Services
## Private (Panel)
Base: `/api/v1/salons/{salonId}/services`

| Method | Path | Auth | Role | Description | Module |
|---|---|---:|---|---|---|
| GET | `/salons/{salonId}/services` | Yes | MANAGER, RECEPTIONIST, STAFF | لیست سرویس‌ها (فیلتر isActive) | `src/modules/services` |
| POST | `/salons/{salonId}/services` | Yes | MANAGER | ایجاد سرویس | `src/modules/services` |
| GET | `/salons/{salonId}/services/{serviceId}` | Yes | MANAGER, RECEPTIONIST, STAFF | جزئیات سرویس | `src/modules/services` |
| PATCH | `/salons/{salonId}/services/{serviceId}` | Yes | MANAGER | ویرایش | `src/modules/services` |
| DELETE | `/salons/{salonId}/services/{serviceId}` | Yes | MANAGER | deactivate | `src/modules/services` |

## Public (Website)
Base: `/api/v1/public/salons/{salonSlug}`

| Method | Path | Auth | Role | Description | Module |
|---|---|---:|---|---|---|
| GET | `/public/salons/{salonSlug}/services` | No | - | سرویس‌های فعال برای سایت | `src/modules/public` (services handler) |

---

# 4.7 Customers (CRM)
Base: `/api/v1/salons/{salonId}/customers`

| Method | Path | Auth | Role | Description | Module |
|---|---|---:|---|---|---|
| GET | `/salons/{salonId}/customers` | Yes | MANAGER, RECEPTIONIST | لیست با فیلتر `phone,displayName` | `src/modules/customers` |
| POST | `/salons/{salonId}/customers` | Yes | MANAGER, RECEPTIONIST | upsert: CustomerAccount by phone + SalonCustomerProfile | `src/modules/customers` |
| GET | `/salons/{salonId}/customers/{profileId}` | Yes | MANAGER, RECEPTIONIST | جزئیات پروفایل + خلاصه رزروها | `src/modules/customers` |
| PATCH | `/salons/{salonId}/customers/{profileId}` | Yes | MANAGER, RECEPTIONIST | تغییر displayName/note | `src/modules/customers` |

---

# 4.8 Availability (کلیدی برای رزرو)
## Private (Panel)
| Method | Path | Auth | Role | Description | Module |
|---|---|---:|---|---|---|
| GET | `/salons/{salonId}/availability/slots` | Yes | MANAGER, RECEPTIONIST, STAFF | اسلات‌های آزاد بر اساس `serviceId, staffId, date` | `src/modules/availability` |

Query:
- `serviceId` (required)
- `staffId` (required)
- `date=YYYY-MM-DD` (required)

## Public (Website)
| Method | Path | Auth | Role | Description | Module |
|---|---|---:|---|---|---|
| GET | `/public/salons/{salonSlug}/availability/slots` | No | - | اسلات‌های آزاد برای رزرو آنلاین | `src/modules/public` (availability handler) |

---

# 4.9 Bookings
## Private (Panel)
Base: `/api/v1/salons/{salonId}/bookings`

| Method | Path | Auth | Role | Description | Module |
|---|---|---:|---|---|---|
| GET | `/salons/{salonId}/bookings` | Yes | MANAGER, RECEPTIONIST; STAFF own | لیست رزروها (فیلتر date range/status/staff/customer) | `src/modules/bookings` |
| POST | `/salons/{salonId}/bookings` | Yes | MANAGER, RECEPTIONIST | ایجاد رزرو حضوری (source=IN_PERSON) | `src/modules/bookings` |
| GET | `/salons/{salonId}/bookings/{bookingId}` | Yes | MANAGER, RECEPTIONIST; STAFF own | جزئیات رزرو | `src/modules/bookings` |
| PATCH | `/salons/{salonId}/bookings/{bookingId}` | Yes | MANAGER, RECEPTIONIST | تغییر زمان/پرسنل/یادداشت/سرویس (طبق قوانین) | `src/modules/bookings` |
| POST | `/salons/{salonId}/bookings/{bookingId}/cancel` | Yes | MANAGER, RECEPTIONIST | لغو + دلیل + canceledBy | `src/modules/bookings` |
| POST | `/salons/{salonId}/bookings/{bookingId}/confirm` | Yes | MANAGER, RECEPTIONIST | تغییر status به CONFIRMED | `src/modules/bookings` |
| POST | `/salons/{salonId}/bookings/{bookingId}/complete` | Yes | MANAGER, RECEPTIONIST | DONE + completedAt | `src/modules/bookings` |
| POST | `/salons/{salonId}/bookings/{bookingId}/no-show` | Yes | MANAGER, RECEPTIONIST | NO_SHOW + noShowAt | `src/modules/bookings` |

**قانون جلوگیری از همپوشانی (overlap)**
- اگر `Settings.preventOverlaps = true` باید همپوشانی را برای همان `staffId` و بازه `[startAt, endAt)` چک کنید.
- Production (Postgres): پیشنهاد Exclusion Constraint (در آینده).

## Public (Online Booking)
Base: `/api/v1/public/salons/{salonSlug}/bookings`

| Method | Path | Auth | Role | Description | Module |
|---|---|---:|---|---|---|
| POST | `/public/salons/{salonSlug}/bookings` | No | - | ایجاد رزرو آنلاین (source=ONLINE) + Idempotency-Key | `src/modules/public` (bookings handler) |

نکته:
- وضعیت نهایی:
  - اگر `Settings.allowOnlineBooking=false` → `403`
  - اگر `onlineBookingAutoConfirm=true` → `CONFIRMED`
  - در غیر اینصورت → `PENDING`

---

# 4.10 Payments
Base: `/api/v1/salons/{salonId}/bookings/{bookingId}/payments`

| Method | Path | Auth | Role | Description | Module |
|---|---|---:|---|---|---|
| GET | `/salons/{salonId}/bookings/{bookingId}/payments` | Yes | MANAGER, RECEPTIONIST | لیست پرداخت‌ها | `src/modules/payments` |
| POST | `/salons/{salonId}/bookings/{bookingId}/payments` | Yes | MANAGER, RECEPTIONIST | ثبت پرداخت + Idempotency-Key | `src/modules/payments` |

قواعد:
- بعد از هر Payment باید `Booking.paymentState` با جمع پرداخت‌ها آپدیت شود:
  - UNPAID / PARTIALLY_PAID / PAID / OVERPAID / REFUNDED

---

# 4.11 Reviews
## Private (Moderation)
Base: `/api/v1/salons/{salonId}/reviews`

| Method | Path | Auth | Role | Description | Module |
|---|---|---:|---|---|---|
| GET | `/salons/{salonId}/reviews` | Yes | MANAGER, RECEPTIONIST | لیست با فیلتر `status,target,serviceId` | `src/modules/reviews` |
| PATCH | `/salons/{salonId}/reviews/{reviewId}/status` | Yes | MANAGER | تغییر status به HIDDEN/DELETED/PUBLISHED | `src/modules/reviews` |

## Public (Submit)
Base: `/api/v1/public/salons/{salonSlug}`

| Method | Path | Auth | Role | Description | Module |
|---|---|---:|---|---|---|
| POST | `/public/salons/{salonSlug}/bookings/{bookingId}/reviews` | (اختیاری) | - | ثبت نظر (پس از DONE) | `src/modules/public` (reviews handler) |

> برای MVP می‌توانید submission را از پنل انجام دهید و Public را بعداً اضافه کنید.

---

# 4.12 Commission
Base: `/api/v1/salons/{salonId}`

| Method | Path | Auth | Role | Description | Module |
|---|---|---:|---|---|---|
| GET | `/salons/{salonId}/commission-policy` | Yes | MANAGER | دریافت policy | `src/modules/commission` |
| PUT | `/salons/{salonId}/commission-policy` | Yes | MANAGER | upsert policy | `src/modules/commission` |
| GET | `/salons/{salonId}/bookings/{bookingId}/commission` | Yes | MANAGER | مشاهده snapshot کمیسیون رزرو | `src/modules/commission` |

---

# 4.13 CMS / Site Builder
## Public
Base: `/api/v1/public/salons/{salonSlug}`

| Method | Path | Auth | Role | Description | Module |
|---|---|---:|---|---|---|
| GET | `/public/salons/{salonSlug}/pages` | No | - | لیست صفحات منتشرشده | `src/modules/public` (pages handler) |
| GET | `/public/salons/{salonSlug}/pages/{slug}` | No | - | جزئیات صفحه منتشرشده + sections | `src/modules/public` (pages handler) |
| GET | `/public/salons/{salonSlug}/media` | No | - | گالری فعال | `src/modules/public` (media handler) |
| GET | `/public/salons/{salonSlug}/links` | No | - | لینک‌های فعال/اصلی | `src/modules/public` (links handler) |
| GET | `/public/salons/{salonSlug}/addresses` | No | - | آدرس‌ها (public) | `src/modules/public` (addresses handler) |

## Admin (Private)
Base: `/api/v1/salons/{salonId}`

| Method | Path | Auth | Role | Description | Module |
|---|---|---:|---|---|---|
| GET | `/salons/{salonId}/pages` | Yes | MANAGER | لیست صفحات (همه statusها) | `src/modules/cms` |
| POST | `/salons/{salonId}/pages` | Yes | MANAGER | ایجاد page + sections | `src/modules/cms` |
| PATCH | `/salons/{salonId}/pages/{pageId}` | Yes | MANAGER | ویرایش page/meta/status/sections | `src/modules/cms` |
| POST | `/salons/{salonId}/media` | Yes | MANAGER | ثبت مدیا (url/altText/...) | `src/modules/cms` |
| PATCH | `/salons/{salonId}/media/{mediaId}` | Yes | MANAGER | ویرایش مدیا | `src/modules/cms` |

---

## 5) DTOهای کلیدی (مختصر و MVP-focused)

### 5.1 AuthLoginRequest
```json
{ "phone": "09123456789", "password": "secret123" }
```

### 5.2 AuthSuccessResponse
```json
{
  "success": true,
  "data": {
    "accessToken": "jwt",
    "refreshToken": "jwt",
    "user": { "id": "cuid", "salonId": "cuid", "role": "MANAGER", "fullName": "..." }
  },
  "meta": { "requestId": "uuid" }
}
```

### 5.3 CreateBooking (Panel)
```json
{
  "serviceId": "cuid",
  "staffId": "cuid",
  "customerProfileId": "cuid",
  "startAt": "2025-01-05T11:00:00Z",
  "note": "..."
}
```
Server:
- `endAt` را از `service.durationMinutes` محاسبه کند.
- snapshotها و `amountDueSnapshot` را پر کند.

### 5.4 CreateOnlineBooking (Public)
```json
{
  "customer": { "phone": "09123456789", "fullName": "Sara" },
  "serviceId": "cuid",
  "staffId": "cuid",
  "startAt": "2025-01-05T11:00:00Z",
  "note": "..."
}
```

### 5.5 AddPayment
```json
{ "amount": 800000, "currency": "IRR", "method": "CARD", "referenceCode": "POS-123" }
```

---

## 6) راهنمای Map کردن به ماژول‌ها (پیشنهاد ساختار پوشه‌ها)

پیشنهاد ساختار هر ماژول:
- `*.routes.ts`
- `*.controller.ts`
- `*.service.ts`
- `*.repo.ts`
- `*.validators.ts`
- `*.types.ts` (DTOs)

### ماژول‌ها
- `src/modules/auth` → login/refresh/logout/me + Session
- `src/modules/onboarding` → ایجاد Salon + Settings + Manager (اختیاری)
- `src/modules/salons` → salon CRUD (private)
- `src/modules/settings` → settings endpoints
- `src/modules/users` → staff endpoints + UserService mapping
- `src/modules/shifts` → upsert shifts
- `src/modules/services` → service endpoints (private)
- `src/modules/customers` → CustomerAccount + SalonCustomerProfile
- `src/modules/availability` → slot calculation (private)
- `src/modules/bookings` → booking create/list/update/cancel/confirm/complete/no-show
- `src/modules/payments` → payments + update Booking.paymentState
- `src/modules/reviews` → reviews moderation
- `src/modules/commission` → commission policy + booking commission snapshot
- `src/modules/cms` → pages/media admin
- `src/modules/public` → public endpoints (services/pages/media/availability/bookings)

---

## 7) نکات اجرایی مهم (برای جلوگیری از دردسر آینده)

1) **Booking overlap** را داخل transaction enforce کنید (application-level check + ideally DB constraint later).
2) **Idempotency** را جدی بگیرید (خصوصاً آنلاین و پرداخت).
3) **Snapshotها** هنگام ایجاد booking باید non-null پر شوند.
4) **RBAC + ownership** را از روز اول روی routeها enforce کنید.
5) برای Public API بهتر است rate limit سخت‌گیرانه‌تر باشد.

---

## 8) MVP پیشنهادی (حداقل لازم)
اگر بخواهید سریع MVP را بالا بیاورید، این‌ها را اول پیاده کنید:
1) Auth: login/refresh/logout/me
2) Services: CRUD
3) Customers: upsert + list
4) Availability: slots
5) Bookings: create/list/cancel/complete
6) Payments: create/list + update paymentState
7) Settings: allowOnlineBooking + preventOverlaps + timeZone

---

**پایان سند**

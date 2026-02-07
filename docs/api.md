# API Reference

Base URL: `/api/v1`

This document is generated from route files in `src/routes/index.ts` and `src/modules/**/**.routes.ts`. It does not assume any behavior not present in code.

## API Standards

### Naming
- Paths: `lowercase`, kebab-case for multiple words.
- JSON Keys: `camelCase`.

### Timezone
- All dates are sent and received in **ISO 8601** format in **UTC**.
- Salon-specific local time is handled by the application using `Settings.timeZone`.

### Idempotency
- Required for sensitive operations: **Public Bookings** and **Payments**.
- Header: `Idempotency-Key: <string>` (16-128 chars).
- Scope: Key + Salon + Path.
- TTL: 24 hours.

## Response Envelope

Most JSON APIs use `responseMiddleware` which wraps responses like:

```json
{
  "success": true,
  "data": { "...": "..." },
  "meta": { "requestId": "..." }
}
```

Errors follow:

```json
{
  "success": false,
  "error": {
    "code": "SOME_CODE",
    "message": "Human readable message",
    "details": {}
  },
  "meta": { "requestId": "..." }
}
```

All JSON routes use the envelope below.

## Auth

### POST `/auth/user/otp/request`

- **Auth**: public
- **Rate limiting**: `publicApiRateLimiter`
- **Body** (`requestOtpSchema`)
  - `phone` (string, min length 10)
- **Response**: `{ "success": true, "data": { "message": "..." } }`

Example request:

```json
{ "phone": "09123456789" }
```

### POST `/auth/user/otp/verify`

- **Auth**: public
- **Body** (`verifyOtpSchema`)
  - `phone` (string, min length 10)
  - `code` (string, length 6)
- **Response**: `{ "success": true, "data": { "salons": [{ "id": "...", "name": "..." }] } }`

### POST `/auth/user/login/otp`

- **Auth**: public
- **Body** (`loginWithOtpSchema`)
  - `phone` (string)
  - `salonId` (string, CUID)
- **Response**: `{ "success": true, "data": { "user": "...", "tokens": "..." } }`

### POST `/auth/login`

- **Auth**: public
- **Body** (`loginSchema`)
  - `phone` (string)
  - `password` (string, required when `actorType=USER`)
  - `actorType` (`USER` or `CUSTOMER`)
  - `salonId` (required when `actorType=USER`)
- **Response**: `{ "success": true, "data": { "user": "...", "tokens": "..." } }`

### POST `/auth/refresh`

- **Auth**: public
- **Body** (`refreshSchema`)
  - `refreshToken` (string)
- **Response**: `{ "success": true, "data": { "accessToken": "..." } }`

### POST `/auth/logout`

- **Auth**: required (Bearer access token)
- **Response**: `{ "success": true, "data": { "message": "..." } }`

### GET `/auth/me`

- **Auth**: required (Bearer access token)
- **Response**: `{ "success": true, "data": { "id": "...", "role": "..." } }`

## Health

### GET `/health`

- **Auth**: public
- **Response**: `{ "success": true, "data": { "status": "ok" } }`

## Salons

### GET `/salons`

- **Auth**: public
- **Response**: `{ "success": true, "data": [ ... ] }`

### GET `/salons/:id`

- **Auth**: public
- **Response**: `{ "success": true, "data": { "...": "..." } }`

### POST `/salons`

- **Auth**: required
- **Response**: `{ "success": true, "data": { "...": "..." } }`

### PATCH `/salons/:id`

- **Auth**: required
- **Roles**: `MANAGER`
- **Tenant guard**: salon ID must match the authenticated user.
- **Response**: `{ "success": true, "data": { "...": "..." } }`

### DELETE `/salons/:id`

- **Auth**: required
- **Roles**: `MANAGER`
- **Tenant guard**: salon ID must match the authenticated user.
- **Response**: `{ "success": true, "data": { "...": "..." } }`

## Services

### POST `/salons/:salonId/services`

- **Auth**: required
- **Roles**: `MANAGER`
- **Body** (`createServiceSchema`): `name`, `durationMinutes`, `price`, `currency`, `isActive?`
- **Response**: `{ "success": true, "data": { "...": "..." } }`

### GET `/salons/:salonId/services`

- **Auth**: required
- **Roles**: `MANAGER`, `RECEPTIONIST`, `STAFF`
- **Response**: `{ "success": true, "data": [ ... ] }`

### GET `/salons/:salonId/services/:serviceId`

- **Auth**: required
- **Roles**: `MANAGER`, `RECEPTIONIST`, `STAFF`
- **Params**: `serviceId` (CUID)
- **Response**: `{ "success": true, "data": { "...": "..." } }`

### PATCH `/salons/:salonId/services/:serviceId`

- **Auth**: required
- **Roles**: `MANAGER`
- **Body** (`updateServiceSchema`): any of `name`, `durationMinutes`, `price`, `currency`, `isActive`
- **Response**: `{ "success": true, "data": { "...": "..." } }`

### DELETE `/salons/:salonId/services/:serviceId`

- **Auth**: required
- **Roles**: `MANAGER`
- **Params**: `serviceId` (CUID)
- **Response**: `204 No Content`

### GET `/public/salons/:salonSlug/services`

- **Auth**: public
- **Behavior**: forcibly sets `isActive=true` before querying.
- **Response**: `{ "success": true, "data": [ ... ] }`

## Staff / Users

### POST `/salons/:salonId/staff`

- **Auth**: required
- **Roles**: `MANAGER`
- **Body** (`createUserSchema`): `fullName`, `phone` (Iranian format `09xxxxxxxxx`), `role`, optional public profile fields.
- **Response**: `{ "success": true, "data": { "...": "..." } }`

### GET `/salons/:salonId/staff`

- **Auth**: required
- **Response**: `{ "success": true, "data": [ ... ] }`

### GET `/salons/:salonId/staff/:userId`

- **Auth**: required
- **Response**: `{ "success": true, "data": { "...": "..." } }`

### PUT `/salons/:salonId/staff/:userId`

- **Auth**: required
- **Roles**: `MANAGER`
- **Body** (`updateUserSchema`): fields such as `fullName`, `role`, `isActive`, public profile fields.
- **Response**: `{ "success": true, "data": { "...": "..." } }`

### DELETE `/salons/:salonId/staff/:userId`

- **Auth**: required
- **Roles**: `MANAGER`
- **Response**: `204 No Content`

## Shifts

### PUT `/salons/:salonId/staff/:userId/shifts`

- **Auth**: required
- **Roles**: `MANAGER`
- **Body** (`upsertShiftsSchema`): array of shift objects
  - `dayOfWeek` (0-6)
  - `startTime` (HH:MM)
  - `endTime` (HH:MM)
  - `isActive` (boolean)
- **Response**: `{ "success": true, "data": [ ... ] }`

## Availability (Public)

### GET `/public/salons/:salonSlug/availability/slots`

- **Auth**: public
- **Query** (`getAvailabilityQuerySchema`):
  - `serviceId` (CUID, required)
  - `staffId` (CUID, optional)
  - `startDate` (date string)
  - `endDate` (date string, must be > startDate)
- **Response**: `{ "success": true, "data": [ ... ] }`

Example response:

```json
{
  "success": true,
  "data": [
    {
      "time": "2024-08-01T09:00:00.000Z",
      "staff": { "id": "ck...", "fullName": "Ava" }
    }
  ]
}
```

## Bookings (Private)

### POST `/salons/:salonId/bookings`

- **Auth**: required
- **Roles**: `MANAGER`, `RECEPTIONIST`
- **Body** (`createBookingSchema`): `customer`, `serviceId`, `staffId`, `startAt`, `note?`
- **Response**: `{ "success": true, "data": { "...": "..." } }`

### GET `/salons/:salonId/bookings`

- **Auth**: required
- **Roles**: `MANAGER`, `RECEPTIONIST`, `STAFF`
- **Query** (`listBookingsQuerySchema`): `page`, `pageSize`, `sortBy`, `sortOrder`, `status`, `staffId`, `customerProfileId`, `dateFrom`, `dateTo`
- **Response**: `{ "success": true, "data": [ ... ], "meta": { "page": 1, "pageSize": 20, "total": 0 } }`

### GET `/salons/:salonId/bookings/:bookingId`

- **Auth**: required
- **Roles**: `MANAGER`, `RECEPTIONIST`, `STAFF`
- **Params**: `bookingId` (CUID)
- **Response**: `{ "success": true, "data": { "...": "..." } }`

### PATCH `/salons/:salonId/bookings/:bookingId`

- **Auth**: required
- **Roles**: `MANAGER`, `RECEPTIONIST`
- **Body** (`updateBookingSchema`): any of `serviceId`, `staffId`, `startAt`, `note`
- **Response**: `{ "success": true, "data": { "...": "..." } }`

### POST `/salons/:salonId/bookings/:bookingId/confirm`

- **Auth**: required
- **Roles**: `MANAGER`, `RECEPTIONIST`
- **Response**: `{ "success": true, "data": { "...": "..." } }`

### POST `/salons/:salonId/bookings/:bookingId/cancel`

- **Auth**: required
- **Roles**: `MANAGER`, `RECEPTIONIST`
- **Body** (`cancelBookingSchema`): `reason?`
- **Response**: `{ "success": true, "data": { "...": "..." } }`

### POST `/salons/:salonId/bookings/:bookingId/complete`

- **Auth**: required
- **Roles**: `MANAGER`, `RECEPTIONIST`
- **Response**: `{ "success": true, "data": { "...": "..." } }`

### POST `/salons/:salonId/bookings/:bookingId/no-show`

- **Auth**: required
- **Roles**: `MANAGER`, `RECEPTIONIST`
- **Response**: `{ "success": true, "data": { "...": "..." } }`

## Bookings (Public)

### POST `/public/salons/:salonSlug/bookings`

- **Auth**: public
- **Headers**: `Idempotency-Key` (16-128 chars)
- **Body** (`createPublicBookingSchema`):
  - `serviceId`, `staffId`, `startAt`
  - `customer`: `{ fullName, phone, email? }`
  - `note?`
- **Response**: `{ "success": true, "data": { "...": "..." } }`
- **Note**: service implementation is a placeholder.

## Payments

### POST `/salons/:salonId/bookings/:bookingId/payments/init`

- **Auth**: required
- **Roles**: `MANAGER`, `RECEPTIONIST`, `STAFF`
- **Headers**: `Idempotency-Key`
- **Body**: none (params validation only via `InitPaymentValidators`)
- **Response**: `201 Created`:

```json
{
  "success": true,
  "data": {
    "paymentId": "...",
    "paymentStatus": "INITIATED",
    "checkoutUrl": "https://sandbox.zarinpal.com/pg/StartPay/..."
  }
}
```

## CMS (Private)

All CMS routes require auth + `MANAGER` role + tenant guard.

### Pages

- **GET** `/salons/:salonId/pages`
  - Query: `status?`, `type?`, `limit?`, `offset?`
- **GET** `/salons/:salonId/pages/:pageId`
- **POST** `/salons/:salonId/pages`
  - Body: page metadata + `sections[]` (see `createPageSchema`)
- **PATCH** `/salons/:salonId/pages/:pageId`
  - Body: any editable page fields

### Media

- **POST** `/salons/:salonId/media`
  - Body: media metadata (see `createMediaSchema`)
- **PATCH** `/salons/:salonId/media/:mediaId`
  - Body: partial media update (see `updateMediaSchema`)

### Links

- All routes currently return `501` (placeholder).

### Addresses

- All routes currently return `501` (placeholder).

### Site Settings

- **GET** `/salons/:salonId/site-settings`
- **PUT** `/salons/:salonId/site-settings`
  - Body: partial SEO/site settings update (see `updateSiteSettingsSchema`)

## CMS Admin UI

### GET `/admin/salons/:salonId/pages`

- Returns a static HTML admin UI for CMS pages.
- Not protected by auth in the route itself.

## Public CMS

### GET `/public/salons/:salonSlug/pages/:pageSlug`

- Returns HTML for the requested page.
- Supports `ETag` and `If-Modified-Since` for caching.
- Redirects (301) if the slug exists in `SalonPageSlugHistory`.

### GET `/public/salons/:salonSlug/media`

- Returns JSON: `{ success: true, data: media[] }`
- Adds `Cache-Control: public, max-age=300, stale-while-revalidate=300`

### GET `/public/salons/:salonSlug/links`

- Returns JSON: `{ success: true, data: links[] }`

### GET `/public/salons/:salonSlug/addresses`

- Returns JSON: `{ success: true, data: addresses[] }`

## Webhooks

### POST `/webhooks/payments/:provider`
- **Auth**: signature-based (HMAC SHA-256) using `X-Signature` header.
- **Body**: raw JSON; middleware uses `express.json({ verify })` to capture the raw body.
- **Response**: `{ success: true, data: { message: 'Webhook received and processed.' } }`

## Known Gaps / TODO

- Payments route path includes a duplicated `/bookings` segment due to how routers are mounted.
- CMS links and addresses private routes return `501` placeholders.
- CMS Admin UI route is not protected by auth middleware.

## Source of Truth

- `src/routes/index.ts`
- `src/modules/**/**.routes.ts`
- `src/modules/**/**.validators.ts`
- `src/modules/**/**.controller.ts`
- `src/common/middleware/response.ts`

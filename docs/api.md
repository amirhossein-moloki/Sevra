# API Reference

Base URL: `/api/v1`

This document is generated from route files in `src/routes/index.ts` and `src/modules/**/**.routes.ts`. It does not assume any behavior not present in code.

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

Not all routes use the envelope (noted per endpoint).

## Auth

### POST `/auth/user/otp/request`

- **Auth**: public
- **Rate limiting**: `publicApiRateLimiter`
- **Body** (`requestOtpSchema`)
  - `phone` (string, min length 10)
- **Response**: `res.ok({ data: { message } })`

Example request:

```json
{ "phone": "09123456789" }
```

### POST `/auth/user/otp/verify`

- **Auth**: public
- **Body** (`verifyOtpSchema`)
  - `phone` (string, min length 10)
  - `code` (string, length 6)
- **Response**: `res.ok({ data: { salons: [{ id, name }] } })`

### POST `/auth/user/login/otp`

- **Auth**: public
- **Body** (`loginWithOtpSchema`)
  - `phone` (string)
  - `salonId` (string, CUID)
- **Response**: `res.ok({ data: { user, tokens } })`

### POST `/auth/login`

- **Auth**: public
- **Body** (`loginSchema`)
  - `phone` (string)
  - `password` (string, required when `actorType=USER`)
  - `actorType` (`USER` or `CUSTOMER`)
  - `salonId` (required when `actorType=USER`)
- **Response**: `res.ok({ data: { user|customer, tokens } })`

### POST `/auth/refresh`

- **Auth**: public
- **Body** (`refreshSchema`)
  - `refreshToken` (string)
- **Response**: `res.ok({ data: { accessToken } })`

### POST `/auth/logout`

- **Auth**: required (Bearer access token)
- **Response**: `res.ok({ data: { message } })`

### GET `/auth/me`

- **Auth**: required (Bearer access token)
- **Response**: `res.ok({ data: actor })`

## Health

### GET `/health`

- **Auth**: public
- **Response**: `{ \"status\": \"ok\" }`

## Salons

### GET `/salons`

- **Auth**: public
- **Response**: `res.ok({ data: salons })`

### GET `/salons/:id`

- **Auth**: public
- **Response**: `res.ok({ data: salon })`

### POST `/salons`

- **Auth**: required
- **Response**: `res.ok({ data: salon })`

### PATCH `/salons/:id`

- **Auth**: required
- **Roles**: `MANAGER`
- **Tenant guard**: salon ID must match the authenticated user.
- **Response**: `res.ok({ data: salon })`

### DELETE `/salons/:id`

- **Auth**: required
- **Roles**: `MANAGER`
- **Tenant guard**: salon ID must match the authenticated user.
- **Response**: `res.ok({ data: salon })`

## Services

### POST `/salons/:salonId/services`

- **Auth**: required
- **Roles**: `MANAGER`
- **Body** (`createServiceSchema`): `name`, `durationMinutes`, `price`, `currency`, `isActive?`
- **Response**: `res.ok({ data: service })`

### GET `/salons/:salonId/services`

- **Auth**: required
- **Roles**: `MANAGER`, `RECEPTIONIST`, `STAFF`
- **Response**: `res.ok({ data: services })`

### GET `/salons/:salonId/services/:serviceId`

- **Auth**: required
- **Roles**: `MANAGER`, `RECEPTIONIST`, `STAFF`
- **Params**: `serviceId` (CUID)
- **Response**: `res.ok({ data: service })`

### PATCH `/salons/:salonId/services/:serviceId`

- **Auth**: required
- **Roles**: `MANAGER`
- **Body** (`updateServiceSchema`): any of `name`, `durationMinutes`, `price`, `currency`, `isActive`
- **Response**: `res.ok({ data: service })`

### DELETE `/salons/:salonId/services/:serviceId`

- **Auth**: required
- **Roles**: `MANAGER`
- **Params**: `serviceId` (CUID)
- **Response**: `res.ok({ data: service })`

### GET `/public/salons/:salonSlug/services`

- **Auth**: public
- **Behavior**: forcibly sets `isActive=true` before querying.
- **Response**: `res.ok({ data: services })`

## Staff / Users

### POST `/salons/:salonId/staff`

- **Auth**: required
- **Roles**: `MANAGER`
- **Body** (`createUserSchema`): `fullName`, `phone` (Iranian format `09xxxxxxxxx`), `role`, optional public profile fields.
- **Response**: `res.ok({ data: user })`

### GET `/salons/:salonId/staff`

- **Auth**: required
- **Response**: `res.ok({ data: users })`

### GET `/salons/:salonId/staff/:userId`

- **Auth**: required
- **Response**: `res.ok({ data: user })`

### PUT `/salons/:salonId/staff/:userId`

- **Auth**: required
- **Roles**: `MANAGER`
- **Body** (`updateUserSchema`): fields such as `fullName`, `role`, `isActive`, public profile fields.
- **Response**: `res.ok({ data: user })`

### DELETE `/salons/:salonId/staff/:userId`

- **Auth**: required
- **Roles**: `MANAGER`
- **Response**: `res.ok({ data: user })`

## Shifts

### PUT `/salons/:salonId/staff/:userId/shifts`

- **Auth**: required
- **Roles**: `MANAGER`
- **Body** (`upsertShiftsSchema`): array of shift objects
  - `dayOfWeek` (0-6)
  - `startTime` (HH:MM)
  - `endTime` (HH:MM)
  - `isActive` (boolean)
- **Response**: `res.ok({ data: shifts })`

## Availability (Public)

### GET `/public/salons/:salonSlug/availability/slots`

- **Auth**: public
- **Query** (`getAvailabilityQuerySchema`):
  - `serviceId` (CUID, required)
  - `staffId` (CUID, optional)
  - `startDate` (date string)
  - `endDate` (date string, must be > startDate)
- **Response**: **plain JSON array**, not wrapped in `res.ok`.

Example response:

```json
[
  {
    "time": "2024-08-01T09:00:00.000Z",
    "staff": { "id": "ck...", "fullName": "Ava" }
  }
]
```

## Bookings (Private)

### POST `/salons/:salonId/bookings`

- **Auth**: required
- **Roles**: `MANAGER`, `RECEPTIONIST`
- **Body** (`createBookingSchema`): `customer`, `serviceId`, `staffId`, `startAt`, `note?`
- **Response**: `res.ok({ data: booking })`

### GET `/salons/:salonId/bookings`

- **Auth**: required
- **Roles**: `MANAGER`, `RECEPTIONIST`, `STAFF`
- **Query** (`listBookingsQuerySchema`): `page`, `pageSize`, `sortBy`, `sortOrder`, `status`, `staffId`, `customerProfileId`, `dateFrom`, `dateTo`
- **Response**: `res.ok({ data, meta })` where `meta` includes pagination.

### GET `/salons/:salonId/bookings/:bookingId`

- **Auth**: required
- **Roles**: `MANAGER`, `RECEPTIONIST`, `STAFF`
- **Params**: `bookingId` (CUID)
- **Response**: `res.ok({ data: booking })`

### PATCH `/salons/:salonId/bookings/:bookingId`

- **Auth**: required
- **Roles**: `MANAGER`, `RECEPTIONIST`
- **Body** (`updateBookingSchema`): any of `serviceId`, `staffId`, `startAt`, `note`
- **Response**: `res.ok({ data: booking })`

### POST `/salons/:salonId/bookings/:bookingId/confirm`

- **Auth**: required
- **Roles**: `MANAGER`, `RECEPTIONIST`
- **Response**: `res.ok({ data: booking })`

### POST `/salons/:salonId/bookings/:bookingId/cancel`

- **Auth**: required
- **Roles**: `MANAGER`, `RECEPTIONIST`
- **Body** (`cancelBookingSchema`): `reason?`
- **Response**: `res.ok({ data: booking })`

### POST `/salons/:salonId/bookings/:bookingId/complete`

- **Auth**: required
- **Roles**: `MANAGER`, `RECEPTIONIST`
- **Response**: `res.ok({ data: booking })`

### POST `/salons/:salonId/bookings/:bookingId/no-show`

- **Auth**: required
- **Roles**: `MANAGER`, `RECEPTIONIST`
- **Response**: `res.ok({ data: booking })`

## Bookings (Public)

### POST `/public/salons/:salonSlug/bookings`

- **Auth**: public
- **Headers**: `Idempotency-Key` (16-128 chars)
- **Body** (`createPublicBookingSchema`):
  - `serviceId`, `staffId`, `startAt`
  - `customer`: `{ fullName, phone, email? }`
  - `note?`
- **Response**: `res.ok({ data: booking })`
- **Note**: service implementation is a placeholder.

## Payments

### POST `/salons/:salonId/bookings/bookings/:bookingId/payments/init`

> Path is composed from `src/routes/index.ts` and `src/modules/payments/payments.routes.ts` (note the duplicated `bookings` segment).

- **Auth**: required
- **Roles**: `MANAGER`, `RECEPTIONIST`, `STAFF`
- **Headers**: `Idempotency-Key`
- **Body**: none (params validation only via `InitPaymentValidators`)
- **Response**: `201 Created` (custom JSON, not using `res.ok`):

```json
{
  "success": true,
  "message": "Payment initiated successfully.",
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

- Returns JSON: `{ data: media[] }`
- Adds `Cache-Control: public, max-age=300, stale-while-revalidate=300`

### GET `/public/salons/:salonSlug/links`

- Returns JSON: `{ data: links[] }`

### GET `/public/salons/:salonSlug/addresses`

- Returns JSON: `{ data: addresses[] }`

## Webhooks

### POST `/api/v1/webhooks/payments/:provider`

- **Important**: this is mounted under `/api/v1` *again* in `src/routes/index.ts`, so the full path is `/api/v1/api/v1/webhooks/payments/:provider`.
- **Auth**: signature-based (HMAC SHA-256) using `X-Signature` header.
- **Body**: raw JSON; middleware uses `express.json({ verify })` to capture the raw body.
- **Response**: `{ success: true, message: 'Webhook received and processed.' }`

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

# Payments, Commission, Webhooks

## Payments

### Data Model

- `Payment` belongs to `Booking` and `Salon`.
- Key fields: `provider`, `status`, `amount`, `currency`, `providerPaymentId`, `providerCheckoutId`, `idempotencyKey`.
- `PaymentStatus` enum: `INITIATED`, `PENDING`, `PAID`, `FAILED`, `REFUNDED`, `VOID`, `CANCELED`.
- `PaymentProvider` enum: `MANUAL`, `STRIPE`, `ZARINPAL`.

### Payment Initiation Flow

Route: `POST /api/v1/salons/:salonId/bookings/:bookingId/payments/init`

1. Auth + role checks are enforced (`MANAGER`, `RECEPTIONIST`, `STAFF`).
2. `idempotencyMiddleware` requires `Idempotency-Key` header and stores request status in Redis.
3. `PaymentsService.initiatePayment`:
   - Ensures the booking exists.
   - Rejects if `Booking.paymentState` is `PAID`.
   - Creates a `Payment` record with provider `ZARINPAL` and `status=INITIATED`.
   - Returns a mock checkout URL.

### Payment State Machine

The state machine logic is centralized in `src/modules/payments/payments.state.ts` and enforced in `src/modules/payments/payments.repo.ts`.

- **Booking Transitions:**
  - `UNPAID` -> `PENDING` (When payment is initiated)
  - `PENDING` -> `PAID` (When payment is successful)
  - `PENDING` -> `FAILED` / `CANCELED` (When payment fails or is canceled)
- **Payment Transitions:**
  - `INITIATED` -> `PAID`
  - `INITIATED` -> `FAILED`
  - `INITIATED` -> `CANCELED`

### Decision (MVP Scope)

**Keep initiation mocked.** The current code creates a `Payment` with provider `ZARINPAL` and returns a sandbox checkout URL, while webhook handling is implemented to finalize `Payment.status` and `Booking.paymentState`. In a real-world scenario, the `initiatePayment` service would call the ZarinPal API to get a real `Authority` and redirect URL.

## Commission

### Data Model

- `SalonCommissionPolicy` stores the policy per salon.
- `BookingCommission` records the commission for a specific booking.
- `CommissionPayment` tracks payments against a commission.

### Implementation Status

**Skeleton Only.** The data model and basic file structure for commissions exist in `src/modules/commissions`, but there are no implemented services, controllers, or routes. Commission calculation logic should be triggered upon booking completion or payment success in a future iteration.

## Webhooks

### Payment Webhooks

Route: `POST /api/v1/webhooks/payments/:provider`

- Uses `express.json({ verify })` to capture the raw request body for signature verification.
- Requires `X-Signature` header.
- Signature verification uses HMAC SHA-256 with `PAYMENT_PROVIDER_WEBHOOK_SECRET`.
- Uses Redis for idempotency to ensure each webhook event is processed exactly once.
- On success, updates the `Payment` and `Booking` statuses atomically within a transaction.

### Fixes

- Fixed a bug where the webhook route was mounted under `/api/v1` twice, resulting in `/api/v1/api/v1/webhooks/...`. It is now correctly accessible at `/api/v1/webhooks/...`.

## Source of Truth

- `src/modules/payments/payments.routes.ts`
- `src/modules/payments/payments.controller.ts`
- `src/modules/payments/payments.service.ts`
- `src/modules/payments/payments.state.ts`
- `src/modules/payments/payments.repo.ts`
- `src/modules/webhooks/webhooks.routes.ts`
- `src/modules/webhooks/webhooks.service.ts`
- `src/modules/webhooks/middleware/verifyPaymentWebhookSignature.ts`
- `prisma/schema.prisma`

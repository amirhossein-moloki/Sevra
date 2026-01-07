# Payments, Commission, Webhooks

## Payments

### Data Model

- `Payment` belongs to `Booking` and `Salon`.
- Key fields: `provider`, `status`, `amount`, `currency`, `providerPaymentId`, `providerCheckoutId`, `idempotencyKey`.
- `PaymentStatus` enum: `INITIATED`, `PENDING`, `PAID`, `FAILED`, `REFUNDED`, `VOID`, `CANCELED`.
- `PaymentProvider` enum: `MANUAL`, `STRIPE`, `ZARINPAL`.

### Payment Initiation Flow

Route: `POST /api/v1/salons/:salonId/bookings/bookings/:bookingId/payments/init`

1. Auth + role checks are enforced (`MANAGER`, `RECEPTIONIST`, `STAFF`).
2. `idempotencyMiddleware` requires `Idempotency-Key` header and stores request status in `IdempotencyKey`.
3. `PaymentsService.initiatePayment`:
   - Ensures the booking exists.
   - Rejects if `Booking.paymentState` is `PAID`.
   - Creates a `Payment` record with provider `ZARINPAL` and `status=INITIATED`.
   - Returns a mock checkout URL.

**Note:** The route path includes duplicated `/bookings` due to how the router is mounted.

### Decision (MVP Scope)

**Keep initiation mocked (Option A).** The current code creates a `Payment` with provider `ZARINPAL` and returns a sandbox checkout URL in `PaymentsService.initiatePayment`, while webhook handling is already implemented and tested to finalize `Payment.status` and `Booking.paymentState`. There is no provider SDK or API integration configured beyond the webhook secret, so the smallest change-set consistent with existing infrastructure is to keep initiation mocked and rely on webhooks as the real finalizer.

## Commission

### Data Model

- `SalonCommissionPolicy` stores the policy per salon.
- `BookingCommission` records the commission for a specific booking.
- `CommissionPayment` tracks payments against a commission.

### Calculation Fields

`BookingCommission` stores:

- `baseAmount` — the amount used to compute commission (logic not implemented in code).
- `commissionAmount` — the final commission amount.
- `type`, `percentBps`, `fixedAmount` — snapshot of policy at calculation time.

### Implementation Status

There are no mounted routes or services for commission processing in `src/routes/index.ts`. The data model exists but business logic is not exposed via the API.

## Webhooks

### Payment Webhooks

Route: `POST /api/v1/api/v1/webhooks/payments/:provider`

- Uses `express.json({ verify })` to capture raw request body.
- Requires `X-Signature` header.
- Signature verification uses HMAC SHA-256 with `PAYMENT_PROVIDER_WEBHOOK_SECRET`.
- On success, responds with `{ success: true, message: 'Webhook received and processed.' }`.

## Known Gaps / TODO

- Payment initiation uses a mocked checkout URL and hard-coded provider (`ZARINPAL`).
- No API routes are mounted for commission lifecycle management.
- Webhook route is mounted under `/api/v1` twice, resulting in `/api/v1/api/v1/...`.

## Source of Truth

- `src/modules/payments/payments.routes.ts`
- `src/modules/payments/payments.controller.ts`
- `src/modules/payments/payments.service.ts`
- `src/common/middleware/idempotency.ts`
- `src/modules/webhooks/webhooks.routes.ts`
- `src/modules/webhooks/middleware/verifyPaymentWebhookSignature.ts`
- `prisma/schema.prisma`

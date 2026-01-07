# Architecture

## Overview

- Runtime: Node.js + Express
- Language: TypeScript
- Database: PostgreSQL via Prisma
- API base path: `/api/v1`

## Request Lifecycle (High Level)

1. `src/app.ts` mounts middleware (JSON, CORS, Helmet, logger) and assigns a request ID.
2. `responseMiddleware` adds the response envelope helpers (e.g., `res.ok`).
3. `src/routes/index.ts` mounts module routers under `/api/v1`.
4. Module routers apply auth, tenant checks, validation (Zod), and rate limiting.
5. Controllers and services implement business logic and use Prisma for data access.

## Project Map

### Top-Level Structure

- `src/app.ts` — Express app composition and global middleware.
- `src/server.ts` — Server bootstrap.
- `src/routes/index.ts` — API route composition and module mounting.
- `src/modules/**` — Feature modules (controllers, services, repositories, validators, routes).
- `src/common/**` — Cross-cutting middleware, errors, utilities.
- `prisma/schema.prisma` — Database schema and enums.

### Route Composition (Mounted in `src/routes/index.ts`)

| Module | Route Prefix | Key Files |
| --- | --- | --- |
| Health | `/health` | `src/routes/health.routes.ts` |
| Auth | `/auth` | `src/modules/auth/auth.routes.ts`, `auth.controller.ts`, `auth.service.ts`, `auth.validators.ts` |
| Salons | `/salons` | `src/modules/salon/salon.routes.ts`, `salon.controller.ts`, `salon.service.ts` |
| Services (private) | `/salons/:salonId/services` | `src/modules/services/services.routes.ts`, `services.controller.ts`, `services.validators.ts` |
| Services (public) | `/public/salons/:salonSlug/services` | `src/modules/services/services.routes.ts`, `services.controller.ts` |
| Staff / Users | `/salons/:salonId/staff` | `src/modules/users/users.routes.ts`, `users.controller.ts`, `users.validators.ts` |
| Shifts | `/salons/:salonId/staff/:userId/shifts` | `src/modules/shifts/shifts.routes.ts`, `shifts.controller.ts`, `shifts.validators.ts` |
| Availability (public) | `/public/salons/:salonSlug/availability` | `src/modules/availability/availability.routes.ts`, `availability.controller.ts`, `availability.validators.ts` |
| Bookings (private) | `/salons/:salonId/bookings` | `src/modules/bookings/bookings.routes.ts`, `bookings.controller.ts`, `bookings.validators.ts` |
| Bookings (public) | `/public/salons/:salonSlug/bookings` | `src/modules/bookings/bookings.public.routes.ts`, `bookings.validators.ts` |
| Payments | `/salons/:salonId/bookings` | `src/modules/payments/payments.routes.ts`, `payments.controller.ts`, `payments.service.ts`, `payments.validators.ts` |
| CMS (private) | `/salons/:salonId` | `src/modules/cms/cms.routes.ts`, `pages.routes.ts`, `media.routes.ts`, `links.routes.ts`, `addresses.routes.ts`, `site-settings.routes.ts` |
| CMS Admin UI | `/admin` | `src/modules/cms/admin-ui.routes.ts` |
| Public CMS | `/public/salons/:salonSlug/pages` / `media` / `links` / `addresses` | `src/modules/public/public.routes.ts` and `src/modules/public/*.public.controller.ts` |
| Webhooks | `/api/v1/webhooks` | `src/modules/webhooks/webhooks.routes.ts`, `webhooks.controller.ts`, `middleware/verifyPaymentWebhookSignature.ts` |

## Known Gaps / TODO

- Several feature route files exist but are not mounted in `src/routes/index.ts` (e.g., customers, reviews, commissions). If they are intended to be public, they should be mounted and documented once integrated.
- Some modules return non-standard response shapes (e.g., availability uses `res.status(200).json(slots)` instead of the shared `res.ok` envelope).

## Source of Truth

- `src/app.ts`
- `src/server.ts`
- `src/routes/index.ts`
- `src/modules/**`
- `src/common/**`

# Sevra MVP - Status & Tasks

This document tracks the progress toward a fully functional Minimum Viable Product (MVP).

## 1. Completed Core Logic

### 1.1 Timezone Support
- [x] Implement timezone-aware calculations in `availability.service.ts`.
- [x] Implement timezone-aware validation in `bookings.service.ts`.
- [x] Verified usage of `salon.settings.timeZone` for availability and booking operations.

### 1.2 Real Payment Integration
- [x] Real ZarinPal API (v4) integration implemented in `PaymentsService.initiatePayment`.
- [x] Environment variables configured for sandbox/production.

---

## 2. Completed Modules

### 2.1 Customers (CRM) Module
- [x] List with search/filter (`GET /salons/:salonId/customers`).
- [x] Detail view (`GET /salons/:salonId/customers/:id`).
- [x] Manual creation (`POST /salons/:salonId/customers`).
- [x] Profile updates (`PATCH /salons/:salonId/customers/:id`).

### 2.2 Reviews Module
- [x] Public review submission (`POST /public/salons/:salonSlug/bookings/:bookingId/reviews`).
- [x] List published reviews (`GET /public/salons/:salonSlug/reviews`).
- [x] Review moderation (`PATCH /salons/:salonId/reviews/:id/status`).

### 2.3 Settings Module
- [x] Fetch configuration (`GET /salons/:salonId/settings`).
- [x] Update settings (`PATCH /salons/:salonId/settings`).

### 2.4 CMS & Public Site
- [x] Public route enforcement (`salonSlug` and `isActive` checks via `resolveSalonBySlug`).
- [x] SEO metadata support for public pages.
- [x] Media Management: Image upload, resizing (300x300 thumbnails), and deletion.

---

## 3. Remaining Tasks (Stabilization)

### 3.1 Infrastructure & Stability
- [x] **Fix Critical TypeScript Errors**: Resolved massive syntax issues in `admin-ui.routes.ts`.
- [ ] **Fix Remaining TypeScript Errors**: Address strict typing and Prisma-related errors in other modules.
- [ ] **Testing Environment**: Resolve Docker/Prisma permission issues in the CI pipeline.
- [ ] **Test Coverage**: Achieve >80% code coverage for core business logic (currently partially tested).

### 3.2 Error Handling & Logging
- [x] **5xx Error Sanitization**: Implemented in global error handler.
- [ ] **Audit Logging**: Implement dedicated audit logging for sensitive actions (e.g., cancellations, manual overrides).

---

## 4. Phase 2 (Post-MVP)
- [ ] **Commissions Module**: Full implementation of calculation and payout tracking (Skeleton exists).
- [ ] **Notifications**: Real SMS/WhatsApp reminders for bookings (Mocked logic exists).
- [ ] **Advanced Analytics**: Revenue reporting and staff performance tracking.

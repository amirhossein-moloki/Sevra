# Sevra MVP - Remaining Tasks

This list represents the work required to reach a fully functional Minimum Viable Product (MVP).

## 1. Core Logic Refinements

### 1.1 Timezone Support (High Priority)
- [ ] Implement timezone-aware calculations in `availability.service.ts`.
- [ ] Implement timezone-aware validation in `bookings.service.ts`.
- [ ] Ensure all date/time inputs and outputs are correctly handled according to `salon.settings.timeZone`.

### 1.2 Real Payment Integration
- [ ] Replace mocked initiation in `PaymentsService.initiatePayment` with real ZarinPal API integration.
- [ ] Securely handle API keys and merchant IDs via environment variables.

---

## 2. Missing Modules (Skeleton Exists)

### 2.1 Customers (CRM) Module
- [ ] Implement `GET /salons/:salonId/customers` (List with search/filter).
- [ ] Implement `GET /salons/:salonId/customers/:id` (Detail).
- [ ] Implement `POST /salons/:salonId/customers` (Manual creation).
- [ ] Implement `PATCH /salons/:salonId/customers/:id` (Update notes/profile).

### 2.2 Reviews Module
- [ ] Implement `POST /public/salons/:salonSlug/bookings/:bookingId/reviews` (Submit review).
- [ ] Implement `GET /public/salons/:salonSlug/reviews` (List published reviews).
- [ ] Implement `PATCH /salons/:salonId/reviews/:id/status` (Moderate review: publish/hide).

### 2.3 Settings Module
- [ ] Implement `GET /salons/:salonId/settings` (Fetch current configuration).
- [ ] Implement `PATCH /salons/:salonId/settings` (Update timezone, work hours, online booking toggles).

---

## 3. Infrastructure & Stabilization

### 3.1 Testing Environment
- [ ] Fix pre-existing TypeScript errors in the test suite.
- [ ] Resolve Docker/Prisma permission issues in the CI pipeline.
- [ ] Achieve >80% code coverage for core business logic (Bookings, Availability, Payments).

### 3.2 Error Handling & Logging
- [ ] Ensure all 5xx errors are sanitized in production.
- [ ] Implement audit logging for sensitive actions (e.g., manual payment overrides, booking cancellations).

---

## 4. CMS & Public Site

### 4.1 Public Routes
- [ ] Verify all public routes (`/public/salons/:salonSlug/...`) are correctly enforcing `salonSlug` and `isActive` checks.
- [ ] Ensure SEO metadata is correctly served for each page.

### 4.2 Media Management
- [ ] Implement secure file upload logic for salon logos and gallery images.
- [ ] Implement image resizing/thumbnail generation.

---

## 5. Post-MVP (Phase 2)
- [ ] **Commissions Module**: Full implementation of calculation and payout tracking.
- [ ] **Notifications**: SMS/WhatsApp reminders for bookings.
- [ ] **Advanced Analytics**: Revenue reporting and staff performance tracking.

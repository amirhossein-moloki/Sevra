# Sevra Project - Development Roadmap & TODO

This document tracks the progress and remaining tasks for the Sevra salon management system.

## 1. Completed Modules (MVP Core) ✅

### 1.1 Core Infrastructure
- [x] Timezone-aware availability and booking logic.
- [x] Multi-tenant isolation (SalonId middleware).
- [x] Global error handling with 5xx sanitization.
- [x] Real ZarinPal payment integration (v4).
- [x] Idempotency middleware for critical endpoints.

### 1.2 Business Modules
- [x] **Bookings**: Create, Update, Cancel, Complete, No-show.
- [x] **Availability**: Shift-based slot calculation.
- [x] **Customers (CRM)**: Global account and salon-specific profiles.
- [x] **Settings**: Salon configuration, work hours, and online booking toggles.
- [x] **Reviews**: Public submissions and moderation.
- [x] **CMS**: Page builder, SEO metadata, and Media management (uploads/resizing).

---

## 2. High Priority Remaining Tasks (Stabilization) 🚀

### 2.1 Audit Logging (Security & Accountability)
- [ ] **Prisma Schema Update**: Add `AuditLog` model to track `actorId`, `action`, `entity`, `entityId`, `oldData`, `newData`.
- [ ] **AuditService**: Implement a centralized service to record sensitive events.
- [ ] **Instrumentation**:
    - [ ] Log booking cancellations and manual price overrides.
    - [ ] Log staff role changes and access modifications.
    - [ ] Log salon settings and payment policy changes.
- [ ] **API**: `GET /salons/:salonId/audit-logs` (Restricted to MANAGER).

### 2.2 Notification Service (Real SMS)
- [ ] **Environment Setup**: Configure `SMSIR_API_KEY` and `SMSIR_LINE_NUMBER`.
- [ ] **SmsService Implementation**: Replace mocks with real calls to `smsir-js`.
- [ ] **Template Management**: Define and map Template IDs for:
    - [ ] OTP Verification.
    - [ ] Booking Confirmation (Customer & Staff).
    - [ ] Booking Cancellation.
    - [ ] Appointment Reminders (scheduled tasks).
- [ ] **Notification Orcherstration**: Create `NotificationService` to handle multi-channel logic (SMS, later WhatsApp/Email).

### 2.3 Analytics & Reporting
- [ ] **AnalyticsService**: Implement aggregation logic for business metrics.
- [ ] **Revenue Reports**:
    - [ ] Total revenue summary (Paid vs. Pending).
    - [ ] Revenue by Service category.
    - [ ] Revenue by Staff member.
- [ ] **Performance Metrics**:
    - [ ] Staff booking completion vs. cancellation rates.
    - [ ] Staff average rating from reviews.
- [ ] **Endpoints**:
    - [ ] `GET /salons/:salonId/analytics/summary`
    - [ ] `GET /salons/:salonId/analytics/revenue`
    - [ ] `GET /salons/:salonId/analytics/staff`

---

## 3. Quality Assurance & Testing 🧪

### 3.1 Test Coverage
- [ ] **Unit Tests**:
    - [ ] Increase coverage for `CommissionsService` (calculation edge cases).
    - [ ] Add tests for `AnalyticsService` data aggregations.
- [ ] **E2E Tests**:
    - [ ] Full lifecycle: Public Booking -> Payment -> Webhook -> Commission -> Completion.
    - [ ] Audit log verification for sensitive actions.
    - [ ] Multi-tenant data leakage prevention tests.

### 3.2 CI/CD Improvements
- [ ] Resolve Docker-in-Docker permission issues for Prisma migrations in CI.
- [ ] Implement automated code coverage reporting.

---

## 4. Post-MVP (Phase 2) 🛠️
- [ ] **WhatsApp Integration**: Official API integration for richer notifications.
- [ ] **Inventory Management**: Track salon products and stock levels.
- [ ] **Mobile App**: PWA or Native app for staff management.
- [ ] **Advanced SEO**: Automated sitemap generation and schema.org enhancements.

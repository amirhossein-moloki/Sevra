# Sevra API Implementation TODO List

This document outlines the necessary steps to reach the Minimum Viable Product (MVP) for the Sevra API, based on the initial analysis. The tasks are organized by priority to ensure a structured and dependency-aware development process.

---

## Priority 1: Infrastructure & Core Auth

These are the absolute prerequisites for any other feature.

### 1.1: Core Infrastructure
- [x] Implement and register global `errorHandler` middleware.
- [x] Implement and register `responseEnvelope` middleware.
- [ ] Implement and register `validate` (Zod) middleware.
- [ ] Implement and register `rateLimit` middleware.
- [ ] Configure and integrate `logger` (Pino).

### 1.2: Authentication Module
- [ ] Implement `login` logic in `auth.service.ts` (password hashing, JWT generation).
- [ ] Implement `refreshToken` rotation logic with `Session` management in the database.
- [ ] Implement `logout` logic (session revocation).
- [ ] Implement `me` endpoint logic to get the current user's profile.
- [ ] Implement `auth.controller.ts` to handle HTTP requests for all auth endpoints.
- [ ] Create and register `auth.routes.ts` in the main application router.

### 1.3: Security Middleware
- [ ] Implement `auth` middleware to verify JWT and attach the user to the request object.
- [ ] Implement `tenantGuard` middleware to enforce `salonId` access control on all relevant routes.

### 1.4: Testing Foundation
- [ ] Install and configure Jest & Supertest for End-to-End (E2E) testing.
- [ ] Write E2E tests for all Auth endpoints (`/login`, `/refresh`, `/logout`, `/me`) to cover success and failure scenarios.

---

## Priority 2: Core Salon Management

With auth in place, we can now build the core features for managing a salon.

### 2.1: Services Module
- [ ] Implement full CRUD (Create, Read, Update, Delete) for Services.
- [ ] Ensure all service routes are protected by `auth` and `tenantGuard` middleware.
- [ ] Write E2E tests for the Services module CRUD operations.

### 2.2: Users/Staff Module
- [ ] Implement endpoints to list, create, and edit staff members.
- [ ] Implement `requireRole('MANAGER')` middleware for user creation/editing routes.
- [ ] Write E2E tests for the Users module.

### 2.3: Shifts Module
- [ ] Implement `PUT /users/{userId}/shifts` endpoint to upsert (create or update) weekly shifts for a staff member.
- [ ] Write E2E tests for the Shifts module.

---

## Priority 3: Booking Core

The main functionality of the application.

### 3.1: Availability Module
- [ ] Implement the `GET /availability/slots` service and endpoint.
- [ ] Ensure timezone calculations are handled correctly based on `salon.settings.timeZone`.
- [ ] Write E2E tests for availability logic with various scenarios (considering shifts, existing bookings, and service durations).

### 3.2: Bookings Module (Panel)
- [ ] Implement `POST /bookings` to create a new booking from the admin panel.
- [ ] **Crucial:** Implement booking overlap check within a database transaction to prevent race conditions.
- [ ] Implement other booking management endpoints (`GET`, `PATCH`, `cancel`, `complete`, `no-show`).
- [ ] Write E2E tests for creating bookings (including overlap prevention) and changing booking statuses.

---

## Priority 4: Public Flow & Payments

Opening up the system for online customers.

### 4.1: Public Booking Module
- [ ] Implement public-facing endpoints (`GET /public/.../services`, `GET /public/.../availability`).
- [ ] Implement `POST /public/.../bookings` for online booking.
- [ ] **Crucial:** Implement `Idempotency-Key` handling for the online booking endpoint to prevent duplicate bookings.
- [ ] Write E2E tests for the entire public booking flow.

### 4.2: Payments Module
- [ ] Implement `POST /bookings/{bookingId}/payments` endpoint.
- [ ] Implement the logic to update `Booking.paymentState` atomically after a payment is recorded.
- [ ] Write E2E tests for recording payments and verifying the `paymentState` update.

---

## Priority 5: Secondary Features (Post-MVP)

These features can be developed after the core MVP is stable.

- [ ] Customers Module (CRM)
- [ ] Reviews Module
- [ ] Commission Module
- [ ] CMS / Site Builder Module

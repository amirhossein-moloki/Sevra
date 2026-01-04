# E2E Test Scenarios

This document outlines the critical end-to-end testing scenarios for the application.

## 1. Tenant Isolation

These tests ensure that a user from one salon cannot access, modify, or view resources belonging to another salon. All such attempts should result in a `404 Not Found` error.

- **[Covered]** A `MANAGER` from Salon A cannot list staff, services, or bookings from Salon B.
- **[Covered]** A `RECEPTIONIST` from Salon A cannot create a booking in Salon B.
- **[Covered]** A `STAFF` member from Salon A cannot view their own bookings by hitting an endpoint for Salon B.

## 2. Role-Based Access Control (RBAC)

These tests verify that each user role (`MANAGER`, `RECEPTIONIST`, `STAFF`) has the correct permissions.

### Manager-Only Routes

- **[Covered]** A `MANAGER` can create, update, and delete staff members (`/salons/:salonId/staff`).
- **[To be implemented]** A `RECEPTIONIST` attempting to create a staff member receives a `403 Forbidden` error.
- **[To be implemented]** A `STAFF` member attempting to update a staff member receives a `403 Forbidden` error.
- **[Covered]** A `MANAGER` can create, update, and delete services (`/salons/:salonId/services`).
- **[To be implemented]** A `RECEPTIONIST` attempting to create a service receives a `403 Forbidden` error.

### Receptionist and Manager Routes

- **[Covered]** Both `MANAGER` and `RECEPTIONIST` can create, view, update, and cancel bookings.
- **[To be implemented]** A `STAFF` member attempting to create a booking for another staff member receives a `403 Forbidden` error.

### Staff Restrictions

- **[Covered]** A `STAFF` member can list and view their own bookings.
- **[To be implemented]** A `STAFF` member attempting to view the booking list with a `staffId` query parameter for another staff member should only receive their own bookings.

## 3. Core Flows

### Auth

- **[TODO]** Implement tests for user login and the `/auth/me` endpoint to verify token generation and user resolution. Currently, tokens are generated manually in tests.

### Services

- **[Covered]** A `MANAGER` can create a new service.
- **[Covered]** All authenticated salon users can list services.
- **[Covered]** A `MANAGER` can update a service.
- **[Covered]** The public can list active services via the public route (`/public/salons/:salonSlug/services`).

### Staff

- **[Covered]** A `MANAGER` can create a new staff member.
- **[Covered]** All authenticated salon users can list staff members.
- **[To be implemented]** A `RECEPTIONIST` cannot create a new staff member.

### Bookings (Panel)

- **[Covered]** A `MANAGER` or `RECEPTIONIST` can create a booking.
- **[Covered]** All authenticated salon users can list bookings (with staff restrictions applied).
- **[To be implemented]** A `MANAGER` or `RECEPTIONIST` can cancel a booking.
- **[To be implemented]** Attempting to cancel an already canceled booking results in a `409 Conflict` error.

### Public Bookings

- **[Covered]** A public user can create a booking for an available time slot.
- **[Covered]** Idempotency key prevents duplicate public bookings.

## 4. Payments and Webhooks

- **[TODO]** The payment initiation flow is not fully implemented in the routes. Tests cannot be written until the endpoint to start a payment for a booking exists.
- **[To be implemented]** A simulated successful payment webhook updates the booking's `paymentState` to `PAID`.
- **[To be implemented]** A simulated failed payment webhook updates the booking's `paymentState` to `FAILED`.
- **[TODO]** A test for the refund path should be added once refund-related endpoints are implemented. A placeholder test asserting a 404 should be created in the meantime.

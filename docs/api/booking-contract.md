# Sevra Booking API Contract (P1.1 - Feature Freeze)

This document defines the official API contract for the Booking MVP. It is the single source of truth for Backend, Frontend, and QA teams. All behavior described herein is locked for this phase.

_This document is auto-generated and maintained by the Principal Backend Architect._

### Table of Contents
1.  [Standard Response Envelope](#standard-response-envelope)
2.  [Standard Error Format](#standard-error-format)
3.  [Authentication & Authorization](#authentication--authorization)
4.  [Standard Pagination, Filtering & Sorting](#standard-pagination-filtering--sorting)
5.  [Idempotency](#idempotency)
6.  [HTTP Status Codes](#http-status-codes)
7.  [Booking API Contract (MVP)](#booking-api-contract-mvp)
    *   [Booking State Machine](#booking-state-machine)
    *   [Panel Endpoints](#panel-endpoints)
    *   [Public Endpoints](#public-endpoints)
8.  [Acceptance Criteria (P1.1 Feature Freeze)](#acceptance-criteria-p11-feature-freeze)

---

### Standard Response Envelope

All successful `2xx` responses **MUST** conform to the following JSON envelope structure.

```json
{
  "success": true,
  "data": {
    // The primary resource object or array of objects
  },
  "meta": {
    // Optional metadata, required for paginated lists
  }
}
```

*   **`success`**: `boolean` - Always `true` for `2xx` responses.
*   **`data`**: `object | array` - The main payload of the response. For single resource endpoints (e.g., `GET /resource/{id}`), this will be a JSON object. For list endpoints (e.g., `GET /resource`), this will be a JSON array.
*   **`meta`**: `object | null` - Contains supplementary information. For paginated responses, this is **required** and must contain pagination details. Otherwise, it can be `null`.

**Example: Get Single Booking**
```json
{
  "success": true,
  "data": {
    "id": "cuid_123",
    "status": "CONFIRMED",
    "startAt": "2024-10-27T10:00:00.000Z"
    // ... other booking fields
  },
  "meta": null
}
```

**Example: List Bookings (Paginated)**
```json
{
  "success": true,
  "data": [
    { "id": "cuid_123", "status": "CONFIRMED", "..." },
    { "id": "cuid_124", "status": "PENDING", "..." }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalPages": 5,
    "totalItems": 98
  }
}
```

---

### Standard Error Format

All error responses (`4xx` and `5xx`) **MUST** conform to the following JSON structure.

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The provided data was invalid.",
    "details": [
      {
        "field": "customer.fullName",
        "message": "Customer name is required"
      }
    ]
  }
}
```

*   **`success`**: `boolean` - Always `false` for error responses.
*   **`error`**: `object`
    *   **`code`**: `string` - A stable, machine-readable error code (e.g., `NOT_FOUND`, `INVALID_TRANSITION`, `OVERLAP_CONFLICT`).
    *   **`message`**: `string` - A developer-friendly, concise error message.
    *   **`details`**: `array | null` - Optional. Provides field-specific validation errors or other structured context.

---

### Authentication & Authorization

*   **Panel APIs** (e.g., `/api/v1/salons/{salonId}/...`) are **authenticated** and **role-based**.
    *   A valid JWT `access_token` **MUST** be sent in the `Authorization` header: `Authorization: Bearer <token>`.
    *   Requests without a valid token will receive a `401 Unauthorized`.
    *   Users attempting actions outside their allowed roles (e.g., `STAFF` trying to confirm a booking) will receive a `403 Forbidden`.
*   **Public APIs** (e.g., `/api/v1/public/salons/{salonSlug}/...`) are **unauthenticated**. They may be subject to stricter rate limiting.

---

### Standard Pagination, Filtering & Sorting

This standard **MUST** be applied to all list-based endpoints, including `GET /api/v1/salons/{salonId}/bookings`.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `page` | `integer` | No | `1` | The page number to retrieve. |
| `pageSize` | `integer` | No | `20` | The number of items per page. Min: `1`, Max: `100`. |
| `sortBy` | `string` | No | `startAt` | The field to sort the results by. |
| `sortOrder`| `string` | No | `asc` | The sort order. Allowed: `asc`, `desc`. |

#### Filtering for Bookings

Filters are applied via query parameters.

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `status` | `string` | Filter by booking status. Allowed values: `PENDING`, `CONFIRMED`, `DONE`, `CANCELED`, `NO_SHOW`. |
| `staffId` | `string` | Filter by the assigned staff member's CUID. |
| `customerProfileId`| `string` | Filter by the customer's salon-specific profile CUID. |
| `dateFrom` | `string` | ISO 8601 UTC date string. Return bookings starting on or after this date. |
| `dateTo` | `string` | ISO 8601 UTC date string. Return bookings starting before this date. |

#### Response `meta` Object

The `meta` object in the response envelope for paginated lists **MUST** contain:

*   `page`: `integer` - The current page number.
*   `pageSize`: `integer` - The number of items requested per page.
*   `totalPages`: `integer` - The total number of pages available.
*   `totalItems`: `integer` - The total number of items matching the query.

---

### Idempotency

For critical, state-changing operations (especially those initiated by a client that may retry, like online booking), idempotency is guaranteed via the `Idempotency-Key` header.

*   **Endpoints**:
    *   `POST /api/v1/public/salons/{salonSlug}/bookings` (Mandatory)
    *   `POST /api/v1/salons/{salonId}/bookings` (Optional but recommended)
*   **Header**: `Idempotency-Key: <unique-key>`
*   **Behavior**:
    1.  The first time a request is received with a given key, the server processes it and stores the result (the HTTP status code and response body).
    2.  Subsequent requests with the same key within the TTL will **not** be re-processed. The server will immediately return the stored response.
*   **Scope**: The key's uniqueness is scoped **per salon per endpoint**.
*   **TTL (Time-To-Live)**: The stored result is guaranteed for **24 hours**.

---

### HTTP Status Codes

| Code | Status | Meaning |
| :--- | :--- | :--- |
| `200` | OK | The request was successful (e.g., `GET`, `PATCH`). |
| `201` | Created | The resource was successfully created (e.g., `POST`). |
| `400` | Bad Request | Validation error. Check the `error.details` array. |
| `401` | Unauthorized| Missing or invalid authentication token. |
| `403` | Forbidden | Authenticated user lacks permission for the action. |
| `404` | Not Found | The requested resource does not exist. |
| `409` | Conflict | The request conflicts with the current state (e.g., booking overlap, invalid state transition). |
| `429` | Too Many Requests | Rate limit exceeded. |
| `500` | Internal Server Error | A generic, unexpected server error occurred. |

---

## Booking API Contract (MVP)

### Booking State Machine

This defines the lifecycle of a booking. All state transitions **MUST** adhere to these rules.

#### States
*   **`PENDING`**: Awaiting confirmation. The time slot is reserved but not yet final.
*   **`CONFIRMED`**: The booking is final. This is the default state for panel-created bookings.
*   **`DONE`**: The service has been completed for the customer.
*   **`CANCELED`**: The booking was canceled by either the salon or the customer.
*   **`NO_SHOW`**: The customer did not show up for their confirmed appointment.

**Terminal States**: `DONE`, `CANCELED`, `NO_SHOW`. A booking in a terminal state cannot be changed further.

#### State Transition Table

| Current State | Action / Trigger Endpoint | Next State | Allowed Roles | Error If Invalid |
| :--- | :--- | :--- | :--- | :--- |
| `(new)` | `POST /bookings` (Panel) | `CONFIRMED` | `MANAGER`, `RECEPTIONIST` | `409 OVERLAP_CONFLICT` |
| `(new)` | `POST /bookings` (Public, auto-confirm) | `CONFIRMED` | `Public` | `409 OVERLAP_CONFLICT` |
| `(new)` | `POST /bookings` (Public, manual-confirm) | `PENDING` | `Public` | `409 OVERLAP_CONFLICT` |
| `PENDING` | `POST /{id}/confirm` | `CONFIRMED` | `MANAGER`, `RECEPTIONIST` | `409 INVALID_TRANSITION` |
| `PENDING` | `POST /{id}/cancel` | `CANCELED` | `MANAGER`, `RECEPTIONIST` | `409 INVALID_TRANSITION` |
| `CONFIRMED`| `POST /{id}/complete`| `DONE` | `MANAGER`, `RECEPTIONIST` | `409 INVALID_TRANSITION` |
| `CONFIRMED`| `POST /{id}/no-show`| `NO_SHOW` | `MANAGER`, `RECEPTIONIST` | `409 INVALID_TRANSITION` |
| `CONFIRMED`| `POST /{id}/cancel` | `CANCELED` | `MANAGER`, `RECEPTIONIST` | `409 INVALID_TRANSITION` |
| `ANY` | `PATCH /{id}` (Update details) | `(no change)` | `MANAGER`, `RECEPTIONIST` | `409` if changing terminal state |

#### Business Rule Guards

1.  **Overlap Prevention**: If the salon setting `preventOverlaps` is `true`, the system **MUST** reject any new booking (`POST /bookings`) or update (`PATCH /bookings/{id}`) that causes a time collision for the same staff member. A `409 Conflict` with `error.code: "OVERLAP_CONFLICT"` will be returned.
2.  **Online Booking Gate**: If a salon's `allowOnlineBooking` setting is `false`, any request to `POST /public/salons/{slug}/bookings` **MUST** be rejected with a `403 Forbidden` and `error.code: "ONLINE_BOOKING_DISABLED"`.
3.  **Auto-Confirm Logic**: For `POST /public/salons/{slug}/bookings`, if the salon setting `onlineBookingAutoConfirm` is `true`, the newly created booking's status will be `CONFIRMED`. Otherwise, it will be `PENDING`.

---

### Panel Endpoints

Base Path: `/api/v1/salons/{salonId}`

#### 1. Create Booking
*   **`POST /bookings`**
*   **Auth**: Required (`MANAGER`, `RECEPTIONIST`)
*   **Request Body**:
    ```json
    {
      "customer": {
        "fullName": "Sara Example",
        "phone": "+989121234567",
        "email": "sara@example.com"
      },
      "serviceId": "cuid_def",
      "staffId": "cuid_ghi",
      "startAt": "2024-10-27T10:00:00.000Z",
      "note": "Optional client note."
    }
    ```
*   **Success Response**: `201 Created` with the full booking object in `data`.
*   **Error Cases**:
    *   `400 VALIDATION_ERROR`: Missing or invalid fields.
    *   `404 NOT_FOUND`: `serviceId` or `staffId` does not exist.
    *   `409 OVERLAP_CONFLICT`: Booking overlaps with another for the same staff member.

#### 2. List Bookings
*   **`GET /bookings`**
*   **Auth**: Required (`MANAGER`, `RECEPTIONIST`, `STAFF`)
*   **Query Params**: See [Standard Pagination/Filtering](#standard-pagination-filtering--sorting).
*   **Success Response**: `200 OK` with an array of booking objects in `data` and pagination info in `meta`.
*   **Error Cases**:
    *   `400 VALIDATION_ERROR`: Invalid filter or pagination parameters.

#### 3. Get Booking by ID
*   **`GET /bookings/{bookingId}`**
*   **Auth**: Required (`MANAGER`, `RECEPTIONIST`, `STAFF`)
*   **Success Response**: `200 OK` with the full booking object in `data`.
*   **Error Cases**:
    *   `404 NOT_FOUND`: No booking with the given ID exists in the salon.

#### 4. Update Booking Details
*   **`PATCH /bookings/{bookingId}`**
*   **Auth**: Required (`MANAGER`, `RECEPTIONIST`)
*   **Request Body** (all fields are optional):
    ```json
    {
      "serviceId": "cuid_new_service",
      "staffId": "cuid_new_staff",
      "startAt": "2024-10-27T11:00:00.000Z",
      "note": "Updated note."
    }
    ```
*   **Success Response**: `200 OK` with the updated booking object.
*   **Error Cases**:
    *   `404 NOT_FOUND`: Booking not found.
    *   `409 OVERLAP_CONFLICT`: The update causes an overlap.
    *   `409 INVALID_TRANSITION`: Attempting to update a booking in a terminal state.

#### 5. Confirm Booking
*   **`POST /bookings/{bookingId}/confirm`**
*   **Auth**: Required (`MANAGER`, `RECEPTIONIST`)
*   **Success Response**: `200 OK` with the updated booking object (`status: "CONFIRMED"`).
*   **Error Cases**:
    *   `404 NOT_FOUND`: Booking not found.
    *   `409 INVALID_TRANSITION`: Booking is not in `PENDING` state.

#### 6. Cancel Booking
*   **`POST /bookings/{bookingId}/cancel`**
*   **Auth**: Required (`MANAGER`, `RECEPTIONIST`)
*   **Request Body**:
    ```json
    {
      "reason": "Optional cancellation reason."
    }
    ```
*   **Success Response**: `200 OK` with the updated booking object (`status: "CANCELED"`).
*   **Error Cases**:
    *   `404 NOT_FOUND`: Booking not found.
    *   `409 INVALID_TRANSITION`: Booking is already in a terminal state.

#### 7. Complete Booking
*   **`POST /bookings/{bookingId}/complete`**
*   **Auth**: Required (`MANAGER`, `RECEPTIONIST`)
*   **Success Response**: `200 OK` with the updated booking object (`status: "DONE"`).
*   **Error Cases**:
    *   `404 NOT_FOUND`: Booking not found.
    *   `409 INVALID_TRANSITION`: Booking is not in `CONFIRMED` state.

#### 8. Mark as No-Show
*   **`POST /bookings/{bookingId}/no-show`**
*   **Auth**: Required (`MANAGER`, `RECEPTIONIST`)
*   **Success Response**: `200 OK` with the updated booking object (`status: "NO_SHOW"`).
*   **Error Cases**:
    *   `404 NOT_FOUND`: Booking not found.
    *   `409 INVALID_TRANSITION`: Booking is not in `CONFIRMED` state.

---

### Public Endpoints

Base Path: `/api/v1/public/salons/{salonSlug}`

#### 1. Create Online Booking
*   **`POST /bookings`**
*   **Auth**: Public
*   **Headers**:
    *   `Idempotency-Key`: `string` (Required)
*   **Request Body**:
    ```json
    {
      "customer": {
        "fullName": "John Doe",
        "phone": "09123456789"
      },
      "serviceId": "cuid_service_abc",
      "staffId": "cuid_staff_def",
      "startAt": "2024-11-05T14:00:00.000Z",
      "note": "Optional note from customer."
    }
    ```
*   **Behavior**: The system will find a `CustomerAccount` by phone or create a new one, then create a `SalonCustomerProfile` if one doesn't exist, before creating the booking.
*   **Success Response**: `201 Created` with the full booking object. The status will be `PENDING` or `CONFIRMED` based on salon settings.
*   **Error Cases**:
    *   `400 VALIDATION_ERROR`: Invalid request body.
    *   `403 ONLINE_BOOKING_DISABLED`: Salon does not allow online bookings.
    *   `404 NOT_FOUND`: `salonSlug`, `serviceId`, or `staffId` is invalid.
    *   `409 OVERLAP_CONFLICT`: The requested time slot is no longer available.

---

### Acceptance Criteria (P1.1 Feature Freeze)

The "Booking MVP" feature freeze is considered complete if and only if:
1.  ✅ All Panel and Public endpoints defined in this contract are implemented.
2.  ✅ All endpoint responses strictly adhere to the `Standard Response Envelope`.
3.  ✅ All endpoint errors strictly adhere to the `Standard Error Format` with the correct error codes.
4.  ✅ The Booking State Machine transitions and guards are implemented as defined.
5.  ✅ The Standard Pagination, Filtering, and Sorting logic is fully functional for the `GET /bookings` endpoint.
6.  ✅ The Idempotency contract is fully implemented and verifiable for the public booking endpoint.
7.  ✅ This document, `booking-contract.md`, is considered the locked and final source of truth, and no further functional changes are made without a formal RFC.

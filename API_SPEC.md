# C) REST API Specification

This document outlines the design for the Sevra REST API. It is based on the findings from the Project Audit and follows professional RESTful principles to ensure the API is scalable, consistent, and easy to use.

---

### 1) General Standards

#### 1.1 Base URL & Versioning

The API will be versioned to allow for future iterations without breaking client integrations.

- **Base URL**: `/api/v1`
- **Example**: `https://yourdomain.com/api/v1/salons`

#### 1.2 Resource Naming Conventions

- **Plural Nouns**: Resources are represented by plural nouns (e.g., `/salons`, `/bookings`).
- **Case**: `kebab-case` is used for URLs. `camelCase` is used for JSON object keys.

#### 1.3 Standard Response Envelope

All successful responses (`2xx`) will be wrapped in a `data` object. This provides a consistent and predictable structure for clients.

```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "name": "Glamour Salon"
  }
}
```

For collections, the `data` field will be an array. Metadata for pagination will be included at the top level.

```json
{
  "success": true,
  "data": [
    { "id": "clx...", "name": "Glamour Salon" },
    { "id": "cly...", "name": "Modern Cuts" }
  ],
  "meta": {
    "totalItems": 2,
    "currentPage": 1,
    "pageSize": 10,
    "totalPages": 1
  }
}
```

#### 1.4 Standard Error Format

All error responses (`4xx`, `5xx`) will use the standardized format defined in the existing `errorHandler.ts`. This ensures consistency for error handling on the client side.

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request payload",
    "details": [
      {
        "path": ["phone"],
        "message": "Phone number is required"
      }
    ]
  },
  "meta": {
    "requestId": "uuid-goes-here"
  }
}
```

#### 1.5 Filtering, Sorting, and Pagination

- **Filtering**: `?field=value` (e.g., `?status=CONFIRMED`).
- **Sorting**: `?sortBy=field&sortOrder=asc|desc` (e.g., `?sortBy=createdAt&sortOrder=desc`).
- **Pagination**: `?page=1&pageSize=20`.

#### 1.6 Idempotency

For critical `POST` operations that could result in duplicate records if retried (e.g., creating a payment), clients can provide an `Idempotency-Key` header with a unique UUID. The server will recognize and safely handle retried requests with the same key.

### 2) Resources & Endpoints

This section details the API resources. All endpoints are nested under a specific salon via `/salons/{salonId}` to enforce multi-tenancy at the routing level.

---

#### 2.1 Auth (Authentication)

Handles user registration, login, and session management.

| Method | Path                           | Description                     | Auth Required | Roles/Permissions      | Success Status |
| :----- | :----------------------------- | :------------------------------ | :------------ | :--------------------- | :------------- |
| `POST` | `/auth/register`               | Registers a new salon and manager | No            | -                      | `201 Created`  |
| `POST` | `/auth/login`                  | Logs in a user and returns a JWT | No            | -                      | `200 OK`       |
| `POST` | `/auth/logout`                 | Revokes the current session token | Yes           | Any                    | `204 No Content`|
| `GET`  | `/auth/me`                     | Retrieves the current user's profile | Yes           | Any                    | `200 OK`       |

---

#### 2.2 Salons

Manages salon-specific settings and public information.

| Method | Path                           | Description                     | Auth Required | Roles/Permissions      | Success Status |
| :----- | :----------------------------- | :------------------------------ | :------------ | :--------------------- | :------------- |
| `GET`  | `/salons/{salonId}`            | Get public details of a salon   | No            | -                      | `200 OK`       |
| `PUT`  | `/salons/{salonId}`            | Update salon details            | Yes           | `MANAGER`              | `200 OK`       |
| `GET`  | `/salons/{salonId}/settings`   | Get salon settings              | Yes           | `MANAGER`, `RECEPTIONIST` | `200 OK`       |
| `PUT`  | `/salons/{salonId}/settings`   | Update salon settings           | Yes           | `MANAGER`              | `200 OK`       |

---

#### 2.3 Users (Staff)

Manages staff members within a salon.

| Method | Path                           | Description                     | Auth Required | Roles/Permissions      | Success Status |
| :----- | :----------------------------- | :------------------------------ | :------------ | :--------------------- | :------------- |
| `POST` | `/salons/{salonId}/users`      | Create a new staff member       | Yes           | `MANAGER`              | `201 Created`  |
| `GET`  | `/salons/{salonId}/users`      | List all staff members          | Yes           | `MANAGER`, `RECEPTIONIST` | `200 OK`       |
| `GET`  | `/salons/{salonId}/users/{userId}` | Get details of a staff member   | Yes           | `MANAGER`, `RECEPTIONIST` | `200 OK`       |
| `PUT`  | `/salons/{salonId}/users/{userId}` | Update a staff member's details | Yes           | `MANAGER`              | `200 OK`       |
| `DELETE`| `/salons/{salonId}/users/{userId}`| Deactivate a staff member     | Yes           | `MANAGER`              | `204 No Content`|

---

#### 2.4 Services

Manages the services offered by a salon.

| Method | Path                           | Description                     | Auth Required | Roles/Permissions      | Success Status |
| :----- | :----------------------------- | :------------------------------ | :------------ | :--------------------- | :------------- |
| `POST` | `/salons/{salonId}/services`   | Create a new service            | Yes           | `MANAGER`              | `201 Created`  |
| `GET`  | `/salons/{salonId}/services`   | List all services               | No (Public)   | -                      | `200 OK`       |
| `GET`  | `/salons/{salonId}/services/{serviceId}` | Get details of a service      | No (Public)   | -                      | `200 OK`       |
| `PUT`  | `/salons/{salonId}/services/{serviceId}` | Update a service's details    | Yes           | `MANAGER`              | `200 OK`       |
| `DELETE`| `/salons/{salonId}/services/{serviceId}`| Deactivate a service          | Yes           | `MANAGER`              | `204 No Content`|

---

#### 2.5 Customers (CRM)

Manages the salon's customer profiles.

| Method | Path                              | Description                     | Auth Required | Roles/Permissions      | Success Status |
| :----- | :-------------------------------- | :------------------------------ | :------------ | :--------------------- | :------------- |
| `POST` | `/salons/{salonId}/customers`     | Create a new customer profile   | Yes           | `MANAGER`, `RECEPTIONIST` | `201 Created`  |
| `GET`  | `/salons/{salonId}/customers`     | List all customers              | Yes           | `MANAGER`, `RECEPTIONIST` | `200 OK`       |
| `GET`  | `/salons/{salonId}/customers/{customerId}` | Get a customer's details    | Yes           | `MANAGER`, `RECEPTIONIST` | `200 OK`       |
| `PUT`  | `/salons/{salonId}/customers/{customerId}` | Update a customer's details | Yes           | `MANAGER`, `RECEPTIONIST` | `200 OK`       |

---

#### 2.6 Bookings

Manages appointments.

| Method | Path                           | Description                     | Auth Required | Roles/Permissions      | Success Status |
| :----- | :----------------------------- | :------------------------------ | :------------ | :--------------------- | :------------- |
| `POST` | `/salons/{salonId}/bookings`   | Create a new booking            | Yes           | `MANAGER`, `RECEPTIONIST` | `201 Created`  |
| `GET`  | `/salons/{salonId}/bookings`   | List all bookings (with filters)| Yes           | `MANAGER`, `RECEPTIONIST`, `STAFF` (own) | `200 OK`       |
| `GET`  | `/salons/{salonId}/bookings/{bookingId}` | Get details of a booking    | Yes           | `MANAGER`, `RECEPTIONIST`, `STAFF` (own) | `200 OK`       |
| `PUT`  | `/salons/{salonId}/bookings/{bookingId}` | Update a booking (e.g., reschedule) | Yes           | `MANAGER`, `RECEPTIONIST` | `200 OK`       |
| `POST`| `/salons/{salonId}/bookings/{bookingId}/cancel`| Cancel a booking              | Yes           | `MANAGER`, `RECEPTIONIST` | `200 OK`       |
| `POST`| `/salons/{salonId}/bookings/{bookingId}/confirm`| Confirm a booking             | Yes           | `MANAGER`, `RECEPTIONIST` | `200 OK`       |


### 3) Data Models & DTOs (Data Transfer Objects)

This section provides examples of the JSON payloads for requests and responses. Validation rules are included as comments.

#### 3.1 `User` DTO

Represents a staff member.

```json
// Response: GET /salons/{salonId}/users/{userId}
{
  "id": "cuid...",
  "fullName": "Jane Doe",
  "phone": "09123456789",
  "role": "STAFF", // enum: MANAGER | RECEPTIONIST | STAFF
  "isActive": true,
  "isPublic": true,
  "publicName": "Jane D.",
  "bio": "Expert stylist with 10 years of experience.",
  "createdAt": "2023-10-27T10:00:00Z"
}

// Request: POST /salons/{salonId}/users
{
  "fullName": "John Smith",        // required, string, min:3
  "phone": "09121112233",         // required, string, valid Iranian phone number
  "password": "strongPassword123", // required, string, min:8
  "role": "RECEPTIONIST"           // required, enum
}
```

#### 3.2 `Booking` DTO

Represents an appointment.

```json
// Response: GET /salons/{salonId}/bookings/{bookingId}
{
  "id": "cuid...",
  "startAt": "2023-11-15T14:00:00Z",
  "endAt": "2023-11-15T15:00:00Z",
  "status": "CONFIRMED", // enum: PENDING | CONFIRMED | ...
  "paymentState": "PAID", // enum: UNPAID | PAID | ...
  "service": {
    "id": "cuid...",
    "name": "Haircut"
  },
  "staff": {
    "id": "cuid...",
    "fullName": "Jane Doe"
  },
  "customer": {
    "id": "cuid...",
    "displayName": "Client Name"
  }
}

// Request: POST /salons/{salonId}/bookings
{
  "serviceId": "cuid...",       // required, cuid
  "staffId": "cuid...",         // required, cuid
  "customerProfileId": "cuid...", // required, cuid
  "startAt": "2023-11-15T14:00:00Z" // required, ISO 8601 datetime string
}
```

---

### 4) AuthN/AuthZ (Authentication & Authorization)

#### 4.1 Authentication

- **Method**: JWT (JSON Web Tokens).
- **Flow**:
    1.  User submits credentials to `POST /auth/login`.
    2.  Server validates credentials and issues a signed JWT with a reasonable expiry (e.g., 15 minutes for an access token, 7 days for a refresh token).
    3.  The token is stored securely on the client (e.g., HttpOnly cookie or secure storage).
    4.  For subsequent requests, the JWT is sent in the `Authorization` header: `Authorization: Bearer <token>`.
- **Token Payload**:
    ```json
    {
      "sessionId": "cuid...", // ID of the Session model
      "userId": "cuid...",
      "salonId": "cuid...",
      "role": "MANAGER",
      "iat": 1678886400,
      "exp": 1678887300
    }
    ```

#### 4.2 Authorization (RBAC)

- **Strategy**: Role-Based Access Control. A middleware will inspect the token on protected routes, verify the user's role, and grant or deny access.
- **Roles**:
    - `MANAGER`: Full control over their salon. Can manage staff, services, settings, and view all bookings.
    - `RECEPTIONIST`: Can manage bookings and customer profiles. Cannot change salon settings or manage staff.
    - `STAFF`: Can only view bookings assigned to them.
- **Ownership**: For actions on specific resources (e.g., a `STAFF` member viewing a booking), the middleware must also check if the resource belongs to them (`booking.staffId === currentUser.id`).

---

### 5) Operational Scenarios & Examples

#### 5.1 Scenario: New Salon Registration

1.  **Request**: `POST /auth/register`
    ```json
    {
      "salonName": "The New Cut",
      "managerFullName": "Alice Johnson",
      "managerPhone": "09129876543",
      "managerPassword": "aVerySecurePassword!"
    }
    ```
2.  **Response**: `201 Created`
    ```json
    {
      "success": true,
      "data": {
        "user": { "...": "..." }, // Manager's user object
        "salon": { "...": "..." }, // New salon object
        "token": "ey..." // JWT
      }
    }
    ```

#### 5.2 Scenario: Staff Creates a Booking

1.  **Context**: A receptionist is logged in.
2.  **Request**: `POST /api/v1/salons/clx.../bookings`
    - **Header**: `Authorization: Bearer <receptionist-jwt>`
    ```json
    {
      "serviceId": "cly...",
      "staffId": "clz...",
      "customerProfileId": "cla...",
      "startAt": "2024-01-05T11:00:00Z"
    }
    ```
3.  **Response**: `201 Created`
    ```json
    {
      "success": true,
      "data": {
        "id": "clnew...",
        "status": "CONFIRMED",
        "startAt": "2024-01-05T11:00:00Z",
        "...": "..."
      }
    }
    ```

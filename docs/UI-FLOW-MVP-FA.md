
# Salon Management Platform – MVP Flows (v0.2)

This document contains the updated user flows aligned with the current MVP scope and database schema.

---

## 6) Customer Flow

```mermaid
flowchart TD
    A["/customers"] --> B["Customer Profile"]
    B --> C["Booking History"]
    B --> D["Create New Booking"]
```

---

## 7) Services Flow

```mermaid
flowchart TD
    A["/services"] --> B["Create New Service"]
    B --> C["Save Service"]
    C --> D["Services List"]
```

---

## 8) Staff Flow

```mermaid
flowchart TD
    A["/staff"] --> B["Create Staff"]
    B --> C["Assign Services + Shifts"]
    C --> D["Staff Profile"]
```

---

## 9) Basic Finance Flow

```mermaid
flowchart TD
    A["Booking Detail"] --> B["Register Payment"]
    B --> C["Update Payment Status"]
```

---

## 10) Dashboard Flow

```mermaid
flowchart TD
    A["/dashboard"] --> B["Today's Bookings"]
    A --> C["Today's Revenue"]
    A --> D["Upcoming Bookings"]
```

---

## 11) UX Guardrails

- Fast customer search by phone number
- Prevent overlapping bookings
- Show only available time slots
- Role-based access control

---

## 12) MVP Starter Pages

- Login
- Dashboard
- Appointments
  - List
  - Calendar
  - New
  - Detail
  - Edit
- Customers
  - List
  - New
  - Detail
  - Edit
- Services
  - List
  - New
  - Edit
- Staff
  - List
  - New
  - Profile
  - Edit
- Finance
  - Overview
  - Daily
  - Monthly
- Settings
  - Salon
  - Working Hours
  - Booking Rules

---

Version: 0.2
Status: MVP – Ready for Implementation


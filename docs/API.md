# API Design (Express Backend)

## Room Management
- `GET /api/rooms/available`: Query available rooms for a date range.
- `GET /api/rooms`: List all rooms (Admin only).
- `POST /api/rooms`: Add new room (Admin only).

## Booking Engine
- `GET /api/bookings`: List bookings.
- `POST /api/bookings`: Create a reservation.

## Guest Profiles
- `GET /api/guests/:id`: Get guest details.

## Billing
- `POST /api/bookings/:id/invoice`: Generate invoice/folio.

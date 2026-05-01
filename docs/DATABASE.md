# HMS Database Schema (PostgreSQL)

```sql
-- Guests
CREATE TABLE guests (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    preferences TEXT
);

-- Rooms
CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    room_number VARCHAR(10) UNIQUE NOT NULL,
    type VARCHAR(50), -- e.g., 'suite', 'standard'
    price_tier DECIMAL(10, 2),
    status VARCHAR(20) DEFAULT 'AVAILABLE' -- AVAILABLE, OCCUPIED, DIRTY, MAINTENANCE
);

-- Bookings
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    guest_id INTEGER REFERENCES guests(id),
    room_id INTEGER REFERENCES rooms(id),
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    total_cost DECIMAL(10, 2),
    status VARCHAR(20) DEFAULT 'CONFIRMED' -- CONFIRMED, CHECKED_IN, CHECKED_OUT, CANCELLED
);

-- Payments
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id),
    amount DECIMAL(10, 2),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(50)
);
```

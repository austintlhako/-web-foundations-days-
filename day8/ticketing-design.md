# TicketHub System Design

## 1. System Requirements

### Functional Requirements
* **Browse:** Users can view a list of upcoming concerts and events.
* **View Seats:** Users can view an interactive seat map showing available, held, and sold seats for a specific event.
* **Hold:** Users can temporarily reserve (hold) available seats for a limited time (e.g., 10 minutes) to complete checkout.
* **Purchase:** Users can pay for held seats and complete the order.
* **View Tickets:** Users can view their purchased tickets and order history.

### Non-Functional Requirements
* **Correctness (Strict Consistency):** The system absolutely must prevent double-booking. Two users cannot purchase the same seat.
* **Fairness:** Seat holds must be processed on a strict first-come, first-serve basis. During high demand, access to the purchase flow must be fair.
* **Speed:** Seat map rendering and event browsing must load quickly (under 200ms).
* **High Availability:** The system must not crash during massive, sudden traffic spikes (ticket drops).

---

## 2. Capacity Estimates

### Normal Traffic
* **Audience:** 50,000 visitors per day.
* **Read Load:** 50,000 visitors × 10 pages = 500,000 page views per day (Average: ~5.8 requests/second).
* **Write Load:** 5,000 tickets sold per day (Average: ~0.06 purchases/second).
* **Summary:** Normal operations represent a highly manageable, read-heavy workload.

### Peak Traffic ("Big Sale" Scenario)
* **Audience:** 200,000 visitors accessing the platform within a 10-minute window for a 20,000-seat arena.
* **Read Load:** Assuming normal browsing behavior, this is roughly 2,000,000 page views in 10 minutes (Peak: ~3,333 requests/second). This is a **575x increase** over normal read traffic.
* **Write Load:** 200,000 people simultaneously attempting to hold and buy 20,000 seats. This creates massive write contention (Peak: ~333 purchase attempts/second, heavily clustered).
* **Summary:** The system must dynamically scale to absorb the 575x read spike while intelligently throttling the massive write contention to protect the database.

---

## 3. API Design

* **List Events**
  * **Method:** `GET /api/events`
  * **Description:** Retrieves upcoming events, supporting pagination and search filters.
  * **Success:** `200 OK`

* **View Event Seats**
  * **Method:** `GET /api/events/:id/seats`
  * **Description:** Returns the real-time status of all seats for a specific event (Available, Held, Booked).
  * **Success:** `200 OK`

* **Hold Seats**
  * **Method:** `POST /api/reservations`
  * **Description:** Attempts to place a temporary 10-minute hold on specific seat IDs.
  * **Request Body:** `{ "event_id": 123, "seat_ids": [45, 46] }`
  * **Success:** `201 Created`
  * **Failure (Seat Taken):** `409 Conflict`

* **Pay & Complete Order**
  * **Method:** `POST /api/orders`
  * **Description:** Processes payment for the currently held seats and finalizes the booking.
  * **Request Body:** `{ "reservation_id": 987, "payment_token": "tok_xyz" }`
  * **Success:** `201 Created`

* **View My Tickets**
  * **Method:** `GET /api/users/:id/tickets`
  * **Description:** Retrieves all finalized tickets belonging to a user.
  * **Success:** `200 OK`

---

## 4. Data Model

The application utilizes a relational database (SQL) to maintain strict transactional integrity.

### Tables & Relationships
* **`users`**
  * `user_id` (PK), `name`, `email`, `password_hash`, `created_at`
* **`events`**
  * `event_id` (PK), `title`, `date`, `venue_name`, `total_seats`
* **`seats`**
  * `seat_id` (PK), `event_id` (FK), `seat_number`, `status` (ENUM: AVAILABLE, HELD, BOOKED), `lock_expiry` (TIMESTAMP)
* **`orders`**
  * `order_id` (PK), `user_id` (FK), `event_id` (FK), `total_price`, `status`, `created_at`

### Relationships
* **1-to-Many:** An `event` has many `seats`.
* **1-to-Many:** A `user` has many `orders`.
* **1-to-Many:** An `order` contains many `seats` (The `seats` table can include an `order_id` FK, or a join table can be used, but updating the seat directly is fastest for booking).

---

## 5. Preventing Double-Booking

To ensure correctness and prevent two users from buying the same seat, TicketHub relies on **Database Transactions** and **Row-Level Locking**.

When a user attempts to hold a seat, the backend executes an atomic SQL transaction:

```sql
BEGIN TRANSACTION;

-- Attempt to claim the seat only if it is currently available or an old hold expired
UPDATE seats 
SET status = 'HELD', user_id = 123, lock_expiry = NOW() + INTERVAL '10 minutes'
WHERE seat_id = 45 
  AND (status = 'AVAILABLE' OR (status = 'HELD' AND lock_expiry < NOW()));

-- Check how many rows were affected. 
-- If 0, someone else got it first. Rollback and return 409 Conflict.
-- If 1, commit the transaction.
COMMIT;
```
Because SQL databases process `UPDATE` statements atomically and lock the targeted rows during execution, even if two requests arrive at the exact same millisecond, the database engine queues them. The first request modifies the status to 'HELD'. The second request evaluates the `WHERE` clause, finds it no longer matches 'AVAILABLE', affects 0 rows, and safely fails, preventing the double-booking.

---

## 6. Architecture Diagram & Components

```text
[ Users ]
    |
    v
[ Content Delivery Network (CDN) ] 
    |
    v
[ Virtual Waiting Room / Edge Gateway ]
    |
    v
[ Load Balancer ]
    |
    +-------------------+-------------------+
    |                   |                   |
[ App Server 1 ]   [ App Server 2 ]   [ App Server 3 ]
    |                   |                   |
    +---------+---------+---------+---------+
              |                   |
        [ Redis Cache ]     [ Primary SQL DB ] 
                                  | (Replication)
                            [ Read Replica DB ]
```

### Component Explanations & Surviving the Big Sale
* **CDN:** Caches static assets (images, venue maps, CSS).
* **Virtual Waiting Room:** **(Crucial for Big Sales)** When 200,000 users arrive instantly, this service acts as a shock absorber. It intercepts traffic before it hits the database, placing users in a queue. It trickles users into the active purchase flow at a rate the database can safely handle (e.g., 500 users per minute), keeping the system online.
* **Load Balancer:** Distributes active traffic across multiple stateless Application Servers.
* **App Servers:** Executes business logic, verifies payment, and manages database transactions.
* **Redis Cache:** Stores event details and the aggregated real-time seat map. Instead of 200,000 users querying the SQL database for seat availability, they query Redis in sub-milliseconds.
* **Primary SQL DB:** Handles all writes (`POST /reservations`, `POST /orders`). Guaranteed strict consistency.
* **Read Replica DB:** Handles read-only queries (like users checking their order history) to reduce CPU load on the Primary DB.

---

## 7. Trade-offs

1. **Strict Consistency vs. Availability:** By relying heavily on SQL row-level locks to prevent double-booking, the database becomes a strict bottleneck. During massive sales, users might experience slow loading times or timeout errors while their request waits for a lock to clear. We chose correctness (no double-booked seats) over high availability.
2. **Virtual Waiting Room vs. Immediate User Feedback:** Throttling users in a waiting room introduces a friction-heavy User Experience (UX). A user might wait 10 minutes only to find out tickets are sold out. The trade-off is sacrificing immediate gratification and UX to ensure system stability and fairness.
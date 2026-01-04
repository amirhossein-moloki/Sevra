-- Enable the btree_gist extension to allow GiST indexing on standard data types
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Add a partial exclusion constraint to prevent overlapping bookings for the same staff and salon
-- The constraint only applies to active booking statuses to allow re-booking over canceled slots
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_no_overlap_active" EXCLUDE USING gist (
  "salonId" WITH =,
  "staffId" WITH =,
  tstzrange("startAt", "endAt") WITH &&
)
WHERE ("status" IN ('PENDING', 'CONFIRMED', 'DONE'));

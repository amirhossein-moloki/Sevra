-- Enable the btree_gist extension to allow GiST indexing on standard data types
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Add the exclusion constraint to the "Booking" table
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_no_overlap_active" EXCLUDE USING gist (
    "salonId" WITH =,
    "staffId" WITH =,
    tsrange("startAt", "endAt", '[)') WITH &&
) WHERE ("status" IN ('PENDING', 'CONFIRMED'));

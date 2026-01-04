CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE INDEX "Booking_salonId_staffId_status_startAt_endAt_idx"
ON "Booking"("salonId", "staffId", "status", "startAt", "endAt");

ALTER TABLE "Booking"
ADD CONSTRAINT "Booking_no_overlap_active"
EXCLUDE USING gist (
  "salonId" WITH =,
  "staffId" WITH =,
  tstzrange("startAt", "endAt", '[)') WITH &&
)
WHERE ("status" IN ('PENDING', 'CONFIRMED'));

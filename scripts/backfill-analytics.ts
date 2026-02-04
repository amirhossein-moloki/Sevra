
import { prisma } from '../src/config/prisma';
import { AnalyticsRepo } from '../src/modules/analytics/analytics.repo';

async function backfill() {
  console.log('Starting backfill of analytics summary tables...');

  // 1. Get all unique (salonId, date) combinations from Bookings
  const bookingDates = await prisma.$queryRaw<any[]>`
    SELECT DISTINCT "salonId", "startAt"::date as date
    FROM "Booking"
  `;

  console.log(`Found ${bookingDates.length} unique salon-date pairs to sync from Bookings.`);

  for (const pair of bookingDates) {
    const date = new Date(pair.date);
    console.log(`Syncing stats for Salon: ${pair.salonId} on Date: ${pair.date}`);
    await AnalyticsRepo.syncSalonStats(pair.salonId, date);

    // Sync for each staff on that date
    const staffIds = await prisma.$queryRaw<any[]>`
      SELECT DISTINCT "staffId" FROM "Booking"
      WHERE "salonId" = ${pair.salonId} AND "startAt"::date = ${pair.date}::date
    `;
    for (const s of staffIds) {
      await AnalyticsRepo.syncStaffStats(pair.salonId, s.staffId, date);
    }

    // Sync for each service on that date
    const serviceIds = await prisma.$queryRaw<any[]>`
      SELECT DISTINCT "serviceId" FROM "Booking"
      WHERE "salonId" = ${pair.salonId} AND "startAt"::date = ${pair.date}::date
    `;
    for (const s of serviceIds) {
      await AnalyticsRepo.syncServiceStats(pair.salonId, s.serviceId, date);
    }
  }

  // 2. Also handle payments that might be on different dates than bookings
  const paymentDates = await prisma.$queryRaw<any[]>`
    SELECT DISTINCT "salonId", "paidAt"::date as date
    FROM "Payment"
    WHERE "status" = 'PAID' AND "paidAt" IS NOT NULL
  `;

  console.log(`Found ${paymentDates.length} unique salon-date pairs to sync from Payments.`);

  for (const pair of paymentDates) {
    await AnalyticsRepo.syncSalonStats(pair.salonId, new Date(pair.date));
  }

  console.log('Backfill completed successfully.');
}

backfill()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

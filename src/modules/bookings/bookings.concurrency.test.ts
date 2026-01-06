
import request from 'supertest';
import app from '../../app';
import { prisma } from '../../config/prisma';
import { User, Salon, Service, SalonCustomerProfile, CustomerAccount, UserRole } from '@prisma/client';
import { sign } from 'jsonwebtoken';
import { createTestSalon, createTestUser, createTestService } from '../../common/utils/test-utils';
import httpStatus from 'http-status';

// Helper to generate a valid JWT for a user
const generateToken = (user: User, salon: Salon) => {
  return sign({ userId: user.id, salonId: salon.id, role: user.role }, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: '1h',
  });
};

describe('Booking Concurrency', () => {
  let salon: Salon;
  let staff: User;
  let service: Service;
  let customerAccount: CustomerAccount;
  let customerProfile: SalonCustomerProfile;
  let token: string;

  beforeAll(async () => {
    // Clean up database before tests to ensure a clean slate
    await prisma.booking.deleteMany();
    await prisma.service.deleteMany();
    await prisma.user.deleteMany();
    await prisma.salonCustomerProfile.deleteMany();
    await prisma.customerAccount.deleteMany();
    await prisma.salon.deleteMany();

    // Create necessary test data using shared utilities
    salon = await createTestSalon({ slug: `test-salon-concurrency-${Date.now()}` });
    staff = await createTestUser({ salonId: salon.id, role: UserRole.MANAGER });
    service = await createTestService({ salonId: salon.id });

    // Create a customer for the booking
    const customerPhone = `+98912${Math.floor(1000000 + Math.random() * 9000000)}`;
    customerAccount = await prisma.customerAccount.create({
      data: { phone: customerPhone },
    });
    customerProfile = await prisma.salonCustomerProfile.create({
      data: {
        salonId: salon.id,
        customerAccountId: customerAccount.id,
        displayName: 'Concurrent Customer',
      },
    });

    token = generateToken(staff, salon);
  });

  afterAll(async () => {
    // Clean up all created test data
    await prisma.booking.deleteMany();
    await prisma.service.deleteMany();
    await prisma.user.deleteMany();
    await prisma.salonCustomerProfile.deleteMany();
    await prisma.customerAccount.deleteMany();
    await prisma.salon.deleteMany();
    await prisma.$disconnect();
  });

  /**
   * This test is designed to be deterministic and CI-safe.
   * It simulates a race condition by sending two identical booking requests simultaneously using Promise.allSettled.
   * This approach does not rely on unreliable timings (like setTimeout) and ensures that both requests are processed
   * by the server at nearly the same time.
   *
   * The assertions then verify the system's core concurrency control behavior:
   * 1. Exactly one request must succeed (201 Created).
   * 2. Exactly one request must fail due to the database's exclusion constraint (409 Conflict).
   * 3. The database must contain only one final booking record.
   */
  it('should prevent double booking for the same time slot under concurrent requests', async () => {
    const startAt = new Date();
    startAt.setHours(14, 0, 0, 0); // Use a fixed time for consistency

    const bookingPayload = {
      customerProfileId: customerProfile.id,
      serviceId: service.id,
      staffId: staff.id,
      startAt: startAt.toISOString(),
    };

    // Fire two identical requests concurrently and wait for both to complete
    const responses = await Promise.allSettled([
      request(app)
        .post(`/api/v1/salons/${salon.id}/bookings`)
        .set('Authorization', `Bearer ${token}`)
        .send(bookingPayload),
      request(app)
        .post(`/api/v1/salons/${salon.id}/bookings`)
        .set('Authorization', `Bearer ${token}`)
        .send(bookingPayload),
    ]);

    // 1. Verify the response statuses: one success, one conflict.
    const statuses = responses
        .map(res => (res.status === 'fulfilled' ? res.value.status : null))
        .sort();

    expect(statuses).toEqual([httpStatus.CREATED, httpStatus.CONFLICT]);

    // 2. Verify the failed response has the correct error code for a booking overlap.
    const failedResponse = responses.find(
      res => res.status === 'fulfilled' && res.value.status === httpStatus.CONFLICT
    ) as PromiseFulfilledResult<request.Response>;

    expect(failedResponse).toBeDefined();
    expect(failedResponse.value.body.error.code).toBe('BOOKING_OVERLAP');

    // 3. Verify the database state: exactly one booking should have been created.
    const bookingsInDb = await prisma.booking.findMany({
      where: {
        salonId: salon.id,
        staffId: staff.id,
        serviceId: service.id,
      },
    });

    expect(bookingsInDb).toHaveLength(1);
    expect(bookingsInDb[0].startAt).toEqual(startAt);
  });
});

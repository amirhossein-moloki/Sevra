
import request from 'supertest';
import app from '../../app';
import { prisma } from '../../config/prisma';
import { User, Salon, Service, SalonCustomerProfile, CustomerAccount } from '@prisma/client';
import { sign } from 'jsonwebtoken';

// Helper function to create test data
const createTestData = async () => {
  const salon = await prisma.salon.create({
    data: { name: 'Test Salon', slug: `test-salon-${Date.now()}` },
  });

  const staff = await prisma.user.create({
    data: {
      salonId: salon.id,
      fullName: 'Test Staff',
      phone: `+1500555000${Math.floor(Math.random() * 10)}`, // Random phone to avoid conflicts
      role: 'STAFF',
    },
  });

  const service = await prisma.service.create({
    data: {
      salonId: salon.id,
      name: 'Test Service',
      durationMinutes: 60,
      price: 100,
      currency: 'USD',
    },
  });

  const customerAccount = await prisma.customerAccount.create({
    data: { phone: `+1500555000${Math.floor(Math.random() * 10)}` },
  });

  const customerProfile = await prisma.salonCustomerProfile.create({
    data: {
      salonId: salon.id,
      customerAccountId: customerAccount.id,
      displayName: 'Test Customer',
    },
  });

  return { salon, staff, service, customerProfile };
};

// Helper to generate a valid JWT for a user
const generateToken = (user: User, salon: Salon) => {
  return sign({ userId: user.id, salonId: salon.id, role: user.role }, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: '1h',
  });
};


describe('Booking Concurrency', () => {
  let salon: Salon, staff: User, service: Service, customerProfile: SalonCustomerProfile, token: string;

  beforeAll(async () => {
    // Clean up database before tests
    await prisma.booking.deleteMany();

    // Create necessary test data
    const testData = await createTestData();
    salon = testData.salon;
    staff = testData.staff;
    service = testData.service;
    customerProfile = testData.customerProfile;
    token = generateToken(staff, salon);
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.booking.deleteMany();
    await prisma.service.deleteMany();
    await prisma.user.deleteMany();
    await prisma.salonCustomerProfile.deleteMany();
    await prisma.customerAccount.deleteMany();
    await prisma.salon.deleteMany();
    await prisma.$disconnect();
  });


  it('should prevent double booking for the same time slot under concurrent requests', async () => {
    const startAt = new Date();
    startAt.setHours(10, 0, 0, 0); // Set a specific time to avoid flaky tests

    const bookingPayload = {
      customerProfileId: customerProfile.id,
      serviceId: service.id,
      staffId: staff.id,
      startAt: startAt.toISOString(),
    };

    // Fire two requests concurrently
    const [response1, response2] = await Promise.allSettled([
      request(app)
        .post(`/api/v1/salons/${salon.id}/bookings`)
        .set('Authorization', `Bearer ${token}`)
        .send(bookingPayload),
      request(app)
        .post(`/api/v1/salons/${salon.id}/bookings`)
        .set('Authorization', `Bearer ${token}`)
        .send(bookingPayload),
    ]);

    // Check the results
    const successfulResponses = [];
    const failedResponses = [];

    if (response1.status === 'fulfilled' && response1.value.status === 201) {
      successfulResponses.push(response1);
    } else {
      failedResponses.push(response1);
    }

    if (response2.status === 'fulfilled' && response2.value.status === 201) {
      successfulResponses.push(response2);
    } else {
      failedResponses.push(response2);
    }

    // Assert that exactly one request succeeded
    expect(successfulResponses.length).toBe(1);
    expect(failedResponses.length).toBe(1);

    // Assert that the failed request has the correct error
    const failedResponse = failedResponses[0].status === 'fulfilled' ? failedResponses[0].value : null;
    expect(failedResponse).not.toBeNull();
    expect(failedResponse.status).toBe(409);
    expect(failedResponse.body.error.code).toBe('BOOKING_OVERLAP');
  });
});

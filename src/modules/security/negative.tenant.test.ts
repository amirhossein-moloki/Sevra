
import request from 'supertest';
import app from '../../app';
import { prisma } from '../../config/prisma';
import { User, Salon, Service, UserRole } from '@prisma/client';
import { createTestSalon, createTestUser, generateToken, createTestService } from '../../common/utils/test-utils';

describe('Negative Tenant Isolation E2E Tests', () => {
  let salonA: Salon;
  let salonB: Salon;
  let managerA: User;
  let managerB: User;
  let serviceB: Service;
  let tokenA: string;

  beforeAll(async () => {
    salonA = await createTestSalon({ slug: 'salon-a' });
    salonB = await createTestSalon({ slug: 'salon-b' });

    managerA = await createTestUser({ salonId: salonA.id, role: UserRole.MANAGER });
    managerB = await createTestUser({ salonId: salonB.id, role: UserRole.MANAGER });

    // Resource belonging to Salon B
    serviceB = await createTestService({ salonId: salonB.id });

    tokenA = generateToken({ id: managerA.id, salonId: salonA.id, role: managerA.role });
  });

  afterAll(async () => {
    await prisma.userService.deleteMany({});
    await prisma.service.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.salon.deleteMany({});
    await prisma.$disconnect();
  });

  it('should return 404 Not Found when Manager A tries to access a resource in Salon B', async () => {
    const response = await request(app)
      .get(`/api/v1/salons/${salonB.id}/services/${serviceB.id}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(response.status).toBe(404);
  });

  it('should return 404 Not Found when Manager A tries to list staff from Salon B', async () => {
    const response = await request(app)
      .get(`/api/v1/salons/${salonB.id}/staff`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(response.status).toBe(404);
  });

  it('should return 404 Not Found when Manager A tries to create a service in Salon B', async () => {
    const response = await request(app)
      .post(`/api/v1/salons/${salonB.id}/services`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Cross-Tenant Service',
        durationMinutes: 60,
        price: 50000,
        currency: 'IRR',
      });

    expect(response.status).toBe(404);
  });
});

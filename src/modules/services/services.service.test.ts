import { prisma } from '../../config/prisma';
import * as serviceLogic from './services.service';
import { User, Salon } from '@prisma/client';
import { CreateServiceInput } from './services.types';

describe('Services Service Logic Integration Tests', () => {
  let testSalon: Salon;
  let _testUser: User; // eslint-disable-line @typescript-eslint/no-unused-vars

  beforeAll(async () => {
    // Create a salon for the tests
    testSalon = await prisma.salon.create({
      data: {
        name: 'Test Salon for Services',
        slug: `test-salon-services-${Date.now()}`,
      },
    });
    // Create a user for the tests
    _testUser = await prisma.user.create({
      data: {
        fullName: 'Test User',
        phone: `+989120000000${Date.now()}`.slice(0, 14),
        role: 'MANAGER',
        salonId: testSalon.id,
      },
    });
  });

  afterAll(async () => {
    // Clean up all created data
    await prisma.service.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.salon.deleteMany({});
    await prisma.$disconnect();
  });

  describe('createService', () => {
    it('should create a new service and store it in the database', async () => {
      const serviceData: CreateServiceInput = {
        name: 'Manicure',
        durationMinutes: 45,
        price: 75000,
        currency: 'IRR',
      };

      const createdService = await serviceLogic.createService(testSalon.id, serviceData);

      expect(createdService).toBeDefined();
      expect(createdService.id).toBeDefined();
      expect(createdService.name).toBe(serviceData.name);
      expect(createdService.price).toBe(serviceData.price);
      expect(createdService.salonId).toBe(testSalon.id);

      // Verify it exists in the DB
      const dbService = await prisma.service.findUnique({
        where: { id: createdService.id },
      });
      expect(dbService).not.toBeNull();
      expect(dbService?.name).toBe(serviceData.name);
    });
  });
});

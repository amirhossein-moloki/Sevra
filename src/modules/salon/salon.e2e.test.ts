import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../app';

const prisma = new PrismaClient();

describe('Salon API - E2E', () => {
  beforeAll(async () => {
    // Clean the database before running tests
    await prisma.salon.deleteMany();
  });

  afterAll(async () => {
    // Disconnect Prisma client
    await prisma.$disconnect();
  });

  describe('POST /api/v1/salons', () => {
    it('should create a new salon and return 201', async () => {
      const newSalon = {
        name: 'Test Salon',
        slug: 'test-salon-e2e',
      };

      const response = await request(app)
        .post('/api/v1/salons')
        .send(newSalon)
        .expect(201);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.name).toBe(newSalon.name);
      expect(response.body.data.slug).toBe(newSalon.slug);
      expect(response.body.data.isActive).toBe(true);
    });

    it('should return 409 if slug already exists', async () => {
      const newSalon = {
        name: 'Another Test Salon',
        slug: 'test-salon-e2e', // Same slug as the previous test
      };

      await request(app)
        .post('/api/v1/salons')
        .send(newSalon)
        .expect(409);
    });
  });

  describe('GET /api/v1/salons', () => {
    it('should return a list of active salons', async () => {
        const response = await request(app)
            .get('/api/v1/salons')
            .expect(200);

        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
        expect(response.body.data[0].slug).toBe('test-salon-e2e');
    });
  });

   describe('GET /api/v1/salons/:id', () => {
    it('should return a single salon by its ID', async () => {
      const salon = await prisma.salon.findUnique({ where: { slug: 'test-salon-e2e' } });
      const salonId = salon?.id;

      const response = await request(app)
        .get(`/api/v1/salons/${salonId}`)
        .expect(200);

      expect(response.body.data.id).toBe(salonId);
      expect(response.body.data.name).toBe('Test Salon');
    });

    it('should return 404 for a non-existent salon ID', async () => {
      const nonExistentId = 'clx2j2qj800003b6j2k7q5b5h'; // A random CUID
      await request(app)
        .get(`/api/v1/salons/${nonExistentId}`)
        .expect(404);
    });
  });

  describe('PATCH /api/v1/salons/:id', () => {
    it('should update a salon and return the updated data', async () => {
        const salon = await prisma.salon.findUnique({ where: { slug: 'test-salon-e2e' } });
        const salonId = salon?.id;
        const updateData = { name: 'Updated Test Salon Name' };

        const response = await request(app)
            .patch(`/api/v1/salons/${salonId}`)
            .send(updateData)
            .expect(200);

        expect(response.body.data.name).toBe(updateData.name);
    });
  });

  describe('DELETE /api/v1/salons/:id', () => {
    it('should soft delete a salon and return a success message', async () => {
        const salon = await prisma.salon.findUnique({ where: { slug: 'test-salon-e2e' } });
        const salonId = salon?.id;

        await request(app)
            .delete(`/api/v1/salons/${salonId}`)
            .expect(200);

        // Verify it's soft-deleted
        const deletedSalon = await prisma.salon.findUnique({ where: { id: salonId } });
        expect(deletedSalon?.isActive).toBe(false);
    });
  });

});

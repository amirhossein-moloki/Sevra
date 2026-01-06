import request from 'supertest';
import jwt from 'jsonwebtoken';
import {
  PrismaClient,
  RobotsFollow,
  RobotsIndex,
  UserRole,
} from '@prisma/client';
import app from '../../app';
import { env } from '../../config/env';

const prisma = new PrismaClient();

describe('CMS Site Settings API E2E Tests', () => {
  let testSalonId: string;
  let managerToken: string;

  beforeAll(async () => {
    await prisma.salonSiteSettings.deleteMany();
    await prisma.user.deleteMany();
    await prisma.salon.deleteMany();

    const salon = await prisma.salon.create({
      data: {
        name: 'CMS Site Settings Salon',
        slug: `cms-site-settings-salon-${Date.now()}`,
      },
    });

    testSalonId = salon.id;

    const manager = await prisma.user.create({
      data: {
        fullName: 'CMS Settings Manager',
        phone: `+98912133333${Date.now()}`.slice(0, 14),
        role: UserRole.MANAGER,
        salonId: testSalonId,
      },
    });

    managerToken = jwt.sign(
      { actorId: manager.id, actorType: 'USER', salonId: testSalonId, role: manager.role },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await prisma.salonSiteSettings.deleteMany();
    await prisma.user.deleteMany();
    await prisma.salon.deleteMany();
    await prisma.$disconnect();
  });

  describe('GET /api/v1/salons/:salonId/site-settings', () => {
    it('should return null when no settings exist', async () => {
      const response = await request(app)
        .get(`/api/v1/salons/${testSalonId}/site-settings`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.data).toBeNull();
    });
  });

  describe('PUT /api/v1/salons/:salonId/site-settings', () => {
    it('should create settings for the salon', async () => {
      const response = await request(app)
        .put(`/api/v1/salons/${testSalonId}/site-settings`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          logoUrl: 'https://example.com/logo.png',
          defaultSeoTitle: 'Salon Title',
          defaultSeoDescription: 'Salon description',
          robotsIndex: RobotsIndex.NOINDEX,
          robotsFollow: RobotsFollow.NOFOLLOW,
        })
        .expect(200);

      expect(response.body.data.logoUrl).toBe('https://example.com/logo.png');
      expect(response.body.data.robotsIndex).toBe(RobotsIndex.NOINDEX);
      expect(response.body.data.robotsFollow).toBe(RobotsFollow.NOFOLLOW);
    });

    it('should update settings without creating duplicates', async () => {
      const response = await request(app)
        .put(`/api/v1/salons/${testSalonId}/site-settings`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          logoUrl: 'https://example.com/logo-updated.png',
          faviconUrl: 'https://example.com/favicon.ico',
          robotsIndex: RobotsIndex.INDEX,
        })
        .expect(200);

      expect(response.body.data.logoUrl).toBe(
        'https://example.com/logo-updated.png'
      );
      expect(response.body.data.faviconUrl).toBe(
        'https://example.com/favicon.ico'
      );
      expect(response.body.data.robotsIndex).toBe(RobotsIndex.INDEX);

      const count = await prisma.salonSiteSettings.count({
        where: { salonId: testSalonId },
      });
      expect(count).toBe(1);
    });
  });
});

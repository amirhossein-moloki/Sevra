import request from 'supertest';
import jwt from 'jsonwebtoken';
import { MediaPurpose, MediaType, PrismaClient, UserRole } from '@prisma/client';
import app from '../../app';
import { env } from '../../config/env';

const prisma = new PrismaClient();

describe('CMS Media API E2E Tests', () => {
  let testSalonId: string;
  let managerToken: string;
  let staffToken: string;
  let galleryMediaId: string;

  beforeAll(async () => {
    await prisma.salonMedia.deleteMany();
    await prisma.user.deleteMany();
    await prisma.salon.deleteMany();

    const salon = await prisma.salon.create({
      data: {
        name: 'CMS Media Salon',
        slug: `cms-media-salon-${Date.now()}`,
      },
    });

    testSalonId = salon.id;

    const manager = await prisma.user.create({
      data: {
        fullName: 'CMS Media Manager',
        phone: `+98912122222${Date.now()}`.slice(0, 14),
        role: UserRole.MANAGER,
        salonId: testSalonId,
      },
    });

    const staff = await prisma.user.create({
      data: {
        fullName: 'CMS Media Staff',
        phone: `+98912122223${Date.now()}`.slice(0, 14),
        role: UserRole.STAFF,
        salonId: testSalonId,
      },
    });

    managerToken = jwt.sign(
      { actorId: manager.id, actorType: 'USER', salonId: testSalonId, role: manager.role },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    staffToken = jwt.sign(
      { actorId: staff.id, actorType: 'USER', salonId: testSalonId, role: staff.role },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await prisma.salonMedia.deleteMany();
    await prisma.user.deleteMany();
    await prisma.salon.deleteMany();
    await prisma.$disconnect();
  });

  describe('Authorization', () => {
    it('should reject requests without a token', async () => {
      const response = await request(app)
        .post(`/api/v1/salons/${testSalonId}/media`)
        .send({
          type: MediaType.IMAGE,
          purpose: MediaPurpose.GALLERY,
          url: 'https://example.com/unauthorized.png',
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authorization header is missing or invalid',
        },
      });
    });

    it('should reject non-manager roles', async () => {
      const response = await request(app)
        .post(`/api/v1/salons/${testSalonId}/media`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          type: MediaType.IMAGE,
          purpose: MediaPurpose.GALLERY,
          url: 'https://example.com/forbidden.png',
        })
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Forbidden: You do not have the required permissions.',
        },
      });
    });
  });

  describe('POST /api/v1/salons/:salonId/media', () => {
    it('should reject logo media without alt text', async () => {
      await request(app)
        .post(`/api/v1/salons/${testSalonId}/media`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          type: MediaType.IMAGE,
          purpose: MediaPurpose.LOGO,
          url: 'https://example.com/logo.png',
        })
        .expect(400);
    });

    it('should create gallery media without alt text', async () => {
      const response = await request(app)
        .post(`/api/v1/salons/${testSalonId}/media`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          type: MediaType.IMAGE,
          purpose: MediaPurpose.GALLERY,
          url: 'https://example.com/gallery.png',
          caption: 'Gallery image',
        })
        .expect(201);

      expect(response.body.data.purpose).toBe(MediaPurpose.GALLERY);
      galleryMediaId = response.body.data.id;
    });
  });

  describe('PATCH /api/v1/salons/:salonId/media/:mediaId', () => {
    it('should require alt text when updating to cover purpose', async () => {
      await request(app)
        .patch(`/api/v1/salons/${testSalonId}/media/${galleryMediaId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          purpose: MediaPurpose.COVER,
        })
        .expect(400);
    });

    it('should update media with alt text for cover purpose', async () => {
      const response = await request(app)
        .patch(`/api/v1/salons/${testSalonId}/media/${galleryMediaId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          purpose: MediaPurpose.COVER,
          altText: 'Salon cover image',
          isActive: false,
        })
        .expect(200);

      expect(response.body.data.purpose).toBe(MediaPurpose.COVER);
      expect(response.body.data.altText).toBe('Salon cover image');
      expect(response.body.data.isActive).toBe(false);
    });
  });
});

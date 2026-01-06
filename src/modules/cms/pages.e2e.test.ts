import request from 'supertest';
import jwt from 'jsonwebtoken';
import { PrismaClient, PageSectionType, PageStatus, PageType, UserRole } from '@prisma/client';
import app from '../../app';
import { env } from '../../config/env';

const prisma = new PrismaClient();

describe('CMS Pages API E2E Tests', () => {
  let testSalonId: string;
  let managerToken: string;
  let publishedPageId: string;

  const buildHeroSection = () => ({
    type: PageSectionType.HERO,
    dataJson: JSON.stringify({
      headline: 'Welcome',
      subheadline: 'Subheadline',
      primaryCta: { label: 'Book now', url: '/book' },
      secondaryCta: { label: 'Learn more', url: '/learn' },
      backgroundImageUrl: 'https://example.com/hero.jpg',
    }),
    sortOrder: 0,
    isEnabled: true,
  });

  const buildRichTextSection = () => ({
    type: PageSectionType.RICH_TEXT,
    dataJson: JSON.stringify({
      title: 'About us',
      blocks: [{ type: 'paragraph', text: 'Hello world' }],
    }),
    sortOrder: 0,
    isEnabled: true,
  });

  beforeAll(async () => {
    await prisma.user.deleteMany();
    await prisma.salon.deleteMany();

    const salon = await prisma.salon.create({
      data: {
        name: 'CMS E2E Salon',
        slug: `cms-e2e-salon-${Date.now()}`,
      },
    });
    testSalonId = salon.id;

    const manager = await prisma.user.create({
      data: {
        fullName: 'CMS Manager',
        phone: `+989121111112${Date.now()}`.slice(0, 14),
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
    await prisma.salonPageSection.deleteMany();
    await prisma.salonPage.deleteMany();
    await prisma.user.deleteMany();
    await prisma.salon.deleteMany();
    await prisma.$disconnect();
  });

  describe('POST /api/v1/salons/:salonId/pages', () => {
    it('should create a published page with sections', async () => {
      const response = await request(app)
        .post(`/api/v1/salons/${testSalonId}/pages`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          slug: 'home',
          title: 'Home Page',
          type: PageType.HOME,
          status: PageStatus.PUBLISHED,
          sections: [buildHeroSection()],
        })
        .expect(201);

      expect(response.body.data.status).toBe(PageStatus.PUBLISHED);
      expect(response.body.data.publishedAt).toBeTruthy();
      expect(response.body.data.sections).toHaveLength(1);
      publishedPageId = response.body.data.id;
    });

    it('should create a draft page for listing filters', async () => {
      await request(app)
        .post(`/api/v1/salons/${testSalonId}/pages`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          slug: 'about',
          title: 'About Page',
          type: PageType.ABOUT,
          status: PageStatus.DRAFT,
          sections: [buildHeroSection()],
        })
        .expect(201);
    });
  });

  describe('GET /api/v1/salons/:salonId/pages', () => {
    it('should list pages with filters and pagination', async () => {
      const response = await request(app)
        .get(`/api/v1/salons/${testSalonId}/pages`)
        .set('Authorization', `Bearer ${managerToken}`)
        .query({ status: PageStatus.PUBLISHED, type: PageType.HOME, limit: 1, offset: 0 })
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.meta.total).toBe(1);
      expect(response.body.data[0].id).toBe(publishedPageId);
    });
  });

  describe('PATCH /api/v1/salons/:salonId/pages/:pageId', () => {
    it('should update page status and replace sections', async () => {
      const response = await request(app)
        .patch(`/api/v1/salons/${testSalonId}/pages/${publishedPageId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          status: PageStatus.ARCHIVED,
          sections: [buildRichTextSection()],
        })
        .expect(200);

      expect(response.body.data.status).toBe(PageStatus.ARCHIVED);
      expect(response.body.data.publishedAt).toBeNull();
      expect(response.body.data.sections).toHaveLength(1);
      expect(response.body.data.sections[0].type).toBe(PageSectionType.RICH_TEXT);
    });

    it('should create slug history when the slug changes', async () => {
      const response = await request(app)
        .patch(`/api/v1/salons/${testSalonId}/pages/${publishedPageId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ slug: 'home-updated' })
        .expect(200);

      expect(response.body.data.slug).toBe('home-updated');

      const history = await prisma.salonPageSlugHistory.findFirst({
        where: { pageId: publishedPageId, oldSlug: 'home' },
      });

      expect(history).toBeTruthy();
    });
  });
});

import request from 'supertest';
import { PageStatus, PrismaClient } from '@prisma/client';
import app from '../../app';

const prisma = new PrismaClient();

describe('Public Routes Enforcement', () => {
  let activeSalon: { id: string; slug: string };
  let inactiveSalon: { id: string; slug: string };
  let page: { id: string; slug: string };

  beforeAll(async () => {
    // Cleanup
    await prisma.salonPage.deleteMany();
    await prisma.salon.deleteMany();

    activeSalon = await prisma.salon.create({
      data: {
        name: 'Active Salon',
        slug: 'active-salon',
        isActive: true,
      },
    });

    inactiveSalon = await prisma.salon.create({
      data: {
        name: 'Inactive Salon',
        slug: 'inactive-salon',
        isActive: false,
      },
    });

    page = await prisma.salonPage.create({
      data: {
        salonId: activeSalon.id,
        slug: 'test-page',
        title: 'Test Page',
        status: PageStatus.PUBLISHED,
        seoTitle: 'SEO Title',
        seoDescription: 'SEO Description',
      },
    });

    await prisma.salonPage.create({
      data: {
        salonId: activeSalon.id,
        slug: 'home',
        title: 'Home',
        type: 'HOME',
        status: PageStatus.PUBLISHED,
        seoTitle: 'Home SEO Title',
      },
    });
  });

  afterAll(async () => {
    await prisma.salonPage.deleteMany();
    await prisma.salon.deleteMany();
    await prisma.$disconnect();
  });

  describe('resolveSalonBySlug middleware', () => {
    it('returns 200 for an active salon', async () => {
      await request(app)
        .get(`/api/v1/public/salons/${activeSalon.slug}/pages/${page.slug}`)
        .expect(200);
    });

    it('returns 404 for an inactive salon', async () => {
      await request(app)
        .get(`/api/v1/public/salons/${inactiveSalon.slug}/pages/some-page`)
        .expect(404);
    });

    it('returns 404 for a non-existent salon slug', async () => {
      await request(app)
        .get('/api/v1/public/salons/non-existent/pages/some-page')
        .expect(404);
    });
  });

  describe('Availability route enforcement', () => {
    it('returns 404 for availability on an inactive salon', async () => {
      // Even if the service exists, the salon is inactive
      await request(app)
        .get(`/api/v1/public/salons/${inactiveSalon.slug}/availability/slots`)
        .expect(404);
    });

    it('returns 400 or 404 for availability with missing serviceId (validation check)', async () => {
      // Just checking that it goes through resolveSalonBySlug first
      const response = await request(app)
        .get(`/api/v1/public/salons/${activeSalon.slug}/availability/slots`);

      // It should reach validation if salon is found
      expect(response.status).not.toBe(404);
    });
  });

  describe('Salon root and Home page', () => {
    it('returns the HOME page for the salon root route', async () => {
      const response = await request(app)
        .get(`/api/v1/public/salons/${activeSalon.slug}`)
        .expect(200);

      expect(response.text).toContain('<title>Home SEO Title</title>');
    });

    it('returns 404 for salon root if no HOME page exists', async () => {
      const salonNoHome = await prisma.salon.create({
        data: {
          name: 'No Home Salon',
          slug: 'no-home-salon',
        }
      });

      await request(app)
        .get(`/api/v1/public/salons/${salonNoHome.slug}`)
        .expect(404);
    });
  });

  describe('SEO Metadata in getPublicPage', () => {
    it('serves correct SEO tags in the HTML', async () => {
      const response = await request(app)
        .get(`/api/v1/public/salons/${activeSalon.slug}/pages/${page.slug}`)
        .expect(200);

      expect(response.text).toContain('<title>SEO Title</title>');
      expect(response.text).toContain('<meta name="description" content="SEO Description" />');
    });

    it('falls back to site settings for SEO if page fields are missing', async () => {
      await prisma.salonSiteSettings.upsert({
        where: { salonId: activeSalon.id },
        create: {
          salonId: activeSalon.id,
          defaultSeoTitle: 'Default Salon SEO',
        },
        update: {
          defaultSeoTitle: 'Default Salon SEO',
        }
      });

      const pageNoSeo = await prisma.salonPage.create({
        data: {
          salonId: activeSalon.id,
          slug: 'fallback-seo',
          title: 'Fallback Page',
          status: PageStatus.PUBLISHED,
        },
      });

      const response = await request(app)
        .get(`/api/v1/public/salons/${activeSalon.slug}/pages/${pageNoSeo.slug}`)
        .expect(200);

      expect(response.text).toContain('<title>Default Salon SEO</title>');
    });

    it('falls back to page title if both seoTitle and site settings are missing', async () => {
      const otherSalon = await prisma.salon.create({
        data: { name: 'Other Salon', slug: 'other-salon' }
      });
      const pageNoSeo = await prisma.salonPage.create({
        data: {
          salonId: otherSalon.id,
          slug: 'no-seo',
          title: 'Just Title',
          status: PageStatus.PUBLISHED,
        },
      });

      const response = await request(app)
        .get(`/api/v1/public/salons/${otherSalon.slug}/pages/${pageNoSeo.slug}`)
        .expect(200);

      expect(response.text).toContain('<title>Just Title</title>');
    });
  });
});

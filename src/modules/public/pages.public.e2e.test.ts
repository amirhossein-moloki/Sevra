import request from 'supertest';
import { PageSectionType, PageStatus, PrismaClient } from '@prisma/client';
import app from '../../app';

const prisma = new PrismaClient();

describe('GET /api/v1/public/salons/:salonSlug/pages/:pageSlug', () => {
  let salon: { id: string; slug: string };
  let page: { id: string; slug: string };

  beforeAll(async () => {
    await prisma.salonPageSlugHistory.deleteMany();
    await prisma.salonPageSection.deleteMany();
    await prisma.salonPage.deleteMany();
    await prisma.salon.deleteMany();

    salon = await prisma.salon.create({
      data: {
        name: 'Public Pages Salon',
        slug: `public-pages-${Date.now()}`,
      },
    });

    page = await prisma.salonPage.create({
      data: {
        salonId: salon.id,
        slug: 'about',
        title: 'About',
        status: PageStatus.PUBLISHED,
        publishedAt: new Date(),
        sections: {
          create: [
            {
              type: PageSectionType.RICH_TEXT,
              dataJson: JSON.stringify({
                title: 'About us',
                blocks: [{ type: 'paragraph', text: 'Hello world' }],
              }),
              sortOrder: 0,
              isEnabled: true,
            },
          ],
        },
      },
      select: {
        id: true,
        slug: true,
      },
    });

    await prisma.salonPageSlugHistory.create({
      data: {
        pageId: page.id,
        oldSlug: 'about-old',
      },
    });
  });

  afterAll(async () => {
    await prisma.salonPageSlugHistory.deleteMany();
    await prisma.salonPageSection.deleteMany();
    await prisma.salonPage.deleteMany();
    await prisma.salon.deleteMany();
    await prisma.$disconnect();
  });

  it('returns the page HTML for the current slug', async () => {
    const response = await request(app)
      .get(`/api/v1/public/salons/${salon.slug}/pages/${page.slug}`)
      .expect(200);

    expect(response.text).toContain('<!doctype html>');
    expect(response.text).toContain('<title>About</title>');
  });

  it('redirects to the current slug when slug history matches', async () => {
    const response = await request(app)
      .get(`/api/v1/public/salons/${salon.slug}/pages/about-old`)
      .expect(301);

    expect(response.headers.location).toBe(
      `/api/v1/public/salons/${salon.slug}/pages/${page.slug}`
    );
  });
});

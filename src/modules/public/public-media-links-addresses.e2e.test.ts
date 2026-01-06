import request from 'supertest';
import { LinkType, MediaPurpose, MediaType, PrismaClient } from '@prisma/client';
import app from '../../app';

const prisma = new PrismaClient();

describe('Public Media, Links, and Addresses API', () => {
  let salon: { id: string; slug: string };
  let otherSalon: { id: string; slug: string };

  beforeAll(async () => {
    await prisma.salonMedia.deleteMany();
    await prisma.salonLink.deleteMany();
    await prisma.salonAddress.deleteMany();
    await prisma.salon.deleteMany();

    salon = await prisma.salon.create({
      data: {
        name: 'Public CMS Salon',
        slug: `public-cms-${Date.now()}`,
      },
      select: { id: true, slug: true },
    });

    otherSalon = await prisma.salon.create({
      data: {
        name: 'Other Public CMS Salon',
        slug: `public-cms-other-${Date.now()}`,
      },
      select: { id: true, slug: true },
    });

    await prisma.salonMedia.createMany({
      data: [
        {
          salonId: salon.id,
          type: MediaType.IMAGE,
          purpose: MediaPurpose.GALLERY,
          url: 'https://example.com/media-active-2.png',
          sortOrder: 2,
          isActive: true,
        },
        {
          salonId: salon.id,
          type: MediaType.IMAGE,
          purpose: MediaPurpose.GALLERY,
          url: 'https://example.com/media-active-1.png',
          sortOrder: 1,
          isActive: true,
        },
        {
          salonId: salon.id,
          type: MediaType.IMAGE,
          purpose: MediaPurpose.GALLERY,
          url: 'https://example.com/media-inactive.png',
          sortOrder: 0,
          isActive: false,
        },
        {
          salonId: otherSalon.id,
          type: MediaType.IMAGE,
          purpose: MediaPurpose.GALLERY,
          url: 'https://example.com/media-other.png',
          sortOrder: 0,
          isActive: true,
        },
      ],
    });

    await prisma.salonLink.createMany({
      data: [
        {
          salonId: salon.id,
          type: LinkType.INSTAGRAM,
          label: 'Instagram',
          value: 'https://instagram.com/salon',
          isPrimary: true,
          isActive: true,
        },
        {
          salonId: salon.id,
          type: LinkType.WHATSAPP,
          label: 'WhatsApp',
          value: '+989121111111',
          isPrimary: false,
          isActive: true,
        },
        {
          salonId: salon.id,
          type: LinkType.TELEGRAM,
          label: 'Telegram',
          value: 'https://t.me/salon',
          isPrimary: false,
          isActive: false,
        },
        {
          salonId: otherSalon.id,
          type: LinkType.WEBSITE,
          label: 'Website',
          value: 'https://example.com',
          isPrimary: false,
          isActive: true,
        },
      ],
    });

    await prisma.salonAddress.createMany({
      data: [
        {
          salonId: salon.id,
          title: 'Main',
          city: 'Tehran',
          addressLine: '123 Main Street',
          isPrimary: true,
        },
        {
          salonId: salon.id,
          title: 'Branch',
          city: 'Shiraz',
          addressLine: '456 Side Street',
          isPrimary: false,
        },
        {
          salonId: otherSalon.id,
          title: 'Other',
          city: 'Tabriz',
          addressLine: '789 Another Street',
          isPrimary: true,
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.salonMedia.deleteMany();
    await prisma.salonLink.deleteMany();
    await prisma.salonAddress.deleteMany();
    await prisma.salon.deleteMany();
    await prisma.$disconnect();
  });

  it('returns active media ordered by sortOrder', async () => {
    const response = await request(app)
      .get(`/api/v1/public/salons/${salon.slug}/media`)
      .expect(200);

    expect(response.body.data).toHaveLength(2);
    expect(response.body.data[0].sortOrder).toBe(1);
    expect(response.body.data[1].sortOrder).toBe(2);
    expect(response.body.data.every((item: { isActive: boolean }) => item.isActive)).toBe(true);
  });

  it('returns active links including isPrimary', async () => {
    const response = await request(app)
      .get(`/api/v1/public/salons/${salon.slug}/links`)
      .expect(200);

    expect(response.body.data).toHaveLength(2);
    expect(response.body.data[0]).toHaveProperty('isPrimary');
    expect(response.body.data[1]).toHaveProperty('isPrimary');
  });

  it('returns addresses for the salon slug', async () => {
    const response = await request(app)
      .get(`/api/v1/public/salons/${salon.slug}/addresses`)
      .expect(200);

    expect(response.body.data).toHaveLength(2);
    const cities = response.body.data.map((address: { city: string }) => address.city);
    expect(cities).toEqual(expect.arrayContaining(['Tehran', 'Shiraz']));
  });
});

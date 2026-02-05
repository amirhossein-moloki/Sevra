import request from 'supertest';
import { PrismaClient, UserRole } from '@prisma/client';
import app from '../../app';
import { generateToken } from '../../common/utils/test-utils';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

describe('Media Upload E2E', () => {
  let salon: { id: string };
  let manager: { id: string };
  let token: string;
  const testImagePath = path.join(__dirname, 'test-image.png');

  beforeAll(async () => {
    // Create a dummy image for testing
    // A 1x1 transparent PNG
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    );
    fs.writeFileSync(testImagePath, pngBuffer);

    await prisma.salonMedia.deleteMany();
    await prisma.user.deleteMany();
    await prisma.salon.deleteMany();

    salon = await prisma.salon.create({
      data: {
        name: 'Media Test Salon',
        slug: 'media-test-salon',
      },
    });

    manager = await prisma.user.create({
      data: {
        salonId: salon.id,
        fullName: 'Manager User',
        phone: '09123456789',
        role: UserRole.MANAGER,
      },
    });

    token = generateToken({
      userId: manager.id,
      salonId: salon.id,
      role: UserRole.MANAGER,
    });
  });

  afterAll(async () => {
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
    await prisma.salonMedia.deleteMany();
    await prisma.user.deleteMany();
    await prisma.salon.deleteMany();
    await prisma.$disconnect();
  });

  it('uploads an image and creates a record', async () => {
    const response = await request(app)
      .post(`/api/v1/salons/${salon.id}/media/upload`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', testImagePath)
      .field('purpose', 'GALLERY')
      .field('altText', 'Test Image')
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.url).toContain('/uploads/');
    expect(response.body.data.thumbUrl).toContain('/uploads/thumbnails/');
    expect(response.body.data.altText).toBe('Test Image');

    // Verify DB record
    const media = await prisma.salonMedia.findUnique({
      where: { id: response.body.data.id },
    });
    expect(media).toBeDefined();
    expect(media?.url).toBe(response.body.data.url);
  });

  it('returns 400 if no file is uploaded', async () => {
    await request(app)
      .post(`/api/v1/salons/${salon.id}/media/upload`)
      .set('Authorization', `Bearer ${token}`)
      .field('purpose', 'GALLERY')
      .expect(400);
  });

  it('enforces altText for logo purpose', async () => {
    await request(app)
      .post(`/api/v1/salons/${salon.id}/media/upload`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', testImagePath)
      .field('purpose', 'LOGO')
      // missing altText
      .expect(400);
  });
});

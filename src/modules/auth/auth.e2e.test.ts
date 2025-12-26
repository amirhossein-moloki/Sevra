import request from 'supertest';
import app from '../../app';
import { prisma } from '../../config/prisma';
import { Salon, User } from '@prisma/client';
import argon2 from 'argon2';

describe('Auth E2E Tests - /api/v1/auth', () => {
  let salon: Salon;
  let user: User;
  let tokens: { accessToken: string; refreshToken: string };
  const password = 'password123';

  beforeAll(async () => {
    // Create a salon
    salon = await prisma.salon.create({
      data: {
        name: 'E2E Test Salon',
        slug: `e2e-test-salon-${Date.now()}`,
        settings: {
          create: {
            timeZone: 'UTC',
          },
        },
      },
    });

    // Create a user for that salon
    const passwordHash = await argon2.hash(password);
    user = await prisma.user.create({
      data: {
        phone: `+98912${String(Date.now()).slice(-7)}`, // Unique phone number
        fullName: 'E2E Test User',
        passwordHash,
        role: 'MANAGER',
        salonId: salon.id,
      },
    });
  });

  afterAll(async () => {
    // Clean up the database
    await prisma.session.deleteMany({});
    const deleteUser = prisma.user.delete({ where: { id: user.id } });
    const deleteSalon = prisma.salon.delete({ where: { id: salon.id } });
    await prisma.$transaction([deleteUser, deleteSalon]);
    await prisma.$disconnect();
  });

  describe('POST /login', () => {
    it('should return 200 and tokens for valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          phone: user.phone,
          password: password,
          salonId: salon.id,
          actorType: 'USER',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(user.id);
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');

      // Save tokens for subsequent tests
      tokens = response.body.data.tokens;
    });

    it('should return 401 for invalid password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          phone: user.phone,
          password: 'wrongpassword',
          salonId: salon.id,
          actorType: 'USER',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('POST /refresh', () => {
    it('should return a new access token with a valid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: tokens.refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data.accessToken).not.toBe(tokens.accessToken);
    });

    it('should return 401 for an invalid refresh token', async () => {
        const response = await request(app)
          .post('/api/v1/auth/refresh')
          .send({ refreshToken: 'invalidtoken' });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
      });
  });

  describe('GET /me', () => {
    it('should return the current actor with a valid access token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${tokens.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.actorId).toBe(user.id);
      expect(response.body.data.actorType).toBe('USER');
    });

    it('should return 401 for a missing access token', async () => {
        const response = await request(app)
          .get('/api/v1/auth/me');

        expect(response.status).toBe(401);
      });
  });

  describe('POST /logout', () => {
    it('should logout the user and invalidate the session', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${tokens.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Logged out successfully');

      // Verify that the old refresh token is now invalid
      const refreshResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: tokens.refreshToken });

      expect(refreshResponse.status).toBe(401);
    });
  });
});

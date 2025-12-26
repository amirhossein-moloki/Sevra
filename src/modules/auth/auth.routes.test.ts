import request from 'supertest';
import { app } from '../../app';
import { prisma } from '../../config/prisma';
import argon2 from 'argon2';
import { AuthService } from './auth.service';

describe('Auth Routes', () => {
  afterEach(async () => {
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
    await prisma.customerAccount.deleteMany();
    await prisma.salon.deleteMany();
  });

  describe('POST /auth/login', () => {
    it('should login a user with valid credentials', async () => {
        const salon = await prisma.salon.create({ data: { name: 'Test Salon' } });
        await prisma.user.create({
          data: {
            phone: '1234567890',
            passwordHash: await argon2.hash('password'),
            salonId: salon.id,
          },
        });

        const res = await request(app)
          .post('/auth/login')
          .send({
            phone: '1234567890',
            password: 'password',
            actorType: 'USER',
            salonId: salon.id,
          });

        expect(res.status).toBe(200);
        expect(res.body.data.tokens).toHaveProperty('accessToken');
      });

    it('should not login a user with invalid credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          phone: '1234567890',
          password: 'wrong-password',
          actorType: 'USER',
          salonId: '1',
        });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /auth/user/otp/request', () => {
    it('should request an OTP for an existing user', async () => {
        const salon = await prisma.salon.create({ data: { name: 'Test Salon' } });
        await prisma.user.create({
          data: { phone: '1234567890', salonId: salon.id },
        });

        const res = await request(app)
          .post('/auth/user/otp/request')
          .send({ phone: '1234567890' });

        expect(res.status).toBe(200);
        expect(res.body.data.message).toContain('OTP sent');
      });

    it('should return an error for a non-existing user', async () => {
      const res = await request(app)
        .post('/auth/user/otp/request')
        .send({ phone: '1234567890' });

      expect(res.status).toBe(404);
    });
  });

  describe('POST /auth/user/otp/verify', () => {
    it('should verify a valid OTP', async () => {
        const phone = '1234567890';
        const code = '123456';
        await prisma.phoneOtp.create({
          data: {
            phone,
            codeHash: await argon2.hash(code),
            purpose: 'LOGIN',
            expiresAt: new Date(Date.now() + 10000),
          },
        });

        const res = await request(app)
          .post('/auth/user/otp/verify')
          .send({ phone, code });

        expect(res.status).toBe(200);
      });

    it('should return an error for an invalid OTP', async () => {
      const res = await request(app)
        .post('/auth/user/otp/verify')
        .send({ phone: '1234567890', code: '123456' });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /auth/user/login/otp', () => {
    it('should login a user with a valid OTP', async () => {
        const phone = '1234567890';
        const salon = await prisma.salon.create({ data: { name: 'Test Salon' } });
        await prisma.user.create({ data: { phone, salonId: salon.id } });
        await prisma.phoneOtp.create({
          data: {
            phone,
            codeHash: await argon2.hash('123456'),
            purpose: 'LOGIN',
            expiresAt: new Date(Date.now() + 10000),
            consumedAt: new Date(),
          },
        });

        const res = await request(app)
          .post('/auth/user/login/otp')
          .send({ phone, salonId: salon.id });

        expect(res.status).toBe(200);
        expect(res.body.data.tokens).toHaveProperty('accessToken');
      });

    it('should not login a user with an unverified OTP', async () => {
      const phone = '1234567890';
      const salon = await prisma.salon.create({ data: { name: 'Test Salon' } });
      await prisma.user.create({ data: { phone, salonId: salon.id } });

      const res = await request(app)
        .post('/auth/user/login/otp')
        .send({ phone, salonId: salon.id });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh the access token', async () => {
      await prisma.customerAccount.create({ data: { phone: '1234567890' } });
      const loginRes = await request(app)
        .post('/auth/login')
        .send({ phone: '1234567890', actorType: 'CUSTOMER' });

      const { refreshToken } = loginRes.body.data.tokens;

      const res = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('accessToken');
    });
  });

  describe('GET /auth/me', () => {
    it('should return the current user', async () => {
      await prisma.customerAccount.create({ data: { phone: '1234567890' } });
      const loginRes = await request(app)
        .post('/auth/login')
        .send({ phone: '1234567890', actorType: 'CUSTOMER' });

      const { accessToken } = loginRes.body.data.tokens;

      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.phone).toBe('1234567890');
    });
  });
});

import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../app';
import { prisma } from '../../config/prisma';
import { Salon, User, UserRole } from '@prisma/client';
import { createTestUser, createTestSalon, generateToken } from '../../common/utils/test-utils';

describe('Settings Routes', () => {
  let salon: Salon;
  let manager: User;
  let managerToken: string;

  beforeAll(async () => {
    await prisma.$connect();
    salon = await createTestSalon();
    manager = await createTestUser({ salonId: salon.id, role: UserRole.MANAGER });
    managerToken = generateToken({ actorId: manager.id, actorType: 'USER' });
  });

  afterAll(async () => {
    await prisma.settings.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.salon.deleteMany({});
    await prisma.$disconnect();
  });

  describe('GET /salons/:salonId/settings', () => {
    it('should return settings for a salon', async () => {
      const res = await request(app)
        .get(`/api/v1/salons/${salon.id}/settings`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.salonId).toBe(salon.id);
    });
  });

  describe('PATCH /salons/:salonId/settings', () => {
    it('should update settings for a salon', async () => {
      const updatePayload = {
        timeZone: 'Asia/Tehran',
        workStartTime: '09:00',
        workEndTime: '18:00',
        allowOnlineBooking: true,
      };

      const res = await request(app)
        .patch(`/api/v1/salons/${salon.id}/settings`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send(updatePayload);

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.timeZone).toBe(updatePayload.timeZone);
      expect(res.body.data.workStartTime).toBe(updatePayload.workStartTime);
      expect(res.body.data.allowOnlineBooking).toBe(true);
    });

    it('should return 400 for invalid workStartTime format', async () => {
      const res = await request(app)
        .patch(`/api/v1/salons/${salon.id}/settings`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ workStartTime: '9:00' }); // Invalid format, should be HH:mm

      expect(res.status).toBe(httpStatus.BAD_REQUEST);
    });
  });
});

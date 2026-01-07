import request from 'supertest';
import app from '../../app';
import { prisma } from '../../config/prisma';
import { UserRole } from '@prisma/client';
import createHttpError from 'http-errors';

jest.mock('../../common/middleware/auth', () => ({
  authMiddleware: (req, res, next) => {
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(' ')[1];
      if (token === 'mock-manager-token') {
        req.actor = { id: 'mock-manager-id', role: UserRole.MANAGER, salonId: req.params.salonId };
      } else if (token === 'mock-staff-token') {
        req.actor = { id: 'mock-staff-id', role: UserRole.STAFF, salonId: req.params.salonId };
      }
      return next();
    }
    return next(createHttpError(401, 'Authorization header is missing or invalid'));
  },
}));

jest.mock('../../common/middleware/requireRole', () => ({
  requireRole: (roles) => (req, res, next) => {
    if (req.actor && roles.includes(req.actor.role)) {
      next();
    } else {
      next(createHttpError(403, 'Forbidden: You do not have the required permissions.'));
    }
  },
}));

describe('Users API Endpoints', () => {
  let salonId: string;
  let managerToken: string;
  let staffToken: string;
  let managerId: string;
  let staffId: string;

  beforeAll(async () => {
    const salon = await prisma.salon.create({
      data: {
        name: 'Test Salon for Users',
        slug: `test-salon-users-${Date.now()}`,
      },
    });
    salonId = salon.id;

    const manager = await prisma.user.create({
      data: {
        salonId,
        fullName: 'Test Manager',
        phone: `+10000000001`,
        role: UserRole.MANAGER,
        isActive: true,
      },
    });
    managerId = manager.id;

    const staff = await prisma.user.create({
      data: {
        salonId,
        fullName: 'Test Staff',
        phone: `+10000000002`,
        role: UserRole.STAFF,
        isActive: true,
      },
    });
    staffId = staff.id;

    managerToken = 'mock-manager-token';
    staffToken = 'mock-staff-token';
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { salonId } });
    await prisma.salon.delete({ where: { id: salonId } });
    await prisma.$disconnect();
  });

  describe('GET /salons/:salonId/staff/:userId', () => {
    it('should return 401 if the request is unauthenticated', async () => {
      const response = await request(app)
        .get(`/api/v1/salons/${salonId}/staff/${staffId}`);

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authorization header is missing or invalid',
        },
      });
    });

    it('should allow any authenticated user of the salon to get a specific staff member', async () => {
      const response = await request(app)
        .get(`/api/v1/salons/${salonId}/staff/${staffId}`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(staffId);
      expect(response.body.data.fullName).toBe('Test Staff');
    });

    it('should return 404 if the user is not found', async () => {
      const nonExistentId = 'clxxxxxxxxxxxxxx';
      const response = await request(app)
        .get(`/api/v1/salons/${salonId}/staff/${nonExistentId}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /salons/:salonId/staff/:userId', () => {
    it('should allow a MANAGER to soft-delete a user', async () => {
      const userToDelete = await prisma.user.create({
        data: {
          salonId,
          fullName: 'To Be Deleted',
          phone: `+10000000003`,
          role: UserRole.STAFF,
        },
      });

      const response = await request(app)
        .delete(`/api/v1/salons/${salonId}/staff/${userToDelete.id}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(response.status).toBe(204);

      const deletedUser = await prisma.user.findUnique({ where: { id: userToDelete.id } });
      expect(deletedUser?.isActive).toBe(false);
    });

    it('should NOT allow a non-MANAGER to delete a user', async () => {
      const response = await request(app)
        .delete(`/api/v1/salons/${salonId}/staff/${managerId}`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Forbidden: You do not have the required permissions.',
        },
      });
    });

    it('should return 404 if the user to delete is not found', async () => {
      const nonExistentId = 'clxxxxxxxxxxxxxx';
      const response = await request(app)
        .delete(`/api/v1/salons/${salonId}/staff/${nonExistentId}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(response.status).toBe(404);
    });
  });
});


import request from 'supertest';
import app from '../../app';
import { prisma } from '../../config/prisma';
import { User, Salon } from '@prisma/client';
import { createTestSalon, createTestUser, generateToken as createToken } from '../../common/utils/test-utils';

describe('Negative Permission (RBAC) E2E Tests', () => {
  let salon: Salon;
  let manager: User;
  let receptionist: User;
  let staff: User;
  let _managerToken: string; // eslint-disable-line @typescript-eslint/no-unused-vars
  let receptionistToken: string;
  let staffToken: string;

  beforeAll(async () => {
    salon = await createTestSalon();
    manager = await createTestUser({ salonId: salon.id, role: 'MANAGER' });
    receptionist = await createTestUser({ salonId: salon.id, role: 'RECEPTIONIST' });
    staff = await createTestUser({ salonId: salon.id, role: 'STAFF' });

    _managerToken = createToken({ actorId: manager.id, actorType: 'USER' });
    receptionistToken = createToken({ actorId: receptionist.id, actorType: 'USER' });
    staffToken = createToken({ actorId: staff.id, actorType: 'USER' });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({});
    await prisma.salon.deleteMany({});
    await prisma.$disconnect();
  });

  describe('Staff Management Routes', () => {
    it('should return 403 Forbidden for RECEPTIONIST trying to create staff', async () => {
      const response = await request(app)
        .post(`/api/v1/salons/${salon.id}/staff`)
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          fullName: 'New Staff',
          phone: '+989129999999',
          role: 'STAFF',
        });
      expect(response.status).toBe(403);
    });

    it('should return 403 Forbidden for STAFF trying to delete another user', async () => {
      const anotherStaff = await createTestUser({ salonId: salon.id, role: 'STAFF' });
      const response = await request(app)
        .delete(`/api/v1/salons/${salon.id}/staff/${anotherStaff.id}`)
        .set('Authorization', `Bearer ${staffToken}`);
      expect(response.status).toBe(403);
    });
  });

  describe('Service Management Routes', () => {
    it('should return 403 Forbidden for RECEPTIONIST trying to create a service', async () => {
      const response = await request(app)
        .post(`/api/v1/salons/${salon.id}/services`)
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          name: 'New Service',
          durationMinutes: 30,
          price: 10000,
          currency: 'IRR',
        });
      expect(response.status).toBe(403);
    });
  });

  describe('Booking Management Routes', () => {
    it('should return 403 Forbidden for STAFF trying to create a booking', async () => {
      // This test requires a more complex setup with services and customers,
      // but we can test the role guard with a minimal payload.
      const response = await request(app)
        .post(`/api/v1/salons/${salon.id}/bookings`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({}); // Minimal payload to trigger the role guard
      expect(response.status).toBe(403);
    });
  });
});

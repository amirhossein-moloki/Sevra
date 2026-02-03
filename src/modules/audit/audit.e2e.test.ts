
import request from 'supertest';
import app from '../../app';
import { prisma } from '../../config/prisma';
import {
  createTestSalon,
  createTestUser,
  createTestBooking,
  createTestService,
  generateToken,
} from '../../common/utils/test-utils';
import { BookingStatus, UserRole } from '@prisma/client';

describe('Audit Logging E2E', () => {
  let salon: any;
  let manager: any;
  let managerToken: string;
  let staff: any;
  let staffToken: string;

  beforeAll(async () => {
    salon = await createTestSalon({ name: 'Audit Salon', slug: 'audit-salon' });
    manager = await createTestUser({ salonId: salon.id, role: UserRole.MANAGER });
    managerToken = generateToken({ actorId: manager.id, actorType: 'USER', sessionId: 'test-session-id' });

    staff = await createTestUser({ salonId: salon.id, role: UserRole.STAFF });
    staffToken = generateToken({ actorId: staff.id, actorType: 'USER', sessionId: 'test-session-id' });
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({ where: { salonId: salon.id } });
    await prisma.booking.deleteMany({ where: { salonId: salon.id } });
    await prisma.user.deleteMany({ where: { salonId: salon.id } });
    await prisma.salon.delete({ where: { id: salon.id } });
  });

  it('should generate an audit log when a booking is canceled', async () => {
    const service = await createTestService({ salonId: salon.id });
    const booking = await createTestBooking({
      salonId: salon.id,
      serviceId: service.id,
      staffId: staff.id,
    });

    // Cancel the booking
    const response = await request(app)
      .post(`/api/v1/salons/${salon.id}/bookings/${booking.id}/cancel`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ reason: 'Client requested' });

    expect(response.status).toBe(200);

    // Verify audit log exists
    const auditLog = await prisma.auditLog.findFirst({
      where: {
        salonId: salon.id,
        action: 'BOOKING_CANCEL',
        entityId: booking.id,
      },
    });

    expect(auditLog).toBeDefined();
    expect(auditLog?.actorId).toBe(manager.id);
    expect((auditLog?.newData as any).status).toBe(BookingStatus.CANCELED);
  });

  it('should allow manager to retrieve audit logs', async () => {
    const response = await request(app)
      .get(`/api/v1/salons/${salon.id}/audit-logs`)
      .set('Authorization', `Bearer ${managerToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.data[0].action).toBe('BOOKING_CANCEL');
  });

  it('should deny staff from retrieving audit logs', async () => {
    const response = await request(app)
      .get(`/api/v1/salons/${salon.id}/audit-logs`)
      .set('Authorization', `Bearer ${staffToken}`);

    expect(response.status).toBe(403);
  });

  it('should generate an audit log when a user is updated', async () => {
      const response = await request(app)
        .patch(`/api/v1/salons/${salon.id}/staff/${staff.id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ fullName: 'Updated Staff Name' });

      expect(response.status).toBe(200);

      const auditLog = await prisma.auditLog.findFirst({
        where: {
          salonId: salon.id,
          action: 'USER_UPDATE',
          entityId: staff.id,
        },
      });

      expect(auditLog).toBeDefined();
      expect((auditLog?.newData as any).fullName).toBe('Updated Staff Name');
  });
});

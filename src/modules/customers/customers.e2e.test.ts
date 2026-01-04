import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../app';
import { prisma } from '../../config/prisma';
import cuid from 'cuid';
import { Salon, User, UserRole } from '@prisma/client';
import { createTestUser, createTestSalon, generateToken } from '../../common/utils/test-utils';

describe('Customer Routes', () => {
  let salon: Salon;
  let manager: User;
  let receptionist: User;
  let staff: User;
  let managerToken: string;
  let receptionistToken: string;
  let staffToken: string;

  beforeAll(async () => {
    await prisma.$connect();
    salon = await createTestSalon();
    manager = await createTestUser({ salonId: salon.id, role: UserRole.MANAGER });
    receptionist = await createTestUser({ salonId: salon.id, role: UserRole.RECEPTIONIST, phone: '09120000001' });
    staff = await createTestUser({ salonId: salon.id, role: UserRole.STAFF, phone: '09120000002' });

    managerToken = generateToken({ actorId: manager.id, actorType: 'USER' });
    receptionistToken = generateToken({ actorId: receptionist.id, actorType: 'USER' });
    staffToken = generateToken({ actorId: staff.id, actorType: 'USER' });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({});
    await prisma.salon.deleteMany({});
    await prisma.$disconnect();
  });

  afterEach(async () => {
      await prisma.salonCustomerProfile.deleteMany({});
      await prisma.customerAccount.deleteMany({});
  });


  describe('POST /api/v1/salons/:salonId/customers', () => {
    it('should create a new customer and return 201', async () => {
      const newCustomer = {
        phone: '09121234567',
        fullName: 'Test Customer',
        displayName: 'Test',
      };

      const res = await request(app)
        .post(`/api/v1/salons/${salon.id}/customers`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send(newCustomer);

      expect(res.status).toBe(httpStatus.CREATED);
      expect(res.body.displayName).toBe(newCustomer.displayName);
      expect(res.body.customerAccount.phone).toBe(newCustomer.phone);
    });

    it('should return 409 if customer phone already exists in the salon', async () => {
      const newCustomer = {
        phone: '09121234568',
        fullName: 'Existing Customer',
      };
      // Create customer once
      await request(app)
        .post(`/api/v1/salons/${salon.id}/customers`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send(newCustomer);

      // Try to create again
      const res = await request(app)
        .post(`/api/v1/salons/${salon.id}/customers`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send(newCustomer);

      expect(res.status).toBe(httpStatus.CONFLICT);
    });

     it('should return 400 for invalid data', async () => {
        const res = await request(app)
        .post(`/api/v1/salons/${salon.id}/customers`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ fullName: 'Only Name' });

        expect(res.status).toBe(httpStatus.BAD_REQUEST);
     });

     it('should return 403 if user is not a manager or receptionist', async () => {
        const newCustomer = {
            phone: '09121234569',
            fullName: 'Forbidden Customer',
        };
        const res = await request(app)
            .post(`/api/v1/salons/${salon.id}/customers`)
            .set('Authorization', `Bearer ${staffToken}`)
            .send(newCustomer);

        expect(res.status).toBe(httpStatus.FORBIDDEN);
    });
  });

  describe('GET /api/v1/salons/:salonId/customers', () => {
      let customer1: any;
      let customer2: any;

      beforeEach(async () => {
        const res1 = await request(app)
          .post(`/api/v1/salons/${salon.id}/customers`)
          .set('Authorization', `Bearer ${receptionistToken}`)
          .send({ phone: '09100000001', fullName: 'Alice' });
        customer1 = res1.body;

        const res2 = await request(app)
          .post(`/api/v1/salons/${salon.id}/customers`)
          .set('Authorization', `Bearer ${receptionistToken}`)
          .send({ phone: '09100000002', fullName: 'Bob' });
        customer2 = res2.body;
      });

      it('should return a list of customers', async () => {
        const res = await request(app)
            .get(`/api/v1/salons/${salon.id}/customers`)
            .set('Authorization', `Bearer ${staffToken}`);

        expect(res.status).toBe(httpStatus.OK);
        expect(res.body.customers).toHaveLength(2);
        expect(res.body.total).toBe(2);
      });

      it('should filter customers by search query', async () => {
        const res = await request(app)
            .get(`/api/v1/salons/${salon.id}/customers?search=Alice`)
            .set('Authorization', `Bearer ${staffToken}`);

        expect(res.status).toBe(httpStatus.OK);
        expect(res.body.customers).toHaveLength(1);
        expect(res.body.customers[0].id).toBe(customer1.id);
      });
  });

  describe('GET /api/v1/salons/:salonId/customers/:customerId', () => {
    it('should get a customer by id', async () => {
      const newCustomer = {
        phone: '09121112233',
        fullName: 'Single Customer',
      };
      const creationRes = await request(app)
        .post(`/api/v1/salons/${salon.id}/customers`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send(newCustomer);
      const customerId = creationRes.body.id;

      const res = await request(app)
        .get(`/api/v1/salons/${salon.id}/customers/${customerId}`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.id).toBe(customerId);
    });

    it('should return 404 for a non-existent customer', async () => {
        const nonExistentId = cuid();
        const res = await request(app)
            .get(`/api/v1/salons/${salon.id}/customers/${nonExistentId}`)
            .set('Authorization', `Bearer ${staffToken}`);

        expect(res.status).toBe(httpStatus.NOT_FOUND);
    });
  });

  describe('PUT /api/v1/salons/:salonId/customers/:customerId', () => {
    it('should update a customer and return 200', async () => {
       const newCustomer = {
        phone: '09351112233',
        fullName: 'Update Me',
      };
      const creationRes = await request(app)
        .post(`/api/v1/salons/${salon.id}/customers`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send(newCustomer);
      const customerId = creationRes.body.id;

      const updatePayload = {
          displayName: "I'm Updated",
          note: "This is a note."
      };

      const res = await request(app)
        .put(`/api/v1/salons/${salon.id}/customers/${customerId}`)
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send(updatePayload);

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.displayName).toBe(updatePayload.displayName);
      expect(res.body.note).toBe(updatePayload.note);
    });
  });

  describe('DELETE /api/v1/salons/:salonId/customers/:customerId', () => {
    it('should delete a customer and return 204', async () => {
       const newCustomer = {
        phone: '09361112233',
        fullName: 'Delete Me',
      };
      const creationRes = await request(app)
        .post(`/api/v1/salons/${salon.id}/customers`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send(newCustomer);
      const customerId = creationRes.body.id;

      const res = await request(app)
        .delete(`/api/v1/salons/${salon.id}/customers/${customerId}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(httpStatus.NO_CONTENT);

      // Verify it's gone
       const getRes = await request(app)
        .get(`/api/v1/salons/${salon.id}/customers/${customerId}`)
        .set('Authorization', `Bearer ${managerToken}`);
      expect(getRes.status).toBe(httpStatus.NOT_FOUND);
    });
  });

});

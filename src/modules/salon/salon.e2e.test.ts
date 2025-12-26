import request from "supertest";
import { PrismaClient, UserRole } from "@prisma/client";
import app from "../../app";
import jwt from "jsonwebtoken";
import argon2 from "argon2";
import { env } from "../../config/env";

const prisma = new PrismaClient();

describe("Salon API - E2E with Auth", () => {
  let managerToken: string;
  let staffToken: string;
  let testSalonId: string;
  let createdSalonId: string; // To store the ID of the salon created via API

  beforeAll(async () => {
    // 1. Clean database
    await prisma.user.deleteMany();
    await prisma.salon.deleteMany();

    // 2. Create a test salon for users to belong to
    const salon = await prisma.salon.create({
      data: {
        name: "Auth Test Salon",
        slug: "auth-test-salon",
      },
    });
    testSalonId = salon.id;

    // 3. Create a MANAGER user
    const manager = await prisma.user.create({
      data: {
        salonId: testSalonId,
        fullName: "Manager User",
        phone: "1111111111",
        passwordHash: await argon2.hash("password123"),
        role: UserRole.MANAGER,
      },
    });

    // 4. Create a STAFF user
    const staff = await prisma.user.create({
      data: {
        salonId: testSalonId,
        fullName: "Staff User",
        phone: "2222222222",
        passwordHash: await argon2.hash("password123"),
        role: UserRole.STAFF,
      },
    });

    // 5. Generate JWTs for tests
    const tokenPayloadManager = { actorId: manager.id, actorType: "USER", role: manager.role, salonId: manager.salonId };
    managerToken = jwt.sign(tokenPayloadManager, env.JWT_ACCESS_SECRET, { expiresIn: "15m" });

    const tokenPayloadStaff = { actorId: staff.id, actorType: "USER", role: staff.role, salonId: staff.salonId };
    staffToken = jwt.sign(tokenPayloadStaff, env.JWT_ACCESS_SECRET, { expiresIn: "15m" });
  });

  afterAll(async () => {
    // Clean up all test data
    await prisma.user.deleteMany();
    await prisma.salon.deleteMany();
    await prisma.$disconnect();
  });

  describe("POST /api/v1/salons", () => {
    const newSalonData = {
      name: "New E2E Salon",
      slug: "new-e2e-salon",
      ownerId: "user-id-placeholder", // ownerId is now required by validation
    };

    it("should return 401 Unauthorized if no token is provided", async () => {
      await request(app).post("/api/v1/salons").send(newSalonData).expect(401);
    });

    it("should create a new salon and return 201 if the user is STAFF", async () => {
      const staffSalonData = { ...newSalonData, name: "Staff Salon", slug: "staff-salon" };
      const response = await request(app)
        .post("/api/v1/salons")
        .set("Authorization", `Bearer ${staffToken}`)
        .send(staffSalonData)
        .expect(201);

      expect(response.body.data.name).toBe(staffSalonData.name);
      expect(response.body.data.slug).toBe(staffSalonData.slug);
    });

    it("should create a new salon and return 201 if the user is a MANAGER", async () => {
      const response = await request(app)
        .post("/api/v1/salons")
        .set("Authorization", `Bearer ${managerToken}`)
        .send(newSalonData)
        .expect(201);

      expect(response.body.data.name).toBe(newSalonData.name);
      expect(response.body.data.slug).toBe(newSalonData.slug);
      createdSalonId = response.body.data.id; // Save for later tests
    });
  });

  describe("PATCH /api/v1/salons/:id", () => {
    const updateData = { name: "Updated Salon Name" };

    it("should return 401 Unauthorized if no token is provided", async () => {
      await request(app).patch(`/api/v1/salons/${createdSalonId}`).send(updateData).expect(401);
    });

    it("should return 403 Forbidden if the user is not a MANAGER", async () => {
      await request(app)
        .patch(`/api/v1/salons/${createdSalonId}`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send(updateData)
        .expect(403);
    });

    it("should update the salon and return 200 if the user is a MANAGER", async () => {
      const response = await request(app)
        .patch(`/api/v1/salons/${createdSalonId}`)
        .set("Authorization", `Bearer ${managerToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.name).toBe(updateData.name);
    });
  });

  describe("DELETE /api/v1/salons/:id", () => {
    it("should return 401 Unauthorized if no token is provided", async () => {
      await request(app).delete(`/api/v1/salons/${createdSalonId}`).expect(401);
    });

    it("should return 403 Forbidden if the user is not a MANAGER", async () => {
      await request(app)
        .delete(`/api/v1/salons/${createdSalonId}`)
        .set("Authorization", `Bearer ${staffToken}`)
        .expect(403);
    });

    it("should soft delete the salon and return 200 if the user is a MANAGER", async () => {
      await request(app)
        .delete(`/api/v1/salons/${createdSalonId}`)
        .set("Authorization", `Bearer ${managerToken}`)
        .expect(200);

      const salon = await prisma.salon.findUnique({ where: { id: createdSalonId } });
      expect(salon?.isActive).toBe(false);
    });
  });

  describe("GET /api/v1/salons (Public)", () => {
    it("should still be public and return a list of active salons", async () => {
        const response = await request(app).get("/api/v1/salons").expect(200);
        expect(Array.isArray(response.body.data)).toBe(true);
        // Should only contain the initial salon, as the other was soft-deleted
        expect(response.body.data.length).toBe(1);
        expect(response.body.data[0].id).toBe(testSalonId);
    });
  });
});

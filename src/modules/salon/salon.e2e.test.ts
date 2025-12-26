import request from "supertest";
import { PrismaClient } from "@prisma/client";
import app from "../../app";

const prisma = new PrismaClient();

describe("Salon API - E2E", () => {
  let salonId: string; // Variable to hold the created salon's ID

  beforeAll(async () => {
    // Clean the database before running tests
    await prisma.salon.deleteMany();
  });

  afterAll(async () => {
    // Clean up created test data
    await prisma.salon.deleteMany();
    // Disconnect Prisma client
    await prisma.$disconnect();
  });

  describe("POST /api/v1/salons", () => {
    it("should create a new salon and return 201", async () => {
      const newSalon = {
        name: "Test Salon",
        slug: "test-salon-e2e",
        ownerId: "clx2j2qj800003b6j2k7q5b5h", // Mock owner ID
      };

      const response = await request(app)
        .post("/api/v1/salons")
        .send(newSalon)
        .expect(201);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.name).toBe(newSalon.name);
      expect(response.body.data.slug).toBe(newSalon.slug);
      expect(response.body.data.isActive).toBe(true);

      salonId = response.body.data.id; // Save the ID for later tests
    });

    it("should return 409 if slug already exists", async () => {
      const newSalon = {
        name: "Another Test Salon",
        slug: "test-salon-e2e", // Same slug as the previous test
        ownerId: "clx2j2qj800003b6j2k7q5b5i",
      };

      await request(app).post("/api/v1/salons").send(newSalon).expect(409);
    });

    it("should return 400 for invalid input data (missing name)", async () => {
      await request(app)
        .post("/api/v1/salons")
        .send({ slug: "invalid-salon", ownerId: "owner-id" })
        .expect(400);
    });
  });

  describe("GET /api/v1/salons", () => {
    it("should return a list of active salons", async () => {
      const response = await request(app).get("/api/v1/salons").expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(1); // Only one active salon so far
      expect(response.body.data[0].slug).toBe("test-salon-e2e");
    });
  });

  describe("GET /api/v1/salons/:id", () => {
    it("should return a single salon by its ID", async () => {
      const response = await request(app)
        .get(`/api/v1/salons/${salonId}`)
        .expect(200);

      expect(response.body.data.id).toBe(salonId);
      expect(response.body.data.name).toBe("Test Salon");
    });

    it("should return 404 for a non-existent salon ID", async () => {
      const nonExistentId = "clx2j2qj800003b6j2k7q5b5h"; // A random CUID
      await request(app).get(`/api/v1/salons/${nonExistentId}`).expect(404);
    });
  });

  describe("PATCH /api/v1/salons/:id", () => {
    it("should update a salon and return the updated data", async () => {
      const updateData = { name: "Updated Test Salon Name" };

      const response = await request(app)
        .patch(`/api/v1/salons/${salonId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.name).toBe(updateData.name);
    });

    it("should return 409 when updating to a conflicting slug", async () => {
      // Create another salon to create a slug conflict
      const conflictingSalon = {
        name: "Conflicting Salon",
        slug: "conflicting-slug",
        ownerId: "owner-id-conflict",
      };
      await request(app).post("/api/v1/salons").send(conflictingSalon);

      const updateData = { slug: "conflicting-slug" };

      await request(app)
        .patch(`/api/v1/salons/${salonId}`)
        .send(updateData)
        .expect(409);
    });

    it("should return 404 when trying to update a non-existent salon", async () => {
      const nonExistentId = "clx2j2qj800003b6j2k7q5b5h";
      await request(app)
        .patch(`/api/v1/salons/${nonExistentId}`)
        .send({ name: "Does not matter" })
        .expect(404);
    });

    it("should return 400 for invalid update data (empty name)", async () => {
      await request(app)
        .patch(`/api/v1/salons/${salonId}`)
        .send({ name: "" })
        .expect(400);
    });
  });

  describe("DELETE /api/v1/salons/:id", () => {
    it("should soft delete a salon and return a success message", async () => {
      await request(app).delete(`/api/v1/salons/${salonId}`).expect(200);

      // Verify it's soft-deleted
      const deletedSalon = await prisma.salon.findUnique({
        where: { id: salonId },
      });
      expect(deletedSalon?.isActive).toBe(false);
    });

    it("should return 404 when trying to delete a non-existent salon", async () => {
      const nonExistentId = "clx2j2qj800003b6j2k7q5b5h";
      await request(app).delete(`/api/v1/salons/${nonExistentId}`).expect(404);
    });

    it("should not include the soft-deleted salon in the GET list", async () => {
      const response = await request(app).get("/api/v1/salons").expect(200);

      // The list should now contain only the 'conflicting-slug' salon
      expect(response.body.data.length).toBe(1);
      expect(
        response.body.data.find((s: any) => s.id === salonId),
      ).toBeUndefined();
    });
  });
});

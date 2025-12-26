import { Router } from "express";
import { salonController } from "./salon.controller";
import { authMiddleware } from "../../common/middleware/auth";
import { requireRole } from "../../common/middleware/requireRole";
import { UserRole } from "@prisma/client";

const router = Router();

// Public routes
router.get("/", salonController.getAllSalons);
router.get("/:id", salonController.getSalonById);

// Protected routes - Require authentication and specific roles
router.post(
  "/",
  authMiddleware,
  salonController.createSalon,
);
router.patch(
  "/:id",
  authMiddleware,
  requireRole([UserRole.MANAGER]),
  salonController.updateSalon,
);
router.delete(
  "/:id",
  authMiddleware,
  requireRole([UserRole.MANAGER]),
  salonController.deleteSalon,
);

export default router;

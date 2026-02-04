import { Request, Response, NextFunction } from "express";
import { salonService } from "./salon.service";
import { createSalonSchema, updateSalonSchema } from "./salon.validation";

export const salonController = {
  async createSalon(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createSalonSchema.parse(req.body);
      const salon = await salonService.createSalon(validatedData);
      res.created(salon);
    } catch (error) {
      next(error);
    }
  },

  async getSalonById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const salon = await salonService.getSalonById(id);
      res.ok(salon);
    } catch (error) {
      next(error);
    }
  },

  async getAllSalons(req: Request, res: Response, next: NextFunction) {
    try {
      const salons = await salonService.getAllSalons();
      res.ok(salons);
    } catch (error) {
      next(error);
    }
  },

  async updateSalon(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validatedData = updateSalonSchema.parse(req.body);
      const updatedSalon = await salonService.updateSalon(id, validatedData);
      res.ok(updatedSalon);
    } catch (error) {
      next(error);
    }
  },

  async deleteSalon(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await salonService.deleteSalon(id);
      res.noContent();
    } catch (error) {
      next(error);
    }
  },
};

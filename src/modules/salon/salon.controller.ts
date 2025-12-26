import { Request, Response, NextFunction } from 'express';
import { salonService } from './salon.service';
import { createSalonSchema, updateSalonSchema } from './salon.validation';

export const salonController = {
  async createSalon(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createSalonSchema.parse(req.body);
      const salon = await salonService.createSalon(validatedData);
      // Assuming res.created is available from a custom middleware
      (res as any).created(salon);
    } catch (error) {
      next(error);
    }
  },

  async getSalonById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const salon = await salonService.getSalonById(id);
      // Assuming res.ok is available from a custom middleware
      (res as any).ok(salon);
    } catch (error) {
      next(error);
    }
  },

  async getAllSalons(req: Request, res: Response, next: NextFunction) {
    try {
      const salons = await salonService.getAllSalons();
      (res as any).ok(salons);
    } catch (error) {
      next(error);
    }
  },

  async updateSalon(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validatedData = updateSalonSchema.parse(req.body);
      const updatedSalon = await salonService.updateSalon(id, validatedData);
      (res as any).ok(updatedSalon);
    } catch (error) {
      next(error);
    }
  },

  async deleteSalon(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await salonService.deleteSalon(id);
      (res as any).ok({ message: 'Salon deleted successfully' });
    } catch (error) {
      next(error);
    }
  },
};

import createHttpError from "http-errors";
import { salonRepository } from "./salon.repository";
import { CreateSalonInput, UpdateSalonInput } from "./salon.types";

export const salonService = {
  async createSalon(data: CreateSalonInput) {
    const existingSalon = await salonRepository.findBySlug(data.slug);
    if (existingSalon) {
      throw createHttpError(409, "A salon with this slug already exists");
    }
    return salonRepository.create(data);
  },

  async getSalonById(id: string) {
    const salon = await salonRepository.findById(id);
    if (!salon) {
      throw createHttpError(404, "Salon not found");
    }
    return salon;
  },

  async getAllSalons() {
    return salonRepository.findAll();
  },

  async updateSalon(id: string, data: UpdateSalonInput) {
    const salon = await salonRepository.findById(id);
    if (!salon) {
      throw createHttpError(404, "Salon not found");
    }

    if (data.slug && data.slug !== salon.slug) {
      const existingSalon = await salonRepository.findBySlug(data.slug);
      if (existingSalon) {
        throw createHttpError(409, "A salon with this slug already exists");
      }
    }

    return salonRepository.update(id, data);
  },

  async deleteSalon(id: string) {
    const salon = await salonRepository.findById(id);
    if (!salon) {
      throw createHttpError(404, "Salon not found");
    }
    return salonRepository.softDelete(id);
  },
};

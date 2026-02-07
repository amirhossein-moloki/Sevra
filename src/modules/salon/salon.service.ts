import AppError from '../../common/errors/AppError';
import httpStatus from 'http-status';
import { salonRepository } from './salon.repository';
import { CreateSalonInput, UpdateSalonInput } from './salon.types';

export const salonService = {
  async createSalon(data: CreateSalonInput) {
    const existingSalon = await salonRepository.findBySlug(data.slug);
    if (existingSalon) {
      throw new AppError('A salon with this slug already exists', httpStatus.CONFLICT);
    }
    return salonRepository.create(data);
  },

  async getSalonById(id: string) {
    const salon = await salonRepository.findById(id);
    if (!salon) {
      throw new AppError('Salon not found', httpStatus.NOT_FOUND);
    }
    return salon;
  },

  async getAllSalons() {
    return salonRepository.findAll();
  },

  async updateSalon(id: string, data: UpdateSalonInput) {
    const salon = await salonRepository.findById(id);
    if (!salon) {
      throw new AppError('Salon not found', httpStatus.NOT_FOUND);
    }

    if (data.slug && data.slug !== salon.slug) {
      const existingSalon = await salonRepository.findBySlug(data.slug);
      if (existingSalon) {
        throw new AppError('A salon with this slug already exists', httpStatus.CONFLICT);
      }
    }

    return salonRepository.update(id, data);
  },

  async deleteSalon(id: string) {
    const salon = await salonRepository.findById(id);
    if (!salon) {
      throw new AppError('Salon not found', httpStatus.NOT_FOUND);
    }
    return salonRepository.softDelete(id);
  },
};

import { SalonLink } from '@prisma/client';
import { LinksRepo } from './links.repo';
import AppError from '../../common/errors/AppError';
import httpStatus from 'http-status';

export const LinksService = {
  async getLinks(salonId: string): Promise<SalonLink[]> {
    return LinksRepo.findBySalonId(salonId);
  },

  async createLink(salonId: string, data: any): Promise<SalonLink> {
    return LinksRepo.create(salonId, data);
  },

  async updateLink(salonId: string, linkId: string, data: any): Promise<SalonLink> {
    const link = await LinksRepo.findById(linkId);
    if (!link || link.salonId !== salonId) {
      throw new AppError('Link not found', httpStatus.NOT_FOUND);
    }
    return LinksRepo.update(linkId, data);
  },

  async deleteLink(salonId: string, linkId: string): Promise<void> {
    const link = await LinksRepo.findById(linkId);
    if (!link || link.salonId !== salonId) {
      throw new AppError('Link not found', httpStatus.NOT_FOUND);
    }
    await LinksRepo.delete(linkId);
  },
};

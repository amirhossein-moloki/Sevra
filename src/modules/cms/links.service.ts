import { SalonLink } from '@prisma/client';
import { LinksRepo } from './links.repo';
import createHttpError from 'http-errors';

export class LinksService {
  private repo: LinksRepo;

  constructor() {
    this.repo = new LinksRepo();
  }

  async getLinks(salonId: string): Promise<SalonLink[]> {
    return this.repo.findBySalonId(salonId);
  }

  async createLink(salonId: string, data: any): Promise<SalonLink> {
    return this.repo.create(salonId, data);
  }

  async updateLink(salonId: string, linkId: string, data: any): Promise<SalonLink> {
    const link = await this.repo.findById(linkId);
    if (!link || link.salonId !== salonId) {
      throw createHttpError(404, 'Link not found');
    }
    return this.repo.update(linkId, data);
  }

  async deleteLink(salonId: string, linkId: string): Promise<void> {
    const link = await this.repo.findById(linkId);
    if (!link || link.salonId !== salonId) {
      throw createHttpError(404, 'Link not found');
    }
    await this.repo.delete(linkId);
  }
}

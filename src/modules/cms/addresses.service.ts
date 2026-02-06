import { SalonAddress } from '@prisma/client';
import { AddressesRepo } from './addresses.repo';
import createHttpError from 'http-errors';

export class AddressesService {
  private repo: AddressesRepo;

  constructor() {
    this.repo = new AddressesRepo();
  }

  async getAddresses(salonId: string): Promise<SalonAddress[]> {
    return this.repo.findBySalonId(salonId);
  }

  async createAddress(salonId: string, data: any): Promise<SalonAddress> {
    return this.repo.create(salonId, data);
  }

  async updateAddress(salonId: string, addressId: string, data: any): Promise<SalonAddress> {
    const address = await this.repo.findById(addressId);
    if (!address || address.salonId !== salonId) {
      throw createHttpError(404, 'Address not found');
    }
    return this.repo.update(addressId, data);
  }

  async deleteAddress(salonId: string, addressId: string): Promise<void> {
    const address = await this.repo.findById(addressId);
    if (!address || address.salonId !== salonId) {
      throw createHttpError(404, 'Address not found');
    }
    await this.repo.delete(addressId);
  }
}

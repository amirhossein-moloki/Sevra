import { SalonAddress } from '@prisma/client';
import { AddressesRepo } from './addresses.repo';
import AppError from '../../common/errors/AppError';
import httpStatus from 'http-status';

export const AddressesService = {
  async getAddresses(salonId: string): Promise<SalonAddress[]> {
    return AddressesRepo.findBySalonId(salonId);
  },

  async createAddress(salonId: string, data: any): Promise<SalonAddress> {
    return AddressesRepo.create(salonId, data);
  },

  async updateAddress(salonId: string, addressId: string, data: any): Promise<SalonAddress> {
    const address = await AddressesRepo.findById(addressId);
    if (!address || address.salonId !== salonId) {
      throw new AppError('Address not found', httpStatus.NOT_FOUND);
    }
    return AddressesRepo.update(addressId, data);
  },

  async deleteAddress(salonId: string, addressId: string): Promise<void> {
    const address = await AddressesRepo.findById(addressId);
    if (!address || address.salonId !== salonId) {
      throw new AppError('Address not found', httpStatus.NOT_FOUND);
    }
    await AddressesRepo.delete(addressId);
  },
};

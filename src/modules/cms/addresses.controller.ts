import { Request, Response, NextFunction } from 'express';
import { AddressesService } from './addresses.service';

export const getAddresses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { salonId } = req.params;
    const addresses = await AddressesService.getAddresses(salonId);
    res.ok(addresses);
  } catch (error) {
    next(error);
  }
};

export const createAddress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { salonId } = req.params;
    const address = await AddressesService.createAddress(salonId, req.body);
    res.created(address);
  } catch (error) {
    next(error);
  }
};

export const updateAddress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { salonId, addressId } = req.params;
    const address = await AddressesService.updateAddress(salonId, addressId, req.body);
    res.ok(address);
  } catch (error) {
    next(error);
  }
};

export const deleteAddress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { salonId, addressId } = req.params;
    await AddressesService.deleteAddress(salonId, addressId);
    res.noContent();
  } catch (error) {
    next(error);
  }
};

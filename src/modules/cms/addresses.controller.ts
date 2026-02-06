import { Request, Response, NextFunction } from 'express';
import { AddressesService } from './addresses.service';

const service = new AddressesService();

export const getAddresses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { salonId } = req.params;
    const addresses = await service.getAddresses(salonId);
    res.ok(addresses);
  } catch (error) {
    next(error);
  }
};

export const createAddress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { salonId } = req.params;
    const address = await service.createAddress(salonId, req.body);
    res.created(address);
  } catch (error) {
    next(error);
  }
};

export const updateAddress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { salonId, addressId } = req.params;
    const address = await service.updateAddress(salonId, addressId, req.body);
    res.ok(address);
  } catch (error) {
    next(error);
  }
};

export const deleteAddress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { salonId, addressId } = req.params;
    await service.deleteAddress(salonId, addressId);
    res.noContent();
  } catch (error) {
    next(error);
  }
};

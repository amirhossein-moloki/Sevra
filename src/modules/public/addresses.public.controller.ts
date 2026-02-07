import { Request, Response } from 'express';
import AppError from '../../common/errors/AppError';
import httpStatus from 'http-status';
import * as PublicAddressesService from './addresses.public.service';

type PublicSalonRequest = Request & {
  tenant?: { salonId: string; salonSlug: string };
};

export async function getPublicAddresses(req: PublicSalonRequest, res: Response) {
  const salonId = req.tenant?.salonId;

  if (!salonId) {
    throw new AppError('Salon context is missing from the request.', httpStatus.BAD_REQUEST);
  }

  const addresses = await PublicAddressesService.getPublicAddressesBySalon(salonId);
  res.ok(addresses);
}

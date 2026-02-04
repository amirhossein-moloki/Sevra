import { Request, Response } from 'express';
import createHttpError from 'http-errors';
import * as PublicAddressesService from './addresses.public.service';

type PublicSalonRequest = Request & {
  tenant?: { salonId: string; salonSlug: string };
};

export async function getPublicAddresses(req: PublicSalonRequest, res: Response) {
  const salonId = req.tenant?.salonId;

  if (!salonId) {
    throw createHttpError(400, 'Salon context is missing from the request.');
  }

  const addresses = await PublicAddressesService.getPublicAddressesBySalon(salonId);
  res.ok(addresses);
}

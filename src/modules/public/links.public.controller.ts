import { Request, Response } from 'express';
import AppError from '../../common/errors/AppError';
import httpStatus from 'http-status';
import * as PublicLinksService from './links.public.service';

type PublicSalonRequest = Request & {
  tenant?: { salonId: string; salonSlug: string };
};

export async function getPublicLinks(req: PublicSalonRequest, res: Response) {
  const salonId = req.tenant?.salonId;

  if (!salonId) {
    throw new AppError('Salon context is missing from the request.', httpStatus.BAD_REQUEST);
  }

  const links = await PublicLinksService.getPublicLinksBySalon(salonId);
  res.ok(links);
}

import { Request, Response } from 'express';
import createHttpError from 'http-errors';
import * as PublicLinksService from './links.public.service';

type PublicSalonRequest = Request & {
  tenant?: { salonId: string; salonSlug: string };
};

export async function getPublicLinks(req: PublicSalonRequest, res: Response) {
  const salonId = req.tenant?.salonId;

  if (!salonId) {
    throw createHttpError(400, 'Salon context is missing from the request.');
  }

  const links = await PublicLinksService.getPublicLinksBySalon(salonId);
  res.ok(links);
}

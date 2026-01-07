import { Request, Response } from 'express';
import createHttpError from 'http-errors';
import * as PublicMediaService from './media.public.service';

type PublicSalonRequest = Request & {
  tenant?: { salonId: string; salonSlug: string };
};

export async function getPublicMedia(req: PublicSalonRequest, res: Response) {
  const salonId = req.tenant?.salonId;

  if (!salonId) {
    throw createHttpError(400, 'Salon context is missing from the request.');
  }

  const media = await PublicMediaService.getPublicMediaBySalon(salonId);
  res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=300');
  res.status(200).json({ success: true, data: media });
}

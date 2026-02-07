import { Request, Response } from 'express';
import AppError from '../../common/errors/AppError';
import httpStatus from 'http-status';
import * as PublicMediaService from './media.public.service';

type PublicSalonRequest = Request & {
  tenant?: { salonId: string; salonSlug: string };
};

export async function getPublicMedia(req: PublicSalonRequest, res: Response) {
  const salonId = req.tenant?.salonId;

  if (!salonId) {
    throw new AppError('Salon context is missing from the request.', httpStatus.BAD_REQUEST);
  }

  const media = await PublicMediaService.getPublicMediaBySalon(salonId);
  res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=300');
  res.ok(media);
}

import { Request, Response } from 'express';
import * as MediaService from './media.service';
import { CreateMediaInput, UpdateMediaInput } from './media.types';

export async function createMedia(
  req: Request<{ salonId: string }, unknown, CreateMediaInput>,
  res: Response
) {
  const { salonId } = req.params;
  const media = await MediaService.createMedia(salonId, req.body);
  res.status(201).json({ success: true, data: media });
}

export async function updateMedia(
  req: Request<{ salonId: string; mediaId: string }, unknown, UpdateMediaInput>,
  res: Response
) {
  const { salonId, mediaId } = req.params;
  const media = await MediaService.updateMedia(salonId, mediaId, req.body);
  res.status(200).json({ success: true, data: media });
}

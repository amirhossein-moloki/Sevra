import { Request, Response, NextFunction } from 'express';
import createHttpError from 'http-errors';
import * as UploadService from '../../common/services/upload.service';
import * as MediaService from './media.service';

export async function uploadMedia(
  req: Request<{ salonId: string }>,
  res: Response,
  next: NextFunction
) {
  try {
    const { salonId } = req.params;
    const file = req.file;

    if (!file) {
      throw createHttpError(400, 'No file uploaded.');
    }

    // Process image: save original and generate thumbnail
    const { url, thumbUrl } = await UploadService.processAndStoreImage(file);

    // Create database record using existing service logic
    // We pass the generated URLs to the service
    const media = await MediaService.createMedia(salonId, {
      ...req.body,
      url,
      thumbUrl,
    });

    res.status(201).json({ success: true, data: media });
  } catch (error) {
    next(error);
  }
}

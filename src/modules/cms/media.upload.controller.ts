import { Request, Response, NextFunction } from 'express';
import AppError from '../../common/errors/AppError';
import httpStatus from 'http-status';
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
      throw new AppError('No file uploaded.', httpStatus.BAD_REQUEST);
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

    res.created(media);
  } catch (error) {
    next(error);
  }
}

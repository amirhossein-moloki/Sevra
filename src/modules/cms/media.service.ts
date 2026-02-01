import createHttpError from 'http-errors';
import { MediaPurpose, MediaType } from '@prisma/client';
import * as MediaRepo from './media.repo';
import { CreateMediaInput, UpdateMediaInput } from './media.types';

const ALT_TEXT_REQUIRED_PURPOSES = new Set<MediaPurpose>([
  MediaPurpose.LOGO,
  MediaPurpose.COVER,
]);

const assertAltTextForPurpose = (
  purpose: MediaPurpose,
  altText: string | null | undefined
) => {
  if (ALT_TEXT_REQUIRED_PURPOSES.has(purpose) && !altText) {
    throw createHttpError(400, 'Alt text is required for logo or cover media.');
  }
};

export async function createMedia(salonId: string, data: CreateMediaInput) {
  const purpose = data.purpose ?? MediaPurpose.GALLERY;
  const type = data.type ?? MediaType.IMAGE;

  assertAltTextForPurpose(purpose, data.altText);

  return MediaRepo.createMedia(salonId, {
    ...data,
    purpose,
    type,
  });
}

export async function updateMedia(
  salonId: string,
  mediaId: string,
  data: UpdateMediaInput
) {
  const existing = await MediaRepo.findMediaById(salonId, mediaId);
  if (!existing) {
    throw createHttpError(404, 'Media not found');
  }

  const nextPurpose = data.purpose ?? existing.purpose;
  const nextAltText = Object.prototype.hasOwnProperty.call(data, 'altText')
    ? data.altText
    : existing.altText;

  assertAltTextForPurpose(nextPurpose, nextAltText);

  return MediaRepo.updateMedia(mediaId, data);
}

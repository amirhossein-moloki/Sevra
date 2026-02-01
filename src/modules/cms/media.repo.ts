import { prisma } from '../../config/prisma';
import { CreateMediaData, UpdateMediaData } from './media.types';

export async function createMedia(salonId: string, data: CreateMediaData) {
  return prisma.salonMedia.create({
    data: {
      ...(data as any),
      salonId,
    },
  });
}

export async function findMediaById(salonId: string, mediaId: string) {
  return prisma.salonMedia.findFirst({
    where: {
      id: mediaId,
      salonId,
    },
  });
}

export async function updateMedia(mediaId: string, data: UpdateMediaData) {
  return prisma.salonMedia.update({
    where: { id: mediaId },
    data,
  });
}

import * as PublicMediaRepo from './media.public.repo';

export async function getPublicMediaBySalon(salonId: string) {
  return PublicMediaRepo.findPublicMediaBySalonId(salonId);
}

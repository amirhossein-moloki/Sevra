import * as PublicLinksRepo from './links.public.repo';

export async function getPublicLinksBySalon(salonId: string) {
  return PublicLinksRepo.findPublicLinksBySalonId(salonId);
}

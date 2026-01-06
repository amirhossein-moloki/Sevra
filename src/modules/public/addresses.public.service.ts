import * as PublicAddressesRepo from './addresses.public.repo';

export async function getPublicAddressesBySalon(salonId: string) {
  return PublicAddressesRepo.findPublicAddressesBySalonId(salonId);
}

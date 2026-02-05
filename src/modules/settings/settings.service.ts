import * as settingsRepo from './settings.repo';
import { UpdateSettingsInput } from './settings.types';

export async function getSettings(salonId: string) {
  const settings = await settingsRepo.findBySalonId(salonId);
  if (!settings) {
    // Should normally be created when salon is created, but handle if missing
    return {
      salonId,
      preventOverlaps: true,
      allowOnlineBooking: false,
      onlineBookingAutoConfirm: false
    };
  }
  return settings;
}

export async function updateSettings(salonId: string, input: UpdateSettingsInput) {
  return settingsRepo.updateBySalonId(salonId, input);
}

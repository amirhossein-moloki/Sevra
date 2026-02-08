import { SessionActorType } from '@prisma/client';
import { auditService } from '../audit/audit.service';
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

export async function updateSettings(
  salonId: string,
  input: UpdateSettingsInput,
  actor: { id: string; actorType: SessionActorType },
  context?: { ip?: string; userAgent?: string }
) {
  const oldSettings = await settingsRepo.findBySalonId(salonId);
  const updatedSettings = await settingsRepo.updateBySalonId(salonId, input);

  await auditService.log(
    salonId,
    actor,
    'SETTINGS_UPDATE',
    { name: 'Settings', id: updatedSettings.id },
    { old: oldSettings, new: updatedSettings },
    context
  );

  return updatedSettings;
}

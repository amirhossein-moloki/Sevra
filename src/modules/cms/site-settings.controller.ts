import { Request, Response } from 'express';
import * as SiteSettingsService from './site-settings.service';
import { UpdateSiteSettingsInput } from './site-settings.validators';

export async function getSiteSettings(
  req: Request<{ salonId: string }>,
  res: Response
) {
  const { salonId } = req.params;
  const settings = await SiteSettingsService.getSiteSettings(salonId);
  res.status(200).json({ data: settings });
}

export async function upsertSiteSettings(
  req: Request<{ salonId: string }, unknown, UpdateSiteSettingsInput>,
  res: Response
) {
  const { salonId } = req.params;
  const settings = await SiteSettingsService.upsertSiteSettings(
    salonId,
    req.body
  );
  res
    .status(200)
    .json({ message: 'Site settings saved successfully', data: settings });
}

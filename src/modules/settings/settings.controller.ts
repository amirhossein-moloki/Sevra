import { Request, Response, NextFunction } from 'express';
import * as settingsService from './settings.service';

export async function getSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const { salonId } = req.params;
    const settings = await settingsService.getSettings(salonId);
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
}

export async function updateSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const { salonId } = req.params;
    const settings = await settingsService.updateSettings(salonId, req.body);
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
}

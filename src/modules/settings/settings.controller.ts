import { Request, Response, NextFunction } from 'express';
import * as settingsService from './settings.service';

export async function getSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const { salonId } = req.params;
    const settings = await settingsService.getSettings(salonId);
    res.ok(settings);
  } catch (error) {
    next(error);
  }
}

export async function updateSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const { salonId } = req.params;
    const settings = await settingsService.updateSettings(
      salonId,
      req.body,
      (req as any).actor, // eslint-disable-line @typescript-eslint/no-explicit-any
      { ip: req.ip, userAgent: req.headers['user-agent'] }
    );
    res.ok(settings);
  } catch (error) {
    next(error);
  }
}

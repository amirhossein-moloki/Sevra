import { Request, Response, NextFunction } from 'express';
import { LinksService } from './links.service';

const service = new LinksService();

export const getLinks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { salonId } = req.params;
    const links = await service.getLinks(salonId);
    res.ok(links);
  } catch (error) {
    next(error);
  }
};

export const createLink = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { salonId } = req.params;
    const link = await service.createLink(salonId, req.body);
    res.created(link);
  } catch (error) {
    next(error);
  }
};

export const updateLink = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { salonId, linkId } = req.params;
    const link = await service.updateLink(salonId, linkId, req.body);
    res.ok(link);
  } catch (error) {
    next(error);
  }
};

export const deleteLink = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { salonId, linkId } = req.params;
    await service.deleteLink(salonId, linkId);
    res.noContent();
  } catch (error) {
    next(error);
  }
};

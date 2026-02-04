import { Request, Response } from 'express';
import * as PagesService from './pages.service';
import { CreatePageInput, UpdatePageInput } from './pages.types';
import { listPagesSchema } from './pages.validators';

export async function createPage(
  req: Request<{ salonId: string }, unknown, CreatePageInput>,
  res: Response
) {
  const { salonId } = req.params;
  const page = await PagesService.createPage(salonId, req.body);
  res.created(page);
}

export async function listPages(req: Request<{ salonId: string }>, res: Response) {
  const { salonId } = req.params;
  const { query } = listPagesSchema.parse({ query: req.query });
  const limit = query.limit ?? 20;
  const offset = query.offset ?? 0;

  const { pages, total } = await PagesService.listPages(salonId, {
    status: query.status,
    type: query.type,
    limit,
    offset,
  });

  res.ok(pages, {
    pagination: {
      total,
      pageSize: limit,
      page: Math.floor(offset / limit) + 1,
    },
  });
}

export async function updatePage(
  req: Request<{ salonId: string; pageId: string }, unknown, UpdatePageInput>,
  res: Response
) {
  const { salonId, pageId } = req.params;
  const page = await PagesService.updatePage(salonId, pageId, req.body);
  res.ok(page);
}

export async function getPage(
  req: Request<{ salonId: string; pageId: string }>,
  res: Response
) {
  const { salonId, pageId } = req.params;
  const page = await PagesService.getPage(salonId, pageId);
  res.ok(page);
}

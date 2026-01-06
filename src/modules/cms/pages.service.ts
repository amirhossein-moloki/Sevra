import createHttpError from 'http-errors';
import { PageStatus, PageType } from '@prisma/client';
import * as PagesRepo from './pages.repo';
import { CreatePageInput, UpdatePageInput } from './pages.types';

const resolvePublishedAt = (
  status: PageStatus,
  publishedAt?: string,
  existingPublishedAt?: Date | null
) => {
  if (status !== PageStatus.PUBLISHED) {
    return null;
  }

  if (publishedAt) {
    return new Date(publishedAt);
  }

  return existingPublishedAt ?? new Date();
};

export async function createPage(salonId: string, data: CreatePageInput) {
  const status = data.status ?? PageStatus.DRAFT;
  const publishedAt = resolvePublishedAt(status, data.publishedAt);

  return PagesRepo.createPage(salonId, {
    ...data,
    status,
    publishedAt,
  });
}

export async function listPages(
  salonId: string,
  filters: { status?: PageStatus; type?: PageType; limit: number; offset: number }
) {
  return PagesRepo.listPagesBySalon(salonId, {
    status: filters.status,
    type: filters.type,
    limit: filters.limit,
    offset: filters.offset,
  });
}

export async function updatePage(
  salonId: string,
  pageId: string,
  data: UpdatePageInput
) {
  const existingPage = await PagesRepo.findPageById(salonId, pageId);
  if (!existingPage) {
    throw createHttpError(404, 'Page not found');
  }

  const nextStatus = data.status ?? existingPage.status;
  const publishedAt = resolvePublishedAt(
    nextStatus,
    data.publishedAt,
    existingPage.publishedAt
  );

  return PagesRepo.updatePage(
    pageId,
    {
      ...data,
      status: nextStatus,
      publishedAt,
    },
    data.sections
  );
}

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
  const slugHistory =
    data.slug && data.slug !== existingPage.slug ? existingPage.slug : undefined;

  return PagesRepo.updatePage(
    pageId,
    {
      ...data,
      status: nextStatus,
      publishedAt,
    },
    data.sections,
    slugHistory
  );
}

export async function getPage(salonId: string, pageId: string) {
  const page = await PagesRepo.findPageById(salonId, pageId);
  if (!page) {
    throw createHttpError(404, 'Page not found');
  }
  return page;
}

export async function copyPage(sourcePageId: string, targetSalonId: string) {
  try {
    return await PagesRepo.copyPage(sourcePageId, targetSalonId);
  } catch (error) {
    if (error instanceof Error && error.message === 'Source page not found') {
      throw createHttpError(404, error.message);
    }
    // Handle Prisma unique constraint error (P2002)
    if ((error as any).code === 'P2002') { // eslint-disable-line @typescript-eslint/no-explicit-any
      throw createHttpError(409, 'A page with this slug already exists in the target salon');
    }
    throw error;
  }
}

export async function copyAllPages(sourceSalonId: string, targetSalonId: string) {
  try {
    return await PagesRepo.copyAllPages(sourceSalonId, targetSalonId);
  } catch (error) {
    if ((error as any).code === 'P2002') { // eslint-disable-line @typescript-eslint/no-explicit-any
      throw createHttpError(409, 'One or more pages already exist in the target salon (slug conflict)');
    }
    throw error;
  }
}

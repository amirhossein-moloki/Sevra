import { Request, Response } from 'express';
import AppError from '../../common/errors/AppError';
import httpStatus from 'http-status';
import { PageStatus, PageType } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { renderPageDocument } from './page-renderer';

type PublicPageRequest = Request<{ salonSlug: string; pageSlug?: string }> & {
  tenant?: { salonId: string; salonSlug: string };
};

export async function getPublicSalonHome(req: PublicPageRequest, res: Response) {
  const { salonSlug } = req.params;
  let tenant = req.tenant;

  if (!tenant?.salonId) {
    if (!salonSlug) {
      throw new AppError('Salon slug is missing from the request params.', httpStatus.BAD_REQUEST);
    }

    const salon = await prisma.salon.findUnique({
      where: { slug: salonSlug, isActive: true },
    });
    if (!salon) {
      throw new AppError('Salon not found', httpStatus.NOT_FOUND);
    }

    tenant = { salonId: salon.id, salonSlug: salon.slug };
  }

  const page = await prisma.salonPage.findFirst({
    where: {
      salonId: tenant.salonId,
      type: PageType.HOME,
      status: PageStatus.PUBLISHED,
    },
    include: {
      sections: { orderBy: { sortOrder: 'asc' }, where: { isEnabled: true } },
      salon: { select: { siteSettings: true } },
    },
  });

  if (!page) {
    throw new AppError('Home page not found', httpStatus.NOT_FOUND);
  }

  const { sections, salon, ...pageData } = page;
  const html = renderPageDocument({
    page: pageData,
    siteSettings: salon?.siteSettings ?? null,
    sections,
    pageId: page.id,
  });
  res.status(200).type('html').send(html);
}

export async function getPublicPage(req: PublicPageRequest, res: Response) {
  const { pageSlug, salonSlug } = req.params;
  let tenant = req.tenant;

  if (!tenant?.salonId) {
    if (!salonSlug) {
      throw new AppError('Salon slug is missing from the request params.', httpStatus.BAD_REQUEST);
    }

    const salon = await prisma.salon.findUnique({ where: { slug: salonSlug } });
    if (!salon) {
      throw new AppError('Salon not found', httpStatus.NOT_FOUND);
    }

    tenant = { salonId: salon.id, salonSlug: salon.slug };
  }

  const page = await prisma.salonPage.findFirst({
    where: {
      salonId: tenant.salonId,
      slug: pageSlug,
      status: PageStatus.PUBLISHED,
    },
    include: {
      sections: { orderBy: { sortOrder: 'asc' }, where: { isEnabled: true } },
      salon: { select: { siteSettings: true } },
    },
  });

  if (page) {
    const updatedAt = page.updatedAt;
    const eTag = `W/"${updatedAt.getTime()}"`;
    const lastModified = updatedAt.toUTCString();

    res.setHeader('ETag', eTag);
    res.setHeader('Last-Modified', lastModified);

    const ifNoneMatch = req.headers['if-none-match'];
    if (ifNoneMatch === eTag) {
      res.status(304).end();
      return;
    }

    const ifModifiedSince = req.headers['if-modified-since'];
    if (ifModifiedSince) {
      const parsedModifiedSince = new Date(ifModifiedSince);
      if (!Number.isNaN(parsedModifiedSince.getTime()) && parsedModifiedSince >= updatedAt) {
        res.status(304).end();
        return;
      }
    }

    const { sections, salon, ...pageData } = page;
    const html = renderPageDocument({
      page: pageData,
      siteSettings: salon?.siteSettings ?? null,
      sections,
      pageId: page.id,
    });
    res.status(200).type('html').send(html);
    return;
  }

  const slugHistory = await prisma.salonPageSlugHistory.findFirst({
    where: {
      oldSlug: pageSlug,
      page: {
        salonId: tenant.salonId,
        status: PageStatus.PUBLISHED,
      },
    },
    include: {
      page: true,
    },
  });

  if (!slugHistory?.page) {
    throw new AppError('Page not found', httpStatus.NOT_FOUND);
  }

  res.redirect(
    301,
    `/api/v1/public/salons/${tenant.salonSlug}/pages/${slugHistory.page.slug}`
  );
}

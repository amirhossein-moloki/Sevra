import { Request, Response } from 'express';
import createHttpError from 'http-errors';
import { PageStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { renderPageDocument } from './page-renderer';

type PublicPageRequest = Request<{ salonSlug: string; pageSlug: string }> & {
  tenant?: { salonId: string; salonSlug: string };
};

export async function getPublicPage(req: PublicPageRequest, res: Response) {
  const { pageSlug, salonSlug } = req.params;
  let tenant = req.tenant;

  if (!tenant?.salonId) {
    if (!salonSlug) {
      throw createHttpError(400, 'Salon slug is missing from the request params.');
    }

    const salon = await prisma.salon.findUnique({ where: { slug: salonSlug } });
    if (!salon) {
      throw createHttpError(404, 'Salon not found');
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
    throw createHttpError(404, 'Page not found');
  }

  res.redirect(
    301,
    `/api/v1/public/salons/${tenant.salonSlug}/pages/${slugHistory.page.slug}`
  );
}

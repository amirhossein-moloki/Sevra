import { Request, Response } from 'express';
import createHttpError from 'http-errors';
import { PageStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { renderPageDocument } from './page-renderer';

type PublicPageRequest = Request<{ salonSlug: string; pageSlug: string }> & {
  tenant?: { salonId: string; salonSlug: string };
};

export async function getPublicPage(req: PublicPageRequest, res: Response) {
  const { pageSlug } = req.params;
  const tenant = req.tenant;

  if (!tenant?.salonId) {
    throw createHttpError(400, 'Salon slug is missing from the request params.');
  }

  const page = await prisma.salonPage.findFirst({
    where: {
      salonId: tenant.salonId,
      slug: pageSlug,
      status: PageStatus.PUBLISHED,
    },
    include: {
      sections: { orderBy: { sortOrder: 'asc' } },
    },
  });

  if (page) {
    const html = renderPageDocument({
      title: page.title,
      sections: page.sections,
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

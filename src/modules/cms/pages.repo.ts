import { prisma } from '../../config/prisma';
import { CreatePageData, UpdatePageData, CreatePageInput } from './pages.types';
import { PageStatus, PageType, Prisma } from '@prisma/client';

type PageFilters = {
  status?: PageStatus;
  type?: PageType;
  limit: number;
  offset: number;
};

type PageSectionInput = CreatePageInput['sections'][number];

const mapSections = (sections: PageSectionInput[]) =>
  sections.map((section, index) => ({
    id: section.id,
    type: section.type,
    dataJson: section.dataJson,
    sortOrder: section.sortOrder ?? index,
    isEnabled: section.isEnabled ?? true,
  }));

export async function createPage(salonId: string, data: CreatePageData) {
  const { sections, ...pageData } = data;
  const createInput: Prisma.SalonPageUncheckedCreateInput = {
    ...(pageData as any),
    salonId,
    sections: {
      create: mapSections(sections),
    },
  };
  return prisma.salonPage.create({
    data: createInput as any,
    include: {
      sections: { orderBy: { sortOrder: 'asc' } },
    },
  });
}

export async function findPageById(salonId: string, pageId: string) {
  return prisma.salonPage.findFirst({
    where: { id: pageId, salonId },
    include: {
      sections: { orderBy: { sortOrder: 'asc' } },
    },
  });
}

export async function listPagesBySalon(salonId: string, filters: PageFilters) {
  const { status, type, limit, offset } = filters;

  const whereClause = {
    salonId,
    ...(status ? { status } : {}),
    ...(type ? { type } : {}),
  };

  const [total, pages] = await prisma.$transaction([
    prisma.salonPage.count({ where: whereClause }),
    prisma.salonPage.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    }),
  ]);

  return { total, pages };
}

export async function updatePage(
  pageId: string,
  data: UpdatePageData,
  sections?: PageSectionInput[],
  slugHistory?: string
) {
  const { sections: _, ...pageData } = data; // eslint-disable-line @typescript-eslint/no-unused-vars
  return prisma.salonPage.update({
    where: { id: pageId },
    data: {
      ...pageData,
      ...(slugHistory
        ? {
          slugHistory: {
            create: {
              oldSlug: slugHistory,
            },
          },
        }
        : {}),
      ...(sections
        ? {
          sections: {
            deleteMany: {},
            create: mapSections(sections),
          },
        }
        : {}),
    },
    include: {
      sections: { orderBy: { sortOrder: 'asc' } },
    },
  });
}

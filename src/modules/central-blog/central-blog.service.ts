import { prisma } from '../../config/prisma';

interface CreateArticleData {
  title: string;
  slug: string;
  content?: string;
  excerpt?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  seoTitle?: string;
  seoDescription?: string;
  featuredImageUrl?: string;
}

export const createCentralArticle = async (data: CreateArticleData) => {
  const article = await prisma.centralArticle.create({
    data: {
      ...data,
      status: data.status || 'DRAFT',
    },
  });
  return article;
};

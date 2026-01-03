import { prisma } from '../../config/prisma';
import { createCentralArticle } from './central-blog.service';

describe('Central Blog Service', () => {
  afterAll(async () => {
    // Clean up created articles
    await prisma.centralArticle.deleteMany({});
    await prisma.$disconnect();
  });

  it('should create a new central article with valid data', async () => {
    const articleData = {
      title: 'Test Article',
      slug: 'test-article-slug-unique',
      content: 'This is the content of the test article.',
    };

    const newArticle = await createCentralArticle(articleData);

    expect(newArticle).toBeDefined();
    expect(newArticle.id).toBeDefined();
    expect(newArticle.title).toBe(articleData.title);
    expect(newArticle.slug).toBe(articleData.slug);
    expect(newArticle.status).toBe('DRAFT'); // Default status

    // Verify it's in the database
    const dbArticle = await prisma.centralArticle.findUnique({
      where: { id: newArticle.id },
    });
    expect(dbArticle).not.toBeNull();
  });
});

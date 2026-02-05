import cuid from 'cuid';
import {
  PageSectionType,
  PageStatus,
  PageType,
  RobotsFollow,
  RobotsIndex,
} from '@prisma/client';
import { createPageSchema, updatePageSchema } from './pages.validators';

const seedServicesGridData = {
  title: 'خدمات پرطرفدار',
  showPrices: true,
  maxItems: 12,
};

const seedHighlightsData = {
  title: 'چرا ما؟',
  items: [
    { title: 'محیط بهداشتی', text: 'ضدعفونی منظم ابزار و رعایت کامل پروتکل‌ها' },
    { title: 'پرسنل حرفه‌ای', text: 'متخصصین با تجربه در مو، پوست و ناخن' },
    { title: 'رزرو آسان', text: 'رزرو آنلاین/حضوری با مدیریت زمان' },
  ],
};

const buildSeedServicesGridSection = () => ({
  type: PageSectionType.SERVICES_GRID,
  dataJson: JSON.stringify(seedServicesGridData),
  sortOrder: 0,
  isEnabled: true,
});

const buildSeedHighlightsSection = () => ({
  type: PageSectionType.HIGHLIGHTS,
  dataJson: JSON.stringify(seedHighlightsData),
  sortOrder: 1,
  isEnabled: true,
});

describe('CMS pages validators', () => {
  describe('createPageSchema', () => {
    it('accepts valid payloads', () => {
      const result = createPageSchema.safeParse({
        body: {
          slug: 'home-page',
          title: 'صفحه اصلی',
          type: PageType.CUSTOM,
          status: PageStatus.DRAFT,
          robotsIndex: RobotsIndex.INDEX,
          robotsFollow: RobotsFollow.FOLLOW,
          sections: [buildSeedServicesGridSection(), buildSeedHighlightsSection()],
        },
      });

      expect(result.success).toBe(true);
    });

    it('returns structured section errors for UI mapping', () => {
      const result = createPageSchema.safeParse({
        body: {
          slug: 'home',
          title: 'صفحه اصلی',
          type: PageType.CUSTOM,
          sections: [
            {
              type: PageSectionType.SERVICES_GRID,
              dataJson: JSON.stringify({ showPrices: true, maxItems: 12 }),
            },
          ],
        },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find(
          (item: any) => item.params?.type === PageSectionType.SERVICES_GRID, // eslint-disable-line @typescript-eslint/no-explicit-any
        ) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
        expect(issue?.params).toEqual(
          expect.objectContaining({ index: 0, type: PageSectionType.SERVICES_GRID }),
        );
        expect(issue?.path.slice(-3)).toEqual([0, 'dataJson', 'title']);
      }
    });

    it('rejects non-url-safe or uppercase slugs', () => {
      const result = createPageSchema.safeParse({
        body: {
          slug: 'Home Page',
          title: 'صفحه اصلی',
          type: PageType.CUSTOM,
          sections: [buildSeedServicesGridSection()],
        },
      });

      expect(result.success).toBe(false);
    });

    it('requires canonicalPath to be a path-only value', () => {
      const result = createPageSchema.safeParse({
        body: {
          slug: 'home',
          title: 'صفحه اصلی',
          type: PageType.CUSTOM,
          canonicalPath: 'https://example.com/home',
          sections: [buildSeedServicesGridSection()],
        },
      });

      expect(result.success).toBe(false);
    });

    it('rejects robots values outside Prisma enums', () => {
      const result = createPageSchema.safeParse({
        body: {
          slug: 'home',
          title: 'صفحه اصلی',
          type: PageType.CUSTOM,
          robotsIndex: 'MAYBE' as RobotsIndex,
          robotsFollow: 'ALWAYS' as RobotsFollow,
          sections: [buildSeedServicesGridSection()],
        },
      });

      expect(result.success).toBe(false);
    });

    it('flags missing required fields with field paths', () => {
      const result = createPageSchema.safeParse({
        body: {
          slug: '',
          title: 'صفحه اصلی',
          type: PageType.CUSTOM,
          sections: [buildSeedServicesGridSection()],
        },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const slugIssue = result.error.issues.find(
          (item) => item.path[item.path.length - 1] === 'slug',
        );
        expect(slugIssue?.path).toEqual(['body', 'slug']);
      }
    });

    it('flags wrong field types inside section data with paths', () => {
      const result = createPageSchema.safeParse({
        body: {
          slug: 'home',
          title: 'صفحه اصلی',
          type: PageType.CUSTOM,
          sections: [
            {
              type: PageSectionType.SERVICES_GRID,
              dataJson: JSON.stringify({ title: 'خدمات پرطرفدار', showPrices: 'yes', maxItems: 12 }),
            },
          ],
        },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find(
          (item: any) => item.params?.type === PageSectionType.SERVICES_GRID, // eslint-disable-line @typescript-eslint/no-explicit-any
        ) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
        expect(issue?.path.slice(-3)).toEqual([0, 'dataJson', 'showPrices']);
      }
    });
  });

  describe('updatePageSchema', () => {
    it('requires at least one field to update', () => {
      const result = updatePageSchema.safeParse({
        params: { pageId: cuid() },
        body: {},
      });

      expect(result.success).toBe(false);
    });

    it('accepts valid updates', () => {
      const result = updatePageSchema.safeParse({
        params: { pageId: cuid() },
        body: {
          title: 'صفحه جدید',
          sections: [buildSeedServicesGridSection()],
        },
      });

      expect(result.success).toBe(true);
    });
  });
});

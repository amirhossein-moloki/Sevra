import cuid from 'cuid';
import {
  PageSectionType,
  PageStatus,
  PageType,
  RobotsFollow,
  RobotsIndex,
} from '@prisma/client';
import { createPageSchema, updatePageSchema } from './pages.validators';

const buildValidHeroSection = () => ({
  type: PageSectionType.HERO,
  dataJson: JSON.stringify({
    headline: 'عنوان اصلی',
    subheadline: 'زیرعنوان',
    primaryCta: { label: 'رزرو نوبت', url: '/booking' },
    secondaryCta: { label: 'خدمات', url: '/services' },
    backgroundImageUrl: 'https://picsum.photos/seed/hero/1600/900',
  }),
  sortOrder: 0,
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
          sections: [buildValidHeroSection()],
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
              type: PageSectionType.HERO,
              dataJson: JSON.stringify({ headline: '' }),
            },
          ],
        },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find(
          (item) => item.params?.type === PageSectionType.HERO,
        );
        expect(issue?.params).toEqual(
          expect.objectContaining({ index: 0, type: PageSectionType.HERO }),
        );
      }
    });

    it('rejects non-url-safe or uppercase slugs', () => {
      const result = createPageSchema.safeParse({
        body: {
          slug: 'Home Page',
          title: 'صفحه اصلی',
          type: PageType.CUSTOM,
          sections: [buildValidHeroSection()],
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
          sections: [buildValidHeroSection()],
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
          sections: [buildValidHeroSection()],
        },
      });

      expect(result.success).toBe(false);
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
          sections: [buildValidHeroSection()],
        },
      });

      expect(result.success).toBe(true);
    });
  });
});

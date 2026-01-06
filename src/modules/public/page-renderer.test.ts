import { RobotsFollow, RobotsIndex } from '@prisma/client';
import { buildSeoMeta } from './page-renderer';

type PageInput = Parameters<typeof buildSeoMeta>[0]['page'];
type SiteSettingsInput = NonNullable<Parameters<typeof buildSeoMeta>[0]['siteSettings']>;

const basePage: PageInput = {
  title: 'About Us',
  seoTitle: null,
  seoDescription: null,
  canonicalPath: null,
  ogTitle: null,
  ogDescription: null,
  ogImageUrl: null,
  robotsIndex: RobotsIndex.INDEX,
  robotsFollow: RobotsFollow.FOLLOW,
  structuredDataJson: null,
};

describe('buildSeoMeta', () => {
  it('prefers page overrides over site defaults', () => {
    const siteSettings: SiteSettingsInput = {
      defaultSeoTitle: 'Default Title',
      defaultSeoDescription: 'Default description',
      defaultOgImageUrl: 'https://example.com/default-og.png',
      robotsIndex: RobotsIndex.NOINDEX,
      robotsFollow: RobotsFollow.NOFOLLOW,
    };
    const page: PageInput = {
      ...basePage,
      seoTitle: 'Page SEO Title',
      seoDescription: 'Page SEO description',
      ogImageUrl: 'https://example.com/page-og.png',
    };

    const meta = buildSeoMeta({ page, siteSettings });

    expect(meta.title).toBe('Page SEO Title');
    expect(meta.description).toBe('Page SEO description');
    expect(meta.ogImageUrl).toBe('https://example.com/page-og.png');
  });

  it('falls back to site defaults when page values are missing', () => {
    const siteSettings: SiteSettingsInput = {
      defaultSeoTitle: 'Default Title',
      defaultSeoDescription: 'Default description',
      defaultOgImageUrl: 'https://example.com/default-og.png',
      robotsIndex: RobotsIndex.NOINDEX,
      robotsFollow: RobotsFollow.NOFOLLOW,
    };
    const page: PageInput = {
      ...basePage,
      seoTitle: null,
      seoDescription: null,
      ogImageUrl: null,
      robotsIndex: null,
      robotsFollow: null,
    };

    const meta = buildSeoMeta({ page, siteSettings });

    expect(meta.title).toBe('Default Title');
    expect(meta.description).toBe('Default description');
    expect(meta.ogImageUrl).toBe('https://example.com/default-og.png');
    expect(meta.robots).toBe('noindex, nofollow');
  });

  it('maps robots enums into a meta tag value', () => {
    const page: PageInput = {
      ...basePage,
      robotsIndex: RobotsIndex.NOINDEX,
      robotsFollow: RobotsFollow.FOLLOW,
    };

    const meta = buildSeoMeta({ page });

    expect(meta.robots).toBe('noindex, follow');
  });
});

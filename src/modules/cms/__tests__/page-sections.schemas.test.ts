import { PageSectionType } from '@prisma/client';
import { validateSectionData } from '../page-sections.schemas';

describe('page section schemas', () => {
  const validSectionPayloads: Record<PageSectionType, unknown> = {
    [PageSectionType.HERO]: {
      headline: 'عنوان اصلی',
      subheadline: 'زیرعنوان',
      primaryCta: { label: 'رزرو نوبت', url: '/booking' },
      secondaryCta: { label: 'خدمات', url: '/services' },
      backgroundImageUrl: 'https://picsum.photos/seed/hero/1600/900',
    },
    [PageSectionType.HIGHLIGHTS]: {
      title: 'چرا ما؟',
      items: [
        { title: 'محیط بهداشتی', text: 'متن' },
        { title: 'پرسنل حرفه‌ای', text: 'متن' },
      ],
    },
    [PageSectionType.SERVICES_GRID]: {
      title: 'خدمات پرطرفدار',
      showPrices: true,
      maxItems: 12,
    },
    [PageSectionType.GALLERY_GRID]: {
      title: 'گالری',
      categories: ['مو', 'ناخن'],
      limit: 12,
    },
    [PageSectionType.TESTIMONIALS]: {
      title: 'نظرات مشتریان',
      limit: 6,
    },
    [PageSectionType.FAQ]: {
      title: 'سوالات پرتکرار',
      items: [
        { q: 'سوال ۱', a: 'پاسخ ۱' },
        { q: 'سوال ۲', a: 'پاسخ ۲' },
      ],
    },
    [PageSectionType.CTA]: {
      title: 'برای تغییر استایل آماده‌اید؟',
      text: 'همین الان نوبت خود را رزرو کنید.',
      buttonLabel: 'رزرو نوبت',
      buttonUrl: '/booking',
    },
    [PageSectionType.CONTACT_CARD]: {
      title: 'اطلاعات تماس',
      city: 'تهران',
      workHours: '09:00 تا 20:00',
    },
    [PageSectionType.MAP]: {
      lat: 35.6892,
      lng: 51.389,
      zoom: 14,
    },
    [PageSectionType.RICH_TEXT]: {
      title: 'درباره ما',
      blocks: [
        { type: 'paragraph', text: 'متن ساده' },
        { type: 'paragraph', text: 'متن بیشتر' },
      ],
    },
    [PageSectionType.STAFF_GRID]: {
      title: 'تیم ما',
      showRoles: true,
      showBio: true,
    },
  };

  it.each(Object.entries(validSectionPayloads))('accepts valid %s payloads', (type, payload) => {
    expect(() => validateSectionData(type as PageSectionType, JSON.stringify(payload))).not.toThrow();
  });

  it('rejects HTML in rich text blocks by default', () => {
    const payload = {
      title: 'قوانین',
      blocks: [{ type: 'paragraph', text: '<p>HTML متن</p>' }],
    };

    expect(() => validateSectionData(PageSectionType.RICH_TEXT, JSON.stringify(payload))).toThrow(
      'HTML is not allowed in rich-text fields.',
    );
  });

  it('allows HTML in rich text blocks when explicitly allowed', () => {
    const payload = {
      title: 'قوانین',
      blocks: [{ type: 'paragraph', text: '<p>HTML متن</p>', allowHtml: true }],
    };

    expect(() => validateSectionData(PageSectionType.RICH_TEXT, JSON.stringify(payload))).not.toThrow();
  });
});

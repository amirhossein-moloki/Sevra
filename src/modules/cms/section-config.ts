
export type FieldType = 'text' | 'textarea' | 'number' | 'checkbox' | 'list' | 'group';

export interface FieldDefinition {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  fields?: FieldDefinition[]; // For 'group' and 'list'
  defaultValue?: any;
}

export interface SectionConfig {
  type: string;
  label: string;
  fields: FieldDefinition[];
  defaults: Record<string, any>;
}

export const sectionConfigs: Record<string, SectionConfig> = {
  HERO: {
    type: 'HERO',
    label: 'Hero',
    defaults: {
      headline: 'صفحه جدید',
      subheadline: 'رزرو آنلاین و حضوری در شهر شما',
      primaryCta: { label: 'رزرو نوبت', url: '/booking' },
      secondaryCta: { label: 'مشاهده خدمات', url: '/services' },
      backgroundImageUrl: 'https://picsum.photos/seed/new-hero/1600/900',
    },
    fields: [
      { name: 'headline', label: 'Headline', type: 'text', required: true },
      { name: 'subheadline', label: 'Subheadline', type: 'text', required: true },
      {
        name: 'primaryCta',
        label: 'Primary CTA',
        type: 'group',
        fields: [
          { name: 'label', label: 'Label', type: 'text', required: true },
          { name: 'url', label: 'URL', type: 'text', required: true },
        ],
      },
      {
        name: 'secondaryCta',
        label: 'Secondary CTA',
        type: 'group',
        fields: [
          { name: 'label', label: 'Label', type: 'text', required: true },
          { name: 'url', label: 'URL', type: 'text', required: true },
        ],
      },
      { name: 'backgroundImageUrl', label: 'Background Image URL', type: 'text', required: true },
    ],
  },
  HIGHLIGHTS: {
    type: 'HIGHLIGHTS',
    label: 'Highlights',
    defaults: {
      title: 'چرا ما؟',
      items: [
        { title: 'محیط بهداشتی', text: 'ضدعفونی منظم ابزار و رعایت کامل پروتکل‌ها' },
        { title: 'پرسنل حرفه‌ای', text: 'متخصصین با تجربه در مو، پوست و ناخن' },
        { title: 'رزرو آسان', text: 'رزرو آنلاین/حضوری با مدیریت زمان' },
      ],
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      {
        name: 'items',
        label: 'Items',
        type: 'list',
        fields: [
          { name: 'title', label: 'Item Title', type: 'text', required: true },
          { name: 'text', label: 'Item Text', type: 'textarea', required: true },
        ],
      },
    ],
  },
  SERVICES_GRID: {
    type: 'SERVICES_GRID',
    label: 'Services Grid',
    defaults: {
      title: 'خدمات پرطرفدار',
      showPrices: true,
      maxItems: 12,
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'showPrices', label: 'Show Prices', type: 'checkbox' },
      { name: 'maxItems', label: 'Max Items', type: 'number', required: true },
    ],
  },
  GALLERY_GRID: {
    type: 'GALLERY_GRID',
    label: 'Gallery Grid',
    defaults: {
      title: 'گالری نمونه کار',
      categories: ['مو', 'ناخن', 'پوست', 'سالن'],
      limit: 12,
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'limit', label: 'Limit', type: 'number', required: true },
      {
        name: 'categories',
        label: 'Categories',
        type: 'list',
        fields: [
          { name: 'value', label: 'Category Name', type: 'text', required: true },
        ],
      },
    ],
  },
  TESTIMONIALS: {
    type: 'TESTIMONIALS',
    label: 'Testimonials',
    defaults: {
      title: 'نظرات مشتریان',
      limit: 6,
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'limit', label: 'Limit', type: 'number', required: true },
    ],
  },
  FAQ: {
    type: 'FAQ',
    label: 'FAQ',
    defaults: {
      title: 'سوالات پرتکرار',
      items: [
        { q: 'برای رزرو آنلاین نیاز به پرداخت است؟', a: 'بسته به سرویس، ممکن است بیعانه فعال باشد.' },
        { q: 'چطور زمان رزرو را تغییر دهم؟', a: 'از طریق تماس با پذیرش یا پنل رزرو اقدام کنید.' },
      ],
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      {
        name: 'items',
        label: 'Questions',
        type: 'list',
        fields: [
          { name: 'q', label: 'Question', type: 'text', required: true },
          { name: 'a', label: 'Answer', type: 'textarea', required: true },
        ],
      },
    ],
  },
  CTA: {
    type: 'CTA',
    label: 'Call to Action',
    defaults: {
      title: 'برای تغییر استایل آماده‌اید؟',
      text: 'همین الان نوبت خود را رزرو کنید.',
      buttonLabel: 'رزرو نوبت',
      buttonUrl: '/booking',
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'text', label: 'Text', type: 'textarea', required: true },
      { name: 'buttonLabel', label: 'Button Label', type: 'text', required: true },
      { name: 'buttonUrl', label: 'Button URL', type: 'text', required: true },
    ],
  },
  CONTACT_CARD: {
    type: 'CONTACT_CARD',
    label: 'Contact Card',
    defaults: {
      title: 'اطلاعات تماس',
      city: 'تهران',
      workHours: '09:00 تا 20:00',
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'city', label: 'City', type: 'text', required: true },
      { name: 'workHours', label: 'Work Hours', type: 'text', required: true },
    ],
  },
  MAP: {
    type: 'MAP',
    label: 'Map',
    defaults: {
      lat: 35.6892,
      lng: 51.389,
      zoom: 14,
    },
    fields: [
      { name: 'lat', label: 'Latitude', type: 'number', required: true },
      { name: 'lng', label: 'Longitude', type: 'number', required: true },
      { name: 'zoom', label: 'Zoom', type: 'number', required: true },
    ],
  },
  RICH_TEXT: {
    type: 'RICH_TEXT',
    label: 'Rich Text',
    defaults: {
      title: 'درباره ما',
      blocks: [
        { type: 'paragraph', text: 'ما با تمرکز بر کیفیت، بهداشت و تجربه مشتری فعالیت می‌کنیم.' },
        { type: 'paragraph', text: 'تیم ما با جدیدترین متدها آماده ارائه خدمات است.' },
      ],
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      {
        name: 'blocks',
        label: 'Content Blocks',
        type: 'list',
        fields: [
          { name: 'type', label: 'Block Type', type: 'text', required: true },
          { name: 'text', label: 'Text Content', type: 'textarea', required: true },
          { name: 'allowHtml', label: 'Allow HTML', type: 'checkbox' },
        ],
      },
    ],
  },
  STAFF_GRID: {
    type: 'STAFF_GRID',
    label: 'Staff Grid',
    defaults: {
      title: 'تیم ما',
      showRoles: true,
      showBio: true,
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'showRoles', label: 'Show Roles', type: 'checkbox' },
      { name: 'showBio', label: 'Show Bio', type: 'checkbox' },
    ],
  },
};

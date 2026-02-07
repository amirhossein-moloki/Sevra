/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod';
import { PageSectionType } from '@prisma/client';
import { sectionConfigs } from './section-config';

export type PageSectionInput = {
  id?: string | null;
  type: PageSectionType | string;
  dataJson?: string | null;
  isEnabled?: boolean | null;
  sortOrder?: number | null;
};

export const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const allowedRichTextTags = new Set(['a', 'b', 'strong', 'i', 'em', 'u', 's', 'br', 'span', 'code']);
const safeHrefPattern = /^(https?:|mailto:|tel:|\/|#)/i;
const attributeRegex = /([a-zA-Z0-9-:_]+)\s*=\s*(".*?"|'.*?'|[^\s>]+)/g;

const escapeHtmlAttribute = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const sanitizeTagAttributes = (attributes: string) => {
  const sanitized: Record<string, string> = {};
  attributeRegex.lastIndex = 0;
  let match;
  while ((match = attributeRegex.exec(attributes)) !== null) {
    const name = match[1].toLowerCase();
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith('\'') && value.endsWith('\''))) {
      value = value.slice(1, -1);
    }
    sanitized[name] = value;
  }
  return sanitized;
};

const sanitizeRichTextHtml = (value: string, allowHtml: boolean) => {
  if (!value) return value;

  const withoutDangerousBlocks = value.replace(
    /<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1>/gi,
    '',
  );

  if (!allowHtml) {
    return withoutDangerousBlocks.replace(/<[^>]*>/g, '');
  }

  return withoutDangerousBlocks.replace(
    /<\s*\/?\s*([a-zA-Z0-9]+)([^>]*)>/g,
    (match, rawTagName: string, rawAttributes: string) => {
      const tagName = rawTagName.toLowerCase();
      const isClosing = match.trim().startsWith('</');

      if (!allowedRichTextTags.has(tagName)) {
        return '';
      }

      if (isClosing) {
        return `</${tagName}>`;
      }

      if (tagName === 'br') {
        return '<br />';
      }

      if (tagName !== 'a') {
        return `<${tagName}>`;
      }

      const attributes = sanitizeTagAttributes(rawAttributes);
      const sanitizedAttributes: string[] = [];
      if (attributes.href && safeHrefPattern.test(attributes.href)) {
        sanitizedAttributes.push(`href="${escapeHtmlAttribute(attributes.href)}"`);
      }
      if (attributes.title) {
        sanitizedAttributes.push(`title="${escapeHtmlAttribute(attributes.title)}"`);
      }
      if (attributes.target) {
        const target = attributes.target.toLowerCase();
        if (['_blank', '_self', '_parent', '_top'].includes(target)) {
          sanitizedAttributes.push(`target="${target}"`);
          if (target === '_blank') {
            sanitizedAttributes.push('rel="noopener noreferrer"');
          }
        }
      }
      if (attributes.rel && !sanitizedAttributes.some((attr) => attr.startsWith('rel='))) {
        sanitizedAttributes.push(`rel="${escapeHtmlAttribute(attributes.rel)}"`);
      }

      return `<a${sanitizedAttributes.length ? ` ${sanitizedAttributes.join(' ')}` : ''}>`;
    },
  );
};

const richTextBlockSchema = z
  .object({
    type: z.string().min(1),
    text: z.string().min(1),
    allowHtml: z.boolean().optional(),
  })
  .transform((value) => ({
    ...value,
    text: sanitizeRichTextHtml(value.text, Boolean(value.allowHtml)),
  }));

const heroSchema = z.object({
  headline: z.string().min(1),
  subheadline: z.string().min(1),
  primaryCta: z.object({
    label: z.string().min(1),
    url: z.string().min(1),
  }),
  secondaryCta: z.object({
    label: z.string().min(1),
    url: z.string().min(1),
  }),
  backgroundImageUrl: z.string().min(1),
});

const highlightsSchema = z.object({
  title: z.string().min(1),
  items: z.array(
    z.object({
      title: z.string().min(1),
      text: z.string().min(1),
    }),
  ),
});

const servicesGridSchema = z.object({
  title: z.string().min(1),
  showPrices: z.boolean(),
  maxItems: z.number().int().positive(),
});

const galleryGridSchema = z.object({
  title: z.string().min(1),
  categories: z.array(z.union([
    z.string().min(1),
    z.object({ value: z.string().min(1) })
  ])),
  limit: z.number().int().positive(),
});

const testimonialsSchema = z.object({
  title: z.string().min(1),
  limit: z.number().int().positive(),
});

const faqSchema = z.object({
  title: z.string().min(1),
  items: z.array(
    z.object({
      q: z.string().min(1),
      a: z.string().min(1),
    }),
  ),
});

const ctaSchema = z.object({
  title: z.string().min(1),
  text: z.string().min(1),
  buttonLabel: z.string().min(1),
  buttonUrl: z.string().min(1),
});

const contactCardSchema = z.object({
  title: z.string().min(1),
  city: z.string().min(1),
  workHours: z.string().min(1),
});

const mapSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  zoom: z.number().int().positive(),
});

const richTextSchema = z.object({
  title: z.string().min(1),
  blocks: z.array(richTextBlockSchema),
});

const staffGridSchema = z.object({
  title: z.string().min(1),
  showRoles: z.boolean(),
  showBio: z.boolean(),
});

export const pageSectionSchemas = {
  [PageSectionType.HERO]: heroSchema,
  [PageSectionType.HIGHLIGHTS]: highlightsSchema,
  [PageSectionType.SERVICES_GRID]: servicesGridSchema,
  [PageSectionType.GALLERY_GRID]: galleryGridSchema,
  [PageSectionType.TESTIMONIALS]: testimonialsSchema,
  [PageSectionType.FAQ]: faqSchema,
  [PageSectionType.CTA]: ctaSchema,
  [PageSectionType.CONTACT_CARD]: contactCardSchema,
  [PageSectionType.MAP]: mapSchema,
  [PageSectionType.RICH_TEXT]: richTextSchema,
  [PageSectionType.STAFF_GRID]: staffGridSchema,
} as const;

const renderButton = (label?: string, url?: string) => {
  if (!label || !url) return '';
  return `<a class="btn" href="${escapeHtml(url)}">${escapeHtml(label)}</a>`;
};

const renderHero = (data: Record<string, any>) => {
  const headline = data?.headline ? escapeHtml(String(data.headline)) : 'Untitled hero';
  const subheadline = data?.subheadline ? escapeHtml(String(data.subheadline)) : '';
  const backgroundImageUrl = data?.backgroundImageUrl
    ? escapeHtml(String(data.backgroundImageUrl))
    : '';
  return `
    <section class="section hero" style="${backgroundImageUrl ? `background-image: url('${backgroundImageUrl}');` : ''}">
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <h2>${headline}</h2>
        <p>${subheadline}</p>
        <div class="hero-actions">
          ${renderButton(data?.primaryCta?.label, data?.primaryCta?.url)}
          ${renderButton(data?.secondaryCta?.label, data?.secondaryCta?.url)}
        </div>
      </div>
    </section>
  `;
};

const renderHighlights = (data: Record<string, any>) => {
  const title = data?.title ? escapeHtml(String(data.title)) : 'Highlights';
  const items = Array.isArray(data?.items) ? data.items : [];
  return `
    <section class="section">
      <h2>${title}</h2>
      <div class="grid three">
        ${items
    .map(
      (item: Record<string, any>) => `
            <div class="card-block">
              <h3>${escapeHtml(String(item?.title ?? ''))}</h3>
              <p>${escapeHtml(String(item?.text ?? ''))}</p>
            </div>
          `,
    )
    .join('')}
      </div>
    </section>
  `;
};

const renderServicesGrid = (data: Record<string, any>) => {
  const title = data?.title ? escapeHtml(String(data.title)) : 'Services';
  const maxItems = Number(data?.maxItems ?? 6);
  const placeholders = Array.from({ length: Math.min(maxItems, 6) }, (_, index) => ({
    name: `Service ${index + 1}`,
    price: data?.showPrices ? `${(index + 1) * 10} $` : '',
  }));
  return `
    <section class="section">
      <h2>${title}</h2>
      <div class="grid three">
        ${placeholders
    .map(
      (item) => `
            <div class="card-block">
              <h3>${escapeHtml(item.name)}</h3>
              <p>${item.price ? escapeHtml(item.price) : 'Popular choice'}</p>
            </div>
          `,
    )
    .join('')}
      </div>
    </section>
  `;
};

const renderGalleryGrid = (data: Record<string, any>) => {
  const title = data?.title ? escapeHtml(String(data.title)) : 'Gallery';
  const categories = Array.isArray(data?.categories) ? data.categories : [];
  return `
    <section class="section">
      <h2>${title}</h2>
      <div class="pill-row">
        ${categories
    .map((c: any) => {
      const val = typeof c === 'string' ? c : c?.value ?? '';
      return `<span class="pill">${escapeHtml(String(val))}</span>`;
    })
    .join('')}
      </div>
      <div class="grid three">
        ${Array.from({ length: 6 })
    .map(
      (_item, index) => `
            <div class="image-card">Image ${index + 1}</div>
          `,
    )
    .join('')}
      </div>
    </section>
  `;
};

const renderTestimonials = (data: Record<string, any>) => {
  const title = data?.title ? escapeHtml(String(data.title)) : 'Testimonials';
  const limit = Number(data?.limit ?? 3);
  return `
    <section class="section">
      <h2>${title}</h2>
      <div class="grid three">
        ${Array.from({ length: Math.min(limit, 3) })
    .map(
      (_item, index) => `
            <div class="card-block">
              <p>“Great experience ${index + 1}."</p>
              <span>Happy client</span>
            </div>
          `,
    )
    .join('')}
      </div>
    </section>
  `;
};

const renderFaq = (data: Record<string, any>) => {
  const title = data?.title ? escapeHtml(String(data.title)) : 'FAQs';
  const items = Array.isArray(data?.items) ? data.items : [];
  return `
    <section class="section">
      <h2>${title}</h2>
      <div class="stack">
        ${items
    .map(
      (item: Record<string, any>) => `
            <div class="card-block">
              <h3>${escapeHtml(String(item?.q ?? ''))}</h3>
              <p>${escapeHtml(String(item?.a ?? ''))}</p>
            </div>
          `,
    )
    .join('')}
      </div>
    </section>
  `;
};

const renderCta = (data: Record<string, any>) => {
  const title = data?.title ? escapeHtml(String(data.title)) : 'Ready to book?';
  const text = data?.text ? escapeHtml(String(data.text)) : '';
  return `
    <section class="section cta">
      <h2>${title}</h2>
      <p>${text}</p>
      ${renderButton(data?.buttonLabel, data?.buttonUrl)}
    </section>
  `;
};

const renderContactCard = (data: Record<string, any>) => {
  const title = data?.title ? escapeHtml(String(data.title)) : 'Contact';
  const city = data?.city ? escapeHtml(String(data.city)) : '';
  const workHours = data?.workHours ? escapeHtml(String(data.workHours)) : '';
  return `
    <section class="section">
      <h2>${title}</h2>
      <div class="card-block">
        <p>${city}</p>
        <p>${workHours}</p>
      </div>
    </section>
  `;
};

const renderMap = (data: Record<string, any>) => {
  const lat = data?.lat ?? 0;
  const lng = data?.lng ?? 0;
  const zoom = data?.zoom ?? 12;
  return `
    <section class="section">
      <h2>Map</h2>
      <div class="map-card">
        <p>Latitude: ${escapeHtml(String(lat))}</p>
        <p>Longitude: ${escapeHtml(String(lng))}</p>
        <p>Zoom: ${escapeHtml(String(zoom))}</p>
      </div>
    </section>
  `;
};

const renderRichText = (data: Record<string, any>) => {
  const title = data?.title ? escapeHtml(String(data.title)) : '';
  const blocks = Array.isArray(data?.blocks) ? data.blocks : [];
  return `
    <section class="section">
      ${title ? `<h2>${title}</h2>` : ''}
      <div class="stack">
        ${blocks
    .map((block: Record<string, any>) => {
      const text = block?.text ?? '';
      if (block?.allowHtml) {
        return `<p>${text}</p>`;
      }
      return `<p>${escapeHtml(String(text))}</p>`;
    })
    .join('')}
      </div>
    </section>
  `;
};

const renderStaffGrid = (data: Record<string, any>) => {
  const title = data?.title ? escapeHtml(String(data.title)) : 'Staff';
  return `
    <section class="section">
      <h2>${title}</h2>
      <div class="grid three">
        ${Array.from({ length: 3 })
    .map(
      (_item, index) => `
            <div class="card-block">
              <h3>Team member ${index + 1}</h3>
              <p>Stylist</p>
            </div>
          `,
    )
    .join('')}
      </div>
    </section>
  `;
};


type RegistryEntry = {
  schema: z.ZodTypeAny;
  renderer: (data: Record<string, any>) => string;
};

export const pageSectionRegistry: Record<PageSectionType, RegistryEntry> = {
  [PageSectionType.HERO]: {
    schema: heroSchema,
    renderer: renderHero,
  },
  [PageSectionType.HIGHLIGHTS]: {
    schema: highlightsSchema,
    renderer: renderHighlights,
  },
  [PageSectionType.SERVICES_GRID]: {
    schema: servicesGridSchema,
    renderer: renderServicesGrid,
  },
  [PageSectionType.GALLERY_GRID]: {
    schema: galleryGridSchema,
    renderer: renderGalleryGrid,
  },
  [PageSectionType.TESTIMONIALS]: {
    schema: testimonialsSchema,
    renderer: renderTestimonials,
  },
  [PageSectionType.FAQ]: {
    schema: faqSchema,
    renderer: renderFaq,
  },
  [PageSectionType.CTA]: {
    schema: ctaSchema,
    renderer: renderCta,
  },
  [PageSectionType.CONTACT_CARD]: {
    schema: contactCardSchema,
    renderer: renderContactCard,
  },
  [PageSectionType.MAP]: {
    schema: mapSchema,
    renderer: renderMap,
  },
  [PageSectionType.RICH_TEXT]: {
    schema: richTextSchema,
    renderer: renderRichText,
  },
  [PageSectionType.STAFF_GRID]: {
    schema: staffGridSchema,
    renderer: renderStaffGrid,
  },
};

export const sectionRenderers = Object.fromEntries(
  Object.entries(pageSectionRegistry).map(([type, entry]) => [type, entry.renderer]),
) as Record<PageSectionType, (data: Record<string, any>) => string>;

export const pageSectionSchemaByType = (type: PageSectionType) => pageSectionSchemas[type];

export const validateSectionData = (type: PageSectionType, dataJson: string) => {
  const schema = pageSectionSchemaByType(type);
  if (!schema) {
    throw new Error(`Unsupported page section type: ${type}`);
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(dataJson);
  } catch (error) {
    throw new Error('Section data is not valid JSON.');
  }

  return schema.parse(parsedJson);
};

export const serializeSectionRegistryForEditor = () => {
  return JSON.stringify(sectionConfigs, null, 2);
};

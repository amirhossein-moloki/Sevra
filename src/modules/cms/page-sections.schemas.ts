import { z } from 'zod';
import { PageSectionType } from '@prisma/client';

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
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
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
  categories: z.array(z.string().min(1)),
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

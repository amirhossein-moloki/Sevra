import { z } from 'zod';
import { PageSectionType } from '@prisma/client';

const htmlTagRegex = /<[^>]+>/;

const richTextBlockSchema = z
  .object({
    type: z.string().min(1),
    text: z.string().min(1),
    allowHtml: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.allowHtml && htmlTagRegex.test(value.text)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'HTML is not allowed in rich-text fields.',
        path: ['text'],
      });
    }
  });

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

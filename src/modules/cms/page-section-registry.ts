import { z } from 'zod';
import { PageSectionType } from '@prisma/client';

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
        ${categories.map((category: string) => `<span class="pill">${escapeHtml(category)}</span>`).join('')}
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

const buildHeroEditor = (context: any) => {
  const { data, grid, update, helpers } = context;
  const { createTextInput } = helpers;
  grid.appendChild(createTextInput('Headline', data.headline, (value: string) => {
    data.headline = value;
    update();
  }));
  grid.appendChild(createTextInput('Subheadline', data.subheadline, (value: string) => {
    data.subheadline = value;
    update();
  }));
  grid.appendChild(createTextInput('Primary CTA label', data.primaryCta?.label, (value: string) => {
    data.primaryCta = data.primaryCta ?? {};
    data.primaryCta.label = value;
    update();
  }));
  grid.appendChild(createTextInput('Primary CTA URL', data.primaryCta?.url, (value: string) => {
    data.primaryCta = data.primaryCta ?? {};
    data.primaryCta.url = value;
    update();
  }));
  grid.appendChild(createTextInput('Secondary CTA label', data.secondaryCta?.label, (value: string) => {
    data.secondaryCta = data.secondaryCta ?? {};
    data.secondaryCta.label = value;
    update();
  }));
  grid.appendChild(createTextInput('Secondary CTA URL', data.secondaryCta?.url, (value: string) => {
    data.secondaryCta = data.secondaryCta ?? {};
    data.secondaryCta.url = value;
    update();
  }));
  grid.appendChild(createTextInput('Background image URL', data.backgroundImageUrl, (value: string) => {
    data.backgroundImageUrl = value;
    update();
  }));
};

const buildHighlightsEditor = (context: any) => {
  const { data, grid, editor, update, helpers } = context;
  const { createTextInput, createTextarea, createListEditor } = helpers;
  grid.appendChild(createTextInput('Title', data.title, (value: string) => {
    data.title = value;
    update();
  }));
  const items = Array.isArray(data.items) ? data.items : (data.items = []);
  editor.appendChild(
    createListEditor({
      items,
      renderItem: (block: HTMLElement, item: any) => {
        const itemGrid = document.createElement('div');
        itemGrid.className = 'editor-grid';
        itemGrid.appendChild(createTextInput('Item title', item.title, (value: string) => {
          item.title = value;
          update();
        }));
        itemGrid.appendChild(createTextarea('Item text', item.text, (value: string) => {
          item.text = value;
          update();
        }));
        block.appendChild(itemGrid);
      },
      onAdd: () => {
        items.push({ title: '', text: '' });
        update();
      },
      onRemove: (index: number) => {
        items.splice(index, 1);
        update();
      },
    }),
  );
};

const buildServicesGridEditor = (context: any) => {
  const { data, grid, update, helpers } = context;
  const { createTextInput, createNumberInput, createCheckbox } = helpers;
  grid.appendChild(createTextInput('Title', data.title, (value: string) => {
    data.title = value;
    update();
  }));
  grid.appendChild(createNumberInput('Max items', data.maxItems, (value: number) => {
    data.maxItems = value;
    update();
  }));
  grid.appendChild(createCheckbox('Show prices', data.showPrices, (value: boolean) => {
    data.showPrices = value;
    update();
  }));
};

const buildGalleryGridEditor = (context: any) => {
  const { data, grid, editor, update, helpers } = context;
  const { createTextInput, createNumberInput, createListEditor } = helpers;
  grid.appendChild(createTextInput('Title', data.title, (value: string) => {
    data.title = value;
    update();
  }));
  grid.appendChild(createNumberInput('Limit', data.limit, (value: number) => {
    data.limit = value;
    update();
  }));
  const categories = Array.isArray(data.categories) ? data.categories : (data.categories = []);
  editor.appendChild(
    createListEditor({
      items: categories,
      renderItem: (block: HTMLElement, item: string, index: number) => {
        const itemGrid = document.createElement('div');
        itemGrid.className = 'editor-grid';
        itemGrid.appendChild(createTextInput(`Category ${index + 1}`, item, (value: string) => {
          categories[index] = value;
          update();
        }));
        block.appendChild(itemGrid);
      },
      onAdd: () => {
        categories.push('');
        update();
      },
      onRemove: (index: number) => {
        categories.splice(index, 1);
        update();
      },
    }),
  );
};

const buildTestimonialsEditor = (context: any) => {
  const { data, grid, update, helpers } = context;
  const { createTextInput, createNumberInput } = helpers;
  grid.appendChild(createTextInput('Title', data.title, (value: string) => {
    data.title = value;
    update();
  }));
  grid.appendChild(createNumberInput('Limit', data.limit, (value: number) => {
    data.limit = value;
    update();
  }));
};

const buildFaqEditor = (context: any) => {
  const { data, grid, editor, update, helpers } = context;
  const { createTextInput, createTextarea, createListEditor } = helpers;
  grid.appendChild(createTextInput('Title', data.title, (value: string) => {
    data.title = value;
    update();
  }));
  const items = Array.isArray(data.items) ? data.items : (data.items = []);
  editor.appendChild(
    createListEditor({
      items,
      renderItem: (block: HTMLElement, item: any) => {
        const itemGrid = document.createElement('div');
        itemGrid.className = 'editor-grid';
        itemGrid.appendChild(createTextInput('Question', item.q, (value: string) => {
          item.q = value;
          update();
        }));
        itemGrid.appendChild(createTextarea('Answer', item.a, (value: string) => {
          item.a = value;
          update();
        }));
        block.appendChild(itemGrid);
      },
      onAdd: () => {
        items.push({ q: '', a: '' });
        update();
      },
      onRemove: (index: number) => {
        items.splice(index, 1);
        update();
      },
    }),
  );
};

const buildCtaEditor = (context: any) => {
  const { data, grid, update, helpers } = context;
  const { createTextInput, createTextarea } = helpers;
  grid.appendChild(createTextInput('Title', data.title, (value: string) => {
    data.title = value;
    update();
  }));
  grid.appendChild(createTextarea('Text', data.text, (value: string) => {
    data.text = value;
    update();
  }));
  grid.appendChild(createTextInput('Button label', data.buttonLabel, (value: string) => {
    data.buttonLabel = value;
    update();
  }));
  grid.appendChild(createTextInput('Button URL', data.buttonUrl, (value: string) => {
    data.buttonUrl = value;
    update();
  }));
};

const buildContactCardEditor = (context: any) => {
  const { data, grid, update, helpers } = context;
  const { createTextInput } = helpers;
  grid.appendChild(createTextInput('Title', data.title, (value: string) => {
    data.title = value;
    update();
  }));
  grid.appendChild(createTextInput('City', data.city, (value: string) => {
    data.city = value;
    update();
  }));
  grid.appendChild(createTextInput('Work hours', data.workHours, (value: string) => {
    data.workHours = value;
    update();
  }));
};

const buildMapEditor = (context: any) => {
  const { data, grid, update, helpers } = context;
  const { createNumberInput } = helpers;
  grid.appendChild(createNumberInput('Latitude', data.lat, (value: number) => {
    data.lat = value;
    update();
  }));
  grid.appendChild(createNumberInput('Longitude', data.lng, (value: number) => {
    data.lng = value;
    update();
  }));
  grid.appendChild(createNumberInput('Zoom', data.zoom, (value: number) => {
    data.zoom = value;
    update();
  }));
};

const buildRichTextEditor = (context: any) => {
  const { data, grid, editor, update, helpers } = context;
  const { createTextInput, createTextarea, createCheckbox, createListEditor, createLabeledField } = helpers;
  grid.appendChild(createTextInput('Title', data.title, (value: string) => {
    data.title = value;
    update();
  }));
  const blocks = Array.isArray(data.blocks) ? data.blocks : (data.blocks = []);
  const blockEditor = createListEditor({
    items: blocks,
    renderItem: (block: HTMLElement, item: any) => {
      const itemGrid = document.createElement('div');
      itemGrid.className = 'editor-grid';
      const typeSelectWrapper = createLabeledField('Block type');
      const select = document.createElement('select');
      ['paragraph', 'heading', 'list', 'quote'].forEach((optionValue) => {
        const option = document.createElement('option');
        option.value = optionValue;
        option.textContent = optionValue;
        select.appendChild(option);
      });
      select.value = item.type ?? 'paragraph';
      select.addEventListener('change', () => {
        item.type = select.value;
        update();
      });
      typeSelectWrapper.wrapper.appendChild(select);
      itemGrid.appendChild(typeSelectWrapper.wrapper);
      itemGrid.appendChild(createTextarea('Text', item.text, (value: string) => {
        item.text = value;
        update();
      }));
      itemGrid.appendChild(createCheckbox('Allow HTML', item.allowHtml, (value: boolean) => {
        item.allowHtml = value;
        update();
      }));
      block.appendChild(itemGrid);
    },
    onAdd: () => {
      blocks.push({ type: 'paragraph', text: '' });
      update();
    },
    onRemove: (index: number) => {
      blocks.splice(index, 1);
      update();
    },
  });
  editor.appendChild(blockEditor);
};

const buildStaffGridEditor = (context: any) => {
  const { data, grid, update, helpers } = context;
  const { createTextInput, createCheckbox } = helpers;
  grid.appendChild(createTextInput('Title', data.title, (value: string) => {
    data.title = value;
    update();
  }));
  grid.appendChild(createCheckbox('Show roles', data.showRoles, (value: boolean) => {
    data.showRoles = value;
    update();
  }));
  grid.appendChild(createCheckbox('Show bio', data.showBio, (value: boolean) => {
    data.showBio = value;
    update();
  }));
};

const validateHero = (data: any, helpers: any) => {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') {
    helpers.pushError(errors, 'HERO', 'Section data is required.');
    return errors;
  }
  helpers.validateRequiredString(data.headline, 'headline', errors);
  helpers.validateRequiredString(data.subheadline, 'subheadline', errors);
  helpers.validateRequiredString(data.primaryCta?.label, 'primaryCta.label', errors);
  helpers.validateRequiredString(data.primaryCta?.url, 'primaryCta.url', errors);
  helpers.validateRequiredString(data.secondaryCta?.label, 'secondaryCta.label', errors);
  helpers.validateRequiredString(data.secondaryCta?.url, 'secondaryCta.url', errors);
  helpers.validateRequiredString(data.backgroundImageUrl, 'backgroundImageUrl', errors);
  return errors;
};

const validateHighlights = (data: any, helpers: any) => {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') {
    helpers.pushError(errors, 'HIGHLIGHTS', 'Section data is required.');
    return errors;
  }
  helpers.validateRequiredString(data.title, 'title', errors);
  if (Array.isArray(data.items)) {
    data.items.forEach((item: any, index: number) => {
      helpers.validateRequiredString(item?.title, `items[${index}].title`, errors);
      helpers.validateRequiredString(item?.text, `items[${index}].text`, errors);
    });
  } else {
    helpers.pushError(errors, 'items', 'Must be a list.');
  }
  return errors;
};

const validateServicesGrid = (data: any, helpers: any) => {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') {
    helpers.pushError(errors, 'SERVICES_GRID', 'Section data is required.');
    return errors;
  }
  helpers.validateRequiredString(data.title, 'title', errors);
  helpers.validateBoolean(data.showPrices, 'showPrices', errors);
  helpers.validatePositiveInt(data.maxItems, 'maxItems', errors);
  return errors;
};

const validateGalleryGrid = (data: any, helpers: any) => {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') {
    helpers.pushError(errors, 'GALLERY_GRID', 'Section data is required.');
    return errors;
  }
  helpers.validateRequiredString(data.title, 'title', errors);
  if (Array.isArray(data.categories)) {
    data.categories.forEach((value: string, index: number) => {
      helpers.validateRequiredString(value, `categories[${index}]`, errors);
    });
  } else {
    helpers.pushError(errors, 'categories', 'Must be a list.');
  }
  helpers.validatePositiveInt(data.limit, 'limit', errors);
  return errors;
};

const validateTestimonials = (data: any, helpers: any) => {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') {
    helpers.pushError(errors, 'TESTIMONIALS', 'Section data is required.');
    return errors;
  }
  helpers.validateRequiredString(data.title, 'title', errors);
  helpers.validatePositiveInt(data.limit, 'limit', errors);
  return errors;
};

const validateFaq = (data: any, helpers: any) => {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') {
    helpers.pushError(errors, 'FAQ', 'Section data is required.');
    return errors;
  }
  helpers.validateRequiredString(data.title, 'title', errors);
  if (Array.isArray(data.items)) {
    data.items.forEach((item: any, index: number) => {
      helpers.validateRequiredString(item?.q, `items[${index}].q`, errors);
      helpers.validateRequiredString(item?.a, `items[${index}].a`, errors);
    });
  } else {
    helpers.pushError(errors, 'items', 'Must be a list.');
  }
  return errors;
};

const validateCta = (data: any, helpers: any) => {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') {
    helpers.pushError(errors, 'CTA', 'Section data is required.');
    return errors;
  }
  helpers.validateRequiredString(data.title, 'title', errors);
  helpers.validateRequiredString(data.text, 'text', errors);
  helpers.validateRequiredString(data.buttonLabel, 'buttonLabel', errors);
  helpers.validateRequiredString(data.buttonUrl, 'buttonUrl', errors);
  return errors;
};

const validateContactCard = (data: any, helpers: any) => {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') {
    helpers.pushError(errors, 'CONTACT_CARD', 'Section data is required.');
    return errors;
  }
  helpers.validateRequiredString(data.title, 'title', errors);
  helpers.validateRequiredString(data.city, 'city', errors);
  helpers.validateRequiredString(data.workHours, 'workHours', errors);
  return errors;
};

const validateMap = (data: any, helpers: any) => {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') {
    helpers.pushError(errors, 'MAP', 'Section data is required.');
    return errors;
  }
  if (typeof data.lat !== 'number') {
    helpers.pushError(errors, 'lat', 'Must be a number.');
  }
  if (typeof data.lng !== 'number') {
    helpers.pushError(errors, 'lng', 'Must be a number.');
  }
  helpers.validatePositiveInt(data.zoom, 'zoom', errors);
  return errors;
};

const validateRichText = (data: any, helpers: any) => {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') {
    helpers.pushError(errors, 'RICH_TEXT', 'Section data is required.');
    return errors;
  }
  helpers.validateRequiredString(data.title, 'title', errors);
  if (Array.isArray(data.blocks)) {
    data.blocks.forEach((block: any, index: number) => helpers.validateRichTextBlock(block, index, errors));
  } else {
    helpers.pushError(errors, 'blocks', 'Must be a list.');
  }
  return errors;
};

const validateStaffGrid = (data: any, helpers: any) => {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') {
    helpers.pushError(errors, 'STAFF_GRID', 'Section data is required.');
    return errors;
  }
  helpers.validateRequiredString(data.title, 'title', errors);
  helpers.validateBoolean(data.showRoles, 'showRoles', errors);
  helpers.validateBoolean(data.showBio, 'showBio', errors);
  return errors;
};

type RegistryEntry = {
  schema: z.ZodTypeAny;
  renderer: (data: Record<string, any>) => string;
  editor: {
    defaults: Record<string, any>;
    buildEditor: (context: any) => void;
    validate: (data: any, helpers: any) => string[];
  };
};

export const pageSectionRegistry: Record<PageSectionType, RegistryEntry> = {
  [PageSectionType.HERO]: {
    schema: heroSchema,
    renderer: renderHero,
    editor: {
      defaults: {
        headline: 'صفحه جدید',
        subheadline: 'رزرو آنلاین و حضوری در شهر شما',
        primaryCta: { label: 'رزرو نوبت', url: '/booking' },
        secondaryCta: { label: 'مشاهده خدمات', url: '/services' },
        backgroundImageUrl: 'https://picsum.photos/seed/new-hero/1600/900',
      },
      buildEditor: buildHeroEditor,
      validate: validateHero,
    },
  },
  [PageSectionType.HIGHLIGHTS]: {
    schema: highlightsSchema,
    renderer: renderHighlights,
    editor: {
      defaults: {
        title: 'چرا ما؟',
        items: [
          { title: 'محیط بهداشتی', text: 'ضدعفونی منظم ابزار و رعایت کامل پروتکل‌ها' },
          { title: 'پرسنل حرفه‌ای', text: 'متخصصین با تجربه در مو، پوست و ناخن' },
          { title: 'رزرو آسان', text: 'رزرو آنلاین/حضوری با مدیریت زمان' },
        ],
      },
      buildEditor: buildHighlightsEditor,
      validate: validateHighlights,
    },
  },
  [PageSectionType.SERVICES_GRID]: {
    schema: servicesGridSchema,
    renderer: renderServicesGrid,
    editor: {
      defaults: {
        title: 'خدمات پرطرفدار',
        showPrices: true,
        maxItems: 12,
      },
      buildEditor: buildServicesGridEditor,
      validate: validateServicesGrid,
    },
  },
  [PageSectionType.GALLERY_GRID]: {
    schema: galleryGridSchema,
    renderer: renderGalleryGrid,
    editor: {
      defaults: {
        title: 'گالری نمونه کار',
        categories: ['مو', 'ناخن', 'پوست', 'سالن'],
        limit: 12,
      },
      buildEditor: buildGalleryGridEditor,
      validate: validateGalleryGrid,
    },
  },
  [PageSectionType.TESTIMONIALS]: {
    schema: testimonialsSchema,
    renderer: renderTestimonials,
    editor: {
      defaults: {
        title: 'نظرات مشتریان',
        limit: 6,
      },
      buildEditor: buildTestimonialsEditor,
      validate: validateTestimonials,
    },
  },
  [PageSectionType.FAQ]: {
    schema: faqSchema,
    renderer: renderFaq,
    editor: {
      defaults: {
        title: 'سوالات پرتکرار',
        items: [
          { q: 'برای رزرو آنلاین نیاز به پرداخت است؟', a: 'بسته به سرویس، ممکن است بیعانه فعال باشد.' },
          { q: 'چطور زمان رزرو را تغییر دهم؟', a: 'از طریق تماس با پذیرش یا پنل رزرو اقدام کنید.' },
        ],
      },
      buildEditor: buildFaqEditor,
      validate: validateFaq,
    },
  },
  [PageSectionType.CTA]: {
    schema: ctaSchema,
    renderer: renderCta,
    editor: {
      defaults: {
        title: 'برای تغییر استایل آماده‌اید؟',
        text: 'همین الان نوبت خود را رزرو کنید.',
        buttonLabel: 'رزرو نوبت',
        buttonUrl: '/booking',
      },
      buildEditor: buildCtaEditor,
      validate: validateCta,
    },
  },
  [PageSectionType.CONTACT_CARD]: {
    schema: contactCardSchema,
    renderer: renderContactCard,
    editor: {
      defaults: {
        title: 'اطلاعات تماس',
        city: 'تهران',
        workHours: '09:00 تا 20:00',
      },
      buildEditor: buildContactCardEditor,
      validate: validateContactCard,
    },
  },
  [PageSectionType.MAP]: {
    schema: mapSchema,
    renderer: renderMap,
    editor: {
      defaults: {
        lat: 35.6892,
        lng: 51.389,
        zoom: 14,
      },
      buildEditor: buildMapEditor,
      validate: validateMap,
    },
  },
  [PageSectionType.RICH_TEXT]: {
    schema: richTextSchema,
    renderer: renderRichText,
    editor: {
      defaults: {
        title: 'درباره ما',
        blocks: [
          { type: 'paragraph', text: 'ما با تمرکز بر کیفیت، بهداشت و تجربه مشتری فعالیت می‌کنیم.' },
          { type: 'paragraph', text: 'تیم ما با جدیدترین متدها آماده ارائه خدمات است.' },
        ],
      },
      buildEditor: buildRichTextEditor,
      validate: validateRichText,
    },
  },
  [PageSectionType.STAFF_GRID]: {
    schema: staffGridSchema,
    renderer: renderStaffGrid,
    editor: {
      defaults: {
        title: 'تیم ما',
        showRoles: true,
        showBio: true,
      },
      buildEditor: buildStaffGridEditor,
      validate: validateStaffGrid,
    },
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
  const entries = Object.entries(pageSectionRegistry).map(([type, entry]) => {
    const defaults = JSON.stringify(entry.editor.defaults ?? {});
    const buildEditor = entry.editor.buildEditor ? entry.editor.buildEditor.toString() : 'null';
    const validate = entry.editor.validate ? entry.editor.validate.toString() : 'null';
    return `${JSON.stringify(type)}: { defaults: ${defaults}, buildEditor: ${buildEditor}, validate: ${validate} }`;
  });

  return `{
${entries.map((line) => `  ${line}`).join(',\n')}
}`;
};

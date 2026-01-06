import { PageSectionType } from '@prisma/client';

type PageSectionInput = {
  type: PageSectionType | string;
  dataJson?: string | null;
  isEnabled?: boolean | null;
};

type PageRenderInput = {
  title?: string;
  sections?: PageSectionInput[];
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const renderButton = (label?: string, url?: string) => {
  if (!label || !url) return '';
  return `<a class="btn" href="${escapeHtml(url)}">${escapeHtml(label)}</a>`;
};

const parseSectionData = (dataJson?: string | null) => {
  if (!dataJson) return null;
  try {
    return JSON.parse(dataJson) as Record<string, unknown>;
  } catch (error) {
    return null;
  }
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
              <p>“Great experience ${index + 1}.”</p>
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

const sectionRenderers: Record<PageSectionType, (data: Record<string, any>) => string> = {
  [PageSectionType.HERO]: renderHero,
  [PageSectionType.HIGHLIGHTS]: renderHighlights,
  [PageSectionType.SERVICES_GRID]: renderServicesGrid,
  [PageSectionType.GALLERY_GRID]: renderGalleryGrid,
  [PageSectionType.TESTIMONIALS]: renderTestimonials,
  [PageSectionType.FAQ]: renderFaq,
  [PageSectionType.CTA]: renderCta,
  [PageSectionType.CONTACT_CARD]: renderContactCard,
  [PageSectionType.MAP]: renderMap,
  [PageSectionType.RICH_TEXT]: renderRichText,
  [PageSectionType.STAFF_GRID]: renderStaffGrid,
};

export const renderPageSections = (sections: PageSectionInput[] = []) =>
  sections
    .filter((section) => section?.isEnabled !== false)
    .map((section) => {
      const renderer = sectionRenderers[section.type as PageSectionType];
      if (!renderer) {
        return `
          <section class="section">
            <div class="card-block">
              <h3>Unsupported section: ${escapeHtml(String(section.type))}</h3>
            </div>
          </section>
        `;
      }
      const data = parseSectionData(section.dataJson);
      if (!data) {
        return `
          <section class="section">
            <div class="card-block">
              <h3>Invalid data for ${escapeHtml(String(section.type))}</h3>
            </div>
          </section>
        `;
      }
      return renderer(data);
    })
    .join('');

export const renderPageDocument = ({ title, sections }: PageRenderInput) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title ?? 'Preview')}</title>
    <style>
      body {
        margin: 0;
        font-family: "Inter", "Segoe UI", sans-serif;
        color: #111827;
        background: #f9fafb;
      }
      .page {
        max-width: 1100px;
        margin: 0 auto;
        padding: 32px 24px 64px;
      }
      .section {
        margin-bottom: 32px;
      }
      h2 {
        margin: 0 0 12px;
        font-size: 24px;
      }
      h3 {
        margin: 0 0 6px;
        font-size: 16px;
      }
      p {
        margin: 0 0 8px;
        color: #4b5563;
        line-height: 1.6;
      }
      .hero {
        position: relative;
        color: #ffffff;
        border-radius: 20px;
        padding: 64px 32px;
        background: #1f2937;
        background-size: cover;
        background-position: center;
        overflow: hidden;
      }
      .hero-overlay {
        position: absolute;
        inset: 0;
        background: rgba(15, 23, 42, 0.55);
      }
      .hero-content {
        position: relative;
        z-index: 1;
        max-width: 600px;
      }
      .hero-actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        margin-top: 18px;
      }
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 10px 18px;
        border-radius: 999px;
        background: #ffffff;
        color: #111827;
        font-size: 14px;
        text-decoration: none;
        font-weight: 600;
      }
      .grid {
        display: grid;
        gap: 16px;
      }
      .grid.three {
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      }
      .card-block {
        background: #ffffff;
        border-radius: 16px;
        padding: 16px;
        border: 1px solid #e5e7eb;
      }
      .pill-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 16px;
      }
      .pill {
        padding: 6px 12px;
        border-radius: 999px;
        background: #eef2ff;
        color: #4338ca;
        font-size: 12px;
      }
      .image-card {
        height: 120px;
        background: #e5e7eb;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #6b7280;
      }
      .stack {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .cta {
        background: #111827;
        color: #ffffff;
        padding: 32px;
        border-radius: 20px;
      }
      .cta p {
        color: #d1d5db;
      }
      .cta .btn {
        background: #ffffff;
        color: #111827;
      }
      .map-card {
        border: 1px dashed #cbd5f5;
        padding: 16px;
        border-radius: 12px;
        background: #eef2ff;
      }
    </style>
  </head>
  <body>
    <div class="page">
      ${renderPageSections(sections)}
    </div>
  </body>
</html>`;

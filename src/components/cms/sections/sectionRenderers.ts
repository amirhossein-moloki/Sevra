import { PageSectionType } from '@prisma/client';

export type PageSectionInput = {
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

const renderButton = (label?: string, url?: string) => {
  if (!label || !url) return '';
  return `<a class="btn" href="${escapeHtml(url)}">${escapeHtml(label)}</a>`;
};

export const parseSectionData = (dataJson?: string | null) => {
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

export const sectionRenderers: Record<PageSectionType, (data: Record<string, any>) => string> = {
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

import { PageSectionType } from '@prisma/client';

import {
  PageSectionInput,
  escapeHtml,
  parseSectionData,
  sectionRenderers,
} from './sections/sectionRenderers';

type PageRendererProps = {
  sections?: PageSectionInput[];
};

export const renderPageSections = (sections: PageSectionInput[] = []) =>
  [...sections]
    .filter((section) => section?.isEnabled !== false)
    .sort((a, b) => (a?.sortOrder ?? 0) - (b?.sortOrder ?? 0))
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

export const PageRenderer = ({ sections = [] }: PageRendererProps) => renderPageSections(sections);

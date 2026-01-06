import { PageRenderer } from '../../components/cms/PageRenderer';
import { PageSectionInput, escapeHtml } from '../../components/cms/sections/sectionRenderers';

type PageRenderInput = {
  title?: string;
  sections?: PageSectionInput[];
  pageId?: string;
};

export const renderPageDocument = ({ title, sections, pageId }: PageRenderInput) => `<!doctype html>
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
      ${PageRenderer({ sections, pageId })}
    </div>
  </body>
</html>`;

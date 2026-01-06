import { Router } from 'express';
import { PageStatus, PageType } from '@prisma/client';

export const cmsAdminUiRouter = Router();

const buildOptions = (values: string[]) =>
  values.map((value) => `<option value="${value}">${value}</option>`).join('');

const statusOptions = buildOptions(Object.values(PageStatus));
const typeOptions = buildOptions(Object.values(PageType));

cmsAdminUiRouter.get('/salons/:salonId/pages', (req, res) => {
  const { salonId } = req.params;
  res.type('html').send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>CMS Pages</title>
    <style>
      body {
        font-family: "Inter", "Segoe UI", sans-serif;
        margin: 0;
        background: #f6f7fb;
        color: #1f2933;
      }
      header {
        background: #ffffff;
        border-bottom: 1px solid #e5e7eb;
        padding: 24px 32px;
      }
      h1 {
        margin: 0 0 8px;
        font-size: 22px;
      }
      .subtitle {
        color: #6b7280;
        font-size: 14px;
      }
      main {
        padding: 24px 32px 40px;
      }
      .filters {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 16px;
        margin-bottom: 16px;
      }
      .filters label {
        display: block;
        font-size: 12px;
        color: #6b7280;
        margin-bottom: 6px;
      }
      .filters select,
      .filters input {
        width: 100%;
        padding: 8px 10px;
        border-radius: 8px;
        border: 1px solid #d1d5db;
        background: #ffffff;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        align-items: center;
        margin: 16px 0 24px;
      }
      button {
        padding: 8px 14px;
        border-radius: 8px;
        border: 1px solid #cbd2d9;
        background: #ffffff;
        cursor: pointer;
      }
      button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .card {
        background: #ffffff;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
        padding: 16px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th,
      td {
        padding: 12px 8px;
        text-align: left;
        border-bottom: 1px solid #eef0f3;
        font-size: 14px;
      }
      th {
        color: #6b7280;
        font-weight: 600;
      }
      .badge {
        display: inline-block;
        padding: 2px 10px;
        border-radius: 999px;
        font-size: 12px;
        background: #eef2ff;
        color: #4338ca;
      }
      .state {
        padding: 32px 12px;
        text-align: center;
        color: #6b7280;
      }
      .state strong {
        display: block;
        font-size: 16px;
        color: #111827;
        margin-bottom: 6px;
      }
      .error {
        color: #b42318;
      }
      .pagination {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 16px;
        color: #6b7280;
        font-size: 13px;
      }
    </style>
  </head>
  <body>
    <header>
      <h1>CMS Pages</h1>
      <div class="subtitle">Salon ID: ${salonId}</div>
    </header>
    <main>
      <div class="filters">
        <div>
          <label for="statusFilter">Status</label>
          <select id="statusFilter">
            <option value="">All statuses</option>
            ${statusOptions}
          </select>
        </div>
        <div>
          <label for="typeFilter">Type</label>
          <select id="typeFilter">
            <option value="">All types</option>
            ${typeOptions}
          </select>
        </div>
        <div>
          <label for="authToken">Auth token</label>
          <input id="authToken" placeholder="Paste bearer token" />
        </div>
      </div>
      <div class="actions">
        <button id="refreshButton">Refresh</button>
        <span id="statusText"></span>
      </div>
      <div class="card">
        <table aria-live="polite">
          <thead>
            <tr>
              <th>Title</th>
              <th>Slug</th>
              <th>Type</th>
              <th>Status</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody id="pagesBody"></tbody>
        </table>
        <div class="state" id="stateMessage" hidden></div>
      </div>
      <div class="pagination">
        <button id="prevButton">Previous</button>
        <span id="paginationSummary">Page 1</span>
        <button id="nextButton">Next</button>
      </div>
    </main>
    <script>
      const pagesBody = document.getElementById('pagesBody');
      const statusFilter = document.getElementById('statusFilter');
      const typeFilter = document.getElementById('typeFilter');
      const authTokenInput = document.getElementById('authToken');
      const statusText = document.getElementById('statusText');
      const stateMessage = document.getElementById('stateMessage');
      const prevButton = document.getElementById('prevButton');
      const nextButton = document.getElementById('nextButton');
      const paginationSummary = document.getElementById('paginationSummary');
      const refreshButton = document.getElementById('refreshButton');

      let limit = 10;
      let offset = 0;
      let total = 0;

      const loadStoredToken = () => {
        const stored = localStorage.getItem('cmsAdminToken');
        if (stored) {
          authTokenInput.value = stored;
        }
      };

      const saveToken = () => {
        const token = authTokenInput.value.trim();
        if (token) {
          localStorage.setItem('cmsAdminToken', token);
        }
      };

      const setState = ({ message, isError = false }) => {
        if (!message) {
          stateMessage.hidden = true;
          stateMessage.textContent = '';
          stateMessage.classList.remove('error');
          return;
        }
        stateMessage.hidden = false;
        stateMessage.innerHTML = isError
          ? `<strong>Unable to load pages</strong>${message}`
          : `<strong>No pages found</strong>${message}`;
        stateMessage.classList.toggle('error', isError);
      };

      const updatePagination = () => {
        const currentPage = Math.floor(offset / limit) + 1;
        const totalPages = Math.max(1, Math.ceil(total / limit));
        paginationSummary.textContent = `Page ${currentPage} of ${totalPages} • ${total} total`;
        prevButton.disabled = offset === 0;
        nextButton.disabled = offset + limit >= total;
      };

      const renderRows = (pages) => {
        pagesBody.innerHTML = '';
        pages.forEach((page) => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${page.title ?? '-'}</td>
            <td>${page.slug ?? '-'}</td>
            <td>${page.type ?? '-'}</td>
            <td><span class="badge">${page.status ?? '-'}</span></td>
            <td>${page.updatedAt ? new Date(page.updatedAt).toLocaleString() : '-'}</td>
          `;
          pagesBody.appendChild(row);
        });
      };

      const fetchPages = async () => {
        statusText.textContent = 'Loading...';
        setState({ message: '' });
        pagesBody.innerHTML = '';
        const params = new URLSearchParams();
        if (statusFilter.value) params.set('status', statusFilter.value);
        if (typeFilter.value) params.set('type', typeFilter.value);
        params.set('limit', limit);
        params.set('offset', offset);

        const token = authTokenInput.value.trim();
        if (token) saveToken();

        try {
          const response = await fetch(`/api/v1/salons/${salonId}/pages?${params}`,
            {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            }
          );
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || response.statusText);
          }
          const payload = await response.json();
          const pages = payload.data ?? [];
          total = payload.meta?.total ?? pages.length;
          limit = payload.meta?.limit ?? limit;
          offset = payload.meta?.offset ?? offset;
          if (pages.length === 0) {
            setState({ message: 'Adjust filters or create a new page to get started.' });
          }
          renderRows(pages);
          updatePagination();
          statusText.textContent = 'Loaded';
        } catch (error) {
          setState({
            message: `${error instanceof Error ? error.message : 'Unexpected error.'}`,
            isError: true,
          });
          statusText.textContent = 'Failed to load.';
        }
      };

      statusFilter.addEventListener('change', () => {
        offset = 0;
        fetchPages();
      });
      typeFilter.addEventListener('change', () => {
        offset = 0;
        fetchPages();
      });
      refreshButton.addEventListener('click', fetchPages);
      prevButton.addEventListener('click', () => {
        offset = Math.max(0, offset - limit);
        fetchPages();
      });
      nextButton.addEventListener('click', () => {
        offset = offset + limit;
        fetchPages();
      });

      loadStoredToken();
      fetchPages();
    </script>
  </body>
</html>`);
});

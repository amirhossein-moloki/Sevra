import { Router } from 'express';
import { PageStatus, PageType, RobotsFollow, RobotsIndex, UserRole } from '@prisma/client';
import { renderPageDocument } from '../public/page-renderer';
import { authMiddleware } from '../../common/middleware/auth';
import { tenantGuard } from '../../common/middleware/tenantGuard';
import { requireRole } from '../../common/middleware/requireRole';
import { pageEditorTemplate, pagesListTemplate } from './admin-ui.templates';

export const cmsAdminUiRouter = Router();

// Secure all admin UI routes
cmsAdminUiRouter.use(authMiddleware, tenantGuard, requireRole([UserRole.MANAGER]));

const buildOptions = (values: string[]) =>
  values.map((value) => `<option value="${value}">${value}</option>`).join('');

const statusOptions = buildOptions(Object.values(PageStatus));
const typeOptions = buildOptions(Object.values(PageType));
const robotsIndexOptions = buildOptions(Object.values(RobotsIndex));
const robotsFollowOptions = buildOptions(Object.values(RobotsFollow));

cmsAdminUiRouter.get('/salons/:salonId/pages', (req, res) => {
  const { salonId } = req.params;
  const html = pagesListTemplate(salonId, statusOptions, typeOptions);
  res.type('html').send(html);
});

cmsAdminUiRouter.post('/salons/:salonId/pages/preview', (req, res) => {
  const { title, sections, pageId } = req.body ?? {};
  const html = renderPageDocument({ title, sections, pageId });
  res.type('html').send(html);
});

cmsAdminUiRouter.get('/salons/:salonId/pages/:pageId', (req, res) => {
  const { salonId, pageId } = req.params;
  const html = pageEditorTemplate(
    salonId,
    pageId,
    statusOptions,
    typeOptions,
    robotsIndexOptions,
    robotsFollowOptions
  );
  res.type('html').send(html);
});

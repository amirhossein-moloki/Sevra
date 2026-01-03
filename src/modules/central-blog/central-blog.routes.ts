import { Router } from 'express';
import { createCentralArticleHandler } from './central-blog.controller';

const router = Router();

router.post('/', createCentralArticleHandler);

export default router;

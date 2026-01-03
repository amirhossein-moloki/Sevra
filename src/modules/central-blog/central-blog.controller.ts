import { Request, Response } from 'express';
import { createCentralArticle } from './central-blog.service';
import httpStatus from 'http-status';

export const createCentralArticleHandler = async (req: Request, res: Response) => {
  const articleData = req.body;
  const newArticle = await createCentralArticle(articleData);
  res.status(httpStatus.CREATED).json(newArticle);
};

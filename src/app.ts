import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import routes from './routes';
import { errorHandler } from './common/errors/errorHandler';
import { responseMiddleware } from './common/middleware/response';

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());

import loggerMiddleware from './common/middleware/logger';
import rateLimiter from './common/middleware/rateLimit';

app.use(loggerMiddleware);
app.use(rateLimiter);

app.use((req, res, next) => {
  req.id = uuidv4();
  next();
});

app.use(responseMiddleware);

app.use('/api/v1', routes);

app.use(errorHandler);

export default app;

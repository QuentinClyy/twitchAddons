import cors from 'cors';
import express from 'express';
import { errorHandler } from './common/errors';
import { config } from './config/env';
import { valorantRouter } from './modules/valorant/router';

const app = express();

app.use(cors({ origin: config.allowedOrigin }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/valorant', valorantRouter);

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`API listening on port ${config.port}`);
});

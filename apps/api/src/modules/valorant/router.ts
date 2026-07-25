import { Router } from 'express';
import { scrapeRank } from './scrapeRank';

export const valorantRouter = Router();

valorantRouter.get('/rank', (req, res, next) => {
  const { riotId } = req.query;
  if (typeof riotId !== 'string' || riotId.length === 0) {
    res.status(400).json({ error: 'Missing required "riotId" query parameter' });
    return;
  }

  scrapeRank(riotId)
    .then((rank) => res.json(rank))
    .catch(next);
});

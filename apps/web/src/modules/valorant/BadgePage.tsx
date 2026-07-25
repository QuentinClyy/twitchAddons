import { useEffect, useState } from 'react';
import { HttpError } from '../../common/http';
import { getQueryParam } from '../../common/queryParams';
import { fetchPlayerRank } from './api';
import { getRankImage } from './rankAssets';
import type { RankResponse } from './types';

type Status =
  | { state: 'loading' }
  | { state: 'error'; message: string }
  | { state: 'ready'; rank: RankResponse };

export function BadgePage() {
  const riotId = getQueryParam('player');
  const [status, setStatus] = useState<Status>({ state: 'loading' });

  useEffect(() => {
    if (!riotId) {
      setStatus({ state: 'error', message: 'Missing ?player=Name#Tag query param' });
      return;
    }

    let cancelled = false;

    fetchPlayerRank(riotId)
      .then((rank) => {
        if (!cancelled) setStatus({ state: 'ready', rank });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof HttpError ? error.message : 'Failed to load rank';
        setStatus({ state: 'error', message });
      });

    return () => {
      cancelled = true;
    };
  }, [riotId]);

  if (status.state === 'loading') {
    return <p>Loading…</p>;
  }

  if (status.state === 'error') {
    return <p role="alert">{status.message}</p>;
  }

  return <img src={getRankImage(status.rank.tier)} alt={status.rank.tier} />;
}

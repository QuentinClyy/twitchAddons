import { getJson } from '../../common/http';
import { config } from '../../config/env';
import type { RankResponse } from './types';

export function fetchPlayerRank(riotId: string): Promise<RankResponse> {
  const url = `${config.apiBaseUrl}/valorant/rank?riotId=${encodeURIComponent(riotId)}`;
  return getJson<RankResponse>(url);
}

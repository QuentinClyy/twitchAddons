import { getJson } from '../../common/http';
import { config } from '../../config/env';
import { RANK_TIERS, type RankResponse, type RankTier } from './types';

const HENRIK_BASE_URL = 'https://api.henrikdev.xyz';

interface AccountResponse {
  data: { region: string };
}

interface MmrResponse {
  data: {
    current: {
      tier: { name: string };
      rr: number;
    };
  };
}

function isRankTier(value: string): value is RankTier {
  return (RANK_TIERS as readonly string[]).includes(value);
}

function henrikHeaders(): HeadersInit {
  return config.henrikApiKey ? { Authorization: config.henrikApiKey } : {};
}

export async function fetchPlayerRank(name: string, tag: string): Promise<RankResponse> {
  const encodedName = encodeURIComponent(name);
  const encodedTag = encodeURIComponent(tag);
  const headers = henrikHeaders();

  const account = await getJson<AccountResponse>(
    `${HENRIK_BASE_URL}/valorant/v2/account/${encodedName}/${encodedTag}`,
    { headers },
  );

  const mmr = await getJson<MmrResponse>(
    `${HENRIK_BASE_URL}/valorant/v3/mmr/${account.data.region}/pc/${encodedName}/${encodedTag}`,
    { headers },
  );

  const tierName = mmr.data.current.tier.name;
  if (!isRankTier(tierName)) {
    throw new Error(`Unrecognized rank tier "${tierName}" for "${name}#${tag}"`);
  }

  return {
    riotId: `${name}#${tag}`,
    tier: tierName,
    rr: mmr.data.current.rr,
    updatedAt: new Date().toISOString(),
  };
}

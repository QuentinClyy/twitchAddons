import { AppError } from '../../common/errors';
import type { RankResponse } from './types';

// TODO: implement the real tracker.gg lookup for `riotId` (e.g. "Name#Tag").
// tracker.gg is Cloudflare-protected and its markup/internal API can change without
// notice, so this needs to be built and verified against the live site rather than
// guessed here. Until then, throw so callers get an explicit 501 instead of wrong data.
export async function scrapeRank(riotId: string): Promise<RankResponse> {
  throw new AppError(501, `Rank lookup for "${riotId}" is not implemented yet`);
}

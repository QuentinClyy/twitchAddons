type BadgeMap = Map<string, string>;

interface BadgeDisplayResponse {
  badge_sets: Record<string, { versions: Record<string, { image_url_1x: string }> }>;
}

async function fetchBadgeMap(url: string): Promise<BadgeMap> {
  const map: BadgeMap = new Map();
  try {
    const res = await fetch(url);
    if (!res.ok) return map;
    const data = (await res.json()) as BadgeDisplayResponse;
    for (const [setId, set] of Object.entries(data.badge_sets ?? {})) {
      for (const [version, info] of Object.entries(set.versions ?? {})) {
        map.set(`${setId}/${version}`, info.image_url_1x);
      }
    }
  } catch {
    // Badges are decorative; a failed fetch just means none render.
  }
  return map;
}

let globalBadgesPromise: Promise<BadgeMap> | null = null;
function getGlobalBadges(): Promise<BadgeMap> {
  if (!globalBadgesPromise) {
    globalBadgesPromise = fetchBadgeMap('https://badges.twitch.tv/v1/badges/global/display');
  }
  return globalBadgesPromise;
}

const channelBadgesCache = new Map<string, Promise<BadgeMap>>();
function getChannelBadges(roomId: string): Promise<BadgeMap> {
  let promise = channelBadgesCache.get(roomId);
  if (!promise) {
    promise = fetchBadgeMap(`https://badges.twitch.tv/v1/badges/channels/${roomId}/display`);
    channelBadgesCache.set(roomId, promise);
  }
  return promise;
}

export async function resolveBadges(
  badgesTag: string | undefined,
  roomId: string | undefined,
): Promise<string[]> {
  if (!badgesTag) return [];
  const [global, channel] = await Promise.all([
    getGlobalBadges(),
    roomId ? getChannelBadges(roomId) : Promise.resolve(new Map<string, string>()),
  ]);
  const urls: string[] = [];
  for (const pair of badgesTag.split(',')) {
    if (!pair) continue;
    const url = channel.get(pair) ?? global.get(pair);
    if (url) urls.push(url);
  }
  return urls;
}

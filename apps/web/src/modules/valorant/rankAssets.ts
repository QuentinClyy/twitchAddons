import type { RankTier } from './types';

const rankImages: Record<RankTier, string> = {
  Unranked: '/ranks/unranked.png',
  iron1: '/ranks/iron-1.png',
  iron2: '/ranks/iron-2.png',
  iron3: '/ranks/iron-3.png',
  bronze1: '/ranks/bronze-1.png',
  bronze2: '/ranks/bronze-2.png',
  bronze3: '/ranks/bronze-3.png',
  silver1: '/ranks/silver-1.png',
  silver2: '/ranks/silver-2.png',
  silver3: '/ranks/silver-3.png',
  gold1: '/ranks/gold-1.png',
  gold2: '/ranks/gold-2.png',
  gold3: '/ranks/gold-3.png',
  platinum1: '/ranks/platinum-1.png',
  platinum2: '/ranks/platinum-2.png',
  platinum3: '/ranks/platinum-3.png',
  diamond1: '/ranks/diamond-1.png',
  diamond2: '/ranks/diamond-2.png',
  diamond3: '/ranks/diamond-3.png',
  ascendant1: '/ranks/ascendant-1.png',
  ascendant2: '/ranks/ascendant-2.png',
  ascendant3: '/ranks/ascendant-3.png',
  immortal1: '/ranks/immortal-1.png',
  immortal2: '/ranks/immortal-2.png',
  immortal3: '/ranks/immortal-3.png',
  radiant: '/ranks/radiant.png',
};

export function getRankImage(tier: RankTier): string {
  return rankImages[tier];
}

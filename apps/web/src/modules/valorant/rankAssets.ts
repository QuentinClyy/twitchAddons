import type { RankTier } from './types';

const rankImages: Record<RankTier, string> = {
  Unranked: '/ranks/unranked.png',
  'Iron 1': '/ranks/iron-1.png',
  'Iron 2': '/ranks/iron-2.png',
  'Iron 3': '/ranks/iron-3.png',
  'Bronze 1': '/ranks/bronze-1.png',
  'Bronze 2': '/ranks/bronze-2.png',
  'Bronze 3': '/ranks/bronze-3.png',
  'Silver 1': '/ranks/silver-1.png',
  'Silver 2': '/ranks/silver-2.png',
  'Silver 3': '/ranks/silver-3.png',
  'Gold 1': '/ranks/gold-1.png',
  'Gold 2': '/ranks/gold-2.png',
  'Gold 3': '/ranks/gold-3.png',
  'Platinum 1': '/ranks/platinum-1.png',
  'Platinum 2': '/ranks/platinum-2.png',
  'Platinum 3': '/ranks/platinum-3.png',
  'Diamond 1': '/ranks/diamond-1.png',
  'Diamond 2': '/ranks/diamond-2.png',
  'Diamond 3': '/ranks/diamond-3.png',
  'Ascendant 1': '/ranks/ascendant-1.png',
  'Ascendant 2': '/ranks/ascendant-2.png',
  'Ascendant 3': '/ranks/ascendant-3.png',
  'Immortal 1': '/ranks/immortal-1.png',
  'Immortal 2': '/ranks/immortal-2.png',
  'Immortal 3': '/ranks/immortal-3.png',
  Radiant: '/ranks/radiant.png',
};

export function getRankImage(tier: RankTier): string {
  return rankImages[tier];
}

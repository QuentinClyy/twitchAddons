import type { RankTier } from './types';

const rankImages: Record<RankTier, string> = {
  Unranked: '/ranks/unranked.png',
  'Iron 1': '/ranks/iron.png',
  'Iron 2': '/ranks/iron.png',
  'Iron 3': '/ranks/iron.png',
  'Bronze 1': '/ranks/bronze.png',
  'Bronze 2': '/ranks/bronze.png',
  'Bronze 3': '/ranks/bronze.png',
  'Silver 1': '/ranks/silver.png',
  'Silver 2': '/ranks/silver.png',
  'Silver 3': '/ranks/silver.png',
  'Gold 1': '/ranks/gold.png',
  'Gold 2': '/ranks/gold.png',
  'Gold 3': '/ranks/gold.png',
  'Platinum 1': '/ranks/platinum.png',
  'Platinum 2': '/ranks/platinum.png',
  'Platinum 3': '/ranks/platinum.png',
  'Diamond 1': '/ranks/diamond.png',
  'Diamond 2': '/ranks/diamond.png',
  'Diamond 3': '/ranks/diamond.png',
  'Ascendant 1': '/ranks/ascendant.png',
  'Ascendant 2': '/ranks/ascendant.png',
  'Ascendant 3': '/ranks/ascendant.png',
  'Immortal 1': '/ranks/immortal.png',
  'Immortal 2': '/ranks/immortal.png',
  'Immortal 3': '/ranks/immortal.png',
  Radiant: '/ranks/radiant.png',
};

export function getRankImage(tier: RankTier): string {
  return rankImages[tier];
}

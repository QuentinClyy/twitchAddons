import type { RankTier } from './types';

const rankFiles: Record<RankTier, string> = {
  Unranked: 'unranked.png',
  'Iron 1': 'iron.png',
  'Iron 2': 'iron.png',
  'Iron 3': 'iron.png',
  'Bronze 1': 'bronze.png',
  'Bronze 2': 'bronze.png',
  'Bronze 3': 'bronze.png',
  'Silver 1': 'silver.png',
  'Silver 2': 'silver.png',
  'Silver 3': 'silver.png',
  'Gold 1': 'gold.png',
  'Gold 2': 'gold.png',
  'Gold 3': 'gold.png',
  'Platinum 1': 'platinum.png',
  'Platinum 2': 'platinum.png',
  'Platinum 3': 'platinum.png',
  'Diamond 1': 'diamond.png',
  'Diamond 2': 'diamond.png',
  'Diamond 3': 'diamond.png',
  'Ascendant 1': 'ascendant.png',
  'Ascendant 2': 'ascendant.png',
  'Ascendant 3': 'ascendant.png',
  'Immortal 1': 'immortal.png',
  'Immortal 2': 'immortal.png',
  'Immortal 3': 'immortal.png',
  Radiant: 'radiant.png',
};

export function getRankImage(tier: RankTier): string {
  return `${import.meta.env.BASE_URL}ranks/${rankFiles[tier]}`;
}

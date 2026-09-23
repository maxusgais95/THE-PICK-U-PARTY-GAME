/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { KaboomBonusItem, KaboomBonusSpriteId } from '../../types';
import bonusMusicalNoteImg from '../../assets/images/Music Note Sprite.png';
import bonusHeadsetImg from '../../assets/images/Headsets Sprite.png';
import bonusCuteStarImg from '../../assets/images/Star Sprite.png';
import bonusCrystalRoseImg from '../../assets/images/Crystal Rose Sprite.png';
import bonusDiamondKeyImg from '../../assets/images/Key Sprite.png';

export const KABOOM_BONUS_ITEMS: KaboomBonusItem[] = [
  {
    id: 'musical_note',
    name: 'Musical Note',
    rank: 1,
    rankName: 'Common',
    starReward: 15,
    probability: 0.44, // 44% probability
    tagline: 'Skill: Tap 1 Ball',
    description: 'Tier 1 bonus! Discovered skill automatically taps 1 safe ball and awards +15 Stars!',
    image: bonusMusicalNoteImg,
    accentColor: '#00f0ff',
    glowColor: 'rgba(0, 240, 255, 0.8)',
    badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
    borderColor: 'border-[#00f0ff]',
  },
  {
    id: 'headset',
    name: 'DJ Headset',
    rank: 2,
    rankName: 'Uncommon',
    starReward: 25,
    probability: 0.26, // 26% probability
    tagline: 'Skill: Tap 2 Balls',
    description: 'Tier 2 bonus! Discovered skill automatically taps 2 safe balls and awards +25 Stars!',
    image: bonusHeadsetImg,
    accentColor: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.8)',
    badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-400/40',
    borderColor: 'border-[#38bdf8]',
  },
  {
    id: 'cute_star',
    name: 'Cute Star',
    rank: 3,
    rankName: 'Rare',
    starReward: 35,
    probability: 0.16, // 16% probability
    tagline: 'Skill: Tap 3 Balls',
    description: 'Tier 3 bonus! Discovered skill automatically taps 3 safe balls and awards +35 Stars!',
    image: bonusCuteStarImg,
    accentColor: '#f43f5e',
    glowColor: 'rgba(244, 63, 94, 0.8)',
    badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
    borderColor: 'border-[#f43f5e]',
  },
  {
    id: 'crystal_rose',
    name: 'Crystal Rose',
    rank: 4,
    rankName: 'Epic',
    starReward: 50,
    probability: 0.10, // 10% probability
    tagline: 'Skill: Tap 4 Balls',
    description: 'Tier 4 bonus! Discovered skill automatically taps 4 safe balls and awards +50 Stars!',
    image: bonusCrystalRoseImg,
    accentColor: '#c084fc',
    glowColor: 'rgba(192, 132, 252, 0.85)',
    badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
    borderColor: 'border-[#c084fc]',
  },
  {
    id: 'diamond_key',
    name: 'Diamond Key',
    rank: 5,
    rankName: 'Legendary',
    starReward: 75,
    probability: 0.04, // 4% probability (highest rank, lowest probability)
    tagline: 'Skill: Tap 5 Balls',
    description: 'Highest tier bonus! Discovered skill automatically taps 5 safe balls and awards +75 Stars!',
    image: bonusDiamondKeyImg,
    accentColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.9)',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-400/50',
    borderColor: 'border-[#f59e0b]',
  },
];

/**
 * Determine the maximum bonus tier allowed based on grid dimension
 * 2x2 board: max tier 2 (tiers 1-2 only: 1-2 taps)
 * 3x3 board: max tier 3 (tiers 1-3 only: 1-3 taps)
 * 4x4 board: max tier 4 (tiers 1-4 only: 1-4 taps)
 * 5x5, 6x6: max tier 5 (all tiers 1-5 possible)
 */
export function getMaxBonusTierForDimension(dimension: number): number {
  if (dimension <= 2) return 2;
  if (dimension === 3) return 3;
  if (dimension === 4) return 4;
  return 5;
}

/**
 * Randomly select a bonus item weighted inversely by rank,
 * respecting the maximum tier for the current grid size.
 */
export function getRandomBonusItem(maxTier: number = 5): KaboomBonusItem {
  const eligible = KABOOM_BONUS_ITEMS.filter((item) => item.rank <= maxTier);
  if (eligible.length === 0) return KABOOM_BONUS_ITEMS[0];

  const totalProb = eligible.reduce((acc, item) => acc + item.probability, 0);
  const roll = Math.random() * totalProb;
  let cumulative = 0;
  for (const item of eligible) {
    cumulative += item.probability;
    if (roll <= cumulative) {
      return item;
    }
  }
  return eligible[0];
}

export function getBonusItemById(id: KaboomBonusSpriteId): KaboomBonusItem {
  return (
    KABOOM_BONUS_ITEMS.find((item) => item.id === id) || KABOOM_BONUS_ITEMS[0]
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Trophy 001 - Roulette Virtuoso
import bronzeTrophy001 from '../assets/images/trophies/Bronze Trophy 001.webp';
import silverTrophy001 from '../assets/images/trophies/Silver Trophy 001.webp';
import goldTrophy001 from '../assets/images/trophies/Gold Trophy 001.webp';
import platinumTrophy001 from '../assets/images/trophies/Platinum Trophy 001.webp';

// Trophy 002 - Party Monarch
import bronzeTrophy002 from '../assets/images/trophies/Bronze Trophy 002.webp';
import silverTrophy002 from '../assets/images/trophies/Silver Trophy 002.webp';
import goldTrophy002 from '../assets/images/trophies/Gold Trophy 002.webp';
import platinumTrophy002 from '../assets/images/trophies/Platinum Trophy 002.webp';

// Trophy 003 - Bomb Defender Grandmaster
import bronzeTrophy003 from '../assets/images/trophies/Bronze Trophy 003.webp';
import silverTrophy003 from '../assets/images/trophies/Silver Trophy 003.webp';
import goldTrophy003 from '../assets/images/trophies/Gold Trophy 003.webp';
import platinumTrophy003 from '../assets/images/trophies/Platinum Trophy 003.webp';

// Trophy 004 - Vortex Dynamo
import bronzeTrophy004 from '../assets/images/trophies/Bronze Trophy 004.webp';
import silverTrophy004 from '../assets/images/trophies/Silver Trophy 004.webp';
import goldTrophy004 from '../assets/images/trophies/Gold Trophy 004.webp';
import platinumTrophy004 from '../assets/images/trophies/Platinum Trophy 004.webp';

// Trophy 005 - Relic Archeologist
import bronzeTrophy005 from '../assets/images/trophies/Bronze Trophy 005.webp';
import silverTrophy005 from '../assets/images/trophies/Silver Trophy 005.webp';
import goldTrophy005 from '../assets/images/trophies/Gold Trophy 005.webp';
import platinumTrophy005 from '../assets/images/trophies/Platinum Trophy 005.webp';

// Trophy 006 - Cyber Couture Icon
import bronzeTrophy006 from '../assets/images/trophies/Bronze Trophy 006.webp';
import silverTrophy006 from '../assets/images/trophies/Silver Trophy 006.webp';
import goldTrophy006 from '../assets/images/trophies/Gold Trophy 006.webp';
import platinumTrophy006 from '../assets/images/trophies/Platinum Trophy 006.webp';

// Trophy 007 - Eternal Devotee (Total Logins)
import bronzeTrophy007 from '../assets/images/trophies/Bronze Trophy 007.webp';
import silverTrophy007 from '../assets/images/trophies/Silver Trophy 007.webp';
import goldTrophy007 from '../assets/images/trophies/Gold Trophy 007.webp';
import platinumTrophy007 from '../assets/images/trophies/Platinum Trophy 007.webp';

// Trophy 008 - The Midas Touch (Star Wealth)
import bronzeTrophy008 from '../assets/images/trophies/Bronze Trophy 008.webp';
import silverTrophy008 from '../assets/images/trophies/Silver Trophy 008.webp';
import goldTrophy008 from '../assets/images/trophies/Gold Trophy 008.webp';
import platinumTrophy008 from '../assets/images/trophies/Platinum Trophy 008.webp';

// Trophy 009 - Vault Sovereign (Milestone Chests)
import bronzeTrophy009 from '../assets/images/trophies/Bronze Trophy 009.webp';
import silverTrophy009 from '../assets/images/trophies/Silver Trophy 009.webp';
import goldTrophy009 from '../assets/images/trophies/Gold Trophy 009.webp';
import platinumTrophy009 from '../assets/images/trophies/Platinum Trophy 009.webp';

// Trophy 010 - Quest Virtuoso (Daily Quests)
import bronzeTrophy010 from '../assets/images/trophies/Bronze Trophy 010.webp';
import silverTrophy010 from '../assets/images/trophies/Silver Trophy 010.webp';
import goldTrophy010 from '../assets/images/trophies/Gold Trophy 010.webp';
import platinumTrophy010 from '../assets/images/trophies/Platinum Trophy 010.webp';
import { EconomyState, getEconomyState } from './economy';

export type TrophyTier = 'locked' | 'bronze' | 'silver' | 'gold' | 'platinum';

export interface TrophyTierConfig {
  tier: TrophyTier;
  threshold: number;
  title: string;
  badgeName: string;
  colorName: string;
  textColor: string;
  gradient: string;
  borderColor: string;
  glowColor: string;
  starBonus: number;
  image?: string;
}

export interface AchievementTrophy {
  id: string;
  title: string;
  category: 'roulette' | 'bottle' | 'kaboom' | 'pong' | 'collector' | 'party';
  categoryLabel: string;
  description: string;
  metricLabel: string;
  iconType: 'trophy' | 'flame' | 'bomb' | 'sparkles' | 'crown' | 'target' | 'star';
  images?: {
    bronze?: string;
    silver?: string;
    gold?: string;
    platinum?: string;
  };
  tiers: {
    bronze: TrophyTierConfig;
    silver: TrophyTierConfig;
    gold: TrophyTierConfig;
    platinum: TrophyTierConfig;
  };
}

export interface TrophyClaimState {
  claimedTiers: TrophyTier[]; // e.g. ['bronze', 'silver']
}

export interface TrophyProgress {
  trophyId: string;
  currentValue: number;
  currentTier: TrophyTier;
  nextTier: TrophyTier | null;
  currentTierConfig: TrophyTierConfig | null;
  nextTierConfig: TrophyTierConfig | null;
  progressPercent: number;
  isMaxTier: boolean;
  unclaimedTiers: TrophyTier[];
}

export const TROPHY_DEFINITIONS: AchievementTrophy[] = [
  {
    id: 'roulette_master',
    title: 'Roulette Virtuoso',
    category: 'roulette',
    categoryLabel: 'Finger Roulette',
    description: 'Play and finish dramatic finger roulette showdowns with friends.',
    metricLabel: 'Rounds Played',
    iconType: 'target',
    images: {
      bronze: bronzeTrophy001,
      silver: silverTrophy001,
      gold: goldTrophy001,
      platinum: platinumTrophy001,
    },
    tiers: {
      bronze: {
        tier: 'bronze',
        threshold: 3,
        title: 'Novice Finger',
        badgeName: 'Bronze',
        colorName: 'Amber Bronze',
        textColor: 'text-amber-400',
        gradient: 'from-[#613612] via-[#8c4f1c] to-[#b36b2d]',
        borderColor: 'border-amber-700/60',
        glowColor: 'shadow-[0_0_15px_rgba(180,83,9,0.4)]',
        starBonus: 50,
        image: bronzeTrophy001,
      },
      silver: {
        tier: 'silver',
        threshold: 15,
        title: 'Steady Hand',
        badgeName: 'Silver',
        colorName: 'Sterling Silver',
        textColor: 'text-slate-200',
        gradient: 'from-[#334155] via-[#64748b] to-[#94a3b8]',
        borderColor: 'border-slate-400/60',
        glowColor: 'shadow-[0_0_20px_rgba(148,163,184,0.5)]',
        starBonus: 150,
        image: silverTrophy001,
      },
      gold: {
        tier: 'gold',
        threshold: 40,
        title: 'Voltage Maestro',
        badgeName: 'Gold',
        colorName: 'Radiant Gold',
        textColor: 'text-yellow-300',
        gradient: 'from-[#854d0e] via-[#ca8a04] to-[#fde047]',
        borderColor: 'border-yellow-400/80',
        glowColor: 'shadow-[0_0_25px_rgba(234,179,8,0.6)]',
        starBonus: 400,
        image: goldTrophy001,
      },
      platinum: {
        tier: 'platinum',
        threshold: 100,
        title: 'Omnipotent Lightning',
        badgeName: 'Platinum',
        colorName: 'Cyber Platinum',
        textColor: 'text-cyan-300',
        gradient: 'from-[#083344] via-[#0891b2] to-[#67e8f9]',
        borderColor: 'border-cyan-300',
        glowColor: 'shadow-[0_0_30px_rgba(6,182,212,0.8)]',
        starBonus: 1000,
        image: platinumTrophy001,
      },
    },
  },
  {
    id: 'bottle_twister',
    title: 'Vortex Dynamo',
    category: 'bottle',
    categoryLabel: 'Spin Bottle',
    description: 'Spin high-velocity deciders and light up party circles.',
    metricLabel: 'Spins Completed',
    iconType: 'sparkles',
    images: {
      bronze: bronzeTrophy004,
      silver: silverTrophy004,
      gold: goldTrophy004,
      platinum: platinumTrophy004,
    },
    tiers: {
      bronze: {
        tier: 'bronze',
        threshold: 5,
        title: 'Warm-up Spinner',
        badgeName: 'Bronze',
        colorName: 'Amber Bronze',
        textColor: 'text-amber-400',
        gradient: 'from-[#613612] via-[#8c4f1c] to-[#b36b2d]',
        borderColor: 'border-amber-700/60',
        glowColor: 'shadow-[0_0_15px_rgba(180,83,9,0.4)]',
        starBonus: 50,
        image: bronzeTrophy004,
      },
      silver: {
        tier: 'silver',
        threshold: 25,
        title: 'Centrifugal Force',
        badgeName: 'Silver',
        colorName: 'Sterling Silver',
        textColor: 'text-slate-200',
        gradient: 'from-[#334155] via-[#64748b] to-[#94a3b8]',
        borderColor: 'border-slate-400/60',
        glowColor: 'shadow-[0_0_20px_rgba(148,163,184,0.5)]',
        starBonus: 150,
        image: silverTrophy004,
      },
      gold: {
        tier: 'gold',
        threshold: 75,
        title: 'Cyclone Champion',
        badgeName: 'Gold',
        colorName: 'Radiant Gold',
        textColor: 'text-yellow-300',
        gradient: 'from-[#854d0e] via-[#ca8a04] to-[#fde047]',
        borderColor: 'border-yellow-400/80',
        glowColor: 'shadow-[0_0_25px_rgba(234,179,8,0.6)]',
        starBonus: 400,
        image: goldTrophy004,
      },
      platinum: {
        tier: 'platinum',
        threshold: 200,
        title: 'Eternal Orbit',
        badgeName: 'Platinum',
        colorName: 'Cyber Platinum',
        textColor: 'text-cyan-300',
        gradient: 'from-[#083344] via-[#0891b2] to-[#67e8f9]',
        borderColor: 'border-cyan-300',
        glowColor: 'shadow-[0_0_30px_rgba(6,182,212,0.8)]',
        starBonus: 1000,
        image: platinumTrophy004,
      },
    },
  },
  {
    id: 'bomb_defuser',
    title: 'Bomb Defender Grandmaster',
    category: 'kaboom',
    categoryLabel: 'Kaboom Party',
    description: 'Clear tactical party minefields without triggering bombs.',
    metricLabel: 'Safe Victories',
    iconType: 'bomb',
    images: {
      bronze: bronzeTrophy003,
      silver: silverTrophy003,
      gold: goldTrophy003,
      platinum: platinumTrophy003,
    },
    tiers: {
      bronze: {
        tier: 'bronze',
        threshold: 3,
        title: 'Lucky Dodger',
        badgeName: 'Bronze',
        colorName: 'Amber Bronze',
        textColor: 'text-amber-400',
        gradient: 'from-[#613612] via-[#8c4f1c] to-[#b36b2d]',
        borderColor: 'border-amber-700/60',
        glowColor: 'shadow-[0_0_15px_rgba(180,83,9,0.4)]',
        starBonus: 60,
        image: bronzeTrophy003,
      },
      silver: {
        tier: 'silver',
        threshold: 12,
        title: 'Hazmat Specialist',
        badgeName: 'Silver',
        colorName: 'Sterling Silver',
        textColor: 'text-slate-200',
        gradient: 'from-[#334155] via-[#64748b] to-[#94a3b8]',
        borderColor: 'border-slate-400/60',
        glowColor: 'shadow-[0_0_20px_rgba(148,163,184,0.5)]',
        starBonus: 180,
        image: silverTrophy003,
      },
      gold: {
        tier: 'gold',
        threshold: 30,
        title: 'Tactical Demolitionist',
        badgeName: 'Gold',
        colorName: 'Radiant Gold',
        textColor: 'text-yellow-300',
        gradient: 'from-[#854d0e] via-[#ca8a04] to-[#fde047]',
        borderColor: 'border-yellow-400/80',
        glowColor: 'shadow-[0_0_25px_rgba(234,179,8,0.6)]',
        starBonus: 500,
        image: goldTrophy003,
      },
      platinum: {
        tier: 'platinum',
        threshold: 80,
        title: 'Zero-Detonation Legend',
        badgeName: 'Platinum',
        colorName: 'Cyber Platinum',
        textColor: 'text-cyan-300',
        gradient: 'from-[#083344] via-[#0891b2] to-[#67e8f9]',
        borderColor: 'border-cyan-300',
        glowColor: 'shadow-[0_0_30px_rgba(6,182,212,0.8)]',
        starBonus: 1200,
        image: platinumTrophy003,
      },
    },
  },
  {
    id: 'bonus_hunter',
    title: 'Relic Archeologist',
    category: 'kaboom',
    categoryLabel: 'Kaboom Party',
    description: 'Unearth secret party power-ups and musical treasures.',
    metricLabel: 'Relics Discovered',
    iconType: 'star',
    images: {
      bronze: bronzeTrophy005,
      silver: silverTrophy005,
      gold: goldTrophy005,
      platinum: platinumTrophy005,
    },
    tiers: {
      bronze: {
        tier: 'bronze',
        threshold: 5,
        title: 'Curio Seeker',
        badgeName: 'Bronze',
        colorName: 'Amber Bronze',
        textColor: 'text-amber-400',
        gradient: 'from-[#613612] via-[#8c4f1c] to-[#b36b2d]',
        borderColor: 'border-amber-700/60',
        glowColor: 'shadow-[0_0_15px_rgba(180,83,9,0.4)]',
        starBonus: 40,
        image: bronzeTrophy005,
      },
      silver: {
        tier: 'silver',
        threshold: 20,
        title: 'Loot Enthusiast',
        badgeName: 'Silver',
        colorName: 'Sterling Silver',
        textColor: 'text-slate-200',
        gradient: 'from-[#334155] via-[#64748b] to-[#94a3b8]',
        borderColor: 'border-slate-400/60',
        glowColor: 'shadow-[0_0_20px_rgba(148,163,184,0.5)]',
        starBonus: 120,
        image: silverTrophy005,
      },
      gold: {
        tier: 'gold',
        threshold: 50,
        title: 'Treasure Sovereign',
        badgeName: 'Gold',
        colorName: 'Radiant Gold',
        textColor: 'text-yellow-300',
        gradient: 'from-[#854d0e] via-[#ca8a04] to-[#fde047]',
        borderColor: 'border-yellow-400/80',
        glowColor: 'shadow-[0_0_25px_rgba(234,179,8,0.6)]',
        starBonus: 350,
        image: goldTrophy005,
      },
      platinum: {
        tier: 'platinum',
        threshold: 120,
        title: 'Neon Hoarder King',
        badgeName: 'Platinum',
        colorName: 'Cyber Platinum',
        textColor: 'text-cyan-300',
        gradient: 'from-[#083344] via-[#0891b2] to-[#67e8f9]',
        borderColor: 'border-cyan-300',
        glowColor: 'shadow-[0_0_30px_rgba(6,182,212,0.8)]',
        starBonus: 900,
        image: platinumTrophy005,
      },
    },
  },
  {
    id: 'party_legend',
    title: 'Party Monarch',
    category: 'party',
    categoryLabel: 'Party Life',
    description: 'Total games hosted and celebrated with friends across all modes.',
    metricLabel: 'Total Games Played',
    iconType: 'crown',
    images: {
      bronze: bronzeTrophy002,
      silver: silverTrophy002,
      gold: goldTrophy002,
      platinum: platinumTrophy002,
    },
    tiers: {
      bronze: {
        tier: 'bronze',
        threshold: 10,
        title: 'Host Apprentice',
        badgeName: 'Bronze',
        colorName: 'Amber Bronze',
        textColor: 'text-amber-400',
        gradient: 'from-[#613612] via-[#8c4f1c] to-[#b36b2d]',
        borderColor: 'border-amber-700/60',
        glowColor: 'shadow-[0_0_15px_rgba(180,83,9,0.4)]',
        starBonus: 100,
        image: bronzeTrophy002,
      },
      silver: {
        tier: 'silver',
        threshold: 50,
        title: 'VIP Life of the Party',
        badgeName: 'Silver',
        colorName: 'Sterling Silver',
        textColor: 'text-slate-200',
        gradient: 'from-[#334155] via-[#64748b] to-[#94a3b8]',
        borderColor: 'border-slate-400/60',
        glowColor: 'shadow-[0_0_20px_rgba(148,163,184,0.5)]',
        starBonus: 250,
        image: silverTrophy002,
      },
      gold: {
        tier: 'gold',
        threshold: 150,
        title: 'Festival Headliner',
        badgeName: 'Gold',
        colorName: 'Radiant Gold',
        textColor: 'text-yellow-300',
        gradient: 'from-[#854d0e] via-[#ca8a04] to-[#fde047]',
        borderColor: 'border-yellow-400/80',
        glowColor: 'shadow-[0_0_25px_rgba(234,179,8,0.6)]',
        starBonus: 600,
        image: goldTrophy002,
      },
      platinum: {
        tier: 'platinum',
        threshold: 400,
        title: 'Mythic Party Overlord',
        badgeName: 'Platinum',
        colorName: 'Cyber Platinum',
        textColor: 'text-cyan-300',
        gradient: 'from-[#083344] via-[#0891b2] to-[#67e8f9]',
        borderColor: 'border-cyan-300',
        glowColor: 'shadow-[0_0_30px_rgba(6,182,212,0.8)]',
        starBonus: 1500,
        image: platinumTrophy002,
      },
    },
  },
  {
    id: 'collector_wardrobe',
    title: 'Cyber Couture Icon',
    category: 'collector',
    categoryLabel: 'Store Collection',
    description: 'Unlock custom neon bottles, bombs, and exclusive skins.',
    metricLabel: 'Skins Unlocked',
    iconType: 'flame',
    images: {
      bronze: bronzeTrophy006,
      silver: silverTrophy006,
      gold: goldTrophy006,
      platinum: platinumTrophy006,
    },
    tiers: {
      bronze: {
        tier: 'bronze',
        threshold: 2,
        title: 'Trendy Patron',
        badgeName: 'Bronze',
        colorName: 'Amber Bronze',
        textColor: 'text-amber-400',
        gradient: 'from-[#613612] via-[#8c4f1c] to-[#b36b2d]',
        borderColor: 'border-amber-700/60',
        glowColor: 'shadow-[0_0_15px_rgba(180,83,9,0.4)]',
        starBonus: 75,
        image: bronzeTrophy006,
      },
      silver: {
        tier: 'silver',
        threshold: 5,
        title: 'Runway Stylist',
        badgeName: 'Silver',
        colorName: 'Sterling Silver',
        textColor: 'text-slate-200',
        gradient: 'from-[#334155] via-[#64748b] to-[#94a3b8]',
        borderColor: 'border-slate-400/60',
        glowColor: 'shadow-[0_0_20px_rgba(148,163,184,0.5)]',
        starBonus: 200,
        image: silverTrophy006,
      },
      gold: {
        tier: 'gold',
        threshold: 10,
        title: 'Vault Connoisseur',
        badgeName: 'Gold',
        colorName: 'Radiant Gold',
        textColor: 'text-yellow-300',
        gradient: 'from-[#854d0e] via-[#ca8a04] to-[#fde047]',
        borderColor: 'border-yellow-400/80',
        glowColor: 'shadow-[0_0_25px_rgba(234,179,8,0.6)]',
        starBonus: 500,
        image: goldTrophy006,
      },
      platinum: {
        tier: 'platinum',
        threshold: 16,
        title: 'Neon Royal Curator',
        badgeName: 'Platinum',
        colorName: 'Cyber Platinum',
        textColor: 'text-cyan-300',
        gradient: 'from-[#083344] via-[#0891b2] to-[#67e8f9]',
        borderColor: 'border-cyan-300',
        glowColor: 'shadow-[0_0_30px_rgba(6,182,212,0.8)]',
        starBonus: 1200,
        image: platinumTrophy006,
      },
    },
  },
  {
    id: 'total_logins',
    title: 'Eternal Devotee',
    category: 'party',
    categoryLabel: 'Party Loyalty',
    description: 'Check in across daily party sessions and build an unshakeable presence.',
    metricLabel: 'Days Logged In',
    iconType: 'crown',
    images: {
      bronze: bronzeTrophy007,
      silver: silverTrophy007,
      gold: goldTrophy007,
      platinum: platinumTrophy007,
    },
    tiers: {
      bronze: {
        tier: 'bronze',
        threshold: 2,
        title: 'Party Attendee',
        badgeName: 'Bronze',
        colorName: 'Amber Bronze',
        textColor: 'text-amber-400',
        gradient: 'from-[#613612] via-[#8c4f1c] to-[#b36b2d]',
        borderColor: 'border-amber-700/60',
        glowColor: 'shadow-[0_0_15px_rgba(180,83,9,0.4)]',
        starBonus: 50,
        image: bronzeTrophy007,
      },
      silver: {
        tier: 'silver',
        threshold: 5,
        title: 'Nightclub Regular',
        badgeName: 'Silver',
        colorName: 'Sterling Silver',
        textColor: 'text-slate-200',
        gradient: 'from-[#334155] via-[#64748b] to-[#94a3b8]',
        borderColor: 'border-slate-400/60',
        glowColor: 'shadow-[0_0_20px_rgba(148,163,184,0.5)]',
        starBonus: 150,
        image: silverTrophy007,
      },
      gold: {
        tier: 'gold',
        threshold: 14,
        title: 'VIP Resident',
        badgeName: 'Gold',
        colorName: 'Radiant Gold',
        textColor: 'text-yellow-300',
        gradient: 'from-[#854d0e] via-[#ca8a04] to-[#fde047]',
        borderColor: 'border-yellow-400/80',
        glowColor: 'shadow-[0_0_25px_rgba(234,179,8,0.6)]',
        starBonus: 400,
        image: goldTrophy007,
      },
      platinum: {
        tier: 'platinum',
        threshold: 30,
        title: 'Eternal Devotee',
        badgeName: 'Platinum',
        colorName: 'Cyber Platinum',
        textColor: 'text-cyan-300',
        gradient: 'from-[#083344] via-[#0891b2] to-[#67e8f9]',
        borderColor: 'border-cyan-300',
        glowColor: 'shadow-[0_0_30px_rgba(6,182,212,0.8)]',
        starBonus: 1200,
        image: platinumTrophy007,
      },
    },
  },
  {
    id: 'midas_touch',
    title: 'The Midas Touch',
    category: 'collector',
    categoryLabel: 'Star Wealth',
    description: 'Amass astronomical Star fortunes across games, bonuses, and party quests.',
    metricLabel: 'Lifetime Stars',
    iconType: 'star',
    images: {
      bronze: bronzeTrophy008,
      silver: silverTrophy008,
      gold: goldTrophy008,
      platinum: platinumTrophy008,
    },
    tiers: {
      bronze: {
        tier: 'bronze',
        threshold: 500,
        title: 'Gold Seeker',
        badgeName: 'Bronze',
        colorName: 'Amber Bronze',
        textColor: 'text-amber-400',
        gradient: 'from-[#613612] via-[#8c4f1c] to-[#b36b2d]',
        borderColor: 'border-amber-700/60',
        glowColor: 'shadow-[0_0_15px_rgba(180,83,9,0.4)]',
        starBonus: 50,
        image: bronzeTrophy008,
      },
      silver: {
        tier: 'silver',
        threshold: 2500,
        title: 'Starlight Merchant',
        badgeName: 'Silver',
        colorName: 'Sterling Silver',
        textColor: 'text-slate-200',
        gradient: 'from-[#334155] via-[#64748b] to-[#94a3b8]',
        borderColor: 'border-slate-400/60',
        glowColor: 'shadow-[0_0_20px_rgba(148,163,184,0.5)]',
        starBonus: 150,
        image: silverTrophy008,
      },
      gold: {
        tier: 'gold',
        threshold: 10000,
        title: 'Cosmic Tycoon',
        badgeName: 'Gold',
        colorName: 'Radiant Gold',
        textColor: 'text-yellow-300',
        gradient: 'from-[#854d0e] via-[#ca8a04] to-[#fde047]',
        borderColor: 'border-yellow-400/80',
        glowColor: 'shadow-[0_0_25px_rgba(234,179,8,0.6)]',
        starBonus: 400,
        image: goldTrophy008,
      },
      platinum: {
        tier: 'platinum',
        threshold: 30000,
        title: 'Midas Supreme',
        badgeName: 'Platinum',
        colorName: 'Cyber Platinum',
        textColor: 'text-cyan-300',
        gradient: 'from-[#083344] via-[#0891b2] to-[#67e8f9]',
        borderColor: 'border-cyan-300',
        glowColor: 'shadow-[0_0_30px_rgba(6,182,212,0.8)]',
        starBonus: 1200,
        image: platinumTrophy008,
      },
    },
  },
  {
    id: 'milestone_chests',
    title: 'Vault Sovereign',
    category: 'party',
    categoryLabel: 'Milestone Chests',
    description: 'Complete all 5 daily quests to unlock and crack open legendary Milestone Vault Chests.',
    metricLabel: 'Chests Opened',
    iconType: 'sparkles',
    images: {
      bronze: bronzeTrophy009,
      silver: silverTrophy009,
      gold: goldTrophy009,
      platinum: platinumTrophy009,
    },
    tiers: {
      bronze: {
        tier: 'bronze',
        threshold: 1,
        title: 'Key Turner',
        badgeName: 'Bronze',
        colorName: 'Amber Bronze',
        textColor: 'text-amber-400',
        gradient: 'from-[#613612] via-[#8c4f1c] to-[#b36b2d]',
        borderColor: 'border-amber-700/60',
        glowColor: 'shadow-[0_0_15px_rgba(180,83,9,0.4)]',
        starBonus: 50,
        image: bronzeTrophy009,
      },
      silver: {
        tier: 'silver',
        threshold: 5,
        title: 'Treasure Raider',
        badgeName: 'Silver',
        colorName: 'Sterling Silver',
        textColor: 'text-slate-200',
        gradient: 'from-[#334155] via-[#64748b] to-[#94a3b8]',
        borderColor: 'border-slate-400/60',
        glowColor: 'shadow-[0_0_20px_rgba(148,163,184,0.5)]',
        starBonus: 150,
        image: silverTrophy009,
      },
      gold: {
        tier: 'gold',
        threshold: 15,
        title: 'Vault Breaker',
        badgeName: 'Gold',
        colorName: 'Radiant Gold',
        textColor: 'text-yellow-300',
        gradient: 'from-[#854d0e] via-[#ca8a04] to-[#fde047]',
        borderColor: 'border-yellow-400/80',
        glowColor: 'shadow-[0_0_25px_rgba(234,179,8,0.6)]',
        starBonus: 400,
        image: goldTrophy009,
      },
      platinum: {
        tier: 'platinum',
        threshold: 35,
        title: 'Vault Sovereign',
        badgeName: 'Platinum',
        colorName: 'Cyber Platinum',
        textColor: 'text-cyan-300',
        gradient: 'from-[#083344] via-[#0891b2] to-[#67e8f9]',
        borderColor: 'border-cyan-300',
        glowColor: 'shadow-[0_0_30px_rgba(6,182,212,0.8)]',
        starBonus: 1200,
        image: platinumTrophy009,
      },
    },
  },
  {
    id: 'quest_master',
    title: 'Quest Virtuoso',
    category: 'party',
    categoryLabel: 'Quest Vanguard',
    description: 'Fulfil high-voltage party contracts and complete daily quests.',
    metricLabel: 'Quests Completed',
    iconType: 'target',
    images: {
      bronze: bronzeTrophy010,
      silver: silverTrophy010,
      gold: goldTrophy010,
      platinum: platinumTrophy010,
    },
    tiers: {
      bronze: {
        tier: 'bronze',
        threshold: 5,
        title: 'Contract Scout',
        badgeName: 'Bronze',
        colorName: 'Amber Bronze',
        textColor: 'text-amber-400',
        gradient: 'from-[#613612] via-[#8c4f1c] to-[#b36b2d]',
        borderColor: 'border-amber-700/60',
        glowColor: 'shadow-[0_0_15px_rgba(180,83,9,0.4)]',
        starBonus: 50,
        image: bronzeTrophy010,
      },
      silver: {
        tier: 'silver',
        threshold: 20,
        title: 'Tactical Operative',
        badgeName: 'Silver',
        colorName: 'Sterling Silver',
        textColor: 'text-slate-200',
        gradient: 'from-[#334155] via-[#64748b] to-[#94a3b8]',
        borderColor: 'border-slate-400/60',
        glowColor: 'shadow-[0_0_20px_rgba(148,163,184,0.5)]',
        starBonus: 150,
        image: silverTrophy010,
      },
      gold: {
        tier: 'gold',
        threshold: 50,
        title: 'Quest Vanguard',
        badgeName: 'Gold',
        colorName: 'Radiant Gold',
        textColor: 'text-yellow-300',
        gradient: 'from-[#854d0e] via-[#ca8a04] to-[#fde047]',
        borderColor: 'border-yellow-400/80',
        glowColor: 'shadow-[0_0_25px_rgba(234,179,8,0.6)]',
        starBonus: 400,
        image: goldTrophy010,
      },
      platinum: {
        tier: 'platinum',
        threshold: 100,
        title: 'Apex Virtuoso',
        badgeName: 'Platinum',
        colorName: 'Cyber Platinum',
        textColor: 'text-cyan-300',
        gradient: 'from-[#083344] via-[#0891b2] to-[#67e8f9]',
        borderColor: 'border-cyan-300',
        glowColor: 'shadow-[0_0_30px_rgba(6,182,212,0.8)]',
        starBonus: 1200,
        image: platinumTrophy010,
      },
    },
  },
  {
    id: 'pong_master',
    title: 'Bomb Pong Grandmaster',
    category: 'pong',
    categoryLabel: 'Bomb Pong',
    description: 'Score decisive match points and conquer rival paddles in explosive Bomb Pong duels.',
    metricLabel: 'Matches Won',
    iconType: 'crown',
    images: {
      bronze: bronzeTrophy003,
      silver: silverTrophy003,
      gold: goldTrophy003,
      platinum: platinumTrophy003,
    },
    tiers: {
      bronze: {
        tier: 'bronze',
        threshold: 2,
        title: 'Cyber Paddle Scout',
        badgeName: 'Bronze',
        colorName: 'Amber Bronze',
        textColor: 'text-amber-400',
        gradient: 'from-[#613612] via-[#8c4f1c] to-[#b36b2d]',
        borderColor: 'border-amber-700/60',
        glowColor: 'shadow-[0_0_15px_rgba(180,83,9,0.4)]',
        starBonus: 60,
        image: bronzeTrophy003,
      },
      silver: {
        tier: 'silver',
        threshold: 8,
        title: 'Neon Net Striker',
        badgeName: 'Silver',
        colorName: 'Sterling Silver',
        textColor: 'text-slate-200',
        gradient: 'from-[#334155] via-[#64748b] to-[#94a3b8]',
        borderColor: 'border-slate-400/60',
        glowColor: 'shadow-[0_0_20px_rgba(148,163,184,0.5)]',
        starBonus: 180,
        image: silverTrophy003,
      },
      gold: {
        tier: 'gold',
        threshold: 20,
        title: 'Court Sovereign',
        badgeName: 'Gold',
        colorName: 'Radiant Gold',
        textColor: 'text-yellow-300',
        gradient: 'from-[#854d0e] via-[#ca8a04] to-[#fde047]',
        borderColor: 'border-yellow-400/80',
        glowColor: 'shadow-[0_0_25px_rgba(234,179,8,0.6)]',
        starBonus: 450,
        image: goldTrophy003,
      },
      platinum: {
        tier: 'platinum',
        threshold: 50,
        title: 'Omnipotent Pong Titan',
        badgeName: 'Platinum',
        colorName: 'Cyber Platinum',
        textColor: 'text-cyan-300',
        gradient: 'from-[#083344] via-[#0891b2] to-[#67e8f9]',
        borderColor: 'border-cyan-300',
        glowColor: 'shadow-[0_0_30px_rgba(6,182,212,0.8)]',
        starBonus: 1200,
        image: platinumTrophy003,
      },
    },
  },
  {
    id: 'pong_rally_legend',
    title: 'Hyper Rally Dynamo',
    category: 'pong',
    categoryLabel: 'Bomb Pong',
    description: 'Chain dizzying high-speed paddle volleys with the explosive bomb without letting it detonate.',
    metricLabel: 'Longest Rally',
    iconType: 'target',
    images: {
      bronze: bronzeTrophy004,
      silver: silverTrophy004,
      gold: goldTrophy004,
      platinum: platinumTrophy004,
    },
    tiers: {
      bronze: {
        tier: 'bronze',
        threshold: 6,
        title: 'Reflex Adept',
        badgeName: 'Bronze',
        colorName: 'Amber Bronze',
        textColor: 'text-amber-400',
        gradient: 'from-[#613612] via-[#8c4f1c] to-[#b36b2d]',
        borderColor: 'border-amber-700/60',
        glowColor: 'shadow-[0_0_15px_rgba(180,83,9,0.4)]',
        starBonus: 50,
        image: bronzeTrophy004,
      },
      silver: {
        tier: 'silver',
        threshold: 14,
        title: 'Supersonic Volley',
        badgeName: 'Silver',
        colorName: 'Sterling Silver',
        textColor: 'text-slate-200',
        gradient: 'from-[#334155] via-[#64748b] to-[#94a3b8]',
        borderColor: 'border-slate-400/60',
        glowColor: 'shadow-[0_0_20px_rgba(148,163,184,0.5)]',
        starBonus: 150,
        image: silverTrophy004,
      },
      gold: {
        tier: 'gold',
        threshold: 25,
        title: 'Kinetic Dynamo',
        badgeName: 'Gold',
        colorName: 'Radiant Gold',
        textColor: 'text-yellow-300',
        gradient: 'from-[#854d0e] via-[#ca8a04] to-[#fde047]',
        borderColor: 'border-yellow-400/80',
        glowColor: 'shadow-[0_0_25px_rgba(234,179,8,0.6)]',
        starBonus: 400,
        image: goldTrophy004,
      },
      platinum: {
        tier: 'platinum',
        threshold: 45,
        title: 'Perpetual Kinetic Legend',
        badgeName: 'Platinum',
        colorName: 'Cyber Platinum',
        textColor: 'text-cyan-300',
        gradient: 'from-[#083344] via-[#0891b2] to-[#67e8f9]',
        borderColor: 'border-cyan-300',
        glowColor: 'shadow-[0_0_30px_rgba(6,182,212,0.8)]',
        starBonus: 1000,
        image: platinumTrophy004,
      },
    },
  },
];

const TROPHY_CLAIM_STORAGE_KEY = 'picku_party_trophy_claims_v1';

export function getTrophyClaimMap(): Record<string, TrophyTier[]> {
  try {
    if (typeof localStorage === 'undefined') return {};
    const raw = localStorage.getItem(TROPHY_CLAIM_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

export function saveTrophyClaimMap(map: Record<string, TrophyTier[]>): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(TROPHY_CLAIM_STORAGE_KEY, JSON.stringify(map));
  } catch (e) {}
}

export function claimTrophyReward(
  trophyId: string,
  tier: TrophyTier
): { success: boolean; starsAwarded: number } {
  const trophy = TROPHY_DEFINITIONS.find((t) => t.id === trophyId);
  if (!trophy || tier === 'locked') return { success: false, starsAwarded: 0 };

  const tierCfg = trophy.tiers[tier as keyof typeof trophy.tiers];
  if (!tierCfg) return { success: false, starsAwarded: 0 };

  const claims = getTrophyClaimMap();
  const currentClaims = claims[trophyId] || [];

  if (currentClaims.includes(tier)) {
    return { success: false, starsAwarded: 0 };
  }

  claims[trophyId] = [...currentClaims, tier];
  saveTrophyClaimMap(claims);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('picku_trophy_claimed', {
        detail: { trophyId, tier, starBonus: tierCfg.starBonus },
      })
    );
  }

  return { success: true, starsAwarded: tierCfg.starBonus };
}

export function calculateTrophyProgress(
  trophy: AchievementTrophy,
  stats: {
    totalRouletteRounds: number;
    totalBottleSpins: number;
    totalKaboomRounds: number;
    totalPongRounds?: number;
    pongVictories?: number;
    pongHighestRally?: number;
    kaboomVictories: number;
    kaboomBonusCollected: number;
    unlockedItemCount: number;
    totalLogins?: number;
    lifetimeStars?: number;
    milestoneChestsOpened?: number;
    questsCompleted?: number;
  },
  claims: Record<string, TrophyTier[]>
): TrophyProgress {
  let currentValue = 0;

  switch (trophy.id) {
    case 'roulette_master':
      currentValue = stats.totalRouletteRounds;
      break;
    case 'bottle_twister':
      currentValue = stats.totalBottleSpins;
      break;
    case 'bomb_defuser':
      currentValue = stats.kaboomVictories;
      break;
    case 'bonus_hunter':
      currentValue = stats.kaboomBonusCollected;
      break;
    case 'pong_master':
      currentValue = stats.pongVictories || 0;
      break;
    case 'pong_rally_legend':
      currentValue = stats.pongHighestRally || 0;
      break;
    case 'party_legend':
      currentValue =
        stats.totalRouletteRounds +
        stats.totalBottleSpins +
        stats.totalKaboomRounds +
        (stats.totalPongRounds || 0);
      break;
    case 'collector_wardrobe':
      currentValue = stats.unlockedItemCount;
      break;
    case 'total_logins':
      currentValue = stats.totalLogins || 0;
      break;
    case 'midas_touch':
      currentValue = stats.lifetimeStars || 0;
      break;
    case 'milestone_chests':
      currentValue = stats.milestoneChestsOpened || 0;
      break;
    case 'quest_master':
      currentValue = stats.questsCompleted || 0;
      break;
    default:
      currentValue = 0;
  }

  const { bronze, silver, gold, platinum } = trophy.tiers;
  let currentTier: TrophyTier = 'locked';
  let nextTier: TrophyTier | null = 'bronze';

  if (currentValue >= platinum.threshold) {
    currentTier = 'platinum';
    nextTier = null;
  } else if (currentValue >= gold.threshold) {
    currentTier = 'gold';
    nextTier = 'platinum';
  } else if (currentValue >= silver.threshold) {
    currentTier = 'silver';
    nextTier = 'gold';
  } else if (currentValue >= bronze.threshold) {
    currentTier = 'bronze';
    nextTier = 'silver';
  } else {
    currentTier = 'locked';
    nextTier = 'bronze';
  }

  const currentTierConfig =
    currentTier === 'locked' ? null : trophy.tiers[currentTier];
  const nextTierConfig = nextTier ? trophy.tiers[nextTier] : null;

  let progressPercent = 0;
  if (!nextTierConfig) {
    progressPercent = 100;
  } else {
    const prevThreshold = currentTierConfig ? currentTierConfig.threshold : 0;
    const range = nextTierConfig.threshold - prevThreshold;
    const progressIntoRange = Math.max(0, currentValue - prevThreshold);
    progressPercent = Math.min(
      100,
      Math.max(0, Math.round((progressIntoRange / range) * 100))
    );
  }

  // Calculate unclaimed completed tiers
  const claimedList = claims[trophy.id] || [];
  const achievedTiers: TrophyTier[] = [];
  if (currentValue >= bronze.threshold) achievedTiers.push('bronze');
  if (currentValue >= silver.threshold) achievedTiers.push('silver');
  if (currentValue >= gold.threshold) achievedTiers.push('gold');
  if (currentValue >= platinum.threshold) achievedTiers.push('platinum');

  const unclaimedTiers = achievedTiers.filter((t) => !claimedList.includes(t));

  return {
    trophyId: trophy.id,
    currentValue,
    currentTier,
    nextTier,
    currentTierConfig,
    nextTierConfig,
    progressPercent,
    isMaxTier: currentTier === 'platinum',
    unclaimedTiers,
  };
}

export function getTrophyImage(
  trophy: AchievementTrophy,
  tier: TrophyTier
): string | undefined {
  if (tier === 'locked') {
    return trophy.images?.bronze;
  }
  return trophy.images?.[tier];
}

export function hasUnclaimedTrophies(
  stats?: {
    totalRouletteRounds?: number;
    totalBottleSpins?: number;
    totalKaboomRounds?: number;
    totalPongRounds?: number;
    pongVictories?: number;
    pongHighestRally?: number;
    pong?: {
      victories?: number;
      highestRally?: number;
      totalRounds?: number;
    };
    kaboom?: {
      victories?: number;
      bonusCollected?: number;
    };
    unlockedItemCount?: number;
    totalLogins?: number;
    lifetimeStars?: number;
    milestoneChestsOpened?: number;
    questsCompleted?: number;
  } | null,
  economy?: EconomyState | null,
  claims?: Record<string, TrophyTier[]>
): boolean {
  try {
    const claimMap = claims || getTrophyClaimMap();
    const currentEconomy =
      economy || (typeof window !== 'undefined' ? getEconomyState() : undefined);

    const statsContext = {
      totalRouletteRounds: stats?.totalRouletteRounds || 0,
      totalBottleSpins: stats?.totalBottleSpins || 0,
      totalKaboomRounds: stats?.totalKaboomRounds || 0,
      totalPongRounds: stats?.totalPongRounds || stats?.pong?.totalRounds || 0,
      pongVictories: stats?.pongVictories || stats?.pong?.victories || 0,
      pongHighestRally: stats?.pongHighestRally || stats?.pong?.highestRally || 0,
      kaboomVictories: stats?.kaboom?.victories || 0,
      kaboomBonusCollected: stats?.kaboom?.bonusCollected || 0,
      unlockedItemCount:
        currentEconomy?.unlockedItems?.length || stats?.unlockedItemCount || 1,
      totalLogins: Math.max(
        1,
        stats?.totalLogins ||
          currentEconomy?.totalLoginsCount ||
          currentEconomy?.dailyLoginRewards?.claimedDays?.length ||
          1
      ),
      lifetimeStars: Math.max(
        stats?.lifetimeStars || 0,
        currentEconomy?.stars || 0,
        currentEconomy?.lifetimeStarsEarned || 0
      ),
      milestoneChestsOpened:
        stats?.milestoneChestsOpened ||
        currentEconomy?.milestoneChestsOpened ||
        (currentEconomy?.milestoneChestClaimed ? 1 : 0),
      questsCompleted:
        stats?.questsCompleted ||
        currentEconomy?.questsCompletedCount ||
        (currentEconomy?.dailyQuests?.filter(
          (q) => q.currentCount >= q.targetCount
        ).length || 0),
    };

    return TROPHY_DEFINITIONS.some((trophy) => {
      const progress = calculateTrophyProgress(trophy, statsContext, claimMap);
      return progress.unclaimedTiers.length > 0;
    });
  } catch (err) {
    return false;
  }
}

export function getUnclaimedTrophiesCount(
  stats?: {
    totalRouletteRounds?: number;
    totalBottleSpins?: number;
    totalKaboomRounds?: number;
    totalPongRounds?: number;
    pongVictories?: number;
    pongHighestRally?: number;
    pong?: {
      victories?: number;
      highestRally?: number;
      totalRounds?: number;
    };
    kaboom?: {
      victories?: number;
      bonusCollected?: number;
    };
    unlockedItemCount?: number;
    totalLogins?: number;
    lifetimeStars?: number;
    milestoneChestsOpened?: number;
    questsCompleted?: number;
  } | null,
  economy?: EconomyState | null,
  claims?: Record<string, TrophyTier[]>
): number {
  try {
    const claimMap = claims || getTrophyClaimMap();
    const currentEconomy =
      economy || (typeof window !== 'undefined' ? getEconomyState() : undefined);

    const statsContext = {
      totalRouletteRounds: stats?.totalRouletteRounds || 0,
      totalBottleSpins: stats?.totalBottleSpins || 0,
      totalKaboomRounds: stats?.totalKaboomRounds || 0,
      totalPongRounds: stats?.totalPongRounds || stats?.pong?.totalRounds || 0,
      pongVictories: stats?.pongVictories || stats?.pong?.victories || 0,
      pongHighestRally: stats?.pongHighestRally || stats?.pong?.highestRally || 0,
      kaboomVictories: stats?.kaboom?.victories || 0,
      kaboomBonusCollected: stats?.kaboom?.bonusCollected || 0,
      unlockedItemCount:
        currentEconomy?.unlockedItems?.length || stats?.unlockedItemCount || 1,
      totalLogins: Math.max(
        1,
        stats?.totalLogins ||
          currentEconomy?.totalLoginsCount ||
          currentEconomy?.dailyLoginRewards?.claimedDays?.length ||
          1
      ),
      lifetimeStars: Math.max(
        stats?.lifetimeStars || 0,
        currentEconomy?.stars || 0,
        currentEconomy?.lifetimeStarsEarned || 0
      ),
      milestoneChestsOpened:
        stats?.milestoneChestsOpened ||
        currentEconomy?.milestoneChestsOpened ||
        (currentEconomy?.milestoneChestClaimed ? 1 : 0),
      questsCompleted:
        stats?.questsCompleted ||
        currentEconomy?.questsCompletedCount ||
        (currentEconomy?.dailyQuests?.filter(
          (q) => q.currentCount >= q.targetCount
        ).length || 0),
    };

    return TROPHY_DEFINITIONS.reduce((acc, trophy) => {
      const progress = calculateTrophyProgress(trophy, statsContext, claimMap);
      return acc + progress.unclaimedTiers.length;
    }, 0);
  } catch (err) {
    return 0;
  }
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BottleBuiltinStyle } from '../types';
import { BOTTLE_SKINS } from './bottleSkins';
import kaboomBombImg from '../assets/images/bombs/Bomb Sprite.webp';
import kaboomBallImg from '../assets/images/balls/Ball Sprite.webp';
import day7BundleChestImg from '../assets/images/day7_bundle_chest.webp';

// Ball skin assets from src/assets/images/balls
import ballCelestialImg from '../assets/images/balls/Ball Celestial.webp';
import ballFireCoralImg from '../assets/images/balls/Ball Fire Coral.webp';
import ballFishImg from '../assets/images/balls/Ball Fish.webp';
import ballGrassImg from '../assets/images/balls/Ball Grass.webp';
import ballJewelryImg from '../assets/images/balls/Ball Jewelry.webp';
import ballKittyImg from '../assets/images/balls/Ball Kitty.webp';
import ballMushroomImg from '../assets/images/balls/Ball Mushroom.webp';
import ballPartyImg from '../assets/images/balls/Ball Party.webp';
import ballPrismsImg from '../assets/images/balls/Ball Prisms.webp';
import ballSpaceshipImg from '../assets/images/balls/Ball Spaceship.webp';

// Bomb skin assets from src/assets/images/bombs
import bombBassImg from '../assets/images/bombs/Bomb Bass.webp';
import bombBioToxicImg from '../assets/images/bombs/Bomb Bio Toxic.webp';
import bombCelestialImg from '../assets/images/bombs/Bomb Celestial.webp';
import bombDynamoImg from '../assets/images/bombs/Bomb Dynamo.webp';
import bombElvishImg from '../assets/images/bombs/Bomb Elvish.webp';
import bombLanternImg from '../assets/images/bombs/Bomb Lantern.webp';
import bombMicImg from '../assets/images/bombs/Bomb Mic.webp';
import bombPerfumeImg from '../assets/images/bombs/Bomb Perfume.webp';
import bombPrismImg from '../assets/images/bombs/Bomb Prism.webp';
import bombSamuraiImg from '../assets/images/bombs/Bomb Samurai.webp';
import bombSonicImg from '../assets/images/bombs/Bomb Sonic.webp';
import bombSpriteImg from '../assets/images/bombs/Bomb Sprite.webp';

export const DAY7_BUNDLE_BOMB_ID = 'bomb_dynamo';
export const DAY7_BUNDLE_BALL_ID = 'ball_celestial';

export type StoreCategory = 'bottles' | 'bombs' | 'balls' | 'accessories';

export interface StoreItem {
  id: string;
  category: StoreCategory;
  name: string;
  subtitle: string;
  description: string;
  price: number;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  badge?: string;
  accentGradient: string;
  borderGlow: string;
  iconType: 'bottle' | 'bomb' | 'ball' | 'accessory';
  builtInBottleStyle?: BottleBuiltinStyle;
  image?: string;
  cssFilter?: string;
}

export interface StarEarringsProgress {
  bombVictory: boolean;
  bottleSpin: boolean;
  fingerGame: boolean;
  unlocked: boolean;
  unlockedAt?: number;
}

export interface DailyLoginRewards {
  claimedDays: number[]; // [1, 2, ...] up to [1..7]. Each day 1-7 can be claimed just once.
  lastClaimDate: string; // 'YYYY-MM-DD' of the last day claimed
}

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  targetCount: number;
  currentCount: number;
  starReward: number;
  isClaimed: boolean;
  gameMode?: 'roulette' | 'bottle' | 'kaboom' | 'hub' | 'settings';
}

export interface EconomyState {
  stars: number;
  unlockedItems: string[];
  equippedSkins: {
    bottles: string;
    bombs: string;
    balls: string;
    accessories?: string;
  };
  starEarrings: StarEarringsProgress;
  dailyQuests: DailyQuest[];
  milestoneChestClaimed: boolean;
  milestoneChestsOpened?: number;
  lastDailyResetDate: string; // 'YYYY-MM-DD'
  lastDailyReset: number; // Unix timestamp
  dailyLoginRewards: DailyLoginRewards;
  claimedLoginDay?: number; // Kept for backwards compatibility
  totalLoginsCount?: number;
  lifetimeStarsEarned?: number;
  questsCompletedCount?: number;
}

const STORAGE_KEY = 'picku_party_economy_v1';
export const STORE_CATALOGUE_STORAGE_KEY = 'picku_party_store_catalogue_v2';

export const DEFAULT_STORE_CATALOGUE: Record<StoreCategory, StoreItem[]> = {
  bottles: [
    {
      id: 'bottle_btl_001',
      category: 'bottles',
      name: 'Neon Cyber Rush',
      subtitle: 'Classic Electro Rave',
      description: 'The iconic aerodynamic cyan glass decider, optimized for precision high-speed party spins.',
      price: 0,
      rarity: 'Common',
      badge: 'DEFAULT',
      accentGradient: 'from-cyan-400 to-blue-600',
      borderGlow: 'border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.4)]',
      iconType: 'bottle',
      builtInBottleStyle: 'btl_e_001',
      image: BOTTLE_SKINS[0].image,
    },
    {
      id: 'bottle_btl_002',
      category: 'bottles',
      name: 'Rosé Pulse Glam',
      subtitle: 'VIP Lounge Edition',
      description: 'Effervescent magenta bottle with shimmering neon bubbles and gentle warm party luminescence.',
      price: 350,
      rarity: 'Rare',
      accentGradient: 'from-pink-400 to-rose-600',
      borderGlow: 'border-pink-400/60 shadow-[0_0_15px_rgba(244,63,94,0.4)]',
      iconType: 'bottle',
      builtInBottleStyle: 'btl_e_002',
      image: BOTTLE_SKINS[1].image,
    },
    {
      id: 'bottle_btl_003',
      category: 'bottles',
      name: 'Hyper Violet Elixir',
      subtitle: 'Midnight Ultraviolet',
      description: 'Deep violet party potion glowing with electric purple streaks and hypnotic rotational aura.',
      price: 650,
      rarity: 'Epic',
      badge: 'POPULAR',
      accentGradient: 'from-purple-400 to-fuchsia-600',
      borderGlow: 'border-purple-400/60 shadow-[0_0_15px_rgba(168,85,247,0.4)]',
      iconType: 'bottle',
      builtInBottleStyle: 'btl_e_003',
      image: BOTTLE_SKINS[2].image,
    },
    {
      id: 'bottle_btl_004',
      category: 'bottles',
      name: 'Solar Amber Flare',
      subtitle: 'High Voltage Sunburst',
      description: 'Sun-forged golden crystal charged with solar flare particles for maximum celebratory impact.',
      price: 1000,
      rarity: 'Legendary',
      badge: 'EXCLUSIVE',
      accentGradient: 'from-amber-300 via-orange-400 to-yellow-500',
      borderGlow: 'border-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.5)]',
      iconType: 'bottle',
      builtInBottleStyle: 'btl_e_004',
      image: BOTTLE_SKINS[3].image,
    },
  ],
  bombs: [
    {
      id: 'bomb_classic_tnt',
      category: 'bombs',
      name: 'Chibi TNT Explosive',
      subtitle: 'Classic Boom Box',
      description: 'The iconic party chibi explosive with cheerful eyes and a sizzling fuse.',
      price: 0,
      rarity: 'Common',
      badge: 'DEFAULT',
      accentGradient: 'from-red-500 to-orange-600',
      borderGlow: 'border-red-400/60 shadow-[0_0_15px_rgba(239,68,68,0.4)]',
      iconType: 'bomb',
      image: bombSpriteImg,
    },
    {
      id: DAY7_BUNDLE_BOMB_ID,
      category: 'bombs',
      name: 'Dynamo Reactor Bomb',
      subtitle: '7-Day Voltage Overdrive',
      description: 'High-voltage electromagnetic dynamo reactor radiating kinetic lightning coils. Claimed exclusively from the Day 7 Login Reward Bundle.',
      price: 0,
      rarity: 'Legendary',
      badge: 'DAY 7 EXCLUSIVE',
      accentGradient: 'from-amber-400 via-yellow-400 to-orange-500',
      borderGlow: 'border-amber-400/90 shadow-[0_0_24px_rgba(245,158,11,0.7)]',
      iconType: 'bomb',
      image: bombDynamoImg,
    },
    {
      id: 'bomb_celestial',
      category: 'bombs',
      name: 'Supernova Celestial Bomb',
      subtitle: 'Cosmic Astral Singularity',
      description: 'Ancient cosmic warhead containing the gravitational fury and stardust halo of an exploding astral star.',
      price: 1200,
      rarity: 'Legendary',
      badge: 'MYTHIC',
      accentGradient: 'from-violet-400 via-purple-600 to-indigo-800',
      borderGlow: 'border-purple-400/80 shadow-[0_0_24px_rgba(168,85,247,0.6)]',
      iconType: 'bomb',
      image: bombCelestialImg,
    },
    {
      id: 'bomb_samurai',
      category: 'bombs',
      name: 'Shadow Samurai Oni Bomb',
      subtitle: 'Bushido Blade Overdrive',
      description: 'Forged with lacquered Damascus armor, an intimidating gilded Oni kabuto, and roaring battle embers.',
      price: 1000,
      rarity: 'Legendary',
      badge: 'WARRIOR',
      accentGradient: 'from-red-600 via-amber-600 to-slate-900',
      borderGlow: 'border-red-500/80 shadow-[0_0_22px_rgba(239,68,68,0.6)]',
      iconType: 'bomb',
      image: bombSamuraiImg,
    },
    {
      id: 'bomb_bass',
      category: 'bombs',
      name: 'Subwoofer Bass Drop Bomb',
      subtitle: '808 Acoustic Earthquake',
      description: 'Heavyweight sonic sub-bass cannon tuned to club-shattering low frequencies that vibrate the whole room.',
      price: 800,
      rarity: 'Epic',
      badge: 'BASS',
      accentGradient: 'from-cyan-400 via-blue-500 to-indigo-600',
      borderGlow: 'border-cyan-400/70 shadow-[0_0_18px_rgba(6,182,212,0.5)]',
      iconType: 'bomb',
      image: bombBassImg,
    },
    {
      id: 'bomb_sonic',
      category: 'bombs',
      name: 'Supersonic Pulse Bomb',
      subtitle: 'Mach-Speed Kinetic Shock',
      description: 'Aerodynamic sonic warhead engineered to detonate with a deafening speed-of-sound shockwave burst.',
      price: 750,
      rarity: 'Epic',
      badge: 'SONIC',
      accentGradient: 'from-sky-400 via-indigo-500 to-purple-600',
      borderGlow: 'border-sky-400/70 shadow-[0_0_18px_rgba(56,189,248,0.5)]',
      iconType: 'bomb',
      image: bombSonicImg,
    },
    {
      id: 'bomb_bio_toxic',
      category: 'bombs',
      name: 'Bio-Toxic Hazard Canister',
      subtitle: 'Irradiated Mutagen Core',
      description: 'Pressurized laboratory containment core filled with luminescent lime chemical sludge ready to melt the stage.',
      price: 700,
      rarity: 'Epic',
      badge: 'BIOHAZARD',
      accentGradient: 'from-lime-400 via-emerald-500 to-teal-700',
      borderGlow: 'border-lime-400/70 shadow-[0_0_18px_rgba(132,204,22,0.5)]',
      iconType: 'bomb',
      image: bombBioToxicImg,
    },
    {
      id: 'bomb_prism',
      category: 'bombs',
      name: 'Prism Crystal Core Bomb',
      subtitle: 'Laser Diffraction Matrix',
      description: 'Multi-faceted crystalline explosive splitting blast concussions into blinding multi-colored party lasers.',
      price: 600,
      rarity: 'Epic',
      badge: 'PRISM',
      accentGradient: 'from-teal-300 via-cyan-400 to-pink-400',
      borderGlow: 'border-teal-300/70 shadow-[0_0_18px_rgba(94,234,212,0.5)]',
      iconType: 'bomb',
      image: bombPrismImg,
    },
    {
      id: 'bomb_perfume',
      category: 'bombs',
      name: 'Glamour Atomizer Bomb',
      subtitle: 'Intoxicating Fragrance Mist',
      description: 'Opulent crystal perfume vessel that disperses a sparkling cloud of euphoric party glitter upon detonation.',
      price: 500,
      rarity: 'Rare',
      badge: 'GLAMOUR',
      accentGradient: 'from-pink-400 via-rose-400 to-fuchsia-600',
      borderGlow: 'border-pink-400/60 shadow-[0_0_16px_rgba(244,63,94,0.45)]',
      iconType: 'bomb',
      image: bombPerfumeImg,
    },
    {
      id: 'bomb_lantern',
      category: 'bombs',
      name: 'Spirit Festival Lantern Bomb',
      subtitle: 'Ethereal Will-O-Wisp',
      description: 'Handmade illuminated night festival lantern enclosing an enchanted celebratory flame spirit.',
      price: 450,
      rarity: 'Rare',
      badge: 'SPIRIT',
      accentGradient: 'from-amber-400 via-orange-500 to-rose-600',
      borderGlow: 'border-orange-400/60 shadow-[0_0_16px_rgba(251,146,60,0.45)]',
      iconType: 'bomb',
      image: bombLanternImg,
    },
    {
      id: 'bomb_mic',
      category: 'bombs',
      name: 'Golden Broadcast Mic Bomb',
      subtitle: 'Stage Spotlight Feedback',
      description: 'Vintage studio vocal microphone primed for an explosive mic-drop crescendo that stuns the audience.',
      price: 400,
      rarity: 'Rare',
      badge: 'STAGE',
      accentGradient: 'from-amber-300 via-yellow-400 to-amber-500',
      borderGlow: 'border-yellow-400/60 shadow-[0_0_16px_rgba(250,204,21,0.45)]',
      iconType: 'bomb',
      image: bombMicImg,
    },
    {
      id: 'bomb_elvish',
      category: 'bombs',
      name: 'Ancient Elven Rune Bomb',
      subtitle: 'Enchanted Forest Magic',
      description: 'Archaic woodland artifact woven with luminous golden filigree runes and verdant floral vines.',
      price: 350,
      rarity: 'Rare',
      badge: 'MYSTIC',
      accentGradient: 'from-emerald-400 via-teal-400 to-amber-300',
      borderGlow: 'border-emerald-400/60 shadow-[0_0_16px_rgba(52,211,153,0.45)]',
      iconType: 'bomb',
      image: bombElvishImg,
    },
  ],
  balls: [
    {
      id: 'ball_cyan_orbs',
      category: 'balls',
      name: 'Cyan Pulse Spheres',
      subtitle: 'Standard Grid Tiles',
      description: 'Vibrant neon blue kinetic orbs with tactile impact feedback.',
      price: 0,
      rarity: 'Common',
      badge: 'DEFAULT',
      accentGradient: 'from-cyan-400 to-teal-500',
      borderGlow: 'border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.4)]',
      iconType: 'ball',
      image: kaboomBallImg,
    },
    {
      id: DAY7_BUNDLE_BALL_ID,
      category: 'balls',
      name: 'Celestial Astral Orb',
      subtitle: '7-Day Stardust Core',
      description: 'Divine celestial sphere enveloped in golden galactic constellation rings and violet nebulae. Claimed exclusively from the Day 7 Login Reward Bundle.',
      price: 0,
      rarity: 'Legendary',
      badge: 'DAY 7 EXCLUSIVE',
      accentGradient: 'from-amber-300 via-purple-500 to-indigo-600',
      borderGlow: 'border-amber-400/90 shadow-[0_0_24px_rgba(245,158,11,0.7)]',
      iconType: 'ball',
      image: ballCelestialImg,
    },
    {
      id: 'ball_spaceship',
      category: 'balls',
      name: 'Galactic Starship Orb',
      subtitle: 'Deep Space Warp Explorer',
      description: 'High-tech spacecraft sphere equipped with ion propulsion drives, cyber visor, and pressurized hull.',
      price: 950,
      rarity: 'Legendary',
      badge: 'SCI-FI',
      accentGradient: 'from-cyan-400 via-sky-500 to-indigo-700',
      borderGlow: 'border-cyan-400/80 shadow-[0_0_20px_rgba(6,182,212,0.5)]',
      iconType: 'ball',
      image: ballSpaceshipImg,
    },
    {
      id: 'ball_jewelry',
      category: 'balls',
      name: 'Royal Crown Jewel Orb',
      subtitle: 'Gilded Sovereign Treasure',
      description: 'Opulent imperial gold sphere studded with dazzling cut gemstones, diamonds, and regal filigree.',
      price: 850,
      rarity: 'Epic',
      badge: 'LUXURY',
      accentGradient: 'from-amber-300 via-yellow-400 to-amber-600',
      borderGlow: 'border-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.55)]',
      iconType: 'ball',
      image: ballJewelryImg,
    },
    {
      id: 'ball_prisms',
      category: 'balls',
      name: 'Prismatic Crystal Orb',
      subtitle: 'Spectral Diamond Refractor',
      description: 'Precision geometric crystal facets refracting radiant nightclub lighting into iridescent spectrum rainbows.',
      price: 750,
      rarity: 'Epic',
      badge: 'PRISM',
      accentGradient: 'from-pink-400 via-purple-400 to-cyan-400',
      borderGlow: 'border-fuchsia-400/70 shadow-[0_0_18px_rgba(217,70,239,0.5)]',
      iconType: 'ball',
      image: ballPrismsImg,
    },
    {
      id: 'ball_fire_coral',
      category: 'balls',
      name: 'Fire Coral Magma Orb',
      subtitle: 'Volcanic Hydrothermal Flame',
      description: 'Luminescent deep-sea coral reef sphere blazing with subterranean magma vents and fiery embers.',
      price: 650,
      rarity: 'Epic',
      badge: 'HOT',
      accentGradient: 'from-orange-500 via-red-500 to-rose-600',
      borderGlow: 'border-orange-500/70 shadow-[0_0_18px_rgba(249,115,22,0.5)]',
      iconType: 'ball',
      image: ballFireCoralImg,
    },
    {
      id: 'ball_party',
      category: 'balls',
      name: 'Neon Party Disco Orb',
      subtitle: 'Festival Confetti Fever',
      description: 'Vibrant party sphere wrapped in glittering confetti ribbons, dancing spotlights, and pure rave euphoria.',
      price: 450,
      rarity: 'Rare',
      badge: 'POPULAR',
      accentGradient: 'from-fuchsia-400 to-rose-500',
      borderGlow: 'border-rose-400/60 shadow-[0_0_16px_rgba(244,63,94,0.45)]',
      iconType: 'ball',
      image: ballPartyImg,
    },
    {
      id: 'ball_kitty',
      category: 'balls',
      name: 'Kawaii Neko Orb',
      subtitle: 'Chibi Whiskers Charm',
      description: 'Sweet pastel kitty sphere featuring adorable anime whiskers that purrs with cheerful kinetic bounce.',
      price: 400,
      rarity: 'Rare',
      badge: 'CUTE',
      accentGradient: 'from-pink-300 via-rose-300 to-amber-200',
      borderGlow: 'border-pink-300/70 shadow-[0_0_16px_rgba(244,114,182,0.45)]',
      iconType: 'ball',
      image: ballKittyImg,
    },
    {
      id: 'ball_fish',
      category: 'balls',
      name: 'Ocean Koi Current Orb',
      subtitle: 'Aquamarine Swimmer Drift',
      description: 'Crystal clear aquamarine sphere with graceful swimming koi fish casting serene watery ripples.',
      price: 350,
      rarity: 'Rare',
      badge: 'AQUA',
      accentGradient: 'from-cyan-300 via-teal-400 to-blue-500',
      borderGlow: 'border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.4)]',
      iconType: 'ball',
      image: ballFishImg,
    },
    {
      id: 'ball_mushroom',
      category: 'balls',
      name: 'Enchanted Shroom Orb',
      subtitle: 'Fairy Forest Spore Cap',
      description: 'Spongy woodland toadstool sphere glowing with bioluminescent fairy spores and earthy magic.',
      price: 300,
      rarity: 'Rare',
      badge: 'NATURE',
      accentGradient: 'from-emerald-400 via-teal-500 to-amber-500',
      borderGlow: 'border-emerald-400/60 shadow-[0_0_15px_rgba(16,185,129,0.4)]',
      iconType: 'ball',
      image: ballMushroomImg,
    },
    {
      id: 'ball_grass',
      category: 'balls',
      name: 'Emerald Meadow Orb',
      subtitle: 'Fresh Spring Sprout',
      description: 'Lush velvety sphere of living moss and vibrant emerald clover blossoms radiating crisp nature vibes.',
      price: 150,
      rarity: 'Common',
      badge: 'FRESH',
      accentGradient: 'from-lime-400 to-emerald-600',
      borderGlow: 'border-lime-400/60 shadow-[0_0_15px_rgba(132,204,22,0.4)]',
      iconType: 'ball',
      image: ballGrassImg,
    },
  ],
  accessories: [
    {
      id: 'accessory_star_earrings',
      category: 'accessories',
      name: 'Star Earrings',
      subtitle: 'Trophy of Triple Mastery',
      description: 'Radiant celestial star earrings forged from pure party starlight. Awarded by fulfilling the mastery condition: Win Bomb Game, Complete Bottle Spin, and Complete Finger Game.',
      price: 0,
      rarity: 'Legendary',
      badge: 'SPECIAL',
      accentGradient: 'from-amber-300 via-yellow-400 to-amber-500',
      borderGlow: 'border-amber-300/80 shadow-[0_0_22px_rgba(251,191,36,0.7)]',
      iconType: 'accessory',
    },
  ],
};

function loadInitialStoreCatalogue(): Record<StoreCategory, StoreItem[]> {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORE_CATALOGUE_STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const mergeCategory = (cat: StoreCategory, defaults: StoreItem[]): StoreItem[] => {
          const list: StoreItem[] = Array.isArray(parsed[cat]) ? [...parsed[cat]] : [];
          // Ensure every default item exists and has the latest visual properties
          defaults.forEach((defItem) => {
            const idx = list.findIndex((i: StoreItem) => i.id === defItem.id);
            if (idx >= 0) {
              list[idx] = {
                ...defItem,
                ...list[idx],
                name: defItem.name,
                subtitle: defItem.subtitle,
                description: defItem.description,
                image: defItem.image,
                cssFilter: defItem.cssFilter,
                badge: defItem.badge,
                rarity: defItem.rarity,
                price: defItem.price,
                accentGradient: defItem.accentGradient,
                borderGlow: defItem.borderGlow,
              };
            } else {
              list.push({ ...defItem });
            }
          });
          return list;
        };

        return {
          bottles: mergeCategory('bottles', DEFAULT_STORE_CATALOGUE.bottles),
          bombs: mergeCategory('bombs', DEFAULT_STORE_CATALOGUE.bombs),
          balls: mergeCategory('balls', DEFAULT_STORE_CATALOGUE.balls),
          accessories: mergeCategory('accessories', DEFAULT_STORE_CATALOGUE.accessories || []),
        };
      }
    }
  } catch (e) {}
  return {
    bottles: [...DEFAULT_STORE_CATALOGUE.bottles],
    bombs: [...DEFAULT_STORE_CATALOGUE.bombs],
    balls: [...DEFAULT_STORE_CATALOGUE.balls],
    accessories: [...(DEFAULT_STORE_CATALOGUE.accessories || [])],
  };
}

export const STORE_CATALOGUE: Record<StoreCategory, StoreItem[]> = loadInitialStoreCatalogue();

export function syncStoreCatalogueInMemory(newCatalogue: Record<StoreCategory, StoreItem[]>): Record<StoreCategory, StoreItem[]> {
  STORE_CATALOGUE.bottles = [...newCatalogue.bottles];
  STORE_CATALOGUE.bombs = [...newCatalogue.bombs];
  STORE_CATALOGUE.balls = [...newCatalogue.balls];
  STORE_CATALOGUE.accessories = [...(newCatalogue.accessories || [])];
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORE_CATALOGUE_STORAGE_KEY, JSON.stringify(STORE_CATALOGUE));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('picku_store_catalogue_updated', { detail: STORE_CATALOGUE }));
    }
  } catch (e) {}
  return STORE_CATALOGUE;
}

export function getStoreCatalogue(): Record<StoreCategory, StoreItem[]> {
  return {
    bottles: [...STORE_CATALOGUE.bottles],
    bombs: [...STORE_CATALOGUE.bombs],
    balls: [...STORE_CATALOGUE.balls],
    accessories: [...(STORE_CATALOGUE.accessories || [])],
  };
}

export function addStoreItem(item: StoreItem): Record<StoreCategory, StoreItem[]> {
  const cat = item.category;
  if (!STORE_CATALOGUE[cat]) {
    STORE_CATALOGUE[cat] = [];
  }
  const existingIdx = STORE_CATALOGUE[cat].findIndex((i) => i.id === item.id);
  if (existingIdx >= 0) {
    STORE_CATALOGUE[cat][existingIdx] = { ...item };
  } else {
    STORE_CATALOGUE[cat].push({ ...item });
  }
  syncStoreCatalogueInMemory(STORE_CATALOGUE);
  return getStoreCatalogue();
}

export function updateStoreItem(item: StoreItem): Record<StoreCategory, StoreItem[]> {
  let found = false;
  (Object.keys(STORE_CATALOGUE) as StoreCategory[]).forEach((cat) => {
    const idx = STORE_CATALOGUE[cat].findIndex((i) => i.id === item.id);
    if (idx >= 0) {
      if (cat === item.category) {
        STORE_CATALOGUE[cat][idx] = { ...item };
      } else {
        STORE_CATALOGUE[cat].splice(idx, 1);
        if (!STORE_CATALOGUE[item.category]) STORE_CATALOGUE[item.category] = [];
        STORE_CATALOGUE[item.category].push({ ...item });
      }
      found = true;
    }
  });

  if (!found) {
    addStoreItem(item);
  } else {
    syncStoreCatalogueInMemory(STORE_CATALOGUE);
  }
  return getStoreCatalogue();
}

export function deleteStoreItem(itemId: string): Record<StoreCategory, StoreItem[]> {
  (Object.keys(STORE_CATALOGUE) as StoreCategory[]).forEach((cat) => {
    STORE_CATALOGUE[cat] = STORE_CATALOGUE[cat].filter((i) => i.id !== itemId);
  });
  syncStoreCatalogueInMemory(STORE_CATALOGUE);

  // If the deleted item was currently equipped, fallback to default safe skin
  try {
    const eco = getEconomyState();
    let needEcoSave = false;
    if (eco.equippedSkins.bottles === itemId) {
      eco.equippedSkins.bottles = STORE_CATALOGUE.bottles[0]?.id || 'bottle_btl_001';
      needEcoSave = true;
    }
    if (eco.equippedSkins.bombs === itemId) {
      eco.equippedSkins.bombs = STORE_CATALOGUE.bombs[0]?.id || 'bomb_classic_tnt';
      needEcoSave = true;
    }
    if (eco.equippedSkins.balls === itemId) {
      eco.equippedSkins.balls = STORE_CATALOGUE.balls[0]?.id || 'ball_cyan_orbs';
      needEcoSave = true;
    }
    if (eco.equippedSkins.accessories === itemId) {
      eco.equippedSkins.accessories = undefined;
      needEcoSave = true;
    }
    if (needEcoSave) {
      saveEconomyState(eco);
    }
  } catch (e) {}

  return getStoreCatalogue();
}

export function resetStoreCatalogueToDefault(): Record<StoreCategory, StoreItem[]> {
  STORE_CATALOGUE.bottles = [...DEFAULT_STORE_CATALOGUE.bottles];
  STORE_CATALOGUE.bombs = [...DEFAULT_STORE_CATALOGUE.bombs];
  STORE_CATALOGUE.balls = [...DEFAULT_STORE_CATALOGUE.balls];
  STORE_CATALOGUE.accessories = [...(DEFAULT_STORE_CATALOGUE.accessories || [])];
  syncStoreCatalogueInMemory(STORE_CATALOGUE);
  return getStoreCatalogue();
}

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTimeUntilMidnight(): {
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  formatted: string;
} {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  const diffMs = Math.max(0, midnight.getTime() - now.getTime());
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
  const formatted = `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  return { hours, minutes, seconds, totalMs: diffMs, formatted };
}

export function createDefaultQuests(): DailyQuest[] {
  return [
    {
      id: 'quest_daily_party',
      title: 'Party Attendance',
      description: 'Check in to the party club today to earn daily stars.',
      targetCount: 1,
      currentCount: 1, // Ready to claim immediately on daily login!
      starReward: 50,
      isClaimed: false,
      gameMode: 'hub',
    },
    {
      id: 'quest_bottle_spin',
      title: 'Bottle Spin Party',
      description: 'Spin the bottle 3 times with party friends.',
      targetCount: 3,
      currentCount: 0,
      starReward: 50,
      isClaimed: false,
      gameMode: 'bottle',
    },
    {
      id: 'quest_roulette_picker',
      title: 'Finger Picker Host',
      description: 'Complete 2 rounds of Finger Roulette selection.',
      targetCount: 2,
      currentCount: 0,
      starReward: 50,
      isClaimed: false,
      gameMode: 'roulette',
    },
    {
      id: 'quest_kaboom_tiles',
      title: 'Safe Tile Sweeper',
      description: 'Reveal 5 safe ball tiles in KABOOM mode without detonating.',
      targetCount: 5,
      currentCount: 0,
      starReward: 75,
      isClaimed: false,
      gameMode: 'kaboom',
    },
    {
      id: 'quest_kaboom_victory',
      title: 'Kaboom Champion',
      description: 'Safely clear a board or avoid bombs to win 1 KABOOM round.',
      targetCount: 1,
      currentCount: 0,
      starReward: 100,
      isClaimed: false,
      gameMode: 'kaboom',
    },
  ];
}

export const MILESTONE_CHEST_REWARD = 250;

export interface DailyLoginRewardTier {
  day: number;
  stars: number;
  label: string;
  isGrand?: boolean;
  bundleName?: string;
  bundleImage?: string;
  bundleItems?: string[];
}

export const DAILY_LOGIN_REWARDS: DailyLoginRewardTier[] = [
  { day: 1, stars: 100, label: 'Day 1' },
  { day: 2, stars: 150, label: 'Day 2' },
  { day: 3, stars: 200, label: 'Day 3' },
  { day: 4, stars: 250, label: 'Day 4' },
  { day: 5, stars: 300, label: 'Day 5' },
  { day: 6, stars: 400, label: 'Day 6' },
  {
    day: 7,
    stars: 1000,
    label: 'Grand Day 7',
    isGrand: true,
    bundleName: 'Day 7 Grand Vault Bundle',
    bundleImage: day7BundleChestImg,
    bundleItems: [DAY7_BUNDLE_BOMB_ID, DAY7_BUNDLE_BALL_ID],
  },
];

const DEFAULT_STATE: EconomyState = {
  stars: 1250,
  unlockedItems: [
    'bottle_btl_001',
    'bomb_classic_tnt',
    'ball_cyan_orbs',
  ],
  equippedSkins: {
    bottles: 'bottle_btl_001',
    bombs: 'bomb_classic_tnt',
    balls: 'ball_cyan_orbs',
    accessories: '',
  },
  starEarrings: {
    bombVictory: false,
    bottleSpin: false,
    fingerGame: false,
    unlocked: false,
  },
  dailyQuests: createDefaultQuests(),
  milestoneChestClaimed: false,
  lastDailyResetDate: getTodayDateString(),
  lastDailyReset: Date.now(),
  dailyLoginRewards: {
    claimedDays: [],
    lastClaimDate: '',
  },
  claimedLoginDay: 1,
  milestoneChestsOpened: 0,
  totalLoginsCount: 1,
  lifetimeStarsEarned: 100,
  questsCompletedCount: 0,
};

export function getEconomyState(): EconomyState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_STATE));
      return DEFAULT_STATE;
    }
    const parsed = JSON.parse(raw);
    const todayStr = getTodayDateString();
    
    // Ensure default unlocked bottle is present
    let rawUnlocked: string[] = Array.isArray(parsed.unlockedItems) ? parsed.unlockedItems : DEFAULT_STATE.unlockedItems;
    if (!rawUnlocked.includes('bottle_btl_001')) {
      rawUnlocked.push('bottle_btl_001');
    }
    // Backward compatibility for previous Day 7 IDs
    if (rawUnlocked.includes('bomb_day7_vault_core') && !rawUnlocked.includes(DAY7_BUNDLE_BOMB_ID)) {
      rawUnlocked.push(DAY7_BUNDLE_BOMB_ID);
    }
    if (rawUnlocked.includes('ball_day7_nebula_orb') && !rawUnlocked.includes(DAY7_BUNDLE_BALL_ID)) {
      rawUnlocked.push(DAY7_BUNDLE_BALL_ID);
    }

    // Filter out obsolete/deleted prototype IDs
    const validBottleIds = STORE_CATALOGUE.bottles.map((b) => b.id);
    const validBombIds = STORE_CATALOGUE.bombs.map((b) => b.id);
    const validBallIds = STORE_CATALOGUE.balls.map((b) => b.id);
    const validAccessoryIds = STORE_CATALOGUE.accessories.map((a) => a.id);
    const allValidIds = new Set([...validBottleIds, ...validBombIds, ...validBallIds, ...validAccessoryIds, 'btl_e_001', 'bomb_day7_vault_core', 'ball_day7_nebula_orb', 'accessory_star_earrings']);

    // Parse Star Earrings Condition progress
    const rawEarrings = parsed.starEarrings || {};
    const bombVictory = Boolean(rawEarrings.bombVictory);
    const bottleSpin = Boolean(rawEarrings.bottleSpin);
    const fingerGame = Boolean(rawEarrings.fingerGame);
    const isUnlocked = Boolean(rawEarrings.unlocked || (bombVictory && bottleSpin && fingerGame));

    const starEarrings: StarEarringsProgress = {
      bombVictory,
      bottleSpin,
      fingerGame,
      unlocked: isUnlocked,
      unlockedAt: rawEarrings.unlockedAt,
    };

    if (isUnlocked && !rawUnlocked.includes('accessory_star_earrings')) {
      rawUnlocked.push('accessory_star_earrings');
    }

    const cleanUnlocked = rawUnlocked.filter((id) => allValidIds.has(id));

    let equippedBottles = parsed.equippedSkins?.bottles;
    const isCustomBottle = equippedBottles === 'custom' || (typeof equippedBottles === 'string' && equippedBottles.startsWith('custom_'));
    if (!validBottleIds.includes(equippedBottles) && !isCustomBottle) {
      equippedBottles = 'bottle_btl_001';
    }

    // Daily reset check: compare stored reset date with today's local date
    const lastResetDate = typeof parsed.lastDailyResetDate === 'string' ? parsed.lastDailyResetDate : '';
    const isNewDay = lastResetDate !== todayStr;

    let dailyQuests: DailyQuest[];
    let milestoneChestClaimed = Boolean(parsed.milestoneChestClaimed);

    if (isNewDay) {
      // It's a new day! Reset all quests and milestone chest
      dailyQuests = createDefaultQuests();
      milestoneChestClaimed = false;
    } else {
      // Same day: ensure standard 5 quests exist and keep progress
      const defaultQuests = createDefaultQuests();
      const existingQuests: DailyQuest[] = Array.isArray(parsed.dailyQuests) ? parsed.dailyQuests : [];
      
      dailyQuests = defaultQuests.map((defQ) => {
        const found = existingQuests.find((q) => q.id === defQ.id);
        if (found) {
          return {
            ...defQ,
            currentCount: typeof found.currentCount === 'number' ? found.currentCount : defQ.currentCount,
            isClaimed: Boolean(found.isClaimed),
          };
        }
        return defQ;
      });
    }

    // Daily Login Rewards normalization
    const rawDailyRewards = parsed.dailyLoginRewards || {};
    const claimedDays: number[] = Array.isArray(rawDailyRewards.claimedDays)
      ? rawDailyRewards.claimedDays.filter((d: any) => typeof d === 'number' && d >= 1 && d <= 7)
      : [];
    const lastClaimDate: string = typeof rawDailyRewards.lastClaimDate === 'string'
      ? rawDailyRewards.lastClaimDate
      : '';

    const dailyLoginRewards: DailyLoginRewards = {
      claimedDays,
      lastClaimDate,
    };

    let equippedBombs = parsed.equippedSkins?.bombs;
    if (equippedBombs === 'bomb_day7_vault_core') equippedBombs = DAY7_BUNDLE_BOMB_ID;
    if (!validBombIds.includes(equippedBombs)) {
      equippedBombs = 'bomb_classic_tnt';
    }

    let equippedBalls = parsed.equippedSkins?.balls;
    if (equippedBalls === 'ball_day7_nebula_orb') equippedBalls = DAY7_BUNDLE_BALL_ID;
    if (!validBallIds.includes(equippedBalls)) {
      equippedBalls = 'ball_cyan_orbs';
    }

    const currentState: EconomyState = {
      stars: typeof parsed.stars === 'number' ? parsed.stars : DEFAULT_STATE.stars,
      unlockedItems: cleanUnlocked.length > 0 ? cleanUnlocked : DEFAULT_STATE.unlockedItems,
      equippedSkins: {
        bottles: equippedBottles,
        bombs: equippedBombs,
        balls: equippedBalls,
        accessories: parsed.equippedSkins?.accessories || (isUnlocked ? 'accessory_star_earrings' : ''),
      },
      starEarrings,
      dailyQuests,
      milestoneChestClaimed,
      lastDailyResetDate: todayStr,
      lastDailyReset: isNewDay ? Date.now() : (parsed.lastDailyReset || Date.now()),
      dailyLoginRewards,
      claimedLoginDay: claimedDays.length,
      milestoneChestsOpened: typeof parsed.milestoneChestsOpened === 'number' ? parsed.milestoneChestsOpened : (milestoneChestClaimed ? 1 : 0),
      totalLoginsCount: isNewDay
        ? (typeof parsed.totalLoginsCount === 'number' ? parsed.totalLoginsCount + 1 : Math.max(1, claimedDays.length) + 1)
        : (typeof parsed.totalLoginsCount === 'number' ? parsed.totalLoginsCount : Math.max(1, claimedDays.length)),
      lifetimeStarsEarned: typeof parsed.lifetimeStarsEarned === 'number' ? Math.max(parsed.lifetimeStarsEarned, typeof parsed.stars === 'number' ? parsed.stars : 0) : (typeof parsed.stars === 'number' ? parsed.stars : DEFAULT_STATE.stars),
      questsCompletedCount: Math.max(
        typeof parsed.questsCompletedCount === 'number' ? parsed.questsCompletedCount : 0,
        dailyQuests.filter((q) => q.currentCount >= q.targetCount).length
      ),
    };

    if (isNewDay) {
      // Persist the reset state immediately
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState));
    }

    return currentState;
  } catch (e) {
    return DEFAULT_STATE;
  }
}

export function saveEconomyState(state: EconomyState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('picku_economy_updated', { detail: state }));
  } catch (e) {}
}

export function checkAndResetDailyQuests(): EconomyState {
  const current = getEconomyState();
  const today = getTodayDateString();
  if (current.lastDailyResetDate !== today) {
    const newQuests = createDefaultQuests();
    // Daily attendance quest is fulfilled immediately upon daily check-in
    const initialCompleted = newQuests.filter((q) => q.currentCount >= q.targetCount).length;
    const updated: EconomyState = {
      ...current,
      dailyQuests: newQuests,
      milestoneChestClaimed: false,
      lastDailyResetDate: today,
      lastDailyReset: Date.now(),
      totalLoginsCount: (current.totalLoginsCount || 1) + 1,
      questsCompletedCount: (current.questsCompletedCount || 0) + initialCompleted,
    };
    saveEconomyState(updated);
    return updated;
  }
  return current;
}

export function recordDailyQuestProgress(
  type: 'bottle_spin' | 'roulette_round' | 'kaboom_tile' | 'kaboom_victory',
  amount: number = 1
): { updatedState: EconomyState; completedQuests: DailyQuest[] } {
  const state = checkAndResetDailyQuests();

  const idMap: Record<string, string> = {
    bottle_spin: 'quest_bottle_spin',
    roulette_round: 'quest_roulette_picker',
    kaboom_tile: 'quest_kaboom_tiles',
    kaboom_victory: 'quest_kaboom_victory',
  };

  const targetId = idMap[type];
  if (!targetId) return { updatedState: state, completedQuests: [] };

  const questIndex = state.dailyQuests.findIndex((q) => q.id === targetId);
  if (questIndex === -1) return { updatedState: state, completedQuests: [] };

  const quest = state.dailyQuests[questIndex];
  if (quest.currentCount >= quest.targetCount) {
    return { updatedState: state, completedQuests: [] };
  }

  const completedNow = (quest.currentCount + amount) >= quest.targetCount && quest.currentCount < quest.targetCount;
  const nextCount = Math.min(quest.targetCount, quest.currentCount + amount);
  const updatedQuests = [...state.dailyQuests];
  updatedQuests[questIndex] = {
    ...quest,
    currentCount: nextCount,
  };

  const updatedState: EconomyState = {
    ...state,
    dailyQuests: updatedQuests,
    // Increment lifetime quests completed count permanently whenever a quest is completed
    questsCompletedCount: completedNow
      ? (state.questsCompletedCount || 0) + 1
      : (state.questsCompletedCount || 0),
  };

  saveEconomyState(updatedState);

  return {
    updatedState,
    completedQuests: completedNow ? [updatedQuests[questIndex]] : [],
  };
}

export function claimMilestoneChest(): {
  success: boolean;
  starsAdded: number;
  updatedState: EconomyState;
  message: string;
} {
  const state = getEconomyState();
  if (state.milestoneChestClaimed) {
    return {
      success: false,
      starsAdded: 0,
      updatedState: state,
      message: 'Milestone chest already claimed today!',
    };
  }

  const allCompleted =
    state.dailyQuests.length > 0 &&
    state.dailyQuests.every((q) => q.currentCount >= q.targetCount);

  if (!allCompleted) {
    return {
      success: false,
      starsAdded: 0,
      updatedState: state,
      message: 'Complete all 5 daily quests to open the chest!',
    };
  }

  const updatedState: EconomyState = {
    ...state,
    stars: state.stars + MILESTONE_CHEST_REWARD,
    lifetimeStarsEarned: (state.lifetimeStarsEarned || state.stars) + MILESTONE_CHEST_REWARD,
    milestoneChestClaimed: true,
    milestoneChestsOpened: (state.milestoneChestsOpened || 0) + 1,
  };

  saveEconomyState(updatedState);
  return {
    success: true,
    starsAdded: MILESTONE_CHEST_REWARD,
    updatedState,
    message: 'Rave Crate opened! +250 Stars claimed!',
  };
}

export function resetDailyQuestsForTesting(): EconomyState {
  const state = getEconomyState();
  const updated: EconomyState = {
    ...state,
    dailyQuests: createDefaultQuests(),
    milestoneChestClaimed: false,
    lastDailyResetDate: getTodayDateString(),
    lastDailyReset: Date.now(),
  };
  saveEconomyState(updated);
  return updated;
}

// 7-DAY LOGIN REWARDS LOGIC (From Day 1 to Day 7, each day can be claimed just once)
export function getDailyRewardStatus(customState?: EconomyState): {
  claimedDays: number[];
  currentAvailableDay: number | null;
  canClaimToday: boolean;
  allDaysClaimed: boolean;
  nextDay: number | null;
  nextDayUnlocksAtMidnight: boolean;
} {
  const state = customState || getEconomyState();
  const today = getTodayDateString();
  const claimed = Array.isArray(state.dailyLoginRewards?.claimedDays)
    ? [...state.dailyLoginRewards.claimedDays]
    : [];
  const lastDate = state.dailyLoginRewards?.lastClaimDate || '';

  const totalClaimed = claimed.length;

  if (totalClaimed >= 7) {
    return {
      claimedDays: claimed,
      currentAvailableDay: null,
      canClaimToday: false,
      allDaysClaimed: true,
      nextDay: null,
      nextDayUnlocksAtMidnight: false,
    };
  }

  // If already claimed today:
  if (lastDate === today) {
    const nextDay = totalClaimed + 1;
    return {
      claimedDays: claimed,
      currentAvailableDay: null,
      canClaimToday: false,
      allDaysClaimed: false,
      nextDay: nextDay <= 7 ? nextDay : null,
      nextDayUnlocksAtMidnight: true,
    };
  }

  // Not claimed today yet: next sequential day (1..7) is available
  const nextDay = totalClaimed + 1;
  return {
    claimedDays: claimed,
    currentAvailableDay: nextDay <= 7 ? nextDay : null,
    canClaimToday: nextDay <= 7,
    allDaysClaimed: false,
    nextDay: nextDay <= 7 ? nextDay : null,
    nextDayUnlocksAtMidnight: false,
  };
}

export function claimDailyLoginReward(day: number): {
  success: boolean;
  starsAdded: number;
  updatedState: EconomyState;
  message: string;
} {
  const state = getEconomyState();
  const today = getTodayDateString();
  const claimed = state.dailyLoginRewards?.claimedDays || [];
  const lastDate = state.dailyLoginRewards?.lastClaimDate || '';

  if (day < 1 || day > 7) {
    return { success: false, starsAdded: 0, updatedState: state, message: 'Invalid reward day.' };
  }

  // "From day 1 to day 7, the rewards can be claimed just once."
  if (claimed.includes(day)) {
    return {
      success: false,
      starsAdded: 0,
      updatedState: state,
      message: `Day ${day} reward has already been claimed! Each day can only be claimed once.`,
    };
  }

  if (lastDate === today) {
    return {
      success: false,
      starsAdded: 0,
      updatedState: state,
      message: 'You have already claimed today’s reward! Come back tomorrow for the next day.',
    };
  }

  const expectedDay = claimed.length + 1;
  if (day !== expectedDay) {
    return {
      success: false,
      starsAdded: 0,
      updatedState: state,
      message: `Please claim Day ${expectedDay} first.`,
    };
  }

  const tier = DAILY_LOGIN_REWARDS.find((t) => t.day === day);
  const starAmount = tier ? tier.stars : 100;

  const updatedClaimedDays = [...claimed, day];
  const updatedLoginRewards: DailyLoginRewards = {
    claimedDays: updatedClaimedDays,
    lastClaimDate: today,
  };

  // Day 7 Grand Bundle: unlock exclusive skins
  let newUnlockedItems = [...state.unlockedItems];
  let bundleClaimedMessage = '';
  if (day === 7) {
    if (!newUnlockedItems.includes(DAY7_BUNDLE_BOMB_ID)) {
      newUnlockedItems.push(DAY7_BUNDLE_BOMB_ID);
    }
    if (!newUnlockedItems.includes(DAY7_BUNDLE_BALL_ID)) {
      newUnlockedItems.push(DAY7_BUNDLE_BALL_ID);
    }
    bundleClaimedMessage = ' Day 7 Grand Bundle Unlocked: Vault Dynamo Bomb & Celestial Nebula Orbs!';
  }

  const updatedState: EconomyState = {
    ...state,
    stars: state.stars + starAmount,
    lifetimeStarsEarned: (state.lifetimeStarsEarned || state.stars) + starAmount,
    totalLoginsCount: Math.max(state.totalLoginsCount || 1, updatedClaimedDays.length),
    unlockedItems: newUnlockedItems,
    dailyLoginRewards: updatedLoginRewards,
    claimedLoginDay: updatedClaimedDays.length,
  };

  saveEconomyState(updatedState);
  return {
    success: true,
    starsAdded: starAmount,
    updatedState,
    message: `Day ${day} reward claimed! +${starAmount} Stars!${bundleClaimedMessage}`,
  };
}

export function resetDailyLoginRewardsForTesting(): EconomyState {
  const state = getEconomyState();
  const updated: EconomyState = {
    ...state,
    dailyLoginRewards: {
      claimedDays: [],
      lastClaimDate: '',
    },
    claimedLoginDay: 0,
  };
  saveEconomyState(updated);
  return updated;
}

export function purchaseItem(itemId: string): { success: boolean; message: string; updatedState: EconomyState } {
  const state = getEconomyState();
  if (state.unlockedItems.includes(itemId)) {
    return { success: true, message: 'Item already unlocked!', updatedState: state };
  }

  let foundItem: StoreItem | null = null;
  for (const cat of Object.keys(STORE_CATALOGUE) as StoreCategory[]) {
    const match = STORE_CATALOGUE[cat].find((i) => i.id === itemId);
    if (match) {
      foundItem = match;
      break;
    }
  }

  if (!foundItem) {
    return { success: false, message: 'Item not found.', updatedState: state };
  }

  if (itemId === 'accessory_star_earrings') {
    if (!state.starEarrings?.unlocked) {
      return {
        success: false,
        message: 'Master all 3 games (Bomb Victory, Bottle Spin & Finger Game) to unlock!',
        updatedState: state,
      };
    }
  }

  if (itemId === DAY7_BUNDLE_BOMB_ID || itemId === DAY7_BUNDLE_BALL_ID || foundItem.badge === 'DAY 7 EXCLUSIVE') {
    return {
      success: false,
      message: 'Exclusive Item: Only unlocked via Day 7 Daily Login Reward bundle!',
      updatedState: state,
    };
  }

  if (state.stars < foundItem.price) {
    return { success: false, message: `Need ${foundItem.price - state.stars} more Stars!`, updatedState: state };
  }

  const updated: EconomyState = {
    ...state,
    stars: state.stars - foundItem.price,
    unlockedItems: [...state.unlockedItems, itemId],
    equippedSkins: {
      ...state.equippedSkins,
      [foundItem.category]: itemId,
    },
  };

  saveEconomyState(updated);
  return { success: true, message: `Purchased and equipped ${foundItem.name}!`, updatedState: updated };
}

export function equipItem(category: StoreCategory, itemId: string): { success: boolean; updatedState: EconomyState } {
  const state = getEconomyState();

  // If custom bottle is equipped (e.g. 'custom' or 'custom_<spriteId>')
  if (category === 'bottles' && (itemId === 'custom' || itemId.startsWith('custom_'))) {
    const updated: EconomyState = {
      ...state,
      equippedSkins: {
        ...state.equippedSkins,
        bottles: itemId,
      },
    };
    saveEconomyState(updated);
    return { success: true, updatedState: updated };
  }

  // Handle star earrings accessory
  if (itemId === 'accessory_star_earrings') {
    if (!state.starEarrings?.unlocked && !state.unlockedItems.includes(itemId)) {
      return { success: false, updatedState: state };
    }
    const unlocked = [...state.unlockedItems];
    if (!unlocked.includes(itemId)) {
      unlocked.push(itemId);
    }
    const updated: EconomyState = {
      ...state,
      unlockedItems: unlocked,
      equippedSkins: {
        ...state.equippedSkins,
        accessories: itemId,
      },
    };
    saveEconomyState(updated);
    return { success: true, updatedState: updated };
  }

  if (!state.unlockedItems.includes(itemId)) {
    return { success: false, updatedState: state };
  }

  const updated: EconomyState = {
    ...state,
    equippedSkins: {
      ...state.equippedSkins,
      [category]: itemId,
    },
  };

  saveEconomyState(updated);
  return { success: true, updatedState: updated };
}

export function claimQuestReward(questId: string): { success: boolean; starsAdded: number; updatedState: EconomyState } {
  const state = getEconomyState();
  const questIndex = state.dailyQuests.findIndex((q) => q.id === questId);
  if (questIndex === -1) {
    return { success: false, starsAdded: 0, updatedState: state };
  }

  const quest = state.dailyQuests[questIndex];
  if (quest.isClaimed || quest.currentCount < quest.targetCount) {
    return { success: false, starsAdded: 0, updatedState: state };
  }

  const updatedQuests = [...state.dailyQuests];
  updatedQuests[questIndex] = { ...quest, isClaimed: true };

  const updatedState: EconomyState = {
    ...state,
    stars: state.stars + quest.starReward,
    lifetimeStarsEarned: (state.lifetimeStarsEarned || state.stars) + quest.starReward,
    questsCompletedCount: Math.max(
      state.questsCompletedCount || 0,
      updatedQuests.filter((q) => q.currentCount >= q.targetCount).length
    ),
    dailyQuests: updatedQuests,
  };

  saveEconomyState(updatedState);
  return { success: true, starsAdded: quest.starReward, updatedState };
}

export function addStars(amount: number): EconomyState {
  const state = getEconomyState();
  const nextStars = Math.max(0, state.stars + amount);
  const updated: EconomyState = {
    ...state,
    stars: nextStars,
    // When positive stars are added (rewards, gifts, game wins, bonuses), also accumulate lifetime stars
    lifetimeStarsEarned: amount > 0
      ? (state.lifetimeStarsEarned || state.stars) + amount
      : (state.lifetimeStarsEarned || state.stars),
  };
  saveEconomyState(updated);
  return updated;
}

export function refillPrototypeStars(amount: number = 1000): { starsAdded: number; updatedState: EconomyState } {
  const updated = addStars(amount);
  return { starsAdded: amount, updatedState: updated };
}

/**
 * Update Star Earrings condition progress:
 * Star earrings unlocked when:
 * 1. Bomb game victory (bombVictory)
 * 2. Complete bottle spin (bottleSpin)
 * 3. Complete finger game (fingerGame)
 */
export function recordStarEarringsCondition(
  condition: 'bombVictory' | 'bottleSpin' | 'fingerGame'
): { updatedState: EconomyState; newlyUnlocked: boolean } {
  const state = getEconomyState();
  const current = state.starEarrings || {
    bombVictory: false,
    bottleSpin: false,
    fingerGame: false,
    unlocked: false,
  };

  // If already unlocked and this condition is already true, no-op
  if (current[condition] && current.unlocked) {
    return { updatedState: state, newlyUnlocked: false };
  }

  const nextProgress: StarEarringsProgress = {
    ...current,
    [condition]: true,
  };

  const wasUnlocked = current.unlocked;
  const isNowUnlocked =
    nextProgress.bombVictory &&
    nextProgress.bottleSpin &&
    nextProgress.fingerGame;

  const newlyUnlocked = !wasUnlocked && isNowUnlocked;
  if (newlyUnlocked) {
    nextProgress.unlocked = true;
    nextProgress.unlockedAt = Date.now();
  } else if (wasUnlocked) {
    nextProgress.unlocked = true;
  }

  const unlockedItems = [...state.unlockedItems];
  if (nextProgress.unlocked && !unlockedItems.includes('accessory_star_earrings')) {
    unlockedItems.push('accessory_star_earrings');
  }

  const updatedState: EconomyState = {
    ...state,
    starEarrings: nextProgress,
    unlockedItems,
    equippedSkins: {
      ...state.equippedSkins,
      ...(newlyUnlocked ? { accessories: 'accessory_star_earrings' } : {}),
    },
  };

  saveEconomyState(updatedState);

  if (newlyUnlocked && typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('star_earrings_unlocked', { detail: nextProgress })
    );
  }

  return { updatedState, newlyUnlocked };
}

export function equipStarEarrings(equip: boolean): EconomyState {
  const state = getEconomyState();
  if (!state.starEarrings?.unlocked) return state;

  const updatedState: EconomyState = {
    ...state,
    equippedSkins: {
      ...state.equippedSkins,
      accessories: equip ? 'accessory_star_earrings' : '',
    },
  };

  saveEconomyState(updatedState);
  return updatedState;
}

export function unlockStoreSkin(itemId: string): EconomyState {
  const state = getEconomyState();
  if (state.unlockedItems.includes(itemId)) {
    return state;
  }
  const updatedState: EconomyState = {
    ...state,
    unlockedItems: [...state.unlockedItems, itemId],
  };
  saveEconomyState(updatedState);
  return updatedState;
}


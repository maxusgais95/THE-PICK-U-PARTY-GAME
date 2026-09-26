/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ScreenView = 'hub' | 'roulette' | 'bottle' | 'kaboom' | 'settings' | 'admin';

export type ThemeId =
  | 'cyber-neon'
  | 'synthwave'
  | 'solar-flare'
  | 'midnight-aurora';

export type BottleBuiltinStyle =
  | 'btl_e_001'
  | 'btl_e_002'
  | 'btl_e_003'
  | 'btl_e_004';

export type BottleBlendMode = 'normal' | 'screen' | 'color-dodge';

export interface CustomBottleSprite {
  id: string;
  name: string;
  dataUrl: string; // Stored in IndexedDB (processed transparent sprite)
  originalDataUrl?: string; // Raw original uploaded image file
  createdAt: number;
  rotationOffset: number; // 0, 90, 180, 270 degrees
  blendMode?: BottleBlendMode; // normal, screen, color-dodge
}

export interface TouchPlayer {
  id: number | string;
  x: number;
  y: number;
  colorIndex: number;
  teamIndex?: number;
  isTarget?: boolean;
  playerLabel: string;
}

export interface SwirlColorStop {
  r: number;
  g: number;
  b: number;
  hex: string;
}

export interface ThemeColors {
  id: ThemeId;
  name: string;
  tagline?: string;
  primary: string;
  secondary: string;
  accent: string;
  bgBase: string;
  bgGrad: string;
  // Button Gradients
  btnRouletteGrad: string;
  btnRouletteShadow: string;
  btnBottleGrad: string;
  btnBottleShadow: string;
  // Stage Lighting & Lasers
  laserColors: string[];
  // 3D Swirl Shader Color Palette (5 stops for WebGL / Canvas)
  swirlStops: [SwirlColorStop, SwirlColorStop, SwirlColorStop, SwirlColorStop, SwirlColorStop];
  // Scanner Laser Blade & Glow
  scannerLaserColor: string;
  scannerLaserGlow: string;
  playerPalettes: {
    gradient: string;
    glow: string;
    text: string;
    border: string;
    solid: string;
  }[];
  teamPalettes?: {
    gradient: string;
    glow: string;
    text: string;
    border: string;
    solid: string;
  }[];
}

export interface AppSettings {
  // Game Play
  minPlayers: number; // 2..5
  targetCount: number; // 1..(minPlayers - 1)
  countdownSeconds: number; // 5, 8, 10
  
  // Bottle
  bottleStyle: BottleBuiltinStyle | 'custom';
  selectedCustomSpriteId: string | null;
  bottleBlendMode: BottleBlendMode;
  bottleFriction: number; // 0.985 standard
  
  // Theme & Appearance
  theme: ThemeId;
  
  // Audio & Haptics (Dual SFX and Music controls)
  sfxEnabled: boolean;
  sfxVolume: number; // 0.0 to 1.0
  musicEnabled: boolean;
  musicVolume: number; // 0.0 to 1.0
  // Compatibility aliases
  soundEnabled: boolean;
  soundVolume: number; // 0.0 to 1.0
  hapticsEnabled: boolean;
}

export interface KaboomStats {
  victories: number; // Ended a round without tapping the bomb
  bonusCollected: number; // Total bonus power-ups collected
  bombHits: number; // Total times a bomb was tapped / detonated
  totalRounds: number; // Total Kaboom rounds completed
  winrate: number; // Win percentage (0 to 100)
}

export interface AppStats {
  totalRouletteRounds: number;
  totalBottleSpins: number;
  totalKaboomRounds: number;
  lastPlayedAt: number;
  kaboom: KaboomStats;
}

// ============================================================================
// KABOOM Mode Types
// ============================================================================

export type KaboomGridDimension = 2 | 3 | 4 | 5 | 6;

export type KaboomTileType = 'safe' | 'bonus' | 'bomb';

export type KaboomCommandCategory = 'dare' | 'privilege' | 'tactical' | 'party';

export type KaboomBonusSpriteId =
  | 'musical_note'
  | 'headset'
  | 'cute_star'
  | 'crystal_rose'
  | 'diamond_key';

export interface KaboomBonusItem {
  id: KaboomBonusSpriteId;
  name: string;
  rank: 1 | 2 | 3 | 4 | 5;
  rankName: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';
  starReward: number;
  probability: number;
  description: string;
  tagline: string;
  image: string;
  accentColor: string;
  glowColor: string;
  badgeBg: string;
  borderColor: string;
}

export interface KaboomCommand {
  id: string;
  title: string;
  category: KaboomCommandCategory;
  description: string;
  icon: string;
  tag: string;
}

export interface KaboomTile {
  id: number;
  row: number;
  col: number;
  type: KaboomTileType;
  revealed: boolean;
  isDetonated?: boolean;
  isDefused?: boolean;
  isAutoRevealed?: boolean;
  bonusItem?: KaboomBonusItem;
  bonusCommand?: KaboomCommand;
  revealedByPlayerIndex?: number;
}

export interface KaboomGridConfig {
  dimension: KaboomGridDimension;
  title: string;
  tagline: string;
  difficulty: string;
  totalTiles: number;
  bombs: number;
  bonusCountMin: number;
  bonusCountMax: number;
  bonusProbabilityText: string;
  description: string;
  accentColor: string;
  badge?: string;
}

export interface KaboomLogEntry {
  id: string;
  timestamp: number;
  type: 'round_start' | 'safe' | 'bonus' | 'bomb';
  playerIndex: number;
  playerName: string;
  text: string;
}


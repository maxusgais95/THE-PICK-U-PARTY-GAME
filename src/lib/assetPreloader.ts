/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Asset Imports
import neonPartyVideo from '../assets/videos/Chibi DJ Neon Party Animation.mp4';
import rouletteBgVideo from '../assets/videos/Finger Roulette Background Animation.mp4';
import spectrumVideo from '../assets/videos/Neon DJ Disc Background Animation.mp4';
import splashBgVideo from '../assets/videos/Chibi Party Splash Screen Background Animation.mp4';

import rouletteBgImage from '../assets/images/Finger Roulette Background.webp';
import chibiFingersGame from '../assets/images/Chibi Fingers Game.webp';
import chibiSpinningBottle from '../assets/images/Chibi Spinning Bottle.webp';
import chibiBombGame from '../assets/images/Chibi Bomb Game.webp';
import pickuPartyLogo from '../assets/images/PICKU_PARTY_LOGO_E01.webp';
import pickuPartyLogoArt from '../assets/images/PICKU_PARTY_LOGO_ART.webp';
import pickuPartyIcon from '../assets/images/PICKU_PARTY_APP_ICON.webp';
import btl001 from '../assets/images/Btl_E_001.webp';
import btl002 from '../assets/images/Btl_E_002.webp';
import btl003 from '../assets/images/Btl_E_003.webp';
import btl004 from '../assets/images/Btl_E_004.webp';
import quickModeBg from '../assets/images/Quick Mode Background.jpeg';
import classicModeBg from '../assets/images/Classic Mode Background.jpeg';
import extremeModeBg from '../assets/images/Extreme Mode Background.jpeg';
import chaosModeBg from '../assets/images/Chaos Mode Background.jpeg';
import ultimateModeBg from '../assets/images/Ultimate Mode Background.jpeg';
import bombGameBg from '../assets/images/Bomb Game Background.jpeg';
import kaboomBombImg from '../assets/images/Bomb Sprite.png';
import kaboomBallImg from '../assets/images/Ball Sprite.png';
import bonusMusicalNoteImg from '../assets/images/Music Note Sprite.png';
import bonusHeadsetImg from '../assets/images/Headsets Sprite.png';
import bonusCuteStarImg from '../assets/images/Star Sprite.png';
import bonusCrystalRoseImg from '../assets/images/Crystal Rose Sprite.png';
import bonusDiamondKeyImg from '../assets/images/Key Sprite.png';
import chestSpriteImg from '../assets/images/Chest Sprite.png';
import { preloadTransparentImages } from './bottleAlphaCache';
import { AudioManager } from './audioManager';

// In-Memory Blob URL registry (original URL -> blob: URL)
const assetBlobMap = new Map<string, string>();
let isLoadedFlag = false;
let isFontsLoadedFlag = false;

export function getAssetUrl(originalUrl: string): string {
  if (!originalUrl) return '';
  return assetBlobMap.get(originalUrl) || originalUrl;
}

export function isAssetsLoaded(): boolean {
  return isLoadedFlag;
}

export function isFontsLoaded(): boolean {
  return isFontsLoadedFlag;
}

/**
 * Preloads all custom web fonts and Google Fonts via the FontFaceSet API.
 * Ensures font glyphs, metrics, and kerning pairs are compiled and cached in memory
 * prior to rendering, preventing FOUT (Flash of Unstyled Text) or layout shift.
 */
export async function preloadFonts(
  onProgress?: (progress: number, statusText: string) => void
): Promise<void> {
  if (isFontsLoadedFlag) {
    onProgress?.(100, 'Typography and font glyphs primed');
    return;
  }

  onProgress?.(30, 'Buffering and shaping Hobeaux & Google font families...');

  if (typeof document === 'undefined' || !('fonts' in document)) {
    isFontsLoadedFlag = true;
    onProgress?.(100, 'Font API unavailable, proceeding');
    return;
  }

  try {
    const fontPromises = [
      document.fonts.load('16px Hobeaux'),
      document.fonts.load('bold 16px Hobeaux'),
      document.fonts.load('700 16px "Lilita One"'),
      document.fonts.load('600 16px Fredoka'),
      document.fonts.load('700 16px Fredoka'),
      document.fonts.load('800 16px Fredoka'),
      document.fonts.load('500 16px Outfit'),
      document.fonts.load('600 16px Outfit'),
      document.fonts.load('700 16px Outfit'),
      document.fonts.load('700 16px Righteous'),
      document.fonts.ready,
    ];

    // Max 1500ms safety timeout to avoid blocking if network is slow
    await Promise.race([
      Promise.all(fontPromises),
      new Promise((res) => setTimeout(res, 1500)),
    ]);
  } catch (err) {
    console.warn('[AssetPreloader] Font preloading non-fatal fallback:', err);
  }

  isFontsLoadedFlag = true;
  onProgress?.(100, 'Typography glyphs rendered & primed in cache');
}

interface PreloadItem {
  name: string;
  url: string;
  type: 'video' | 'image';
  description: string;
}

const PRELOAD_QUEUE: PreloadItem[] = [
  {
    name: 'Party DJ Animation',
    url: neonPartyVideo,
    type: 'video',
    description: 'Buffering Chibi DJ Neon Party Video (1/4)...',
  },
  {
    name: 'Roulette Countdown Video',
    url: rouletteBgVideo,
    type: 'video',
    description: 'Buffering Finger Roulette Dynamic Animation (2/4)...',
  },
  {
    name: 'Neon DJ Disc Video',
    url: spectrumVideo,
    type: 'video',
    description: 'Buffering Neon DJ Disc Video (3/4)...',
  },
  {
    name: 'Splash Screen Video',
    url: splashBgVideo,
    type: 'video',
    description: 'Buffering Chibi Party Splash Video Animation (4/4)...',
  },
  {
    name: 'Picku Party Logo Art',
    url: pickuPartyLogoArt,
    type: 'image',
    description: 'Decoding Cyber Hologram Logo Art...',
  },
  {
    name: 'Roulette Background Image',
    url: rouletteBgImage,
    type: 'image',
    description: 'Decoding Ultra-HD Roulette Background...',
  },
  {
    name: 'Chibi Fingers Game',
    url: chibiFingersGame,
    type: 'image',
    description: 'Loading Finger Roulette Game Panel...',
  },
  {
    name: 'Chibi Spinning Bottle',
    url: chibiSpinningBottle,
    type: 'image',
    description: 'Loading Bottle Spin Game Panel...',
  },
  {
    name: 'Chibi Bomb Game',
    url: chibiBombGame,
    type: 'image',
    description: 'Loading Kaboom Game Panel...',
  },
  {
    name: 'Cyber Bomb Sprite',
    url: kaboomBombImg,
    type: 'image',
    description: 'Decoding 3D Cyber Bomb & Fireworks Spark Fuse...',
  },
  {
    name: 'Cyber Ball Sprite',
    url: kaboomBallImg,
    type: 'image',
    description: 'Decoding 3D Cyber Ball & Neon Horizontal Light Bands...',
  },
  {
    name: 'Picku Party Logo',
    url: pickuPartyLogo,
    type: 'image',
    description: 'Pre-rendering Specular Logo Art...',
  },
  {
    name: 'Picku Party App Icon',
    url: pickuPartyIcon,
    type: 'image',
    description: 'Buffering UI Badges & App Icons...',
  },
  {
    name: 'Neon Bottle Classic',
    url: btl001,
    type: 'image',
    description: 'Decoding Neon Bottle Sprites (1/4)...',
  },
  {
    name: 'Neon Bottle Cyber',
    url: btl002,
    type: 'image',
    description: 'Decoding Neon Bottle Sprites (2/4)...',
  },
  {
    name: 'Neon Bottle Laser',
    url: btl003,
    type: 'image',
    description: 'Decoding Neon Bottle Sprites (3/4)...',
  },
  {
    name: 'Neon Bottle Matrix',
    url: btl004,
    type: 'image',
    description: 'Decoding Neon Bottle Sprites (4/4)...',
  },
  {
    name: 'Quick Mode Background',
    url: quickModeBg,
    type: 'image',
    description: 'Buffering Quick Mode Card Art...',
  },
  {
    name: 'Classic Mode Background',
    url: classicModeBg,
    type: 'image',
    description: 'Buffering Classic Mode Card Art...',
  },
  {
    name: 'Extreme Mode Background',
    url: extremeModeBg,
    type: 'image',
    description: 'Buffering Extreme Mode Card Art...',
  },
  {
    name: 'Chaos Mode Background',
    url: chaosModeBg,
    type: 'image',
    description: 'Buffering Chaos Mode Card Art...',
  },
  {
    name: 'Ultimate Mode Background',
    url: ultimateModeBg,
    type: 'image',
    description: 'Buffering Ultimate Mode Card Art...',
  },
  {
    name: 'Bomb Game Background',
    url: bombGameBg,
    type: 'image',
    description: 'Buffering Bomb Game Background...',
  },
  {
    name: 'Bonus Musical Note',
    url: bonusMusicalNoteImg,
    type: 'image',
    description: 'Decoding Bonus Musical Note Sprite...',
  },
  {
    name: 'Bonus Headset',
    url: bonusHeadsetImg,
    type: 'image',
    description: 'Decoding Bonus DJ Headset Sprite...',
  },
  {
    name: 'Bonus Cute Star',
    url: bonusCuteStarImg,
    type: 'image',
    description: 'Decoding Bonus Cute Star Sprite...',
  },
  {
    name: 'Bonus Crystal Rose',
    url: bonusCrystalRoseImg,
    type: 'image',
    description: 'Decoding Bonus Crystal Rose Sprite...',
  },
  {
    name: 'Bonus Diamond Key',
    url: bonusDiamondKeyImg,
    type: 'image',
    description: 'Decoding Bonus Diamond Key Sprite...',
  },
  {
    name: 'Milestone Chest',
    url: chestSpriteImg,
    type: 'image',
    description: 'Decoding Golden Milestone Chest Sprite...',
  },
];

/**
 * Preload all video and image assets into browser Blob URLs.
 * Videos loaded as blob: URLs live in local memory; seeking, playbackRate changes,
 * and restarts will have 0ms network latency, zero buffering, and zero blank frames.
 */
export async function preloadAllAssets(
  onProgress?: (progress: number, statusText: string) => void
): Promise<void> {
  if (isLoadedFlag) {
    onProgress?.(100, 'Assets already buffered and ready!');
    return;
  }

  const total = PRELOAD_QUEUE.length;
  let completed = 0;

  onProgress?.(5, 'Initializing memory buffer & audio engine...');

  // Try to use CacheStorage if supported for persistent local caching
  let cache: Cache | null = null;
  try {
    if (typeof window !== 'undefined' && 'caches' in window) {
      cache = await caches.open('picku-party-asset-cache-v1');
    }
  } catch {
    // CacheStorage not allowed in some sandboxed iframes, fallback gracefully to fetch
    cache = null;
  }

  // Preload items sequentially or in small parallel batches to avoid main thread contention
  for (const item of PRELOAD_QUEUE) {
    try {
      let blob: Blob | null = null;

      if (cache) {
        try {
          const cachedResponse = await cache.match(item.url);
          if (cachedResponse) {
            blob = await cachedResponse.blob();
          }
        } catch {
          blob = null;
        }
      }

      if (!blob) {
        const response = await fetch(item.url);
        if (response.ok) {
          if (cache) {
            try {
              await cache.put(item.url, response.clone());
            } catch {
              // ignore cache put errors
            }
          }
          blob = await response.blob();
        }
      }

      if (blob) {
        // Create in-memory object URL for zero-buffering playback
        const blobUrl = URL.createObjectURL(blob);
        assetBlobMap.set(item.url, blobUrl);

        // If it's an image, decode it immediately into GPU memory
        if (item.type === 'image') {
          const img = new Image();
          img.src = blobUrl;
          if ('decode' in img) {
            await img.decode().catch(() => {});
          }
        }
      }
    } catch (err) {
      console.warn(`[Preloader] Fallback to original URL for ${item.name}:`, err);
    }

    completed++;
    const percent = Math.min(96, Math.round(5 + (completed / total) * 91));
    onProgress?.(percent, item.description);
  }

  // Preload and cache transparent bottle textures
  preloadTransparentImages([btl001, btl002, btl003, btl004]);
  preloadedGameModes.add('roulette');
  preloadedGameModes.add('bottle');
  preloadedGameModes.add('kaboom');

  // Preload synthesized and recorded audio buffers into memory
  try {
    await AudioManager.preloadSounds();
  } catch (err) {
    console.warn('[AssetPreloader] Audio buffer preload fallback:', err);
  }

  isLoadedFlag = true;
  onProgress?.(100, 'All media buffered! Initializing Party Suite...');
}

export type GameModeId = 'roulette' | 'bottle' | 'kaboom';

export interface GameAssetDefinition {
  name: string;
  url: string;
  type: 'video' | 'image';
  description: string;
}

export const GAME_ASSET_REGISTRY: Record<GameModeId, GameAssetDefinition[]> = {
  roulette: [
    {
      name: 'Roulette Background Image',
      url: rouletteBgImage,
      type: 'image',
      description: 'Decoding Ultra-HD Roulette Table Background...',
    },
    {
      name: 'Roulette Dynamic Animation Video',
      url: rouletteBgVideo,
      type: 'video',
      description: 'Buffering Finger Roulette Dynamic Neon Video...',
    },
  ],
  bottle: [
    {
      name: 'Neon DJ Visualizer Video',
      url: spectrumVideo,
      type: 'video',
      description: 'Buffering Neon DJ Disc Video...',
    },
    {
      name: 'Classic Bottle Skin',
      url: btl001,
      type: 'image',
      description: 'Caching Classic Neon Bottle Texture...',
    },
    {
      name: 'Cyber Bottle Skin',
      url: btl002,
      type: 'image',
      description: 'Caching Cyber Neon Bottle Texture...',
    },
    {
      name: 'Laser Bottle Skin',
      url: btl003,
      type: 'image',
      description: 'Caching Laser Neon Bottle Texture...',
    },
    {
      name: 'Matrix Bottle Skin',
      url: btl004,
      type: 'image',
      description: 'Caching Matrix Neon Bottle Texture...',
    },
  ],
  kaboom: [
    {
      name: 'Bomb Game Background',
      url: bombGameBg,
      type: 'image',
      description: 'Buffering Bomb Game High-Res Background...',
    },
    {
      name: 'Cyber Bomb Sprite',
      url: kaboomBombImg,
      type: 'image',
      description: 'Decoding 3D Cyber Bomb & Fireworks Spark Fuse...',
    },
    {
      name: 'Cyber Ball Sprite',
      url: kaboomBallImg,
      type: 'image',
      description: 'Decoding 3D Cyber Ball & Light Bands...',
    },
    {
      name: 'Bonus Musical Note',
      url: bonusMusicalNoteImg,
      type: 'image',
      description: 'Decoding Bonus Musical Note Sprite...',
    },
    {
      name: 'Bonus DJ Headset',
      url: bonusHeadsetImg,
      type: 'image',
      description: 'Decoding Bonus DJ Headset Sprite...',
    },
    {
      name: 'Bonus Cute Star',
      url: bonusCuteStarImg,
      type: 'image',
      description: 'Decoding Bonus Cute Star Sprite...',
    },
    {
      name: 'Bonus Crystal Rose',
      url: bonusCrystalRoseImg,
      type: 'image',
      description: 'Decoding Bonus Crystal Rose Sprite...',
    },
    {
      name: 'Bonus Diamond Key',
      url: bonusDiamondKeyImg,
      type: 'image',
      description: 'Decoding Bonus Diamond Key Sprite...',
    },
  ],
};

const preloadedGameModes = new Set<GameModeId>();

export function isGameAssetsPreloaded(game: GameModeId): boolean {
  return preloadedGameModes.has(game);
}

/**
 * Preload all required files for a specific game mode before entering the game.
 * Guarantees zero blank frames, zero buffering lag, and decoded textures in GPU/Audio cache.
 */
export async function preloadGameAssets(
  game: GameModeId,
  onProgress?: (progress: number, statusText: string) => void
): Promise<void> {
  const assets = GAME_ASSET_REGISTRY[game] || [];
  const total = assets.length + 1; // +1 for audio
  let completed = 0;

  onProgress?.(10, `Initializing ${game.toUpperCase()} stage files...`);

  // Eagerly preload sound engine in background
  AudioManager.preloadSounds().catch(() => {});

  // If bottle, preload transparent textures
  if (game === 'bottle') {
    preloadTransparentImages([btl001, btl002, btl003, btl004]);
  }

  // Open cache if available
  let cache: Cache | null = null;
  try {
    if (typeof window !== 'undefined' && 'caches' in window) {
      cache = await caches.open('picku-party-asset-cache-v1');
    }
  } catch {
    cache = null;
  }

  for (const item of assets) {
    try {
      let blobUrl = assetBlobMap.get(item.url);

      if (!blobUrl) {
        let blob: Blob | null = null;
        if (cache) {
          try {
            const cached = await cache.match(item.url);
            if (cached) blob = await cached.blob();
          } catch {
            blob = null;
          }
        }

        if (!blob) {
          const res = await fetch(item.url);
          if (res.ok) {
            if (cache) {
              try {
                await cache.put(item.url, res.clone());
              } catch {}
            }
            blob = await res.blob();
          }
        }

        if (blob) {
          blobUrl = URL.createObjectURL(blob);
          assetBlobMap.set(item.url, blobUrl);
        }
      }

      if (blobUrl && item.type === 'image') {
        const img = new Image();
        img.src = blobUrl;
        if ('decode' in img) {
          await img.decode().catch(() => {});
        }
      }
    } catch (err) {
      console.warn(`[AssetPreloader] Preloading ${item.name} fallback:`, err);
    }

    completed++;
    const pct = Math.min(94, Math.round(10 + (completed / total) * 84));
    onProgress?.(pct, item.description);
  }

  preloadedGameModes.add(game);
  onProgress?.(100, `${game.toUpperCase()} files primed and ready!`);
}

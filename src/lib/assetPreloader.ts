/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Core Named Video Imports
import neonPartyVideo from '../assets/videos/Chibi DJ Neon Party Animation.mp4';
import rouletteBgVideo from '../assets/videos/Finger Roulette Background Animation.mp4';
import spectrumVideo from '../assets/videos/Neon DJ Disc Background Animation.mp4';
import splashBgVideo from '../assets/videos/Chibi Party Splash Screen Background Animation.mp4';

// Core Named Image Imports for Game Modes & Backgrounds
import bombGameBg from '../assets/images/Bomb Game Background.webp';
import rouletteGameBg from '../assets/images/Finger Roulette Background.webp';
import btl001 from '../assets/images/Btl_E_001.webp';
import btl002 from '../assets/images/Btl_E_002.webp';
import btl003 from '../assets/images/Btl_E_003.webp';
import btl004 from '../assets/images/Btl_E_004.webp';
import cyberBombSprite from '../assets/images/bombs/Bomb Sprite.webp';
import cyberBallSprite from '../assets/images/balls/Ball Sprite.webp';
import chibiBombPongImg from '../assets/images/Chibi Bomb Pong Game.webp';
import pongModeBg from '../assets/images/pong_mode_bg_1790404409295.jpg';
import pongCourtBg from '../assets/images/pong_court_bg_1790404428944.jpg';

import { preloadTransparentImages } from './bottleAlphaCache';
import { AudioManager } from './audioManager';

// Dynamic Vite Asset Globs - Automatically indexes all app media
const allImagesGlob = import.meta.glob<string>('../assets/images/**/*.{webp,png,jpg,jpeg,svg}', {
  eager: true,
  import: 'default',
});

const allVideosGlob = import.meta.glob<string>('../assets/videos/**/*.{mp4,webm}', {
  eager: true,
  import: 'default',
});

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

export interface PreloadItem {
  name: string;
  url: string;
  type: 'video' | 'image';
  description: string;
}

/**
 * Build dynamic list of all discovered assets categorized by priority.
 */
function buildPreloadQueue(): PreloadItem[] {
  const queue: PreloadItem[] = [];
  const seenUrls = new Set<string>();

  // 1. High Priority Video Animations
  const videoEntries: Array<{ name: string; url: string; desc: string }> = [
    { name: 'Party DJ Animation', url: neonPartyVideo, desc: 'Buffering Chibi DJ Neon Party Video (1/4)...' },
    { name: 'Roulette Countdown Video', url: rouletteBgVideo, desc: 'Buffering Finger Roulette Dynamic Animation (2/4)...' },
    { name: 'Neon DJ Disc Video', url: spectrumVideo, desc: 'Buffering Neon DJ Disc Video (3/4)...' },
    { name: 'Splash Screen Video', url: splashBgVideo, desc: 'Buffering Chibi Party Splash Video Animation (4/4)...' },
  ];

  for (const v of videoEntries) {
    if (v.url && !seenUrls.has(v.url)) {
      seenUrls.add(v.url);
      queue.push({
        name: v.name,
        url: v.url,
        type: 'video',
        description: v.desc,
      });
    }
  }

  // Add any extra video assets found in the glob
  for (const [path, url] of Object.entries(allVideosGlob)) {
    if (url && !seenUrls.has(url)) {
      seenUrls.add(url);
      const filename = path.split('/').pop()?.replace(/\.[^/.]+$/, '') || 'Video Asset';
      queue.push({
        name: filename,
        url,
        type: 'video',
        description: `Buffering ${filename}...`,
      });
    }
  }

  // 2. High Priority Game Mode Backgrounds & Hero Sprites
  const priorityImages: Array<{ name: string; url: string; desc: string }> = [
    { name: 'Bomb Game Background', url: bombGameBg, desc: 'Decoding Bomb Game Background...' },
    { name: 'Finger Roulette Background', url: rouletteGameBg, desc: 'Decoding Finger Roulette Background...' },
    { name: 'Pong Court Background', url: pongCourtBg, desc: 'Decoding Pong Court Arena Background...' },
    { name: 'Pong Mode Background', url: pongModeBg, desc: 'Decoding Pong Mode Selection Background...' },
    { name: 'Chibi Bomb Pong Game Banner', url: chibiBombPongImg, desc: 'Decoding Chibi Bomb Pong Game Banner...' },
    { name: 'Bottle Skin 001', url: btl001, desc: 'Decoding Bottle Skin 001...' },
    { name: 'Bottle Skin 002', url: btl002, desc: 'Decoding Bottle Skin 002...' },
    { name: 'Bottle Skin 003', url: btl003, desc: 'Decoding Bottle Skin 003...' },
    { name: 'Bottle Skin 004', url: btl004, desc: 'Decoding Bottle Skin 004...' },
    { name: 'Cyber Bomb Sprite', url: cyberBombSprite, desc: 'Decoding Cyber Bomb Sprite...' },
    { name: 'Cyber Ball Sprite', url: cyberBallSprite, desc: 'Decoding Cyber Ball Sprite...' },
  ];

  for (const img of priorityImages) {
    if (img.url && !seenUrls.has(img.url)) {
      seenUrls.add(img.url);
      queue.push({
        name: img.name,
        url: img.url,
        type: 'image',
        description: img.desc,
      });
    }
  }

  // 3. All other images from glob (skins, balls, bombs, trophies, particles, badges)
  for (const [path, url] of Object.entries(allImagesGlob)) {
    if (url && !seenUrls.has(url)) {
      seenUrls.add(url);
      const filename = path.split('/').pop()?.replace(/\.[^/.]+$/, '') || 'Image Asset';
      queue.push({
        name: filename,
        url,
        type: 'image',
        description: `Decoding ${filename}...`,
      });
    }
  }

  return queue;
}

/**
 * Helper to fetch and cache an individual asset with browser Cache API and HTMLImage decoding.
 */
async function preloadSingleAsset(
  item: PreloadItem,
  cache: Cache | null
): Promise<void> {
  try {
    let blobUrl = assetBlobMap.get(item.url);

    if (!blobUrl) {
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
            } catch {}
          }
          blob = await response.blob();
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
    console.warn(`[AssetPreloader] Fallback to original URL for ${item.name}:`, err);
  }
}

/**
 * Preload all video and image assets with concurrency control and progress reporting.
 */
export async function preloadAllAssets(
  onProgress?: (progress: number, statusText: string) => void
): Promise<void> {
  if (isLoadedFlag) {
    onProgress?.(100, 'Assets already buffered and ready!');
    return;
  }

  const queue = buildPreloadQueue();
  const total = queue.length;
  let completed = 0;

  onProgress?.(5, 'Initializing memory buffer & audio engine...');

  let cache: Cache | null = null;
  try {
    if (typeof window !== 'undefined' && 'caches' in window) {
      cache = await caches.open('picku-party-asset-cache-v1');
    }
  } catch {
    cache = null;
  }

  // Preload in batches of 6 concurrent requests to ensure zero network starvation
  const CONCURRENCY_LIMIT = 6;
  const queueCopy = [...queue];

  const workers = Array.from({ length: CONCURRENCY_LIMIT }, async () => {
    while (queueCopy.length > 0) {
      const item = queueCopy.shift();
      if (!item) break;

      await preloadSingleAsset(item, cache);
      completed++;

      const percent = Math.min(96, Math.round(5 + (completed / total) * 91));
      onProgress?.(percent, item.description);
    }
  });

  await Promise.all(workers);

  // Preload transparent bottle alpha masks and audio clips
  preloadTransparentImages([btl001, btl002, btl003, btl004]);
  preloadedGameModes.add('roulette');
  preloadedGameModes.add('bottle');
  preloadedGameModes.add('kaboom');
  preloadedGameModes.add('pong');

  try {
    await AudioManager.preloadSounds();
  } catch (err) {
    console.warn('[AssetPreloader] Audio buffer preload fallback:', err);
  }

  isLoadedFlag = true;
  onProgress?.(100, 'All media buffered! Initializing Party Suite...');
}

export type GameModeId = 'roulette' | 'bottle' | 'kaboom' | 'pong';

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
      url: rouletteGameBg,
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
      description: 'Buffering Bomb Game Background...',
    },
    {
      name: 'Cyber Bomb Sprite',
      url: cyberBombSprite,
      type: 'image',
      description: 'Decoding Cyber Bomb & Fireworks Spark Fuse...',
    },
    {
      name: 'Cyber Ball Sprite',
      url: cyberBallSprite,
      type: 'image',
      description: 'Decoding Cyber Ball & Neon Horizontal Light Bands...',
    },
  ],
  pong: [
    {
      name: 'Chibi Bomb Pong Game Banner',
      url: chibiBombPongImg,
      type: 'image',
      description: 'Buffering Bomb Pong Chibi Artwork...',
    },
    {
      name: 'Cyber Bomb Sprite',
      url: cyberBombSprite,
      type: 'image',
      description: 'Buffering Bomb Pong Ball & Fuse Sparks...',
    },
    {
      name: 'Pong Bomb Mode Selection Background',
      url: pongModeBg,
      type: 'image',
      description: 'Decoding Cyber Pong Mode Arena...',
    },
    {
      name: 'Pong Bomb Gameplay Court Background',
      url: pongCourtBg,
      type: 'image',
      description: 'Decoding Cyber Pong Court Floor...',
    },
  ],
};

const preloadedGameModes = new Set<GameModeId>();

export function isGameAssetsPreloaded(game: GameModeId): boolean {
  return preloadedGameModes.has(game);
}

export async function preloadGameAssets(
  game: GameModeId,
  onProgress?: (progress: number, statusText: string) => void
): Promise<void> {
  const assets = GAME_ASSET_REGISTRY[game] || [];
  const total = assets.length + 1;
  let completed = 0;

  onProgress?.(10, `Initializing ${game.toUpperCase()} stage files...`);

  AudioManager.preloadSounds().catch(() => {});

  if (game === 'bottle') {
    preloadTransparentImages([btl001, btl002, btl003, btl004]);
  }

  let cache: Cache | null = null;
  try {
    if (typeof window !== 'undefined' && 'caches' in window) {
      cache = await caches.open('picku-party-asset-cache-v1');
    }
  } catch {
    cache = null;
  }

  for (const item of assets) {
    await preloadSingleAsset(item, cache);
    completed++;
    const pct = Math.min(94, Math.round(10 + (completed / total) * 84));
    onProgress?.(pct, item.description);
  }

  preloadedGameModes.add(game);
  onProgress?.(100, `${game.toUpperCase()} files primed and ready!`);
}

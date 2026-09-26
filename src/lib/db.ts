/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppSettings, AppStats, CustomBottleSprite, KaboomStats } from '../types';
import { recordDailyQuestProgress } from './economy';
import { addEventExperience } from './events';

const DB_NAME = 'NeonPartyHubDB_v1';
const DB_VERSION = 1;

const DEFAULT_SETTINGS: AppSettings = {
  minPlayers: 2,
  targetCount: 1,
  countdownSeconds: 5,
  bottleStyle: 'btl_e_001',
  selectedCustomSpriteId: null,
  bottleBlendMode: 'color-dodge',
  bottleFriction: 0.992,
  theme: 'cyber-neon',
  sfxEnabled: true,
  sfxVolume: 0.8,
  musicEnabled: true,
  musicVolume: 0.7,
  soundEnabled: true,
  soundVolume: 0.8,
  hapticsEnabled: true,
};

function normalizeSettings(data: Partial<AppSettings>): AppSettings {
  const merged: AppSettings = { ...DEFAULT_SETTINGS, ...data };
  // Backwards compatibility migration
  if (data.sfxEnabled === undefined && data.soundEnabled !== undefined) {
    merged.sfxEnabled = data.soundEnabled;
  }
  if (data.sfxVolume === undefined && data.soundVolume !== undefined) {
    merged.sfxVolume = data.soundVolume;
  }
  merged.soundEnabled = merged.sfxEnabled;
  merged.soundVolume = merged.sfxVolume;

  if (merged.musicEnabled === undefined) {
    merged.musicEnabled = true;
  }
  if (typeof merged.musicVolume !== 'number' || isNaN(merged.musicVolume)) {
    merged.musicVolume = 0.7;
  }

  const validStyles = ['btl_e_001', 'btl_e_002', 'btl_e_003', 'btl_e_004', 'custom'];
  if (!validStyles.includes(merged.bottleStyle as string)) {
    merged.bottleStyle = 'btl_e_001';
  }
  if (!merged.bottleBlendMode || !['normal', 'screen', 'color-dodge'].includes(merged.bottleBlendMode)) {
    merged.bottleBlendMode = 'color-dodge';
  }
  if ((merged.theme as string) === 'emerald-matrix') {
    merged.theme = 'cyber-neon';
  }
  if (!merged.bottleFriction || merged.bottleFriction < 0.990) {
    merged.bottleFriction = 0.992;
  }
  if (![5, 8, 10].includes(merged.countdownSeconds)) {
    merged.countdownSeconds = 5;
  }
  return merged;
}

export const DEFAULT_KABOOM_STATS: KaboomStats = {
  victories: 0,
  bonusCollected: 0,
  bombHits: 0,
  totalRounds: 0,
  winrate: 0,
};

export const DEFAULT_PONG_STATS: {
  victories: number;
  totalRounds: number;
  highestRally: number;
  totalBounces: number;
  winrate: number;
} = {
  victories: 0,
  totalRounds: 0,
  highestRally: 0,
  totalBounces: 0,
  winrate: 0,
};

export const DEFAULT_STATS: AppStats = {
  totalRouletteRounds: 0,
  totalBottleSpins: 0,
  totalKaboomRounds: 0,
  totalPongRounds: 0,
  pongVictories: 0,
  pongHighestRally: 0,
  lastPlayedAt: Date.now(),
  kaboom: DEFAULT_KABOOM_STATS,
  pong: DEFAULT_PONG_STATS,
};

function normalizeStats(raw: Partial<AppStats> | null | undefined): AppStats {
  if (!raw) return { ...DEFAULT_STATS, kaboom: { ...DEFAULT_KABOOM_STATS }, pong: { ...DEFAULT_PONG_STATS } };
  
  const rawKaboom = raw.kaboom || ({} as Partial<KaboomStats>);
  const totalRounds = typeof rawKaboom.totalRounds === 'number'
    ? rawKaboom.totalRounds
    : (raw.totalKaboomRounds || 0);
  const victories = rawKaboom.victories || 0;
  const winrate = totalRounds > 0
    ? Math.round((victories / totalRounds) * 1000) / 10
    : 0;

  const kaboom: KaboomStats = {
    victories,
    bonusCollected: rawKaboom.bonusCollected || 0,
    bombHits: rawKaboom.bombHits || 0,
    totalRounds,
    winrate,
  };

  const rawPong = (raw.pong || {}) as Partial<{
    victories: number;
    totalRounds: number;
    highestRally: number;
    totalBounces: number;
    winrate: number;
  }>;
  const pongTotalRounds = typeof rawPong.totalRounds === 'number'
    ? rawPong.totalRounds
    : (raw.totalPongRounds || 0);
  const pongVictories = typeof rawPong.victories === 'number'
    ? rawPong.victories
    : (raw.pongVictories || 0);
  const pongHighestRally = typeof rawPong.highestRally === 'number'
    ? rawPong.highestRally
    : (raw.pongHighestRally || 0);
  const pongTotalBounces = rawPong.totalBounces || 0;
  const pongWinrate = pongTotalRounds > 0
    ? Math.round((pongVictories / pongTotalRounds) * 1000) / 10
    : 0;

  const pong = {
    victories: pongVictories,
    totalRounds: pongTotalRounds,
    highestRally: pongHighestRally,
    totalBounces: pongTotalBounces,
    winrate: pongWinrate,
  };

  return {
    totalRouletteRounds: raw.totalRouletteRounds || 0,
    totalBottleSpins: raw.totalBottleSpins || 0,
    totalKaboomRounds: totalRounds,
    totalPongRounds: pongTotalRounds,
    pongVictories,
    pongHighestRally,
    lastPlayedAt: raw.lastPlayedAt || Date.now(),
    kaboom,
    pong,
  };
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings');
      }
      if (!db.objectStoreNames.contains('custom_sprites')) {
        db.createObjectStore('custom_sprites', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('stats')) {
        db.createObjectStore('stats');
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getSettings(): Promise<AppSettings> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('settings', 'readonly');
      const store = tx.objectStore('settings');
      const req = store.get('app_settings');
      req.onsuccess = () => {
        if (req.result) {
          resolve(normalizeSettings(req.result));
        } else {
          // Fallback check localStorage
          const local = localStorage.getItem('neon_party_settings');
          if (local) {
            try {
              const parsed = JSON.parse(local);
              resolve(normalizeSettings(parsed));
              return;
            } catch (e) {}
          }
          resolve(DEFAULT_SETTINGS);
        }
      };
      req.onerror = () => resolve(DEFAULT_SETTINGS);
    });
  } catch (err) {
    try {
      const local = localStorage.getItem('neon_party_settings');
      if (local) return normalizeSettings(JSON.parse(local));
    } catch (e) {}
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    localStorage.setItem('neon_party_settings', JSON.stringify(settings));
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('settings', 'readwrite');
      const store = tx.objectStore('settings');
      const req = store.put(settings, 'app_settings');
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    // Stored in localStorage as fallback
  }
}

export async function getStats(): Promise<AppStats> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('stats', 'readonly');
      const store = tx.objectStore('stats');
      const req = store.get('app_stats');
      req.onsuccess = () => {
        if (req.result) {
          resolve(normalizeStats(req.result));
        } else {
          const local = localStorage.getItem('neon_party_stats');
          if (local) {
            try {
              resolve(normalizeStats(JSON.parse(local)));
              return;
            } catch (e) {}
          }
          resolve(DEFAULT_STATS);
        }
      };
      req.onerror = () => resolve(DEFAULT_STATS);
    });
  } catch (err) {
    try {
      const local = localStorage.getItem('neon_party_stats');
      if (local) return normalizeStats(JSON.parse(local));
    } catch (e) {}
    return DEFAULT_STATS;
  }
}

export async function saveStats(stats: AppStats): Promise<void> {
  try {
    const normalized = normalizeStats(stats);
    localStorage.setItem('neon_party_stats', JSON.stringify(normalized));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('picku_stats_updated', { detail: normalized }));
    }
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('stats', 'readwrite');
      const store = tx.objectStore('stats');
      const req = store.put(normalized, 'app_stats');
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {}
}

export async function resetAllStats(): Promise<AppStats> {
  const cleared: AppStats = {
    totalRouletteRounds: 0,
    totalBottleSpins: 0,
    totalKaboomRounds: 0,
    lastPlayedAt: Date.now(),
    kaboom: {
      victories: 0,
      bonusCollected: 0,
      bombHits: 0,
      totalRounds: 0,
      winrate: 0,
    },
  };
  await saveStats(cleared);
  return cleared;
}

export async function recordGameEvent(type: 'roulette' | 'bottle'): Promise<AppStats> {
  const current = await getStats();
  if (type === 'roulette') {
    current.totalRouletteRounds += 1;
    recordDailyQuestProgress('roulette_round', 1);
    addEventExperience(35, 'roulette');
  } else if (type === 'bottle') {
    current.totalBottleSpins += 1;
    recordDailyQuestProgress('bottle_spin', 1);
    addEventExperience(25, 'bottle');
  }
  current.lastPlayedAt = Date.now();
  await saveStats(current);
  return current;
}

export async function recordPongEvent(event: {
  winner: 1 | 2;
  rallies?: number;
  isVictory?: boolean;
}): Promise<AppStats> {
  const current = await getStats();
  if (!current.pong) {
    current.pong = { ...DEFAULT_PONG_STATS };
  }
  const totalPongRounds = (current.totalPongRounds || 0) + 1;
  current.totalPongRounds = totalPongRounds;
  current.pong.totalRounds = totalPongRounds;

  const isVictory = event.winner === 1 || Boolean(event.isVictory);
  if (isVictory) {
    current.pongVictories = (current.pongVictories || 0) + 1;
    current.pong.victories = (current.pong.victories || 0) + 1;
    recordDailyQuestProgress('roulette_round', 1);
    addEventExperience(50, 'pong_victory');
  } else {
    recordDailyQuestProgress('roulette_round', 1);
    addEventExperience(30, 'pong_match');
  }

  const rallies = event.rallies || 0;
  if (rallies > (current.pongHighestRally || 0)) {
    current.pongHighestRally = rallies;
    current.pong.highestRally = rallies;
  }
  current.pong.totalBounces = (current.pong.totalBounces || 0) + rallies;

  if (current.pong.totalRounds > 0) {
    current.pong.winrate =
      Math.round((current.pong.victories / current.pong.totalRounds) * 1000) / 10;
  }

  current.lastPlayedAt = Date.now();
  await saveStats(current);
  return current;
}

export async function recordKaboomEvent(event: {
  type: 'victory' | 'bomb_hit' | 'bonus';
}): Promise<AppStats> {
  const current = await getStats();
  if (!current.kaboom) {
    current.kaboom = { ...DEFAULT_KABOOM_STATS };
  }

  if (event.type === 'bonus') {
    current.kaboom.bonusCollected += 1;
    recordDailyQuestProgress('kaboom_tile', 1);
    addEventExperience(15, 'kaboom_bonus');
  } else if (event.type === 'victory') {
    // End a round without tapping the bomb
    current.totalKaboomRounds += 1;
    current.kaboom.totalRounds += 1;
    current.kaboom.victories += 1;
    recordDailyQuestProgress('kaboom_victory', 1);
    addEventExperience(50, 'kaboom_victory');
  } else if (event.type === 'bomb_hit') {
    current.totalKaboomRounds += 1;
    current.kaboom.totalRounds += 1;
    current.kaboom.bombHits += 1;
  }

  // Recalculate winrate: victories / totalRounds * 100
  if (current.kaboom.totalRounds > 0) {
    current.kaboom.winrate =
      Math.round((current.kaboom.victories / current.kaboom.totalRounds) * 1000) / 10;
  } else {
    current.kaboom.winrate = 0;
  }

  current.lastPlayedAt = Date.now();
  await saveStats(current);
  return current;
}

export async function getAllCustomSprites(): Promise<CustomBottleSprite[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('custom_sprites', 'readonly');
      const store = tx.objectStore('custom_sprites');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch (err) {
    return [];
  }
}

export async function saveCustomSprite(sprite: CustomBottleSprite): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('custom_sprites', 'readwrite');
      const store = tx.objectStore('custom_sprites');
      const req = store.put(sprite);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {}
}

export async function deleteCustomSprite(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('custom_sprites', 'readwrite');
      const store = tx.objectStore('custom_sprites');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {}
}

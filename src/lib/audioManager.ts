/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Haptics } from './haptics';

export { Haptics };

/**
 * Sound Asset Manifest:
 * The single source of truth for all high-bitrate studio PCM audio assets.
 * Used for automated preloading, cache validation, and orphaned asset pruning.
 */
export const SOUND_MANIFEST = [
  { id: 'button_click', file: 'button_click.wav', category: 'ui', approxKb: 11.5 },
  { id: 'touch_up', file: 'touch_up.wav', category: 'touch', approxKb: 14.2 },
  { id: 'countdown_tick', file: 'countdown_tick.wav', category: 'countdown', approxKb: 24.7 },
  { id: 'countdown_tick_urgent', file: 'countdown_tick_urgent.wav', category: 'countdown', approxKb: 24.7 },
  { id: 'target_impact', file: 'target_impact.wav', category: 'roulette', approxKb: 167.6 },
  { id: 'team_division', file: 'team_division.wav', category: 'teams', approxKb: 158.8 },
  { id: 'bottle_flick', file: 'bottle_flick.wav', category: 'bottle', approxKb: 67.1 },
  { id: 'bottle_settle', file: 'bottle_settle.wav', category: 'bottle', approxKb: 150.0 },
  { id: 'touch_down_0', file: 'touch_down_0.wav', category: 'touch', approxKb: 84.7 },
  { id: 'touch_down_1', file: 'touch_down_1.wav', category: 'touch', approxKb: 84.7 },
  { id: 'touch_down_2', file: 'touch_down_2.wav', category: 'touch', approxKb: 84.7 },
  { id: 'touch_down_3', file: 'touch_down_3.wav', category: 'touch', approxKb: 84.7 },
  { id: 'touch_down_4', file: 'touch_down_4.wav', category: 'touch', approxKb: 84.7 },
  { id: 'touch_down_5', file: 'touch_down_5.wav', category: 'touch', approxKb: 84.7 },
  { id: 'touch_down_6', file: 'touch_down_6.wav', category: 'touch', approxKb: 84.7 },
  { id: 'touch_down_7', file: 'touch_down_7.wav', category: 'touch', approxKb: 84.7 },
  { id: 'bottle_tick_0', file: 'bottle_tick_0.wav', category: 'bottle', approxKb: 6.7 },
  { id: 'bottle_tick_1', file: 'bottle_tick_1.wav', category: 'bottle', approxKb: 6.7 },
  { id: 'bottle_tick_2', file: 'bottle_tick_2.wav', category: 'bottle', approxKb: 6.7 },
  { id: 'bottle_tick_3', file: 'bottle_tick_3.wav', category: 'bottle', approxKb: 6.7 },
] as const;

export type SoundFileName = (typeof SOUND_MANIFEST)[number]['file'];
export type SoundId = (typeof SOUND_MANIFEST)[number]['id'];

const VALID_SOUND_FILES = new Set<string>(SOUND_MANIFEST.map((s) => s.file));

// Pentatonic scale (C Major: C4 to C6) used for musical harmonic touch feedback
const PENTATONIC_SCALE = [
  261.63, // C4
  293.66, // D4
  329.63, // E4
  392.0,  // G4
  440.0,  // A4
  523.25, // C5
  587.33, // D5
  659.25, // E5
  783.99, // G5
  880.0,  // A5
  1046.5, // C6
];

export interface PlaySampleOptions {
  volume?: number;
  playbackRate?: number;
  detuneCents?: number;
}

export interface AudioCacheReport {
  cachedCount: number;
  totalAssets: number;
  totalEstimatedKb: number;
  isFullyPrecached: boolean;
  orphansPruned: number;
}

let audioCtx: AudioContext | null = null;
let masterGainNode: GainNode | null = null;

/**
 * Retrieve or initialize the shared Web Audio Context with auto-resume support
 */
export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
      try {
        masterGainNode = audioCtx.createGain();
        masterGainNode.connect(audioCtx.destination);
      } catch (e) {
        // Fallback without master node if security blocks destination
      }
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function triggerHaptic(pattern: number | number[], enabled: boolean = true) {
  if (!enabled) return;
  Haptics.vibrate(pattern);
}

// Global one-time audio context unlocker on first user interaction
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    // Kickstart background preloading of high-bitrate assets immediately
    AudioManager.preloadSounds();
    window.removeEventListener('pointerdown', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
    window.removeEventListener('click', unlockAudio);
  };
  window.addEventListener('pointerdown', unlockAudio, { passive: true });
  window.addEventListener('touchstart', unlockAudio, { passive: true });
  window.addEventListener('click', unlockAudio, { passive: true });

  // Early idle precache kickstart
  setTimeout(() => {
    AudioManager.preloadSounds();
  }, 150);
}

/**
 * Unified Audio Manager
 * Central hub for sound loading, asset validation, caching, and game triggers.
 */
export class AudioManager {
  private static masterVolume: number = 0.8;
  private static soundEnabled: boolean = true;
  private static hapticsEnabled: boolean = true;

  // Cache for pre-decoded 44.1kHz studio PCM AudioBuffers
  private static audioBufferCache: Map<string, AudioBuffer> = new Map();
  private static pendingLoads: Map<string, Promise<AudioBuffer | null>> = new Map();
  private static isPreloaded: boolean = false;
  private static tickVariantCounter: number = 0;

  /**
   * Update audio & haptics configuration from user settings
   */
  public static updateConfig(soundEnabled: boolean, volume: number, hapticsEnabled: boolean) {
    this.soundEnabled = soundEnabled;
    this.masterVolume = Math.max(0, Math.min(1, volume));
    this.hapticsEnabled = hapticsEnabled;
    Haptics.setEnabled(hapticsEnabled);

    if (masterGainNode && audioCtx) {
      try {
        masterGainNode.gain.setValueAtTime(this.masterVolume, audioCtx.currentTime);
      } catch (e) {}
    }
  }

  public static getSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public static getVolume(): number {
    return this.masterVolume;
  }

  /**
   * Preload all high-bitrate studio audio files into decoded AudioBuffers
   * Ensures zero latency on first playback across all devices.
   */
  public static async preloadSounds(): Promise<void> {
    if (this.isPreloaded || typeof window === 'undefined') return;
    this.isPreloaded = true;

    // Prune any unexpected memory buffers first
    this.cleanOrphanedCache();

    const loadPromises = SOUND_MANIFEST.map((item) =>
      this.loadAudioBuffer(item.file).catch(() => null)
    );

    await Promise.allSettled(loadPromises);
  }

  /**
   * Loads and decodes an audio file with base URL resolution and deduplication
   */
  private static async loadAudioBuffer(fileName: string): Promise<AudioBuffer | null> {
    // Only load files present in the valid sound manifest
    if (!VALID_SOUND_FILES.has(fileName)) {
      console.warn(`[AudioManager] Attempted to load unregistered sound file: ${fileName}`);
      return null;
    }

    if (this.audioBufferCache.has(fileName)) {
      return this.audioBufferCache.get(fileName)!;
    }

    if (this.pendingLoads.has(fileName)) {
      return this.pendingLoads.get(fileName)!;
    }

    const loadPromise = (async () => {
      try {
        const ctx = getAudioContext();
        if (!ctx) return null;

        // Standardize Base URL for GitHub Pages subpaths and root deployments
        const baseUrl = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');
        const soundUrl = `${baseUrl}/sounds/${fileName}`;

        const response = await fetch(soundUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${soundUrl} (status: ${response.status})`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const decoded = await ctx.decodeAudioData(arrayBuffer);
        this.audioBufferCache.set(fileName, decoded);
        return decoded;
      } catch (err) {
        console.warn(`[AudioManager] Audio asset fallback engaged for ${fileName}:`, err);
        return null;
      } finally {
        this.pendingLoads.delete(fileName);
      }
    })();

    this.pendingLoads.set(fileName, loadPromise);
    return loadPromise;
  }

  /**
   * Cleans up any orphaned AudioBuffer entries in memory that do not belong to SOUND_MANIFEST.
   * Keeps audio memory strictly constrained to the registered ~1.3MB footprint.
   */
  public static cleanOrphanedCache(): number {
    let pruned = 0;
    for (const key of Array.from(this.audioBufferCache.keys())) {
      if (!VALID_SOUND_FILES.has(key)) {
        this.audioBufferCache.delete(key);
        pruned++;
      }
    }
    for (const key of Array.from(this.pendingLoads.keys())) {
      if (!VALID_SOUND_FILES.has(key)) {
        this.pendingLoads.delete(key);
        pruned++;
      }
    }
    return pruned;
  }

  /**
   * Returns health report of the audio cache and memory footprint
   */
  public static getCacheReport(): AudioCacheReport {
    let totalEstimatedKb = 0;
    for (const item of SOUND_MANIFEST) {
      if (this.audioBufferCache.has(item.file)) {
        totalEstimatedKb += item.approxKb;
      }
    }
    return {
      cachedCount: this.audioBufferCache.size,
      totalAssets: SOUND_MANIFEST.length,
      totalEstimatedKb: Math.round(totalEstimatedKb),
      isFullyPrecached: this.audioBufferCache.size >= SOUND_MANIFEST.length,
      orphansPruned: this.cleanOrphanedCache(),
    };
  }

  /**
   * Plays a pre-decoded high-bitrate AudioBuffer with sub-millisecond latency
   */
  public static playSample(fileName: string, options: PlaySampleOptions = {}): boolean {
    if (!this.soundEnabled) return false;
    const ctx = getAudioContext();
    if (!ctx) return false;

    const buffer = this.audioBufferCache.get(fileName);
    if (!buffer) {
      // Dispatch background load for future playback and let fallback synth handle it now
      this.loadAudioBuffer(fileName);
      return false;
    }

    try {
      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const gain = ctx.createGain();
      const baseVol = options.volume !== undefined ? options.volume : 1.0;
      gain.gain.setValueAtTime(Math.max(0.001, baseVol * this.masterVolume), ctx.currentTime);

      if (options.playbackRate !== undefined) {
        source.playbackRate.setValueAtTime(options.playbackRate, ctx.currentTime);
      }

      if (options.detuneCents !== undefined && source.detune) {
        source.detune.setValueAtTime(options.detuneCents, ctx.currentTime);
      }

      source.connect(gain);
      if (masterGainNode) {
        gain.connect(masterGainNode);
      } else {
        gain.connect(ctx.destination);
      }

      source.start();
      return true;
    } catch (e) {
      return false;
    }
  }

  // =========================================================================
  // 1. Touch Placed: Juicy Laser-Bubble Pop + Neon Crystal Harmonic Chimes
  // =========================================================================
  public static playTouchDown(touchIndex: number = 0) {
    Haptics.touchDown();
    if (!this.soundEnabled) return;

    const fileIndex = Math.abs(touchIndex) % 8;
    const fileName = `touch_down_${fileIndex}.wav`;

    const played = this.playSample(fileName, {
      volume: 0.88,
    });

    if (!played) {
      // High-quality fallback synthesis: Juicy bubble pop + crystal bell
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const freq = PENTATONIC_SCALE[touchIndex % PENTATONIC_SCALE.length];

        // Layer 1: Juicy tactile pop attack transient
        const popOsc = ctx.createOscillator();
        const popGain = ctx.createGain();
        popOsc.type = 'sine';
        popOsc.frequency.setValueAtTime(freq * 2.4, now);
        popOsc.frequency.exponentialRampToValueAtTime(freq, now + 0.022);
        popGain.gain.setValueAtTime(0.28 * this.masterVolume, now);
        popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

        // Layer 2: Resonant glass chime body
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.24 * this.masterVolume, now + 0.003);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        // Layer 3: High shimmer crystal overtone
        const highOsc = ctx.createOscillator();
        const highGain = ctx.createGain();
        highOsc.type = 'triangle';
        highOsc.frequency.setValueAtTime(freq * 2.76, now);
        highGain.gain.setValueAtTime(0.09 * this.masterVolume, now);
        highGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        // Layer 4: Warm mobile sub thump
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(freq * 0.5, now);
        subGain.gain.setValueAtTime(0.15 * this.masterVolume, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        popOsc.connect(popGain);
        osc.connect(gain);
        highOsc.connect(highGain);
        subOsc.connect(subGain);

        popGain.connect(ctx.destination);
        gain.connect(ctx.destination);
        highGain.connect(ctx.destination);
        subGain.connect(ctx.destination);

        popOsc.start(now);
        osc.start(now);
        highOsc.start(now);
        subOsc.start(now);

        popOsc.stop(now + 0.045);
        osc.stop(now + 0.35);
        highOsc.stop(now + 0.12);
        subOsc.stop(now + 0.08);
      } catch (e) {}
    }
  }

  // =========================================================================
  // 2. Touch Released: Delicate uplifting glass micro-release
  // =========================================================================
  public static playTouchUp() {
    Haptics.touchUp();
    if (!this.soundEnabled) return;

    const played = this.playSample('touch_up.wav', { volume: 0.78 });
    if (!played) {
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(460, now);
        osc.frequency.exponentialRampToValueAtTime(760, now + 0.06);

        gain.gain.setValueAtTime(0.09 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.06);
      } catch (e) {}
    }
  }

  // =========================================================================
  // 3. Countdown Tick: High-bitrate sonar pulse with accelerating tension
  // =========================================================================
  public static playCountdownTick(remainingSeconds: number, totalSeconds: number) {
    Haptics.countdownTick(remainingSeconds, totalSeconds);
    if (!this.soundEnabled) return;

    const urgency = 1 - Math.max(0, remainingSeconds / (totalSeconds || 5));
    const isUrgent = remainingSeconds <= 1;
    const fileName = isUrgent ? 'countdown_tick_urgent.wav' : 'countdown_tick.wav';
    const rate = 0.95 + urgency * 0.35;

    const played = this.playSample(fileName, {
      volume: 0.9 + urgency * 0.2,
      playbackRate: rate,
    });

    if (!played) {
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const baseFreq = 400 + urgency * 450;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(baseFreq * 1.5, now);
        filter.Q.setValueAtTime(4 + urgency * 4, now);

        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, now + 0.1);

        gain.gain.setValueAtTime(0.35 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.12);
      } catch (e) {}
    }
  }

  // =========================================================================
  // 4. Target Impact: Thunderous 808 Sub Thump + Shockwave Crackle
  // =========================================================================
  public static playTargetImpact() {
    Haptics.targetSelected();
    if (!this.soundEnabled) return;

    const played = this.playSample('target_impact.wav', { volume: 1.0 });
    if (!played) {
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(140, now);
        subOsc.frequency.exponentialRampToValueAtTime(35, now + 0.6);

        subGain.gain.setValueAtTime(0.65 * this.masterVolume, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

        subOsc.connect(subGain);
        subGain.connect(ctx.destination);
        subOsc.start(now);
        subOsc.stop(now + 0.7);
      } catch (e) {}
    }
  }

  // =========================================================================
  // 5. Team Division Complete: Lush studio arpeggiated glass fanfare
  // =========================================================================
  public static playTeamDivisionChime() {
    Haptics.teamDivision();
    if (!this.soundEnabled) return;

    const played = this.playSample('team_division.wav', { volume: 0.95 });
    if (!played) {
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, index) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + index * 0.06);

          gain.gain.setValueAtTime(0.001, now + index * 0.06);
          gain.gain.linearRampToValueAtTime(0.22 * this.masterVolume, now + index * 0.06 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.06 + 0.45);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + index * 0.06);
          osc.stop(now + index * 0.06 + 0.5);
        });
      } catch (e) {}
    }
  }

  // =========================================================================
  // 6. Bottle Flick / Launch: Authentic air whoosh + glass sliding impulse
  // =========================================================================
  public static playBottleFlick(velocity: number) {
    Haptics.bottleFlick(velocity);
    if (!this.soundEnabled) return;

    const intensity = Math.min(1.4, Math.max(0.7, Math.abs(velocity) / 12));
    const rate = 0.85 + intensity * 0.35;

    const played = this.playSample('bottle_flick.wav', {
      volume: 0.9 * intensity,
      playbackRate: rate,
    });

    if (!played) {
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(500 * intensity, now + 0.18);

        gain.gain.setValueAtTime(0.25 * intensity * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      } catch (e) {}
    }
  }

  // =========================================================================
  // 7. Bottle Spin Ratchet / Bearing Tick: Authentic acoustic contact variations
  // =========================================================================
  public static playBottleTick(angularVelocity: number) {
    Haptics.bottleTick(angularVelocity);
    if (!this.soundEnabled) return;

    // Cycle through 4 natural acoustic contact variations
    const variant = this.tickVariantCounter % 4;
    this.tickVariantCounter++;

    const speedFactor = Math.min(1.5, Math.max(0.8, Math.abs(angularVelocity) / 8));
    const rate = 0.9 + speedFactor * 0.25;

    const played = this.playSample(`bottle_tick_${variant}.wav`, {
      volume: 0.85 * Math.min(1.2, speedFactor),
      playbackRate: rate,
    });

    if (!played) {
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600 + speedFactor * 400, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.025);

        gain.gain.setValueAtTime(0.06 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.025);
      } catch (e) {}
    }
  }

  // =========================================================================
  // 8. Bottle Settled: Resonant singing crystal glass ring-out
  // =========================================================================
  public static playBottleSettle() {
    Haptics.bottleSettled();
    if (!this.soundEnabled) return;

    const played = this.playSample('bottle_settle.wav', { volume: 0.95 });
    if (!played) {
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.35);

        gain.gain.setValueAtTime(0.3 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
      } catch (e) {}
    }
  }

  // =========================================================================
  // 9. UI Button Click: Ultra-crisp modern glass tap
  // =========================================================================
  public static playButtonClick() {
    Haptics.buttonClick();
    if (!this.soundEnabled) return;

    // Subtle micro-pitch variation (0.97 - 1.03) for natural tactile feel
    const randomRate = 0.97 + Math.random() * 0.06;

    const played = this.playSample('button_click.wav', {
      volume: 0.85,
      playbackRate: randomRate,
    });

    if (!played) {
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.04);

        gain.gain.setValueAtTime(0.12 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
      } catch (e) {}
    }
  }

  // =========================================================================
  // 10. Kaboom: Safe Ball Pop (Bubble burst + crystal glass chime)
  // =========================================================================
  public static playSafePop() {
    Haptics.safePop();
    if (!this.soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Frequency dive bubble pop
      const popOsc = ctx.createOscillator();
      const popGain = ctx.createGain();
      popOsc.type = 'sine';
      popOsc.frequency.setValueAtTime(640, now);
      popOsc.frequency.exponentialRampToValueAtTime(140, now + 0.04);
      popGain.gain.setValueAtTime(0.22 * this.masterVolume, now);
      popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
      popOsc.connect(popGain);
      popGain.connect(ctx.destination);
      popOsc.start(now);
      popOsc.stop(now + 0.05);

      // Uplifting harmonic crystal chime
      const chimeOsc = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      chimeOsc.type = 'triangle';
      chimeOsc.frequency.setValueAtTime(987.77, now + 0.02); // B5
      chimeOsc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.16); // E6
      chimeGain.gain.setValueAtTime(0.001, now + 0.02);
      chimeGain.gain.linearRampToValueAtTime(0.18 * this.masterVolume, now + 0.04);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      chimeOsc.connect(chimeGain);
      chimeGain.connect(ctx.destination);
      chimeOsc.start(now + 0.02);
      chimeOsc.stop(now + 0.35);
    } catch (e) {}
  }

  // =========================================================================
  // 11. Kaboom: Command Bonus Fanfare (High-energy celebratory brass arpeggio)
  // =========================================================================
  public static playBonusFanfare() {
    Haptics.bonusClaim();
    if (!this.soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Ascending triumphant arpeggio: C5 -> E5 -> G5 -> C6 -> E6
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.065);
        gain.gain.setValueAtTime(0.001, now + idx * 0.065);
        gain.gain.linearRampToValueAtTime(0.24 * this.masterVolume, now + idx * 0.065 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.065 + 0.42);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.065);
        osc.stop(now + idx * 0.065 + 0.45);
      });
    } catch (e) {}
  }

  // =========================================================================
  // 11b. Star Currency HUD Beep / Pickup Chime (High-register bright arcade ping)
  // =========================================================================
  public static playHudCoinBeep() {
    triggerHaptic([12, 25, 18]);
    if (!this.soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // High-register sparkling arcade coin bell: E6 (1318.5Hz) -> B6 (1975.5Hz)
      const pings = [
        { freq: 1318.5, delay: 0.0, dur: 0.22, vol: 0.28 },
        { freq: 1975.5, delay: 0.07, dur: 0.32, vol: 0.35 },
      ];
      pings.forEach(({ freq, delay, dur, vol }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + delay);
        gain.gain.setValueAtTime(0.001, now + delay);
        gain.gain.linearRampToValueAtTime(vol * this.masterVolume, now + delay + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + dur + 0.02);
      });
    } catch (e) {}
  }

  // =========================================================================
  // 12. Kaboom: Bomb Explosion (Sub-bass detonation rumble + noise blast)
  // =========================================================================
  public static playBombExplosion() {
    Haptics.bombExplosion();
    if (!this.soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // 1. Heavy sub-bass earthquake drop
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(160, now);
      subOsc.frequency.exponentialRampToValueAtTime(26, now + 0.9);
      subGain.gain.setValueAtTime(0.9 * this.masterVolume, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      subOsc.connect(subGain);
      subGain.connect(ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 1.25);

      // 2. Filtered noise explosion blast
      const bufferSize = Math.floor(ctx.sampleRate * 0.9);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(850, now);
      filter.frequency.exponentialRampToValueAtTime(70, now + 0.85);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.75 * this.masterVolume, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      noiseSource.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noiseSource.start(now);
      noiseSource.stop(now + 0.9);
    } catch (e) {}
  }
}

/**
 * Backward compatibility alias: SoundEngine = AudioManager
 */
export const SoundEngine = AudioManager;

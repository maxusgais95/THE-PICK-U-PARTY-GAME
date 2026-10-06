/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Haptics } from './haptics';
import { BgmManager, BgmTrackKey } from './bgmManager';

export { Haptics, BgmManager };
export type { BgmTrackKey };

/**
 * Sound Asset Manifest:
 * The single source of truth for all studio PCM audio assets.
 * Mastered with earphone acoustic modeling, warm low-end, and silky high-frequency limits.
 */
export const SOUND_MANIFEST = [
  { id: 'button_click', file: 'button_click.wav', category: 'ui', approxKb: 9.6 },
  { id: 'touch_up', file: 'touch_up.wav', category: 'touch', approxKb: 9.6 },
  { id: 'countdown_tick', file: 'countdown_tick.wav', category: 'countdown', approxKb: 19.0 },
  { id: 'countdown_tick_urgent', file: 'countdown_tick_urgent.wav', category: 'countdown', approxKb: 19.0 },
  { id: 'target_impact', file: 'target_impact.wav', category: 'roulette', approxKb: 146.5 },
  { id: 'team_division', file: 'team_division.wav', category: 'teams', approxKb: 141.3 },
  { id: 'bottle_flick', file: 'bottle_flick.wav', category: 'bottle', approxKb: 55.2 },
  { id: 'bottle_settle', file: 'bottle_settle.wav', category: 'bottle', approxKb: 129.2 },
  { id: 'bomb_explosion', file: 'bomb_explosion.wav', category: 'kaboom', approxKb: 163.7 },
  { id: 'safe_pop', file: 'safe_pop.wav', category: 'kaboom', approxKb: 48.3 },
  { id: 'bonus_fanfare', file: 'bonus_fanfare.wav', category: 'kaboom', approxKb: 112.0 },
  { id: 'hud_coin', file: 'hud_coin.wav', category: 'economy', approxKb: 41.4 },
  { id: 'paddle_hit', file: 'paddle_hit.wav', category: 'pong', approxKb: 14.7 },
  { id: 'wall_ping', file: 'wall_ping.wav', category: 'pong', approxKb: 11.2 },
  { id: 'touch_down_0', file: 'touch_down_0.wav', category: 'touch', approxKb: 72.4 },
  { id: 'touch_down_1', file: 'touch_down_1.wav', category: 'touch', approxKb: 72.4 },
  { id: 'touch_down_2', file: 'touch_down_2.wav', category: 'touch', approxKb: 72.4 },
  { id: 'touch_down_3', file: 'touch_down_3.wav', category: 'touch', approxKb: 72.4 },
  { id: 'touch_down_4', file: 'touch_down_4.wav', category: 'touch', approxKb: 72.4 },
  { id: 'touch_down_5', file: 'touch_down_5.wav', category: 'touch', approxKb: 72.4 },
  { id: 'touch_down_6', file: 'touch_down_6.wav', category: 'touch', approxKb: 72.4 },
  { id: 'touch_down_7', file: 'touch_down_7.wav', category: 'touch', approxKb: 72.4 },
  { id: 'bottle_tick_0', file: 'bottle_tick_0.wav', category: 'bottle', approxKb: 4.9 },
  { id: 'bottle_tick_1', file: 'bottle_tick_1.wav', category: 'bottle', approxKb: 4.9 },
  { id: 'bottle_tick_2', file: 'bottle_tick_2.wav', category: 'bottle', approxKb: 4.9 },
  { id: 'bottle_tick_3', file: 'bottle_tick_3.wav', category: 'bottle', approxKb: 4.9 },
] as const;

export type SoundFileName = (typeof SOUND_MANIFEST)[number]['file'];
export type SoundId = (typeof SOUND_MANIFEST)[number]['id'];

const VALID_SOUND_FILES = new Set<string>(SOUND_MANIFEST.map((s) => s.file));

// Pentatonic scale (C Major: C4 to E5) used for musical harmonic touch feedback
const PENTATONIC_SCALE = [
  261.63, // C4
  293.66, // D4
  329.63, // E4
  392.0,  // G4
  440.0,  // A4
  523.25, // C5
  587.33, // D5
  659.25, // E5
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
let subsonicFilterNode: BiquadFilterNode | null = null;
let deharshFilterNode: BiquadFilterNode | null = null;
let masterFilterNode: BiquadFilterNode | null = null;
let masterCompressorNode: DynamicsCompressorNode | null = null;

/**
 * Retrieve or initialize the shared Web Audio Context with audiophile studio mastering chain:
 * (Master Gain -> 32Hz Subsonic Filter -> 3.6kHz De-Harshing Notcher -> 12kHz Lowpass Warmth -> Transparent Limiter -> Destination)
 * Specifically engineered to eliminate ear fatigue and harshness when using earphones.
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
        // 1. Master gain stage
        masterGainNode = audioCtx.createGain();
        masterGainNode.gain.setValueAtTime(0.80, audioCtx.currentTime);

        // 2. Subsonic highpass filter (32Hz) prevents DC rumble and earphone driver flutter
        subsonicFilterNode = audioCtx.createBiquadFilter();
        subsonicFilterNode.type = 'highpass';
        subsonicFilterNode.frequency.setValueAtTime(32, audioCtx.currentTime);
        subsonicFilterNode.Q.setValueAtTime(0.707, audioCtx.currentTime);

        // 3. Fletcher-Munson Ear-Canal De-Harshing Filter (-2.5 dB at 3.6 kHz)
        // Softens ear-canal acoustic resonance so every click, tick, and chime feels silky and smooth
        deharshFilterNode = audioCtx.createBiquadFilter();
        deharshFilterNode.type = 'peaking';
        deharshFilterNode.frequency.setValueAtTime(3600, audioCtx.currentTime);
        deharshFilterNode.Q.setValueAtTime(0.85, audioCtx.currentTime);
        deharshFilterNode.gain.setValueAtTime(-2.5, audioCtx.currentTime);

        // 4. Smooth lowpass warmth filter (12 kHz) eliminates digital aliasing, clock bleed & earphone hiss
        masterFilterNode = audioCtx.createBiquadFilter();
        masterFilterNode.type = 'lowpass';
        masterFilterNode.frequency.setValueAtTime(12000, audioCtx.currentTime);
        masterFilterNode.Q.setValueAtTime(0.65, audioCtx.currentTime);

        // 5. Studio-grade mastering bus compressor (ultra-transparent, zero pumping/distortion)
        masterCompressorNode = audioCtx.createDynamicsCompressor();
        masterCompressorNode.threshold.setValueAtTime(-8.0, audioCtx.currentTime);
        masterCompressorNode.knee.setValueAtTime(16, audioCtx.currentTime); // Soft knee
        masterCompressorNode.ratio.setValueAtTime(3.5, audioCtx.currentTime); // Gentle glue compression
        masterCompressorNode.attack.setValueAtTime(0.012, audioCtx.currentTime); // 12ms attack preserves punchy transients
        masterCompressorNode.release.setValueAtTime(0.16, audioCtx.currentTime); // 160ms smooth natural release

        // Connect chain: Gain -> Subsonic HP -> De-Harsh Peaking -> Warmth LP -> Master Limiter -> Destination
        masterGainNode.connect(subsonicFilterNode);
        subsonicFilterNode.connect(deharshFilterNode);
        deharshFilterNode.connect(masterFilterNode);
        masterFilterNode.connect(masterCompressorNode);
        masterCompressorNode.connect(audioCtx.destination);
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

/**
 * Central master routing node. Guarantees all sound effects pass through
 * master volume control and the anti-clipping limiter before reaching earphones.
 */
export function getMasterOutputNode(): AudioNode | null {
  const ctx = getAudioContext();
  if (!ctx) return null;
  return masterGainNode || ctx.destination;
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
    // Kickstart background preloading of studio assets immediately
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
  private static masterVolume: number = 0.70;
  private static soundEnabled: boolean = true;
  private static hapticsEnabled: boolean = true;

  // Cache for pre-decoded 44.1kHz studio PCM AudioBuffers
  private static audioBufferCache: Map<string, AudioBuffer> = new Map();
  private static pendingLoads: Map<string, Promise<AudioBuffer | null>> = new Map();
  private static isPreloaded: boolean = false;
  private static tickVariantCounter: number = 0;
  private static lastBottleTickTime: number = 0;

  /**
   * Update audio & haptics configuration from user settings
   */
  public static updateConfig(
    soundEnabled: boolean,
    volume: number,
    hapticsEnabled: boolean,
    musicEnabled?: boolean,
    musicVolume?: number
  ) {
    this.soundEnabled = soundEnabled;
    this.masterVolume = Math.max(0, Math.min(1, volume));
    this.hapticsEnabled = hapticsEnabled;
    Haptics.setEnabled(hapticsEnabled);

    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    if (masterGainNode && ctx) {
      try {
        const targetGain = this.soundEnabled ? Math.max(0.0001, this.masterVolume * 0.80) : 0.0001;
        masterGainNode.gain.setValueAtTime(targetGain, ctx.currentTime);
      } catch (e) {}
    }

    if (musicEnabled !== undefined && musicVolume !== undefined) {
      BgmManager.updateConfig(musicEnabled, musicVolume);
    }
  }

  public static playBgm(track: BgmTrackKey, forceRestart: boolean = false) {
    BgmManager.playTrack(track, forceRestart);
  }

  public static getSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public static getVolume(): number {
    return this.masterVolume;
  }

  /**
   * Preload all studio audio files into decoded AudioBuffers
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
   * Cleans up any orphaned AudioBuffer entries in memory.
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
   * Plays a pre-decoded AudioBuffer with sub-millisecond latency
   * and automatic master limiter routing.
   */
  public static playSample(fileName: string, options: PlaySampleOptions = {}): boolean {
    if (!this.soundEnabled) return false;
    const ctx = getAudioContext();
    if (!ctx) return false;

    const buffer = this.audioBufferCache.get(fileName);
    if (!buffer) {
      this.loadAudioBuffer(fileName);
      return false;
    }

    try {
      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const gain = ctx.createGain();
      const baseVol = options.volume !== undefined ? options.volume : 1.0;
      gain.gain.setValueAtTime(Math.max(0.0001, baseVol), ctx.currentTime);

      if (options.playbackRate !== undefined) {
        source.playbackRate.setValueAtTime(options.playbackRate, ctx.currentTime);
      }

      if (options.detuneCents !== undefined && source.detune) {
        source.detune.setValueAtTime(options.detuneCents, ctx.currentTime);
      }

      source.connect(gain);
      const masterNode = getMasterOutputNode();
      if (masterNode) {
        gain.connect(masterNode);
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
  // 1. Touch Placed: Pure Crystal Waterdrop (C Major Pentatonic)
  // =========================================================================
  public static playTouchDown(touchIndex: number = 0) {
    Haptics.touchDown();
    if (!this.soundEnabled) return;

    const fileIndex = Math.abs(touchIndex) % 8;
    const fileName = `touch_down_${fileIndex}.wav`;

    const played = this.playSample(fileName, { volume: 0.85 });
    if (!played) {
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const masterNode = getMasterOutputNode();
        if (!masterNode) return;

        const freq = PENTATONIC_SCALE[touchIndex % PENTATONIC_SCALE.length];

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const lp = ctx.createBiquadFilter();

        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(2600, now);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * 1.15, now);
        osc.frequency.exponentialRampToValueAtTime(freq, now + 0.02);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.004);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

        osc.connect(gain);
        gain.connect(lp);
        lp.connect(masterNode);

        osc.start(now);
        osc.stop(now + 0.35);
      } catch (e) {}
    }
  }

  // =========================================================================
  // 2. Touch Released: Delicate glass bubble lift
  // =========================================================================
  public static playTouchUp() {
    Haptics.touchUp();
    if (!this.soundEnabled) return;

    const played = this.playSample('touch_up.wav', { volume: 0.80 });
    if (!played) {
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const masterNode = getMasterOutputNode();
        if (!masterNode) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(580, now + 0.04);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.003);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

        osc.connect(gain);
        gain.connect(masterNode);
        osc.start(now);
        osc.stop(now + 0.05);
      } catch (e) {}
    }
  }

  // =========================================================================
  // 3. Countdown Tick: Smooth woody metronome pulse (zero screech)
  // =========================================================================
  public static playCountdownTick(remainingSeconds: number, totalSeconds: number) {
    Haptics.countdownTick(remainingSeconds, totalSeconds);
    if (!this.soundEnabled) return;

    const total = Math.max(1, totalSeconds || 3);
    const progress = Math.min(1, Math.max(0, (total - remainingSeconds) / Math.max(1, total - 1)));
    const isUrgent = remainingSeconds <= 1;
    const fileName = isUrgent ? 'countdown_tick_urgent.wav' : 'countdown_tick.wav';
    const rate = 1.0 + progress * 0.20;

    const played = this.playSample(fileName, {
      volume: 0.85,
      playbackRate: rate,
    });

    if (!played) {
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const masterNode = getMasterOutputNode();
        if (!masterNode) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const lp = ctx.createBiquadFilter();

        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(1800, now);

        const freq = isUrgent ? 460 : 320;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.7, now + 0.06);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.16, now + 0.003);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

        osc.connect(gain);
        gain.connect(lp);
        lp.connect(masterNode);

        osc.start(now);
        osc.stop(now + 0.09);
      } catch (e) {}
    }
  }

  // =========================================================================
  // 4. Target Impact: Cinematic velvet sub boom + star bloom
  // =========================================================================
  public static playTargetImpact() {
    Haptics.targetSelected();
    if (!this.soundEnabled) return;

    const played = this.playSample('target_impact.wav', { volume: 0.95 });
    if (!played) {
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const masterNode = getMasterOutputNode();
        if (!masterNode) return;

        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(70, now);
        subOsc.frequency.exponentialRampToValueAtTime(36, now + 0.45);

        subGain.gain.setValueAtTime(0.0001, now);
        subGain.gain.linearRampToValueAtTime(0.32, now + 0.008);
        subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.50);

        subOsc.connect(subGain);
        subGain.connect(masterNode);

        subOsc.start(now);
        subOsc.stop(now + 0.52);
      } catch (e) {}
    }
  }

  // =========================================================================
  // 5. Team Division Complete: Lush studio celeste / harp arpeggio
  // =========================================================================
  public static playTeamDivisionChime() {
    Haptics.teamDivision();
    if (!this.soundEnabled) return;

    const played = this.playSample('team_division.wav', { volume: 0.90 });
    if (!played) {
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const masterNode = getMasterOutputNode();
        if (!masterNode) return;

        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, index) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + index * 0.06);

          gain.gain.setValueAtTime(0.0001, now + index * 0.06);
          gain.gain.linearRampToValueAtTime(0.12, now + index * 0.06 + 0.008);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.06 + 0.32);

          osc.connect(gain);
          gain.connect(masterNode);

          osc.start(now + index * 0.06);
          osc.stop(now + index * 0.06 + 0.35);
        });
      } catch (e) {}
    }
  }

  // =========================================================================
  // 6. Bottle Flick / Launch: Aerodynamic air whoosh + gentle acoustic slide
  // =========================================================================
  public static playBottleFlick(velocity: number) {
    Haptics.bottleFlick(velocity);
    if (!this.soundEnabled) return;

    const intensity = Math.min(1.2, Math.max(0.8, Math.abs(velocity) / 12));
    const rate = 0.92 + intensity * 0.16;

    const played = this.playSample('bottle_flick.wav', {
      volume: 0.85 * intensity,
      playbackRate: rate,
    });

    if (!played) {
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const masterNode = getMasterOutputNode();
        if (!masterNode) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(320 * intensity, now + 0.15);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.14 * intensity, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

        osc.connect(gain);
        gain.connect(masterNode);
        osc.start(now);
        osc.stop(now + 0.28);
      } catch (e) {}
    }
  }

  // =========================================================================
  // 7. Bottle Spin Ratchet / Bearing Tick: Silky wooden marble clicks
  // =========================================================================
  public static playBottleTick(angularVelocity: number) {
    Haptics.bottleTick(angularVelocity);
    if (!this.soundEnabled) return;

    // Rate-limiting throttle (min 38ms between ticks): prevents buffer overlap & static in earphones
    const nowPerf = performance.now();
    if (nowPerf - this.lastBottleTickTime < 38) {
      return;
    }
    this.lastBottleTickTime = nowPerf;

    const variant = this.tickVariantCounter % 4;
    this.tickVariantCounter++;

    const speedFactor = Math.min(1.2, Math.max(0.8, Math.abs(angularVelocity) / 10));
    const rate = 0.94 + speedFactor * 0.12;

    const played = this.playSample(`bottle_tick_${variant}.wav`, {
      volume: 0.75 * Math.min(1.0, speedFactor),
      playbackRate: rate,
    });

    if (!played) {
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const masterNode = getMasterOutputNode();
        if (!masterNode) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(680 + speedFactor * 100, now);
        osc.frequency.exponentialRampToValueAtTime(240, now + 0.02);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.07, now + 0.002);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.022);

        osc.connect(gain);
        gain.connect(masterNode);
        osc.start(now);
        osc.stop(now + 0.025);
      } catch (e) {}
    }
  }

  // =========================================================================
  // 8. Bottle Settled: Resonant crystal singing bell
  // =========================================================================
  public static playBottleSettle() {
    Haptics.bottleSettled();
    if (!this.soundEnabled) return;

    const played = this.playSample('bottle_settle.wav', { volume: 0.85 });
    if (!played) {
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const masterNode = getMasterOutputNode();
        if (!masterNode) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, now);
        osc.frequency.exponentialRampToValueAtTime(520, now + 0.35);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.16, now + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

        osc.connect(gain);
        gain.connect(masterNode);
        osc.start(now);
        osc.stop(now + 0.40);
      } catch (e) {}
    }
  }

  // =========================================================================
  // 9. UI Button Click: Warm acoustic marimba tap (zero high-frequency harshness)
  // =========================================================================
  public static playButtonClick() {
    Haptics.buttonClick();
    if (!this.soundEnabled) return;

    const randomRate = 0.98 + Math.random() * 0.04;

    const played = this.playSample('button_click.wav', {
      volume: 0.85,
      playbackRate: randomRate,
    });

    if (!played) {
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const masterNode = getMasterOutputNode();
        if (!masterNode) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const lp = ctx.createBiquadFilter();

        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(1600, now);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(190, now + 0.028);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.002);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.032);

        osc.connect(gain);
        gain.connect(lp);
        lp.connect(masterNode);

        osc.start(now);
        osc.stop(now + 0.035);
      } catch (e) {}
    }
  }

  // =========================================================================
  // 10. Kaboom: Safe Ball Pop (Soft bubbly burst + warm glass bell)
  // =========================================================================
  public static playSafePop() {
    Haptics.safePop();
    if (!this.soundEnabled) return;

    const played = this.playSample('safe_pop.wav', { volume: 0.85 });
    if (!played) {
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const masterNode = getMasterOutputNode();
        if (!masterNode) return;

        const popOsc = ctx.createOscillator();
        const popGain = ctx.createGain();
        popOsc.type = 'sine';
        popOsc.frequency.setValueAtTime(380, now);
        popOsc.frequency.exponentialRampToValueAtTime(180, now + 0.035);

        popGain.gain.setValueAtTime(0.0001, now);
        popGain.gain.linearRampToValueAtTime(0.14, now + 0.003);
        popGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

        popOsc.connect(popGain);
        popGain.connect(masterNode);
        popOsc.start(now);
        popOsc.stop(now + 0.045);

        const chimeOsc = ctx.createOscillator();
        const chimeGain = ctx.createGain();
        chimeOsc.type = 'sine';
        chimeOsc.frequency.setValueAtTime(880, now + 0.015);

        chimeGain.gain.setValueAtTime(0.0001, now + 0.015);
        chimeGain.gain.linearRampToValueAtTime(0.10, now + 0.022);
        chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

        chimeOsc.connect(chimeGain);
        chimeGain.connect(masterNode);
        chimeOsc.start(now + 0.015);
        chimeOsc.stop(now + 0.24);
      } catch (e) {}
    }
  }

  // =========================================================================
  // 11. Kaboom: Command Bonus Fanfare (Triumphant celebratory arpeggio)
  // =========================================================================
  public static playBonusFanfare() {
    Haptics.bonusClaim();
    if (!this.soundEnabled) return;

    const played = this.playSample('bonus_fanfare.wav', { volume: 0.85 });
    if (!played) {
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const masterNode = getMasterOutputNode();
        if (!masterNode) return;

        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.05);

          gain.gain.setValueAtTime(0.0001, now + idx * 0.05);
          gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.05 + 0.008);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 0.28);

          osc.connect(gain);
          gain.connect(masterNode);
          osc.start(now + idx * 0.05);
          osc.stop(now + idx * 0.05 + 0.30);
        });
      } catch (e) {}
    }
  }

  // =========================================================================
  // 11b. Star Currency HUD Beep / Pickup Chime (Warm sparkling arcade ping)
  // =========================================================================
  public static playHudCoinBeep() {
    triggerHaptic([12, 25, 18]);
    if (!this.soundEnabled) return;

    const played = this.playSample('hud_coin.wav', { volume: 0.80 });
    if (!played) {
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const masterNode = getMasterOutputNode();
        if (!masterNode) return;

        const pings = [
          { freq: 987.77, delay: 0.0, dur: 0.16, vol: 0.12 },
          { freq: 1318.5, delay: 0.04, dur: 0.20, vol: 0.15 },
        ];
        pings.forEach(({ freq, delay, dur, vol }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + delay);

          gain.gain.setValueAtTime(0.0001, now + delay);
          gain.gain.linearRampToValueAtTime(vol, now + delay + 0.006);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur);

          osc.connect(gain);
          gain.connect(masterNode);
          osc.start(now + delay);
          osc.stop(now + delay + dur + 0.02);
        });
      } catch (e) {}
    }
  }

  // =========================================================================
  // 12. Kaboom: Bomb Explosion (Deep cinematic rumble, zero clipping)
  // =========================================================================
  public static playBombExplosion() {
    Haptics.bombExplosion();
    if (!this.soundEnabled) return;

    const played = this.playSample('bomb_explosion.wav', { volume: 0.95 });
    if (!played) {
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const masterNode = getMasterOutputNode();
        if (!masterNode) return;

        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(85, now);
        subOsc.frequency.exponentialRampToValueAtTime(34, now + 0.60);

        subGain.gain.setValueAtTime(0.0001, now);
        subGain.gain.linearRampToValueAtTime(0.35, now + 0.01);
        subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

        subOsc.connect(subGain);
        subGain.connect(masterNode);

        subOsc.start(now);
        subOsc.stop(now + 0.70);
      } catch (e) {}
    }
  }

  // =========================================================================
  // 13. Bomb Pong: Paddle bounce and laser wall reflections
  // =========================================================================
  public static playPaddleHit(multiplier: number = 1) {
    if (!this.soundEnabled) return;

    const rate = Math.max(0.85, Math.min(1.35, multiplier));
    const played = this.playSample('paddle_hit.wav', { volume: 0.85, playbackRate: rate });
    if (!played) {
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const masterNode = getMasterOutputNode();
        if (!masterNode) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const baseFreq = Math.min(600, 260 * Math.max(0.8, multiplier));
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq * 1.2, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, now + 0.05);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.16, now + 0.003);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

        osc.connect(gain);
        gain.connect(masterNode);
        osc.start(now);
        osc.stop(now + 0.07);
      } catch (e) {}
    }
  }

  public static playWallPing() {
    if (!this.soundEnabled) return;

    const played = this.playSample('wall_ping.wav', { volume: 0.80 });
    if (!played) {
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const masterNode = getMasterOutputNode();
        if (!masterNode) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.exponentialRampToValueAtTime(260, now + 0.04);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.10, now + 0.003);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

        osc.connect(gain);
        gain.connect(masterNode);
        osc.start(now);
        osc.stop(now + 0.05);
      } catch (e) {}
    }
  }
}

/**
 * Backward compatibility alias: SoundEngine = AudioManager
 */
export const SoundEngine = AudioManager;

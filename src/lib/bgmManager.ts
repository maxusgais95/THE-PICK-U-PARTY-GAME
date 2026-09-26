/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import hubBgmUrl from '../bgm/Neon Party BGM.m4a';
import bottleBgmUrl from '../bgm/Neon Party BGM_Bottle.m4a';
import fingerBgmUrl from '../bgm/Neon Party BGM_Roullete.m4a';
import bombBgmUrl from '../bgm/Neon Party_Bomb.m4a';

export type BgmTrackKey = 'hub' | 'bottle' | 'finger' | 'bomb';

export const BGM_TRACKS: Record<BgmTrackKey, string> = {
  hub: hubBgmUrl,
  bottle: bottleBgmUrl,
  finger: fingerBgmUrl,
  bomb: bombBgmUrl,
};

/**
 * BgmManager
 * Dual-channel background music system with smooth crossfade, blending,
 * separate volume control, on/off toggling, and autoplay unlock handling.
 */
export class BgmManager {
  private static musicEnabled: boolean = true;
  private static musicVolume: number = 0.7; // 0.0 - 1.0

  // Dual audio channels for crossfading
  private static channelA: HTMLAudioElement | null = null;
  private static channelB: HTMLAudioElement | null = null;
  private static activeChannelIndex: 0 | 1 = 0; // 0 = A, 1 = B

  private static currentTrack: BgmTrackKey = 'hub';
  private static targetTrack: BgmTrackKey = 'hub';
  private static isInitialized: boolean = false;
  private static isTransitioning: boolean = false;
  private static fadeAnimationId: number | null = null;

  // Track user interaction state for autoplay compliance
  private static hasUserInteracted: boolean = false;

  private static initChannels() {
    if (typeof window === 'undefined' || this.isInitialized) return;
    this.isInitialized = true;

    this.channelA = new Audio();
    this.channelA.loop = true;
    this.channelA.preload = 'auto';
    this.channelA.volume = 0;

    this.channelB = new Audio();
    this.channelB.loop = true;
    this.channelB.preload = 'auto';
    this.channelB.volume = 0;

    // Suppress system notification media player popup on mobile OS
    this.suppressMediaSession();

    // Visibility change listener to pause/resume cleanly on tab backgrounding
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseActive();
      } else {
        if (this.musicEnabled) {
          this.resumeActive();
        }
      }
    });

    // Global unlocker for iOS Safari and mobile browser autoplay constraints
    const unlockMusic = () => {
      this.hasUserInteracted = true;
      if (this.musicEnabled) {
        this.resumeActive();
      }
      window.removeEventListener('pointerdown', unlockMusic);
      window.removeEventListener('touchstart', unlockMusic);
      window.removeEventListener('click', unlockMusic);
    };

    window.addEventListener('pointerdown', unlockMusic, { passive: true });
    window.addEventListener('touchstart', unlockMusic, { passive: true });
    window.addEventListener('click', unlockMusic, { passive: true });
  }

  /**
   * Set configuration from settings
   */
  public static updateConfig(enabled: boolean, volume: number) {
    const wasEnabled = this.musicEnabled;
    const oldVolume = this.musicVolume;
    this.musicEnabled = enabled;
    this.musicVolume = Math.max(0, Math.min(1, volume));

    this.initChannels();

    if (!enabled && wasEnabled) {
      // Smooth fade out to silence and pause
      this.fadeOutAndPause(350);
    } else if (enabled && !wasEnabled) {
      // Resume current track with smooth fade in
      this.fadeInAndResume(400);
    } else if (enabled && this.musicVolume !== oldVolume) {
      // Live volume adjust without disrupting crossfades
      this.adjustCurrentVolume();
    }
  }

  public static isEnabled(): boolean {
    return this.musicEnabled;
  }

  public static getVolume(): number {
    return this.musicVolume;
  }

  public static getCurrentTrack(): BgmTrackKey {
    return this.currentTrack;
  }

  /**
   * Play or smoothly crossfade to a new track
   */
  public static playTrack(track: BgmTrackKey, forceRestart: boolean = false) {
    this.initChannels();
    this.targetTrack = track;

    if (!forceRestart && this.currentTrack === track && this.isPlaying()) {
      return;
    }

    if (!this.musicEnabled) {
      this.currentTrack = track;
      return;
    }

    this.crossfadeTo(track);
  }

  /**
   * Smoothly crossfade from current track to destination track over 1.2 seconds.
   * Blends outgoing and incoming audio smoothly.
   */
  private static crossfadeTo(newTrack: BgmTrackKey, durationMs: number = 1200) {
    if (!this.channelA || !this.channelB) return;

    // Cancel any running fade animation
    if (this.fadeAnimationId !== null) {
      cancelAnimationFrame(this.fadeAnimationId);
      this.fadeAnimationId = null;
    }

    const currentChannel = this.activeChannelIndex === 0 ? this.channelA : this.channelB;
    const nextChannel = this.activeChannelIndex === 0 ? this.channelB : this.channelA;
    const nextChannelIdx: 0 | 1 = this.activeChannelIndex === 0 ? 1 : 0;

    const newUrl = BGM_TRACKS[newTrack];
    if (!newUrl) return;

    // Prepare next channel
    try {
      // If next channel source is different, update src
      if (nextChannel.src !== newUrl && !nextChannel.src.endsWith(newUrl)) {
        nextChannel.src = newUrl;
      }
      nextChannel.currentTime = 0;
      nextChannel.loop = true;
      nextChannel.volume = 0;
    } catch (e) {
      console.warn('[BgmManager] Setup channel error:', e);
    }

    const playPromise = nextChannel.play();
    if (playPromise) {
      playPromise.catch((err) => {
        // Expected if user hasn't tapped yet due to browser autoplay policy
        console.log('[BgmManager] Autoplay waiting for user gesture:', err.message);
      });
    }

    this.currentTrack = newTrack;
    this.activeChannelIndex = nextChannelIdx;
    this.isTransitioning = true;
    this.suppressMediaSession();

    const startTime = performance.now();
    const initialCurrentVol = currentChannel.volume;
    const targetVol = this.musicVolume;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);

      // Equal-power crossfade or smooth sine curve for optimal blend mix without dip in perceived energy
      const fadeOutFactor = Math.cos((progress * Math.PI) / 2); // 1 -> 0
      const fadeInFactor = Math.sin((progress * Math.PI) / 2);  // 0 -> 1

      try {
        currentChannel.volume = Math.max(0, Math.min(1, initialCurrentVol * fadeOutFactor));
        nextChannel.volume = Math.max(0, Math.min(1, targetVol * fadeInFactor));
      } catch (e) {
        // ignore
      }

      if (progress < 1) {
        this.fadeAnimationId = requestAnimationFrame(step);
      } else {
        // Complete transition
        this.fadeAnimationId = null;
        this.isTransitioning = false;
        try {
          currentChannel.pause();
          currentChannel.volume = 0;
          currentChannel.currentTime = 0;
          nextChannel.volume = this.musicVolume;
        } catch (e) {
          // ignore
        }
      }
    };

    this.fadeAnimationId = requestAnimationFrame(step);
  }

  /**
   * Fade out active channel and pause
   */
  private static fadeOutAndPause(durationMs: number = 300) {
    if (!this.channelA || !this.channelB) return;
    if (this.fadeAnimationId !== null) {
      cancelAnimationFrame(this.fadeAnimationId);
      this.fadeAnimationId = null;
    }

    const active = this.activeChannelIndex === 0 ? this.channelA : this.channelB;
    const inactive = this.activeChannelIndex === 0 ? this.channelB : this.channelA;

    try {
      inactive.pause();
      inactive.volume = 0;
    } catch (e) {}

    const startVol = active.volume;
    if (startVol <= 0.001 || active.paused) {
      try {
        active.pause();
        active.volume = 0;
      } catch (e) {}
      return;
    }

    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      try {
        active.volume = Math.max(0, startVol * (1 - progress));
      } catch (e) {}

      if (progress < 1) {
        this.fadeAnimationId = requestAnimationFrame(step);
      } else {
        this.fadeAnimationId = null;
        try {
          active.pause();
          active.volume = 0;
        } catch (e) {}
      }
    };

    this.fadeAnimationId = requestAnimationFrame(step);
  }

  /**
   * Fade in active channel and resume
   */
  private static fadeInAndResume(durationMs: number = 400) {
    if (!this.channelA || !this.channelB) return;
    if (this.fadeAnimationId !== null) {
      cancelAnimationFrame(this.fadeAnimationId);
      this.fadeAnimationId = null;
    }

    const active = this.activeChannelIndex === 0 ? this.channelA : this.channelB;
    const trackUrl = BGM_TRACKS[this.currentTrack];

    try {
      if (active.src !== trackUrl && !active.src.endsWith(trackUrl)) {
        active.src = trackUrl;
        active.currentTime = 0;
      }
      active.loop = true;
      active.volume = 0;
      const playPromise = active.play();
      if (playPromise) {
        playPromise.catch(() => {});
      }
    } catch (e) {}

    const startTime = performance.now();
    const targetVol = this.musicVolume;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      try {
        active.volume = Math.max(0, Math.min(1, targetVol * progress));
      } catch (e) {}

      if (progress < 1) {
        this.fadeAnimationId = requestAnimationFrame(step);
      } else {
        this.fadeAnimationId = null;
        try {
          active.volume = targetVol;
        } catch (e) {}
      }
    };

    this.fadeAnimationId = requestAnimationFrame(step);
  }

  /**
   * Dynamically adjust volume of active channel while playing
   */
  private static adjustCurrentVolume() {
    if (!this.channelA || !this.channelB) return;
    if (this.isTransitioning) return; // let transition complete to new targetVol

    const active = this.activeChannelIndex === 0 ? this.channelA : this.channelB;
    try {
      active.volume = Math.max(0, Math.min(1, this.musicVolume));
    } catch (e) {}
  }

  /**
   * Pause active channel immediately
   */
  public static pauseActive() {
    try {
      if (this.channelA) this.channelA.pause();
      if (this.channelB) this.channelB.pause();
    } catch (e) {}
  }

  /**
   * Resume active channel
   */
  public static resumeActive() {
    if (!this.musicEnabled) return;
    const active = this.activeChannelIndex === 0 ? this.channelA : this.channelB;
    if (!active) return;

    const trackUrl = BGM_TRACKS[this.currentTrack];
    try {
      if (!active.src || (!active.src.endsWith(trackUrl) && active.src !== trackUrl)) {
        active.src = trackUrl;
      }
      active.loop = true;
      active.volume = this.musicVolume;
      const playPromise = active.play();
      if (playPromise) {
        playPromise.catch(() => {});
      }
    } catch (e) {}
  }

  private static isPlaying(): boolean {
    const active = this.activeChannelIndex === 0 ? this.channelA : this.channelB;
    return !!active && !active.paused && active.volume > 0;
  }

  /**
   * Suppress system notification media player on mobile devices
   */
  public static suppressMediaSession() {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.playbackState = 'none';
        const actions: MediaSessionAction[] = [
          'play',
          'pause',
          'seekbackward',
          'seekforward',
          'previoustrack',
          'nexttrack',
          'stop',
        ];
        actions.forEach((action) => {
          try {
            navigator.mediaSession.setActionHandler(action, null);
          } catch (e) {}
        });
      } catch (e) {}
    }
  }
}


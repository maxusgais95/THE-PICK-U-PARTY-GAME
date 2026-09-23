/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Re-export the unified AudioManager and Haptics for backwards compatibility
 * and single-source imports across the application.
 */
export {
  AudioManager,
  SoundEngine,
  Haptics,
  getAudioContext,
  triggerHaptic,
  SOUND_MANIFEST,
} from './audioManager';

export type {
  SoundFileName,
  SoundId,
  PlaySampleOptions,
  AudioCacheReport,
} from './audioManager';

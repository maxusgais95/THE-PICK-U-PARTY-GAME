/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Custom Haptic Feedback System using the HTML5 Vibration API.
 * Provides custom tactile rhythm patterns for game events:
 * - Finger Roulette target selection / elimination drop
 * - Bottle stop / settled pointing lock
 * - Flick impulses & revolution bearing ticks
 * - Countdown suspense heartbeats
 * - Multi-touch placement & UI interaction
 */

export class Haptics {
  private static enabled: boolean = true;

  public static setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public static getEnabled(): boolean {
    return this.enabled;
  }

  public static isSupported(): boolean {
    return (
      typeof navigator !== 'undefined' &&
      'vibrate' in navigator &&
      typeof navigator.vibrate === 'function'
    );
  }

  /**
   * Execute a raw vibration pattern (single duration or alternating [vib, pause, vib, pause...] array)
   */
  public static vibrate(pattern: number | number[]): boolean {
    if (!this.enabled || !this.isSupported()) return false;
    try {
      return navigator.vibrate(pattern);
    } catch (e) {
      return false;
    }
  }

  /**
   * Cancel any running vibration pattern
   */
  public static cancel() {
    if (this.isSupported()) {
      try {
        navigator.vibrate(0);
      } catch (e) {}
    }
  }

  /**
   * 1. Finger Roulette: Target / Loser Selected
   * Custom heavy dramatic pulse with progressive build-up and deep shock impact:
   * [50ms warning, 30ms rest, 90ms rise, 40ms rest, 200ms heavy thump, 50ms rest, 320ms shockwave finish]
   */
  public static targetSelected() {
    this.vibrate([50, 30, 90, 40, 200, 50, 320]);
  }

  /**
   * 2. Spin The Bottle: Bottle Stopped / Settled
   * Tactile dual-ratchet deceleration braking into final settled position:
   * [40ms initial brake click, 30ms rest, 70ms mechanical grab, 40ms rest, 160ms solid directional lock]
   */
  public static bottleSettled() {
    this.vibrate([40, 30, 70, 40, 160]);
  }

  /**
   * 3. Bottle Flick / Launch
   * Quick responsive launch impulse scaled with flick force
   */
  public static bottleFlick(velocity: number = 20) {
    const power = Math.min(80, Math.max(30, Math.round(Math.abs(velocity) * 2)));
    this.vibrate([30, 20, power]);
  }

  /**
   * 4. Bottle Spin Tick
   * Subtle micro-pulse when passing a rotation segment during slow revolutions
   */
  public static bottleTick(angularVelocity: number) {
    if (Math.abs(angularVelocity) < 6) {
      this.vibrate(12);
    }
  }

  /**
   * 5. Countdown Suspense Tick
   * Dynamic heartbeat pulse pattern that intensifies as timer counts down to 0
   */
  public static countdownTick(remainingSeconds: number, totalSeconds: number) {
    const urgency = 1 - Math.max(0, remainingSeconds / (totalSeconds || 5));
    if (urgency > 0.6) {
      // Rapid urgent double-beat
      this.vibrate([35, 25, 50]);
    } else {
      // Rhythm heartbeat
      this.vibrate([25, 35, 25]);
    }
  }

  /**
   * 6. Team Division Complete
   * Harmonic 3-pulse cadence celebrating group formation
   */
  public static teamDivision() {
    this.vibrate([60, 30, 80, 30, 140]);
  }

  /**
   * 7. Touch Down / Finger Placed
   * Light, immediate 18ms tactile confirmation
   */
  public static touchDown() {
    this.vibrate(18);
  }

  /**
   * 8. Touch Up / Finger Lifted
   * Ultra-crisp 8ms release blip
   */
  public static touchUp() {
    this.vibrate(8);
  }

  /**
   * 9. UI Button Click
   * Crisp 14ms UI click feedback
   */
  public static buttonClick() {
    this.vibrate(14);
  }

  /**
   * 10. Kaboom: Safe Ball Pop
   * Snappy 20ms tactile confirmation
   */
  public static safePop() {
    this.vibrate(20);
  }

  /**
   * 11. Kaboom: Command Bonus Revealed
   * Ascending celebratory shimmer pulse
   */
  public static bonusClaim() {
    this.vibrate([25, 30, 45, 30, 80]);
  }

  /**
   * 12. Kaboom: Lethal Bomb Explosion
   * Violent progressive double detonation rumble
   */
  public static bombExplosion() {
    this.vibrate([40, 20, 80, 30, 160, 40, 300]);
  }

  /**
   * 13. Quest / Store / Reward Success
   * Crisp celebratory tactile ripple
   */
  public static touchSuccess() {
    this.vibrate([20, 25, 40, 25, 70]);
  }

  public static reward() {
    this.vibrate([20, 25, 40, 25, 70]);
  }
}

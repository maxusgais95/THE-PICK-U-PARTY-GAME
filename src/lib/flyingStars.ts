/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FlyingStarRequest {
  startX?: number;
  startY?: number;
  sourceElement?: HTMLElement | null;
  amount?: number;
  hudDisplayAmount?: number;
}

/**
 * Universal dispatcher for flying star currency animations across the app.
 * Can be triggered on:
 * - Claim (Quests, Daily Rewards, Bonus Modals)
 * - Bonus discovered
 * - Safe bomb defused
 * - Finished game modes (Roulette, Bottle Spin, Kaboom)
 */
export function triggerGlobalFlyingStars(req: FlyingStarRequest = {}): void {
  let { startX, startY } = req;

  if (req.sourceElement) {
    try {
      const rect = req.sourceElement.getBoundingClientRect();
      startX = rect.left + rect.width / 2;
      startY = rect.top + rect.height / 2;
    } catch {
      // Fallback
    }
  }

  if (typeof startX !== 'number' || typeof startY !== 'number') {
    startX = window.innerWidth / 2;
    startY = window.innerHeight / 2;
  }

  const hudEl = document.getElementById('star-currency-hud');
  const hudRect = hudEl?.getBoundingClientRect();
  const endX = hudRect ? hudRect.left + hudRect.width / 2 : window.innerWidth / 2;
  const endY = hudRect ? hudRect.top + hudRect.height / 2 : 28;

  const detail = {
    id: `batch-${Date.now()}-${Math.random()}`,
    startX,
    startY,
    endX,
    endY,
    amount: req.amount ?? 15,
    hudDisplayAmount: req.hudDisplayAmount,
  };

  window.dispatchEvent(new CustomEvent('global-spawn-flying-stars', { detail }));
}

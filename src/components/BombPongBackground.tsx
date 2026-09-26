/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import pongCourtBg from '../assets/images/pong_court_bg_1790404428944.jpg';
import { getAssetUrl } from '../lib/assetPreloader';

// Module-level asset preloading for instant zero-latency rendering
if (typeof window !== 'undefined') {
  const img = new Image();
  img.src = pongCourtBg;
}

interface BombPongBackgroundProps {
  active?: boolean;
  gamePhase?: 'mode_select' | 'ready' | 'countdown' | 'playing' | 'detonated' | 'gameover';
}

export const BombPongBackground: React.FC<BombPongBackgroundProps> = ({
  active = true,
}) => {
  if (!active) return null;

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Gameplay Court Background Artwork */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-100 scale-100"
        style={{
          backgroundImage: `url("${getAssetUrl(pongCourtBg)}")`,
        }}
      />

      {/* Atmospheric Gradient Overlays for Enhanced Contrast & Neon Pop */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/30 to-black/75" />
      <div className="absolute inset-0 bg-radial from-transparent via-black/45 to-black/90" />
    </div>
  );
};


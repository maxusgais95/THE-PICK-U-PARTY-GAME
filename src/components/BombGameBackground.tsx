/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import bombGameBg from '../assets/images/Bomb Game Background.jpeg';
import { getAssetUrl } from '../lib/assetPreloader';

interface BombGameBackgroundProps {
  active?: boolean;
}

export const BombGameBackground: React.FC<BombGameBackgroundProps> = ({ active = true }) => {
  if (!active) return null;

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* High-Resolution Bomb Game Background Artwork */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out"
        style={{
          backgroundImage: `url("${getAssetUrl(bombGameBg)}")`,
        }}
      />

      {/* Deep Vignette & Neon Atmospheric Washes for Maximum Contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/35 to-black/85" />
      <div className="absolute inset-0 bg-radial from-transparent via-black/40 to-black/90" />
    </div>
  );
};

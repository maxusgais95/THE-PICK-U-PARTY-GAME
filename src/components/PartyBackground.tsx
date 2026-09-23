/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import neonPartyVideo from '../assets/videos/Chibi DJ Party 2K Background Animation.mov' ;
import { getAssetUrl } from '../lib/assetPreloader';
import { ThemeId } from '../types';
import { THEMES } from '../lib/themes';

interface PartyBackgroundProps {
  className?: string;
  theme?: ThemeId;
  active?: boolean;
}

export const PartyBackground: React.FC<PartyBackgroundProps> = ({
  className = '',
  theme = 'cyber-neon',
  active = true,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const currentTheme = THEMES[theme] || THEMES['cyber-neon'];

  // Ensure video auto-plays reliably across all devices and pauses when inactive
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');

    if (active) {
      const tryPlay = () => {
        video.play().catch(() => {
          // Fallback on user interaction
          const onInteract = () => {
            video.play().catch(() => {});
            window.removeEventListener('touchstart', onInteract);
            window.removeEventListener('click', onInteract);
          };
          window.addEventListener('touchstart', onInteract, { once: true });
          window.addEventListener('click', onInteract, { once: true });
        });
      };
      tryPlay();
    } else {
      video.pause();
    }
  }, [active]);

  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden z-0 transition-colors duration-500 ${className}`}
      style={{ backgroundColor: currentTheme.bgBase }}
    >
      {/* 1. Part (Pure video, crystal clear DJ performance area) */}
      <video
        ref={videoRef}
        src={getAssetUrl(neonPartyVideo)}
        preload="auto"
        autoPlay
        loop
        muted
        playsInline
        disablePictureInPicture
        controls={false}
        data-buffer="0.2"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none z-0"
        style={{
          filter: 'contrast(1.0) brightness(1.0) saturate(1.0)',
        }}
      />

      {/* 2. Dynamic Theme Atmosphere Tint (Subtle, preserving crystal clear video colors) */}
      <div
        className="absolute inset-0 pointer-events-none z-5 opacity-10 mix-blend-color transition-all duration-500"
        style={{ background: currentTheme.bgGrad }}
      />

      {/* 3. Bottom vignette for game mode cards contrast — softened to reveal background video behind translucent panels */}
      <div
        className="absolute inset-x-0 bottom-0 h-[46%] pointer-events-none z-10"
        style={{
          background: 'linear-gradient(to top, rgba(5, 6, 20, 0.38) 0%, rgba(5, 6, 20, 0.28) 40%, rgba(5, 6, 20, 0) 100%)',
        }}
      />

      {/* Top minimal status bar vignette strictly behind top action buttons, leaving DJ fully clear */}
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/45 via-black/15 to-transparent pointer-events-none z-10" />
    </div>
  );
};

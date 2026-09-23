/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { RotateCcw, Smartphone } from 'lucide-react';

export const LandscapeBlocker: React.FC = () => {
  const [isBlocked, setIsBlocked] = useState<boolean>(false);

  useEffect(() => {
    // Attempt system orientation lock to portrait if supported
    try {
      if (typeof window !== 'undefined' && window.screen && 'orientation' in window.screen) {
        (window.screen.orientation as any).lock?.('portrait-primary').catch(() => {});
      }
    } catch {}

    const checkOrientation = () => {
      const isTouch =
        window.matchMedia('(pointer: coarse)').matches ||
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0;
      
      const isWiderThanTall = window.innerWidth > window.innerHeight;
      const isMobileHeight = window.innerHeight <= 640;

      // Block if mobile device or compact height in landscape orientation
      const shouldBlock = isWiderThanTall && (isTouch || isMobileHeight);
      setIsBlocked(shouldBlock);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!isBlocked) return null;

  return (
    <div
      id="landscape-lock-overlay"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-6 bg-[#050614]/95 backdrop-blur-2xl text-white select-none pointer-events-auto"
    >
      {/* Ambient background glow */}
      <div className="absolute w-72 h-72 rounded-full bg-cyan-500/20 blur-[90px] -top-10 -left-10 pointer-events-none" />
      <div className="absolute w-72 h-72 rounded-full bg-fuchsia-500/20 blur-[90px] -bottom-10 -right-10 pointer-events-none" />

      {/* Animated Rotating Phone Icon */}
      <div className="relative mb-6 flex items-center justify-center">
        {/* Glow Ring */}
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-500/20 via-purple-500/20 to-pink-500/20 border border-cyan-400/30 flex items-center justify-center shadow-[0_0_30px_rgba(0,240,255,0.3)] animate-pulse">
          <div className="relative animate-bounce">
            <Smartphone className="w-10 h-10 text-cyan-300 drop-shadow-[0_0_12px_#00f0ff]" />
          </div>
        </div>

        {/* Circular rotate arrow badge */}
        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-pink-500 border border-white/80 shadow-[0_0_15px_rgba(236,72,153,0.8)] flex items-center justify-center text-white">
          <RotateCcw className="w-4 h-4 stroke-[2.5]" />
        </div>
      </div>

      {/* Tag */}
      <span className="font-header px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.2em] bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_12px_rgba(0,240,255,0.4)] mb-3">
        Portrait Mode Only
      </span>

      {/* Heading */}
      <h2
        className="font-header text-xl sm:text-2xl font-bold uppercase tracking-wider text-center my-1"
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #7dd3fc 40%, #00e5ff 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 0 10px rgba(0, 240, 255, 0.6))',
        }}
      >
        Please Rotate Your Device
      </h2>

      {/* Subtitle */}
      <p className="font-body text-xs sm:text-sm text-gray-300 text-center max-w-xs mt-1.5 mb-0 leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
        PICK'U PARTY is designed exclusively for vertical portrait mode. Turn your phone upright to continue playing!
      </p>
    </div>
  );
};

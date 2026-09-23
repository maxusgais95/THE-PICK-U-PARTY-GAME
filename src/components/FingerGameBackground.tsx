/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import rouletteBgImage from '../assets/images/Finger Roulette Background.webp';
import rouletteBgVideo from '../assets/videos/Finger Roulette Background Animation.mp4';
import { getAssetUrl } from '../lib/assetPreloader';
import { ThemeId, TouchPlayer } from '../types';
import { THEMES } from '../lib/themes';

export interface FingerGameBackgroundProps {
  theme: ThemeId;
  active?: boolean;
  gameState?: 'waiting' | 'countdown' | 'resolved';
  activeFingersCount?: number;
  minPlayers?: number;
  countdownSeconds?: number;
  touches?: TouchPlayer[];
  onVideoEnd?: () => void;
}

export const FingerGameBackground: React.FC<FingerGameBackgroundProps> = ({
  theme,
  active = true,
  gameState = 'waiting',
  activeFingersCount = 0,
  minPlayers = 2,
  countdownSeconds = 5,
  onVideoEnd,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const currentTheme = THEMES[theme] || THEMES['cyber-neon'];

  // Criteria states:
  // 1. Video is enabled ONLY when all players placed their fingers (during countdown)
  const isVideoActive = active && gameState === 'countdown';

  // 2. Moving ambience lights gradient at the bleed of the screen:
  // - During idle (no fingers placed): REMOVED (opacity-0, completely hidden)
  // - When placing fingers: surges with vibrant cyan, blue, magenta, purple gradient animation
  const hasFingersPlaced = active && (activeFingersCount > 0 || gameState === 'countdown');
  const ambienceIntensityClass = hasFingersPlaced
    ? 'opacity-100 pointer-events-none'
    : 'opacity-0 pointer-events-none';

  // Manage video playback rate and sync
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');

    if (isVideoActive) {
      // Calculate speed criteria:
      // Video length is exactly 10s.
      // 1. 5s countdown: speed up (2.0x) so 10s video finishes in 5s
      // 2. 8s countdown: normal speed (1.25x) so 10s video finishes in 8s
      // 3. 10s countdown: speed down (1.0x) so 10s video finishes in 10s
      let playbackRate = 1.0;
      if (countdownSeconds === 5) {
        playbackRate = 2.0; // Speed up
      } else if (countdownSeconds === 8) {
        playbackRate = 1.25; // Normal speed to match end duration
      } else if (countdownSeconds === 10) {
        playbackRate = 1.0; // Speed down to match end duration
      } else {
        playbackRate = 10.0 / Math.max(1, countdownSeconds);
      }

      video.currentTime = 0;
      video.playbackRate = playbackRate;
      video.play().catch(() => {
        // Fallback for strict browser autoplay
        const onInteract = () => {
          video.currentTime = 0;
          video.playbackRate = playbackRate;
          video.play().catch(() => {});
        };
        window.addEventListener('touchstart', onInteract, { once: true });
        window.addEventListener('click', onInteract, { once: true });
      });
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [isVideoActive, countdownSeconds]);

  // Pause when the whole roulette screen is inactive
  useEffect(() => {
    if (!active && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [active]);

  const handleEnded = () => {
    if (onVideoEnd) {
      onVideoEnd();
    }
  };

  return (
    <div
      className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none bg-black"
      style={{ backgroundColor: currentTheme.bgBase }}
    >
      {/* 1. Static Image Background: Finger Roulette Background.jpg */}
      {/* Active during idle and enabled back when video ends / round resolves */}
      <img
        src={getAssetUrl(rouletteBgImage)}
        alt="Finger Roulette Background"
        className={`absolute inset-0 w-full h-full object-cover object-center pointer-events-none z-0 transition-opacity duration-300 ${
          isVideoActive ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          filter: 'contrast(1.05) brightness(1.02)',
        }}
      />

      {/* 2. Top and Bottom Base Vignettes for Background Image Contrast */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 via-black/20 to-transparent pointer-events-none z-[1]" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/65 via-black/25 to-transparent pointer-events-none z-[1]" />

      {/* 3. Animated Video Background: Finger Roulette Background Animation.mp4 */}
      {/* Enabled when all players place their fingers, plays until finished, then disabled */}
      <video
        ref={videoRef}
        src={getAssetUrl(rouletteBgVideo)}
        preload="auto"
        muted
        playsInline
        disablePictureInPicture
        controls={false}
        onEnded={handleEnded}
        className={`absolute inset-0 w-full h-full object-cover object-center pointer-events-none z-[2] transition-opacity duration-300 ${
          isVideoActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{
          filter: 'contrast(1.06) brightness(1.03)',
        }}
      />

      {/* 4. Moving Ambience Lights Gradient at the Bleed of the Screen (Reduced & Animated Color Gradient) */}
      <div
        className={`absolute inset-0 pointer-events-none z-[3] overflow-hidden transition-opacity duration-300 ${ambienceIntensityClass}`}
      >
        {/* Outer Pulsing Container */}
        <div className="absolute inset-0 pointer-events-none animate-finger-bleed-pulse">
          {/* Inner Rotating Conic Aurora: Cyan -> Blue -> Magenta -> Purple -> Cyan (Restricted to edge rim) */}
          <div
            className="absolute left-1/2 top-1/2 w-[140vmax] h-[140vmax] pointer-events-none animate-finger-bleed-rotate"
            style={{
              background:
                'conic-gradient(from 0deg, #00f0ff 0deg, #2563eb 90deg, #ec4899 180deg, #8b5cf6 270deg, #00f0ff 360deg)',
              WebkitMaskImage:
                'radial-gradient(ellipse at center, transparent 72%, rgba(0, 0, 0, 0.4) 86%, black 98%)',
              maskImage:
                'radial-gradient(ellipse at center, transparent 72%, rgba(0, 0, 0, 0.4) 86%, black 98%)',
              filter: 'blur(16px)',
              mixBlendMode: 'screen',
              opacity: 0.85,
            }}
          />
        </div>

        {/* 4 Outer Edge Bleed Accent Light Beams: Cyan, Blue, Magenta, Purple ONLY */}
        {/* Top: Vibrant Cyan */}
        <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[#00f0ff]/35 via-[#00f0ff]/10 to-transparent pointer-events-none animate-finger-bleed-shimmer" />
        {/* Left: Electric Blue */}
        <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#2563eb]/30 via-[#2563eb]/08 to-transparent pointer-events-none animate-finger-bleed-shimmer" />
        {/* Bottom: Hot Magenta */}
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#ec4899]/35 via-[#ec4899]/10 to-transparent pointer-events-none animate-finger-bleed-shimmer" />
        {/* Right: Cyber Purple */}
        <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#8b5cf6]/30 via-[#8b5cf6]/08 to-transparent pointer-events-none animate-finger-bleed-shimmer" />

        {/* Perimeter Inset Aura with Active Color Gradient Cycling */}
        <div className="absolute inset-0 pointer-events-none animate-finger-bleed-glow" />

        {/* Flowing Perimeter Border Bleed Line with Cyan, Blue, Magenta, Purple Gradient Animation */}
        <div
          className="absolute inset-0 pointer-events-none border-[1.5px] border-transparent animate-finger-bleed-border"
          style={{
            background:
              'linear-gradient(135deg, #00f0ff, #2563eb, #ec4899, #8b5cf6, #00f0ff) border-box',
            WebkitMask:
              'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            opacity: 0.85,
            filter: 'drop-shadow(0 0 4px rgba(0,240,255,0.45))',
          }}
        />
      </div>
    </div>
  );
};


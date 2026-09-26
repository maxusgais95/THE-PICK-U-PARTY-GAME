/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import chibiFingersImg from '../assets/images/Chibi Fingers Game.webp';
import chibiBottleImg from '../assets/images/Chibi Spinning Bottle.webp';
import chibiBombImg from '../assets/images/Chibi Bomb Game.webp';
import chibiBombPongImg from '../assets/images/Chibi Bomb Pong Game.webp';
import { GameModeId } from '../lib/assetPreloader';
import { Loader2 } from 'lucide-react';

interface GamePreloaderProps {
  game: GameModeId | null;
  progress: number;
  statusText?: string;
}

interface GamePreloadConfig {
  title: string;
  subtitle: string;
  badge: string;
  thumbnail: string;
  btnGradient: string;
  borderColor: string;
  glowColor: string;
  badgeColor: string;
  accentText: string;
}

const GAME_CONFIGS: Record<GameModeId, GamePreloadConfig> = {
  roulette: {
    title: 'FINGER ROULETTE',
    subtitle: 'Place your fingers and let fate choose',
    badge: 'POPULAR',
    thumbnail: chibiFingersImg,
    btnGradient: 'linear-gradient(90deg, #00e5ff 0%, #06b6d4 30%, #a855f7 70%, #d946ef 100%)',
    borderColor: 'border-cyan-400',
    glowColor: 'rgba(6, 182, 212, 0.65)',
    badgeColor: 'linear-gradient(90deg, #06b6d4 0%, #38bdf8 50%, #00e5ff 100%)',
    accentText: 'text-cyan-300',
  },
  bottle: {
    title: 'SPIN THE BOTTLE',
    subtitle: 'Flick or tap to spin the bottle',
    badge: 'PARTY CLASSIC',
    thumbnail: chibiBottleImg,
    btnGradient: 'linear-gradient(90deg, #9333ea 0%, #a855f7 35%, #ec4899 75%, #f43f5e 100%)',
    borderColor: 'border-pink-500',
    glowColor: 'rgba(236, 72, 153, 0.65)',
    badgeColor: 'linear-gradient(90deg, #9333ea 0%, #ec4899 100%)',
    accentText: 'text-pink-300',
  },
  kaboom: {
    title: 'KABOOM',
    subtitle: "Avoid the bomb and don't get exploded",
    badge: 'NEW MODE',
    thumbnail: chibiBombImg,
    btnGradient: 'linear-gradient(90deg, #ef4444 0%, #f97316 50%, #ff5500 100%)',
    borderColor: 'border-orange-500',
    glowColor: 'rgba(249, 115, 22, 0.65)',
    badgeColor: 'linear-gradient(90deg, #ef4444 0%, #f97316 50%, #ea580c 100%)',
    accentText: 'text-orange-300',
  },
  pong: {
    title: 'BOMB PONG',
    subtitle: 'Slide to deflect the bomb and survive',
    badge: '2 PLAYERS',
    thumbnail: chibiBombPongImg,
    btnGradient: 'linear-gradient(90deg, #ec4899 0%, #a855f7 50%, #06b6d4 100%)',
    borderColor: 'border-fuchsia-500',
    glowColor: 'rgba(217, 70, 239, 0.65)',
    badgeColor: 'linear-gradient(90deg, #ec4899 0%, #d946ef 50%, #a855f7 100%)',
    accentText: 'text-fuchsia-300',
  },
};

export const GamePreloader: React.FC<GamePreloaderProps> = ({
  game,
  progress,
  statusText = 'Loading stage files...',
}) => {
  if (!game) return null;

  const config = GAME_CONFIGS[game] || GAME_CONFIGS.roulette;
  const clampedProgress = Math.max(0, Math.min(100, Math.round(progress)));

  return (
    <aside
      aria-label="Loading Game Mode"
      className="fixed inset-0 z-[120] flex flex-col items-center justify-between overflow-hidden select-none touch-none pt-[max(1.5rem,calc(env(safe-area-inset-top)+1rem))] pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))] px-6 sm:px-8 animate-fade-in"
    >
      {/* 1. Fullscreen Game Thumbnail Background with Dim & Blur */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <img
          src={config.thumbnail}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center scale-110 filter blur-2xl brightness-40 contrast-125"
        />
        {/* Dim & Blur Backdrop Overlay */}
        <div className="absolute inset-0 bg-black/65 backdrop-blur-md" />
        {/* Radial Dark Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_15%,rgba(0,0,0,0.85)_100%)]" />
      </div>

      {/* 2. Top Header Indicator */}
      <div className="relative z-10 w-full max-w-sm flex items-center justify-between pt-2">
        <div className="flex items-center space-x-2">
          <span
            className="w-2.5 h-2.5 rounded-full animate-ping"
            style={{ background: config.glowColor }}
          />
          <span className="text-[11px] font-mono tracking-widest uppercase text-white/80 font-semibold">
            Loading Stage
          </span>
        </div>
        <div
          className="px-2.5 py-0.5 rounded-full text-[9px] font-header font-black tracking-widest uppercase text-white shadow-md border border-white/30"
          style={{ background: config.badgeColor }}
        >
          {config.badge}
        </div>
      </div>

      {/* 3. Center Area: Full Frame Thumbnail (NO CROPPING) & Game Title */}
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center justify-center my-auto">
        {/* Full-Frame Thumbnail Display Card */}
        <div
          className={`relative w-full rounded-2xl overflow-hidden bg-black/40 border-[1.5px] ${config.borderColor} p-3 sm:p-4 flex flex-col items-center justify-center transition-transform duration-300 shadow-2xl`}
          style={{
            boxShadow: `0 0 35px ${config.glowColor}, inset 0 0 15px rgba(0,0,0,0.6)`,
          }}
        >
          {/* Full frame image: strictly object-contain, natural ratio, no cropping */}
          <div className="w-full flex items-center justify-center overflow-hidden rounded-xl bg-black/20 py-2">
            <img
              src={config.thumbnail}
              alt={config.title}
              className="w-auto h-auto max-h-[36vh] sm:max-h-[40vh] max-w-full object-contain select-none pointer-events-none drop-shadow-[0_12px_28px_rgba(0,0,0,0.85)]"
            />
          </div>

          {/* Title & Subtitle */}
          <div className="mt-3 text-center w-full px-2">
            <h2 className="font-header font-black text-xl sm:text-2xl tracking-wider uppercase text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
              {config.title}
            </h2>
            <p className="text-xs sm:text-sm text-white/80 font-medium tracking-wide mt-0.5 line-clamp-1">
              {config.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* 4. Bottom Area: Program Bar with Matching Game Mode Button Gradient */}
      <div className="relative z-10 w-full max-w-sm flex flex-col space-y-2.5 pb-4">
        {/* Percentage and Status text */}
        <div className="flex items-center justify-between text-xs px-1 font-mono">
          <div className="flex items-center space-x-2 text-white/90">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-white/70" />
            <span className="truncate max-w-[210px] text-[11px] sm:text-xs">
              {statusText}
            </span>
          </div>
          <span className={`font-black text-sm tracking-wider ${config.accentText}`}>
            {clampedProgress}%
          </span>
        </div>

        {/* The Program / Progress Bar matching Game Mode Button Gradient */}
        <div className="relative w-full h-3.5 sm:h-4 bg-black/70 border border-white/25 rounded-full overflow-hidden p-0.5 shadow-inner">
          <div
            className="h-full rounded-full transition-all duration-200 ease-out relative overflow-hidden"
            style={{
              width: `${clampedProgress}%`,
              background: config.btnGradient,
              boxShadow: `0 0 16px ${config.glowColor}`,
            }}
          >
            {/* Animated light sheen across the bar */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent animate-shimmer" />
          </div>
        </div>

        <div className="text-center">
          <p className="text-[10px] text-white/50 tracking-wider font-mono uppercase">
            Buffering GPU textures & zero-lag assets
          </p>
        </div>
      </div>
    </aside>
  );
};

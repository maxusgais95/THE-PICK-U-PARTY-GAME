/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { KaboomGridDimension } from '../../types';
import { SoundEngine, Haptics } from '../../lib/audio';
import chibiBombImg from '../../assets/images/Chibi Bomb Game.webp';
import quickModeBg from '../../assets/images/Quick Mode Background.jpeg';
import classicModeBg from '../../assets/images/Classic Mode Background.jpeg';
import extremeModeBg from '../../assets/images/Extreme Mode Background.jpeg';
import chaosModeBg from '../../assets/images/Chaos Mode Background.jpeg';
import ultimateModeBg from '../../assets/images/Ultimate Mode Background.jpeg';

// Preload the image assets at module level so the browser caches and never re-fetches
if (typeof window !== 'undefined') {
  [quickModeBg, classicModeBg, extremeModeBg, chaosModeBg, ultimateModeBg, chibiBombImg].forEach((src) => {
    const imgPreload = new Image();
    imgPreload.src = src;
  });
}

interface KaboomBoardSelectionProps {
  onSelectGrid: (dimension: KaboomGridDimension) => void;
  onBackToHub?: () => void;
}

interface CardConfig {
  dim: KaboomGridDimension;
  label: string;
  dimText: string;
  bgImage: string;
  bottomGradient: string;
  borderColor: string;
  hoverBorderColor: string;
  glowStyle: string;
  hoverGlowStyle: string;
  bgPosition?: string;
  isWide?: boolean;
}

// Cards configured with their respective custom background artwork
const CARDS: CardConfig[] = [
  {
    dim: 2,
    label: 'QUICK',
    dimText: '2 X 2',
    bgImage: quickModeBg,
    bottomGradient: 'linear-gradient(to top, rgba(3, 7, 18, 0.88) 0%, rgba(0, 210, 255, 0.35) 45%, transparent 85%)',
    borderColor: 'border-[#00e5ff]/60',
    hoverBorderColor: 'hover:border-[#00f0ff]',
    glowStyle: '0 0 20px rgba(0, 229, 255, 0.4), 0 8px 25px rgba(0, 0, 0, 0.7)',
    hoverGlowStyle: '0 0 35px rgba(0, 240, 255, 0.7), 0 10px 30px rgba(0, 0, 0, 0.85)',
    bgPosition: 'center',
  },
  {
    dim: 3,
    label: 'CLASSIC',
    dimText: '3 X 3',
    bgImage: classicModeBg,
    bottomGradient: 'linear-gradient(to top, rgba(3, 7, 18, 0.88) 0%, rgba(30, 80, 255, 0.35) 45%, transparent 85%)',
    borderColor: 'border-[#1e50ff]/60',
    hoverBorderColor: 'hover:border-[#3b82f6]',
    glowStyle: '0 0 20px rgba(30, 80, 255, 0.45), 0 8px 25px rgba(0, 0, 0, 0.7)',
    hoverGlowStyle: '0 0 35px rgba(59, 130, 246, 0.7), 0 10px 30px rgba(0, 0, 0, 0.85)',
    bgPosition: 'center',
  },
  {
    dim: 4,
    label: 'EXTREME',
    dimText: '4 X 4',
    bgImage: extremeModeBg,
    bottomGradient: 'linear-gradient(to top, rgba(3, 7, 18, 0.88) 0%, rgba(255, 0, 127, 0.35) 45%, transparent 85%)',
    borderColor: 'border-[#ff007f]/60',
    hoverBorderColor: 'hover:border-[#ff3399]',
    glowStyle: '0 0 20px rgba(255, 0, 127, 0.45), 0 8px 25px rgba(0, 0, 0, 0.7)',
    hoverGlowStyle: '0 0 35px rgba(255, 0, 127, 0.7), 0 10px 30px rgba(0, 0, 0, 0.85)',
    bgPosition: 'center',
  },
  {
    dim: 5,
    label: 'CHAOS',
    dimText: '5 X 5',
    bgImage: chaosModeBg,
    bottomGradient: 'linear-gradient(to top, rgba(3, 7, 18, 0.88) 0%, rgba(168, 85, 247, 0.35) 45%, transparent 85%)',
    borderColor: 'border-[#a855f7]/60',
    hoverBorderColor: 'hover:border-[#c084fc]',
    glowStyle: '0 0 20px rgba(168, 85, 247, 0.45), 0 8px 25px rgba(0, 0, 0, 0.7)',
    hoverGlowStyle: '0 0 35px rgba(168, 85, 247, 0.75), 0 10px 30px rgba(0, 0, 0, 0.85)',
    bgPosition: 'center',
  },
  {
    dim: 6,
    label: 'ULTIMATE',
    dimText: '6 X 6',
    bgImage: ultimateModeBg,
    bottomGradient: 'linear-gradient(to top, rgba(3, 7, 18, 0.88) 0%, rgba(255, 123, 0, 0.35) 45%, transparent 85%)',
    borderColor: 'border-[#ff7b00]/70',
    hoverBorderColor: 'hover:border-[#fb923c]',
    glowStyle: '0 0 25px rgba(255, 123, 0, 0.5), 0 8px 25px rgba(0, 0, 0, 0.7)',
    hoverGlowStyle: '0 0 40px rgba(255, 123, 0, 0.8), 0 10px 30px rgba(0, 0, 0, 0.85)',
    bgPosition: 'center',
    isWide: true,
  },
];

export const KaboomBoardSelection: React.FC<KaboomBoardSelectionProps> = ({
  onSelectGrid,
}) => {
  const handleCardClick = (dim: KaboomGridDimension) => {
    SoundEngine.playButtonClick();
    Haptics.buttonClick();
    onSelectGrid(dim);
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-y-auto custom-scrollbar bg-[#070312] text-white select-none">
      {/* Top Hero Art Banner Background (Hardware accelerated CSS background, never flashes) */}
      <div
        className="absolute top-0 left-0 right-0 h-72 sm:h-80 bg-cover bg-top pointer-events-none z-0 filter brightness-110 contrast-105"
        style={{
          backgroundImage: `url("${chibiBombImg}")`,
        }}
      >
        {/* Seamless gradient fade from the bottom of the hero banner into deep canvas */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#070312]/50 to-[#070312]" />
      </div>

      {/* Main Content Container: Grouped so header sits slightly above board panels */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md mx-auto flex flex-col justify-center min-h-full px-4 pt-[max(5.5rem,calc(env(safe-area-inset-top)+4rem))] pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))]">
        {/* Header: SELECT BOARD & Subtitle directly above board panels */}
        <div className="text-center mb-3 sm:mb-4">
          <h1 className="font-header text-3xl sm:text-4xl font-bold tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-orange-300 to-red-400 drop-shadow-[0_2px_12px_rgba(249,115,22,0.6)] drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] leading-tight py-1">
            SELECT BOARD
          </h1>
          <p className="font-body text-xs sm:text-sm font-medium text-white/90 mt-0.5 tracking-wide drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]">
            Pick your grid size and take turns tapping balls!
          </p>
        </div>

        {/* Board Cards Grid: Consistent Card Height across all options */}
        <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
          {CARDS.map((card) => {
            const isWide = card.isWide;

            return (
              <div
                key={card.dim}
                id={`kaboom-board-card-${card.dim}`}
                onClick={() => handleCardClick(card.dim)}
                className={`group relative overflow-hidden rounded-[24px] cursor-pointer transition-all duration-200 border-2 ${card.borderColor} ${card.hoverBorderColor} active:scale-[0.97] ${
                  isWide ? 'col-span-2' : 'col-span-1'
                } h-34 sm:h-38 flex flex-col justify-end items-center text-center p-3 sm:p-3.5`}
                style={{
                  boxShadow: card.glowStyle,
                }}
              >
                {/* Card Background Art using CSS background - 0 reload/rebuff, GPU composited */}
                <div
                  className="absolute inset-0 z-0 bg-cover pointer-events-none filter brightness-95 group-hover:scale-105 transition-transform duration-300"
                  style={{
                    backgroundImage: `url("${card.bgImage}")`,
                    backgroundPosition: card.bgPosition || 'center',
                  }}
                />

                {/* Bottom Color Wash Gradient matched from game theme */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: card.bottomGradient,
                  }}
                />

                {/* Subtle top vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-black/30 pointer-events-none" />

                {/* Dynamic hover glow overlay for instant tactile feedback */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{
                    boxShadow: `inset ${card.hoverGlowStyle}`,
                  }}
                />

                {/* Card Content: Mode Title + Giant Rounded Dimension */}
                <div className="relative z-10 flex flex-col items-center justify-center leading-none">
                  {/* Mode Label (QUICK, CLASSIC, EXTREME, CHAOS, ULTIMATE) */}
                  <div className="font-header text-lg sm:text-xl font-bold tracking-wider text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] mb-0.5">
                    {card.label}
                  </div>

                  {/* Dimension Text (2 X 2, 3 X 3, 4 X 4, 5 X 5, 6 X 6) */}
                  <div className="font-header text-3xl sm:text-4xl font-bold text-white tracking-normal drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
                    {card.dimText}
                  </div>

                  {/* Star Earnings Indicator (Smaller board earns less stars) */}
                  <div className="mt-1.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/70 border border-amber-400/50 text-[10px] sm:text-[11px] font-header font-bold text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.3)]">
                    <span>+{card.dim === 2 ? 10 : card.dim === 3 ? 20 : card.dim === 4 ? 35 : card.dim === 5 ? 50 : 75}★</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Subtle bottom spacing placeholder for balanced vertical rhythm */}
        <div className="h-4" />
      </div>
    </div>
  );
};

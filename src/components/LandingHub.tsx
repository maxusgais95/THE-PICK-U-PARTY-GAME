/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import pickuPartyLogo from '../assets/images/PICKU_PARTY_LOGO_E01.webp';
import chibiFingersImg from '../assets/images/Chibi Fingers Game.webp';
import chibiBottleImg from '../assets/images/Chibi Spinning Bottle.webp';
import chibiBombImg from '../assets/images/Chibi Bomb Game.webp';
import { getAssetUrl } from '../lib/assetPreloader';
import { AppSettings, AppStats } from '../types';
import { SoundEngine, Haptics } from '../lib/audio';
import { LeftSidebarStack } from './LeftSidebarStack';
import { DailyQuestsWidget } from './DailyQuestsWidget';
import { EconomyState, getDailyRewardStatus } from '../lib/economy';

interface LandingHubProps {
  settings: AppSettings;
  economy?: EconomyState;
  stats?: AppStats;
  onSelectRoulette: () => void;
  onSelectBottle: () => void;
  onSelectKaboom?: () => void;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onOpenVersionNotes?: () => void;
  onOpenStore?: () => void;
  onOpenDailyQuests?: () => void;
  onOpenAchievements?: () => void;
  onOpenRewards?: () => void;
}

interface GameCard {
  id: string;
  title: string;
  subtitle: string;
  buttonText: string;
  image: string;
  badge?: string;
  borderColor: string;
  shadowColor: string;
  btnGradient: string;
  titleGradient: string;
  subGradient: string;
  badgeGradient: string;
  onClick: (e: React.MouseEvent) => void;
}

export const LandingHub: React.FC<LandingHubProps> = ({
  economy,
  stats,
  onSelectRoulette,
  onSelectBottle,
  onSelectKaboom,
  onOpenVersionNotes,
  onOpenStore,
  onOpenDailyQuests,
  onOpenAchievements,
  onOpenRewards,
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Touch/Drag physics refs
  const [dragOffset, setDragOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);
  const isDragging = useRef(false);

  const handleTitleClick = () => {
    SoundEngine.playButtonClick();
    Haptics.buttonClick();
  };

  const handleKaboomClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    SoundEngine.playButtonClick();
    Haptics.buttonClick();
    setToastMessage("💣 KABOOM Mode Coming Soon! Get ready...");
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Card definitions
  const cards: GameCard[] = [
    {
      id: 'roulette',
      title: 'FINGER ROULETTE',
      subtitle: 'Place your finger and have fun',
      buttonText: 'PLAY PICKER',
      image: chibiFingersImg,
      badge: 'Popular',
      borderColor: 'border-cyan-400',
      shadowColor: 'shadow-[0_0_24px_rgba(6,182,212,0.45)]',
      btnGradient: 'linear-gradient(90deg, #00e5ff 0%, #06b6d4 30%, #a855f7 70%, #d946ef 100%)',
      titleGradient: 'from-cyan-200 via-sky-300 to-fuchsia-300',
      subGradient: 'from-cyan-100 via-white to-sky-200',
      badgeGradient: 'linear-gradient(90deg, #06b6d4 0%, #38bdf8 50%, #00e5ff 100%)',
      onClick: () => {
        SoundEngine.playButtonClick();
        Haptics.buttonClick();
        onSelectRoulette();
      },
    },
    {
      id: 'bottle',
      title: 'SPIN THE BOTTLE',
      subtitle: 'Flick or tap to spin the bottle',
      buttonText: 'SPIN BOTTLE',
      image: chibiBottleImg,
      borderColor: 'border-pink-500',
      shadowColor: 'shadow-[0_0_24px_rgba(236,72,153,0.45)]',
      btnGradient: 'linear-gradient(90deg, #9333ea 0%, #a855f7 35%, #ec4899 75%, #f43f5e 100%)',
      titleGradient: 'from-pink-200 via-rose-300 to-purple-300',
      subGradient: 'from-pink-100 via-white to-purple-200',
      badgeGradient: '',
      onClick: () => {
        SoundEngine.playButtonClick();
        Haptics.buttonClick();
        onSelectBottle();
      },
    },
    {
      id: 'kaboom',
      title: 'KABOOM',
      subtitle: "Avoid the bomb and don't get exploded",
      buttonText: "LET'S GO",
      image: chibiBombImg,
      badge: 'NEW MODE',
      borderColor: 'border-orange-500',
      shadowColor: 'shadow-[0_0_24px_rgba(249,115,22,0.45)]',
      btnGradient: 'linear-gradient(90deg, #ef4444 0%, #f97316 50%, #ff5500 100%)',
      titleGradient: 'from-amber-200 via-orange-300 to-red-400',
      subGradient: 'from-amber-100 via-white to-orange-200',
      badgeGradient: 'linear-gradient(90deg, #ef4444 0%, #f97316 50%, #ea580c 100%)',
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        SoundEngine.playButtonClick();
        Haptics.buttonClick();
        if (onSelectKaboom) {
          onSelectKaboom();
        } else {
          handleKaboomClick(e);
        }
      },
    },
  ];

  // Infinite circular index wrapping
  const getWrappedIndex = (index: number) => {
    const total = cards.length;
    return ((index % total) + total) % total;
  };

  // --- Touch & Mouse Drag Handlers ---
  const handleTouchStart = (clientX: number) => {
    isDragging.current = true;
    startX.current = clientX;
    currentX.current = clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (clientX: number) => {
    if (!isDragging.current) return;
    currentX.current = clientX;
    const deltaX = clientX - startX.current;
    setDragOffset(deltaX);
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    setIsSwiping(false);

    const deltaX = currentX.current - startX.current;
    const threshold = 60;

    if (deltaX < -threshold) {
      SoundEngine.playButtonClick();
      Haptics.buttonClick();
      setCurrentIndex((prev) => getWrappedIndex(prev + 1));
    } else if (deltaX > threshold) {
      SoundEngine.playButtonClick();
      Haptics.buttonClick();
      setCurrentIndex((prev) => getWrappedIndex(prev - 1));
    }
    setDragOffset(0);
  };

  const handleDotClick = (targetIndex: number) => {
    SoundEngine.playButtonClick();
    Haptics.buttonClick();
    setCurrentIndex(targetIndex);
  };

  return (
    <div className="relative w-full h-full max-w-md mx-auto overflow-hidden select-none">
      <style>{`
        @keyframes subtleScaleBounce {
          0%, 100% { transform: scale(1.02); }
          50% { transform: scale(0.98); }
        }
        .animate-subtle-bounce {
          animation: subtleScaleBounce 2.5s ease-in-out infinite;
        }
      `}</style>

      {/* Dim Overlay Only (No Blur) */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-1/2 pointer-events-none z-0"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.75) 50%, rgba(0,0,0,0.92) 100%)',
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-[max(5.75rem,calc(env(safe-area-inset-top)+4.75rem))] left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="px-4 py-2 rounded-full bg-orange-600/90 text-white font-bold text-xs shadow-[0_0_20px_rgba(249,115,22,0.6)] border border-orange-300/80 backdrop-blur-md flex items-center gap-2">
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Benchmark Reference UI (Improve_game_UI_layout_2K_202609091537.jpeg) Side Widgets */}
      {/* 1. Left Sidebar Stack: STORE, TROPHIES, REWARDS, ADMIN */}
      <div className="absolute top-[max(6.25rem,calc(env(safe-area-inset-top)+5rem))] left-3 sm:left-4 z-30 flex flex-col">
        <LeftSidebarStack
          onOpenStore={onOpenStore || (() => {})}
          onOpenAchievements={onOpenAchievements || (() => {})}
          onOpenRewards={onOpenRewards || (() => {})}
          hasDailyRewardReady={economy ? getDailyRewardStatus(economy).canClaimToday : false}
          economy={economy}
          stats={stats}
        />
      </div>

      {/* 2. Top-Right Daily Quests Widget */}
      {economy && (
        <div className="absolute top-[max(6.25rem,calc(env(safe-area-inset-top)+5rem))] right-3 sm:right-4 z-30 flex flex-col items-end">
          <DailyQuestsWidget
            quests={economy.dailyQuests}
            milestoneChestClaimed={economy.milestoneChestClaimed}
            onOpenQuests={onOpenDailyQuests || (() => {})}
          />
        </div>
      )}

      {/* Header Container: Subtitle bottom edge rests at 57.5% */}
      <div className="absolute top-[57.5%] -translate-y-full left-0 right-0 z-20 flex flex-col items-center px-4">
        {/* Title Logo (x1.2 scale) */}
        <div
          onClick={handleTitleClick}
          className="relative w-full max-w-[384px] sm:max-w-[432px] flex items-center justify-center cursor-pointer group mb-1"
          title="PICK'U PARTY"
        >
          <div className="relative w-full flex items-center justify-center animate-title-sweep-pulse">
            <img
              src={getAssetUrl(pickuPartyLogo)}
              alt="PICK'U PARTY"
              className="w-full h-auto max-h-[77px] sm:max-h-[91px] object-contain select-none pointer-events-none"
              style={{ mixBlendMode: 'screen' }}
            />
          </div>
        </div>

        {/* Subtitle */}
        <p className="text-[13px] sm:text-[15px] font-semibold tracking-wide text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] my-0">
          Swipe to select a game mode
        </p>
      </div>

      {/* Game Cards Container: Aligned 3% below the subtitle anchor (57.5% + 3% = 60.5%) */}
      <div 
        className="absolute top-[60.5%] left-0 right-0 z-20 flex flex-col items-center touch-pan-y"
        onTouchStart={(e) => handleTouchStart(e.touches[0].clientX)}
        onTouchMove={(e) => handleTouchMove(e.touches[0].clientX)}
        onTouchEnd={handleTouchEnd}
        onMouseDown={(e) => handleTouchStart(e.clientX)}
        onMouseMove={(e) => handleTouchMove(e.clientX)}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
      >
        {/* Card Carousel Stage */}
        <div className="relative w-full h-[216px] sm:h-[240px] flex items-center justify-center overflow-hidden">
          {[-1, 0, 1].map((offset) => {
            const cardIndex = getWrappedIndex(currentIndex + offset);
            const card = cards[cardIndex];
            const isCenter = offset === 0;

            const cardWidth = 360;
            const translateX = offset * cardWidth + dragOffset;

            return (
              <div
                key={`${card.id}-${offset}`}
                className={`absolute w-[90vw] max-w-[372px] aspect-video transition-transform ${
                  isSwiping ? 'duration-0' : 'duration-300 ease-out'
                }`}
                style={{
                  transform: `translateX(${translateX}px) scale(${
                    isCenter ? (Math.abs(dragOffset) > 20 ? 0.98 : 1) : 0.85
                  })`,
                  opacity: isCenter ? 1 : 0.4,
                  zIndex: isCenter ? 30 : 10,
                }}
              >
                <div
                  onClick={(e) => {
                    if (Math.abs(dragOffset) < 10 && isCenter) {
                      card.onClick(e);
                    }
                  }}
                  className={`relative rounded-[24px] p-4 bg-black/50 border-[1.5px] ${card.borderColor} ${card.shadowColor} flex flex-col items-center justify-end text-center cursor-pointer overflow-hidden w-full h-full transition-all duration-300 ${
                    isCenter && !isSwiping ? 'animate-subtle-bounce' : ''
                  }`}
                >
                  {/* Ribbon Badge */}
                  {card.badge && (
                    <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden pointer-events-none z-20">
                      <div
                        className="absolute top-[18px] -right-[34px] w-[124px] transform rotate-45 py-0.5 text-center font-header font-bold tracking-widest text-[8.5px] uppercase shadow-[0_2px_8px_rgba(0,0,0,0.6)] border-y border-white/50"
                        style={{
                          background: card.badgeGradient,
                          color: '#ffffff',
                        }}
                      >
                        {card.badge}
                      </div>
                    </div>
                  )}

                  {/* Card Background Image */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                    <img
                      src={getAssetUrl(card.image)}
                      alt={card.title}
                      className="w-full h-full object-cover object-top select-none"
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        background: 'linear-gradient(to bottom, transparent 35%, rgba(0,0,0,0.85) 100%)',
                      }}
                    />
                  </div>

                  {/* Card Actions */}
                  <div className="relative z-10 flex flex-col items-center w-full mt-auto">
                    <h2 className={`text-base sm:text-lg font-header font-bold tracking-wider uppercase bg-gradient-to-r ${card.titleGradient} bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] leading-tight`}>
                      {card.title}
                    </h2>
                    <p className={`text-[11px] sm:text-xs font-body font-semibold tracking-normal bg-gradient-to-r ${card.subGradient} bg-clip-text text-transparent mt-0.5 mb-2 leading-tight`}>
                      {card.subtitle}
                    </p>
                    <button
                      type="button"
                      className="relative w-full h-8 sm:h-9 rounded-full flex items-center justify-center shadow-[0_3px_14px_rgba(0,0,0,0.4)] border-[1.2px] border-white/70"
                      style={{ background: card.btnGradient }}
                    >
                      <span className="relative z-20 text-[11px] sm:text-xs font-header font-bold tracking-wider text-white uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                        {card.buttonText}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dynamic Indicator Dots */}
        <div className="flex items-center gap-2 mt-2 z-20">
          {cards.map((_, i) => (
            <button
              key={i}
              onClick={() => handleDotClick(i)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                currentIndex === i
                  ? 'w-7 bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)]'
                  : 'w-2.5 bg-white/30 hover:bg-white/50'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Footer Version Notes & Admin Link */}
      <div className="absolute bottom-[18px] left-0 right-0 flex items-center justify-center gap-4 select-none z-20">
        <button
          type="button"
          onClick={() => {
            SoundEngine.playButtonClick();
            Haptics.buttonClick();
            if (onOpenVersionNotes) onOpenVersionNotes();
          }}
          className="font-subbody text-[10px] sm:text-[11px] text-gray-300/80 hover:text-cyan-300 transition-colors tracking-wide cursor-pointer focus:outline-none py-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] flex items-center gap-1.5"
          title="Version Notes • v1.4.03"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#00f0ff] animate-pulse" />
          <span>v1.4.03 • Version Notes</span>
        </button>
      </div>
    </div>
  );
};

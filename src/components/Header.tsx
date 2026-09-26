/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Settings, Home, Maximize, Minimize, Info, BookOpen, Disc, Bomb } from 'lucide-react';
import { ChampagneBottleIcon } from './ChampagneBottleIcon';
import { CurrencyHud } from './CurrencyHud';
import { AppSettings, ScreenView } from '../types';
import { THEMES } from '../lib/themes';
import { SoundEngine, Haptics } from '../lib/audio';
import { EconomyState } from '../lib/economy';

interface HeaderProps {
  currentView: ScreenView;
  settings: AppSettings;
  stars?: number;
  onNavigate: (view: ScreenView) => void;
  onOpenSettings: (tab?: 'game' | 'bottle' | 'stats') => void;
  onOpenStore?: () => void;
  onOpenInfo?: () => void;
  onOpenGuide?: () => void;
  onToggleSound?: () => void;
  onToggleHaptics: () => void;
  onToggleBottleSprite?: () => void;
  onToggleBallSkin?: () => void;
  onToggleBombSkin?: () => void;
  onEconomyUpdated?: (state: EconomyState) => void;
  onRefillStars?: (amount: number) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  settings,
  stars = 1250,
  onNavigate,
  onOpenSettings,
  onOpenStore,
  onOpenInfo,
  onOpenGuide,
  onToggleSound,
  onToggleHaptics,
  onToggleBottleSprite,
  onToggleBallSkin,
  onToggleBombSkin,
  onEconomyUpdated,
  onRefillStars,
}) => {
  const [isFullscreen, setIsFullscreen] = React.useState<boolean>(false);
  const [supportsFullscreen, setSupportsFullscreen] = React.useState<boolean>(true);
  const currentTheme = THEMES[settings.theme] || THEMES['cyber-neon'];

  React.useEffect(() => {
    const doc = document as any;
    const docEl = document.documentElement as any;

    const hasFullscreenCapability = Boolean(
      docEl.requestFullscreen ||
      docEl.webkitRequestFullscreen ||
      docEl.mozRequestFullScreen ||
      docEl.msRequestFullscreen
    );
    setSupportsFullscreen(hasFullscreenCapability);

    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = Boolean(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    SoundEngine.playButtonClick();
    Haptics.buttonClick();
    const doc = document as any;
    const docEl = document.documentElement as any;

    const isCurrentlyFullscreen = Boolean(
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
    );

    if (!isCurrentlyFullscreen) {
      const requestMethod =
        docEl.requestFullscreen ||
        docEl.webkitRequestFullscreen ||
        docEl.mozRequestFullScreen ||
        docEl.msRequestFullscreen;

      if (typeof requestMethod === 'function') {
        try {
          const promise = requestMethod.call(docEl);
          if (promise && typeof promise.then === 'function') {
            promise.then(() => setIsFullscreen(true)).catch(() => {});
          } else {
            setIsFullscreen(true);
          }
        } catch {}
      }
    } else {
      const exitMethod =
        doc.exitFullscreen ||
        doc.webkitExitFullscreen ||
        doc.mozCancelFullScreen ||
        doc.msExitFullscreen;

      if (typeof exitMethod === 'function') {
        try {
          const promise = exitMethod.call(doc);
          if (promise && typeof promise.then === 'function') {
            promise.then(() => setIsFullscreen(false)).catch(() => {});
          } else {
            setIsFullscreen(false);
          }
        } catch {}
      }
    }
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-3 sm:px-4 pt-[max(2rem,calc(env(safe-area-inset-top)+1rem))] pb-2 pointer-events-none">
      {/* Left Action Buttons (Compact, non-overlapping) */}
      <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto z-40">
        {currentView !== 'hub' ? (
          <button
            onClick={() => {
              SoundEngine.playButtonClick();
              Haptics.buttonClick();
              onNavigate('hub');
            }}
            aria-label="Return to Hub"
            className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-[14px] sm:rounded-[16px] bg-black/50 backdrop-blur-md border border-purple-400/40 shadow-[0_0_12px_rgba(168,85,247,0.25)] flex items-center justify-center text-purple-300 hover:border-purple-300 active:scale-95 transition-all"
          >
            <Home className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.2] text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
          </button>
        ) : null}
      </div>

      {/* Locked Center Currency HUD - Mathematically locked to horizontal center on all pages */}
      <div className="absolute left-1/2 -translate-x-1/2 top-[max(2rem,calc(env(safe-area-inset-top)+1rem))] pointer-events-auto z-50 flex items-center justify-center">
        <CurrencyHud
          stars={stars}
          onOpenStore={onOpenStore || (() => onOpenSettings('bottle'))}
        />
      </div>

      {/* Right Action Buttons (Compact, non-overlapping) */}
      <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto z-40">
        {/* Bottle Sprite Quick Switcher in Bottle Mode */}
        {currentView === 'bottle' && onToggleBottleSprite && (
          <button
            onClick={() => {
              SoundEngine.playButtonClick();
              Haptics.buttonClick();
              onToggleBottleSprite();
            }}
            aria-label="Switch Bottle Sprite"
            className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-[14px] sm:rounded-[16px] bg-black/50 backdrop-blur-md border border-pink-400/50 shadow-[0_0_12px_rgba(236,72,153,0.3)] flex items-center justify-center text-pink-300 active:scale-95 transition-all"
          >
            <ChampagneBottleIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-pink-300 drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]" />
          </button>
        )}

        {/* Bomb Skin Quick Switcher in Kaboom Mode */}
        {currentView === 'kaboom' && onToggleBombSkin && (
          <button
            onClick={() => {
              SoundEngine.playButtonClick();
              Haptics.buttonClick();
              onToggleBombSkin();
            }}
            aria-label="Switch Bomb Skin"
            title="Switch Bomb Skin"
            className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-[14px] sm:rounded-[16px] bg-black/50 backdrop-blur-md border border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.3)] flex items-center justify-center text-red-300 active:scale-95 transition-all cursor-pointer"
          >
            <Bomb className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
          </button>
        )}

        {/* Ball Skin Quick Switcher in Kaboom Mode */}
        {currentView === 'kaboom' && onToggleBallSkin && (
          <button
            onClick={() => {
              SoundEngine.playButtonClick();
              Haptics.buttonClick();
              onToggleBallSkin();
            }}
            aria-label="Switch Ball Skin"
            title="Switch Ball Skin"
            className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-[14px] sm:rounded-[16px] bg-black/50 backdrop-blur-md border border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.3)] flex items-center justify-center text-cyan-300 active:scale-95 transition-all cursor-pointer"
          >
            <Disc className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
          </button>
        )}

        {/* Fullscreen Button (in game modes) */}
        {currentView !== 'hub' && supportsFullscreen && (
          <button
            onClick={toggleFullscreen}
            aria-label="Toggle Fullscreen"
            className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-[14px] sm:rounded-[16px] bg-black/50 backdrop-blur-md border border-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.25)] flex items-center justify-center text-cyan-300 active:scale-95 transition-all"
          >
            {isFullscreen ? (
              <Minimize className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.2] drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            ) : (
              <Maximize className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.2] drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            )}
          </button>
        )}

        {/* Game Guide Button - Top right next to Settings */}
        {(onOpenGuide || onOpenInfo) && (
          <button
            onClick={() => {
              SoundEngine.playButtonClick();
              Haptics.buttonClick();
              if (onOpenGuide) {
                onOpenGuide();
              } else if (onOpenInfo) {
                onOpenInfo();
              }
            }}
            aria-label="Game Guide & How to Play"
            title="Game Guide (How to Play & Tips)"
            className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-[14px] sm:rounded-[16px] bg-black/50 backdrop-blur-md border border-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.25)] flex items-center justify-center text-cyan-300 hover:border-cyan-300 active:scale-95 transition-all"
          >
            <BookOpen className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.2] drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
          </button>
        )}

        {/* Settings Gear Button */}
        <button
          onClick={() => {
            SoundEngine.playButtonClick();
            Haptics.buttonClick();
            onOpenSettings();
          }}
          aria-label="Open Settings"
          className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-[14px] sm:rounded-[16px] bg-black/50 backdrop-blur-md border border-purple-400/40 shadow-[0_0_12px_rgba(168,85,247,0.25)] flex items-center justify-center text-purple-300 hover:border-purple-300 active:scale-95 transition-all"
        >
          <Settings className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.2] drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
        </button>
      </div>
    </header>
  );
};

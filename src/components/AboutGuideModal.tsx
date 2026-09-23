/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Zap,
  RotateCw,
  Bomb,
  Lightbulb,
  Star,
  Shield,
  Radio,
  Shuffle,
  Users,
  CheckCircle2,
  Trophy,
  Calendar,
  Layers,
  Palette,
  Check,
  Smartphone,
  ChevronRight,
} from 'lucide-react';
import { SoundEngine, Haptics } from '../lib/audio';
import { EconomyState } from '../lib/economy';
import appIconImg from '../assets/images/PICKU_PARTY_APP_ICON.webp';

export interface AboutGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: TabKey;
  economy?: EconomyState;
  onEconomyUpdated?: (state: EconomyState) => void;
  onNavigateToGame?: (game: 'roulette' | 'bottle' | 'kaboom') => void;
  onOpenStore?: () => void;
}

export type TabKey = 'modes' | 'tips' | 'stars';

export const AboutGuideModal: React.FC<AboutGuideModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'modes',
  economy,
  onEconomyUpdated,
  onNavigateToGame,
  onOpenStore,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center pt-[max(2.25rem,calc(env(safe-area-inset-top)+1.25rem))] pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))] px-3 sm:px-4 bg-black/80 backdrop-blur-xl animate-fadeIn select-none">
      <div
        className="relative w-full max-w-md max-h-full rounded-[28px] bg-slate-950/95 border border-cyan-500/40 p-4 sm:p-5 shadow-[0_0_50px_rgba(6,182,212,0.35)] flex flex-col text-white overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <img
              src={appIconImg}
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.dataset.fallback) {
                  target.dataset.fallback = 'true';
                  target.src = `${import.meta.env.BASE_URL || './'}apple-touch-icon.png`;
                }
              }}
              alt="PICK'U PARTY Icon"
              className="w-8 h-8 rounded-xl object-cover border border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.4)]"
            />
            <div>
              <h2 className="font-header text-base font-bold uppercase tracking-wider text-white flex items-center gap-1.5 leading-none">
                <span>PICK'U PARTY</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-header font-bold tracking-wider">
                  GUIDE
                </span>
              </h2>
              <p className="font-subbody text-[11px] text-gray-400 mt-0.5">
                How to Play, Party Tips & Star Economy
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              SoundEngine.playButtonClick();
              Haptics.buttonClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Close Game Guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs - 3 Distinct Guide Categories */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/40 rounded-2xl border border-white/10 my-3">
          <button
            type="button"
            onClick={() => {
              SoundEngine.playButtonClick();
              Haptics.buttonClick();
              setActiveTab('modes');
            }}
            className={`py-2 px-1 rounded-xl text-xs font-header font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'modes'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Game Modes</span>
          </button>

          <button
            type="button"
            onClick={() => {
              SoundEngine.playButtonClick();
              Haptics.buttonClick();
              setActiveTab('tips');
            }}
            className={`py-2 px-1 rounded-xl text-xs font-header font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'tips'
                ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-[0_0_12px_rgba(249,115,22,0.5)]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Party Tips</span>
          </button>

          <button
            type="button"
            onClick={() => {
              SoundEngine.playButtonClick();
              Haptics.buttonClick();
              setActiveTab('stars');
            }}
            className={`py-2 px-1 rounded-xl text-xs font-header font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'stars'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>Star Economy</span>
          </button>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 custom-scrollbar text-xs">
          {/* TAB 1: GAME MODES INSTRUCTIONS */}
          {activeTab === 'modes' && (
            <div className="space-y-3 animate-fadeIn">
              {/* Mode 1: Finger Roulette */}
              <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-header font-bold text-sm text-cyan-300 uppercase tracking-wide">
                        Finger Roulette
                      </h3>
                      <p className="text-[10px] text-gray-400">Instant Multi-Touch Decider</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-200 border border-cyan-400/30">
                    2–10 Players
                  </span>
                </div>

                <div className="space-y-1.5 text-gray-300 text-[11px] leading-relaxed mb-3">
                  <p>
                    <strong className="text-white">1. Gather:</strong> Place the device flat on a table. All players place one finger anywhere on the screen.
                  </p>
                  <p>
                    <strong className="text-white">2. Scan:</strong> Hold still! Glowing neon energy rings analyze each player's touch with pulsating countdown rings.
                  </p>
                  <p>
                    <strong className="text-white">3. Pick:</strong> When the countdown completes, chosen players burst with laser arcs and strong tactile vibrations!
                  </p>
                </div>

                <div className="bg-black/40 rounded-xl p-2.5 border border-white/10 text-[11px] text-cyan-200/90 space-y-1">
                  <p className="font-semibold text-white flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Pro Tips & Custom Modes:</span>
                  </p>
                  <p>• <strong>Pick Count:</strong> Tap the target picker in the top bar to pick between 1 to 5 players at once.</p>
                  <p>• <strong>Team Division:</strong> In Settings, switch to Team Division mode to automatically divide the room into Team Red vs. Team Blue.</p>
                  <p>• <strong>Instant Reset:</strong> Lift all fingers at any point to reset and start a new round immediately.</p>
                </div>

                {onNavigateToGame && (
                  <button
                    type="button"
                    onClick={() => {
                      SoundEngine.playButtonClick();
                      Haptics.buttonClick();
                      onClose();
                      onNavigateToGame('roulette');
                    }}
                    className="mt-2.5 w-full py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 font-header font-bold text-xs uppercase tracking-wider active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Play Finger Roulette</span>
                    <Zap className="w-3.5 h-3.5 text-cyan-300" />
                  </button>
                )}
              </div>

              {/* Mode 2: Spin the Bottle */}
              <div className="p-3.5 rounded-2xl bg-purple-950/20 border border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-400/50 flex items-center justify-center text-purple-300">
                      <RotateCw className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-header font-bold text-sm text-purple-300 uppercase tracking-wide">
                        Spin the Bottle
                      </h3>
                      <p className="text-[10px] text-gray-400">Authentic Angular Inertia Spinner</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-200 border border-purple-400/30">
                    Unlimited
                  </span>
                </div>

                <div className="space-y-1.5 text-gray-300 text-[11px] leading-relaxed mb-3">
                  <p>
                    <strong className="text-white">1. Position:</strong> Sit in a circle and place your phone directly in the center.
                  </p>
                  <p>
                    <strong className="text-white">2. Spin:</strong> Flick or swipe the bottle in any direction. Natural angular momentum and friction slow it down with tactile clicking.
                  </p>
                  <p>
                    <strong className="text-white">3. Result:</strong> Whomever the neck of the bottle points to when it comes to rest is chosen!
                  </p>
                </div>

                <div className="bg-black/40 rounded-xl p-2.5 border border-white/10 text-[11px] text-purple-200/90 space-y-1">
                  <p className="font-semibold text-white flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Bottle Skins & Custom Drinks:</span>
                  </p>
                  <p>• <strong>Instant Skin Cycle:</strong> Tap the bottle icon in the top header to cycle through skins (Cyber Neon, Rosé Champagne, Gold Dragon, etc.).</p>
                  <p>• <strong>Custom Photos:</strong> Upload photos of your own friends, drinks, or party icons in Settings.</p>
                  <p>• <strong>Truth or Dare:</strong> Turn on challenge prompt cards in Settings for conversation starters.</p>
                </div>

                {onNavigateToGame && (
                  <button
                    type="button"
                    onClick={() => {
                      SoundEngine.playButtonClick();
                      Haptics.buttonClick();
                      onClose();
                      onNavigateToGame('bottle');
                    }}
                    className="mt-2.5 w-full py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/40 text-purple-200 font-header font-bold text-xs uppercase tracking-wider active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Play Spin the Bottle</span>
                    <RotateCw className="w-3.5 h-3.5 text-purple-300" />
                  </button>
                )}
              </div>

              {/* Mode 3: KABOOM! */}
              <div className="p-3.5 rounded-2xl bg-orange-950/20 border border-orange-500/40 shadow-[0_0_15px_rgba(249,115,22,0.15)]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-orange-500/20 border border-orange-400/50 flex items-center justify-center text-orange-300">
                      <Bomb className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-header font-bold text-sm text-orange-300 uppercase tracking-wide">
                        KABOOM!
                      </h3>
                      <p className="text-[10px] text-gray-400">Suspense Minefield Elimination</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-200 border border-orange-400/30">
                    2–12 Players
                  </span>
                </div>

                <div className="space-y-1.5 text-gray-300 text-[11px] leading-relaxed mb-3">
                  <p>
                    <strong className="text-white">1. Select Grid:</strong> Choose from 2×2 (sudden death), 3×3, 4×4, 5×5, up to 6×6 (epic elimination party).
                  </p>
                  <p>
                    <strong className="text-white">2. Take Turns:</strong> Pass the phone or tap one 3D glowing sphere button on your turn. Safe buttons chime green.
                  </p>
                  <p>
                    <strong className="text-white">3. Explode:</strong> One hidden button triggers the lethal bomb blast! Whoever detonates it takes the party penalty.
                  </p>
                </div>

                <div className="bg-black/40 rounded-xl p-2.5 border border-white/10 text-[11px] text-orange-200/90 space-y-1.5">
                  <p className="font-semibold text-white flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                    <span>Tactical Power-Up Spheres:</span>
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                    <div className="flex items-center gap-1 bg-white/5 p-1.5 rounded-lg">
                      <Shield className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span><strong>Shield:</strong> Blocks 1 explosion</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white/5 p-1.5 rounded-lg">
                      <Radio className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span><strong>Radar:</strong> Reveals safe spot</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white/5 p-1.5 rounded-lg">
                      <Shuffle className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span><strong>Pass:</strong> Skip without tapping</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white/5 p-1.5 rounded-lg">
                      <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span><strong>Dare:</strong> Fun instant penalty</span>
                    </div>
                  </div>
                </div>

                {onNavigateToGame && (
                  <button
                    type="button"
                    onClick={() => {
                      SoundEngine.playButtonClick();
                      Haptics.buttonClick();
                      onClose();
                      onNavigateToGame('kaboom');
                    }}
                    className="mt-2.5 w-full py-1.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 border border-orange-400/40 text-orange-200 font-header font-bold text-xs uppercase tracking-wider active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Play KABOOM!</span>
                    <Bomb className="w-3.5 h-3.5 text-orange-300" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PARTY TIPS & PRO TRICKS */}
          {activeTab === 'tips' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/20 border border-orange-400/40 flex items-center justify-center text-orange-300 shrink-0 mt-0.5">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-header font-bold text-white text-xs uppercase">
                      1. Establish Stakes Before Starting
                    </h4>
                    <p className="text-[11px] text-gray-300 leading-relaxed mt-0.5">
                      The golden rule of party games: agree on what the chosen player must do <em>before</em> tapping or spinning! Classic stakes: taking a sip, buying the round, confessing a secret, washing dishes, or picking the next song.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0 mt-0.5">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-header font-bold text-white text-xs uppercase">
                      2. Optimal Multi-Touch Sensing
                    </h4>
                    <p className="text-[11px] text-gray-300 leading-relaxed mt-0.5">
                      Touch the screen with the flat pad of your fingertip with gentle pressure rather than just the edge of your nail. Modern phones support up to 10 fingers at once!
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-header font-bold text-white text-xs uppercase">
                      3. 100% Offline & Anywhere
                    </h4>
                    <p className="text-[11px] text-gray-300 leading-relaxed mt-0.5">
                      PICK'U PARTY caches all assets locally. You can play on flights in airplane mode, inside basements, on camping trips, or on road trips with zero cellular data.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 shrink-0 mt-0.5">
                    <RotateCw className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-header font-bold text-white text-xs uppercase">
                      4. Custom Bottle Sprites
                    </h4>
                    <p className="text-[11px] text-gray-300 leading-relaxed mt-0.5">
                      Take a photo of whatever you're drinking tonight (soda, beer, champagne) and upload it in Settings. You can rotate and pick blend modes to make it spin naturally!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STAR ECONOMY & PARTY STORE */}
          {activeTab === 'stars' && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-400/40 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-amber-300">
                    <Star className="w-5 h-5 fill-amber-400 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-header font-bold text-sm text-amber-300 uppercase tracking-wide">
                      Star Economy
                    </h3>
                    <p className="text-[10px] text-gray-400">Unlock party cosmetics & skins</p>
                  </div>
                </div>

                <div className="bg-black/50 rounded-xl p-2.5 border border-white/10 mb-3 space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Currency:</span>
                    <span className="font-bold text-amber-300">Star</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Earning condition:</span>
                    <span className="text-gray-400 italic">—</span>
                  </div>
                  {economy && (
                    <div className="flex justify-between pt-1 border-t border-white/10">
                      <span className="text-gray-400">Current Balance:</span>
                      <span className="font-bold text-amber-300 flex items-center gap-1 font-header">
                        <Star className="w-3 h-3 fill-amber-400" />
                        {economy.stars.toLocaleString()} Stars
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-gray-300 mb-3 leading-relaxed">
                  Use your Stars in the Party Store to unlock exclusive skins for Bottles, Bombs, Balls, and Bonus cards.
                </p>

                {/* Star Guide Cards */}
                <div className="space-y-2 mb-3">
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
                      <Trophy className="w-4 h-4" />
                    </div>
                    <div className="text-[11px]">
                      <span className="font-bold text-white block">Flawless Victories</span>
                      <span className="text-gray-400">Defuse all safe balls in Kaboom without triggering the bomb.</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="text-[11px]">
                      <span className="font-bold text-white block">Party Store Equips</span>
                      <span className="text-gray-400">Show off custom skins and special animations during party play.</span>
                    </div>
                  </div>
                </div>

                {onOpenStore && (
                  <button
                    type="button"
                    onClick={() => {
                      SoundEngine.playButtonClick();
                      Haptics.buttonClick();
                      onClose();
                      onOpenStore();
                    }}
                    className="w-full py-2.5 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:brightness-110 text-white font-header font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.4)] border border-amber-300/60 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Browse Party Store</span>
                    <Star className="w-3.5 h-3.5 fill-current" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Dismiss Action */}
        <button
          onClick={() => {
            SoundEngine.playButtonClick();
            Haptics.buttonClick();
            onClose();
          }}
          className="font-header mt-3 w-full py-2.5 rounded-full font-bold uppercase tracking-wider text-xs bg-gradient-to-r from-cyan-500 to-fuchsia-500 hover:brightness-110 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-98 transition-all cursor-pointer"
        >
          Got It, Let's Play!
        </button>
      </div>
    </div>
  );
};

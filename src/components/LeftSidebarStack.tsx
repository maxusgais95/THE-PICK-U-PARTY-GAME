/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ShoppingCart, Trophy, Gift } from 'lucide-react';
import { SoundEngine, Haptics } from '../lib/audio';
import { getStats } from '../lib/db';
import { hasUnclaimedTrophies } from '../lib/trophies';
import { EconomyState } from '../lib/economy';
import { AppStats } from '../types';

interface LeftSidebarStackProps {
  onOpenStore: () => void;
  onOpenAchievements: () => void;
  onOpenRewards: () => void;
  hasDailyRewardReady?: boolean;
  hasTrophyRewardReady?: boolean;
  economy?: EconomyState;
  stats?: AppStats;
}

export const LeftSidebarStack: React.FC<LeftSidebarStackProps> = ({
  onOpenStore,
  onOpenAchievements,
  onOpenRewards,
  hasDailyRewardReady = false,
  hasTrophyRewardReady,
  economy,
  stats,
}) => {
  const [internalTrophyReady, setInternalTrophyReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkTrophies = async () => {
      try {
        const liveStats = stats || (await getStats());
        if (!isMounted) return;
        const ready = hasUnclaimedTrophies(liveStats, economy);
        setInternalTrophyReady(ready);
      } catch (err) {
        // ignore
      }
    };

    checkTrophies();

    window.addEventListener('picku_trophy_claimed', checkTrophies);
    window.addEventListener('picku_stats_updated', checkTrophies);
    window.addEventListener('picku_economy_updated', checkTrophies);

    return () => {
      isMounted = false;
      window.removeEventListener('picku_trophy_claimed', checkTrophies);
      window.removeEventListener('picku_stats_updated', checkTrophies);
      window.removeEventListener('picku_economy_updated', checkTrophies);
    };
  }, [stats, economy]);

  const isTrophyReady = hasTrophyRewardReady ?? internalTrophyReady;

  return (
    <div className="flex flex-col gap-3 pointer-events-auto select-none">
      {/* 1. STORE Button */}
      <button
        type="button"
        id="main-hub-btn-store"
        onClick={() => {
          SoundEngine.playButtonClick();
          Haptics.buttonClick();
          onOpenStore();
        }}
        aria-label="Open Party Store"
        className="group relative w-14 h-15 sm:w-16 sm:h-17 rounded-[18px] sm:rounded-[20px] bg-black/50 backdrop-blur-md border border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:border-cyan-300 hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] active:scale-95 transition-all flex flex-col items-center justify-center p-1.5 cursor-pointer text-center"
      >
        <div className="absolute -inset-0.5 rounded-[18px] sm:rounded-[20px] bg-cyan-400/10 blur-sm pointer-events-none group-hover:bg-cyan-400/25 transition-all" />

        <div className="relative z-10 flex items-center justify-center mb-1">
          <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.9)] stroke-[2.2] group-hover:scale-110 transition-transform" />
        </div>

        <span className="relative z-10 font-header font-bold text-[9px] sm:text-[10px] tracking-wider text-cyan-100 uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] leading-tight">
          STORE
        </span>
      </button>

      {/* 2. ACHIEVEMENTS / TROPHIES Button */}
      <button
        type="button"
        id="main-hub-btn-achievements"
        onClick={() => {
          SoundEngine.playButtonClick();
          Haptics.buttonClick();
          onOpenAchievements();
        }}
        aria-label="Open Trophy Achievements"
        className="group relative w-14 h-15 sm:w-16 sm:h-17 rounded-[18px] sm:rounded-[20px] bg-black/50 backdrop-blur-md border border-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:border-amber-300 hover:shadow-[0_0_20px_rgba(245,158,11,0.5)] active:scale-95 transition-all flex flex-col items-center justify-center p-1.5 cursor-pointer text-center"
      >
        <div className="absolute -inset-0.5 rounded-[18px] sm:rounded-[20px] bg-amber-400/10 blur-sm pointer-events-none group-hover:bg-amber-400/25 transition-all" />

        {/* Unclaimed Trophy Indicator Ping */}
        {isTrophyReady && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3 z-20">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400 border-2 border-black" />
          </span>
        )}

        <div className="relative z-10 flex items-center justify-center mb-1">
          <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.9)] stroke-[2.2] group-hover:scale-110 transition-transform" />
        </div>

        <span className="relative z-10 font-header font-bold text-[9px] sm:text-[10px] tracking-wider text-amber-100 uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] leading-tight">
          TROPHIES
        </span>
      </button>

      {/* 3. REWARDS Button */}
      <button
        type="button"
        id="main-hub-btn-rewards"
        onClick={() => {
          SoundEngine.playButtonClick();
          Haptics.buttonClick();
          onOpenRewards();
        }}
        aria-label="Open Rewards"
        className="group relative w-14 h-15 sm:w-16 sm:h-17 rounded-[18px] sm:rounded-[20px] bg-black/50 backdrop-blur-md border border-pink-400/50 shadow-[0_0_15px_rgba(236,72,153,0.3)] hover:border-pink-300 hover:shadow-[0_0_20px_rgba(236,72,153,0.5)] active:scale-95 transition-all flex flex-col items-center justify-center p-1.5 cursor-pointer text-center"
      >
        <div className="absolute -inset-0.5 rounded-[18px] sm:rounded-[20px] bg-pink-400/10 blur-sm pointer-events-none group-hover:bg-pink-400/25 transition-all" />

        {/* Unclaimed Reward Ping */}
        {hasDailyRewardReady && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3 z-20">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400 border-2 border-black" />
          </span>
        )}

        <div className="relative z-10 flex items-center justify-center mb-1">
          <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-pink-300 drop-shadow-[0_0_8px_rgba(236,72,153,0.9)] stroke-[2.2] group-hover:scale-110 transition-transform" />
        </div>

        <span className="relative z-10 font-header font-bold text-[9px] sm:text-[10px] tracking-wider text-pink-100 uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] leading-tight">
          REWARDS
        </span>
      </button>
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Award,
  Sparkles,
  Lock,
  CheckCircle2,
  X,
  Star,
  Flame,
  Target,
  Crown,
  Bomb,
  ChevronRight,
} from 'lucide-react';
import {
  TROPHY_DEFINITIONS,
  AchievementTrophy,
  TrophyTier,
  TrophyProgress,
  getTrophyClaimMap,
  claimTrophyReward,
  calculateTrophyProgress,
  getTrophyImage,
} from '../lib/trophies';
import { AppStats } from '../types';
import { getStats } from '../lib/db';
import { EconomyState, addStars, getEconomyState } from '../lib/economy';
import { SoundEngine, Haptics } from '../lib/audio';
import currencyStarImg from '../assets/images/Currency Star Sprite.webp';
import diamondStarSparklePng from '../assets/images/diamond_star_sparkle.webp';
import bronzeBlendBg from '../assets/images/Trophy BG Bronze 01.webp';
import silverBlendBg from '../assets/images/Trophy BG Silver 01.webp';
import goldBlendBg from '../assets/images/Trophy BG Gold 01.webp';
import platBlendBg from '../assets/images/Trophy BG Platinum 01.webp';

const TIER_BLEND_BACKGROUNDS: Record<TrophyTier, string | null> = {
  bronze: bronzeBlendBg,
  silver: silverBlendBg,
  gold: goldBlendBg,
  platinum: platBlendBg,
  locked: null,
};

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: AppStats;
  economy: EconomyState;
  onEconomyUpdated?: (economy: EconomyState) => void;
}

/**
 * Trophy Dynamic Shine Star Sparkles
 * Generates sparkling faceted star glints corresponding directly to the trophy's tier color!
 */
// Platinum full shine: 8 multifaceted brilliant diamond facet glints across the trophy
const PLATINUM_DIAMOND_SPARKLES = [
  { top: '16%', left: '26%', size: 28, delay: '0.1s', duration: '2.4s' },
  { top: '22%', left: '72%', size: 32, delay: '0.8s', duration: '2.8s' },
  { top: '38%', left: '16%', size: 24, delay: '1.5s', duration: '2.2s' },
  { top: '46%', left: '80%', size: 30, delay: '0.4s', duration: '2.6s' },
  { top: '62%', left: '28%', size: 26, delay: '1.1s', duration: '2.5s' },
  { top: '68%', left: '68%', size: 34, delay: '1.9s', duration: '3.0s' },
  { top: '28%', left: '50%', size: 30, delay: '0.6s', duration: '2.3s' },
  { top: '54%', left: '52%', size: 24, delay: '1.3s', duration: '2.7s' },
];

// Gold little shine: 3 delicate, subtle diamond glints
const GOLD_DIAMOND_SPARKLES = [
  { top: '22%', left: '32%', size: 18, delay: '0.2s', duration: '3.2s' },
  { top: '36%', left: '70%', size: 20, delay: '1.4s', duration: '3.6s' },
  { top: '64%', left: '44%', size: 17, delay: '2.2s', duration: '3.0s' },
];

/**
 * Realistic Diamond Shine using 4-point diamond star sprite with screen blending mode
 * Renders ONLY for gold and platinum tiers!
 * - Gold: subtle, delicate diamond glints ("Gold little")
 * - Platinum: brilliant multifaceted optical flares with diffraction spikes ("Platinum full shine")
 */
const DiamondShineSparkles: React.FC<{ tier: TrophyTier; isReached?: boolean; scale?: number }> = ({
  tier,
  isReached = true,
  scale = 1.5,
}) => {
  if (!isReached || (tier !== 'gold' && tier !== 'platinum')) return null;

  const isPlatinum = tier === 'platinum';
  const sparkles = isPlatinum ? PLATINUM_DIAMOND_SPARKLES : GOLD_DIAMOND_SPARKLES;
  // Platinum glitter slightly smaller (0.8x) per user request
  const effectiveScale = isPlatinum ? scale * 0.8 : scale;

  const dropFilter = isPlatinum
    ? 'drop-shadow(0 0 5px rgba(103,232,249,0.95)) drop-shadow(0 0 11px rgba(6,182,212,0.85))'
    : 'drop-shadow(0 0 6px rgba(254,240,138,0.95)) drop-shadow(0 0 12px rgba(234,179,8,0.85))';

  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-visible">
      {sparkles.map((sparkle, idx) => (
        <div
          key={idx}
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            top: sparkle.top,
            left: sparkle.left,
          }}
        >
          <img
            src={diamondStarSparklePng}
            alt=""
            className="pointer-events-none animate-diamond-shine select-none"
            style={{
              width: `${Math.round(sparkle.size * effectiveScale)}px`,
              height: `${Math.round(sparkle.size * effectiveScale)}px`,
              filter: dropFilter,
              ['--shine-delay' as any]: sparkle.delay,
              ['--shine-duration' as any]: sparkle.duration,
            }}
          />
        </div>
      ))}
    </div>
  );
};

// Radiant neon glowing aura style matching trophy colors (no harsh clipping bounds)
const TIER_GLOW_STYLES: Record<TrophyTier, string> = {
  bronze: 'drop-shadow(0 0 10px rgba(245,158,11,0.9)) drop-shadow(0 0 24px rgba(180,83,9,0.5))',
  silver: 'drop-shadow(0 0 10px rgba(241,245,249,0.9)) drop-shadow(0 0 24px rgba(148,163,184,0.5))',
  gold: 'drop-shadow(0 0 14px rgba(250,204,21,0.95)) drop-shadow(0 0 30px rgba(234,179,8,0.55))',
  platinum: 'drop-shadow(0 0 16px rgba(6,182,212,0.95)) drop-shadow(0 0 36px rgba(34,211,238,0.6))',
  locked: 'none',
};

const TIER_AURA_BACKGROUNDS: Record<TrophyTier, string> = {
  bronze: 'bg-gradient-to-tr from-amber-600/40 via-amber-500/30 to-yellow-600/20 blur-3xl animate-pulse',
  silver: 'bg-gradient-to-tr from-slate-200/45 via-slate-100/30 to-sky-200/25 blur-3xl animate-pulse',
  gold: 'bg-gradient-to-tr from-yellow-400/50 via-amber-400/35 to-yellow-200/30 blur-3xl animate-pulse',
  platinum: 'bg-gradient-to-tr from-cyan-400/50 via-sky-400/35 to-teal-300/30 blur-3xl animate-pulse',
  locked: 'bg-transparent',
};

const TIER_DETAILS_MAP: Record<
  TrophyTier,
  {
    name: string;
    badgeBg: string;
    badgeBorder: string;
    badgeText: string;
    activeRing: string;
    activeBorder: string;
    activeBg: string;
    textActiveColor: string;
  }
> = {
  bronze: {
    name: 'Bronze',
    badgeBg: 'bg-amber-950/60',
    badgeBorder: 'border-amber-600/60',
    badgeText: 'text-amber-400',
    activeRing: 'ring-amber-500/80',
    activeBorder: 'border-amber-400',
    activeBg: 'bg-amber-500/15',
    textActiveColor: 'text-amber-300',
  },
  silver: {
    name: 'Silver',
    badgeBg: 'bg-slate-900/60',
    badgeBorder: 'border-slate-400/60',
    badgeText: 'text-slate-200',
    activeRing: 'ring-slate-300/80',
    activeBorder: 'border-slate-300',
    activeBg: 'bg-slate-400/15',
    textActiveColor: 'text-slate-100',
  },
  gold: {
    name: 'Gold',
    badgeBg: 'bg-yellow-950/60',
    badgeBorder: 'border-yellow-500/60',
    badgeText: 'text-yellow-300',
    activeRing: 'ring-yellow-400/80',
    activeBorder: 'border-yellow-400',
    activeBg: 'bg-yellow-400/15',
    textActiveColor: 'text-yellow-200',
  },
  platinum: {
    name: 'Platinum',
    badgeBg: 'bg-cyan-950/60',
    badgeBorder: 'border-cyan-400/60',
    badgeText: 'text-cyan-300',
    activeRing: 'ring-cyan-400/80',
    activeBorder: 'border-cyan-400',
    activeBg: 'bg-cyan-500/15',
    textActiveColor: 'text-cyan-200',
  },
  locked: {
    name: 'Locked',
    badgeBg: 'bg-neutral-900/60',
    badgeBorder: 'border-white/10',
    badgeText: 'text-gray-400',
    activeRing: 'ring-white/20',
    activeBorder: 'border-white/20',
    activeBg: 'bg-white/5',
    textActiveColor: 'text-gray-400',
  },
};

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  isOpen,
  onClose,
  stats,
  economy,
  onEconomyUpdated,
}) => {
  const [claimMap, setClaimMap] = useState<Record<string, TrophyTier[]>>(() =>
    getTrophyClaimMap()
  );
  const [selectedTrophy, setSelectedTrophy] = useState<AchievementTrophy | null>(null);
  const [inspectedTier, setInspectedTier] = useState<TrophyTier | null>(null);

  // Live real-time stats and economy synchronization
  const [liveStats, setLiveStats] = useState<AppStats>(stats);
  const [liveEconomy, setLiveEconomy] = useState<EconomyState>(economy);

  useEffect(() => {
    setLiveStats(stats);
  }, [stats]);

  useEffect(() => {
    setLiveEconomy(economy);
  }, [economy]);

  // Synchronize immediately with custom events and persistent DB
  useEffect(() => {
    if (!isOpen) return;

    // Refresh immediately when opened
    getStats().then(setLiveStats);
    setLiveEconomy(getEconomyState());
    setClaimMap(getTrophyClaimMap());

    const handleStatsEvent = (e: Event) => {
      const ce = e as CustomEvent<AppStats>;
      if (ce.detail) {
        setLiveStats(ce.detail);
      } else {
        getStats().then(setLiveStats);
      }
    };

    const handleEconomyEvent = (e: Event) => {
      const ce = e as CustomEvent<EconomyState>;
      if (ce.detail) {
        setLiveEconomy(ce.detail);
      } else {
        setLiveEconomy(getEconomyState());
      }
    };

    const handleClaimEvent = () => {
      setClaimMap(getTrophyClaimMap());
    };

    window.addEventListener('picku_stats_updated', handleStatsEvent);
    window.addEventListener('picku_economy_updated', handleEconomyEvent);
    window.addEventListener('picku_trophy_claimed', handleClaimEvent);

    return () => {
      window.removeEventListener('picku_stats_updated', handleStatsEvent);
      window.removeEventListener('picku_economy_updated', handleEconomyEvent);
      window.removeEventListener('picku_trophy_claimed', handleClaimEvent);
    };
  }, [isOpen]);

  // When a trophy is selected for inspection, default to its highest unlocked tier (or bronze)
  useEffect(() => {
    if (selectedTrophy) {
      const statsCtx = {
        totalRouletteRounds: liveStats.totalRouletteRounds || 0,
        totalBottleSpins: liveStats.totalBottleSpins || 0,
        totalKaboomRounds: liveStats.totalKaboomRounds || 0,
        kaboomVictories: liveStats.kaboom?.victories || 0,
        kaboomBonusCollected: liveStats.kaboom?.bonusCollected || 0,
        unlockedItemCount: liveEconomy.unlockedItems?.length || 1,
        totalLogins: Math.max(1, liveEconomy.totalLoginsCount || liveEconomy.dailyLoginRewards?.claimedDays?.length || 1),
        lifetimeStars: Math.max(liveEconomy.stars || 0, liveEconomy.lifetimeStarsEarned || liveEconomy.stars || 0),
        milestoneChestsOpened: liveEconomy.milestoneChestsOpened || (liveEconomy.milestoneChestClaimed ? 1 : 0),
        questsCompleted: liveEconomy.questsCompletedCount || (liveEconomy.dailyQuests?.filter((q) => q.currentCount >= q.targetCount).length || 0),
      };
      const p = calculateTrophyProgress(selectedTrophy, statsCtx, claimMap);
      setInspectedTier(p.currentTier !== 'locked' ? p.currentTier : 'bronze');
    } else {
      setInspectedTier(null);
    }
  }, [selectedTrophy]);

  if (!isOpen) return null;

  const statsContext = {
    totalRouletteRounds: liveStats.totalRouletteRounds || 0,
    totalBottleSpins: liveStats.totalBottleSpins || 0,
    totalKaboomRounds: liveStats.totalKaboomRounds || 0,
    kaboomVictories: liveStats.kaboom?.victories || 0,
    kaboomBonusCollected: liveStats.kaboom?.bonusCollected || 0,
    unlockedItemCount: liveEconomy.unlockedItems?.length || 1,
    totalLogins: Math.max(1, liveEconomy.totalLoginsCount || liveEconomy.dailyLoginRewards?.claimedDays?.length || 1),
    lifetimeStars: Math.max(liveEconomy.stars || 0, liveEconomy.lifetimeStarsEarned || liveEconomy.stars || 0),
    milestoneChestsOpened: liveEconomy.milestoneChestsOpened || (liveEconomy.milestoneChestClaimed ? 1 : 0),
    questsCompleted: liveEconomy.questsCompletedCount || (liveEconomy.dailyQuests?.filter((q) => q.currentCount >= q.targetCount).length || 0),
  };

  const progressList = TROPHY_DEFINITIONS.map((trophy) =>
    calculateTrophyProgress(trophy, statsContext, claimMap)
  );

  const progressMap = new Map(progressList.map((p) => [p.trophyId, p]));

  const totalTrophies = TROPHY_DEFINITIONS.length;
  const unlockedTrophiesCount = progressList.filter((p) => p.currentTier !== 'locked').length;
  const platinumCount = progressList.filter((p) => p.currentTier === 'platinum').length;
  const goldCount = progressList.filter((p) => p.currentTier === 'gold').length;
  const silverCount = progressList.filter((p) => p.currentTier === 'silver').length;
  const bronzeCount = progressList.filter((p) => p.currentTier === 'bronze').length;
  const totalUnclaimedTiersCount = progressList.reduce(
    (acc, p) => acc + p.unclaimedTiers.length,
    0
  );

  const allTrophies = TROPHY_DEFINITIONS;

  const handleClaim = (trophyId: string, tier: TrophyTier, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const res = claimTrophyReward(trophyId, tier);
    if (res.success && res.starsAwarded > 0) {
      SoundEngine.playBonusFanfare();
      SoundEngine.playHudCoinBeep();
      Haptics.reward();
      const updatedEco = addStars(res.starsAwarded);
      setLiveEconomy(updatedEco);
      if (onEconomyUpdated) onEconomyUpdated(updatedEco);
      setClaimMap(getTrophyClaimMap());
      window.dispatchEvent(new CustomEvent('picku_trophy_claimed'));
      window.dispatchEvent(
        new CustomEvent('app-confetti', {
          detail: { count: 35, colors: ['#f59e0b', '#06b6d4', '#eab308'] },
        })
      );
    }
  };

  const getTrophyIcon = (
    type: AchievementTrophy['iconType'],
    tier: TrophyTier,
    sizeClass = 'w-7 h-7'
  ) => {
    const isLocked = tier === 'locked';
    switch (type) {
      case 'target':
        return (
          <Target
            className={`${sizeClass} ${
              isLocked ? 'text-gray-500' : 'text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]'
            }`}
          />
        );
      case 'sparkles':
        return (
          <Sparkles
            className={`${sizeClass} ${
              isLocked ? 'text-gray-500' : 'text-fuchsia-300 drop-shadow-[0_0_8px_rgba(217,70,239,0.8)]'
            }`}
          />
        );
      case 'bomb':
        return (
          <Bomb
            className={`${sizeClass} ${
              isLocked ? 'text-gray-500' : 'text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]'
            }`}
          />
        );
      case 'crown':
        return (
          <Crown
            className={`${sizeClass} ${
              isLocked ? 'text-gray-500' : 'text-yellow-300 drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]'
            }`}
          />
        );
      case 'flame':
        return (
          <Flame
            className={`${sizeClass} ${
              isLocked ? 'text-gray-500' : 'text-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]'
            }`}
          />
        );
      default:
        return (
          <Trophy
            className={`${sizeClass} ${
              isLocked ? 'text-gray-500' : 'text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]'
            }`}
          />
        );
    }
  };

  const getTierPedestalStyle = (tier: TrophyTier) => {
    switch (tier) {
      case 'platinum':
        return {
          glowCardClass: 'trophy-card-platinum',
          cardBg: 'bg-gradient-to-b from-cyan-950/70 via-[#0a192f]/90 to-black/95',
          radialOverlay: 'bg-[radial-gradient(ellipse_at_top,_rgba(6,182,212,0.22),_transparent_70%)]',
          pedestal: 'bg-gradient-to-t from-cyan-950 via-cyan-800 to-cyan-400 border border-cyan-200 shadow-[0_0_18px_rgba(6,182,212,0.9)]',
          badgeText: 'text-cyan-300',
          badgeBg: 'bg-cyan-950/70 border border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.4)]',
          tierLabel: 'PLATINUM',
          accentText: 'text-cyan-300',
        };
      case 'gold':
        return {
          glowCardClass: 'trophy-card-gold',
          cardBg: 'bg-gradient-to-b from-amber-950/70 via-[#1f1607]/90 to-black/95',
          radialOverlay: 'bg-[radial-gradient(ellipse_at_top,_rgba(234,179,8,0.22),_transparent_70%)]',
          pedestal: 'bg-gradient-to-t from-amber-950 via-amber-700 to-yellow-400 border border-yellow-200 shadow-[0_0_18px_rgba(234,179,8,0.9)]',
          badgeText: 'text-yellow-300',
          badgeBg: 'bg-amber-950/70 border border-yellow-400/50 shadow-[0_0_10px_rgba(234,179,8,0.4)]',
          tierLabel: 'GOLD',
          accentText: 'text-yellow-300',
        };
      case 'silver':
        return {
          glowCardClass: 'trophy-card-silver',
          cardBg: 'bg-gradient-to-b from-slate-900/70 via-[#151c28]/90 to-black/95',
          radialOverlay: 'bg-[radial-gradient(ellipse_at_top,_rgba(203,213,225,0.18),_transparent_70%)]',
          pedestal: 'bg-gradient-to-t from-slate-900 via-slate-700 to-slate-200 border border-slate-100 shadow-[0_0_14px_rgba(203,213,225,0.8)]',
          badgeText: 'text-slate-200',
          badgeBg: 'bg-slate-800/70 border border-slate-300/50 shadow-[0_0_8px_rgba(148,163,184,0.3)]',
          tierLabel: 'SILVER',
          accentText: 'text-slate-200',
        };
      case 'bronze':
        return {
          glowCardClass: 'trophy-card-bronze',
          cardBg: 'bg-gradient-to-b from-[#3a1d08]/70 via-[#1a0e05]/90 to-black/95',
          radialOverlay: 'bg-[radial-gradient(ellipse_at_top,_rgba(180,83,9,0.22),_transparent_70%)]',
          pedestal: 'bg-gradient-to-t from-amber-950 via-amber-850 to-amber-600 border border-amber-400 shadow-[0_0_12px_rgba(180,83,9,0.7)]',
          badgeText: 'text-amber-400',
          badgeBg: 'bg-amber-950/70 border border-amber-600/50 shadow-[0_0_8px_rgba(180,83,9,0.3)]',
          tierLabel: 'BRONZE',
          accentText: 'text-amber-400',
        };
      default:
        return {
          glowCardClass: 'trophy-card-locked',
          cardBg: 'bg-gradient-to-b from-neutral-950/80 via-black/90 to-black',
          radialOverlay: 'bg-transparent',
          pedestal: 'bg-neutral-900 border border-white/10 shadow-none',
          badgeText: 'text-gray-400',
          badgeBg: 'bg-neutral-900/80 border border-white/10',
          tierLabel: 'LOCKED',
          accentText: 'text-gray-400',
        };
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center pt-[max(2.25rem,calc(env(safe-area-inset-top)+1.25rem))] pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))] px-3 sm:px-4 bg-black/80 backdrop-blur-md animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        id="achievements-modal-container"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg h-[min(88vh,720px)] flex flex-col rounded-[28px] bg-gradient-to-b from-[#140b22]/98 via-[#0d0718]/98 to-black/98 border-2 border-amber-500/40 shadow-[0_0_40px_rgba(245,158,11,0.3)] overflow-hidden overflow-x-hidden text-white"
      >
        {/* Top Header Bar */}
        <div className="relative px-5 pt-4 pb-3 border-b border-amber-500/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.5)] border border-yellow-200/60 text-black shrink-0">
              <Trophy className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-header text-xl sm:text-2xl font-bold tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-orange-400 leading-none">
                  TROPHY GALLERY
                </h2>
                {totalUnclaimedTiersCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-header font-black text-[10px] animate-bounce shadow-[0_0_8px_rgba(245,158,11,0.8)]">
                    {totalUnclaimedTiersCount} REWARD{totalUnclaimedTiersCount > 1 ? 'S' : ''}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-amber-200/70 mt-1 font-body">
                Earn & tier up trophies as you complete party tasks
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              SoundEngine.playButtonClick();
              Haptics.buttonClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-gray-300 hover:text-white transition-all active:scale-95 cursor-pointer shrink-0"
            aria-label="Close Achievements"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Trophy Gallery Grid - Clean, filterless, zero glow clipping */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden pt-5 pb-8 px-4 sm:px-6 space-y-4 scrollable-panel w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 w-full py-1">
            {allTrophies.map((trophy, index) => {
              const progress = calculateTrophyProgress(trophy, statsContext, claimMap);
              const pedestal = getTierPedestalStyle(progress.currentTier);
              const isLocked = progress.currentTier === 'locked';
              const isPlatinum = progress.currentTier === 'platinum';

              return (
                <div
                  key={trophy.id}
                  onClick={() => {
                    SoundEngine.playButtonClick();
                    Haptics.buttonClick();
                    setSelectedTrophy(trophy);
                  }}
                  style={{
                    animationDelay: `${Math.min(index * 45, 400)}ms`,
                  }}
                  className={`group relative rounded-2xl ${pedestal.glowCardClass} p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] cursor-pointer overflow-hidden border border-white/10 animate-trophy-entrance`}
                >
                  {/* Tier-Specific Blend Background Texture: Fills entire container, rectangular, soft radial gradient falloff to avoid circular crop */}
                  {TIER_BLEND_BACKGROUNDS[progress.currentTier] && !isLocked && (
                    <img
                      src={TIER_BLEND_BACKGROUNDS[progress.currentTier]!}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover rounded-2xl pointer-events-none select-none transition-all duration-500"
                      style={{
                        mixBlendMode: 'normal',
                        opacity: progress.currentTier === 'platinum' ? 0.38 : 0.3,
                        filter: 'contrast(1.1) brightness(1)',
                        maskImage: 'radial-gradient(circle at 50% 45%, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 80%)',
                        WebkitMaskImage: 'radial-gradient(circle at 50% 45%, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 80%)',
                      }}
                    />
                  )}

                  {/* Card Inner Background Darkening / Tint Shell */}
                  <div className={`absolute inset-0 rounded-2xl ${pedestal.cardBg} pointer-events-none opacity-0`} />

                  {/* Radial Ambient Beam */}
                  <div className={`absolute inset-0 rounded-2xl pointer-events-none ${pedestal.radialOverlay}`} />

                  {/* Unclaimed Reward Badge (Category text in black box completely removed) */}
                  {progress.unclaimedTiers.length > 0 && (
                    <div className="relative z-10 flex items-center justify-end mb-1">
                      <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-black font-header font-black text-[9px] uppercase tracking-wide animate-glow-pulse shadow-[0_0_12px_rgba(245,158,11,0.9)] flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        CLAIM REWARD
                      </span>
                    </div>
                  )}

                  {/* Dedicated Placeholder for Trophy Attachment - Ample headroom and soft diffuse ambient glow */}
                  <div className="relative z-20 w-full h-56 sm:h-60 my-1 flex items-center justify-center">
                    {/* Distinct Glowing Aura Behind Trophy - Wide blur-3xl to eliminate hard circular clipping */}
                    <div
                      className={`absolute w-52 h-52 sm:w-60 sm:h-60 rounded-full blur-3xl pointer-events-none transition-all duration-500 ${
                        isLocked
                          ? 'bg-transparent'
                          : `${TIER_AURA_BACKGROUNDS[progress.currentTier]} ${
                              progress.currentTier === 'platinum' ? 'animate-platinum-aura-surge' : ''
                            }`
                      }`}
                    />

                    {/* Attached Trophy Layer (Elevated on top of everything, enlarged 1.5x) */}
                    <div className="relative z-30 transform group-hover:-translate-y-1.5 transition-transform duration-300 flex items-center justify-center w-48 h-48 sm:w-52 sm:h-52">
                      {/* Shimmering diamond shines on gold and platinum trophies */}
                      <DiamondShineSparkles tier={progress.currentTier} isReached={!isLocked} scale={1.5} />

                        {(() => {
                          const hasImages = !!trophy.images;
                          if (hasImages) {
                            if (isLocked) {
                              return (
                                <div className="relative w-full h-full flex items-center justify-center">
                                  <img
                                    src={trophy.tiers.bronze.image}
                                    alt={`${trophy.title} - Locked`}
                                    className="w-full h-full object-contain filter grayscale opacity-25 brightness-50 contrast-125"
                                  />
                                  <div className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-neutral-950/90 border border-white/20 flex items-center justify-center shadow-xl">
                                    <Lock className="w-6 h-6 text-gray-400" />
                                  </div>
                                </div>
                              );
                            }
                            const trophyImg = getTrophyImage(trophy, progress.currentTier);
                            return (
                              <div className="w-full h-full flex items-center justify-center">
                                <img
                                  src={trophyImg}
                                  alt={`${trophy.title} - ${progress.currentTier}`}
                                  style={{
                                    filter: TIER_GLOW_STYLES[progress.currentTier],
                                  }}
                                  className={`w-full h-full object-contain transition-transform duration-300 group-hover:scale-105 ${
                                    progress.currentTier === 'platinum' ? 'animate-platinum-surge' : ''
                                  }`}
                                />
                              </div>
                            );
                          }
                          return (
                            <div className="w-full h-full flex items-center justify-center">
                              {isLocked && (
                                <div className="w-12 h-12 rounded-full bg-neutral-900/90 border border-white/10 flex items-center justify-center">
                                  <Lock className="w-6 h-6 text-gray-500" />
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Trophy Details - Centered */}
                    <div className="relative z-10 mt-2 text-center flex flex-col items-center">
                      <h3 className="font-header font-bold text-base text-white group-hover:text-amber-300 transition-colors flex items-center justify-center gap-1.5 text-center">
                        <span>{trophy.title}</span>
                        {progress.currentTier === 'platinum' && (
                          <span className="text-[10px] text-cyan-300 font-normal px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-400/40">MAX</span>
                        )}
                      </h3>
                      <p className="text-xs text-gray-300 text-center line-clamp-2 mt-1 max-w-sm">
                        {progress.currentTierConfig ? progress.currentTierConfig.title : trophy.description}
                      </p>
                    </div>

                    {/* Progress Bar & Next Tier Objective */}
                    <div className="relative z-10 mt-3 pt-2.5 border-t border-white/10">
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="text-gray-400">
                          {progress.nextTierConfig ? (
                            <>
                              Next: <span className="text-white font-medium">{progress.nextTierConfig.badgeName}</span> ({progress.nextTierConfig.threshold})
                            </>
                          ) : (
                            <span className="text-cyan-300 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-cyan-400" /> Max Tier Achieved
                            </span>
                          )}
                        </span>
                        <span className={`font-header font-bold ${isPlatinum || !progress.nextTierConfig ? 'text-emerald-400' : 'text-amber-300'}`}>
                          {isPlatinum || !progress.nextTierConfig ? (
                            'Completed'
                          ) : (
                            `${progress.currentValue} / ${progress.nextTierConfig.threshold}`
                          )}
                        </span>
                      </div>

                      <div className="w-full h-1.5 rounded-full bg-black/70 border border-white/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            progress.currentTier === 'platinum'
                              ? 'bg-gradient-to-r from-cyan-500 to-sky-300 shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                              : progress.currentTier === 'gold'
                              ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                              : progress.currentTier === 'silver'
                              ? 'bg-gradient-to-r from-slate-400 to-slate-200'
                              : 'bg-gradient-to-r from-amber-700 to-amber-500'
                          }`}
                          style={{ width: `${progress.progressPercent}%` }}
                        />
                      </div>

                      {/* Multi-tier Milestone Dots */}
                      <div className="grid grid-cols-4 gap-1 mt-2 text-center text-[9px]">
                        {(['bronze', 'silver', 'gold', 'platinum'] as TrophyTier[]).map((tierKey) => {
                          const tierCfg = trophy.tiers[tierKey];
                          const isReached = progress.currentValue >= tierCfg.threshold;
                          const isClaimed = (claimMap[trophy.id] || []).includes(tierKey);
                          const canClaim = isReached && !isClaimed;

                          return (
                            <button
                              key={tierKey}
                              type="button"
                              onClick={(e) => {
                                if (canClaim) handleClaim(trophy.id, tierKey, e);
                              }}
                              className={`p-1 rounded flex flex-col items-center justify-center transition-all ${
                                canClaim
                                  ? 'bg-amber-400 text-black font-bold animate-glow-pulse hover:bg-yellow-300 cursor-pointer shadow-[0_0_8px_rgba(245,158,11,0.9)]'
                                  : isClaimed
                                  ? 'bg-white/10 text-gray-300'
                                  : isReached
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                                  : 'bg-black/40 text-gray-600'
                              }`}
                              title={`${tierCfg.badgeName}: ${tierCfg.threshold} ${trophy.metricLabel}`}
                            >
                              <span className="capitalize">{tierKey.slice(0, 3)}</span>
                              {canClaim ? (
                                <span className="text-[8px] font-black leading-none flex items-center gap-0.5">
                                  <span>+{tierCfg.starBonus}</span>
                                  <img src={currencyStarImg} alt="Stars" className="w-2.5 h-2.5 object-contain inline" />
                                </span>
                              ) : isClaimed ? (
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 mt-0.5" />
                              ) : (
                                <span className="text-[8px] text-gray-500">{tierCfg.threshold}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
        </div>
      </div>

      {/* Selected Trophy Detailed Inspection Modal */}
      {selectedTrophy && (() => {
        const p = calculateTrophyProgress(selectedTrophy, statsContext, claimMap);
        const currentInspectedTier: TrophyTier =
          inspectedTier || (p.currentTier !== 'locked' ? p.currentTier : 'bronze');
        const tCfg = selectedTrophy.tiers[currentInspectedTier];
        const isCurrentReached = p.currentValue >= tCfg.threshold;
        const tierDetails = TIER_DETAILS_MAP[currentInspectedTier];
        const pedestal = getTierPedestalStyle(currentInspectedTier);
        const currentImg = tCfg.image || getTrophyImage(selectedTrophy, currentInspectedTier);

        return (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-fade-in"
            onClick={() => setSelectedTrophy(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className={`relative w-full max-w-sm sm:max-w-md h-[min(88vh,610px)] flex flex-col justify-between rounded-[26px] ${pedestal.glowCardClass} ${pedestal.cardBg} p-4 sm:p-5 text-white overflow-hidden`}
            >
              {/* Radial Glow Overlay */}
              <div className={`absolute inset-0 pointer-events-none ${pedestal.radialOverlay}`} />

              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  SoundEngine.playButtonClick();
                  setSelectedTrophy(null);
                }}
                className="absolute top-3.5 right-3.5 z-30 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 hover:text-white cursor-pointer transition-all active:scale-95"
                aria-label="Close Showcase"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Top Bar (Header) - Compact */}
              <div className="relative z-10 shrink-0 pr-8">
                <h3 className="font-header text-lg sm:text-xl font-bold text-white tracking-wide truncate">
                  {selectedTrophy.title}
                </h3>
                <p className="text-[11px] text-gray-300 line-clamp-1 mt-0.5 font-body">
                  {selectedTrophy.description}
                </p>
              </div>

              {/* Center Stage: Trophy Display with Container-filling Tier Blend Background & 1.5x Scaling */}
              <div className="relative z-10 flex-1 flex flex-col items-center justify-center min-h-0 py-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-black/40 my-1">
                {/* Tier Blend Background: Fills stage container, rectangular (not circle), slight dim */}
                {TIER_BLEND_BACKGROUNDS[currentInspectedTier] && isCurrentReached && (
                  <img
                    src={TIER_BLEND_BACKGROUNDS[currentInspectedTier]!}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover rounded-2xl pointer-events-none select-none transition-all duration-500"
                    style={{
                      mixBlendMode: 'screen',
                      opacity: currentInspectedTier === 'platinum' ? 0.4 : 0.32,
                      filter: 'contrast(1.1) brightness(0.78)',
                      maskImage: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 85%)',
                      WebkitMaskImage: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 85%)',
                    }}
                  />
                )}

                {/* Darkening tint shell */}
                <div className="absolute inset-0 rounded-2xl bg-black/30 pointer-events-none" />

                {/* Stage Inner Container */}
                <div className="relative z-20 w-full h-48 sm:h-56 flex items-center justify-center">
                  {/* Glowing Aura Behind Trophy */}
                  <div
                    className={`absolute w-52 h-52 sm:w-60 sm:h-60 rounded-full blur-3xl pointer-events-none transition-all duration-500 ${
                      isCurrentReached
                        ? `${TIER_AURA_BACKGROUNDS[currentInspectedTier]} ${
                            currentInspectedTier === 'platinum' ? 'animate-platinum-aura-surge' : ''
                          }`
                        : 'bg-transparent'
                    }`}
                  />

                  {/* Attached Trophy Layer (1.5x enlarged, elevated on top) */}
                  <div className="relative z-30 flex items-center justify-center w-44 h-44 sm:w-52 sm:h-52">
                    {/* Diamond Shine Sparkles */}
                    <DiamondShineSparkles tier={currentInspectedTier} isReached={isCurrentReached} scale={1.5} />

                    <img
                      src={currentImg}
                      alt={`${selectedTrophy.title} - ${currentInspectedTier}`}
                      style={{
                        filter: isCurrentReached
                          ? TIER_GLOW_STYLES[currentInspectedTier]
                          : 'grayscale(100%) opacity(25%) brightness(50%)',
                      }}
                      className={`w-full h-full object-contain transition-all duration-300 hover:scale-105 ${
                        isCurrentReached && currentInspectedTier === 'platinum'
                          ? 'animate-platinum-surge'
                          : ''
                      }`}
                    />

                    {!isCurrentReached && (
                      <div className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-neutral-950/90 border border-white/20 flex items-center justify-center shadow-xl">
                        <Lock className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Inspected Tier Status Badge */}
                <div className="mt-2 flex items-center gap-2">
                  <div
                    className={`px-3 py-0.5 rounded-full text-xs font-header font-bold uppercase tracking-wider border shadow-md flex items-center gap-1.5 ${tierDetails.badgeBg} ${tierDetails.badgeBorder} ${tierDetails.badgeText}`}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Viewing: {tCfg.badgeName}</span>
                    <span className="opacity-75 font-normal">({tCfg.title})</span>
                  </div>
                </div>

                {/* Score vs Goal */}
                <div className="mt-1 text-[11px] font-header font-semibold text-gray-300 flex items-center gap-1.5 bg-black/40 px-3 py-0.5 rounded-full border border-white/10">
                  <span>Score:</span>
                  <span className="text-amber-300 font-bold">{p.currentValue}</span>
                  <span className="text-gray-500">/</span>
                  <span className="text-white">{tCfg.threshold} {selectedTrophy.metricLabel}</span>
                </div>
              </div>

              {/* Bottom 4 Tiers List - Compact, No Need To Scroll! */}
              <div className="relative z-10 shrink-0 space-y-1.5 pt-2 border-t border-white/10">
                <div className="text-[10px] uppercase tracking-wider text-gray-400 font-header font-semibold flex items-center justify-between px-1">
                  <span>Trophy Tiers</span>
                  <span className="text-amber-300/80 lowercase text-[10px]">click any tier to view</span>
                </div>

                <div className="grid grid-cols-1 gap-1.5">
                  {(['bronze', 'silver', 'gold', 'platinum'] as TrophyTier[]).map((tKey) => {
                    const tierCfg = selectedTrophy.tiers[tKey];
                    const isReached = p.currentValue >= tierCfg.threshold;
                    const isClaimed = (claimMap[selectedTrophy.id] || []).includes(tKey);
                    const canClaim = isReached && !isClaimed;
                    const isInspected = currentInspectedTier === tKey;
                    const def = TIER_DETAILS_MAP[tKey];

                    return (
                      <div
                        key={tKey}
                        onClick={() => {
                          SoundEngine.playButtonClick();
                          Haptics.buttonClick();
                          setInspectedTier(tKey);
                        }}
                        className={`py-1.5 px-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                          isInspected
                            ? `${def.activeBorder} ${def.activeBg} ring-2 ${def.activeRing} shadow-md`
                            : isReached
                            ? 'bg-white/5 border-white/10 hover:bg-white/10'
                            : 'bg-black/30 border-white/5 opacity-55 hover:opacity-80'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <img
                            src={tierCfg.image}
                            alt={tierCfg.badgeName}
                            className="w-6 h-6 object-contain"
                            style={{
                              filter: isReached ? TIER_GLOW_STYLES[tKey] : 'grayscale(100%) opacity(30%)',
                            }}
                          />
                          <div className="leading-tight">
                            <div className="flex items-center gap-1.5">
                              <span className={`font-header font-bold text-xs capitalize ${isInspected ? def.textActiveColor : 'text-white'}`}>
                                {tierCfg.badgeName}
                              </span>
                              <span className="text-[10px] text-gray-400 font-normal">
                                ({tierCfg.title})
                              </span>
                            </div>
                            <div className="text-[10px] text-gray-400">
                              Goal: {tierCfg.threshold} {selectedTrophy.metricLabel}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {canClaim ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleClaim(selectedTrophy.id, tKey, e);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-amber-400 text-black font-header font-black text-xs hover:bg-yellow-300 transition-all cursor-pointer shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-glow-pulse flex items-center gap-1"
                            >
                              <span>Claim +{tierCfg.starBonus}</span>
                              <img src={currencyStarImg} alt="Stars" className="w-3 h-3 object-contain inline" />
                            </button>
                          ) : isClaimed ? (
                            <span className="flex items-center gap-1 text-emerald-400 font-medium text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Claimed
                            </span>
                          ) : isReached ? (
                            <span className="text-amber-300 font-medium text-[11px]">Unlocked</span>
                          ) : (
                            <span className="text-gray-500 text-[10px] flex items-center gap-1">
                              <Lock className="w-3 h-3 text-gray-500" />
                              {tierCfg.threshold - p.currentValue} left
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

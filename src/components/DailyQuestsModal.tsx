/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Check,
  Star,
  Clock,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Tv,
  Play,
  RotateCw,
  AlertCircle,
  Volume2,
} from 'lucide-react';
import {
  DailyQuest,
  claimQuestReward,
  claimMilestoneChest,
  EconomyState,
  getTimeUntilMidnight,
  MILESTONE_CHEST_REWARD,
  rerollDailyQuest,
  REROLL_STAR_COST,
} from '../lib/economy';
import { SoundEngine, Haptics } from '../lib/audio';
import { ScreenView } from '../types';
import chestSpriteImg from '../assets/images/Chest Sprite.webp';
import currencyStarImg from '../assets/images/Currency Star Sprite.webp';

interface DailyQuestsModalProps {
  isOpen: boolean;
  quests: DailyQuest[];
  economy?: EconomyState;
  onClose: () => void;
  onNavigateToGame?: (view: ScreenView) => void;
  onEconomyUpdated: (state: EconomyState) => void;
}

export const DailyQuestsModal: React.FC<DailyQuestsModalProps> = ({
  isOpen,
  quests: propQuests,
  economy,
  onClose,
  onNavigateToGame,
  onEconomyUpdated,
}) => {
  const [timeLeftStr, setTimeLeftStr] = useState<string>(() => getTimeUntilMidnight().formatted);
  const [claimingChest, setClaimingChest] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Reroll selection state
  const [rerollQuest, setRerollQuest] = useState<DailyQuest | null>(null);
  // Rewarded ad playback simulation state
  const [isWatchingAd, setIsWatchingAd] = useState<boolean>(false);
  const [adSecondsLeft, setAdSecondsLeft] = useState<number>(4);
  const [adCompleted, setAdCompleted] = useState<boolean>(false);
  const adTimerRef = useRef<NodeJS.Timeout | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const displayQuests = economy?.dailyQuests?.length ? economy.dailyQuests : propQuests;

  useEffect(() => {
    if (!isOpen) return;
    const interval = window.setInterval(() => {
      setTimeLeftStr(getTimeUntilMidnight().formatted);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (adTimerRef.current) clearInterval(adTimerRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  if (!isOpen) return null;

  const completedCount = displayQuests.filter((q) => q.currentCount >= q.targetCount).length;
  const totalCount = displayQuests.length || 5;
  const progressPercent = Math.min(100, Math.round((completedCount / totalCount) * 100));
  const isMilestoneClaimed = Boolean(economy?.milestoneChestClaimed);
  const canClaimMilestone = completedCount >= totalCount && !isMilestoneClaimed;

  const handleClaimQuest = (questId: string) => {
    SoundEngine.playTeamDivisionChime();
    Haptics.touchSuccess();
    const res = claimQuestReward(questId);
    if (res.success) {
      onEconomyUpdated(res.updatedState);
      showToast(`+${res.starsAdded} Stars Claimed!`);
    }
  };

  const handleClaimMilestone = () => {
    if (!canClaimMilestone || claimingChest) return;
    setClaimingChest(true);
    SoundEngine.playTeamDivisionChime();
    Haptics.touchSuccess();

    const res = claimMilestoneChest();
    if (res.success) {
      onEconomyUpdated(res.updatedState);
      showToast(`Rave Crate Opened! +${MILESTONE_CHEST_REWARD} Stars!`);
    }

    setTimeout(() => {
      setClaimingChest(false);
    }, 1200);
  };

  const handleGoToQuest = (gameMode?: ScreenView) => {
    SoundEngine.playButtonClick();
    Haptics.buttonClick();
    onClose();
    if (gameMode && onNavigateToGame) {
      onNavigateToGame(gameMode);
    }
  };

  const handleOpenReroll = (quest: DailyQuest) => {
    SoundEngine.playButtonClick();
    Haptics.buttonClick();
    setRerollQuest(quest);
  };

  const handleRerollWithStars = () => {
    if (!rerollQuest) return;
    const currentStars = economy?.stars || 0;
    if (currentStars < REROLL_STAR_COST) {
      showToast(`Need at least ${REROLL_STAR_COST} stars to reroll!`);
      return;
    }

    const res = rerollDailyQuest(rerollQuest.id, 'stars');
    if (res.success && res.newQuest) {
      SoundEngine.playTeamDivisionChime();
      Haptics.touchSuccess();
      onEconomyUpdated(res.updatedState);
      showToast(`Quest refreshed: "${res.newQuest.title}"!`);
      setRerollQuest(null);
    } else {
      showToast(res.error || 'Failed to reroll quest.');
    }
  };

  const handleStartWatchAd = () => {
    if (!rerollQuest) return;
    SoundEngine.playButtonClick();
    Haptics.buttonClick();
    setIsWatchingAd(true);
    setAdSecondsLeft(4);
    setAdCompleted(false);

    if (adTimerRef.current) clearInterval(adTimerRef.current);
    adTimerRef.current = setInterval(() => {
      setAdSecondsLeft((prev) => {
        if (prev <= 1) {
          if (adTimerRef.current) clearInterval(adTimerRef.current);
          setAdCompleted(true);
          SoundEngine.playTeamDivisionChime();
          Haptics.touchSuccess();

          // Execute free ad reroll
          const res = rerollDailyQuest(rerollQuest.id, 'ad');
          if (res.success && res.newQuest) {
            onEconomyUpdated(res.updatedState);
            setTimeout(() => {
              setIsWatchingAd(false);
              setRerollQuest(null);
              showToast(`Reward Ad Finished! Rerolled to: "${res.newQuest?.title}"`);
            }, 1200);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCloseAdEarly = () => {
    if (adTimerRef.current) clearInterval(adTimerRef.current);
    setIsWatchingAd(false);
    showToast('Ad closed early. Reroll not claimed.');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center pt-[max(2.25rem,calc(env(safe-area-inset-top)+1.25rem))] pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))] px-3 sm:px-4 bg-black/75 backdrop-blur-md animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        id="daily-quests-modal-container"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md max-h-full flex flex-col rounded-[28px] bg-gradient-to-b from-neutral-900/95 via-[#120824]/95 to-black/95 border-2 border-cyan-400/50 shadow-[0_0_40px_rgba(6,182,212,0.35)] overflow-hidden text-white"
      >
        {/* Toast Notification Banner */}
        {toastMessage && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-600 text-white font-header text-xs font-bold tracking-wide shadow-[0_0_20px_rgba(6,182,212,0.8)] border border-cyan-200 animate-bounce pointer-events-none text-center">
            {toastMessage}
          </div>
        )}

        {/* Top Header Bar */}
        <div className="relative px-5 pt-4 pb-3 border-b border-cyan-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-950 to-purple-950 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)] border border-cyan-400/50 overflow-hidden">
              <img
                src={chestSpriteImg}
                alt="Rave Crate Chest"
                referrerPolicy="no-referrer"
                className="w-9 h-9 object-contain drop-shadow-[0_0_8px_rgba(6,182,212,0.9)]"
              />
            </div>
            <div>
              <h2 className="font-header text-xl sm:text-2xl font-bold tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-sky-300 to-fuchsia-300 leading-none">
                DAILY QUESTS
              </h2>
              <div className="flex items-center gap-1.5 text-[11px] text-cyan-200/70 mt-1 font-body">
                <Clock className="w-3 h-3 text-cyan-400" />
                <span>Resets in {timeLeftStr}</span>
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
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-gray-300 hover:text-white transition-all active:scale-95 cursor-pointer"
            aria-label="Close Daily Quests"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Milestone Chest Progress Banner */}
        <div className="p-4 bg-cyan-950/30 border-b border-cyan-500/20">
          <div className="flex items-center justify-between text-xs font-header mb-1.5">
            <span className="text-cyan-200 tracking-wider uppercase flex items-center gap-1.5">
              <img
                src={chestSpriteImg}
                alt="Rave Crate Chest"
                referrerPolicy="no-referrer"
                className="w-4 h-4 object-contain inline-block"
              />
              MILESTONE CHEST REWARD
            </span>
            <span className="text-cyan-300 font-bold">
              {completedCount} / {totalCount} Completed
            </span>
          </div>

          {/* Progress bar */}
          <div className="relative w-full h-3 rounded-full bg-black/60 border border-cyan-500/40 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-teal-300 to-purple-400 shadow-[0_0_12px_rgba(6,182,212,0.8)] transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Chest Action or Info Row */}
          <div className="flex items-center justify-between mt-3 gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <img
                src={chestSpriteImg}
                alt="Rave Crate Chest"
                referrerPolicy="no-referrer"
                className={`w-7 h-7 object-contain drop-shadow-[0_0_8px_rgba(6,182,212,0.8)] shrink-0 transition-transform ${
                  canClaimMilestone ? 'scale-110 animate-bounce' : ''
                }`}
              />
              <span className="text-[11px] text-gray-300 leading-tight truncate">
                {isMilestoneClaimed
                  ? 'Today’s milestone reward claimed! Resets at midnight.'
                  : canClaimMilestone
                  ? 'All 5 daily quests complete! Claim your Rave Crate!'
                  : `Complete all 5 daily quests to unlock Rave Crate!`}
              </span>
            </div>

            {/* Milestone Button / Status */}
            <div className="shrink-0">
              {isMilestoneClaimed ? (
                <span className="flex items-center gap-1.5 text-[11px] font-header font-bold text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-500/30">
                  <Check className="w-3.5 h-3.5" />
                  <span>CLAIMED (+{MILESTONE_CHEST_REWARD}</span>
                  <img src={currencyStarImg} alt="Stars" className="w-3.5 h-3.5 object-contain inline" />
                  <span>)</span>
                </span>
              ) : canClaimMilestone ? (
                <button
                  type="button"
                  onClick={handleClaimMilestone}
                  disabled={claimingChest}
                  className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 text-black font-header font-bold text-xs uppercase tracking-wider shadow-[0_0_16px_rgba(245,158,11,0.8)] border border-yellow-200 active:scale-95 transition-all flex items-center gap-1.5 animate-glow-pulse cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>CLAIM +{MILESTONE_CHEST_REWARD}</span>
                  <img src={currencyStarImg} alt="Stars" className="w-3.5 h-3.5 object-contain" />
                </button>
              ) : (
                <span className="font-header font-bold text-amber-300 flex items-center gap-1 text-xs bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-400/30">
                  <img src={currencyStarImg} alt="Stars" className="w-3.5 h-3.5 object-contain" />
                  +{MILESTONE_CHEST_REWARD}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quests Scrollable List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
          {displayQuests.map((quest) => {
            const isCompleted = quest.currentCount >= quest.targetCount;
            const canClaim = isCompleted && !quest.isClaimed;

            // Category tag style
            let badgeText = 'PARTY';
            let badgeColor = 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40';
            if (quest.gameMode === 'bottle') {
              badgeText = 'BOTTLE';
              badgeColor = 'bg-teal-500/20 text-teal-300 border-teal-400/40';
            } else if (quest.gameMode === 'roulette') {
              badgeText = 'ROULETTE';
              badgeColor = 'bg-purple-500/20 text-purple-300 border-purple-400/40';
            } else if (quest.gameMode === 'kaboom') {
              badgeText = 'KABOOM';
              badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-400/40';
            } else if (quest.gameMode === 'pong') {
              badgeText = 'BOMB PONG';
              badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-400/40';
            } else if (quest.gameMode === 'hub') {
              badgeText = 'DAILY CHECK-IN';
              badgeColor = 'bg-sky-500/20 text-sky-300 border-sky-400/40';
            }

            return (
              <div
                key={quest.id}
                className={`relative rounded-2xl p-3.5 border transition-all ${
                  quest.isClaimed
                    ? 'bg-neutral-900/40 border-white/5 opacity-65'
                    : canClaim
                    ? 'bg-gradient-to-r from-cyan-950/60 to-purple-950/60 border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                    : 'bg-black/40 border-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[9px] font-header font-bold border uppercase tracking-wider ${badgeColor}`}
                      >
                        {badgeText}
                      </span>
                      {quest.isRerolled && (
                        <span className="px-1.5 py-0.5 rounded-full text-[8px] font-mono uppercase bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-400/30">
                          Rerolled
                        </span>
                      )}
                      <h4 className="font-header text-sm font-bold tracking-wide text-white truncate">
                        {quest.title}
                      </h4>
                      <span className="font-header text-xs font-bold text-amber-300 flex items-center gap-1 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/30 shrink-0">
                        <img src={currencyStarImg} alt="Stars" className="w-3.5 h-3.5 object-contain" />
                        <span>+{quest.starReward}</span>
                      </span>
                    </div>

                    <p className="text-xs text-gray-300 font-body mt-1 leading-snug">
                      {quest.description}
                    </p>

                    {/* Progress indicator */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-28 h-1.5 rounded-full bg-black/70 border border-white/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isCompleted ? 'bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]' : 'bg-purple-500'
                          }`}
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round((quest.currentCount / quest.targetCount) * 100)
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {Math.min(quest.currentCount, quest.targetCount)} / {quest.targetCount}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons: Refresh & Claim/Go */}
                  <div className="shrink-0 flex items-center gap-1.5 self-center">
                    {/* Refresh / Reroll Button (Allowed for 1st reroll per task if not claimed/completed) */}
                    {!quest.isClaimed && !isCompleted && (
                      <button
                        type="button"
                        onClick={() => handleOpenReroll(quest)}
                        disabled={quest.isRerolled}
                        title={
                          quest.isRerolled
                            ? 'First reroll already used for this task today'
                            : 'Refresh quest (Watch reward ad or spend 25 stars)'
                        }
                        className={`p-2 rounded-xl border transition-all flex items-center justify-center cursor-pointer ${
                          quest.isRerolled
                            ? 'bg-neutral-800/40 border-white/5 text-gray-600 cursor-not-allowed opacity-40'
                            : 'bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 hover:text-white border-cyan-500/40 hover:border-cyan-300 active:scale-95 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
                        }`}
                        aria-label="Refresh Daily Quest"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${quest.isRerolled ? '' : 'hover:rotate-180 transition-transform duration-300'}`} />
                      </button>
                    )}

                    {quest.isClaimed ? (
                      <div className="flex items-center gap-1 text-xs font-header text-emerald-400 bg-emerald-950/40 px-3 py-1.5 rounded-full border border-emerald-500/30">
                        <Check className="w-3.5 h-3.5" />
                        <span>CLAIMED</span>
                      </div>
                    ) : canClaim ? (
                      <button
                        type="button"
                        onClick={() => handleClaimQuest(quest.id)}
                        className="relative px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 text-black font-header font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.6)] border border-yellow-200 active:scale-95 transition-all flex items-center gap-1 animate-glow-pulse cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>CLAIM</span>
                      </button>
                    ) : quest.gameMode && quest.gameMode !== 'hub' ? (
                      <button
                        type="button"
                        onClick={() => handleGoToQuest(quest.gameMode)}
                        className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-cyan-300 font-header font-bold text-xs tracking-wider border border-cyan-400/40 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span>GO</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <span className="text-xs text-gray-500 font-header">
                        {quest.currentCount}/{quest.targetCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-black/70 border-t border-white/10 flex items-center justify-between text-[11px] text-gray-400 px-5">
          <div className="flex items-center gap-1.5 text-cyan-300/80">
            <RefreshCw className="w-3 h-3 text-cyan-400" />
            <span>1 Refresh per task/day via Ad or Stars</span>
          </div>
          <span>Resets 00:00 local</span>
        </div>

        {/* ================================================================= */}
        {/* REROLL CONFIRMATION DIALOG MODAL                                 */}
        {/* ================================================================= */}
        {rerollQuest && !isWatchingAd && (
          <div
            className="absolute inset-0 z-40 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setRerollQuest(null)}
          >
            <div
              className="w-full max-w-sm rounded-[24px] bg-gradient-to-b from-neutral-900 via-[#190d33] to-black border-2 border-cyan-400/60 p-5 shadow-[0_0_35px_rgba(6,182,212,0.4)] flex flex-col gap-4 text-white relative animate-scale-up"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.4)]">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-header text-sm font-bold tracking-wide uppercase text-white">
                      REROLL DAILY QUEST
                    </h3>
                    <span className="text-[10px] text-cyan-200/70 font-body">
                      1st reroll of this task today
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRerollQuest(null)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Target Quest Preview Card */}
              <div className="p-3 rounded-xl bg-black/50 border border-white/10">
                <div className="flex items-center justify-between text-xs font-header font-bold text-gray-300 mb-1">
                  <span>Current Task:</span>
                  <span className="text-amber-300 flex items-center gap-1">
                    <img src={currencyStarImg} alt="Stars" className="w-3 h-3 object-contain" />
                    +{rerollQuest.starReward}
                  </span>
                </div>
                <p className="text-xs font-header text-cyan-200 font-bold">{rerollQuest.title}</p>
                <p className="text-[11px] text-gray-400 font-body mt-0.5 leading-tight">
                  {rerollQuest.description}
                </p>
              </div>

              {/* Reroll Options: Option 1: Reward Ad, Option 2: Spend Stars */}
              <div className="flex flex-col gap-2.5">
                {/* Option 1: Watch Reward Ad */}
                <button
                  type="button"
                  onClick={handleStartWatchAd}
                  className="w-full p-3 rounded-2xl bg-gradient-to-r from-cyan-950/80 via-purple-950/80 to-cyan-950/80 hover:from-cyan-900/90 hover:to-purple-900/90 border border-cyan-400/50 hover:border-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all flex items-center justify-between group active:scale-98 cursor-pointer"
                >
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 group-hover:scale-110 transition-transform">
                      <Tv className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-header text-xs font-bold text-white flex items-center gap-1.5">
                        <span>WATCH REWARD AD</span>
                        <span className="px-1.5 py-0.2 rounded text-[8px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase font-mono">
                          FREE
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-300 font-body">
                        Watch short 4-second party sponsor clip
                      </p>
                    </div>
                  </div>
                  <Play className="w-4 h-4 text-cyan-300 fill-cyan-300/30 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </button>

                {/* Option 2: Spend Stars */}
                <button
                  type="button"
                  onClick={handleRerollWithStars}
                  disabled={(economy?.stars || 0) < REROLL_STAR_COST}
                  className={`w-full p-3 rounded-2xl border transition-all flex items-center justify-between group active:scale-98 cursor-pointer ${
                    (economy?.stars || 0) >= REROLL_STAR_COST
                      ? 'bg-gradient-to-r from-amber-950/60 to-orange-950/60 hover:from-amber-900/80 hover:to-orange-900/80 border-amber-400/50 hover:border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                      : 'bg-neutral-900/40 border-white/5 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 group-hover:scale-110 transition-transform">
                      <Star className="w-4 h-4 fill-amber-300/30" />
                    </div>
                    <div>
                      <div className="font-header text-xs font-bold text-white flex items-center gap-1.5">
                        <span>INSTANT REROLL</span>
                        <span className="px-1.5 py-0.2 rounded text-[8px] bg-amber-500/20 text-amber-300 border border-amber-400/30 font-mono">
                          {REROLL_STAR_COST} STARS
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-300 font-body">
                        Your balance: {economy?.stars || 0} Stars
                      </p>
                    </div>
                  </div>
                  <Sparkles className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform shrink-0" />
                </button>
              </div>

              {/* Cancel Button */}
              <button
                type="button"
                onClick={() => setRerollQuest(null)}
                className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-header text-xs tracking-wider uppercase transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* REWARD AD SIMULATION PLAYER OVERLAY                              */}
        {/* ================================================================= */}
        {isWatchingAd && (
          <div className="absolute inset-0 z-50 bg-black/95 flex flex-col justify-between p-5 animate-fade-in text-white select-none">
            {/* Top Bar with Timer & Close */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-400/30 font-bold flex items-center gap-1">
                  <Volume2 className="w-3 h-3 text-amber-400 animate-pulse" />
                  REWARD AD SPONSOR
                </span>
                <span className="text-xs text-gray-300 font-mono">
                  {adCompleted ? 'Completed!' : `Reward in ${adSecondsLeft}s`}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCloseAdEarly}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 cursor-pointer"
                title="Close Ad"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Middle Animated Sponsor Ad Showcase */}
            <div className="flex-1 flex flex-col items-center justify-center text-center my-4 p-4 rounded-3xl bg-gradient-to-b from-cyan-950/40 via-purple-950/40 to-black/80 border border-cyan-400/40 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
              {/* DJ Disc / Party Beats Graphic */}
              <div className="relative w-28 h-28 rounded-full bg-gradient-to-tr from-cyan-500 via-fuchsia-500 to-amber-400 p-1 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.8)] animate-spin-slow">
                <div className="w-full h-full rounded-full bg-black flex flex-col items-center justify-center border-2 border-white/20">
                  <Sparkles className="w-8 h-8 text-cyan-300 animate-pulse" />
                  <span className="font-header text-[9px] font-bold text-cyan-200 tracking-widest mt-1">
                    PICK&apos;U PARTY
                  </span>
                </div>
              </div>

              <h4 className="font-header text-lg font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-fuchsia-300 mt-4 uppercase">
                NEON GLOW ELECTRO ENERGY
              </h4>
              <p className="text-xs text-gray-300 font-body max-w-xs mt-1">
                Official party energy partner. Powering up high-stakes Bomb Pong matches &amp; midnight bottle spins!
              </p>

              {/* Dynamic Sound Equalizer Visualizer Bars */}
              <div className="flex items-end justify-center gap-1.5 h-8 mt-4">
                {[40, 80, 55, 95, 70, 85, 60, 90, 75, 50].map((h, i) => (
                  <div
                    key={i}
                    className="w-1.5 rounded-full bg-gradient-to-t from-cyan-400 to-fuchsia-400 shadow-[0_0_6px_rgba(6,182,212,0.8)] animate-pulse"
                    style={{
                      height: `${h}%`,
                      animationDelay: `${(i * 0.1).toFixed(1)}s`,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Bottom Progress Bar & Completion Notice */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-gray-300">
                <span>{adCompleted ? '🎉 100% Complete!' : 'Watching Reward Video...'}</span>
                <span>{Math.round(((4 - adSecondsLeft) / 4) * 100)}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden border border-white/20">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 shadow-[0_0_12px_rgba(6,182,212,0.9)] transition-all duration-1000 ease-linear"
                  style={{ width: `${((4 - adSecondsLeft) / 4) * 100}%` }}
                />
              </div>

              {adCompleted && (
                <div className="text-center font-header text-xs font-bold text-emerald-400 tracking-wider animate-bounce pt-1">
                  ✓ REWARD GRANTED! REROLLING QUEST...
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

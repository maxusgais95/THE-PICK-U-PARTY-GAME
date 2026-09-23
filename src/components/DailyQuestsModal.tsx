/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Check, Star, Clock, ArrowRight, Sparkles, Trophy } from 'lucide-react';
import {
  DailyQuest,
  claimQuestReward,
  claimMilestoneChest,
  EconomyState,
  getTimeUntilMidnight,
  MILESTONE_CHEST_REWARD,
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
  quests,
  economy,
  onClose,
  onNavigateToGame,
  onEconomyUpdated,
}) => {
  const [timeLeftStr, setTimeLeftStr] = useState<string>(() => getTimeUntilMidnight().formatted);
  const [claimingChest, setClaimingChest] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    const interval = window.setInterval(() => {
      setTimeLeftStr(getTimeUntilMidnight().formatted);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const completedCount = quests.filter((q) => q.currentCount >= q.targetCount).length;
  const totalCount = quests.length || 5;
  const progressPercent = Math.min(100, Math.round((completedCount / totalCount) * 100));
  const isMilestoneClaimed = Boolean(economy?.milestoneChestClaimed);
  const canClaimMilestone = completedCount >= totalCount && !isMilestoneClaimed;

  const handleClaimQuest = (questId: string) => {
    SoundEngine.playTeamDivisionChime();
    Haptics.touchSuccess();
    const res = claimQuestReward(questId);
    if (res.success) {
      onEconomyUpdated(res.updatedState);
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
          {quests.map((quest) => {
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
            } else if (quest.gameMode === 'hub') {
              badgeText = 'DAILY CHECK-IN';
              badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-400/40';
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

                  {/* Action Button */}
                  <div className="shrink-0 flex items-center justify-center self-center">
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
        <div className="p-3 bg-black/70 border-t border-white/10 flex items-center justify-center text-[11px] text-gray-400">
          <span>Quests reset daily at 00:00 midnight local time.</span>
        </div>
      </div>
    </div>
  );
};

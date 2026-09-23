/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Gift, Star, Check, Sparkles, Calendar, Clock, Crown, ShieldAlert } from 'lucide-react';
import { SoundEngine, Haptics } from '../lib/audio';
import currencyStarImg from '../assets/images/Currency Star Sprite.webp';
import day7BundleChestImg from '../assets/images/day7_bundle_chest.webp';
import bombDynamoImg from '../assets/images/bombs/Bomb Dynamo.webp';
import ballCelestialImg from '../assets/images/balls/Ball Celestial.webp';
import {
  EconomyState,
  claimDailyLoginReward,
  getDailyRewardStatus,
  getTimeUntilMidnight,
  DAILY_LOGIN_REWARDS,
} from '../lib/economy';

interface RewardsModalProps {
  isOpen: boolean;
  economy: EconomyState;
  onClose: () => void;
  onEconomyUpdated: (state: EconomyState) => void;
}

export const RewardsModal: React.FC<RewardsModalProps> = ({
  isOpen,
  economy,
  onClose,
  onEconomyUpdated,
}) => {
  const [timeLeftStr, setTimeLeftStr] = useState<string>(() => getTimeUntilMidnight().formatted);
  const [justClaimedDay, setJustClaimedDay] = useState<number | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showDay7Modal, setShowDay7Modal] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    const interval = window.setInterval(() => {
      setTimeLeftStr(getTimeUntilMidnight().formatted);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const status = getDailyRewardStatus(economy);
  const claimedDays = status.claimedDays;
  const currentAvailableDay = status.currentAvailableDay;

  const handleClaim = (day: number) => {
    SoundEngine.playTeamDivisionChime();
    Haptics.touchSuccess();

    const res = claimDailyLoginReward(day);
    if (res.success) {
      setJustClaimedDay(day);
      setToastMsg(`Claimed Day ${day} (+${res.starsAdded} ⭐)!`);
      onEconomyUpdated(res.updatedState);
      setTimeout(() => {
        setJustClaimedDay(null);
        setToastMsg(null);
      }, 3000);
    } else {
      setToastMsg(res.message);
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center pt-[max(2.25rem,calc(env(safe-area-inset-top)+1.25rem))] pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))] px-3 sm:px-4 bg-black/80 backdrop-blur-md animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        id="rewards-modal-container"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md max-h-full flex flex-col rounded-[28px] bg-gradient-to-b from-[#24081c]/95 via-[#140410]/95 to-black/95 border-2 border-pink-500/40 shadow-[0_0_40px_rgba(236,72,153,0.3)] overflow-hidden text-white"
      >
        {/* Top Header Bar */}
        <div className="relative px-5 pt-4 pb-3 border-b border-pink-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-400 flex items-center justify-center shadow-[0_0_15px_rgba(236,72,153,0.5)] border border-pink-300/60 text-white">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-header text-xl sm:text-2xl font-bold tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-pink-200 via-rose-300 to-amber-300 leading-none">
                PARTY REWARDS
              </h2>
              <div className="flex items-center gap-1.5 text-[11px] text-pink-200/70 mt-1 font-body">
                <Calendar className="w-3 h-3 text-pink-400" />
                <span>7-Day Daily Login</span>
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
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-gray-300 hover:text-white transition-all active:scale-95 cursor-pointer"
            aria-label="Close Rewards"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Balance Ribbon */}
        <div className="px-5 py-2.5 bg-pink-950/30 border-b border-pink-500/10 flex items-center justify-between">
          <span className="text-xs text-pink-200/80 font-header tracking-wider">YOUR BALANCE</span>
          <div className="flex items-center gap-1.5 font-header font-bold text-sm text-amber-300">
            <img src={currencyStarImg} alt="Stars" className="w-4 h-4 object-contain drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
            <span>{economy.stars.toLocaleString()} Stars</span>
          </div>
        </div>

        {/* Next Unlock Banner */}
        <div className="px-5 py-2 bg-black/40 border-b border-white/5 flex items-center justify-between text-xs">
          {status.allDaysClaimed ? (
            <span className="text-emerald-300 font-header font-bold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> All 7 Days Claimed! Mastery Achieved!
            </span>
          ) : status.canClaimToday && currentAvailableDay ? (
            <span className="text-amber-300 font-header font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Day {currentAvailableDay} Reward is Ready to Claim!
            </span>
          ) : (
            <div className="flex items-center gap-1.5 text-gray-300 font-body">
              <Clock className="w-3.5 h-3.5 text-pink-400" />
              <span>
                Today claimed! Day {(claimedDays.length + 1)} unlocks in <strong className="text-pink-300 font-mono">{timeLeftStr}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Toast Feedback */}
        {toastMsg && (
          <div className="px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white text-xs font-header font-bold text-center tracking-wide animate-pulse">
            {toastMsg}
          </div>
        )}

        {/* 7-Day Calendar Grid */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="grid grid-cols-3 sm:grid-cols-3 gap-2.5">
            {DAILY_LOGIN_REWARDS.map((reward) => {
              const isClaimed = claimedDays.includes(reward.day);
              const isReady = reward.day === currentAvailableDay && status.canClaimToday;
              const isUpcoming = reward.day > claimedDays.length && !isReady;
              const isGrand = reward.isGrand;

              if (isGrand) {
                return (
                  <div
                    key={reward.day}
                    className={`relative col-span-3 h-[114px] rounded-2xl p-2.5 sm:p-3 border transition-all overflow-hidden flex items-center justify-between gap-2.5 ${
                      isClaimed
                        ? 'bg-neutral-900/60 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                        : isReady
                        ? 'bg-gradient-to-r from-amber-950/80 via-purple-950/70 to-pink-950/80 border-amber-400/80 shadow-[0_0_18px_rgba(245,158,11,0.35)]'
                        : 'bg-black/60 border-amber-500/30'
                    }`}
                  >
                    {/* Left: Clickable Chest Visual & Info */}
                    <button
                      type="button"
                      onClick={() => {
                        SoundEngine.playButtonClick();
                        Haptics.buttonClick();
                        setShowDay7Modal(true);
                      }}
                      className="flex items-center gap-2.5 sm:gap-3 min-w-0 text-left cursor-pointer group/chest hover:opacity-95 transition-all flex-1"
                      title="Click chest to view exclusive Day 7 rewards"
                    >
                      <div className="relative shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border border-amber-400/50 shadow-sm group-hover/chest:scale-105 group-hover/chest:border-amber-300 transition-all">
                        <img
                          src={day7BundleChestImg}
                          alt="Day 7 Chest"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Middle Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-1.5 py-0.5 rounded bg-amber-400 text-black font-header font-black text-[9px] uppercase tracking-wider group-hover/chest:bg-amber-300">
                            DAY 7 GRAND VAULT
                          </span>
                          <span className="font-header font-bold text-xs text-amber-300 flex items-center gap-1">
                            <span>+1,000</span>
                            <img src={currencyStarImg} alt="Stars" className="w-3.5 h-3.5 object-contain" />
                          </span>
                        </div>
                        <p className="text-[10px] sm:text-[11px] text-gray-300 font-medium truncate mt-0.5">
                          Includes <span className="text-amber-300 font-semibold">Dynamo Reactor Bomb</span> &amp; <span className="text-yellow-300 font-semibold">Celestial Astral Orb</span>
                        </p>
                        <span className="text-[9px] text-amber-400/90 font-medium flex items-center gap-1 mt-0.5">
                          <Sparkles className="w-2.5 h-2.5" /> Tap chest to inspect exclusive items
                        </span>
                      </div>
                    </button>

                    {/* Right: Action / Status */}
                    <div className="shrink-0">
                      {isClaimed ? (
                        <div className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-header font-bold text-[10px] flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>CLAIMED</span>
                        </div>
                      ) : isReady ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClaim(reward.day);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 text-black font-header font-black text-xs uppercase tracking-wider shadow-[0_0_12px_rgba(245,158,11,0.6)] border border-yellow-200 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer animate-glow-pulse"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>CLAIM</span>
                        </button>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-header text-gray-400 font-bold uppercase tracking-wider">
                          {isUpcoming ? (reward.day === claimedDays.length + 1 ? 'TOMORROW' : 'DAY 7') : 'LOCKED'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={reward.day}
                  className={`relative h-[114px] rounded-2xl p-2.5 flex flex-col items-center justify-between border transition-all text-center col-span-1 ${
                    isClaimed
                      ? 'bg-neutral-900/40 border-white/5 opacity-60'
                      : isReady
                      ? 'bg-gradient-to-b from-pink-950/80 to-purple-950/80 border-pink-400/80 shadow-[0_0_18px_rgba(236,72,153,0.4)]'
                      : 'bg-black/40 border-white/10 opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-center w-full">
                    <span className="font-header text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                      {reward.label}
                    </span>
                  </div>

                  <div className="my-1 relative flex items-center justify-center">
                    <img
                      src={currencyStarImg}
                      alt="Stars"
                      className={`w-7 h-7 object-contain transition-all ${
                        isClaimed
                          ? 'grayscale opacity-30'
                          : isReady
                          ? 'drop-shadow-[0_0_12px_rgba(245,158,11,0.95)]'
                          : 'opacity-40 grayscale-[40%]'
                      }`}
                    />
                  </div>

                  <span className="font-header text-xs font-bold text-amber-300 mb-1 flex items-center justify-center gap-1">
                    <span>+{reward.stars}</span>
                    <img src={currencyStarImg} alt="Stars" className="w-3 h-3 object-contain" />
                  </span>

                  {isClaimed ? (
                    <span className="text-[10px] font-header font-bold text-emerald-400 flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> CLAIMED
                    </span>
                  ) : isReady ? (
                    <button
                      type="button"
                      onClick={() => handleClaim(reward.day)}
                      className="w-full py-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-orange-400 to-pink-500 text-black font-header font-bold text-[11px] uppercase tracking-wider shadow-[0_0_12px_rgba(245,158,11,0.6)] border border-yellow-200 active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer animate-glow-pulse"
                    >
                      <Sparkles className="w-3 h-3" /> CLAIM
                    </button>
                  ) : (
                    <span className="text-[10px] font-header text-gray-500 uppercase tracking-wider">
                      {isUpcoming ? (reward.day === claimedDays.length + 1 ? 'TOMORROW' : 'LOCKED') : 'LOCKED'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Day 7 Grand Vault Exclusive Rewards Popup Window */}
      {showDay7Modal && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-3.5 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none"
          onClick={() => {
            SoundEngine.playButtonClick();
            setShowDay7Modal(false);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm sm:max-w-md rounded-[28px] bg-gradient-to-b from-[#240e32]/98 via-[#150720]/98 to-black/98 border-2 border-amber-400/70 shadow-[0_0_50px_rgba(245,158,11,0.45)] overflow-hidden text-white flex flex-col max-h-[88vh] animate-scale-up"
          >
            {/* Top Header */}
            <div className="relative px-5 pt-4 pb-3 border-b border-amber-500/20 flex items-center justify-between shrink-0 bg-black/40">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-400 to-amber-600 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.5)] border border-yellow-200 text-black shrink-0">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-header font-black text-[9px] uppercase tracking-wider">
                      DAY 7 EXCLUSIVE
                    </span>
                  </div>
                  <h3 className="font-header text-lg sm:text-xl font-bold tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 leading-none mt-1">
                    GRAND VAULT BUNDLE
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  SoundEngine.playButtonClick();
                  Haptics.buttonClick();
                  setShowDay7Modal(false);
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-gray-300 hover:text-white transition-all active:scale-95 cursor-pointer shrink-0"
                aria-label="Close Preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Showcase Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-3.5 custom-scrollbar">
              {/* Grand Chest Hero Stage */}
              <div className="relative rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-950/40 via-purple-950/30 to-black/60 p-4 flex flex-col items-center justify-center text-center overflow-hidden shadow-[inset_0_0_30px_rgba(245,158,11,0.15)]">
                {/* Ambient radial aura */}
                <div className="absolute w-40 h-40 rounded-full bg-amber-500/20 blur-2xl pointer-events-none" />

                <div className="relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-[0_0_24px_rgba(245,158,11,0.6)] mb-2.5">
                  <img
                    src={day7BundleChestImg}
                    alt="Day 7 Grand Vault Chest"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="relative z-10">
                  <span className="font-header font-extrabold text-sm sm:text-base text-yellow-300 tracking-wider">
                    EXCLUSIVE 7-DAY LOGIN STREAK REWARD
                  </span>
                  <p className="text-[11px] text-amber-200/80 mt-1 max-w-xs font-body leading-relaxed">
                    Reach Day 7 of consecutive daily logins to unlock this legendary party vault containing all 3 exclusive rewards below!
                  </p>
                </div>
              </div>

              {/* 3 Exclusive Rewards Showcase */}
              <div className="space-y-2.5">
                {/* Reward 1: 1,000 Currency Stars */}
                <div className="rounded-xl bg-black/60 border border-amber-400/40 p-3 flex items-center gap-3 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500/20 via-yellow-500/20 to-transparent border border-amber-400/50 flex items-center justify-center shrink-0 shadow-inner">
                    <img
                      src={currencyStarImg}
                      alt="Stars"
                      className="w-8 h-8 object-contain drop-shadow-[0_0_10px_rgba(245,158,11,0.9)]"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-header font-bold text-sm text-yellow-300">
                        +1,000 Party Stars
                      </h4>
                      <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[9px] font-header font-bold">
                        CURRENCY
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-300 font-body mt-0.5">
                      Massive boost of spendable stars to purchase bottles, balls, and accessories in the Store.
                    </p>
                  </div>
                </div>

                {/* Reward 2: Dynamo Reactor Bomb */}
                <div className="relative z-10 rounded-xl bg-black/60 border border-amber-400/50 p-3 flex items-center gap-3 shadow-[0_0_15px_rgba(245,158,11,0.2)] overflow-visible">
                  <div className="relative w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500/25 via-yellow-500/20 to-transparent border border-amber-400/60 flex items-center justify-center shrink-0 shadow-inner overflow-visible z-20">
                    <img
                      src={bombDynamoImg}
                      alt="Dynamo Reactor Bomb"
                      className="relative z-30 w-10 h-10 object-contain drop-shadow-[0_0_12px_rgba(245,158,11,0.95)] transform scale-150 animate-pulse pointer-events-none"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-header font-bold text-sm text-amber-300">
                        Dynamo Reactor Bomb
                      </h4>
                      <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 text-[9px] font-header font-black tracking-wider uppercase">
                        LEGENDARY BOMB
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-300 font-body mt-0.5">
                      High-voltage electromagnetic dynamo reactor radiating kinetic lightning coils. Equippable in Kaboom!
                    </p>
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-400/90 font-medium">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>Cannot be bought in store — Day 7 streak exclusive!</span>
                    </div>
                  </div>
                </div>

                {/* Reward 3: Celestial Astral Orb */}
                <div className="rounded-xl bg-black/60 border border-amber-400/50 p-3 flex items-center gap-3 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500/25 via-yellow-500/20 to-transparent border border-amber-400/60 flex items-center justify-center shrink-0 shadow-inner">
                    <img
                      src={ballCelestialImg}
                      alt="Celestial Astral Orb"
                      className="w-10 h-10 object-contain drop-shadow-[0_0_10px_rgba(245,158,11,0.9)] animate-pulse"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-header font-bold text-sm text-yellow-300">
                        Celestial Astral Orb
                      </h4>
                      <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 text-[9px] font-header font-black tracking-wider uppercase">
                        LEGENDARY BALL
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-300 font-body mt-0.5">
                      Divine celestial sphere enveloped in golden galactic constellation rings and violet nebulae. Equippable in Kaboom &amp; Finger Roulette!
                    </p>
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-400/90 font-medium">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>Cannot be bought in store — Day 7 streak exclusive!</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Action Bar */}
            {(claimedDays.includes(7) || (currentAvailableDay === 7 && status.canClaimToday)) && (
              <div className="p-4 border-t border-white/10 bg-black/60 flex flex-col gap-2 shrink-0">
                {claimedDays.includes(7) ? (
                  <div className="w-full py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-header font-bold text-xs flex items-center justify-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>VAULT UNLOCKED • AVAILABLE IN WARDROBE</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      handleClaim(7);
                      setShowDay7Modal(false);
                    }}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 text-black font-header font-black text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.8)] border border-yellow-200 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer animate-glow-pulse"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>CLAIM DAY 7 GRAND BUNDLE NOW!</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

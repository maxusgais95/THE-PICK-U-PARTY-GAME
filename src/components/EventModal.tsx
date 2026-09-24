/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Calendar,
  Clock,
  ChevronRight,
  ChevronLeft,
  Lock,
  Check,
  Gift,
  HelpCircle,
  Coins,
  Zap,
  ShoppingBag,
  Flame,
  Award,
  Link2,
} from 'lucide-react';
import {
  GameEvent,
  EventMilestoneReward,
  EventStoreItem,
  PlayerEventProgress,
  EventsStorageState,
} from '../types/events';
import {
  getEventsState,
  getPlayerProgress,
  claimMilestoneReward,
  redeemEventStoreItem,
  formatTimeRemaining,
  isEventLive,
} from '../lib/events';
import { SoundEngine, Haptics } from '../lib/audio';
import { EconomyState } from '../lib/economy';
import starSpriteImg from '../assets/images/Star Sprite.webp';
import chestSpriteImg from '../assets/images/Chest Sprite.webp';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  economy: EconomyState;
  onEconomyUpdated: (eco: EconomyState) => void;
  onNavigateToGame?: (game: 'roulette' | 'bottle' | 'kaboom') => void;
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  economy,
  onEconomyUpdated,
  onNavigateToGame,
}) => {
  const [eventsState, setEventsState] = useState<EventsStorageState>(() => getEventsState());
  const [selectedEventId, setSelectedEventId] = useState<string>(() => {
    const state = getEventsState();
    const live = state.events.filter(isEventLive);
    return live[0]?.id || state.events[0]?.id || '';
  });
  const [activeSubTab, setActiveSubTab] = useState<'rewards' | 'store'>('rewards');
  const [showRulesDrawer, setShowRulesDrawer] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const trackScrollRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Sync state whenever events update
  useEffect(() => {
    const handleEventsUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<EventsStorageState>;
      if (customEvent.detail) {
        setEventsState(customEvent.detail);
      } else {
        setEventsState(getEventsState());
      }
    };

    window.addEventListener('picku_events_updated', handleEventsUpdated);
    window.addEventListener('picku_event_xp_gained', handleEventsUpdated);

    return () => {
      window.removeEventListener('picku_events_updated', handleEventsUpdated);
      window.removeEventListener('picku_event_xp_gained', handleEventsUpdated);
    };
  }, []);

  if (!isOpen) return null;

  const currentEvent: GameEvent | undefined =
    eventsState.events.find((e) => e.id === selectedEventId) || eventsState.events[0];

  if (!currentEvent) {
    return null;
  }

  const progress: PlayerEventProgress =
    eventsState.playerProgress[currentEvent.id] || getPlayerProgress(currentEvent.id);

  const isLive = isEventLive(currentEvent);
  const timeRemaining = formatTimeRemaining(currentEvent.endDate);

  // Group events into connected series and separate events for tab navigation
  const connectedEvents = eventsState.events.filter((e) => e.eventType === 'connected');
  const separateEvents = eventsState.events.filter((e) => e.eventType === 'separate');

  // Milestone claim action
  const handleClaimMilestone = (milestoneId: string) => {
    SoundEngine.playButtonClick();
    Haptics.buttonClick();

    const result = claimMilestoneReward(currentEvent.id, milestoneId);
    if (result.success) {
      showToast(result.message);
      // Trigger update
      setEventsState(getEventsState());
    } else {
      showToast(result.message);
    }
  };

  // Point Store item redemption action
  const handleRedeemStoreItem = (item: EventStoreItem) => {
    SoundEngine.playButtonClick();
    Haptics.buttonClick();

    const result = redeemEventStoreItem(currentEvent.id, item.id);
    if (result.success) {
      showToast(result.message);
      setEventsState(getEventsState());
    } else {
      showToast(result.message);
    }
  };

  // Scroll helpers for the progress track
  const handleScrollTrack = (direction: 'left' | 'right') => {
    if (trackScrollRef.current) {
      const offset = direction === 'left' ? -280 : 280;
      trackScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const currentXp = progress.currentXp || 0;
  const eventPoints = progress.eventPoints || 0;
  const claimedMilestones = progress.claimedMilestones || [];
  const maxTrackXp =
    currentEvent.rewardsTrack[currentEvent.rewardsTrack.length - 1]?.requiredXp || 1000;
  const totalTrackProgressPct = Math.min(100, Math.round((currentXp / maxTrackXp) * 100));

  return (
    <div
      id="event-system-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          SoundEngine.playButtonClick();
          onClose();
        }
      }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-60 animate-bounce">
          <div className="px-5 py-2.5 rounded-full bg-cyan-900/95 text-cyan-200 font-bold text-xs shadow-[0_0_24px_rgba(6,182,212,0.8)] border border-cyan-400 backdrop-blur-md flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Main Modal Container */}
      <div
        id="event-modal-window"
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden text-zinc-100"
        style={{
          boxShadow: `0 0 40px -10px ${currentEvent.accentColor || '#06b6d4'}40`,
        }}
      >
        {/* Top Header Bar with Close Button */}
        <div className="relative z-20 flex items-center justify-between px-4 sm:px-6 py-3 bg-zinc-900/90 border-b border-zinc-800 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-xl flex items-center justify-center shadow-sm"
              style={{ backgroundColor: `${currentEvent.accentColor || '#06b6d4'}33` }}
            >
              <Award className="w-4 h-4" style={{ color: currentEvent.accentColor || '#06b6d4' }} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                PARTY EVENTS HUB
              </span>
              <h2 className="text-sm sm:text-base font-black tracking-wide text-white uppercase leading-none">
                {currentEvent.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            id="event-modal-close-btn"
            onClick={() => {
              SoundEngine.playButtonClick();
              Haptics.buttonClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close Event Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Tabs of Connected / Separate Events */}
        <div
          id="event-modal-tabs-bar"
          className="flex items-center gap-1.5 px-4 sm:px-6 py-2 bg-zinc-900/50 border-b border-zinc-800/80 overflow-x-auto scrollbar-none"
        >
          <span className="text-[10px] font-bold text-zinc-500 uppercase shrink-0 mr-1">
            Events:
          </span>

          {/* Connected Series Tabs */}
          {connectedEvents.map((evt) => {
            const isSelected = evt.id === currentEvent.id;
            const liveStatus = isEventLive(evt);
            const p = eventsState.playerProgress[evt.id] || getPlayerProgress(evt.id);
            const hasClaimableReward = evt.rewardsTrack.some(
              (m) => (p.currentXp || 0) >= m.requiredXp && !p.claimedMilestones.includes(m.id)
            );

            return (
              <button
                key={evt.id}
                type="button"
                id={`event-tab-${evt.id}`}
                onClick={() => {
                  SoundEngine.playButtonClick();
                  Haptics.buttonClick();
                  setSelectedEventId(evt.id);
                }}
                className={`relative px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-zinc-800 text-white shadow-[0_0_12px_rgba(255,255,255,0.15)] border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
                }`}
              >
                <Link2 className="w-3 h-3 text-cyan-400" />
                <span>{evt.chapterTitle || evt.title.split(':')[0]}</span>

                {/* Status Dot */}
                <span
                  className={`w-2 h-2 rounded-full ${
                    liveStatus ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-purple-400'
                  }`}
                />

                {/* Claimable notification ping */}
                {hasClaimableReward && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                )}
              </button>
            );
          })}

          {/* Separate Events Tabs */}
          {separateEvents.map((evt) => {
            const isSelected = evt.id === currentEvent.id;
            const liveStatus = isEventLive(evt);
            const p = eventsState.playerProgress[evt.id] || getPlayerProgress(evt.id);
            const hasClaimableReward = evt.rewardsTrack.some(
              (m) => (p.currentXp || 0) >= m.requiredXp && !p.claimedMilestones.includes(m.id)
            );

            return (
              <button
                key={evt.id}
                type="button"
                id={`event-tab-${evt.id}`}
                onClick={() => {
                  SoundEngine.playButtonClick();
                  Haptics.buttonClick();
                  setSelectedEventId(evt.id);
                }}
                className={`relative px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-zinc-800 text-white shadow-[0_0_12px_rgba(255,255,255,0.15)] border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
                }`}
              >
                <Flame className="w-3 h-3 text-orange-400" />
                <span>{evt.title.split(':')[0]}</span>

                {/* Status Dot */}
                <span
                  className={`w-2 h-2 rounded-full ${
                    liveStatus ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-zinc-500'
                  }`}
                />

                {hasClaimableReward && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                )}
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 flex flex-col gap-5">
          {/* 2. Hero Background Splash Art Card */}
          <div className="relative w-full rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 min-h-[160px] sm:min-h-[190px] flex flex-col justify-end p-4 sm:p-6">
            {/* Splash Background Image */}
            <div className="absolute inset-0 z-0">
              <img
                src={currentEvent.splashArtUrl}
                alt={currentEvent.title}
                className="w-full h-full object-cover object-center opacity-40 filter brightness-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent" />
            </div>

            {/* Event Metadata & Schedule Info */}
            <div className="relative z-10 flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {/* Live Status indicator */}
                {isLive ? (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                    </span>
                    <span>LIVE IN GAME</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300 bg-purple-950/80 px-2.5 py-1 rounded-lg border border-purple-500/40">
                    <Clock className="w-3.5 h-3.5" />
                    <span>SCHEDULED</span>
                  </div>
                )}

                {/* Schedule Dates & Time Remaining */}
                <div className="flex items-center gap-1.5 text-xs text-zinc-300 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-zinc-700">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span>
                    {currentEvent.startDate.slice(0, 10)} to {currentEvent.endDate.slice(0, 10)}
                  </span>
                  <span className="text-zinc-500">·</span>
                  <span className="text-cyan-300 font-semibold">{timeRemaining.formatted}</span>
                </div>

                {/* Event Series Tag */}
                {currentEvent.seriesTitle && (
                  <div className="text-xs text-cyan-300/90 font-bold bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-800/60">
                    {currentEvent.seriesTitle}
                  </div>
                )}
              </div>

              {/* Title & Subtitle */}
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-wide text-white uppercase drop-shadow-md">
                  {currentEvent.title}
                </h1>
                <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl mt-1 leading-relaxed">
                  {currentEvent.description}
                </p>
              </div>

              {/* Action Bar: Rules Button & Game Quick-Launch */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <button
                  type="button"
                  id="event-rules-toggle-btn"
                  onClick={() => {
                    SoundEngine.playButtonClick();
                    setShowRulesDrawer(!showRulesDrawer);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-xs font-bold text-zinc-200 flex items-center gap-1.5 border border-zinc-700 transition-colors cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{showRulesDrawer ? 'Hide Rules & Rates' : 'View Rules & XP Rates'}</span>
                </button>

                {onNavigateToGame && isLive && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        SoundEngine.playButtonClick();
                        onClose();
                        onNavigateToGame('roulette');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold border border-cyan-500/40 transition-colors cursor-pointer"
                    >
                      Play Roulette (+35 XP)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        SoundEngine.playButtonClick();
                        onClose();
                        onNavigateToGame('bottle');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 text-xs font-bold border border-pink-500/40 transition-colors cursor-pointer"
                    >
                      Spin Bottle (+25 XP)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        SoundEngine.playButtonClick();
                        onClose();
                        onNavigateToGame('kaboom');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 text-xs font-bold border border-orange-500/40 transition-colors cursor-pointer"
                    >
                      Play Kaboom (+50 XP)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rules Drawer (Expandable) */}
          {showRulesDrawer && (
            <div
              id="event-rules-drawer"
              className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex flex-col gap-2.5 animate-fade-in"
            >
              <div className="flex items-center gap-2 text-xs font-black uppercase text-cyan-400 tracking-wider">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span>HOW TO EARN EXPERIENCE & EVENT POINTS</span>
              </div>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-zinc-300">
                {currentEvent.rules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-850">
                    <span className="text-cyan-400 font-bold shrink-0">#{idx + 1}</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 3. Sub-Tab Switcher: Rewards Track vs Point Store */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-2 p-1 bg-zinc-900/80 rounded-xl border border-zinc-800">
              <button
                type="button"
                id="event-subtab-rewards"
                onClick={() => {
                  SoundEngine.playButtonClick();
                  Haptics.buttonClick();
                  setActiveSubTab('rewards');
                }}
                className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeSubTab === 'rewards'
                    ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>XP Rewards Track</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                  {currentEvent.rewardsTrack.length} Tiers
                </span>
              </button>

              <button
                type="button"
                id="event-subtab-store"
                onClick={() => {
                  SoundEngine.playButtonClick();
                  Haptics.buttonClick();
                  setActiveSubTab('store');
                }}
                className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeSubTab === 'store'
                    ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Point Store</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold">
                  ✦ {eventPoints} Pts
                </span>
              </button>
            </div>

            {/* Quick XP Status Summary Pill */}
            <div className="hidden sm:flex items-center gap-3 text-xs font-bold bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800">
              <div className="flex items-center gap-1.5 text-cyan-300">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>{currentXp} Event XP</span>
              </div>
              <span className="text-zinc-600">|</span>
              <div className="flex items-center gap-1.5 text-amber-300">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>{eventPoints} Event Points</span>
              </div>
            </div>
          </div>

          {/* VIEW A: XP REWARDS TRACK (SCROLLING PROGRESS BAR) */}
          {activeSubTab === 'rewards' && (
            <div id="event-rewards-track-view" className="flex flex-col gap-4">
              {/* Progress Summary Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-800">
                <div>
                  <div className="text-xs font-bold text-zinc-400">Total Event Progression</div>
                  <div className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <span>
                      {currentXp} / {maxTrackXp} XP
                    </span>
                    <span className="text-xs font-semibold text-zinc-500">
                      ({totalTrackProgressPct}% Completed)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => handleScrollTrack('left')}
                    className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
                    title="Scroll Left"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleScrollTrack('right')}
                    className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
                    title="Scroll Right"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* HORIZONTAL SCROLLING PROGRESS TRACK CONTAINER */}
              <div
                ref={trackScrollRef}
                id="event-scrolling-progress-track"
                className="relative w-full overflow-x-auto py-6 px-4 bg-zinc-950 rounded-2xl border border-zinc-850 scrollbar-thin scrollbar-thumb-zinc-800"
              >
                {/* Visual Rail Line */}
                <div className="relative flex items-center min-w-max gap-8 pb-4">
                  {/* Continuous Base Track Line */}
                  <div className="absolute top-[86px] left-8 right-8 h-2 bg-zinc-850 rounded-full z-0 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-amber-400 shadow-[0_0_12px_rgba(6,182,212,0.8)] transition-all duration-500"
                      style={{ width: `${totalTrackProgressPct}%` }}
                    />
                  </div>

                  {/* Milestone Nodes */}
                  {currentEvent.rewardsTrack.map((milestone, index) => {
                    const isReached = currentXp >= milestone.requiredXp;
                    const isClaimed = claimedMilestones.includes(milestone.id);
                    const isClaimable = isReached && !isClaimed;

                    return (
                      <div
                        key={milestone.id}
                        id={`milestone-node-${milestone.id}`}
                        className="relative z-10 flex flex-col items-center w-[170px] shrink-0"
                      >
                        {/* XP Required Header Badge */}
                        <div
                          className={`text-[10px] font-black tracking-wider px-2 py-0.5 rounded-full mb-3 uppercase ${
                            isReached
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          }`}
                        >
                          {milestone.requiredXp} XP
                        </div>

                        {/* Central Reward Node Card */}
                        <div
                          className={`w-full p-3 rounded-2xl flex flex-col items-center text-center gap-2 transition-all ${
                            isClaimable
                              ? 'bg-gradient-to-b from-cyan-950/80 to-zinc-900 border-2 border-cyan-400 shadow-[0_0_24px_rgba(6,182,212,0.6)] animate-subtle-bounce'
                              : isClaimed
                              ? 'bg-zinc-900/50 border border-zinc-800 opacity-80'
                              : 'bg-zinc-900/80 border border-zinc-800 opacity-90'
                          }`}
                        >
                          {/* Reward Icon / Sprite Visual */}
                          <div className="relative w-16 h-16 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-center p-1.5 overflow-hidden">
                            {milestone.rewardType === 'star' && (
                              <img
                                src={starSpriteImg}
                                alt="Stars"
                                className="w-12 h-12 object-contain filter drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]"
                              />
                            )}

                            {milestone.rewardType === 'point' && (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.8)]">
                                <span className="text-lg font-black text-black">✦</span>
                              </div>
                            )}

                            {milestone.rewardType === 'skin' && milestone.skinData && (
                              <div className="relative w-full h-full flex items-center justify-center">
                                {milestone.skinData.image ? (
                                  <img
                                    src={milestone.skinData.image}
                                    alt={milestone.skinData.name}
                                    className="max-w-full max-h-full object-contain filter drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                                    style={{ filter: milestone.skinData.cssFilter || undefined }}
                                  />
                                ) : (
                                  <ShoppingBag className="w-8 h-8 text-fuchsia-400" />
                                )}
                              </div>
                            )}

                            {/* Claimed checkmark overlay */}
                            {isClaimed && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-black">
                                  <Check className="w-4 h-4 stroke-[3]" />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Reward Title & Details */}
                          <div className="w-full">
                            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                              {milestone.rewardType === 'skin'
                                ? milestone.skinData?.rarity || 'Exclusive'
                                : milestone.rewardType === 'star'
                                ? 'Star Reward'
                                : 'Event Token'}
                            </div>
                            <div className="text-xs font-bold text-white truncate max-w-full">
                              {milestone.rewardTitle}
                            </div>
                          </div>

                          {/* Action Button */}
                          {isClaimed ? (
                            <button
                              type="button"
                              disabled
                              className="w-full py-1.5 rounded-xl bg-zinc-800 text-zinc-500 text-[11px] font-bold flex items-center justify-center gap-1 cursor-default"
                            >
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Claimed</span>
                            </button>
                          ) : isClaimable ? (
                            <button
                              type="button"
                              onClick={() => handleClaimMilestone(milestone.id)}
                              className="w-full py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-300 text-zinc-950 text-[11px] font-black uppercase tracking-wider shadow-[0_0_12px_rgba(6,182,212,0.8)] hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                            >
                              CLAIM!
                            </button>
                          ) : (
                            <div className="w-full py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-500 text-[10px] font-semibold flex items-center justify-center gap-1">
                              <Lock className="w-3 h-3 text-zinc-600" />
                              <span>{milestone.requiredXp - currentXp} XP to go</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* VIEW B: EVENT POINT STORE (REDEEM REWARDS WITH EVENT POINTS) */}
          {activeSubTab === 'store' && (
            <div id="event-point-store-view" className="flex flex-col gap-4">
              {/* Store Header Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-950 p-4 rounded-2xl border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
                <div>
                  <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4" />
                    <span>EVENT POINT REDEMPTION STORE</span>
                  </div>
                  <p className="text-xs text-zinc-300 mt-0.5">
                    Exchange points earned from game rounds and milestones for rare skins & stars!
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-black/60 px-4 py-2 rounded-xl border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
                  <span className="text-base font-black text-amber-400">✦</span>
                  <div className="text-left">
                    <div className="text-[9px] font-bold text-zinc-400 leading-none">AVAILABLE</div>
                    <div className="text-sm font-black text-amber-300 leading-none">
                      {eventPoints} POINTS
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentEvent.storeItems.map((item) => {
                  const isRedeemed = progress.redeemedStoreItems.includes(item.id);
                  const canAfford = eventPoints >= item.costInPoints;

                  return (
                    <div
                      key={item.id}
                      id={`event-store-item-${item.id}`}
                      className={`p-4 rounded-2xl flex flex-col justify-between gap-3 transition-all ${
                        isRedeemed
                          ? 'bg-zinc-900/40 border border-zinc-800 opacity-70'
                          : 'bg-zinc-900 border border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      {/* Item Visual Area */}
                      <div className="w-full h-32 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-center p-3 relative overflow-hidden">
                        {item.rewardType === 'star' && (
                          <div className="flex flex-col items-center justify-center gap-1">
                            <img
                              src={starSpriteImg}
                              alt="Stars"
                              className="w-16 h-16 object-contain filter drop-shadow-[0_0_12px_rgba(251,191,36,0.9)]"
                            />
                            <span className="text-xs font-black text-amber-300">
                              +{item.rewardValue} STARS
                            </span>
                          </div>
                        )}

                        {item.rewardType === 'skin' && item.skinData && (
                          <div className="relative w-full h-full flex items-center justify-center">
                            {item.skinData.image ? (
                              <img
                                src={item.skinData.image}
                                alt={item.skinData.name}
                                className="max-w-full max-h-full object-contain filter drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]"
                                style={{ filter: item.skinData.cssFilter || undefined }}
                              />
                            ) : (
                              <ShoppingBag className="w-10 h-10 text-fuchsia-400" />
                            )}
                          </div>
                        )}

                        {/* Cost Tag Overlay */}
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-sm border border-amber-500/40 text-[10px] font-black text-amber-300 flex items-center gap-1">
                          <span>✦</span>
                          <span>{item.costInPoints}</span>
                        </div>
                      </div>

                      {/* Details */}
                      <div>
                        <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400">
                          <span>{item.subtitle || 'Limited Reward'}</span>
                          {item.skinData && (
                            <span className="text-amber-400">{item.skinData.rarity}</span>
                          )}
                        </div>
                        <h4 className="text-sm font-black text-white mt-0.5">{item.name}</h4>
                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      {/* Action Button */}
                      {isRedeemed ? (
                        <button
                          type="button"
                          disabled
                          className="w-full py-2 rounded-xl bg-zinc-800 text-zinc-500 text-xs font-bold flex items-center justify-center gap-1 cursor-default"
                        >
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span>Redeemed</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRedeemStoreItem(item)}
                          disabled={!canAfford}
                          className={`w-full py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                            canAfford
                              ? 'bg-amber-400 hover:bg-amber-300 text-zinc-950 shadow-[0_0_14px_rgba(245,158,11,0.6)] cursor-pointer active:scale-98'
                              : 'bg-zinc-850 text-zinc-500 cursor-not-allowed border border-zinc-800'
                          }`}
                        >
                          {canAfford ? (
                            <>
                              <span>REDEEM FOR {item.costInPoints} PTS</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-3.5 h-3.5" />
                              <span>Need {item.costInPoints - eventPoints} More Pts</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

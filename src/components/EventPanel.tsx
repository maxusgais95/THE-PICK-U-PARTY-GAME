/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, Zap, Flame, Clock } from 'lucide-react';
import { GameEvent, PlayerEventProgress } from '../types/events';
import { getActiveLiveEvents, getPlayerProgress, formatTimeRemaining } from '../lib/events';
import { SoundEngine, Haptics } from '../lib/audio';

interface EventPanelProps {
  onOpenEvents: () => void;
}

export const EventPanel: React.FC<EventPanelProps> = ({ onOpenEvents }) => {
  const [activeEvents, setActiveEvents] = useState<GameEvent[]>(() => getActiveLiveEvents());
  const [primaryEvent, setPrimaryEvent] = useState<GameEvent | null>(() => {
    const live = getActiveLiveEvents();
    return live[0] || null;
  });
  const [progress, setProgress] = useState<PlayerEventProgress | null>(() => {
    const live = getActiveLiveEvents();
    return live[0] ? getPlayerProgress(live[0].id) : null;
  });

  const syncEventData = () => {
    const live = getActiveLiveEvents();
    setActiveEvents(live);
    if (live.length > 0) {
      setPrimaryEvent(live[0]);
      setProgress(getPlayerProgress(live[0].id));
    } else {
      setPrimaryEvent(null);
      setProgress(null);
    }
  };

  useEffect(() => {
    syncEventData();

    const handleEventsUpdated = () => syncEventData();
    const handleXpGained = () => syncEventData();

    window.addEventListener('picku_events_updated', handleEventsUpdated);
    window.addEventListener('picku_event_xp_gained', handleXpGained);

    // Refresh every minute to keep time remaining accurate
    const interval = setInterval(syncEventData, 60000);

    return () => {
      window.removeEventListener('picku_events_updated', handleEventsUpdated);
      window.removeEventListener('picku_event_xp_gained', handleXpGained);
      clearInterval(interval);
    };
  }, []);

  if (!primaryEvent) {
    return null;
  }

  // Calculate claimable milestones
  const currentXp = progress?.currentXp || 0;
  const claimed = progress?.claimedMilestones || [];
  const hasClaimable = primaryEvent.rewardsTrack.some(
    (m) => currentXp >= m.requiredXp && !claimed.includes(m.id)
  );

  // Calculate progress towards next milestone
  const nextMilestone = primaryEvent.rewardsTrack.find((m) => m.requiredXp > currentXp);
  const maxMilestoneXp =
    primaryEvent.rewardsTrack[primaryEvent.rewardsTrack.length - 1]?.requiredXp || 1000;
  const progressPct = Math.min(
    100,
    nextMilestone
      ? Math.round((currentXp / nextMilestone.requiredXp) * 100)
      : Math.round((currentXp / maxMilestoneXp) * 100)
  );

  const timeRemaining = formatTimeRemaining(primaryEvent.endDate);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    SoundEngine.playButtonClick();
    Haptics.buttonClick();
    onOpenEvents();
  };

  return (
    <button
      type="button"
      id="main-hub-event-panel-btn"
      onClick={handleClick}
      aria-label={`Open ${primaryEvent.title} Event`}
      className={`group relative flex flex-col justify-center px-3 py-2 rounded-[18px] bg-black/55 backdrop-blur-md border border-fuchsia-500/40 shadow-[0_0_18px_rgba(217,70,239,0.3)] hover:border-fuchsia-400 active:scale-95 transition-all text-left w-[110px] sm:w-[124px] cursor-pointer pointer-events-auto select-none overflow-hidden ${
        hasClaimable ? 'animate-glow-pulse' : ''
      }`}
    >
      {/* Background Ambience Tint */}
      <div
        className="absolute -inset-1 opacity-20 pointer-events-none group-hover:opacity-35 transition-opacity"
        style={{
          background: `radial-gradient(circle at top right, ${
            primaryEvent.accentColor || '#d946ef'
          }, transparent 70%)`,
        }}
      />

      {/* Unclaimed Milestone Ping */}
      {hasClaimable && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3 z-20">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fuchsia-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400 border-2 border-black" />
        </span>
      )}

      {/* Top Header Row: LIVE Badge & Icon */}
      <div className="relative z-10 flex items-center justify-between w-full mb-1">
        <div className="flex items-center gap-1">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
          </span>
          <span className="text-[9px] font-black uppercase tracking-wider text-fuchsia-300 drop-shadow-[0_0_6px_rgba(217,70,239,0.8)]">
            LIVE EVENT
          </span>
        </div>

        <div className="relative flex items-center justify-center text-amber-400">
          {primaryEvent.eventType === 'connected' ? (
            <Zap className="w-3.5 h-3.5 text-amber-300 group-hover:scale-115 transition-transform" />
          ) : (
            <Flame className="w-3.5 h-3.5 text-orange-400 group-hover:scale-115 transition-transform" />
          )}
        </div>
      </div>

      {/* Event Title */}
      <div className="relative z-10 w-full mb-1">
        <h4 className="font-header font-black text-[11px] sm:text-[12px] text-white leading-tight truncate drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
          {primaryEvent.chapterTitle || primaryEvent.title.split(':')[0]}
        </h4>
        <div className="flex items-center gap-1 text-[9px] text-zinc-400 mt-0.5">
          <Clock className="w-2.5 h-2.5 text-zinc-400 shrink-0" />
          <span className="truncate">{timeRemaining.formatted}</span>
        </div>
      </div>

      {/* Progress Bar Track */}
      <div className="relative z-10 w-full h-1.5 rounded-full bg-fuchsia-950/80 border border-fuchsia-500/30 overflow-hidden mb-1">
        <div
          className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 via-pink-400 to-amber-300 shadow-[0_0_8px_rgba(217,70,239,0.9)] transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Bottom Row: XP Progress info */}
      <div className="relative z-10 flex items-center justify-between text-[8px] font-bold text-fuchsia-200/90 tracking-wider">
        <span>{currentXp} XP</span>
        {hasClaimable ? (
          <span className="text-amber-300 animate-pulse font-black">CLAIM!</span>
        ) : (
          <span className="text-zinc-400">
            {nextMilestone ? `${nextMilestone.requiredXp} XP` : 'MAX'}
          </span>
        )}
      </div>
    </button>
  );
};

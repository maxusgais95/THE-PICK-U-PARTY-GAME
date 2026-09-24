/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Sparkles,
  Zap,
  ShoppingBag,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Play,
  Flame,
  Award,
  Link2,
} from 'lucide-react';
import {
  GameEvent,
  EventStatus,
  EventType,
  EventMilestoneReward,
  EventStoreItem,
  EventsStorageState,
} from '../../types/events';
import {
  getEventsState,
  adminSaveEvent,
  adminDeleteEvent,
  adminResetEventsToDefault,
  adminSimulateXp,
  EVENT_PRESET_BACKGROUNDS,
  isEventLive,
} from '../../lib/events';
import { SoundEngine } from '../../lib/audio';
import { AdminEventModal } from './AdminEventModal';

interface AdminEventsManagerProps {
  onShowToast: (msg: string) => void;
}

export const AdminEventsManager: React.FC<AdminEventsManagerProps> = ({ onShowToast }) => {
  const [eventsState, setEventsState] = useState<EventsStorageState>(() => getEventsState());
  const [editingEvent, setEditingEvent] = useState<GameEvent | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState<boolean>(false);
  const [eventToDelete, setEventToDelete] = useState<GameEvent | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);

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
    return () => window.removeEventListener('picku_events_updated', handleEventsUpdated);
  }, []);

  const handleOpenAdd = () => {
    SoundEngine.playButtonClick();
    setEditingEvent(null);
    setIsEventModalOpen(true);
  };

  const handleOpenEdit = (event: GameEvent) => {
    SoundEngine.playButtonClick();
    setEditingEvent(event);
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = (saved: GameEvent) => {
    const nextState = adminSaveEvent(saved);
    setEventsState(nextState);
    setIsEventModalOpen(false);
    onShowToast(`Saved event: "${saved.title}"`);
  };

  const handleDeleteEvent = (eventId: string) => {
    const nextState = adminDeleteEvent(eventId);
    setEventsState(nextState);
    setEventToDelete(null);
    onShowToast('Event removed successfully.');
  };

  const handleToggleStatus = (event: GameEvent, nextStatus: EventStatus) => {
    SoundEngine.playButtonClick();
    const updated: GameEvent = {
      ...event,
      status: nextStatus,
    };
    const nextState = adminSaveEvent(updated);
    setEventsState(nextState);
    onShowToast(`Event status updated to ${nextStatus.toUpperCase()}`);
  };

  const handleSimulateXp = (eventId: string, amount: number) => {
    SoundEngine.playButtonClick();
    adminSimulateXp(eventId, amount);
    setEventsState(getEventsState());
    onShowToast(`Simulated +${amount} XP for event!`);
  };

  const handleResetToDefault = () => {
    const nextState = adminResetEventsToDefault();
    setEventsState(nextState);
    setIsResetModalOpen(false);
    onShowToast('Events reset to system seed defaults.');
  };

  return (
    <div id="admin-events-section" className="flex flex-col gap-6">
      {/* Action Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800/80">
        <div>
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-cyan-400" />
            <span>EVENT HUB & SCHEDULE DASHBOARD</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Configure live and scheduled party events, progression milestones, and Point Stores.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="admin-btn-add-event"
            onClick={handleOpenAdd}
            className="px-3.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-98 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Upload & Schedule Event</span>
          </button>

          <button
            type="button"
            onClick={() => setIsResetModalOpen(true)}
            title="Reset Events to Default"
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 border border-zinc-700 transition-colors cursor-pointer shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Events List Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {eventsState.events.map((event) => {
          const live = isEventLive(event);
          const progress = eventsState.playerProgress[event.id] || {
            currentXp: 0,
            eventPoints: 0,
            claimedMilestones: [],
            redeemedStoreItems: [],
          };

          return (
            <div
              key={event.id}
              id={`admin-event-card-${event.id}`}
              className="group bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between gap-4 transition-colors"
            >
              {/* Event Splash Preview & Info */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Banner Thumbnail */}
                <div className="relative w-full sm:w-40 h-28 rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden shrink-0">
                  <img
                    src={event.splashArtUrl}
                    alt={event.title}
                    className="w-full h-full object-cover object-center filter brightness-85 group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                  {/* Status Overlay Badge */}
                  <div className="absolute top-2 left-2">
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md flex items-center gap-1 ${
                        live
                          ? 'bg-emerald-500/90 text-black'
                          : event.status === 'scheduled'
                          ? 'bg-purple-500/90 text-white'
                          : 'bg-zinc-700 text-zinc-300'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      <span>{event.status}</span>
                    </span>
                  </div>
                </div>

                {/* Text Info */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-cyan-400 uppercase">
                      {event.eventType === 'connected' ? (
                        <>
                          <Link2 className="w-3 h-3 text-cyan-400" />
                          <span>{event.seriesTitle || 'Connected Series'}</span>
                          {event.chapterTitle && (
                            <>
                              <span>·</span>
                              <span>{event.chapterTitle}</span>
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          <Flame className="w-3 h-3 text-orange-400" />
                          <span>Standalone Event</span>
                        </>
                      )}
                    </div>

                    <h4 className="text-base font-black text-white leading-tight mt-0.5">
                      {event.title}
                    </h4>

                    <p className="text-xs text-zinc-400 line-clamp-2 mt-1">
                      {event.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-zinc-400 mt-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-zinc-500" />
                      <span>
                        {event.startDate.slice(0, 10)} ➔ {event.endDate.slice(0, 10)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Event Stats / Configuration Badges */}
              <div className="grid grid-cols-3 gap-2 bg-zinc-950 p-2.5 rounded-xl border border-zinc-850 text-center">
                <div>
                  <div className="text-[10px] font-bold text-zinc-500">MILESTONES</div>
                  <div className="text-xs font-black text-cyan-300">
                    {event.rewardsTrack.length} Tiers
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-zinc-500">POINT STORE</div>
                  <div className="text-xs font-black text-amber-300">
                    {event.storeItems.length} Items
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-zinc-500">PLAYER XP</div>
                  <div className="text-xs font-black text-white">
                    {progress.currentXp} XP ({progress.eventPoints} Pts)
                  </div>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800/80">
                {/* Status Quick-Switch Dropdown */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-zinc-500">Set:</span>
                  {(['live', 'scheduled', 'ended', 'draft'] as EventStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleToggleStatus(event, st)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                        event.status === st
                          ? 'bg-zinc-100 text-zinc-950'
                          : 'bg-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                {/* Actions: Test XP, Edit, Delete */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSimulateXp(event.id, 100)}
                    title="Simulate +100 XP for testing milestones"
                    className="px-2 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 text-[10px] font-bold border border-cyan-800 transition-colors cursor-pointer"
                  >
                    +100 XP (Test)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(event)}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                    title="Edit Event"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setEventToDelete(event)}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-950 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                    title="Delete Event"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit/Create Event Modal */}
      <AdminEventModal
        isOpen={isEventModalOpen}
        initialEvent={editingEvent}
        onClose={() => setIsEventModalOpen(false)}
        onSave={handleSaveEvent}
      />

      {/* Delete Confirmation Modal */}
      {eventToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 text-zinc-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Event</h3>
                <p className="text-xs text-zinc-400">
                  Are you sure you want to delete "{eventToDelete.title}"? This cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setEventToDelete(null)}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteEvent(eventToDelete.id)}
                className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white shadow-sm cursor-pointer"
              >
                Delete Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 text-zinc-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Reset Events to Default</h3>
                <p className="text-xs text-zinc-400">
                  Restore default pre-configured events (Neon Supernova Chapter 1 & 2, Kaboom Blitz)?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetToDefault}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black shadow-sm cursor-pointer"
              >
                Reset to Default
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

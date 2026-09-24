/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Upload,
  Calendar,
  Sparkles,
  Link2,
  Flame,
  Award,
  ShoppingBag,
  Coins,
  Zap,
} from 'lucide-react';
import {
  GameEvent,
  EventStatus,
  EventType,
  EventMilestoneReward,
  EventStoreItem,
  EventRewardType,
} from '../../types/events';
import { EVENT_PRESET_BACKGROUNDS } from '../../lib/events';
import { getStoreCatalogue, StoreItem } from '../../lib/economy';
import { SoundEngine, Haptics } from '../../lib/audio';

interface AdminEventModalProps {
  isOpen: boolean;
  initialEvent: GameEvent | null;
  onClose: () => void;
  onSave: (event: GameEvent) => void;
}

export const AdminEventModal: React.FC<AdminEventModalProps> = ({
  isOpen,
  initialEvent,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<EventType>('connected');
  const [seriesTitle, setSeriesTitle] = useState('');
  const [chapterTitle, setChapterTitle] = useState('');
  const [status, setStatus] = useState<EventStatus>('live');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [splashArtUrl, setSplashArtUrl] = useState('');
  const [accentColor, setAccentColor] = useState('#06b6d4');
  const [rules, setRules] = useState<string[]>([]);
  const [rewardsTrack, setRewardsTrack] = useState<EventMilestoneReward[]>([]);
  const [storeItems, setStoreItems] = useState<EventStoreItem[]>([]);
  const [newRuleInput, setNewRuleInput] = useState('');
  const [customUrlInput, setCustomUrlInput] = useState('');

  // Available skins in catalogue for reward selection
  const catalogue = getStoreCatalogue();
  const allSkins: StoreItem[] = [
    ...(catalogue.bombs || []),
    ...(catalogue.balls || []),
    ...(catalogue.bottles || []),
  ];

  useEffect(() => {
    if (initialEvent) {
      setTitle(initialEvent.title);
      setSubtitle(initialEvent.subtitle || '');
      setDescription(initialEvent.description);
      setEventType(initialEvent.eventType || 'connected');
      setSeriesTitle(initialEvent.seriesTitle || '');
      setChapterTitle(initialEvent.chapterTitle || '');
      setStatus(initialEvent.status);
      setStartDate(initialEvent.startDate);
      setEndDate(initialEvent.endDate);
      setSplashArtUrl(initialEvent.splashArtUrl);
      setAccentColor(initialEvent.accentColor || '#06b6d4');
      setRules([...initialEvent.rules]);
      setRewardsTrack([...initialEvent.rewardsTrack]);
      setStoreItems([...initialEvent.storeItems]);
    } else {
      // New Event Defaults
      setTitle('NEW SPECIAL EVENT');
      setSubtitle('Limited Time Party Challenge');
      setDescription('Play Finger Roulette, Bottle Spin, and Kaboom to earn experience and points!');
      setEventType('connected');
      setSeriesTitle('Neon Odyssey');
      setChapterTitle('Chapter 1');
      setStatus('live');
      const now = new Date();
      setStartDate(now.toISOString().slice(0, 16));
      const end = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      setEndDate(end.toISOString().slice(0, 16));
      setSplashArtUrl(EVENT_PRESET_BACKGROUNDS[0].url);
      setAccentColor('#06b6d4');
      setRules([
        'Play Finger Roulette: +35 Event XP per round',
        'Spin the Bottle: +25 Event XP per completed spin',
        'Win Kaboom Rounds: +50 Event XP per round victory',
        'Spend Event Points in the Point Store for rare rewards',
      ]);
      setRewardsTrack([
        {
          id: `ms_${Date.now()}_1`,
          requiredXp: 80,
          rewardType: 'point',
          rewardAmount: 150,
          rewardTitle: '150 Event Points',
        },
        {
          id: `ms_${Date.now()}_2`,
          requiredXp: 200,
          rewardType: 'star',
          rewardAmount: 350,
          rewardTitle: '350 Stars',
        },
      ]);
      setStoreItems([
        {
          id: `st_${Date.now()}_1`,
          name: 'Party Star Cache',
          subtitle: 'Currency Pack',
          description: '350 Stars added instantly to your wallet.',
          costInPoints: 150,
          rewardType: 'star',
          rewardValue: 350,
        },
      ]);
    }
  }, [initialEvent, isOpen]);

  if (!isOpen) return null;

  const handleAddRule = () => {
    if (!newRuleInput.trim()) return;
    setRules([...rules, newRuleInput.trim()]);
    setNewRuleInput('');
  };

  const handleRemoveRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const handleAddMilestone = () => {
    const lastXp = rewardsTrack[rewardsTrack.length - 1]?.requiredXp || 100;
    const newMilestone: EventMilestoneReward = {
      id: `ms_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      requiredXp: lastXp + 150,
      rewardType: 'star',
      rewardAmount: 300,
      rewardTitle: '300 Stars',
    };
    setRewardsTrack([...rewardsTrack, newMilestone]);
  };

  const handleUpdateMilestone = (index: number, updated: Partial<EventMilestoneReward>) => {
    const next = [...rewardsTrack];
    next[index] = { ...next[index], ...updated };
    setRewardsTrack(next);
  };

  const handleRemoveMilestone = (index: number) => {
    setRewardsTrack(rewardsTrack.filter((_, i) => i !== index));
  };

  const handleAddStoreItem = () => {
    const newItem: EventStoreItem = {
      id: `st_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: 'Star Vault Cache',
      subtitle: 'Currency Pack',
      description: 'Exchange event points for shining party stars.',
      costInPoints: 200,
      rewardType: 'star',
      rewardValue: 500,
    };
    setStoreItems([...storeItems, newItem]);
  };

  const handleUpdateStoreItem = (index: number, updated: Partial<EventStoreItem>) => {
    const next = [...storeItems];
    next[index] = { ...next[index], ...updated };
    setStoreItems(next);
  };

  const handleRemoveStoreItem = (index: number) => {
    setStoreItems(storeItems.filter((_, i) => i !== index));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSplashArtUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const eventToSave: GameEvent = {
      id: initialEvent?.id || `event_${Date.now()}`,
      title: title.trim(),
      subtitle: subtitle.trim(),
      description: description.trim(),
      rules,
      eventType,
      seriesTitle: eventType === 'connected' ? seriesTitle.trim() : undefined,
      chapterTitle: eventType === 'connected' ? chapterTitle.trim() : undefined,
      seriesId:
        eventType === 'connected'
          ? initialEvent?.seriesId || `series_${seriesTitle.toLowerCase().replace(/\s+/g, '_')}`
          : undefined,
      status,
      startDate,
      endDate,
      splashArtUrl: splashArtUrl || EVENT_PRESET_BACKGROUNDS[0].url,
      accentColor,
      rewardsTrack: [...rewardsTrack].sort((a, b) => a.requiredXp - b.requiredXp),
      storeItems,
      createdAt: initialEvent?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    onSave(eventToSave);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in text-zinc-100 select-none">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-zinc-900 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-black text-white uppercase">
              {initialEvent ? 'Edit Scheduled Event' : 'Upload & Schedule New Event'}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* Section 1: Basic Information */}
          <div className="flex flex-col gap-3 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-850">
            <h4 className="text-xs font-black uppercase text-cyan-400">1. Basic Event Details</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-zinc-400">Event Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. NEON SUPERNOVA"
                  className="w-full mt-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-400">Subtitle / Tagline</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g. Season 1: Awakening"
                  className="w-full mt-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-400">Description & Lore</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the event objectives and background lore..."
                className="w-full mt-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Section 2: Scheduling & Series Connection */}
          <div className="flex flex-col gap-3 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-850">
            <h4 className="text-xs font-black uppercase text-cyan-400">
              2. Scheduling & Event Connection
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-zinc-400">Event Type</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as EventType)}
                  className="w-full mt-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none"
                >
                  <option value="connected">Connected Series (Multi-Chapter)</option>
                  <option value="separate">Separate / Standalone</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-400">Live Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as EventStatus)}
                  className="w-full mt-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none"
                >
                  <option value="live">Live in Game</option>
                  <option value="scheduled">Scheduled (Date Based)</option>
                  <option value="ended">Ended</option>
                  <option value="draft">Draft (Hidden)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-400">Accent Theme Color</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                  />
                  <span className="text-xs text-zinc-400 font-mono">{accentColor}</span>
                </div>
              </div>
            </div>

            {eventType === 'connected' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-800">
                <div>
                  <label className="text-[11px] font-bold text-zinc-400">Series Title</label>
                  <input
                    type="text"
                    value={seriesTitle}
                    onChange={(e) => setSeriesTitle(e.target.value)}
                    placeholder="e.g. Neon Odyssey"
                    className="w-full mt-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-zinc-400">Chapter Title</label>
                  <input
                    type="text"
                    value={chapterTitle}
                    onChange={(e) => setChapterTitle(e.target.value)}
                    placeholder="e.g. Ch. 1: Supernova"
                    className="w-full mt-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-800">
              <div>
                <label className="text-[11px] font-bold text-zinc-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Start Schedule Date & Time</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-pink-400" />
                  <span>End Schedule Date & Time</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Background Splash Art Upload / Presets */}
          <div className="flex flex-col gap-3 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-850">
            <h4 className="text-xs font-black uppercase text-cyan-400">
              3. Background Splash Art Banner
            </h4>

            {/* Preview Banner */}
            <div className="relative w-full h-32 rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden flex items-center justify-center">
              {splashArtUrl ? (
                <img
                  src={splashArtUrl}
                  alt="Splash Preview"
                  className="w-full h-full object-cover object-center filter brightness-85"
                />
              ) : (
                <span className="text-xs text-zinc-500">No banner selected</span>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
              <div className="absolute bottom-2 left-3 text-xs font-bold text-white drop-shadow">
                Banner Splash Preview
              </div>
            </div>

            {/* Presets Selection */}
            <div>
              <label className="text-[11px] font-bold text-zinc-400">Choose Preset Banner:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1.5">
                {EVENT_PRESET_BACKGROUNDS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSplashArtUrl(preset.url)}
                    className={`p-2 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                      splashArtUrl === preset.url
                        ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="w-full h-12 object-cover rounded-lg"
                    />
                    <span className="text-[10px] font-bold truncate">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Image Upload or URL */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <label className="w-full sm:w-auto px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white flex items-center justify-center gap-2 cursor-pointer transition-colors shrink-0">
                <Upload className="w-4 h-4 text-cyan-400" />
                <span>Upload Custom Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <div className="flex-1 w-full flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Or paste image URL here..."
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customUrlInput.trim()) {
                      setSplashArtUrl(customUrlInput.trim());
                      setCustomUrlInput('');
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>

          {/* Section 4: Rules & XP Earning Guide */}
          <div className="flex flex-col gap-3 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-850">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase text-cyan-400">4. Rules & Instructions</h4>
            </div>

            <div className="flex flex-col gap-2">
              {rules.map((rule, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400 font-bold">#{idx + 1}</span>
                    <span>{rule}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveRule(idx)}
                    className="p-1 text-zinc-500 hover:text-red-400 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  placeholder="Add another event rule or scoring condition..."
                  value={newRuleInput}
                  onChange={(e) => setNewRuleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddRule();
                    }
                  }}
                  className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddRule}
                  className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-cyan-300 cursor-pointer shrink-0"
                >
                  Add Rule
                </button>
              </div>
            </div>
          </div>

          {/* Section 5: Progression Milestone Rewards Track */}
          <div className="flex flex-col gap-3 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-850">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black uppercase text-cyan-400">
                  5. XP Progression Track ({rewardsTrack.length} Milestones)
                </h4>
                <p className="text-[11px] text-zinc-400">
                  Rewards players unlock along the horizontal scrolling progress bar.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddMilestone}
                className="px-3 py-1 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-cyan-300 text-xs font-bold border border-cyan-800 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Milestone</span>
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              {rewardsTrack.map((milestone, idx) => (
                <div
                  key={milestone.id}
                  className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center gap-2.5"
                >
                  <div className="flex items-center gap-2 sm:w-28 shrink-0">
                    <span className="text-xs font-bold text-zinc-500">Tier #{idx + 1}</span>
                    <input
                      type="number"
                      value={milestone.requiredXp}
                      onChange={(e) =>
                        handleUpdateMilestone(idx, { requiredXp: Number(e.target.value) })
                      }
                      className="w-16 px-2 py-1 bg-zinc-900 border border-zinc-750 rounded-lg text-xs text-cyan-300 font-bold"
                    />
                    <span className="text-[10px] text-zinc-400">XP</span>
                  </div>

                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <select
                      value={milestone.rewardType}
                      onChange={(e) => {
                        const nextType = e.target.value as EventRewardType;
                        handleUpdateMilestone(idx, {
                          rewardType: nextType,
                          rewardTitle:
                            nextType === 'star'
                              ? '300 Stars'
                              : nextType === 'point'
                              ? '150 Points'
                              : 'Exclusive Skin',
                        });
                      }}
                      className="px-2 py-1 bg-zinc-900 border border-zinc-750 rounded-lg text-xs text-white"
                    >
                      <option value="star">Star Currency</option>
                      <option value="point">Event Points</option>
                      <option value="skin">Skin Unlock</option>
                    </select>

                    {milestone.rewardType === 'skin' ? (
                      <select
                        value={milestone.skinData?.id || ''}
                        onChange={(e) => {
                          const selected = allSkins.find((s) => s.id === e.target.value);
                          if (selected) {
                            handleUpdateMilestone(idx, {
                              rewardTitle: `Skin: ${selected.name}`,
                              skinData: {
                                id: selected.id,
                                category: selected.category,
                                name: selected.name,
                                rarity: selected.rarity,
                                image: selected.image,
                                cssFilter: selected.cssFilter,
                              },
                            });
                          }
                        }}
                        className="px-2 py-1 bg-zinc-900 border border-zinc-750 rounded-lg text-xs text-white"
                      >
                        <option value="">Select Skin from Store...</option>
                        {allSkins.map((s) => (
                          <option key={s.id} value={s.id}>
                            [{s.category.slice(0, 4).toUpperCase()}] {s.name} ({s.rarity})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="number"
                        placeholder="Amount"
                        value={milestone.rewardAmount}
                        onChange={(e) =>
                          handleUpdateMilestone(idx, {
                            rewardAmount: Number(e.target.value),
                            rewardTitle: `${e.target.value} ${
                              milestone.rewardType === 'star' ? 'Stars' : 'Points'
                            }`,
                          })
                        }
                        className="px-2 py-1 bg-zinc-900 border border-zinc-750 rounded-lg text-xs text-white"
                      />
                    )}

                    <input
                      type="text"
                      placeholder="Title"
                      value={milestone.rewardTitle}
                      onChange={(e) => handleUpdateMilestone(idx, { rewardTitle: e.target.value })}
                      className="px-2 py-1 bg-zinc-900 border border-zinc-750 rounded-lg text-xs text-white"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveMilestone(idx)}
                    className="p-1.5 text-zinc-500 hover:text-red-400 cursor-pointer self-end sm:self-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 6: Point Store Items */}
          <div className="flex flex-col gap-3 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-850">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4" />
                  <span>6. Event Point Store Items ({storeItems.length})</span>
                </h4>
                <p className="text-[11px] text-zinc-400">
                  Items players can redeem with their Event Points.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddStoreItem}
                className="px-3 py-1 rounded-xl bg-amber-950 hover:bg-amber-900 text-amber-300 text-xs font-bold border border-amber-800 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Store Item</span>
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              {storeItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col gap-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <input
                      type="text"
                      placeholder="Item Name"
                      value={item.name}
                      onChange={(e) => handleUpdateStoreItem(idx, { name: e.target.value })}
                      className="flex-1 px-2.5 py-1 bg-zinc-900 border border-zinc-750 rounded-lg text-xs text-white font-bold"
                    />

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-zinc-400">Cost:</span>
                      <input
                        type="number"
                        value={item.costInPoints}
                        onChange={(e) =>
                          handleUpdateStoreItem(idx, { costInPoints: Number(e.target.value) })
                        }
                        className="w-20 px-2 py-1 bg-zinc-900 border border-zinc-750 rounded-lg text-xs text-amber-300 font-bold"
                      />
                      <span className="text-[10px] text-amber-400">Points</span>

                      <button
                        type="button"
                        onClick={() => handleRemoveStoreItem(idx)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 cursor-pointer ml-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select
                      value={item.rewardType}
                      onChange={(e) =>
                        handleUpdateStoreItem(idx, {
                          rewardType: e.target.value as 'star' | 'skin',
                        })
                      }
                      className="px-2.5 py-1 bg-zinc-900 border border-zinc-750 rounded-lg text-xs text-white"
                    >
                      <option value="star">Star Currency Cache</option>
                      <option value="skin">Store Skin Item</option>
                    </select>

                    {item.rewardType === 'star' ? (
                      <input
                        type="number"
                        placeholder="Stars Value (e.g. 500)"
                        value={item.rewardValue}
                        onChange={(e) =>
                          handleUpdateStoreItem(idx, { rewardValue: Number(e.target.value) })
                        }
                        className="px-2.5 py-1 bg-zinc-900 border border-zinc-750 rounded-lg text-xs text-white"
                      />
                    ) : (
                      <select
                        value={item.skinData?.id || ''}
                        onChange={(e) => {
                          const selected = allSkins.find((s) => s.id === e.target.value);
                          if (selected) {
                            handleUpdateStoreItem(idx, {
                              name: selected.name,
                              skinData: {
                                id: selected.id,
                                category: selected.category,
                                name: selected.name,
                                rarity: selected.rarity,
                                image: selected.image,
                                cssFilter: selected.cssFilter,
                              },
                            });
                          }
                        }}
                        className="px-2.5 py-1 bg-zinc-900 border border-zinc-750 rounded-lg text-xs text-white"
                      >
                        <option value="">Select Skin from Store...</option>
                        {allSkins.map((s) => (
                          <option key={s.id} value={s.id}>
                            [{s.category.slice(0, 4).toUpperCase()}] {s.name} ({s.rarity})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <input
                    type="text"
                    placeholder="Short description..."
                    value={item.description}
                    onChange={(e) => handleUpdateStoreItem(idx, { description: e.target.value })}
                    className="w-full px-2.5 py-1 bg-zinc-900 border border-zinc-750 rounded-lg text-xs text-zinc-300"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-300 text-zinc-950 text-xs font-black uppercase tracking-wider shadow-md hover:brightness-110 active:scale-98 cursor-pointer"
            >
              {initialEvent ? 'Save Changes' : 'Publish & Schedule Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

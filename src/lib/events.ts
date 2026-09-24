/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  GameEvent,
  EventMilestoneReward,
  EventStoreItem,
  PlayerEventProgress,
  EventsStorageState,
  EventRewardType,
} from '../types/events';
import { addStars, unlockStoreSkin, getEconomyState } from './economy';
import extremeBgImg from '../assets/images/Extreme Mode Background.webp';
import ultimateBgImg from '../assets/images/Ultimate Mode Background.webp';
import bombGameBgImg from '../assets/images/Bomb Game Background.webp';
import chaosBgImg from '../assets/images/Chaos Mode Background.webp';

// Bomb and Ball assets for event rewards and store previews
import bombDynamoImg from '../assets/images/bombs/Bomb Dynamo.webp';
import bombSonicImg from '../assets/images/bombs/Bomb Sonic.webp';
import bombBioToxicImg from '../assets/images/bombs/Bomb Bio Toxic.webp';
import ballCelestialImg from '../assets/images/balls/Ball Celestial.webp';
import ballPrismsImg from '../assets/images/balls/Ball Prisms.webp';
import ballSpaceshipImg from '../assets/images/balls/Ball Spaceship.webp';
import bombBassImg from '../assets/images/bombs/Bomb Bass.webp';
import ballFireCoralImg from '../assets/images/balls/Ball Fire Coral.webp';

const EVENTS_STORAGE_KEY = 'picku_party_events_v2';

export const EVENT_PRESET_BACKGROUNDS = [
  { id: 'extreme', name: 'Cyber Neon Void', url: extremeBgImg },
  { id: 'ultimate', name: 'Starlight Supernova', url: ultimateBgImg },
  { id: 'bomb', name: 'Kaboom Inferno', url: bombGameBgImg },
  { id: 'chaos', name: 'Electric Chaos Matrix', url: chaosBgImg },
];

export const DEFAULT_SEED_EVENTS: GameEvent[] = [
  {
    id: 'event_neon_supernova_ch1',
    title: 'NEON SUPERNOVA: AWAKENING',
    subtitle: 'Season 1: Neon Odyssey Series',
    description:
      'The neon core pulse has awakened! Compete in Finger Roulette, spin the bottle, and defuse danger in Kaboom to gather raw kinetic energy, level up your track, and claim celestial rewards.',
    rules: [
      'Play Finger Roulette: Earn +35 Event XP per resolved round',
      'Spin the Bottle: Earn +25 Event XP per completed spin',
      'Win Kaboom Rounds: Earn +50 Event XP per round victory (+15 XP per bonus collected)',
      'Earn Event Points alongside XP to spend in the exclusive Event Point Store',
      'Claim unlocked milestone rewards immediately once you reach each XP threshold',
      'Rewards include Star Currency, Exclusive Weapon/Ball Skins, and Event Point caches',
    ],
    eventType: 'connected',
    seriesId: 'series_neon_odyssey',
    seriesTitle: 'Neon Odyssey',
    chapterTitle: 'Ch. 1: Awakening',
    status: 'live',
    startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    endDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    splashArtUrl: extremeBgImg,
    accentColor: '#06b6d4',
    rewardsTrack: [
      {
        id: 'ms_ns_1',
        requiredXp: 60,
        rewardType: 'point',
        rewardAmount: 120,
        rewardTitle: '120 Event Points',
      },
      {
        id: 'ms_ns_2',
        requiredXp: 160,
        rewardType: 'star',
        rewardAmount: 300,
        rewardTitle: '300 Stars',
      },
      {
        id: 'ms_ns_3',
        requiredXp: 320,
        rewardType: 'point',
        rewardAmount: 200,
        rewardTitle: '200 Event Points',
      },
      {
        id: 'ms_ns_4',
        requiredXp: 550,
        rewardType: 'skin',
        rewardAmount: 1,
        rewardTitle: 'Skin: Bomb Dynamo',
        skinData: {
          id: 'bomb_dynamo',
          category: 'bombs',
          name: 'Dynamo Core Bomb',
          rarity: 'Epic',
          image: bombDynamoImg,
          description: 'High-voltage kinetic dynamo explosive with electric spark arcs.',
        },
      },
      {
        id: 'ms_ns_5',
        requiredXp: 850,
        rewardType: 'star',
        rewardAmount: 600,
        rewardTitle: '600 Stars',
      },
      {
        id: 'ms_ns_6',
        requiredXp: 1200,
        rewardType: 'point',
        rewardAmount: 350,
        rewardTitle: '350 Event Points',
      },
      {
        id: 'ms_ns_7',
        requiredXp: 1650,
        rewardType: 'skin',
        rewardAmount: 1,
        rewardTitle: 'Skin: Ball Celestial',
        skinData: {
          id: 'ball_celestial',
          category: 'balls',
          name: 'Celestial Nova Ball',
          rarity: 'Legendary',
          image: ballCelestialImg,
          description: 'Cosmic celestial sphere pulsing with radiant starlight energy.',
        },
      },
      {
        id: 'ms_ns_8',
        requiredXp: 2200,
        rewardType: 'star',
        rewardAmount: 1200,
        rewardTitle: 'Grand Vault: 1,200 Stars',
      },
    ],
    storeItems: [
      {
        id: 'store_item_stars_small',
        name: 'Party Star Cache',
        subtitle: 'Currency Pack',
        description: 'Instant refill of 350 shining Stars for your store vault.',
        costInPoints: 150,
        rewardType: 'star',
        rewardValue: 350,
      },
      {
        id: 'store_item_stars_large',
        name: 'Galaxy Star Vault',
        subtitle: 'Grand Currency Pack',
        description: 'Immense jackpot of 1,000 shining Stars to unlock any store skin.',
        costInPoints: 380,
        rewardType: 'star',
        rewardValue: 1000,
      },
      {
        id: 'store_item_bomb_sonic',
        name: 'Bomb Sonic Sub-Bass',
        subtitle: 'Soundwave Ordnance',
        description: 'Heavy bass subwoofer speaker bomb pulsing with acoustic shockwaves.',
        costInPoints: 240,
        rewardType: 'skin',
        rewardValue: 0,
        skinData: {
          id: 'bomb_sonic',
          category: 'bombs',
          name: 'Bomb Sonic',
          rarity: 'Rare',
          image: bombSonicImg,
        },
      },
      {
        id: 'store_item_ball_prisms',
        name: 'Prism Spectrum Ball',
        subtitle: 'Prismatic Geometric Orb',
        description: 'Faceted crystal geometry reflecting rainbow disco laser beams.',
        costInPoints: 260,
        rewardType: 'skin',
        rewardValue: 0,
        skinData: {
          id: 'ball_prisms',
          category: 'balls',
          name: 'Ball Prisms',
          rarity: 'Rare',
          image: ballPrismsImg,
        },
      },
      {
        id: 'store_item_bomb_biotoxic',
        name: 'Bio-Toxic Slime Bomb',
        subtitle: 'Hazardous Chemical Core',
        description: 'Radioactive luminescent slime barrel bomb with neon green emissions.',
        costInPoints: 320,
        rewardType: 'skin',
        rewardValue: 0,
        skinData: {
          id: 'bomb_bio_toxic',
          category: 'bombs',
          name: 'Bomb Bio Toxic',
          rarity: 'Epic',
          image: bombBioToxicImg,
        },
      },
      {
        id: 'store_item_ball_spaceship',
        name: 'Cruiser Spaceship Orb',
        subtitle: 'Galactic Hull Prototype',
        description: 'Futuristic warp cruiser sphere equipped with ion particle thrusters.',
        costInPoints: 420,
        rewardType: 'skin',
        rewardValue: 0,
        skinData: {
          id: 'ball_spaceship',
          category: 'balls',
          name: 'Ball Spaceship',
          rarity: 'Legendary',
          image: ballSpaceshipImg,
        },
      },
    ],
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now(),
  },
  {
    id: 'event_neon_supernova_ch2',
    title: 'STARLIGHT RECKONING',
    subtitle: 'Season 1: Neon Odyssey Series',
    description:
      'The cosmic portal intensifies! Deep space frequencies bring next-level party challenges. Prepare your crew for high-velocity finger reflexes and supreme starlight rewards.',
    rules: [
      'Connected Event: Follows the narrative arc of Season 1: Neon Odyssey',
      'Scheduled to go live following Chapter 1 conclusion or manual admin activation',
      'Earn Chapter 2 Event Points and unlock the Bass Drop Bomb and Fire Coral Ball',
      'Stay tuned to the countdown for when the starlight gateway opens!',
    ],
    eventType: 'connected',
    seriesId: 'series_neon_odyssey',
    seriesTitle: 'Neon Odyssey',
    chapterTitle: 'Ch. 2: Starlight',
    status: 'scheduled',
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    endDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    splashArtUrl: ultimateBgImg,
    accentColor: '#a855f7',
    rewardsTrack: [
      {
        id: 'ms_sr_1',
        requiredXp: 80,
        rewardType: 'point',
        rewardAmount: 150,
        rewardTitle: '150 Event Points',
      },
      {
        id: 'ms_sr_2',
        requiredXp: 200,
        rewardType: 'star',
        rewardAmount: 400,
        rewardTitle: '400 Stars',
      },
      {
        id: 'ms_sr_3',
        requiredXp: 450,
        rewardType: 'skin',
        rewardAmount: 1,
        rewardTitle: 'Skin: Bass Drop Bomb',
        skinData: {
          id: 'bomb_bass',
          category: 'bombs',
          name: 'Bomb Bass Drop',
          rarity: 'Epic',
          image: bombBassImg,
        },
      },
      {
        id: 'ms_sr_4',
        requiredXp: 800,
        rewardType: 'point',
        rewardAmount: 300,
        rewardTitle: '300 Event Points',
      },
      {
        id: 'ms_sr_5',
        requiredXp: 1400,
        rewardType: 'skin',
        rewardAmount: 1,
        rewardTitle: 'Skin: Fire Coral Ball',
        skinData: {
          id: 'ball_fire_coral',
          category: 'balls',
          name: 'Ball Fire Coral',
          rarity: 'Legendary',
          image: ballFireCoralImg,
        },
      },
    ],
    storeItems: [
      {
        id: 'store_sr_stars',
        name: 'Starlight Star Crate',
        subtitle: 'Currency Pack',
        description: '500 Radiant Stars for your party wallet.',
        costInPoints: 200,
        rewardType: 'star',
        rewardValue: 500,
      },
    ],
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now(),
  },
  {
    id: 'event_kaboom_inferno_blitz',
    title: 'KABOOM INFERNO BLITZ',
    subtitle: 'Special Standalone Event',
    description:
      'The heat is rising! Step into explosive territory and rack up points in KABOOM mode. Clear boards, avoid detonations, and grab bonus party points to climb the inferno leaderboard.',
    rules: [
      'Standalone Special Event: Play independently of season chapters',
      'Kaboom victories grant +75 Event XP during this event',
      'Collecting safe tiles and bonuses awards extra kinetic XP',
      'Special Point Store stocked with high-explosive ordnance',
    ],
    eventType: 'separate',
    status: 'live',
    startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    splashArtUrl: bombGameBgImg,
    accentColor: '#f97316',
    rewardsTrack: [
      {
        id: 'ms_ki_1',
        requiredXp: 50,
        rewardType: 'point',
        rewardAmount: 100,
        rewardTitle: '100 Event Points',
      },
      {
        id: 'ms_ki_2',
        requiredXp: 150,
        rewardType: 'star',
        rewardAmount: 350,
        rewardTitle: '350 Stars',
      },
      {
        id: 'ms_ki_3',
        requiredXp: 350,
        rewardType: 'point',
        rewardAmount: 250,
        rewardTitle: '250 Event Points',
      },
      {
        id: 'ms_ki_4',
        requiredXp: 600,
        rewardType: 'star',
        rewardAmount: 750,
        rewardTitle: '750 Stars',
      },
    ],
    storeItems: [
      {
        id: 'store_ki_stars',
        name: 'Inferno Star Cache',
        subtitle: 'Explosive Currency',
        description: 'Instantly add 400 Stars to your balance.',
        costInPoints: 160,
        rewardType: 'star',
        rewardValue: 400,
      },
    ],
    createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now(),
  },
];

export function isEventLive(event: GameEvent): boolean {
  if (event.status === 'draft' || event.status === 'ended') {
    return false;
  }
  if (event.status === 'live') {
    return true;
  }
  if (event.status === 'scheduled') {
    const now = Date.now();
    const start = new Date(event.startDate).getTime();
    const end = new Date(event.endDate).getTime();
    if (!isNaN(start) && !isNaN(end)) {
      return now >= start && now <= end;
    }
  }
  return false;
}

export function getEventsState(): EventsStorageState {
  if (typeof window === 'undefined') {
    return { events: DEFAULT_SEED_EVENTS, playerProgress: {} };
  }

  try {
    const raw = localStorage.getItem(EVENTS_STORAGE_KEY);
    if (!raw) {
      const initial: EventsStorageState = {
        events: DEFAULT_SEED_EVENTS,
        playerProgress: {
          event_neon_supernova_ch1: {
            eventId: 'event_neon_supernova_ch1',
            currentXp: 120, // Give some starter XP so user sees immediate progress!
            eventPoints: 120,
            claimedMilestones: ['ms_ns_1'],
            redeemedStoreItems: [],
            lastUpdated: Date.now(),
          },
        },
      };
      localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }

    const parsed: EventsStorageState = JSON.parse(raw);
    if (!Array.isArray(parsed.events) || parsed.events.length === 0) {
      parsed.events = DEFAULT_SEED_EVENTS;
      localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(parsed));
    }
    if (!parsed.playerProgress) {
      parsed.playerProgress = {};
    }
    return parsed;
  } catch (e) {
    return { events: DEFAULT_SEED_EVENTS, playerProgress: {} };
  }
}

export function saveEventsState(state: EventsStorageState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('picku_events_updated', { detail: state }));
  } catch (e) {}
}

export function getPlayerProgress(eventId: string): PlayerEventProgress {
  const state = getEventsState();
  if (state.playerProgress[eventId]) {
    return state.playerProgress[eventId];
  }
  return {
    eventId,
    currentXp: 0,
    eventPoints: 0,
    claimedMilestones: [],
    redeemedStoreItems: [],
    lastUpdated: Date.now(),
  };
}

export function getActiveLiveEvents(): GameEvent[] {
  const state = getEventsState();
  return state.events.filter(isEventLive);
}

export function getAllEvents(): GameEvent[] {
  const state = getEventsState();
  return state.events;
}

/**
 * Adds Experience & Event Points across all currently active live events!
 * Triggered automatically upon completing rounds in Finger Roulette, Bottle Spin, and Kaboom.
 */
export function addEventExperience(
  xpAmount: number,
  sourceGame: string = 'general'
): {
  awardedEvents: {
    eventId: string;
    eventTitle: string;
    newXp: number;
    newPoints: number;
    unlockedMilestonesCount: number;
  }[];
} {
  const state = getEventsState();
  const liveEvents = state.events.filter(isEventLive);
  if (liveEvents.length === 0) {
    return { awardedEvents: [] };
  }

  const awardedEvents: {
    eventId: string;
    eventTitle: string;
    newXp: number;
    newPoints: number;
    unlockedMilestonesCount: number;
  }[] = [];

  let stateModified = false;

  liveEvents.forEach((event) => {
    const prev = state.playerProgress[event.id] || {
      eventId: event.id,
      currentXp: 0,
      eventPoints: 0,
      claimedMilestones: [],
      redeemedStoreItems: [],
      lastUpdated: Date.now(),
    };

    const oldXp = prev.currentXp;
    const newXp = oldXp + xpAmount;
    // Award 50% bonus points directly with XP for immediate store utility
    const pointsBonus = Math.max(5, Math.round(xpAmount * 0.5));
    const newPoints = prev.eventPoints + pointsBonus;

    // Check how many milestones are newly reached
    const newlyReached = event.rewardsTrack.filter(
      (m) => oldXp < m.requiredXp && newXp >= m.requiredXp && !prev.claimedMilestones.includes(m.id)
    );

    prev.currentXp = newXp;
    prev.eventPoints = newPoints;
    prev.lastUpdated = Date.now();

    state.playerProgress[event.id] = prev;
    stateModified = true;

    awardedEvents.push({
      eventId: event.id,
      eventTitle: event.title,
      newXp,
      newPoints,
      unlockedMilestonesCount: newlyReached.length,
    });
  });

  if (stateModified) {
    saveEventsState(state);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('picku_event_xp_gained', {
          detail: { xpAmount, sourceGame, awardedEvents },
        })
      );
    }
  }

  return { awardedEvents };
}

/**
 * Claim a milestone reward on the scrolling progress track
 */
export function claimMilestoneReward(
  eventId: string,
  milestoneId: string
): {
  success: boolean;
  message: string;
  rewardType?: EventRewardType;
  rewardAmount?: number;
  skinName?: string;
  updatedProgress?: PlayerEventProgress;
} {
  const state = getEventsState();
  const event = state.events.find((e) => e.id === eventId);
  if (!event) {
    return { success: false, message: 'Event not found.' };
  }

  const milestone = event.rewardsTrack.find((m) => m.id === milestoneId);
  if (!milestone) {
    return { success: false, message: 'Milestone not found.' };
  }

  const progress = state.playerProgress[eventId] || {
    eventId,
    currentXp: 0,
    eventPoints: 0,
    claimedMilestones: [],
    redeemedStoreItems: [],
    lastUpdated: Date.now(),
  };

  if (progress.claimedMilestones.includes(milestoneId)) {
    return { success: false, message: 'Reward already claimed!' };
  }

  if (progress.currentXp < milestone.requiredXp) {
    return {
      success: false,
      message: `Need ${milestone.requiredXp - progress.currentXp} more XP to unlock this reward!`,
    };
  }

  // Grant the reward!
  progress.claimedMilestones = [...progress.claimedMilestones, milestoneId];
  progress.lastUpdated = Date.now();

  let message = '';
  let skinName = '';

  if (milestone.rewardType === 'star') {
    addStars(milestone.rewardAmount);
    message = `Claimed +${milestone.rewardAmount} Stars!`;
  } else if (milestone.rewardType === 'point') {
    progress.eventPoints += milestone.rewardAmount;
    message = `Claimed +${milestone.rewardAmount} Event Points!`;
  } else if (milestone.rewardType === 'skin' && milestone.skinData) {
    unlockStoreSkin(milestone.skinData.id);
    skinName = milestone.skinData.name;
    message = `Unlocked Exclusive Skin: ${milestone.skinData.name}!`;
  }

  state.playerProgress[eventId] = progress;
  saveEventsState(state);

  return {
    success: true,
    message,
    rewardType: milestone.rewardType,
    rewardAmount: milestone.rewardAmount,
    skinName,
    updatedProgress: progress,
  };
}

/**
 * Redeem an item from the Event Point Store using earned Event Points
 */
export function redeemEventStoreItem(
  eventId: string,
  storeItemId: string
): {
  success: boolean;
  message: string;
  updatedProgress?: PlayerEventProgress;
} {
  const state = getEventsState();
  const event = state.events.find((e) => e.id === eventId);
  if (!event) {
    return { success: false, message: 'Event not found.' };
  }

  const item = event.storeItems.find((i) => i.id === storeItemId);
  if (!item) {
    return { success: false, message: 'Store item not found.' };
  }

  const progress = state.playerProgress[eventId] || {
    eventId,
    currentXp: 0,
    eventPoints: 0,
    claimedMilestones: [],
    redeemedStoreItems: [],
    lastUpdated: Date.now(),
  };

  if (progress.redeemedStoreItems.includes(storeItemId)) {
    return { success: false, message: 'Item already redeemed!' };
  }

  if (progress.eventPoints < item.costInPoints) {
    return {
      success: false,
      message: `Need ${item.costInPoints - progress.eventPoints} more Event Points!`,
    };
  }

  // Deduct points
  progress.eventPoints -= item.costInPoints;
  progress.redeemedStoreItems = [...progress.redeemedStoreItems, storeItemId];
  progress.lastUpdated = Date.now();

  let message = '';
  if (item.rewardType === 'star') {
    addStars(item.rewardValue);
    message = `Redeemed ${item.rewardValue} Stars! Added to your vault.`;
  } else if (item.rewardType === 'skin' && item.skinData) {
    unlockStoreSkin(item.skinData.id);
    message = `Redeemed and unlocked skin: ${item.skinData.name}!`;
  } else {
    message = `Successfully redeemed ${item.name}!`;
  }

  state.playerProgress[eventId] = progress;
  saveEventsState(state);

  return {
    success: true,
    message,
    updatedProgress: progress,
  };
}

/**
 * Admin: Add or update an event
 */
export function adminSaveEvent(event: GameEvent): EventsStorageState {
  const state = getEventsState();
  const existingIdx = state.events.findIndex((e) => e.id === event.id);

  const cleanEvent: GameEvent = {
    ...event,
    updatedAt: Date.now(),
    createdAt: event.createdAt || Date.now(),
  };

  if (existingIdx >= 0) {
    state.events[existingIdx] = cleanEvent;
  } else {
    state.events.push(cleanEvent);
  }

  saveEventsState(state);
  return state;
}

/**
 * Admin: Delete an event
 */
export function adminDeleteEvent(eventId: string): EventsStorageState {
  const state = getEventsState();
  state.events = state.events.filter((e) => e.id !== eventId);
  delete state.playerProgress[eventId];
  saveEventsState(state);
  return state;
}

/**
 * Admin: Reset events to seed defaults
 */
export function adminResetEventsToDefault(): EventsStorageState {
  const state: EventsStorageState = {
    events: DEFAULT_SEED_EVENTS,
    playerProgress: {
      event_neon_supernova_ch1: {
        eventId: 'event_neon_supernova_ch1',
        currentXp: 120,
        eventPoints: 120,
        claimedMilestones: ['ms_ns_1'],
        redeemedStoreItems: [],
        lastUpdated: Date.now(),
      },
    },
  };
  saveEventsState(state);
  return state;
}

/**
 * Admin: Simulate XP gain for testing
 */
export function adminSimulateXp(eventId: string, xpAmount: number): PlayerEventProgress {
  const state = getEventsState();
  const progress = state.playerProgress[eventId] || {
    eventId,
    currentXp: 0,
    eventPoints: 0,
    claimedMilestones: [],
    redeemedStoreItems: [],
    lastUpdated: Date.now(),
  };

  progress.currentXp += xpAmount;
  progress.eventPoints += Math.round(xpAmount * 0.5);
  progress.lastUpdated = Date.now();

  state.playerProgress[eventId] = progress;
  saveEventsState(state);
  return progress;
}

export function formatTimeRemaining(endDateIso: string): {
  days: number;
  hours: number;
  minutes: number;
  formatted: string;
  isExpired: boolean;
} {
  const end = new Date(endDateIso).getTime();
  const now = Date.now();
  const diff = end - now;

  if (diff <= 0 || isNaN(diff)) {
    return { days: 0, hours: 0, minutes: 0, formatted: 'Ended', isExpired: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  let formatted = '';
  if (days > 0) {
    formatted = `${days}d ${hours}h left`;
  } else if (hours > 0) {
    formatted = `${hours}h ${minutes}m left`;
  } else {
    formatted = `${minutes}m left`;
  }

  return { days, hours, minutes, formatted, isExpired: false };
}

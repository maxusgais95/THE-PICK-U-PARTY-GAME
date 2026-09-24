/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StoreCategory } from '../lib/economy';

export type EventStatus = 'live' | 'scheduled' | 'ended' | 'draft';
export type EventType = 'separate' | 'connected';
export type EventRewardType = 'star' | 'skin' | 'point';

export interface EventMilestoneReward {
  id: string;
  requiredXp: number;
  rewardType: EventRewardType;
  rewardAmount: number; // For 'star' or 'point'
  rewardTitle: string;
  skinData?: {
    id: string;
    category: StoreCategory;
    name: string;
    rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
    image?: string;
    cssFilter?: string;
    description?: string;
  };
}

export interface EventStoreItem {
  id: string;
  name: string;
  subtitle?: string;
  description: string;
  costInPoints: number;
  rewardType: 'star' | 'skin';
  rewardValue: number; // e.g. Star count for 'star' rewards
  skinData?: {
    id: string;
    category: StoreCategory;
    name: string;
    rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
    image?: string;
    cssFilter?: string;
  };
  image?: string;
}

export interface GameEvent {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  rules: string[];
  eventType: EventType; // 'separate' or 'connected'
  seriesId?: string; // Connected event series identifier
  seriesTitle?: string; // Series brand name (e.g. 'Neon Odyssey')
  chapterTitle?: string; // Chapter name (e.g. 'Chapter 1: Supernova')
  status: EventStatus; // 'live' | 'scheduled' | 'ended' | 'draft'
  startDate: string; // ISO string e.g. '2026-09-01T00:00:00'
  endDate: string; // ISO string e.g. '2026-10-15T23:59:59'
  splashArtUrl: string;
  accentColor: string; // Hex color code (e.g. '#06b6d4')
  rewardsTrack: EventMilestoneReward[];
  storeItems: EventStoreItem[];
  createdAt: number;
  updatedAt: number;
}

export interface PlayerEventProgress {
  eventId: string;
  currentXp: number;
  eventPoints: number;
  claimedMilestones: string[]; // Milestone IDs
  redeemedStoreItems: string[]; // Store Item IDs
  lastUpdated: number;
}

export interface EventsStorageState {
  events: GameEvent[];
  playerProgress: Record<string, PlayerEventProgress>;
}

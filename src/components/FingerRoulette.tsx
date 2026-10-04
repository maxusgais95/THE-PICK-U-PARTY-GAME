/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Target, Users, RotateCcw } from 'lucide-react';
import { AppSettings, TouchPlayer } from '../types';
import { THEMES } from '../lib/themes';
import { SoundEngine } from '../lib/audio';
import { recordGameEvent } from '../lib/db';
import { recordStarEarringsCondition, addStars } from '../lib/economy';

interface FingerRouletteProps {
  settings: AppSettings;
  onTouchUpdate: (touches: TouchPlayer[], showTeamLines: boolean) => void;
  onUpdateSettings?: (settings: Partial<AppSettings>) => void;
  onGameStateChange?: (gameState: 'waiting' | 'countdown' | 'resolved') => void;
  registerResolveTrigger?: (trigger: () => void) => void;
}

// 5 Holographic Target Color Palettes matching requested ranges:
// (blue cyan, magenta red, purple blue, orange red, red yellow)
export const HOLOGRAPHIC_TARGET_PALETTES = [
  {
    name: 'Pastel Sky',
    primary: '#38bdf8',
    secondary: '#bae6fd',
    ringColor: '#7dd3fc',
    accent: '#e0f2fe',
    glow: 'rgba(125, 211, 252, 0.35)',
    subGlow: 'rgba(186, 230, 253, 0.25)',
    gradient: 'linear-gradient(135deg, #7dd3fc, #bae6fd)',
  },
  {
    name: 'Pastel Rose',
    primary: '#f472b6',
    secondary: '#fbcfe8',
    ringColor: '#f472b6',
    accent: '#fdf2f8',
    glow: 'rgba(244, 114, 182, 0.35)',
    subGlow: 'rgba(251, 207, 232, 0.25)',
    gradient: 'linear-gradient(135deg, #f472b6, #fbcfe8)',
  },
  {
    name: 'Pastel Lavender',
    primary: '#c084fc',
    secondary: '#e9d5ff',
    ringColor: '#c084fc',
    accent: '#faf5ff',
    glow: 'rgba(192, 132, 252, 0.35)',
    subGlow: 'rgba(233, 213, 255, 0.25)',
    gradient: 'linear-gradient(135deg, #c084fc, #e9d5ff)',
  },
  {
    name: 'Pastel Peach',
    primary: '#fb923c',
    secondary: '#fed7aa',
    ringColor: '#fb923c',
    accent: '#fff7ed',
    glow: 'rgba(251, 146, 60, 0.35)',
    subGlow: 'rgba(254, 215, 170, 0.25)',
    gradient: 'linear-gradient(135deg, #fb923c, #fed7aa)',
  },
  {
    name: 'Pastel Mint',
    primary: '#34d399',
    secondary: '#a7f3d0',
    ringColor: '#34d399',
    accent: '#ecfdf5',
    glow: 'rgba(52, 211, 153, 0.35)',
    subGlow: 'rgba(167, 243, 208, 0.25)',
    gradient: 'linear-gradient(135deg, #34d399, #a7f3d0)',
  },
  {
    name: 'Pastel Buttercup',
    primary: '#facc15',
    secondary: '#fef08a',
    ringColor: '#facc15',
    accent: '#fefce8',
    glow: 'rgba(250, 204, 21, 0.35)',
    subGlow: 'rgba(254, 240, 138, 0.25)',
    gradient: 'linear-gradient(135deg, #facc15, #fef08a)',
  },
  {
    name: 'Pastel Lilac',
    primary: '#e879f9',
    secondary: '#f5d0fe',
    ringColor: '#e879f9',
    accent: '#fdf4ff',
    glow: 'rgba(232, 121, 249, 0.35)',
    subGlow: 'rgba(245, 208, 254, 0.25)',
    gradient: 'linear-gradient(135deg, #e879f9, #f5d0fe)',
  },
  {
    name: 'Pastel Periwinkle',
    primary: '#818cf8',
    secondary: '#c7d2fe',
    ringColor: '#818cf8',
    accent: '#eef2ff',
    glow: 'rgba(129, 140, 248, 0.35)',
    subGlow: 'rgba(199, 210, 254, 0.25)',
    gradient: 'linear-gradient(135deg, #818cf8, #c7d2fe)',
  },
  {
    name: 'Pastel Aqua',
    primary: '#2dd4bf',
    secondary: '#99f6e4',
    ringColor: '#2dd4bf',
    accent: '#f0fdfa',
    glow: 'rgba(45, 212, 191, 0.35)',
    subGlow: 'rgba(153, 246, 228, 0.25)',
    gradient: 'linear-gradient(135deg, #2dd4bf, #99f6e4)',
  },
  {
    name: 'Pastel Coral',
    primary: '#fb7185',
    secondary: '#fecdd3',
    ringColor: '#fb7185',
    accent: '#fff1f2',
    glow: 'rgba(251, 113, 133, 0.35)',
    subGlow: 'rgba(254, 205, 211, 0.25)',
    gradient: 'linear-gradient(135deg, #fb7185, #fecdd3)',
  },
];

const INITIAL_COLOR_INDICES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export const FingerRoulette: React.FC<FingerRouletteProps> = ({
  settings,
  onTouchUpdate,
  onUpdateSettings,
  onGameStateChange,
  registerResolveTrigger,
}) => {
  const currentTheme = THEMES[settings.theme] || THEMES['cyber-neon'];
  
  // Game state: 'waiting' | 'countdown' | 'resolved'
  const [gameState, setGameState] = useState<'waiting' | 'countdown' | 'resolved'>('waiting');
  const [isResultLocked, setIsResultLocked] = useState<boolean>(false);
  const [countdownRemaining, setCountdownRemaining] = useState<number>(settings.countdownSeconds);
  const [touches, setTouches] = useState<Map<string | number, TouchPlayer>>(new Map());

  const containerRef = useRef<HTMLDivElement | null>(null);
  const touchesRef = useRef<Map<string | number, TouchPlayer>>(new Map());
  const indicatorRefs = useRef<Map<string | number, HTMLDivElement>>(new Map());
  const innerRefs = useRef<Map<string | number, HTMLDivElement>>(new Map());
  const moveRafPendingRef = useRef<boolean>(false);
  const countdownIntervalRef = useRef<number | null>(null);
  const resultUnlockTimerRef = useRef<number | null>(null);
  const resolvedAtRef = useRef<number>(0);
  const gameStateRef = useRef<'waiting' | 'countdown' | 'resolved'>('waiting');
  gameStateRef.current = gameState;

  const onGameStateChangeRef = useRef(onGameStateChange);
  onGameStateChangeRef.current = onGameStateChange;

  // Accurately translate viewport client coordinates to container-relative coordinates
  const getRelativeCoords = (clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: clientX, y: clientY };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  // Available color indices pool cycling through holographic palettes
  const availableColorsRef = useRef<number[]>([...INITIAL_COLOR_INDICES]);

  // Stable ref for parent callback
  const onTouchUpdateRef = useRef(onTouchUpdate);
  onTouchUpdateRef.current = onTouchUpdate;

  // Sync touch update to parent canvas
  const notifyTouches = useCallback((touchMap: Map<string | number, TouchPlayer>) => {
    onTouchUpdateRef.current(Array.from(touchMap.values()), false);
  }, []);

  // Reset round
  const resetRound = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (resultUnlockTimerRef.current) {
      clearTimeout(resultUnlockTimerRef.current);
      resultUnlockTimerRef.current = null;
    }
    resolvedAtRef.current = 0;
    setIsResultLocked(false);
    gameStateRef.current = 'waiting';
    setGameState('waiting');
    onGameStateChangeRef.current?.('waiting');
    setCountdownRemaining(settings.countdownSeconds);
    touchesRef.current.clear();
    indicatorRefs.current.clear();
    innerRefs.current.clear();
    setTouches(new Map());
    availableColorsRef.current = [...INITIAL_COLOR_INDICES];
    notifyTouches(new Map());
  }, [notifyTouches, settings.countdownSeconds]);

  // Resolve outcome (pick targetCount losers)
  const resolveRound = useCallback(() => {
    if (gameStateRef.current === 'resolved') return;
    gameStateRef.current = 'resolved';
    setGameState('resolved');
    setIsResultLocked(true);
    resolvedAtRef.current = Date.now();
    onGameStateChangeRef.current?.('resolved');

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    if (resultUnlockTimerRef.current) {
      clearTimeout(resultUnlockTimerRef.current);
    }
    // 2-second lockout before tapping can restart the game
    resultUnlockTimerRef.current = window.setTimeout(() => {
      setIsResultLocked(false);
    }, 2000);

    const touchList: TouchPlayer[] = Array.from(touchesRef.current.values());
    if (touchList.length < settings.minPlayers) {
      resetRound();
      return;
    }

    // Pick targetCount random indices without mutating map insertion order
    const targetCount = Math.max(1, Math.min(settings.targetCount, touchList.length - 1));
    const indices = touchList.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const targetIndices = new Set(indices.slice(0, targetCount));

    const updatedMap = new Map<string | number, TouchPlayer>();
    touchList.forEach((touch, index) => {
      const isTarget = targetIndices.has(index);
      const updated = { ...touch, isTarget };
      updatedMap.set(touch.id, updated);

      if (isTarget) {
        // Trigger canvas shockwave at loser position
        window.dispatchEvent(
          new CustomEvent('app-shockwave', {
            detail: { x: touch.x, y: touch.y, color: '#ff0055', maxRadius: 400 },
          })
        );
      }
    });

    SoundEngine.playTargetImpact();
    recordGameEvent('roulette');
    recordStarEarringsCondition('fingerGame');
    addStars(15);
    touchesRef.current = updatedMap;
    setTouches(new Map(updatedMap));
    notifyTouches(updatedMap);
  }, [settings.minPlayers, settings.targetCount, notifyTouches, resetRound]);

  // Expose resolve trigger to external video end if needed
  useEffect(() => {
    if (registerResolveTrigger) {
      registerResolveTrigger(resolveRound);
    }
  }, [registerResolveTrigger, resolveRound]);

  // Clean up on unmount ONLY
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (resultUnlockTimerRef.current) clearTimeout(resultUnlockTimerRef.current);
      onTouchUpdateRef.current([], false);
      onGameStateChangeRef.current?.('waiting');
    };
  }, []);

  // Check if countdown should start or cancel
  const checkCountdown = useCallback(() => {
    if (gameStateRef.current === 'resolved') return;

    const count = touchesRef.current.size;
    if (count >= settings.minPlayers) {
      if (gameStateRef.current !== 'countdown') {
        gameStateRef.current = 'countdown';
        setGameState('countdown');
        onGameStateChangeRef.current?.('countdown');
        setCountdownRemaining(settings.countdownSeconds);
        SoundEngine.playCountdownTick(settings.countdownSeconds, settings.countdownSeconds);

        let currentVal = settings.countdownSeconds;
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

        countdownIntervalRef.current = window.setInterval(() => {
          currentVal -= 1;
          if (currentVal > 0) {
            setCountdownRemaining(currentVal);
            SoundEngine.playCountdownTick(currentVal, settings.countdownSeconds);
          } else {
            resolveRound();
          }
        }, 1000);
      }
    } else {
      if (gameStateRef.current === 'countdown') {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
        setCountdownRemaining(settings.countdownSeconds);
        gameStateRef.current = 'waiting';
        setGameState('waiting');
        onGameStateChangeRef.current?.('waiting');
      }
    }
  }, [settings.minPlayers, settings.countdownSeconds, resolveRound]);

  // Handle Touch Start
  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement | null;
    if (target && target.closest('button, [data-interactive="true"]')) {
      return;
    }

    e.preventDefault();
    if (gameStateRef.current === 'resolved') {
      // 2s result lockout: prevent accidental reset until players see the results
      if (Date.now() - resolvedAtRef.current < 2000) {
        return;
      }
      resetRound();
      return;
    }

    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (touchesRef.current.size >= 10) continue;
      if (touchesRef.current.has(t.identifier)) continue;

      if (availableColorsRef.current.length === 0) {
        availableColorsRef.current = [...INITIAL_COLOR_INDICES];
      }
      const colorIdx = availableColorsRef.current.shift()!;
      const { x, y } = getRelativeCoords(t.clientX, t.clientY);
      const playerObj: TouchPlayer = {
        id: t.identifier,
        x,
        y,
        colorIndex: colorIdx,
        playerLabel: `P${colorIdx + 1}`,
      };

      touchesRef.current.set(t.identifier, playerObj);
      SoundEngine.playTouchDown(colorIdx);
    }

    setTouches(new Map(touchesRef.current));
    notifyTouches(touchesRef.current);
    checkCountdown();
  };

  // Handle Touch Move - Direct hardware-accelerated transform with zero transition latency
  const handleTouchMove = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement | null;
    if (target && target.closest('button, [data-interactive="true"]')) {
      return;
    }

    e.preventDefault();
    if (gameStateRef.current === 'resolved') return;

    const isSquishEnabled = settings.fingerAnimation?.squish ?? true;

    let hasMoved = false;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      const existing = touchesRef.current.get(t.identifier);
      if (existing) {
        const { x, y } = getRelativeCoords(t.clientX, t.clientY);
        const dx = x - existing.x;
        const dy = y - existing.y;
        const dist = Math.hypot(dx, dy);

        existing.x = x;
        existing.y = y;
        hasMoved = true;
        // Direct GPU translation instantly under the user's finger (0ms delay)
        const el = indicatorRefs.current.get(t.identifier);
        if (el) {
          el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
        }

        // Soft Liquid Drag Squish on inner element
        if (isSquishEnabled) {
          const innerEl = innerRefs.current.get(t.identifier);
          if (innerEl) {
            if (dist > 1.5) {
              const angle = Math.atan2(dy, dx);
              const stretch = Math.min(0.2, dist * 0.015);
              innerEl.style.transform = `rotate(${angle}rad) scale(${1 + stretch}, ${1 - stretch * 0.7}) rotate(${-angle}rad)`;
            } else {
              innerEl.style.transform = '';
            }
          }
        }
      }
    }

    // Throttle parent canvas/state synchronization to display refresh rate (120Hz/60Hz)
    if (hasMoved && !moveRafPendingRef.current) {
      moveRafPendingRef.current = true;
      requestAnimationFrame(() => {
        moveRafPendingRef.current = false;
        setTouches(new Map(touchesRef.current));
        notifyTouches(touchesRef.current);
      });
    }
  };

  // Handle Touch End / Cancel
  const handleTouchEnd = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement | null;
    if (target && target.closest('button, [data-interactive="true"]')) {
      return;
    }

    e.preventDefault();
    if (gameStateRef.current === 'resolved') return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      indicatorRefs.current.delete(t.identifier);
      innerRefs.current.delete(t.identifier);
      const existing = touchesRef.current.get(t.identifier);
      if (existing) {
        availableColorsRef.current.push(existing.colorIndex);
        availableColorsRef.current.sort((a, b) => a - b);
        touchesRef.current.delete(t.identifier);
        SoundEngine.playTouchUp();
      }
    }

    setTouches(new Map(touchesRef.current));
    notifyTouches(touchesRef.current);
    checkCountdown();
  };

  // Desktop Mouse Click Simulation fallback
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    const target = e.target as HTMLElement | null;
    if (target && target.closest('button, [data-interactive="true"]')) {
      return;
    }

    if (gameStateRef.current === 'resolved') {
      // 2s result lockout: prevent accidental reset until players see the results
      if (Date.now() - resolvedAtRef.current < 2000) {
        return;
      }
      resetRound();
      return;
    }

    const id = `mouse-${Date.now()}`;
    if (availableColorsRef.current.length === 0) {
      availableColorsRef.current = [...INITIAL_COLOR_INDICES];
    }
    const colorIdx = availableColorsRef.current.shift()!;
    const { x, y } = getRelativeCoords(e.clientX, e.clientY);
    const playerObj: TouchPlayer = {
      id,
      x,
      y,
      colorIndex: colorIdx,
      playerLabel: `P${colorIdx + 1}`,
    };

    touchesRef.current.set(id, playerObj);
    SoundEngine.playTouchDown(colorIdx);
    setTouches(new Map(touchesRef.current));
    notifyTouches(touchesRef.current);
    checkCountdown();
  };

  const touchArray: TouchPlayer[] = Array.from(touches.values());
  const maxAllowedTargets = Math.max(1, settings.minPlayers - 1);
  const targetOptions = [1, 2, 3, 4];

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onPointerDown={handlePointerDown}
      className="relative w-full h-full select-none touch-none overflow-hidden"
    >
      {/* Game Resolved Banner Notice */}
      {gameState === 'resolved' && (
        <div className="absolute top-[max(6.25rem,calc(env(safe-area-inset-top)+4.75rem))] left-1/2 -translate-x-1/2 z-40 flex flex-col items-center pointer-events-none select-none animate-fadeIn">
          <div className={`px-4 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-rose-500/80 shadow-[0_0_24px_rgba(244,63,94,0.5)] flex items-center gap-2 ${
            !isResultLocked ? 'animate-glow-pulse-restart' : ''
          }`}>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className="font-header text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
              {settings.targetCount > 1 ? `${settings.targetCount} Losers Picked!` : 'Loser Picked!'}
            </span>
          </div>
          <span className="font-subbody text-[11px] font-semibold text-gray-200/90 mt-1.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            {isResultLocked ? 'Revealing outcome...' : 'Tap anywhere to play again'}
          </span>
        </div>
      )}

      {/* Bottom Floating Controls: Player Count & Target Count Dock (Moved slightly up) */}
      {onUpdateSettings && (
        <div
          className={`absolute bottom-[max(2.6rem,calc(env(safe-area-inset-bottom)+2.2rem))] left-1/2 -translate-x-1/2 z-30 flex flex-col gap-2 p-2.5 sm:px-3.5 sm:py-2.5 rounded-2xl glass-panel shadow-2xl min-w-[270px] max-w-[92vw] transition-all duration-300 border border-white/15 ${
            gameState === 'resolved'
              ? 'opacity-0 pointer-events-none scale-95'
              : touches.size > 0 || gameState === 'countdown'
              ? 'opacity-35 hover:opacity-100'
              : 'opacity-100'
          }`}
          data-interactive="true"
        >
          {/* Row 1: Players */}
          <div className="flex items-center justify-between gap-2.5">
            <span
              className="font-header text-[10px] font-bold uppercase tracking-wider pl-1 flex items-center gap-1 transition-colors duration-300 select-none"
              style={{
                color: currentTheme.secondary,
                filter: `drop-shadow(0 0 6px ${currentTheme.secondary}88)`,
              }}
            >
              <Users className="w-3 h-3" /> Players:
            </span>
            <div className="flex items-center gap-1.5">
              {[2, 3, 4, 5].map((cnt) => {
                const isSelected = settings.minPlayers === cnt;
                return (
                  <button
                    key={cnt}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      SoundEngine.playButtonClick();
                      const newTarget = Math.min(settings.targetCount, cnt - 1);
                      onUpdateSettings({ minPlayers: cnt, targetCount: newTarget });
                      resetRound();
                    }}
                    className="pill-count-btn font-header w-8 h-7 text-[11px] font-bold transition-all duration-300"
                    style={
                      isSelected
                        ? {
                            backgroundColor: currentTheme.secondary,
                            borderColor: currentTheme.secondary,
                            color: '#ffffff',
                            boxShadow: `0 0 16px ${currentTheme.secondary}dd`,
                          }
                        : {}
                    }
                  >
                    <span>{cnt}P</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 2: Target (Losers) */}
          <div className="flex items-center justify-between gap-2.5 pt-1.5 border-t border-white/10">
            <span
              className="font-header text-[10px] font-bold uppercase tracking-wider pl-1 flex items-center gap-1 transition-colors duration-300 select-none"
              style={{
                color: currentTheme.secondary,
                filter: `drop-shadow(0 0 6px ${currentTheme.secondary}88)`,
              }}
            >
              <Target className="w-3 h-3" /> Target:
            </span>
            <div className="flex items-center gap-1.5">
              {targetOptions.map((tgt) => {
                const isDisabled = tgt > maxAllowedTargets;
                const isSelected = settings.targetCount === tgt && !isDisabled;
                return (
                  <button
                    key={tgt}
                    type="button"
                    disabled={isDisabled}
                    onClick={(e) => {
                      if (isDisabled) return;
                      e.stopPropagation();
                      SoundEngine.playButtonClick();
                      onUpdateSettings({ targetCount: tgt });
                      resetRound();
                    }}
                    className={`pill-count-btn font-header w-8 h-7 text-[11px] font-bold transition-all duration-300 ${
                      isDisabled
                        ? 'opacity-20 cursor-not-allowed pointer-events-none border-white/5 text-gray-500 bg-white/[0.02]'
                        : isSelected
                        ? 'text-white'
                        : 'hover:border-white/40'
                    }`}
                    style={
                      isSelected
                        ? {
                            backgroundColor: currentTheme.secondary,
                            borderColor: currentTheme.secondary,
                            color: '#ffffff',
                            boxShadow: `0 0 16px ${currentTheme.secondary}dd`,
                          }
                        : {}
                    }
                  >
                    <span>{tgt}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}


      {/* Interactive Touch Player Holographic Target Rings */}
      {touchArray.map((player) => {
        const palette =
          HOLOGRAPHIC_TARGET_PALETTES[player.colorIndex % HOLOGRAPHIC_TARGET_PALETTES.length];

        let badgeContent: React.ReactNode = player.playerLabel;
        let isLoser = false;
        let isSafeDim = false;

        if (gameState === 'resolved') {
          if (player.isTarget) {
            isLoser = true;
            badgeContent = 'LOSER';
          } else {
            isSafeDim = true;
            badgeContent = 'SAFE';
          }
        }

        const animConfig = settings.fingerAnimation ?? {
          springPop: true,
          tensionPulse: true,
          squish: true,
          outcomeReveal: true,
          pastelAura: true,
        };

        const tensionDuration =
          gameState === 'countdown' && animConfig.tensionPulse
            ? Math.max(0.38, 2.2 * (countdownRemaining / settings.countdownSeconds))
            : 2.2;

        return (
          <div
            key={player.id}
            ref={(el) => {
              if (el) {
                indicatorRefs.current.set(player.id, el);
              } else {
                indicatorRefs.current.delete(player.id);
              }
            }}
            className={`absolute top-0 left-0 w-32 h-32 pointer-events-none z-30 flex items-center justify-center will-change-transform ${
              isSafeDim
                ? 'opacity-30 transition-opacity duration-300'
                : 'opacity-100'
            }`}
            style={{
              transform: `translate3d(${player.x}px, ${player.y}px, 0) translate(-50%, -50%)`,
            }}
          >
            {/* 1. Spring Pop: Expanding Water-Drop Dispersion Ripple on initial touch down */}
            {animConfig.springPop && gameState !== 'resolved' && (
              <div
                key={`ripple-${player.id}`}
                className="absolute w-[94px] h-[94px] rounded-full pointer-events-none animate-touch-ripple"
                style={{
                  background: palette.gradient,
                }}
              />
            )}

            {/* 2. Soft Ambient Pastel Underglow Aura Breathing for non-selected */}
            {!isLoser && animConfig.pastelAura && (
              <div
                className="absolute w-[100px] h-[100px] rounded-full pointer-events-none filter blur-[14px] opacity-40 animate-touch-aura"
                style={{
                  background: palette.gradient,
                }}
              />
            )}

            {/* 3. Pulsing Red Outer Glow Aura for Selected Indicator */}
            {isLoser && (
              <div
                className="absolute -inset-4 rounded-full pointer-events-none filter blur-[18px] animate-selected-red-aura"
                style={{
                  background: 'radial-gradient(circle, rgba(239, 68, 68, 0.95) 20%, rgba(220, 38, 38, 0.6) 55%, transparent 75%)',
                }}
              />
            )}

            {/* 4. Outcome Reveal Loser Shockwave Halo Ring */}
            {isLoser && animConfig.outcomeReveal && (
              <div
                className="absolute w-[94px] h-[94px] rounded-full pointer-events-none animate-ping opacity-60"
                style={{
                  background: 'radial-gradient(circle, rgba(239,63,94,0.8) 0%, transparent 70%)',
                  animationDuration: '1.2s',
                }}
              />
            )}

            {/* Flat Simple Pastel Gradient Circle with Subtle Wiggle Scale or Selected Bigger Pulse */}
            <div
              className={animConfig.springPop && gameState !== 'resolved' ? 'animate-touch-spring-entry' : ''}
            >
              <div
                ref={(el) => {
                  if (el) {
                    innerRefs.current.set(player.id, el);
                  } else {
                    innerRefs.current.delete(player.id);
                  }
                }}
                className={`w-[94px] h-[94px] rounded-full flex items-center justify-center pointer-events-none select-none relative ${
                  isLoser
                    ? 'animate-selected-pulse'
                    : isSafeDim
                    ? animConfig.outcomeReveal
                      ? 'animate-outcome-safe-fade'
                      : 'animate-touch-wiggle'
                    : 'animate-touch-wiggle'
                }`}
                style={{
                  background: palette.gradient,
                  boxShadow: !isLoser ? '0 4px 16px rgba(0, 0, 0, 0.15)' : undefined,
                  animationDuration:
                    !isLoser && !isSafeDim && gameState === 'countdown' && animConfig.tensionPulse
                      ? `${tensionDuration}s`
                      : undefined,
                }}
              >
                {/* Flat Clean Typography */}
                <span
                  className={`font-black select-none tracking-wider text-white ${
                    isLoser
                      ? 'text-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]'
                      : isSafeDim
                      ? 'text-xs drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]'
                      : 'text-xl drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]'
                  }`}
                >
                  {badgeContent}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};


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
    name: 'Blue Cyan',
    primary: '#00f0ff',
    secondary: '#0066ff',
    ringColor: '#00f0ff',
    accent: '#38bdf8',
    glow: 'rgba(0, 240, 255, 0.85)',
    subGlow: 'rgba(0, 102, 255, 0.55)',
    gradient: 'linear-gradient(135deg, #0066ff, #00f0ff)',
  },
  {
    name: 'Magenta Red',
    primary: '#ff007f',
    secondary: '#ff1744',
    ringColor: '#ff007f',
    accent: '#f43f5e',
    glow: 'rgba(255, 0, 127, 0.85)',
    subGlow: 'rgba(255, 23, 68, 0.55)',
    gradient: 'linear-gradient(135deg, #ff007f, #ff1744)',
  },
  {
    name: 'Purple Blue',
    primary: '#a855f7',
    secondary: '#3b82f6',
    ringColor: '#c084fc',
    accent: '#818cf8',
    glow: 'rgba(168, 85, 247, 0.85)',
    subGlow: 'rgba(59, 130, 246, 0.55)',
    gradient: 'linear-gradient(135deg, #a855f7, #3b82f6)',
  },
  {
    name: 'Orange Red',
    primary: '#ff6a00',
    secondary: '#ff2200',
    ringColor: '#ff7700',
    accent: '#fb923c',
    glow: 'rgba(255, 106, 0, 0.85)',
    subGlow: 'rgba(255, 34, 0, 0.55)',
    gradient: 'linear-gradient(135deg, #ff7a00, #ff1e00)',
  },
  {
    name: 'Red Yellow',
    primary: '#ff1744',
    secondary: '#ffd000',
    ringColor: '#ffd000',
    accent: '#facc15',
    glow: 'rgba(255, 208, 0, 0.85)',
    subGlow: 'rgba(255, 23, 68, 0.55)',
    gradient: 'linear-gradient(135deg, #ff1744, #ffd000)',
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
  const [countdownNum, setCountdownNum] = useState<number>(settings.countdownSeconds);
  const [touches, setTouches] = useState<Map<string | number, TouchPlayer>>(new Map());

  const containerRef = useRef<HTMLDivElement | null>(null);
  const touchesRef = useRef<Map<string | number, TouchPlayer>>(new Map());
  const indicatorRefs = useRef<Map<string | number, HTMLDivElement>>(new Map());
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
    touchesRef.current.clear();
    indicatorRefs.current.clear();
    setTouches(new Map());
    availableColorsRef.current = [...INITIAL_COLOR_INDICES];
    notifyTouches(new Map());
  }, [notifyTouches]);

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
        setCountdownNum(settings.countdownSeconds);
        SoundEngine.playCountdownTick(settings.countdownSeconds, settings.countdownSeconds);

        let currentVal = settings.countdownSeconds;
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

        countdownIntervalRef.current = window.setInterval(() => {
          currentVal -= 1;
          if (currentVal > 0) {
            setCountdownNum(currentVal);
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

    let hasMoved = false;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      const existing = touchesRef.current.get(t.identifier);
      if (existing) {
        const { x, y } = getRelativeCoords(t.clientX, t.clientY);
        existing.x = x;
        existing.y = y;
        hasMoved = true;
        // Direct GPU translation instantly under the user's finger (0ms delay)
        const el = indicatorRefs.current.get(t.identifier);
        if (el) {
          el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
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

      {/* Giant Background Countdown Number */}
      {gameState === 'countdown' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <span
            className="font-header text-[15rem] font-black tracking-tighter text-white/10 select-none animate-ping"
            style={{ animationDuration: '1s' }}
          >
            {countdownNum}
          </span>
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
            className={`absolute top-0 left-0 w-20 h-20 pointer-events-none z-30 flex items-center justify-center will-change-transform ${
              isSafeDim
                ? 'opacity-35 transition-opacity duration-300'
                : 'opacity-100'
            }`}
            style={{
              transform: `translate3d(${player.x}px, ${player.y}px, 0) translate(-50%, -50%)`,
            }}
          >
            {/* Loser Hyper Pulsing Triple Shock Rings */}
            {isLoser && (
              <>
                <div className="absolute -inset-6 rounded-full border-2 border-pink-500 animate-hyperRing1 pointer-events-none" />
                <div className="absolute -inset-9 rounded-full border-2 border-red-500 animate-hyperRing2 pointer-events-none" />
                <div className="absolute -inset-12 rounded-full border border-white animate-hyperRing3 pointer-events-none" />
              </>
            )}

            {/* Ambient Breathing Neon Halo Disc (Party Touch Aura) */}
            <div
              className="absolute -inset-6 rounded-full pointer-events-none animate-party-halo"
              style={{
                background: `radial-gradient(circle at 50% 50%, ${
                  isLoser ? 'rgba(255, 0, 85, 0.5)' : palette.glow
                } 0%, transparent 72%)`,
              }}
            />

            {/* Outward Radiating Soundwave Ripple 1 (Fluid Party Beat - No Rotation) */}
            <div
              className="absolute -inset-2.5 rounded-full pointer-events-none animate-party-ripple1"
              style={{
                border: `2px solid ${isLoser ? '#ff0055' : palette.primary}`,
                boxShadow: `0 0 14px ${isLoser ? '#ff0055' : palette.glow}`,
              }}
            />

            {/* Outward Radiating Soundwave Ripple 2 (Phase Offset Ripple - No Rotation) */}
            <div
              className="absolute -inset-2.5 rounded-full pointer-events-none animate-party-ripple2"
              style={{
                border: `1.5px solid ${isLoser ? '#ff3366' : palette.secondary}`,
                boxShadow: `0 0 10px ${isLoser ? 'rgba(255, 0, 85, 0.7)' : palette.subGlow}`,
              }}
            />

            {/* Concentric Neon Party Core Ring (Rhythmic Breathing Pulse) */}
            <div
              className="absolute -inset-0.5 rounded-full pointer-events-none animate-party-pulse"
              style={{
                border: `2px solid ${isLoser ? '#ff0055' : palette.primary}`,
                boxShadow: `0 0 12px ${isLoser ? '#ff0055' : palette.glow}, inset 0 0 8px ${
                  isLoser ? '#ff0033' : palette.subGlow
                }`,
              }}
            />

            {/* Inner Glass Specular Accent Rim */}
            <div
              className="absolute inset-1.5 rounded-full pointer-events-none"
              style={{
                border: `1px solid ${isLoser ? 'rgba(255, 255, 255, 0.75)' : 'rgba(255, 255, 255, 0.45)'}`,
              }}
            />

            {/* Center Neon Party Pad Disc (Glossy Touch Jewel - No Crosshairs) */}
            <div
              className={`absolute inset-2.5 rounded-full flex items-center justify-center pointer-events-none ${
                isLoser ? 'animate-hyperPulse' : ''
              }`}
              style={{
                background: `radial-gradient(circle at 38% 38%, ${
                  isLoser ? 'rgba(255, 0, 85, 0.65)' : `${palette.primary}45`
                } 0%, rgba(6, 8, 22, 0.95) 85%)`,
                border: `1.5px solid ${isLoser ? '#ffd700' : palette.primary}`,
                boxShadow: `
                  0 0 18px ${isLoser ? '#ff0055' : palette.glow},
                  inset 0 0 12px ${isLoser ? '#ff0033' : palette.subGlow}
                `,
              }}
            >
              {/* Center Holographic Pip Badge */}
              <div
                className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center font-header font-bold ${
                  isLoser
                    ? 'bg-white text-rose-600 border border-rose-400 shadow-[0_0_16px_#ffffff]'
                    : isSafeDim
                    ? 'bg-black/70 text-emerald-300 border border-emerald-400/50'
                    : 'bg-black/60 text-white border border-white/20'
                } uppercase backdrop-blur-md`}
                style={{
                  boxShadow: isLoser
                    ? '0 0 16px #ffffff, 0 0 24px rgba(244,63,94,0.8)'
                    : isSafeDim
                    ? '0 0 10px rgba(16,185,129,0.5)'
                    : `0 0 8px ${palette.glow}`,
                }}
              >
                {isLoser ? (
                  <span className="text-[7.5px] font-black tracking-tighter">LOSER</span>
                ) : isSafeDim ? (
                  <span className="text-[7.5px] font-black tracking-tighter text-emerald-300">SAFE</span>
                ) : (
                  <span
                    className="text-[10px] font-black tracking-wider"
                    style={{ textShadow: `0 0 6px ${palette.primary}` }}
                  >
                    {badgeContent}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};


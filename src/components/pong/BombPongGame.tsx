/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import {
  Users,
  Bot,
  ChevronRight,
  Heart,
} from 'lucide-react';
import { AppSettings } from '../../types';
import { SoundEngine, Haptics } from '../../lib/audio';
import {
  getEconomyState,
  saveEconomyState,
  getStoreCatalogue,
  STORE_CATALOGUE,
  EconomyState,
} from '../../lib/economy';
import { BombPongGameOverModal } from './BombPongGameOverModal';
import defaultBombImg from '../../assets/images/bombs/Bomb Sprite.webp';

export interface BombPongGameProps {
  settings: AppSettings;
  economy?: EconomyState;
  onNavigateHome: () => void;
  onEconomyUpdated?: (economy: EconomyState) => void;
  onInCourtChange?: (inCourt: boolean) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
}

interface ExplosionEffect {
  x: number;
  y: number;
  side: 'top' | 'bottom';
  radius: number;
  maxRadius: number;
  alpha: number;
}

type BotDifficulty = 'easy' | 'normal' | 'hard';
type PongGamePhase = 'mode_select' | 'ready' | 'countdown' | 'playing' | 'detonated' | 'gameover';

export const BombPongGame: React.FC<BombPongGameProps> = ({
  settings,
  economy: propEconomy,
  onNavigateHome,
  onEconomyUpdated,
  onInCourtChange,
}) => {
  // Synchronized Economy & Bomb Skin
  const [currentEconomy, setCurrentEconomy] = useState<EconomyState>(
    () => propEconomy || getEconomyState()
  );

  useEffect(() => {
    if (propEconomy) {
      setCurrentEconomy(propEconomy);
    }
  }, [propEconomy]);

  // Listen to economy & store updates in real-time
  useEffect(() => {
    const handleEcoUpdate = (e: CustomEvent<EconomyState>) => {
      if (e.detail) setCurrentEconomy(e.detail);
    };
    const handleCatUpdate = () => {
      setCurrentEconomy(getEconomyState());
    };
    window.addEventListener('picku_economy_updated', handleEcoUpdate as EventListener);
    window.addEventListener('picku_store_catalogue_updated', handleCatUpdate);
    return () => {
      window.removeEventListener('picku_economy_updated', handleEcoUpdate as EventListener);
      window.removeEventListener('picku_store_catalogue_updated', handleCatUpdate);
    };
  }, []);

  // Determine equipped bomb item
  const equippedBombId = currentEconomy?.equippedSkins?.bombs || 'bomb_classic_tnt';
  const catalogue = getStoreCatalogue();
  const equippedBombItem =
    catalogue.bombs.find((b) => b.id === equippedBombId) ||
    STORE_CATALOGUE.bombs.find((b) => b.id === equippedBombId);
  const bombImageUrl = equippedBombItem?.image || defaultBombImg;

  // Game Setup & Modes
  const [gamePhase, setGamePhase] = useState<PongGamePhase>('mode_select');
  const [isBotMode, setIsBotMode] = useState<boolean>(false);
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('normal');

  // Game States
  const [player1Score, setPlayer1Score] = useState<number>(0);
  const [player2Score, setPlayer2Score] = useState<number>(0);
  const [player1Lives, setPlayer1Lives] = useState<number>(3);
  const [player2Lives, setPlayer2Lives] = useState<number>(3);
  const [servingPlayer, setServingPlayer] = useState<'p1' | 'p2'>('p1');
  const [opponentReady, setOpponentReady] = useState<boolean>(false);

  const [rallyCount, setRallyCount] = useState<number>(0);
  const [maxRally, setMaxRally] = useState<number>(0);
  const [totalBounces, setTotalBounces] = useState<number>(0);
  const [maxSpeedRecorded, setMaxSpeedRecorded] = useState<number>(4.5);
  const [serveCountdown, setServeCountdown] = useState<number>(3);
  const [gameOverModalOpen, setGameOverModalOpen] = useState<boolean>(false);
  const [matchWinner, setMatchWinner] = useState<'player1' | 'player2'>('player1');
  const [rewardCoins, setRewardCoins] = useState<number>(0);
  const [detonatedSide, setDetonatedSide] = useState<'top' | 'bottom' | null>(null);
  const [screenShake, setScreenShake] = useState<number>(0);

  // Canvas & Physics Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Bomb Sprite Image
  const bombImageRef = useRef<HTMLImageElement | null>(null);
  useEffect(() => {
    const img = new Image();
    img.src = bombImageUrl;
    img.onload = () => {
      bombImageRef.current = img;
    };
  }, [bombImageUrl]);

  // Arena Dimensions & Logical Resolution
  const arenaRef = useRef({
    width: 400,
    height: 700,
    dpr: 1,
  });

  // Paddles State
  const p1PaddleRef = useRef({
    x: 200,
    y: 600,
    width: 110,
    height: 16,
    targetX: 200,
    glow: 0,
  });

  const p2PaddleRef = useRef({
    x: 200,
    y: 100,
    width: 110,
    height: 16,
    targetX: 200,
    glow: 0,
  });

  // Bomb Physics
  const bombRef = useRef({
    x: 200,
    y: 560,
    vx: 0,
    vy: 0,
    radius: 18,
    speed: 4.8,
    baseSpeed: 4.8,
    maxSpeed: 18,
    rotation: 0,
    pulse: 1,
    active: false,
  });

  // Particles & Visual FX
  const particlesRef = useRef<Particle[]>([]);
  const explosionsRef = useRef<ExplosionEffect[]>([]);

  // Multi-Touch tracking pointers
  const activePointersRef = useRef<Map<number, 'p1' | 'p2'>>(new Map());

  // Perfect 100% Screen Resolution & Layout Sizing
  const handleResize = useCallback((width: number, height: number) => {
    if (width <= 0 || height <= 0) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    arenaRef.current = { width, height, dpr };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }

    // Responsive, non-distorting paddle dimensions
    const paddleW = Math.max(90, Math.min(160, width * 0.28));
    const paddleH = 15;
    const topPaddleY = Math.max(75, Math.min(115, height * 0.12));
    const bottomPaddleY = Math.max(height - 115, Math.min(height - 75, height * 0.88));

    p1PaddleRef.current.width = paddleW;
    p1PaddleRef.current.height = paddleH;
    p1PaddleRef.current.y = bottomPaddleY;
    p1PaddleRef.current.x = Math.max(paddleW / 2 + 10, Math.min(width - paddleW / 2 - 10, p1PaddleRef.current.x || width / 2));
    p1PaddleRef.current.targetX = p1PaddleRef.current.x;

    p2PaddleRef.current.width = paddleW;
    p2PaddleRef.current.height = paddleH;
    p2PaddleRef.current.y = topPaddleY;
    p2PaddleRef.current.x = Math.max(paddleW / 2 + 10, Math.min(width - paddleW / 2 - 10, p2PaddleRef.current.x || width / 2));
    p2PaddleRef.current.targetX = p2PaddleRef.current.x;

    // Responsive bomb radius (always perfectly spherical)
    bombRef.current.radius = Math.max(16, Math.min(22, width * 0.045));
  }, []);

  // ResizeObserver on the main 100% full-screen container
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const update = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        handleResize(rect.width, rect.height);
      }
    };

    update();
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          handleResize(width, height);
        }
      }
    });

    ro.observe(containerRef.current);
    window.addEventListener('resize', update);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [handleResize]);

  // Keep bomb attached to serving player's bar during ready and countdown phases
  const syncBombToPaddle = useCallback(() => {
    const bomb = bombRef.current;
    if (servingPlayer === 'p1') {
      const p1 = p1PaddleRef.current;
      bomb.x = p1.x;
      bomb.y = p1.y - p1.height / 2 - bomb.radius - 3;
    } else {
      const p2 = p2PaddleRef.current;
      bomb.x = p2.x;
      bomb.y = p2.y + p2.height / 2 + bomb.radius + 3;
    }
  }, [servingPlayer]);

  // Start the 3..2..1 Countdown
  const triggerCountdown = useCallback(() => {
    if (gamePhase === 'countdown' || gamePhase === 'playing') return;
    setGamePhase('countdown');
    setServeCountdown(3);
    SoundEngine.playCountdownTick(3, 3);
    Haptics.light();
  }, [gamePhase]);

  // Opponent clicks ready button (precisely)
  const handleOpponentClickReady = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    SoundEngine.playButtonClick();
    Haptics.buttonClick();
    setOpponentReady(true);
  }, []);

  // Screen tap handler during ready phase:
  // - In bot mode: tap anywhere immediately starts countdown
  // - In 2P mode: after opponent clicks ready, tap anywhere starts countdown
  const handleArenaScreenTap = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).closest('button')) return;

      if (gamePhase === 'ready') {
        if (isBotMode) {
          triggerCountdown();
          return;
        }

        if (opponentReady) {
          triggerCountdown();
        }
      }
    },
    [gamePhase, isBotMode, opponentReady, triggerCountdown]
  );

  // Launch Bomb from the serving paddle towards opponent
  const launchBombFromPaddle = useCallback(() => {
    const bomb = bombRef.current;
    syncBombToPaddle();

    const speed = bomb.baseSpeed;
    const angle = (Math.random() * 0.4 - 0.2) * Math.PI;
    const dirY = servingPlayer === 'p1' ? -1 : 1;

    bomb.speed = speed;
    bomb.vx = Math.sin(angle) * speed;
    bomb.vy = Math.cos(angle) * speed * dirY;
    bomb.active = true;

    setRallyCount(0);
    setGamePhase('playing');
    SoundEngine.playPaddleHit(1.0);
    Haptics.paddleHit();
  }, [servingPlayer, syncBombToPaddle]);

  // Countdown timer hook
  useEffect(() => {
    if (gamePhase !== 'countdown') return;
    if (serveCountdown > 0) {
      SoundEngine.playCountdownTick(serveCountdown, 3);
      Haptics.light();
      const timer = setTimeout(() => {
        setServeCountdown((c) => c - 1);
      }, 750);
      return () => clearTimeout(timer);
    } else {
      launchBombFromPaddle();
    }
  }, [gamePhase, serveCountdown, launchBombFromPaddle]);

  // Spawn Detonation Fire & Sparks FX
  const triggerExplosion = useCallback((x: number, y: number, side: 'top' | 'bottom') => {
    setDetonatedSide(side);
    setScreenShake(22);
    SoundEngine.playBombExplosion();
    Haptics.heavy();

    explosionsRef.current.push({
      x,
      y,
      side,
      radius: 10,
      maxRadius: Math.max(arenaRef.current.width * 0.95, 360),
      alpha: 1,
    });

    const colors = ['#ff0055', '#ff5500', '#ffaa00', '#ffff00', '#ff00aa', '#ffffff', '#00f3ff'];
    for (let i = 0; i < 60; i++) {
      const angle = side === 'top'
        ? Math.PI * 0.15 + Math.random() * Math.PI * 0.7
        : -Math.PI * 0.85 + Math.random() * Math.PI * 0.7;
      const vel = 3 + Math.random() * 15;
      particlesRef.current.push({
        x: x + (Math.random() * 60 - 30),
        y: y,
        vx: Math.cos(angle) * vel,
        vy: Math.sin(angle) * vel,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 6,
        alpha: 1,
        life: 0,
        maxLife: 30 + Math.random() * 35,
      });
    }
  }, []);

  // Handle Missed Bomb Resolution
  const handleMissedBomb = useCallback(
    (side: 'top' | 'bottom') => {
      bombRef.current.active = false;
      setGamePhase('detonated');

      const bombX = bombRef.current.x;
      const bombY = side === 'top' ? p2PaddleRef.current.y - 15 : p1PaddleRef.current.y + 15;
      triggerExplosion(bombX, bombY, side);

      if (side === 'bottom') {
        setServingPlayer('p1');
        setPlayer1Lives((prev) => {
          const next = Math.max(0, prev - 1);
          setPlayer2Score((s) => s + 1);
          if (next === 0) {
            setTimeout(() => {
              setMatchWinner('player2');
              finishMatch('player2');
            }, 1200);
          } else {
            setTimeout(() => {
              setDetonatedSide(null);
              setOpponentReady(false);
              setGamePhase('ready');
            }, 1400);
          }
          return next;
        });
      } else {
        setServingPlayer('p2');
        setPlayer2Lives((prev) => {
          const next = Math.max(0, prev - 1);
          setPlayer1Score((s) => s + 1);
          if (next === 0) {
            setTimeout(() => {
              setMatchWinner('player1');
              finishMatch('player1');
            }, 1200);
          } else {
            setTimeout(() => {
              setDetonatedSide(null);
              setOpponentReady(false);
              setGamePhase('ready');
            }, 1400);
          }
          return next;
        });
      }
    },
    [triggerExplosion]
  );

  // Match Complete
  const finishMatch = (winner: 'player1' | 'player2') => {
    setGamePhase('gameover');
    setDetonatedSide(null);
    const coins = winner === 'player1' ? 45 : 20;
    setRewardCoins(coins);

    try {
      const state = getEconomyState();
      const updated = {
        ...state,
        stars: (state.stars || 0) + coins,
        lifetimeStarsEarned: (state.lifetimeStarsEarned || 0) + coins,
      };
      saveEconomyState(updated);
      if (onEconomyUpdated) onEconomyUpdated(updated);
    } catch (e) {
      console.warn('Failed to save pong reward:', e);
    }

    setGameOverModalOpen(true);
  };

  // Start Duel from Mode Select Screen
  const handleStartDuel = (botMode: boolean) => {
    setIsBotMode(botMode);
    setPlayer1Score(0);
    setPlayer2Score(0);
    setPlayer1Lives(3);
    setPlayer2Lives(3);
    setServingPlayer('p1');
    setOpponentReady(false);
    setRallyCount(0);
    setGameOverModalOpen(false);
    setDetonatedSide(null);
    setGamePhase('ready');
    particlesRef.current = [];
    explosionsRef.current = [];

    const { width } = arenaRef.current;
    p1PaddleRef.current.x = width / 2;
    p1PaddleRef.current.targetX = width / 2;
    p2PaddleRef.current.x = width / 2;
    p2PaddleRef.current.targetX = width / 2;

    SoundEngine.playButtonClick();
    Haptics.buttonClick();
  };

  // Restart Entire Match
  const resetMatch = useCallback(() => {
    setPlayer1Score(0);
    setPlayer2Score(0);
    setPlayer1Lives(3);
    setPlayer2Lives(3);
    setServingPlayer('p1');
    setOpponentReady(false);
    setRallyCount(0);
    setGameOverModalOpen(false);
    setDetonatedSide(null);
    setGamePhase('ready');
    particlesRef.current = [];
    explosionsRef.current = [];

    const { width } = arenaRef.current;
    p1PaddleRef.current.x = width / 2;
    p1PaddleRef.current.targetX = width / 2;
    p2PaddleRef.current.x = width / 2;
    p2PaddleRef.current.targetX = width / 2;
  }, []);

  // Header Back & Restart Navigation Event Listeners
  useEffect(() => {
    const handleGameRestart = () => {
      resetMatch();
    };
    const handleGameBack = () => {
      if (gamePhase !== 'mode_select') {
        setGamePhase('mode_select');
      } else {
        onNavigateHome();
      }
    };

    window.addEventListener('picku_game_restart', handleGameRestart);
    window.addEventListener('picku_game_back', handleGameBack);
    return () => {
      window.removeEventListener('picku_game_restart', handleGameRestart);
      window.removeEventListener('picku_game_back', handleGameBack);
    };
  }, [gamePhase, onNavigateHome, resetMatch]);

  // Sync court state with parent header
  useEffect(() => {
    if (onInCourtChange) {
      onInCourtChange(gamePhase !== 'mode_select');
    }
  }, [gamePhase, onInCourtChange]);

  // Screen shake decay
  useEffect(() => {
    if (screenShake > 0) {
      const interval = setInterval(() => {
        setScreenShake((s) => Math.max(0, s - 2.5));
      }, 30);
      return () => clearInterval(interval);
    }
  }, [screenShake]);

  // Keyboard controls for desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const step = 35;
      const { width } = arenaRef.current;
      const p1W = p1PaddleRef.current.width;
      const p2W = p2PaddleRef.current.width;

      if (e.key === 'ArrowLeft') {
        p1PaddleRef.current.targetX = Math.max(
          p1W / 2 + 10,
          p1PaddleRef.current.targetX - step
        );
      } else if (e.key === 'ArrowRight') {
        p1PaddleRef.current.targetX = Math.min(
          width - p1W / 2 - 10,
          p1PaddleRef.current.targetX + step
        );
      }

      if (!isBotMode) {
        if (e.key === 'a' || e.key === 'A') {
          p2PaddleRef.current.targetX = Math.max(
            p2W / 2 + 10,
            p2PaddleRef.current.targetX - step
          );
        } else if (e.key === 'd' || e.key === 'D') {
          p2PaddleRef.current.targetX = Math.min(
            width - p2W / 2 - 10,
            p2PaddleRef.current.targetX + step
          );
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBotMode]);

  // Pointer & Multi-Touch Drag Tracking
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const touchY = e.clientY - rect.top;
    const touchX = e.clientX - rect.left;
    const isTopHalf = touchY < rect.height / 2;

    const p1W = p1PaddleRef.current.width;
    const p2W = p2PaddleRef.current.width;

    if (isTopHalf) {
      if (!isBotMode) {
        activePointersRef.current.set(e.pointerId, 'p2');
        p2PaddleRef.current.targetX = Math.max(
          p2W / 2 + 10,
          Math.min(rect.width - p2W / 2 - 10, touchX)
        );
      }
    } else {
      activePointersRef.current.set(e.pointerId, 'p1');
      p1PaddleRef.current.targetX = Math.max(
        p1W / 2 + 10,
        Math.min(rect.width - p1W / 2 - 10, touchX)
      );
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const role = activePointersRef.current.get(e.pointerId);
    if (!role) return;

    const rect = containerRef.current.getBoundingClientRect();
    const touchX = e.clientX - rect.left;

    const p1W = p1PaddleRef.current.width;
    const p2W = p2PaddleRef.current.width;

    if (role === 'p1') {
      p1PaddleRef.current.targetX = Math.max(
        p1W / 2 + 10,
        Math.min(rect.width - p1W / 2 - 10, touchX)
      );
    } else if (role === 'p2' && !isBotMode) {
      p2PaddleRef.current.targetX = Math.max(
        p2W / 2 + 10,
        Math.min(rect.width - p2W / 2 - 10, touchX)
      );
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    activePointersRef.current.delete(e.pointerId);
  };

  // Main 60FPS Game Rendering Loop (with DPR pixel-perfect scaling)
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (time: number) => {
      lastTime = time;

      const canvas = canvasRef.current;
      if (!canvas) {
        animFrameIdRef.current = requestAnimationFrame(loop);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animFrameIdRef.current = requestAnimationFrame(loop);
        return;
      }

      const { width, height, dpr } = arenaRef.current;
      if (width <= 0 || height <= 0) {
        animFrameIdRef.current = requestAnimationFrame(loop);
        return;
      }

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const p1 = p1PaddleRef.current;
      const p2 = p2PaddleRef.current;

      // Smooth Paddle Movement
      p1.x += (p1.targetX - p1.x) * 0.35;
      p1.glow = Math.max(0, p1.glow - 0.05);

      if (isBotMode) {
        const bot = p2;
        const bomb = bombRef.current;
        let botSpeedFactor = 0.12;
        if (botDifficulty === 'easy') botSpeedFactor = 0.07;
        if (botDifficulty === 'hard') botSpeedFactor = 0.20;

        let predictedX = bomb.x;
        if (bomb.vy < 0) {
          const variance = botDifficulty === 'easy' ? Math.sin(time * 0.003) * 40 : 0;
          predictedX = bomb.x + variance;
        } else {
          predictedX = width / 2;
        }

        bot.targetX = Math.max(
          bot.width / 2 + 10,
          Math.min(width - bot.width / 2 - 10, predictedX)
        );
        bot.x += (bot.targetX - bot.x) * botSpeedFactor;
      } else {
        p2.x += (p2.targetX - p2.x) * 0.35;
      }
      p2.glow = Math.max(0, p2.glow - 0.05);

      // Anchor bomb to serving bar during ready / countdown
      if (gamePhase === 'ready' || gamePhase === 'countdown') {
        syncBombToPaddle();
        bombRef.current.rotation = Math.sin(time * 0.005) * 0.15;
        bombRef.current.pulse = 1 + Math.sin(time * 0.012) * 0.08;
      }

      // Bomb Physics Update while playing
      const bomb = bombRef.current;
      if (bomb.active && gamePhase === 'playing') {
        bomb.x += bomb.vx;
        bomb.y += bomb.vy;
        bomb.rotation += bomb.speed * 0.04;
        bomb.pulse = 1 + Math.sin(time * 0.015) * 0.1;

        // Fuse Spark Generator
        if (Math.random() < 0.6) {
          const sparkAngle = Math.random() * Math.PI * 2;
          const sparkSpeed = 1.5 + Math.random() * 3.5;
          particlesRef.current.push({
            x: bomb.x + Math.sin(bomb.rotation) * (bomb.radius * 0.9),
            y: bomb.y - Math.cos(bomb.rotation) * (bomb.radius * 0.9),
            vx: Math.cos(sparkAngle) * sparkSpeed,
            vy: Math.sin(sparkAngle) * sparkSpeed,
            color: Math.random() > 0.3 ? '#ffaa00' : '#ffff55',
            size: 2 + Math.random() * 3,
            alpha: 1,
            life: 0,
            maxLife: 15 + Math.random() * 15,
          });
        }

        // Left / Right Laser Wall Collisions
        if (bomb.x - bomb.radius <= 6) {
          bomb.x = 6 + bomb.radius;
          bomb.vx = Math.abs(bomb.vx);
          SoundEngine.playWallPing();
          Haptics.light();
        } else if (bomb.x + bomb.radius >= width - 6) {
          bomb.x = width - 6 - bomb.radius;
          bomb.vx = -Math.abs(bomb.vx);
          SoundEngine.playWallPing();
          Haptics.light();
        }

        // Player 1 Paddle Collision (Bottom)
        const p1Top = p1.y - p1.height / 2;
        const p1Bottom = p1.y + p1.height / 2;
        const p1Left = p1.x - p1.width / 2;
        const p1Right = p1.x + p1.width / 2;

        if (
          bomb.vy > 0 &&
          bomb.y + bomb.radius >= p1Top &&
          bomb.y - bomb.radius <= p1Bottom &&
          bomb.x >= p1Left - 14 &&
          bomb.x <= p1Right + 14
        ) {
          p1.glow = 1.0;
          const hitOffset = (bomb.x - p1.x) / (p1.width / 2);
          const clampedOffset = Math.max(-0.92, Math.min(0.92, hitOffset));
          const maxBounceAngle = (55 * Math.PI) / 180;
          const bounceAngle = clampedOffset * maxBounceAngle;

          bomb.speed = Math.min(bomb.maxSpeed, bomb.speed * 1.06);
          bomb.vx = Math.sin(bounceAngle) * bomb.speed;
          bomb.vy = -Math.cos(bounceAngle) * bomb.speed;
          bomb.y = p1Top - bomb.radius - 1;

          SoundEngine.playPaddleHit(bomb.speed / bomb.baseSpeed);
          Haptics.medium();

          setRallyCount((r) => r + 1);
          setTotalBounces((b) => b + 1);
          setMaxSpeedRecorded((s) => Math.max(s, bomb.speed));
        }

        // Player 2 Paddle Collision (Top)
        const p2Top = p2.y - p2.height / 2;
        const p2Bottom = p2.y + p2.height / 2;
        const p2Left = p2.x - p2.width / 2;
        const p2Right = p2.x + p2.width / 2;

        if (
          bomb.vy < 0 &&
          bomb.y - bomb.radius <= p2Bottom &&
          bomb.y + bomb.radius >= p2Top &&
          bomb.x >= p2Left - 14 &&
          bomb.x <= p2Right + 14
        ) {
          p2.glow = 1.0;
          const hitOffset = (bomb.x - p2.x) / (p2.width / 2);
          const clampedOffset = Math.max(-0.92, Math.min(0.92, hitOffset));
          const maxBounceAngle = (55 * Math.PI) / 180;
          const bounceAngle = clampedOffset * maxBounceAngle;

          bomb.speed = Math.min(bomb.maxSpeed, bomb.speed * 1.06);
          bomb.vx = Math.sin(bounceAngle) * bomb.speed;
          bomb.vy = Math.cos(bounceAngle) * bomb.speed;
          bomb.y = p2Bottom + bomb.radius + 1;

          SoundEngine.playPaddleHit(bomb.speed / bomb.baseSpeed);
          Haptics.medium();

          setRallyCount((r) => r + 1);
          setTotalBounces((b) => b + 1);
          setMaxSpeedRecorded((s) => Math.max(s, bomb.speed));
        }

        // Missed behind baselines
        if (bomb.y - bomb.radius > p1.y + p1.height / 2 + 18) {
          handleMissedBomb('bottom');
        } else if (bomb.y + bomb.radius < p2.y - p2.height / 2 - 18) {
          handleMissedBomb('top');
        }
      }

      // 1. Center Court Net Divider Line
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(12, height / 2);
      ctx.lineTo(width - 12, height / 2);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 44, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // 2. Sliding Track Guides
      ctx.save();
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.14)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(20, p1.y);
      ctx.lineTo(width - 20, p1.y);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(236, 72, 153, 0.14)';
      ctx.beginPath();
      ctx.moveTo(20, p2.y);
      ctx.lineTo(width - 20, p2.y);
      ctx.stroke();
      ctx.restore();

      // 3. Render Player 1 Paddle (Bottom - Neon Cyan Capsule)
      ctx.save();
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 12 + p1.glow * 20;
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.roundRect(p1.x - p1.width / 2, p1.y - p1.height / 2, p1.width, p1.height, 8);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(p1.x - p1.width / 2 + 6, p1.y - 2, p1.width - 12, 4, 3);
      ctx.fill();
      ctx.restore();

      // 4. Render Player 2 Paddle (Top - Neon Pink Capsule)
      ctx.save();
      ctx.shadowColor = '#ec4899';
      ctx.shadowBlur = 12 + p2.glow * 20;
      ctx.fillStyle = '#db2777';
      ctx.beginPath();
      ctx.roundRect(p2.x - p2.width / 2, p2.y - p2.height / 2, p2.width, p2.height, 8);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(p2.x - p2.width / 2 + 6, p2.y - 2, p2.width - 12, 4, 3);
      ctx.fill();
      ctx.restore();

      // 5. Explosions FX
      for (let i = explosionsRef.current.length - 1; i >= 0; i--) {
        const exp = explosionsRef.current[i];
        exp.radius += 14;
        exp.alpha = Math.max(0, 1 - exp.radius / exp.maxRadius);

        ctx.save();
        ctx.beginPath();
        ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 68, 0, ${exp.alpha * 0.9})`;
        ctx.lineWidth = 8 * exp.alpha;
        ctx.stroke();
        ctx.restore();

        if (exp.radius >= exp.maxRadius) {
          explosionsRef.current.splice(i, 1);
        }
      }

      // 6. Particles FX
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.life += 1;
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (p.life >= p.maxLife) {
          particlesRef.current.splice(i, 1);
        }
      }

      // 7. Perfect 1:1 Aspect Ratio Bomb Sprite (No stretching)
      if (bomb.active || gamePhase === 'ready' || gamePhase === 'countdown') {
        ctx.save();
        ctx.translate(bomb.x, bomb.y);
        ctx.rotate(bomb.rotation);
        ctx.scale(bomb.pulse, bomb.pulse);

        if (bombImageRef.current && bombImageRef.current.complete && bombImageRef.current.naturalWidth > 0) {
          const drawSize = bomb.radius * 2.2;
          ctx.drawImage(
            bombImageRef.current,
            -drawSize / 2,
            -drawSize / 2,
            drawSize,
            drawSize
          );
        } else {
          ctx.fillStyle = '#1e1b4b';
          ctx.beginPath();
          ctx.arc(0, 0, bomb.radius, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      ctx.restore();
      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [gamePhase, isBotMode, botDifficulty, handleMissedBomb, syncBombToPaddle]);

  const p1 = p1PaddleRef.current;
  const p2 = p2PaddleRef.current;

  return (
    <div
      ref={containerRef}
      onPointerDown={(e) => {
        handlePointerDown(e);
        handleArenaScreenTap(e);
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        transform:
          screenShake > 0
            ? `translate(${(Math.random() - 0.5) * screenShake}px, ${(Math.random() - 0.5) * screenShake}px)`
            : undefined,
      }}
      className="relative w-full h-full min-h-[100vh] sm:min-h-0 select-none overflow-hidden touch-none flex flex-col justify-between bg-slate-950"
    >
      {/* Detonation Screen Flash Overlays */}
      {detonatedSide === 'bottom' && (
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-red-600/60 via-orange-500/25 to-transparent pointer-events-none z-20 animate-pulse" />
      )}
      {detonatedSide === 'top' && (
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-red-600/60 via-pink-500/25 to-transparent pointer-events-none z-20 animate-pulse" />
      )}

      {/* Cyber Grid Canvas (Always mounted for immediate zero-latency resolution updates) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block w-full h-full z-10 pointer-events-none"
      />

      {/* Laser Border Lights */}
      <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 shadow-[0_0_12px_rgba(236,72,153,0.8)] z-20" />
      <div className="absolute bottom-0 inset-x-0 h-1.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.8)] z-20" />
      <div className="absolute left-0 inset-y-0 w-1 bg-gradient-to-b from-pink-500 via-purple-400 to-cyan-500 shadow-[0_0_10px_rgba(168,85,247,0.7)] z-20" />
      <div className="absolute right-0 inset-y-0 w-1 bg-gradient-to-b from-pink-500 via-purple-400 to-cyan-500 shadow-[0_0_10px_rgba(168,85,247,0.7)] z-20" />

      {/* PERSISTENT LIVES COUNT: Positioned at the center slightly under the bars across entire gameplay */}
      {gamePhase !== 'mode_select' && (
        <>
          {/* Player 2 Lives (Top - Centered slightly under/behind Top Bar) */}
          <div
            style={{ top: Math.max(14, p2.y - 42) }}
            className="absolute inset-x-0 z-25 flex items-center justify-center pointer-events-none"
          >
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm border border-pink-500/20 shadow-[0_0_10px_rgba(236,72,153,0.2)]">
              {[1, 2, 3].map((h) => (
                <Heart
                  key={h}
                  className={`w-4 h-4 transition-all duration-300 ${
                    h <= player2Lives
                      ? 'fill-pink-500 text-pink-500 drop-shadow-[0_0_6px_rgba(236,72,153,0.9)]'
                      : 'fill-transparent text-slate-700 stroke-[1.5]'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Player 1 Lives (Bottom - Centered slightly under/behind Bottom Bar) */}
          <div
            style={{ top: Math.min(arenaRef.current.height - 30, p1.y + 24) }}
            className="absolute inset-x-0 z-25 flex items-center justify-center pointer-events-none"
          >
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm border border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
              {[1, 2, 3].map((h) => (
                <Heart
                  key={h}
                  className={`w-4 h-4 transition-all duration-300 ${
                    h <= player1Lives
                      ? 'fill-cyan-400 text-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.9)]'
                      : 'fill-transparent text-slate-700 stroke-[1.5]'
                  }`}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* VIEW: MODE SELECTION OVERLAY */}
      {gamePhase === 'mode_select' && (
        <div className="absolute inset-0 z-30 flex flex-col justify-between p-6 sm:p-10 bg-slate-950/90 backdrop-blur-sm pointer-events-auto">
          {/* Top Glow Ambiance */}
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="relative z-10 text-center mt-12 sm:mt-8">
            <h1 className="text-3xl sm:text-4xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-300 to-cyan-400">
              BOMB PONG
            </h1>
            <p className="text-xs font-bold text-slate-400 tracking-widest uppercase mt-1">
              CHOOSE BATTLE MODE
            </p>
          </div>

          {/* Mode Selection Cards */}
          <div className="relative z-10 max-w-md mx-auto w-full space-y-4 my-auto">
            {/* 2P LOCAL DUEL */}
            <div
              onClick={() => handleStartDuel(false)}
              className="group relative cursor-pointer p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-pink-950/40 via-purple-950/30 to-slate-900/60 border border-pink-500/40 hover:border-pink-400 hover:shadow-[0_0_25px_rgba(236,72,153,0.35)] active:scale-[0.98] transition-all overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-pink-600 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(236,72,153,0.6)]">
                    <Users className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
                        2-PLAYER DUEL
                      </h3>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-pink-500/25 text-pink-300 border border-pink-500/40">
                        PVP
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5 leading-snug">
                      Head-to-head tabletop ping pong on shared screen.
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-pink-400 group-hover:translate-x-1 transition-transform shrink-0" />
              </div>
            </div>

            {/* VS CYBER BOT */}
            <div
              onClick={() => handleStartDuel(true)}
              className="group relative cursor-pointer p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-cyan-950/40 via-blue-950/30 to-slate-900/60 border border-cyan-500/40 hover:border-cyan-400 hover:shadow-[0_0_25px_rgba(6,182,212,0.35)] active:scale-[0.98] transition-all overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.6)]">
                    <Bot className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
                        VS CYBER BOT
                      </h3>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-500/25 text-cyan-300 border border-cyan-500/40">
                        SOLO AI
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5 leading-snug">
                      Battle autonomous AI paddle reflexes.
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-cyan-400 group-hover:translate-x-1 transition-transform shrink-0" />
              </div>

              {/* Difficulty Tabs */}
              <div
                className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center justify-between"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Difficulty:
                </span>
                <div className="flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
                  {(['easy', 'normal', 'hard'] as BotDifficulty[]).map((diff) => (
                    <button
                      key={diff}
                      onClick={() => {
                        SoundEngine.playButtonClick();
                        Haptics.buttonClick();
                        setBotDifficulty(diff);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-black uppercase transition-all ${
                        botDifficulty === diff
                          ? 'bg-cyan-500 text-slate-950 shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 text-center text-xs text-slate-500 mb-4">
            Equipped bomb skin syncs from your Store collection
          </div>
        </div>
      )}

      {/* READY / SERVE PHASE OVERLAY */}
      {gamePhase === 'ready' && (
        <div className="absolute inset-0 z-30 pointer-events-none">
          {/* 1. VS BOT MODE: No ready button, click anywhere to start */}
          {isBotMode && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-slate-900/90 border border-cyan-500/40 backdrop-blur-md px-6 py-3.5 rounded-3xl shadow-[0_0_20px_rgba(6,182,212,0.3)] animate-pulse flex flex-col items-center">
                <span className="text-xs font-black text-cyan-300 tracking-widest uppercase">
                  TAP ANYWHERE TO SERVE
                </span>
              </div>
            </div>
          )}

          {/* 2. 2-PLAYER PVP MODE */}
          {!isBotMode && (
            <>
              {/* If Serving Player is P1 (Bottom), Opponent is P2 (Top) */}
              {servingPlayer === 'p1' && (
                <>
                  {/* Opponent (P2) Ready Button: Center, slightly above the opponent bar */}
                  {!opponentReady ? (
                    <div
                      style={{ top: p2.y + 36 }}
                      className="absolute inset-x-0 flex items-center justify-center pointer-events-none rotate-180"
                    >
                      <button
                        onClick={handleOpponentClickReady}
                        className="pointer-events-auto px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider bg-pink-950/90 text-pink-300 border border-pink-500/60 shadow-[0_0_15px_rgba(236,72,153,0.4)] hover:bg-pink-900 active:scale-95 transition-all cursor-pointer"
                      >
                        READY
                      </button>
                    </div>
                  ) : (
                    /* After opponent is ready, serving player (P1) taps anywhere to start */
                    <div
                      style={{ top: p1.y - 56 }}
                      className="absolute inset-x-0 flex items-center justify-center pointer-events-none"
                    >
                      <div className="bg-slate-900/90 border border-cyan-500/50 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-[0_0_15px_rgba(6,182,212,0.35)] animate-pulse">
                        <span className="text-xs font-black text-cyan-300 tracking-wider uppercase">
                          TAP ANYWHERE TO SERVE
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* If Serving Player is P2 (Top), Opponent is P1 (Bottom) */}
              {servingPlayer === 'p2' && (
                <>
                  {/* Opponent (P1) Ready Button: Center, slightly above P1's bar */}
                  {!opponentReady ? (
                    <div
                      style={{ top: p1.y - 56 }}
                      className="absolute inset-x-0 flex items-center justify-center pointer-events-none"
                    >
                      <button
                        onClick={handleOpponentClickReady}
                        className="pointer-events-auto px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider bg-cyan-950/90 text-cyan-300 border border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:bg-cyan-900 active:scale-95 transition-all cursor-pointer"
                      >
                        READY
                      </button>
                    </div>
                  ) : (
                    /* After opponent is ready, serving player (P2) taps anywhere to start */
                    <div
                      style={{ top: p2.y + 36 }}
                      className="absolute inset-x-0 flex items-center justify-center pointer-events-none rotate-180"
                    >
                      <div className="bg-slate-900/90 border border-pink-500/50 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-[0_0_15px_rgba(236,72,153,0.35)] animate-pulse">
                        <span className="text-xs font-black text-pink-300 tracking-wider uppercase">
                          TAP ANYWHERE TO SERVE
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* Countdown Display */}
      {gamePhase === 'countdown' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center animate-in zoom-in-75 duration-200">
            <div className="text-7xl font-black text-amber-400 drop-shadow-[0_0_25px_rgba(245,158,11,0.9)]">
              {serveCountdown > 0 ? serveCountdown : 'BOUNCE!'}
            </div>
          </div>
        </div>
      )}

      {/* Detonated Alert */}
      {gamePhase === 'detonated' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center animate-bounce">
            <div className="text-4xl font-black text-red-500 drop-shadow-[0_0_25px_rgba(239,68,68,0.9)]">
              💥 DETONATED!
            </div>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      <BombPongGameOverModal
        isOpen={gameOverModalOpen}
        winner={matchWinner}
        player1Score={player1Score}
        player2Score={player2Score}
        longestRally={maxRally}
        totalBounces={totalBounces}
        maxSpeed={maxSpeedRecorded}
        isBotGame={isBotMode}
        rewardCoins={rewardCoins}
        onPlayAgain={resetMatch}
        onExit={onNavigateHome}
      />
    </div>
  );
};

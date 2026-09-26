/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Home,
  RotateCcw,
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

  // Determine equipped bomb item (synchronized with the grid game / Kaboom mode)
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
  const [invertTopView, setInvertTopView] = useState<boolean>(true); // Flipped for tabletop face-to-face duel

  // Game States
  const [player1Score, setPlayer1Score] = useState<number>(0);
  const [player2Score, setPlayer2Score] = useState<number>(0);
  const [player1Lives, setPlayer1Lives] = useState<number>(3);
  const [player2Lives, setPlayer2Lives] = useState<number>(3);
  const [servingPlayer, setServingPlayer] = useState<'p1' | 'p2'>('p1');
  const [p1Ready, setP1Ready] = useState<boolean>(false);
  const [p2Ready, setP2Ready] = useState<boolean>(false);

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

  // Arena Dimensions & Objects
  const arenaRef = useRef({
    width: 400,
    height: 700,
  });

  // Paddles State
  const p1PaddleRef = useRef({
    x: 200,
    y: 580,
    width: 105,
    height: 16,
    targetX: 200,
    glow: 0,
  });

  const p2PaddleRef = useRef({
    x: 200,
    y: 120,
    width: 105,
    height: 16,
    targetX: 200,
    glow: 0,
  });

  // Bomb State (starts gentle at 4.5 px/frame)
  const bombRef = useRef({
    x: 200,
    y: 560,
    vx: 0,
    vy: 0,
    radius: 18,
    speed: 4.5,
    baseSpeed: 4.5,
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

  // Update arena size on resize (Fill 100% width and height without stretching)
  const updateDimensions = useCallback(() => {
    if (!containerRef.current || !canvasRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    arenaRef.current = { width: w, height: h };
    const dpr = window.devicePixelRatio || 1;
    canvasRef.current.width = w * dpr;
    canvasRef.current.height = h * dpr;

    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // Paddle responsive sizing
    const paddleW = Math.max(90, Math.min(160, w * 0.3));
    const topPaddleY = Math.max(70, Math.min(130, h * 0.15));
    const bottomPaddleY = Math.max(h - 130, Math.min(h - 70, h * 0.85));

    p1PaddleRef.current.width = paddleW;
    p1PaddleRef.current.y = bottomPaddleY;
    p1PaddleRef.current.x = Math.max(paddleW / 2 + 10, Math.min(w - paddleW / 2 - 10, p1PaddleRef.current.x));
    p1PaddleRef.current.targetX = p1PaddleRef.current.x;

    p2PaddleRef.current.width = paddleW;
    p2PaddleRef.current.y = topPaddleY;
    p2PaddleRef.current.x = Math.max(paddleW / 2 + 10, Math.min(w - paddleW / 2 - 10, p2PaddleRef.current.x));
    p2PaddleRef.current.targetX = p2PaddleRef.current.x;
  }, []);

  useEffect(() => {
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [updateDimensions]);

  // Keep bomb attached to serving player's bar during ready and countdown phases
  const syncBombToPaddle = useCallback(() => {
    const bomb = bombRef.current;
    if (servingPlayer === 'p1') {
      const p1 = p1PaddleRef.current;
      bomb.x = p1.x;
      bomb.y = p1.y - p1.height / 2 - bomb.radius - 2;
    } else {
      const p2 = p2PaddleRef.current;
      bomb.x = p2.x;
      bomb.y = p2.y + p2.height / 2 + bomb.radius + 2;
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

  // Ready click handler
  const handlePlayerReady = useCallback(
    (player: 'p1' | 'p2') => {
      SoundEngine.playButtonClick();
      Haptics.buttonClick();

      if (player === 'p1') {
        setP1Ready(true);
        if (isBotMode || p2Ready) {
          triggerCountdown();
        }
      } else {
        setP2Ready(true);
        if (p1Ready) {
          triggerCountdown();
        }
      }
    },
    [isBotMode, p1Ready, p2Ready, triggerCountdown]
  );

  // Screen click handler during ready phase
  const handleArenaScreenTap = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).closest('button')) return;

      if (gamePhase === 'ready') {
        if (isBotMode) {
          setP1Ready(true);
          triggerCountdown();
          return;
        }

        if (p1Ready || p2Ready) {
          setP1Ready(true);
          setP2Ready(true);
          triggerCountdown();
        } else {
          if (!containerRef.current) return;
          const rect = containerRef.current.getBoundingClientRect();
          const touchY = e.clientY - rect.top;
          if (touchY < rect.height / 2) {
            handlePlayerReady('p2');
          } else {
            handlePlayerReady('p1');
          }
        }
      }
    },
    [gamePhase, isBotMode, p1Ready, p2Ready, triggerCountdown, handlePlayerReady]
  );

  // Launch Bomb from the serving bar towards opponent
  const launchBombFromPaddle = useCallback(() => {
    const bomb = bombRef.current;
    syncBombToPaddle();

    const speed = bomb.baseSpeed;
    const angle = (Math.random() * 0.35 - 0.175) * Math.PI;
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
    setScreenShake(20);
    SoundEngine.playBombExplosion();
    Haptics.heavy();

    explosionsRef.current.push({
      x,
      y,
      side,
      radius: 10,
      maxRadius: Math.max(arenaRef.current.width * 0.9, 320),
      alpha: 1,
    });

    const colors = ['#ff0055', '#ff5500', '#ffaa00', '#ffff00', '#ff00aa', '#ffffff', '#00f3ff'];
    for (let i = 0; i < 55; i++) {
      const angle = side === 'top'
        ? Math.PI * 0.15 + Math.random() * Math.PI * 0.7
        : -Math.PI * 0.85 + Math.random() * Math.PI * 0.7;
      const vel = 3 + Math.random() * 14;
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
              setP1Ready(false);
              setP2Ready(false);
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
              setP1Ready(false);
              setP2Ready(false);
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
    setP1Ready(false);
    setP2Ready(false);
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
    setP1Ready(false);
    setP2Ready(false);
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

  // Screen shake decay
  useEffect(() => {
    if (screenShake > 0) {
      const interval = setInterval(() => {
        setScreenShake((s) => Math.max(0, s - 2.5));
      }, 30);
      return () => clearInterval(interval);
    }
  }, [screenShake]);

  // Keyboard navigation for desktop testing
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

  // Multi-Touch Pointer Tracking
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

  // Main 60FPS Game Loop
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min(32, time - lastTime);
      lastTime = time;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { width, height } = arenaRef.current;
      ctx.clearRect(0, 0, width, height);

      const p1 = p1PaddleRef.current;
      const p2 = p2PaddleRef.current;

      // Smooth Paddle Movement
      p1.x += (p1.targetX - p1.x) * 0.35;
      p1.glow = Math.max(0, p1.glow - 0.05);

      if (isBotMode) {
        const bot = p2PaddleRef.current;
        const bomb = bombRef.current;
        let botSpeedFactor = 0.11;
        if (botDifficulty === 'easy') botSpeedFactor = 0.065;
        if (botDifficulty === 'hard') botSpeedFactor = 0.18;

        let predictedX = bomb.x;
        if (bomb.vy < 0) {
          const variance = botDifficulty === 'easy' ? Math.sin(time * 0.003) * 35 : 0;
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
        p2PaddleRef.current.x += (p2PaddleRef.current.targetX - p2PaddleRef.current.x) * 0.35;
      }
      p2PaddleRef.current.glow = Math.max(0, p2PaddleRef.current.glow - 0.05);

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
        const p1 = p1PaddleRef.current;
        const p1Top = p1.y - p1.height / 2;
        const p1Bottom = p1.y + p1.height / 2;
        const p1Left = p1.x - p1.width / 2;
        const p1Right = p1.x + p1.width / 2;

        if (
          bomb.vy > 0 &&
          bomb.y + bomb.radius >= p1Top &&
          bomb.y - bomb.radius <= p1Bottom &&
          bomb.x >= p1Left - 12 &&
          bomb.x <= p1Right + 12
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
        const p2 = p2PaddleRef.current;
        const p2Top = p2.y - p2.height / 2;
        const p2Bottom = p2.y + p2.height / 2;
        const p2Left = p2.x - p2.width / 2;
        const p2Right = p2.x + p2.width / 2;

        if (
          bomb.vy < 0 &&
          bomb.y - bomb.radius <= p2Bottom &&
          bomb.y + bomb.radius >= p2Top &&
          bomb.x >= p2Left - 12 &&
          bomb.x <= p2Right + 12
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
        if (bomb.y - bomb.radius > p1.y + p1.height / 2 + 15) {
          handleMissedBomb('bottom');
        } else if (bomb.y + bomb.radius < p2.y - p2.height / 2 - 15) {
          handleMissedBomb('top');
        }
      }

      // 1. Center Court Net Divider Line Only
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(10, height / 2);
      ctx.lineTo(width - 10, height / 2);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 42, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // 2. Sliding Track Guides
      ctx.save();
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.14)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(20, p1PaddleRef.current.y);
      ctx.lineTo(width - 20, p1PaddleRef.current.y);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(236, 72, 153, 0.14)';
      ctx.beginPath();
      ctx.moveTo(20, p2PaddleRef.current.y);
      ctx.lineTo(width - 20, p2PaddleRef.current.y);
      ctx.stroke();
      ctx.restore();

      // 3. Render Player 1 Paddle (Bottom - Neon Cyan)
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

      // 4. Render Player 2 Paddle (Top - Neon Pink)
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

      // 5. Explosions
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

      // 6. Particles
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

      // 7. Bomb
      if (bomb.active || gamePhase === 'ready' || gamePhase === 'countdown') {
        ctx.save();
        ctx.translate(bomb.x, bomb.y);
        ctx.rotate(bomb.rotation);
        ctx.scale(bomb.pulse, bomb.pulse);

        if (bombImageRef.current && bombImageRef.current.complete) {
          const drawSize = bomb.radius * 2.4;
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

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [gamePhase, isBotMode, botDifficulty, handleMissedBomb, syncBombToPaddle]);

  // =========================================================================
  // VIEW 1: MODE SELECTION SCREEN (Duel vs Bot) - 100% Fill Screen
  // =========================================================================
  if (gamePhase === 'mode_select') {
    return (
      <div className="relative w-full h-full flex-1 bg-slate-950 select-none overflow-hidden flex flex-col justify-between p-6 sm:p-10">
        {/* Glow Ambiance */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-300 to-cyan-400">
              BOMB PONG
            </h1>
            <p className="text-xs font-bold text-slate-400 tracking-widest uppercase mt-1">
              CHOOSE BATTLE MODE
            </p>
          </div>
        </div>

        {/* Mode Cards */}
        <div className="relative z-10 max-w-md mx-auto w-full space-y-5 my-auto">
          {/* Card 1: 2P LOCAL DUEL */}
          <div
            onClick={() => handleStartDuel(false)}
            className="group relative cursor-pointer p-6 rounded-3xl bg-gradient-to-br from-pink-950/40 via-purple-950/30 to-slate-900/60 border border-pink-500/40 hover:border-pink-400 hover:shadow-[0_0_25px_rgba(236,72,153,0.35)] active:scale-[0.98] transition-all overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-600 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(236,72,153,0.6)]">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-white tracking-wide">
                      2-PLAYER DUEL
                    </h3>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-pink-500/25 text-pink-300 border border-pink-500/40">
                      PVP
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-snug">
                    Head-to-head tabletop ping pong on shared screen.
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-pink-400 group-hover:translate-x-1 transition-transform shrink-0" />
            </div>
          </div>

          {/* Card 2: VS CYBER BOT */}
          <div
            onClick={() => handleStartDuel(true)}
            className="group relative cursor-pointer p-6 rounded-3xl bg-gradient-to-br from-cyan-950/40 via-blue-950/30 to-slate-900/60 border border-cyan-500/40 hover:border-cyan-400 hover:shadow-[0_0_25px_rgba(6,182,212,0.35)] active:scale-[0.98] transition-all overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.6)]">
                  <Bot className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-white tracking-wide">
                      VS CYBER BOT
                    </h3>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-500/25 text-cyan-300 border border-cyan-500/40">
                      SOLO AI
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-snug">
                    Battle autonomous AI paddle reflexes.
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-cyan-400 group-hover:translate-x-1 transition-transform shrink-0" />
            </div>

            {/* Difficulty Tabs */}
            <div
              className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between"
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

        <div className="relative z-10 text-center text-xs text-slate-500">
          Equipped bomb skin syncs from your Store collection
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: ARENA COURT - 100% Fill Screen
  // =========================================================================
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
      className="relative w-full h-full flex-1 bg-slate-950 select-none overflow-hidden touch-none flex flex-col justify-between"
    >
      {/* Detonation Screen Flash Overlays */}
      {detonatedSide === 'bottom' && (
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-red-600/60 via-orange-500/25 to-transparent pointer-events-none z-20 animate-pulse" />
      )}
      {detonatedSide === 'top' && (
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-red-600/60 via-pink-500/25 to-transparent pointer-events-none z-20 animate-pulse" />
      )}

      {/* Cyber Grid Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-10 pointer-events-none" />

      {/* Laser Border Lights */}
      <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 shadow-[0_0_12px_rgba(236,72,153,0.8)] z-20" />
      <div className="absolute bottom-0 inset-x-0 h-1.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.8)] z-20" />
      <div className="absolute left-0 inset-y-0 w-1 bg-gradient-to-b from-pink-500 via-purple-400 to-cyan-500 shadow-[0_0_10px_rgba(168,85,247,0.7)] z-20" />
      <div className="absolute right-0 inset-y-0 w-1 bg-gradient-to-b from-pink-500 via-purple-400 to-cyan-500 shadow-[0_0_10px_rgba(168,85,247,0.7)] z-20" />

      {/* Ready / Serve Overlay */}
      {gamePhase === 'ready' && (
        <div className="absolute inset-0 z-30 flex flex-col justify-between p-6 pointer-events-none">
          <div
            className={`flex items-center justify-between transition-transform duration-300 ${
              invertTopView ? 'rotate-180' : ''
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-pink-400 uppercase">
                {isBotMode ? 'CYBER BOT' : 'PLAYER 2'}
              </span>
              <div className="flex gap-1">
                {[1, 2, 3].map((h) => (
                  <Heart
                    key={h}
                    className={`w-4 h-4 ${
                      h <= player2Lives ? 'fill-pink-500 text-pink-500' : 'fill-slate-800 text-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            {!isBotMode && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlayerReady('p2');
                }}
                className={`pointer-events-auto px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider border transition-all active:scale-95 ${
                  p2Ready
                    ? 'bg-pink-500 text-white border-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.7)]'
                    : 'bg-pink-950/80 text-pink-300 border-pink-500/50 hover:bg-pink-900/80 shadow'
                }`}
              >
                {p2Ready ? 'P2 READY ✓' : 'TAP READY'}
              </button>
            )}
          </div>

          <div className="my-auto flex flex-col items-center text-center">
            <div className="bg-slate-900/90 border border-slate-700/80 backdrop-blur-md px-6 py-4 rounded-3xl shadow-2xl flex flex-col items-center">
              {p1Ready || p2Ready ? (
                <div className="text-sm font-black text-cyan-300 animate-pulse">
                  TAP ANYWHERE ON SCREEN TO START
                </div>
              ) : (
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  TAP READY OR TAP ANYWHERE TO START
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-cyan-400 uppercase">
                {isBotMode ? 'YOU (P1)' : 'PLAYER 1'}
              </span>
              <div className="flex gap-1">
                {[1, 2, 3].map((h) => (
                  <Heart
                    key={h}
                    className={`w-4 h-4 ${
                      h <= player1Lives ? 'fill-cyan-400 text-cyan-400' : 'fill-slate-800 text-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePlayerReady('p1');
              }}
              className={`pointer-events-auto px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider border transition-all active:scale-95 ${
                p1Ready
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.7)]'
                  : 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50 hover:bg-cyan-900/80 shadow'
              }`}
            >
              {p1Ready ? 'P1 READY ✓' : 'TAP READY'}
            </button>
          </div>
        </div>
      )}

      {/* Countdown */}
      {gamePhase === 'countdown' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center animate-in zoom-in-75 duration-200">
            <div className="text-7xl font-black text-amber-400 drop-shadow-[0_0_25px_rgba(245,158,11,0.9)]">
              {serveCountdown > 0 ? serveCountdown : 'BOUNCE!'}
            </div>
          </div>
        </div>
      )}

      {/* Detonated Banner */}
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

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { X, Sparkles, Check, Move, RefreshCw } from 'lucide-react';
import { StoreItem, TRAIL_PARTICLE_FILES, TRAIL_PARTICLE_DETAILS, TRAIL_WEBP_PARTICLE_SPRITES } from '../lib/economy';
import currencyStarImg from '../assets/images/Currency Star Sprite.webp';
import kaboomBombImg from '../assets/images/bombs/Bomb Sprite.webp';
import { SoundEngine, Haptics } from '../lib/audio';

// High-performance offscreen canvas glow cache with tight optical radius (smaller glow)
const glowCanvasCache = new Map<string, HTMLCanvasElement>();
function getCachedGlowCanvas(color: string): HTMLCanvasElement {
  let cached = glowCanvasCache.get(color);
  if (!cached) {
    cached = document.createElement('canvas');
    cached.width = 40;
    cached.height = 40;
    const gctx = cached.getContext('2d');
    if (gctx) {
      const grad = gctx.createRadialGradient(20, 20, 0, 20, 20, 20);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.2, color);
      grad.addColorStop(0.5, color);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      gctx.fillStyle = grad;
      gctx.beginPath();
      gctx.arc(20, 20, 20, 0, Math.PI * 2);
      gctx.fill();
    }
    glowCanvasCache.set(color, cached);
  }
  return cached;
}

interface TrailSimulationModalProps {
  isOpen: boolean;
  item: StoreItem | null;
  isUnlocked: boolean;
  isEquipped: boolean;
  canAfford: boolean;
  stars: number;
  onClose: () => void;
  onEquip: (item: StoreItem) => void;
  onPurchase: (item: StoreItem) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  glowColor?: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  rotation: number;
  rotSpeed: number;
  type: 'webp_sprite' | 'glow_light' | 'spark';
  spriteIndex: number;
}

interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

const PARTICLE_COLOR_PALETTES: Record<string, string[]> = {
  particle_classic_blaze: ['#ff9900', '#ff5500', '#ffcc00', '#ff2200', '#fff3a1'],
  particle_neon_trail: ['#00f3ff', '#ec4899', '#a855f7', '#06b6d4', '#ffffff'],
  particle_music_notes: ['#ec4899', '#06b6d4', '#eab308', '#a855f7', '#38bdf8'],
  particle_star_spark: ['#ffd700', '#ffffff', '#f59e0b', '#fef08a', '#38bdf8'],
  particle_galaxy_trail: ['#c084fc', '#818cf8', '#06b6d4', '#f472b6', '#e0e7ff'],
  particle_sakura: ['#f472b6', '#fb7185', '#fbcfe8', '#fef08a', '#ffffff'],
  particle_electric_shock: ['#00f3ff', '#60a5fa', '#ffffff', '#3b82f6', '#93c5fd'],
  particle_blizzard_ice: ['#e0f2fe', '#38bdf8', '#ffffff', '#93c5fd', '#67e8f9'],
  particle_nature_leaves: ['#22c55e', '#4ade80', '#facc15', '#10b981', '#a7f3d0'],
};

const PARTICLE_CORE_COLORS: Record<string, [string, string, string]> = {
  particle_classic_blaze: ['rgba(255, 255, 220, 0.95)', 'rgba(255, 180, 0, 0.75)', 'rgba(255, 60, 0, 0.35)'],
  particle_neon_trail: ['rgba(255, 255, 255, 0.95)', 'rgba(6, 182, 212, 0.85)', 'rgba(236, 72, 153, 0.45)'],
  particle_music_notes: ['rgba(255, 255, 255, 0.95)', 'rgba(168, 85, 247, 0.85)', 'rgba(236, 72, 153, 0.45)'],
  particle_star_spark: ['rgba(255, 255, 255, 0.98)', 'rgba(251, 191, 36, 0.85)', 'rgba(245, 158, 11, 0.4)'],
  particle_galaxy_trail: ['rgba(255, 255, 255, 0.95)', 'rgba(129, 140, 248, 0.85)', 'rgba(192, 132, 252, 0.4)'],
  particle_sakura: ['rgba(255, 255, 255, 0.95)', 'rgba(244, 114, 182, 0.85)', 'rgba(251, 113, 133, 0.4)'],
  particle_electric_shock: ['rgba(255, 255, 255, 0.98)', 'rgba(34, 211, 238, 0.9)', 'rgba(59, 130, 246, 0.45)'],
  particle_blizzard_ice: ['rgba(255, 255, 255, 0.98)', 'rgba(56, 189, 248, 0.85)', 'rgba(147, 197, 253, 0.4)'],
  particle_nature_leaves: ['rgba(255, 255, 240, 0.95)', 'rgba(52, 211, 153, 0.85)', 'rgba(34, 197, 94, 0.4)'],
};

export const TrailSimulationModal: React.FC<TrailSimulationModalProps> = ({
  isOpen,
  item,
  isUnlocked,
  isEquipped,
  canAfford,
  stars,
  onClose,
  onEquip,
  onPurchase,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Simulation speed multiplier
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.2);
  const speedMultiplierRef = useRef<number>(speedMultiplier);

  useEffect(() => {
    speedMultiplierRef.current = speedMultiplier;
  }, [speedMultiplier]);

  // Preloaded 2 .webp particle images
  const webpImagesRef = useRef<HTMLImageElement[]>([]);
  const bombImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!isOpen || !item) return;

    // Load bomb image
    const bImg = new Image();
    bImg.src = kaboomBombImg;
    bombImageRef.current = bImg;

    // Load the 2 independent .webp particle sprites for this specific trail item
    const files =
      item.spriteImages && item.spriteImages.length >= 2
        ? item.spriteImages
        : TRAIL_PARTICLE_FILES[item.id] || TRAIL_WEBP_PARTICLE_SPRITES;

    const loadedWebp: HTMLImageElement[] = [];
    files.slice(0, 2).forEach((src, idx) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        loadedWebp[idx] = img;
      };
      loadedWebp[idx] = img;
    });
    webpImagesRef.current = loadedWebp;
  }, [isOpen, item]);

  useEffect(() => {
    if (!isOpen || !item) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 360);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 280);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    // Ball state
    const ball = {
      x: width / 2,
      y: height / 2,
      vx: 4.5 * speedMultiplierRef.current,
      vy: 3.2 * speedMultiplierRef.current,
      radius: 15,
      rotation: 0,
      targetX: width / 2,
      targetY: height / 2,
      isDragged: false,
    };

    const particles: Particle[] = [];
    const shockwaves: Shockwave[] = [];
    const palette = PARTICLE_COLOR_PALETTES[item.id] || PARTICLE_COLOR_PALETTES.particle_classic_blaze;
    const coreColors = PARTICLE_CORE_COLORS[item.id] || PARTICLE_CORE_COLORS.particle_classic_blaze;

    const spawnSparks = (x: number, y: number, count: number, baseAngle: number) => {
      for (let i = 0; i < count; i++) {
        const angle = baseAngle + (Math.random() - 0.5) * Math.PI * 1.2;
        const spd = 2 + Math.random() * 4.5;
        const roll = Math.random();
        const pType: Particle['type'] = roll < 0.45 ? 'webp_sprite' : roll < 0.82 ? 'glow_light' : 'spark';
        const themeColor = palette[Math.floor(Math.random() * palette.length)];
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          color: themeColor,
          size: pType === 'webp_sprite' ? 9 + Math.random() * 8 : pType === 'glow_light' ? 7 + Math.random() * 7 : 1.8 + Math.random() * 2.2,
          alpha: 1,
          life: 0,
          maxLife: 16 + Math.random() * 10,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.25,
          type: pType,
          spriteIndex: Math.floor(Math.random() * 2),
        });
      }
    };

    // Canvas Pointer events
    const updatePointer = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const px = clientX - rect.left;
      const py = clientY - rect.top;
      ball.targetX = Math.max(ball.radius + 6, Math.min(width - ball.radius - 6, px));
      ball.targetY = Math.max(ball.radius + 6, Math.min(height - ball.radius - 6, py));
    };

    const onPointerDown = (e: PointerEvent) => {
      ball.isDragged = true;
      updatePointer(e.clientX, e.clientY);
      SoundEngine.playPaddleHit(1.1);
      Haptics.light();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (ball.isDragged) {
        updatePointer(e.clientX, e.clientY);
      }
    };

    const onPointerUp = () => {
      if (ball.isDragged) {
        ball.isDragged = false;
        const currentSpeed = speedMultiplierRef.current;
        const dx = ball.targetX - ball.x;
        const dy = ball.targetY - ball.y;
        ball.vx = Math.max(-7, Math.min(7, (dx || (Math.random() - 0.5) * 5) * 0.35 * currentSpeed));
        ball.vy = Math.max(-7, Math.min(7, (dy || (Math.random() - 0.5) * 5) * 0.35 * currentSpeed));
        if (Math.abs(ball.vx) < 1.5) ball.vx = 3.8 * (Math.random() > 0.5 ? 1 : -1);
        if (Math.abs(ball.vy) < 1.5) ball.vy = 3.2 * (Math.random() > 0.5 ? 1 : -1);
      }
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // Optimized 60FPS Animation Loop
    const render = () => {
      // 1. Clear with dark arena background (direct fast clear)
      ctx.fillStyle = '#06030c';
      ctx.fillRect(0, 0, width, height);

      // 2. Arena boundary border (fast single rect)
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(6, 6, width - 12, height - 12);

      // 3. Ball Physics & Movement
      if (ball.isDragged) {
        const lerpSpeed = 0.32;
        const oldX = ball.x;
        const oldY = ball.y;
        ball.x += (ball.targetX - ball.x) * lerpSpeed;
        ball.y += (ball.targetY - ball.y) * lerpSpeed;
        ball.vx = (ball.x - oldX) * 0.85;
        ball.vy = (ball.y - oldY) * 0.85;
      } else {
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Wall collisions
        const minX = ball.radius + 8;
        const maxX = width - ball.radius - 8;
        const minY = ball.radius + 8;
        const maxY = height - ball.radius - 8;

        if (ball.x <= minX) {
          ball.x = minX;
          ball.vx = Math.abs(ball.vx);
          spawnSparks(ball.x, ball.y, 6, 0);
          shockwaves.push({ x: ball.x, y: ball.y, radius: 4, maxRadius: 28, alpha: 0.85, color: palette[0] });
          Haptics.light();
        } else if (ball.x >= maxX) {
          ball.x = maxX;
          ball.vx = -Math.abs(ball.vx);
          spawnSparks(ball.x, ball.y, 6, Math.PI);
          shockwaves.push({ x: ball.x, y: ball.y, radius: 4, maxRadius: 28, alpha: 0.85, color: palette[0] });
          Haptics.light();
        }

        if (ball.y <= minY) {
          ball.y = minY;
          ball.vy = Math.abs(ball.vy);
          spawnSparks(ball.x, ball.y, 6, Math.PI / 2);
          shockwaves.push({ x: ball.x, y: ball.y, radius: 4, maxRadius: 28, alpha: 0.85, color: palette[1] || palette[0] });
          Haptics.light();
        } else if (ball.y >= maxY) {
          ball.y = maxY;
          ball.vy = -Math.abs(ball.vy);
          spawnSparks(ball.x, ball.y, 6, -Math.PI / 2);
          shockwaves.push({ x: ball.x, y: ball.y, radius: 4, maxRadius: 28, alpha: 0.85, color: palette[1] || palette[0] });
          Haptics.light();
        }
      }

      ball.rotation += 0.04 + Math.hypot(ball.vx, ball.vy) * 0.015;

      // 4. Spawn Trail Particles Behind Ball (smaller, tighter glow)
      const speed = Math.hypot(ball.vx, ball.vy);
      if (particles.length < 24) {
        const spawnCount = speed > 3.8 ? 2 : 1;
        for (let s = 0; s < spawnCount; s++) {
          const sparkAngle = ball.rotation + Math.PI + (Math.random() - 0.5) * 1.1;
          const sparkSpeed = 0.8 + Math.random() * 2.2;
          const trailVx = -ball.vx * 0.2;
          const trailVy = -ball.vy * 0.2;
          const roll = Math.random();
          const pType: Particle['type'] = roll < 0.45 ? 'webp_sprite' : roll < 0.82 ? 'glow_light' : 'spark';
          const themeColor = palette[Math.floor(Math.random() * palette.length)];

          particles.push({
            x: ball.x + (Math.random() - 0.5) * 3,
            y: ball.y + (Math.random() - 0.5) * 3,
            vx: Math.cos(sparkAngle) * sparkSpeed + trailVx,
            vy: Math.sin(sparkAngle) * sparkSpeed + trailVy,
            color: themeColor,
            size: pType === 'webp_sprite' ? 9 + Math.random() * 8 : pType === 'glow_light' ? 7 + Math.random() * 7 : 1.8 + Math.random() * 2.2,
            alpha: 1,
            life: 0,
            maxLife: pType === 'webp_sprite' ? 18 + Math.random() * 10 : pType === 'glow_light' ? 14 + Math.random() * 8 : 8 + Math.random() * 6,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.25,
            type: pType,
            spriteIndex: Math.floor(Math.random() * 2),
          });
        }
      }

      // 5. Render Shockwaves
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i];
        sw.radius += 2.0;
        sw.alpha = Math.max(0, 1 - sw.radius / sw.maxRadius);

        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = sw.color;
        ctx.globalAlpha = sw.alpha * 0.75;
        ctx.lineWidth = 2 * sw.alpha;
        ctx.stroke();

        if (sw.radius >= sw.maxRadius) {
          shockwaves.splice(i, 1);
        }
      }

      // 6. Hardware-Accelerated Particle Render Loop with Screen Blending
      ctx.globalCompositeOperation = 'screen';
      const webpImages = webpImagesRef.current;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.rotation += p.rotSpeed;
        p.life += 1;
        const progress = p.life / p.maxLife;
        p.alpha = Math.max(0, Math.pow(1 - progress, 1.4));

        if (p.type === 'webp_sprite') {
          const targetImg = webpImages.length > 0 ? webpImages[p.spriteIndex % webpImages.length] : null;
          if (targetImg && targetImg.complete) {
            const curSize = p.size * (1 - progress * 0.28);
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.globalAlpha = p.alpha * 0.95;
            // Draw tighter optical glow behind sprite
            const glowCanvas = getCachedGlowCanvas(p.color);
            ctx.drawImage(glowCanvas, -curSize * 0.5, -curSize * 0.5, curSize, curSize);
            ctx.drawImage(targetImg, -curSize / 2, -curSize / 2, curSize, curSize);
            ctx.restore();
          }
        } else if (p.type === 'glow_light') {
          // CSS Glow Light: Tighter hardware-accelerated radial aura
          const curSize = Math.max(1, p.size * (1 - progress * 0.3));
          ctx.globalAlpha = p.alpha * 0.88;
          const glowCanvas = getCachedGlowCanvas(p.color);
          ctx.drawImage(glowCanvas, p.x - curSize * 0.75, p.y - curSize * 0.75, curSize * 1.5, curSize * 1.5);
        } else {
          // Glowing Sparks with screen blending
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(0.6, p.size * (1 - progress)), 0, Math.PI * 2);
          ctx.fill();
        }

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
        }
      }

      // 7. Render Bomb Orb with Tight Core Glow
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1.0;

      // Ambient core glow under orb
      const coreGrad = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, ball.radius * 1.4);
      coreGrad.addColorStop(0, coreColors[0]);
      coreGrad.addColorStop(0.4, coreColors[1]);
      coreGrad.addColorStop(0.8, coreColors[2]);
      coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius * 1.4, 0, Math.PI * 2);
      ctx.fill();

      // Bomb Graphic
      ctx.save();
      ctx.translate(ball.x, ball.y);
      ctx.rotate(ball.rotation);
      if (bombImageRef.current && bombImageRef.current.complete) {
        const drawSize = ball.radius * 2.2;
        ctx.drawImage(bombImageRef.current, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
      } else {
        ctx.fillStyle = '#6366f1';
        ctx.beginPath();
        ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const palette = PARTICLE_COLOR_PALETTES[item.id] || PARTICLE_COLOR_PALETTES.particle_classic_blaze;

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-[28px] bg-gradient-to-b from-[#190f30]/95 via-[#0d071a]/98 to-black/95 border-2 border-purple-500/50 shadow-[0_0_60px_rgba(168,85,247,0.4)] overflow-hidden text-white flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="relative px-5 pt-4 pb-3 border-b border-purple-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-2xl bg-gradient-to-tr ${item.accentGradient} flex items-center justify-center shadow-[0_0_15px_rgba(236,72,153,0.5)] border border-pink-300/60`}>
              <Sparkles className="w-5 h-5 text-white animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-header text-lg sm:text-xl font-bold tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-pink-300 to-purple-300 leading-tight">
                  {item.name}
                </h3>
                <span className={`text-[8.5px] font-header font-bold uppercase px-2 py-0.5 rounded-full border ${
                  item.rarity === 'Legendary'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400/50'
                    : item.rarity === 'Epic'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-400/50'
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50'
                }`}>
                  {item.rarity}
                </span>
              </div>
              <div className="text-[11px] text-purple-200/70 font-body">
                Live Interactive FX Simulator • Screen Blend Mode
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              SoundEngine.playButtonClick();
              Haptics.buttonClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-gray-300 hover:text-white transition-all active:scale-95 cursor-pointer"
            aria-label="Close Preview"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Simulation Arena Canvas */}
        <div className="relative w-full h-64 sm:h-72 bg-black overflow-hidden flex items-center justify-center cursor-crosshair">
          <canvas ref={canvasRef} className="w-full h-full block touch-none" />

          {/* Interactive Hint Overlay */}
          <div className="absolute top-2.5 left-3 pointer-events-none flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[10px] font-header font-semibold text-purple-200 shadow-lg">
            <Move className="w-3 h-3 text-cyan-300 animate-pulse" />
            <span>Drag anywhere to steer trail</span>
          </div>

          {/* Speed Toggle Pill */}
          <div className="absolute top-2.5 right-3 flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                SoundEngine.playButtonClick();
                Haptics.buttonClick();
                setSpeedMultiplier((prev) => (prev >= 1.8 ? 0.9 : prev + 0.45));
              }}
              className="px-2.5 py-1 rounded-full bg-purple-900/60 hover:bg-purple-800/70 border border-purple-400/40 text-[10px] font-header font-bold text-purple-200 backdrop-blur-md shadow-sm active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-2.5 h-2.5 text-pink-300" />
              <span>Speed: {speedMultiplier.toFixed(1)}x</span>
            </button>
          </div>
        </div>

        {/* 2 Dedicated Independent .webp Sprites & Theme Glow Light Swatches */}
        {(() => {
          const details = TRAIL_PARTICLE_DETAILS[item.id] || {
            sprites: (item.spriteImages && item.spriteImages.length >= 2
              ? item.spriteImages
              : TRAIL_PARTICLE_FILES[item.id] || TRAIL_WEBP_PARTICLE_SPRITES) as [string, string],
            names: ['Particle Sprite 1', 'Particle Sprite 2'] as [string, string],
            descriptions: ['Screen blend .webp', 'Screen blend .webp'] as [string, string],
            palette: palette,
          };
          const sprite1 = item.spriteImages?.[0] || details.sprites[0];
          const sprite2 = item.spriteImages?.[1] || details.sprites[1];

          return (
            <div className="px-4 py-3 bg-neutral-950/80 border-t border-purple-500/20">
              <div className="text-[10px] font-header font-bold uppercase tracking-wider text-purple-300/80 mb-2 flex items-center justify-between">
                <span>Trail Particle Sprites</span>
                <span className="text-[9px] text-gray-400">2 Independent .webp Files</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                {/* Sprite 1 */}
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-purple-950/50 border border-purple-400/40 shrink-0 shadow-sm">
                  <img
                    src={sprite1}
                    alt={details.names[0]}
                    className="w-5 h-5 object-contain filter drop-shadow-[0_0_8px_rgba(255,255,255,0.95)]"
                  />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-white font-header">{details.names[0]}</span>
                    <span className="text-[7.5px] text-purple-300 uppercase">particle_1.webp</span>
                  </div>
                </div>

                {/* Sprite 2 */}
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-purple-950/50 border border-purple-400/40 shrink-0 shadow-sm">
                  <img
                    src={sprite2}
                    alt={details.names[1]}
                    className="w-5 h-5 object-contain filter drop-shadow-[0_0_8px_rgba(255,255,255,0.95)]"
                  />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-white font-header">{details.names[1]}</span>
                    <span className="text-[7.5px] text-purple-300 uppercase">particle_2.webp</span>
                  </div>
                </div>

                {/* Theme CSS Glow Light Palette Swatches */}
                <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-black/60 border border-white/15 shrink-0">
                  <span className="text-[8px] font-bold text-gray-300 font-header uppercase mr-1">Theme Glow</span>
                  {palette.slice(0, 4).map((c, i) => (
                    <span
                      key={i}
                      className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-sm"
                      style={{ backgroundColor: c, boxShadow: `0 0 6px ${c}` }}
                    />
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-gray-400 mt-2 font-body line-clamp-2">
                {item.description}
              </p>
            </div>
          );
        })()}

        {/* Bottom Action Footer */}
        <div className="p-4 bg-neutral-900/90 border-t border-purple-500/20 flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] font-body text-gray-400 uppercase tracking-wide">Status</span>
            <div className="flex items-center gap-1 text-sm font-header font-bold">
              {isEquipped ? (
                <span className="text-cyan-400 flex items-center gap-1">
                  <Check className="w-4 h-4" /> EQUIPPED
                </span>
              ) : isUnlocked ? (
                <span className="text-purple-300">UNLOCKED</span>
              ) : item.price === 0 ? (
                <span className="text-cyan-300">FREE</span>
              ) : (
                <div className="flex items-center gap-1 text-amber-300">
                  <img src={currencyStarImg} alt="Stars" className="w-4 h-4 object-contain" />
                  <span>{item.price.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEquipped ? (
              <button
                type="button"
                disabled
                className="px-5 py-2 rounded-full bg-cyan-950/60 border border-cyan-400/60 text-cyan-300 font-header font-bold text-xs tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-default"
              >
                <Check className="w-3.5 h-3.5" />
                <span>IN USE</span>
              </button>
            ) : isUnlocked ? (
              <button
                type="button"
                onClick={() => {
                  onEquip(item);
                  onClose();
                }}
                className="px-6 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-header font-bold text-xs tracking-wider shadow-[0_0_15px_rgba(236,72,153,0.5)] active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>EQUIP TRAIL</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onPurchase(item);
                }}
                disabled={!canAfford}
                className={`px-5 py-2 rounded-full font-header font-bold text-xs tracking-wider shadow-lg active:scale-95 transition-all flex items-center gap-1.5 ${
                  canAfford
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black hover:brightness-110 shadow-[0_0_15px_rgba(245,158,11,0.5)] cursor-pointer'
                    : 'bg-neutral-800 text-gray-500 border border-white/10 cursor-not-allowed'
                }`}
              >
                <img src={currencyStarImg} alt="Stars" className="w-3.5 h-3.5 object-contain" />
                <span>UNLOCK ({item.price})</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

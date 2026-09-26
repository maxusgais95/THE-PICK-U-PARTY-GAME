/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { X, Sparkles, Check, Move, Play, RefreshCw } from 'lucide-react';
import { StoreItem } from '../lib/economy';
import currencyStarImg from '../assets/images/Currency Star Sprite.webp';
import kaboomBombImg from '../assets/images/bombs/Bomb Sprite.webp';
import { SoundEngine, Haptics } from '../lib/audio';

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
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  rotation: number;
  rotSpeed: number;
  type: 'flame' | 'spark';
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

  // Simulation mode: auto flight vs drag interactive
  const [isInteracting, setIsInteracting] = useState<boolean>(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.2);

  // Preloaded sprite images
  const spriteImagesRef = useRef<HTMLImageElement[]>([]);
  const bombImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!isOpen || !item) return;

    // Load bomb image
    const bImg = new Image();
    bImg.src = kaboomBombImg;
    bombImageRef.current = bImg;

    // Load trail sprite images
    const sprites = item.spriteImages && item.spriteImages.length > 0 ? item.spriteImages : (item.image ? [item.image] : []);
    spriteImagesRef.current = sprites.map((src) => {
      const img = new Image();
      img.src = src;
      return img;
    });
  }, [isOpen, item]);

  useEffect(() => {
    if (!isOpen || !item) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
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
      vx: 4.8 * speedMultiplier,
      vy: 3.5 * speedMultiplier,
      radius: 16,
      rotation: 0,
      targetX: width / 2,
      targetY: height / 2,
      isDragged: false,
    };

    const particles: Particle[] = [];
    const shockwaves: Shockwave[] = [];
    const palette = PARTICLE_COLOR_PALETTES[item.id] || PARTICLE_COLOR_PALETTES.particle_classic_blaze;
    const coreColors = PARTICLE_CORE_COLORS[item.id] || PARTICLE_CORE_COLORS.particle_classic_blaze;

    let lastTime = performance.now();

    const spawnSparks = (x: number, y: number, count: number, baseAngle: number) => {
      for (let i = 0; i < count; i++) {
        const angle = baseAngle + (Math.random() - 0.5) * Math.PI * 1.2;
        const spd = 2 + Math.random() * 6;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          color: palette[Math.floor(Math.random() * palette.length)],
          size: 10 + Math.random() * 16,
          alpha: 1,
          life: 0,
          maxLife: 20 + Math.random() * 18,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.3,
          type: 'flame',
          spriteIndex: spriteImagesRef.current.length > 0 ? Math.floor(Math.random() * spriteImagesRef.current.length) : 0,
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
      setIsInteracting(true);
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
        // Launch ball with some flick velocity
        const dx = ball.targetX - ball.x;
        const dy = ball.targetY - ball.y;
        ball.vx = Math.max(-8, Math.min(8, (dx || (Math.random() - 0.5) * 6) * 0.4 * speedMultiplier));
        ball.vy = Math.max(-8, Math.min(8, (dy || (Math.random() - 0.5) * 6) * 0.4 * speedMultiplier));
        if (Math.abs(ball.vx) < 1.5) ball.vx = 4 * (Math.random() > 0.5 ? 1 : -1);
        if (Math.abs(ball.vy) < 1.5) ball.vy = 3.5 * (Math.random() > 0.5 ? 1 : -1);
      }
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // Animation Loop
    const render = (time: number) => {
      const dt = Math.min(32, time - lastTime);
      lastTime = time;

      // Clear with dark arena background
      ctx.fillStyle = '#06030c';
      ctx.fillRect(0, 0, width, height);

      // Cyber court grid pattern
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      const step = 28;
      for (let x = step; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = step; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Arena boundary glow border
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.35)';
      ctx.lineWidth = 2;
      ctx.strokeRect(6, 6, width - 12, height - 12);
      ctx.restore();

      // Ball Physics
      if (ball.isDragged) {
        // Smoothly lerp ball to pointer
        const lerpSpeed = 0.3;
        const oldX = ball.x;
        const oldY = ball.y;
        ball.x += (ball.targetX - ball.x) * lerpSpeed;
        ball.y += (ball.targetY - ball.y) * lerpSpeed;
        ball.vx = (ball.x - oldX) * 0.9;
        ball.vy = (ball.y - oldY) * 0.9;
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
          spawnSparks(ball.x, ball.y, 8, 0);
          shockwaves.push({ x: ball.x, y: ball.y, radius: 4, maxRadius: 36, alpha: 0.9, color: palette[0] });
          Haptics.light();
        } else if (ball.x >= maxX) {
          ball.x = maxX;
          ball.vx = -Math.abs(ball.vx);
          spawnSparks(ball.x, ball.y, 8, Math.PI);
          shockwaves.push({ x: ball.x, y: ball.y, radius: 4, maxRadius: 36, alpha: 0.9, color: palette[0] });
          Haptics.light();
        }

        if (ball.y <= minY) {
          ball.y = minY;
          ball.vy = Math.abs(ball.vy);
          spawnSparks(ball.x, ball.y, 8, Math.PI / 2);
          shockwaves.push({ x: ball.x, y: ball.y, radius: 4, maxRadius: 36, alpha: 0.9, color: palette[1] || palette[0] });
          Haptics.light();
        } else if (ball.y >= maxY) {
          ball.y = maxY;
          ball.vy = -Math.abs(ball.vy);
          spawnSparks(ball.x, ball.y, 8, -Math.PI / 2);
          shockwaves.push({ x: ball.x, y: ball.y, radius: 4, maxRadius: 36, alpha: 0.9, color: palette[1] || palette[0] });
          Haptics.light();
        }
      }

      ball.rotation += 0.05 + Math.hypot(ball.vx, ball.vy) * 0.02;

      // Spawn Trail Particles Behind Ball
      const speed = Math.hypot(ball.vx, ball.vy);
      const spawnCount = speed > 4 ? 3 : 2;
      for (let s = 0; s < spawnCount; s++) {
        const sparkAngle = ball.rotation + Math.PI + (Math.random() - 0.5) * 1.4;
        const sparkSpeed = 1.0 + Math.random() * 3.0;
        const trailVx = -ball.vx * 0.25;
        const trailVy = -ball.vy * 0.25;
        const isFlame = Math.random() < 0.65;

        particles.push({
          x: ball.x + (Math.random() - 0.5) * 6,
          y: ball.y + (Math.random() - 0.5) * 6,
          vx: Math.cos(sparkAngle) * sparkSpeed + trailVx,
          vy: Math.sin(sparkAngle) * sparkSpeed + trailVy,
          color: palette[Math.floor(Math.random() * palette.length)],
          size: isFlame ? 14 + Math.random() * 18 : 3 + Math.random() * 5,
          alpha: 1,
          life: 0,
          maxLife: isFlame ? 22 + Math.random() * 18 : 14 + Math.random() * 12,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.25,
          type: isFlame ? 'flame' : 'spark',
          spriteIndex: spriteImagesRef.current.length > 0 ? Math.floor(Math.random() * spriteImagesRef.current.length) : 0,
        });
      }

      // Render Shockwaves
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i];
        sw.radius += 2.2;
        sw.alpha = Math.max(0, 1 - sw.radius / sw.maxRadius);

        ctx.save();
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = sw.color;
        ctx.globalAlpha = sw.alpha * 0.8;
        ctx.lineWidth = 3 * sw.alpha;
        ctx.stroke();
        ctx.restore();

        if (sw.radius >= sw.maxRadius) {
          shockwaves.splice(i, 1);
        }
      }

      // Render Particles with Additive/Screen Blending
      ctx.save();
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

        const imgs = spriteImagesRef.current;
        const targetImg = imgs.length > 0 && imgs[p.spriteIndex] && imgs[p.spriteIndex].complete ? imgs[p.spriteIndex] : null;

        if (p.type === 'flame' && targetImg) {
          const curSize = p.size * (1 - (p.life / p.maxLife) * 0.3);
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.globalAlpha = p.alpha * 0.95;
          ctx.globalCompositeOperation = 'screen';
          ctx.drawImage(targetImg, -curSize / 2, -curSize / 2, curSize, curSize);
          ctx.restore();
        } else {
          // Glowing Sparks & Embers
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(0.8, p.size * (1 - p.life / p.maxLife)), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
        }
      }
      ctx.restore();

      // Render Bomb Orb with Fuse Core Glow
      ctx.save();
      // Ambient core glow under orb
      const coreGrad = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, ball.radius * 2.2);
      coreGrad.addColorStop(0, coreColors[0]);
      coreGrad.addColorStop(0.4, coreColors[1]);
      coreGrad.addColorStop(0.8, coreColors[2]);
      coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius * 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Bomb Graphic
      ctx.translate(ball.x, ball.y);
      ctx.rotate(ball.rotation);
      if (bombImageRef.current && bombImageRef.current.complete) {
        const drawSize = ball.radius * 2.4;
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
  }, [isOpen, item, speedMultiplier]);

  if (!isOpen || !item) return null;

  const sprites = item.spriteImages && item.spriteImages.length > 0 ? item.spriteImages : (item.image ? [item.image] : []);

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
                Live Interactive FX Simulator
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

        {/* Sprite Showcase Strip */}
        <div className="px-4 py-3 bg-neutral-950/80 border-t border-purple-500/20">
          <div className="text-[10px] font-header font-bold uppercase tracking-wider text-purple-300/80 mb-2 flex items-center justify-between">
            <span>Trail Particle Sprites</span>
            <span className="text-[9px] text-gray-400">{sprites.length} vector elements</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {sprites.map((url, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-950/40 border border-purple-400/30 shrink-0 shadow-sm"
              >
                <img
                  src={url}
                  alt={`Sprite ${idx + 1}`}
                  className="w-5 h-5 object-contain filter drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]"
                />
                <span className="text-[9px] font-bold text-gray-300 font-header">FX #{idx + 1}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-gray-400 mt-2 font-body line-clamp-2">
            {item.description}
          </p>
        </div>

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

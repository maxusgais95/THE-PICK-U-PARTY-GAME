/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppSettings, CustomBottleSprite } from '../types';
import { THEMES } from '../lib/themes';
import { BottlePhysicsController } from '../lib/bottlePhysics';
import { BottleSpriteRenderer } from './BottleSprites';
import { SoundEngine } from '../lib/audio';
import { recordGameEvent } from '../lib/db';
import { recordStarEarringsCondition, addStars } from '../lib/economy';

interface BottleSpinProps {
  settings: AppSettings;
  customSprite: CustomBottleSprite | null;
  onSpinStateChange?: (isSpinning: boolean, angularVelocity: number) => void;
}

export const BottleSpin: React.FC<BottleSpinProps> = ({
  settings,
  customSprite,
  onSpinStateChange,
}) => {
  const currentTheme = THEMES[settings.theme] || THEMES['cyber-neon'];
  const [angle, setAngle] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isResultCooldown, setIsResultCooldown] = useState<boolean>(false);
  const [isPointingBounce, setIsPointingBounce] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const trailCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const physicsRef = useRef<BottlePhysicsController>(
    new BottlePhysicsController(Math.random() * 360, settings.bottleFriction || 0.992)
  );
  const animFrameRef = useRef<number | null>(null);
  const cooldownTimerRef = useRef<number | null>(null);
  const onSpinStateChangeRef = useRef(onSpinStateChange);
  onSpinStateChangeRef.current = onSpinStateChange;
  const themeRef = useRef(currentTheme);
  themeRef.current = currentTheme;

  const lastAngleRef = useRef(0);
  const trailLengthRef = useRef(0);
  const trailDirRef = useRef(1); // 1 = CW, -1 = CCW
  const sparksRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; life: number; color: string }>>([]);

  // Setup tick and settle callbacks
  useEffect(() => {
    const physics = physicsRef.current;
    physics.setFriction(settings.bottleFriction || 0.992);

    physics.onTick = (vel: number) => {
      SoundEngine.playBottleTick(vel);
    };

    physics.onSettle = (_finalAngle: number) => {
      setIsSpinning(false);
      setIsResultCooldown(true);
      setIsPointingBounce(true);
      if (onSpinStateChangeRef.current) {
        onSpinStateChangeRef.current(false, 0);
      }
      SoundEngine.playBottleSettle();
      addStars(10);

      // Trigger landing shockwave
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        window.dispatchEvent(
          new CustomEvent('app-shockwave', {
            detail: { x: cx, y: cy, color: currentTheme.primary, maxRadius: 380 },
          })
        );
      }

      // Delay 1.5s after stopping before allowing next spin
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
      cooldownTimerRef.current = window.setTimeout(() => {
        setIsResultCooldown(false);
      }, 1500);
    };
  }, [settings.bottleFriction, currentTheme.primary]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    };
  }, []);

  // Center coordinate helper
  const getCenterCoords = useCallback(() => {
    if (!containerRef.current) return { cx: window.innerWidth / 2, cy: window.innerHeight / 2, rTip: 250 };
    const rect = containerRef.current.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const bottleDimension = Math.min(rect.width * 0.93, rect.height * 0.88, 762);
    const rTip = (bottleDimension / 2) * 0.84;
    return {
      cx,
      cy,
      rTip,
      screenCx: rect.left + cx,
      screenCy: rect.top + cy,
    };
  }, []);

  // Trail canvas sizing
  useEffect(() => {
    const canvas = trailCanvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Main 60fps animation loop for physics & dynamic bottle tip light trail
  useEffect(() => {
    const loop = () => {
      const physics = physicsRef.current;
      if (physics.isSpinning) {
        physics.updatePhysics();
        setAngle(physics.angle);
        if (onSpinStateChangeRef.current) {
          onSpinStateChangeRef.current(true, physics.angularVelocity);
        }
      }

      // Render bottle tip neon light trail
      const canvas = trailCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const vel = physics.isSpinning ? physics.angularVelocity : (physics.angle - lastAngleRef.current);
          const absVel = Math.abs(vel);
          if (absVel > 0.05) {
            trailDirRef.current = vel >= 0 ? 1 : -1;
          }

          const targetTrail = (physics.isSpinning || absVel > 0.2) ? Math.min(absVel * 2.8, 85) : 0;
          if (targetTrail > trailLengthRef.current) {
            trailLengthRef.current += (targetTrail - trailLengthRef.current) * 0.35;
          } else {
            trailLengthRef.current *= 0.88;
            if (trailLengthRef.current < 0.1) trailLengthRef.current = 0;
          }

          const currentTrail = trailLengthRef.current;
          const sparks = sparksRef.current;

          if (currentTrail > 0.2 || sparks.length > 0) {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const w = canvas.width;
            const h = canvas.height;
            ctx.clearRect(0, 0, w, h);

            const { cx: rawCx, cy: rawCy, rTip: rawRTip } = getCenterCoords();
            const cx = rawCx * dpr;
            const cy = rawCy * dpr;
            const rTip = rawRTip * dpr;

            const theme = themeRef.current;

            // Tip angle in canvas coordinates (-90 deg because bottle sprite points UP at angle 0)
            const tipAngleRad = ((physics.angle - 90) * Math.PI) / 180;
            const trailRad = (currentTrail * Math.PI) / 180;
            const isCW = trailDirRef.current === 1;

            if (currentTrail > 0.5) {
              ctx.save();
              ctx.globalCompositeOperation = 'screen';
              ctx.lineCap = 'round';

              // Pass 1: Wide ambient bloom
              ctx.strokeStyle = theme.primary;
              ctx.lineWidth = 16 * dpr;
              ctx.globalAlpha = Math.min(0.35, 0.15 + (currentTrail / 85) * 0.2);
              ctx.beginPath();
              if (isCW) {
                ctx.arc(cx, cy, rTip, tipAngleRad - trailRad, tipAngleRad, false);
              } else {
                ctx.arc(cx, cy, rTip, tipAngleRad, tipAngleRad + trailRad, false);
              }
              ctx.stroke();

              // Pass 2: Vivid neon core
              ctx.strokeStyle = theme.secondary;
              ctx.lineWidth = 5 * dpr;
              ctx.globalAlpha = Math.min(0.85, 0.4 + (currentTrail / 85) * 0.45);
              ctx.beginPath();
              if (isCW) {
                ctx.arc(cx, cy, rTip, tipAngleRad - trailRad, tipAngleRad, false);
              } else {
                ctx.arc(cx, cy, rTip, tipAngleRad, tipAngleRad + trailRad, false);
              }
              ctx.stroke();

              // Pass 3: White filament near the tip
              const whiteRad = trailRad * 0.32;
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 2.4 * dpr;
              ctx.globalAlpha = Math.min(0.95, 0.6 + (currentTrail / 85) * 0.35);
              ctx.beginPath();
              if (isCW) {
                ctx.arc(cx, cy, rTip, tipAngleRad - whiteRad, tipAngleRad, false);
              } else {
                ctx.arc(cx, cy, rTip, tipAngleRad, tipAngleRad + whiteRad, false);
              }
              ctx.stroke();

              // Pass 4: Glowing tip flare
              const tipX = cx + Math.cos(tipAngleRad) * rTip;
              const tipY = cy + Math.sin(tipAngleRad) * rTip;
              const flareRad = (10 + (currentTrail / 85) * 8) * dpr;

              const flareGrad = ctx.createRadialGradient(tipX, tipY, 0, tipX, tipY, flareRad);
              flareGrad.addColorStop(0, '#ffffff');
              flareGrad.addColorStop(0.3, theme.secondary);
              flareGrad.addColorStop(1, 'transparent');
              ctx.fillStyle = flareGrad;
              ctx.globalAlpha = 0.9;
              ctx.beginPath();
              ctx.arc(tipX, tipY, flareRad, 0, Math.PI * 2);
              ctx.fill();

              // Spawn sparks during fast spin
              if (absVel > 6 && Math.random() < 0.6 && sparks.length < 18) {
                const sparkAngle = isCW ? tipAngleRad - Math.random() * 0.15 : tipAngleRad + Math.random() * 0.15;
                const spDist = rTip + (Math.random() - 0.5) * 8 * dpr;
                const spVelAngle = tipAngleRad + (isCW ? -Math.PI / 2 : Math.PI / 2) + (Math.random() - 0.5) * 0.6;
                const speed = (2 + Math.random() * 4) * dpr;
                sparks.push({
                  x: cx + Math.cos(sparkAngle) * spDist,
                  y: cy + Math.sin(sparkAngle) * spDist,
                  vx: Math.cos(spVelAngle) * speed,
                  vy: Math.sin(spVelAngle) * speed,
                  life: 1.0,
                  color: Math.random() > 0.5 ? theme.primary : '#ffffff',
                });
              }

              ctx.restore();
            }

            // Render & update sparks
            if (sparks.length > 0) {
              ctx.save();
              ctx.globalCompositeOperation = 'screen';
              for (let i = sparks.length - 1; i >= 0; i--) {
                const sp = sparks[i];
                sp.x += sp.vx;
                sp.y += sp.vy;
                sp.life -= 0.04;
                if (sp.life <= 0) {
                  sparks.splice(i, 1);
                  continue;
                }
                ctx.globalAlpha = sp.life;
                ctx.fillStyle = sp.color;
                ctx.beginPath();
                ctx.arc(sp.x, sp.y, (1.8 * dpr) * sp.life, 0, Math.PI * 2);
                ctx.fill();
              }
              ctx.restore();
            }
          } else {
            // Clear when stationary
            if (canvas.width > 0) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
          }

          lastAngleRef.current = physics.angle;
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [getCenterCoords]);

  // Handle Touch Start (Drag) - disabled while spinning or during result cooldown
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isSpinning || isResultCooldown || physicsRef.current.isSpinning) return;
    if (e.touches.length !== 1) return;
    e.preventDefault();
    const t = e.touches[0];
    const { cx, cy } = getCenterCoords();

    setIsPointingBounce(false);
    setIsDragging(true);
    physicsRef.current.startDrag(t.clientX, t.clientY, cx, cy);
    setAngle(physicsRef.current.angle);
  };

  // Handle Touch Move (Drag tracking)
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || isSpinning || isResultCooldown || e.touches.length !== 1) return;
    e.preventDefault();
    const t = e.touches[0];
    const { cx, cy } = getCenterCoords();

    physicsRef.current.updateDrag(t.clientX, t.clientY, cx, cy);
    setAngle(physicsRef.current.angle);
  };

  // Handle Touch End (Flick release)
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setIsDragging(false);

    const flickVelocity = physicsRef.current.endDrag();
    if (physicsRef.current.isSpinning) {
      setIsPointingBounce(false);
      setIsSpinning(true);
      if (onSpinStateChangeRef.current) {
        onSpinStateChangeRef.current(true, flickVelocity);
      }
      SoundEngine.playBottleFlick(flickVelocity);
      recordGameEvent('bottle');
      recordStarEarringsCondition('bottleSpin');
    }
  };

  // Mouse / Pointer fallback handlers for desktop preview
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    if (isSpinning || isResultCooldown || physicsRef.current.isSpinning) return;
    const { cx, cy } = getCenterCoords();
    setIsPointingBounce(false);
    setIsDragging(true);
    physicsRef.current.startDrag(e.clientX, e.clientY, cx, cy);
    setAngle(physicsRef.current.angle);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || isSpinning || isResultCooldown || e.pointerType === 'touch') return;
    const { cx, cy } = getCenterCoords();
    physicsRef.current.updateDrag(e.clientX, e.clientY, cx, cy);
    setAngle(physicsRef.current.angle);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging || e.pointerType === 'touch') return;
    setIsDragging(false);
    const flickVel = physicsRef.current.endDrag();
    if (physicsRef.current.isSpinning) {
      setIsPointingBounce(false);
      setIsSpinning(true);
      if (onSpinStateChangeRef.current) {
        onSpinStateChangeRef.current(true, flickVel);
      }
      SoundEngine.playBottleFlick(flickVel);
      recordGameEvent('bottle');
      recordStarEarringsCondition('bottleSpin');
    }
  };

  const isLocked = isSpinning || isResultCooldown;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={`relative w-full h-full select-none touch-none overflow-hidden flex items-center justify-center ${
        isLocked ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'
      }`}
    >
      {/* Ambient Neon Spotlight Aura (Subtle soft ambient presence - comfortable and glare-free) */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-500"
        style={{
          background: `radial-gradient(ellipse 65% 55% at 50% 50%, ${currentTheme.secondary}0d 0%, ${currentTheme.primary}08 40%, transparent 70%)`,
          mixBlendMode: 'screen',
        }}
      />

      {/* Dynamic Bottle Tip Arc Light Trail Canvas (Zero-lag hardware accelerated) */}
      <canvas
        ref={trailCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
        style={{ mixBlendMode: 'screen' }}
      />

      {/* Rotating Large Bottle Container - Raw 60fps transform without CSS transition lag */}
      <div
        className="relative flex items-center justify-center origin-center select-none overflow-visible"
        style={{
          transform: `rotate(${angle}deg)`,
          transformOrigin: '50% 50%',
          willChange: 'transform',
          overflow: 'visible',
        }}
      >
        {/* Subtle pointing bounce effect along the bottle's pointing axis at result phase */}
        <div
          className={`relative flex items-center justify-center overflow-visible ${isPointingBounce ? 'animate-bottle-point' : ''}`}
          style={{
            overflow: 'visible',
            mixBlendMode: (settings.bottleStyle === 'custom' && customSprite && settings.bottleBlendMode === 'color-dodge')
              ? 'color-dodge'
              : undefined,
          }}
        >
          <BottleSpriteRenderer
            styleType={settings.bottleStyle}
            customSprite={customSprite}
            themeColors={currentTheme}
            blendMode={settings.bottleBlendMode || 'color-dodge'}
            className="w-[min(93vw,88vh)] h-[min(93vw,88vh)] max-w-[762px] max-h-[906px]"
          />
        </div>
      </div>
    </div>
  );
};



/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useMemo, useState } from 'react';
import spectrumVideo from '../assets/videos/Neon DJ Disc Background Animation.mp4';
import { getAssetUrl } from '../lib/assetPreloader';
import { ThemeId } from '../types';
import { THEMES } from '../lib/themes';

interface SpinBottleBackgroundProps {
  theme: ThemeId;
  active?: boolean;
  isSpinning?: boolean;
  spinSpeed?: number;
}

// Helper to convert hex to rgb numbers
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return [r, g, b];
  }
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

interface PrecomputedColor {
  stroke: string;
  flareStop25: string;
  flareStop55: string;
  flareStop100: string;
}

interface OrbitingLight {
  trackRatio: number;   // Radius ratio of table (0.93, 0.76, 0.54)
  speed: number;        // Radians/sec: positive = CLOCKWISE, negative = COUNTER-CLOCKWISE
  lengthRad: number;    // Arc length of trailing light
  angle: number;        // Continuous accumulated angle
  colorKey: 'primary' | 'secondary' | 'laser0' | 'laser1' | 'white';
  width: number;
  flareRadius: number;
}

// Helper to calculate exact round table size instantly with zero layout jump or zoom
function getInitialTableSize(): number {
  if (typeof window === 'undefined') return 850;
  const maxScreenDim = Math.max(window.innerWidth, window.innerHeight);
  return Math.round(Math.min(Math.max(maxScreenDim * 1.15, 780), 1360));
}

export const SpinBottleBackground: React.FC<SpinBottleBackgroundProps> = ({
  theme,
  active = true,
  isSpinning = false,
  spinSpeed = 0,
}) => {
  const currentTheme = THEMES[theme] || THEMES['cyber-neon'];
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Exact pixel diameter initialized synchronously to eliminate any initial resize zoom or lag
  const [tableSize, setTableSize] = useState<number>(getInitialTableSize);

  // Ensure animated spectrum background video auto-plays and auto-resumes reliably across mobile browsers, and pauses when inactive
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');

    if (active) {
      const tryPlay = () => {
        video.play().catch(() => {
          const onInteract = () => {
            video.play().catch(() => {});
            window.removeEventListener('touchstart', onInteract);
            window.removeEventListener('click', onInteract);
          };
          window.addEventListener('touchstart', onInteract, { once: true });
          window.addEventListener('click', onInteract, { once: true });
        });
      };
      tryPlay();
    } else {
      video.pause();
    }
  }, [active]);

  useEffect(() => {
    const handleResize = () => {
      const maxScreenDim = Math.max(window.innerWidth, window.innerHeight);
      const size = Math.round(Math.min(Math.max(maxScreenDim * 1.15, 780), 1360));
      setTableSize(size);
    };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Pre-generate all color strings and gradient stops once to eliminate garbage collection inside 60FPS loop
  const colorMap = useMemo(() => {
    const makeDescriptor = (hex: string): PrecomputedColor => {
      const [r, g, b] = hexToRgb(hex);
      return {
        stroke: `rgb(${r}, ${g}, ${b})`,
        flareStop25: `rgba(${r}, ${g}, ${b}, 0.85)`,
        flareStop55: `rgba(${r}, ${g}, ${b}, 0.22)`,
        flareStop100: `rgba(${r}, ${g}, ${b}, 0)`,
      };
    };

    return {
      primary: makeDescriptor(currentTheme.primary),
      secondary: makeDescriptor(currentTheme.secondary),
      laser0: makeDescriptor(currentTheme.laserColors[0] || currentTheme.primary),
      laser1: makeDescriptor(currentTheme.laserColors[1] || currentTheme.secondary),
      white: {
        stroke: 'rgb(255, 255, 255)',
        flareStop25: 'rgba(255, 255, 255, 0.9)',
        flareStop55: 'rgba(255, 255, 255, 0.3)',
        flareStop100: 'rgba(255, 255, 255, 0)',
      },
    };
  }, [currentTheme]);

  const colorRef = useRef(colorMap);
  colorRef.current = colorMap;

  const isSpinningRef = useRef(isSpinning);
  isSpinningRef.current = isSpinning;
  const spinSpeedRef = useRef(spinSpeed);
  spinSpeedRef.current = spinSpeed;
  const tableSizeRef = useRef(tableSize);
  tableSizeRef.current = tableSize;

  // Ultra-optimized, zero-lag 60FPS Orbiting Party Lights Engine with Soft Ambient Glow
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId: number;
    let canvasSide = 0;
    let dpr = 1;

    const resizeCanvas = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const measuredSide = Math.min(rect.width, rect.height);
      const effectiveSide = measuredSide > 50 ? measuredSide : tableSizeRef.current;
      const side = Math.round(effectiveSide * dpr);
      canvasSide = side;
      canvas.width = side;
      canvas.height = side;
    };

    resizeCanvas();
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 50) {
          resizeCanvas();
        }
      }
    });
    ro.observe(canvas);
    window.addEventListener('resize', resizeCanvas, { passive: true });

    // Concentric orbiting party light tracks:
    // Rule: ALL lights in the same orbiting path travel in the EXACT SAME direction!
    // Ring 1 (Outer) = Strictly CLOCKWISE
    // Ring 2 (Mid-Outer) = Strictly COUNTER-CLOCKWISE
    // Ring 3 (Mid-Inner) = Strictly CLOCKWISE
    // Ring 4 (Inner) = Strictly COUNTER-CLOCKWISE
    const lights: OrbitingLight[] = [
      // Ring 1: Outer Rim Track (trackRatio: 0.90) - Strictly CLOCKWISE
      {
        trackRatio: 0.90,
        speed: 0.75, // Clockwise
        lengthRad: 0.85,
        angle: 0,
        colorKey: 'primary',
        width: 5.5,
        flareRadius: 13,
      },
      {
        trackRatio: 0.90,
        speed: 0.75, // Clockwise (Opposite flank 180° apart)
        lengthRad: 0.75,
        angle: Math.PI,
        colorKey: 'secondary',
        width: 5,
        flareRadius: 12,
      },

      // Ring 2: Mid-Outer Track (trackRatio: 0.72) - Strictly COUNTER-CLOCKWISE
      {
        trackRatio: 0.72,
        speed: -0.95, // Counter-Clockwise
        lengthRad: 0.8,
        angle: 1.1,
        colorKey: 'secondary',
        width: 5,
        flareRadius: 12,
      },
      {
        trackRatio: 0.72,
        speed: -0.95, // Counter-Clockwise (Opposite flank 180° apart)
        lengthRad: 0.68,
        angle: 1.1 + Math.PI,
        colorKey: 'white',
        width: 4.5,
        flareRadius: 10,
      },

      // Ring 3: Mid-Inner Track (trackRatio: 0.54) - Strictly CLOCKWISE
      {
        trackRatio: 0.54,
        speed: 1.15, // Clockwise
        lengthRad: 0.75,
        angle: 2.2,
        colorKey: 'laser0',
        width: 4.5,
        flareRadius: 11,
      },
      {
        trackRatio: 0.54,
        speed: 1.15, // Clockwise (Opposite flank 180° apart)
        lengthRad: 0.65,
        angle: 2.2 + Math.PI,
        colorKey: 'laser1',
        width: 4.5,
        flareRadius: 11,
      },

      // Ring 4: Inner Track (trackRatio: 0.36) - Strictly COUNTER-CLOCKWISE
      {
        trackRatio: 0.36,
        speed: -1.35, // Counter-Clockwise
        lengthRad: 0.7,
        angle: 0.5,
        colorKey: 'primary',
        width: 4.5,
        flareRadius: 10,
      },
      {
        trackRatio: 0.36,
        speed: -1.35, // Counter-Clockwise (Opposite flank 180° apart)
        lengthRad: 0.6,
        angle: 0.5 + Math.PI,
        colorKey: 'white',
        width: 4,
        flareRadius: 9,
      },
    ];

    let lastTime = performance.now();
    let currentSpinBoost = 0; // Tracks momentum boost with smooth exponential decay

    const render = (now: number) => {
      // Delta time in seconds, clamped to protect against tab-switch spikes
      const dt = Math.min((now - lastTime) * 0.001, 0.05);
      lastTime = now;

      ctx.clearRect(0, 0, canvasSide, canvasSide);

      const colors = colorRef.current;
      const isSpinning = isSpinningRef.current;
      const rawSpeed = Math.abs(spinSpeedRef.current);

      // Target boost derived from bottle angular velocity
      // Vigorous flick (15-35 deg/frame) reaches 2.5x to 5.5x extra orbit speed
      const targetBoost = isSpinning ? Math.min(rawSpeed * 0.18, 5.5) : 0;

      if (targetBoost > currentSpinBoost) {
        // Fast responsive attack when flicked
        currentSpinBoost += (targetBoost - currentSpinBoost) * Math.min(1.0, 10.0 * dt);
      } else {
        // Smooth exponential decay: natural physical inertia as the bottle slows down and settles
        currentSpinBoost = currentSpinBoost * Math.exp(-1.4 * dt);
        if (currentSpinBoost < 0.002) currentSpinBoost = 0;
      }

      // Total speed multiplier: starts at 1.0 (ambient), surges up to 6.5x, then decays gracefully
      const totalSpeedMult = 1.0 + currentSpinBoost;

      // Dynamically accelerate animated video play speed during spin surge, decaying smoothly back to 1.0x
      if (videoRef.current) {
        const video = videoRef.current;
        const dynamicRate = 1.0 + Math.min(currentSpinBoost * 0.45, 2.2);
        if (Math.abs(video.playbackRate - dynamicRate) > 0.03) {
          try {
            video.playbackRate = dynamicRate;
          } catch {
            // Browser safety fallback
          }
        }
      }

      const cx = canvasSide * 0.5;
      const cy = canvasSide * 0.5;
      const tableRadius = canvasSide * 0.49;

      // Organic party beat pulse (128 BPM club rhythm)
      const beat = 0.5 + 0.5 * Math.sin(now * 0.0067);
      const beatGlow = 0.88 + 0.12 * beat;

      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.lineCap = 'round';

      // Render each orbiting light trail with silky smooth tapering, dynamic speed, and glow decay
      for (let l = 0; l < lights.length; l++) {
        const light = lights[l];

        // Frame-by-frame continuous forward angle accumulation with dynamic speed
        light.angle += light.speed * totalSpeedMult * dt;
        if (light.angle > Math.PI * 2) {
          light.angle -= Math.PI * 2;
        } else if (light.angle < 0) {
          light.angle += Math.PI * 2;
        }

        const isCW = light.speed >= 0;
        const r = tableRadius * light.trackRatio;
        const headAngle = light.angle;
        // Trail length elongates during fast spin, then smoothly decays back to ambient
        const trailBoost = 1.0 + Math.min(currentSpinBoost * 0.35, 1.2);
        const trailLength = light.lengthRad * trailBoost;
        const c = colors[light.colorKey] || colors.primary;

        // Energy glow factor that intensifies during spin surge and decays back
        const energyGlow = 1.0 + Math.min(currentSpinBoost * 0.22, 0.8);

        // =========================================================================
        // PASS 1: SOFT AMBIENT GLOW BLOOM (Feathered wide under-layer)
        // =========================================================================
        const BLOOM_STEPS = 6;
        ctx.strokeStyle = c.stroke;
        const bloomWidth = light.width * (2.8 + Math.min(currentSpinBoost * 0.25, 1.0)) * dpr;
        for (let i = 0; i < BLOOM_STEPS; i++) {
          const t1 = i / BLOOM_STEPS;
          const t2 = (i + 1.04) / BLOOM_STEPS;
          const tMid = (i + 0.5) / BLOOM_STEPS;
          const bloomAlpha = Math.pow(tMid, 1.8) * 0.16 * beatGlow * energyGlow;

          ctx.globalAlpha = Math.min(bloomAlpha, 0.85);
          ctx.lineWidth = bloomWidth;
          ctx.beginPath();
          if (isCW) {
            ctx.arc(cx, cy, r, headAngle - trailLength + t1 * trailLength, headAngle - trailLength + t2 * trailLength, false);
          } else {
            ctx.arc(cx, cy, r, headAngle + trailLength - t1 * trailLength, headAngle + trailLength - t2 * trailLength, true);
          }
          ctx.stroke();
        }

        // =========================================================================
        // PASS 2: VIBRANT NEON CORE RIBBON (Smoothly tapering from thin tail to head)
        // =========================================================================
        const CORE_STEPS = 9;
        const maxCoreWidth = (light.width + Math.min(currentSpinBoost * 0.3, 1.5)) * dpr;
        ctx.strokeStyle = c.stroke;
        for (let i = 0; i < CORE_STEPS; i++) {
          const t1 = i / CORE_STEPS;
          const t2 = (i + 1.04) / CORE_STEPS;
          const tMid = (i + 0.5) / CORE_STEPS;
          // Cubic smoothstep interpolation for seamless continuous flow
          const easeT = tMid * tMid * (3 - 2 * tMid);
          const coreAlpha = (0.04 + 0.86 * easeT) * beatGlow * energyGlow;
          const coreWidth = 1.4 * dpr + (maxCoreWidth - 1.4 * dpr) * easeT;

          ctx.globalAlpha = Math.min(coreAlpha, 0.95);
          ctx.lineWidth = coreWidth;
          ctx.beginPath();
          if (isCW) {
            ctx.arc(cx, cy, r, headAngle - trailLength + t1 * trailLength, headAngle - trailLength + t2 * trailLength, false);
          } else {
            ctx.arc(cx, cy, r, headAngle + trailLength - t1 * trailLength, headAngle + trailLength - t2 * trailLength, true);
          }
          ctx.stroke();
        }

        // =========================================================================
        // PASS 3: WHITE-HOT INCANDESCENT FILAMENT (Leading 22-30% of the light trail)
        // =========================================================================
        const whitePortion = 0.22 + Math.min(currentSpinBoost * 0.04, 0.12);
        const aWhiteTail = isCW ? headAngle - trailLength * whitePortion : headAngle + trailLength * whitePortion;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = (1.6 + Math.min(currentSpinBoost * 0.25, 0.8)) * dpr;
        ctx.globalAlpha = Math.min(0.95, (0.65 + currentSpinBoost * 0.08) * beatGlow);
        ctx.beginPath();
        if (isCW) {
          ctx.arc(cx, cy, r, aWhiteTail, headAngle, false);
        } else {
          ctx.arc(cx, cy, r, aWhiteTail, headAngle, true);
        }
        ctx.stroke();

        // =========================================================================
        // PASS 4: SOFT FEATHERED FLARE HEAD
        // =========================================================================
        const headX = cx + Math.cos(headAngle) * r;
        const headY = cy + Math.sin(headAngle) * r;
        const flareRad = light.flareRadius * (1.15 + 0.2 * beat + Math.min(currentSpinBoost * 0.35, 1.6)) * dpr;

        const headGrad = ctx.createRadialGradient(headX, headY, 0, headX, headY, flareRad);
        headGrad.addColorStop(0, '#ffffff');
        headGrad.addColorStop(0.25, c.flareStop25);
        headGrad.addColorStop(0.55, c.flareStop55);
        headGrad.addColorStop(1, c.flareStop100);

        ctx.globalAlpha = 1;
        ctx.fillStyle = headGrad;
        ctx.beginPath();
        ctx.arc(headX, headY, flareRad, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animId);
      if (videoRef.current) {
        try {
          videoRef.current.playbackRate = 1.0;
        } catch {}
      }
    };
  }, [active, tableSize]);

  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none flex items-center justify-center">
      {/* 1. Animated Video Background: Music Visualizer Spectrum Circle Animated.mp4 (Crystal clear, vivid neon) */}
      <video
        ref={videoRef}
        src={getAssetUrl(spectrumVideo)}
        preload="auto"
        autoPlay
        loop
        muted
        playsInline
        disablePictureInPicture
        controls={false}
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none z-0"
        style={{
          filter: 'contrast(1.06) brightness(1.12) saturate(1.22)',
        }}
      />

      {/* 2. Crystal Clear Center: Only distant corners receive subtle gradient shading */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 0%, transparent 62%, rgba(2, 4, 12, 0.42) 85%, rgba(2, 4, 12, 0.76) 100%)',
        }}
      />

      {/* Edge gradient fades for top navigation bar and bottom controls */}
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/55 via-black/20 to-transparent pointer-events-none z-[2]" />
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 via-black/20 to-transparent pointer-events-none z-[2]" />

      {/* 3. Subtle Ambient Club Atmosphere Glow */}
      <div className="absolute inset-0 moving-gradient-layer opacity-10 pointer-events-none z-[2]" />

      {/* 4. Overhead VIP Club Lighting Wash */}
      <div
        className="absolute inset-0 transition-colors duration-500 pointer-events-none z-[2]"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${currentTheme.secondary}08 0%, ${currentTheme.primary}05 45%, transparent 75%)`,
        }}
      />

      {/* 5. Sheer Translucent Round VIP Party Lounge Table Container with Orbiting Lights & Circle Canvas */}
      <div
        className="relative shrink-0 flex items-center justify-center rounded-full pointer-events-none z-[3]"
        style={{
          width: `${tableSize}px`,
          height: `${tableSize}px`,
        }}
      >
        {/* Soft Under-Table LED Party Glow Pool */}
        <div
          className="absolute -inset-10 sm:-inset-16 rounded-full pointer-events-none transition-colors duration-500 opacity-25"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${currentTheme.secondary}15 35%, ${currentTheme.primary}08 58%, transparent 78%)`,
            mixBlendMode: 'screen',
          }}
        />

        {/* Outer Circular Neon Party Edge Rim */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none transition-colors duration-500"
          style={{
            border: `1.5px solid ${currentTheme.primary}45`,
            boxShadow: `
              0 25px 80px -15px rgba(0, 0, 0, 0.9),
              0 0 16px ${currentTheme.primary}18,
              inset 0 0 12px ${currentTheme.secondary}12
            `,
          }}
        />

        {/* Secondary Concentric Neon Party Track */}
        <div
          className="absolute inset-[4px] rounded-full pointer-events-none transition-colors duration-500"
          style={{
            border: `1px solid rgba(255, 255, 255, 0.20)`,
            boxShadow: `0 0 10px ${currentTheme.secondary}15`,
          }}
        />

        {/* Crystal Clear Sheer Glass Table Surface (Spectrum visualizer video is 100% visible through table) */}
        <div
          className="absolute inset-[8px] rounded-full overflow-hidden pointer-events-none transition-colors duration-500"
          style={{
            background: `radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.02) 0%, rgba(10, 8, 25, 0.05) 55%, rgba(4, 3, 12, 0.22) 100%)`,
          }}
        >
          {/* Circular VIP Seating Spot Indicators (Party Lounge Dots - Dimmed) */}
          <div className="absolute inset-0 pointer-events-none opacity-30">
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
              <div
                key={deg}
                className="absolute top-0 bottom-0 left-1/2 w-[1px] -translate-x-1/2 flex flex-col justify-between py-6 pointer-events-none"
                style={{ transform: `rotate(${deg}deg)` }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full mx-auto"
                  style={{
                    backgroundColor: deg % 90 === 0 ? '#ffffff' : currentTheme.primary,
                    boxShadow: `0 0 8px ${deg % 90 === 0 ? '#ffffff' : currentTheme.primary}`,
                  }}
                />
                <div
                  className="w-1.5 h-1.5 rounded-full mx-auto"
                  style={{
                    backgroundColor: deg % 90 === 0 ? '#ffffff' : currentTheme.primary,
                    boxShadow: `0 0 8px ${deg % 90 === 0 ? '#ffffff' : currentTheme.primary}`,
                  }}
                />
              </div>
            ))}
          </div>

          {/* Ring 1 Luminous Party Groove (Matches trackRatio 0.90) */}
          <div
            className="absolute inset-[6%] rounded-full pointer-events-none transition-colors duration-500"
            style={{
              border: `1px solid ${currentTheme.primary}25`,
              boxShadow: `0 0 10px ${currentTheme.primary}12`,
            }}
          />

          {/* Ring 2 Mid-Outer Concentric Party Track (Matches trackRatio 0.72) */}
          <div
            className="absolute inset-[15%] rounded-full pointer-events-none transition-colors duration-500"
            style={{
              border: `1px solid ${currentTheme.secondary}20`,
              boxShadow: `0 0 8px ${currentTheme.secondary}12`,
            }}
          />

          {/* Ring 3 Mid-Inner Groove Track (Matches trackRatio 0.54) */}
          <div
            className="absolute inset-[24%] rounded-full pointer-events-none transition-colors duration-500"
            style={{
              border: `1px solid ${currentTheme.primary}18`,
            }}
          />

          {/* Ring 4 Inner Track (Matches trackRatio 0.36) */}
          <div
            className="absolute inset-[33%] rounded-full pointer-events-none"
            style={{
              border: `1px dashed rgba(255, 255, 255, 0.18)`,
            }}
          />

          {/* Center Bottle Service Coaster Medallion (Ultra-Sheer Crystal Disc) */}
          <div
            className="absolute inset-[41%] rounded-full pointer-events-none flex items-center justify-center transition-colors duration-500"
            style={{
              border: `1.5px solid ${currentTheme.primary}30`,
              background: `radial-gradient(circle at 50% 50%, ${currentTheme.secondary}08 0%, rgba(20, 15, 35, 0.12) 65%, rgba(10, 8, 20, 0.20) 100%)`,
              boxShadow: `
                0 0 16px ${currentTheme.primary}15,
                inset 0 0 10px ${currentTheme.secondary}12
              `,
            }}
          >
            {/* Center LED Halo Ring */}
            <div
              className="w-28 h-28 rounded-full border border-white/30 flex items-center justify-center relative"
              style={{ boxShadow: `0 0 16px ${currentTheme.secondary}44` }}
            >
              <div
                className="w-16 h-16 rounded-full border border-white/40 flex items-center justify-center"
                style={{
                  background: `radial-gradient(circle, ${currentTheme.primary}33 0%, transparent 80%)`,
                }}
              >
                <div
                  className="w-7 h-7 rounded-full bg-white/40 border border-white/60"
                  style={{ boxShadow: `0 0 12px #ffffff` }}
                />
              </div>
            </div>
          </div>

          {/* 60FPS Ultra-Optimized Multi-Directional Circling Lights Canvas */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ mixBlendMode: 'screen' }}
          />

          {/* Clean Glass Party Glare Sheen (Subtle, elegant) */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              background: `linear-gradient(135deg, transparent 35%, rgba(255, 255, 255, 0.12) 50%, transparent 65%)`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

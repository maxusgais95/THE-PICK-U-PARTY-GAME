/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import currencyStarImg from '../assets/images/Currency Star Sprite.png';
import { SoundEngine } from '../lib/audio';

export interface GlobalFlyingStarBatch {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  amount: number;
  hudDisplayAmount?: number;
}

interface Particle {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  controlX: number;
  controlY: number;
  delayMs: number;
  durationMs: number;
  size: number;
}

export const GlobalFlyingStars: React.FC = () => {
  const [activeBatches, setActiveBatches] = useState<
    { batch: GlobalFlyingStarBatch; particles: Particle[] }[]
  >([]);

  useEffect(() => {
    const handleSpawn = (event: Event) => {
      const customEvent = event as CustomEvent<GlobalFlyingStarBatch>;
      const batch = customEvent.detail;
      if (!batch || !batch.id) return;

      const particleCount = 8;
      const particles: Particle[] = [];

      for (let i = 0; i < particleCount; i++) {
        // Curve control point with random spread
        const spreadX = (Math.random() - 0.5) * 180;
        const midY = (batch.startY + batch.endY) / 2 + (Math.random() - 0.5) * 80;
        const midX = (batch.startX + batch.endX) / 2 + spreadX;

        particles.push({
          id: `${batch.id}-p-${i}`,
          startX: batch.startX,
          startY: batch.startY,
          endX: batch.endX,
          endY: batch.endY,
          controlX: midX,
          controlY: midY,
          delayMs: i * 40,
          durationMs: 480 + i * 25,
          size: 18 + Math.random() * 8,
        });
      }

      setActiveBatches((prev) => [...prev, { batch, particles }]);

      // When the final particle hits the Currency HUD
      const totalTime = 40 * particleCount + 540;
      setTimeout(() => {
        SoundEngine.playHudCoinBeep();
        window.dispatchEvent(
          new CustomEvent('currency-hud-beep', {
            detail: {
              stars: batch.amount,
              totalStars: batch.hudDisplayAmount,
            },
          })
        );
        setActiveBatches((prev) => prev.filter((b) => b.batch.id !== batch.id));
      }, totalTime);
    };

    window.addEventListener('global-spawn-flying-stars', handleSpawn);
    return () => {
      window.removeEventListener('global-spawn-flying-stars', handleSpawn);
    };
  }, []);

  if (activeBatches.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-[100] pointer-events-none overflow-hidden select-none"
      aria-hidden="true"
    >
      {activeBatches.map(({ batch, particles }) => (
        <React.Fragment key={batch.id}>
          {particles.map((p) => (
            <GlobalFlyingStarParticleItem key={p.id} particle={p} />
          ))}
        </React.Fragment>
      ))}
    </div>
  );
};

const GlobalFlyingStarParticleItem: React.FC<{ particle: Particle }> = ({ particle }) => {
  const itemRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let animationFrameId: number;
    let startTime: number | null = null;

    const delayTimeout = setTimeout(() => {
      const el = itemRef.current;
      if (!el) return;
      el.style.opacity = '1';

      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / particle.durationMs, 1);

        // Quadratic Bezier interpolation with smooth ease-in
        const easeProgress = Math.pow(progress, 1.25);
        const t = easeProgress;
        const mt = 1 - t;

        const currentX =
          mt * mt * particle.startX +
          2 * mt * t * particle.controlX +
          t * t * particle.endX;
        const currentY =
          mt * mt * particle.startY +
          2 * mt * t * particle.controlY +
          t * t * particle.endY;

        const scale =
          progress < 0.2
            ? progress * 5 * 1.25
            : progress > 0.8
            ? 1.25 - (progress - 0.8) * 3
            : 1.25;

        if (el) {
          el.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) scale(${scale})`;
          if (progress >= 1) {
            el.style.opacity = '0';
          }
        }

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(animate);
        }
      };

      animationFrameId = requestAnimationFrame(animate);
    }, particle.delayMs);

    return () => {
      clearTimeout(delayTimeout);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [particle]);

  return (
    <div
      ref={itemRef}
      className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 pointer-events-none drop-shadow-[0_0_12px_rgba(255,230,0,0.95)] opacity-0 will-change-transform"
      style={{
        transform: `translate3d(${particle.startX}px, ${particle.startY}px, 0) scale(0)`,
      }}
    >
      <div className="relative flex items-center justify-center animate-spin-hyper">
        <img
          src={currencyStarImg}
          alt="Star"
          style={{ width: particle.size, height: particle.size }}
          className="object-contain filter drop-shadow-[0_0_10px_rgba(251,191,36,1)]"
        />
        {/* Shimmering white core */}
        <div className="absolute w-2 h-2 rounded-full bg-white blur-[1px] animate-ping" />
      </div>
    </div>
  );
};

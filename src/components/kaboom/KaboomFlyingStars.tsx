/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import currencyStarImg from '../../assets/images/Currency Star Sprite.png';
import { SoundEngine } from '../../lib/audio';

export interface FlyingStarBatch {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  amount: number;
  hudDisplayAmount?: number;
}

interface KaboomFlyingStarsProps {
  batches: FlyingStarBatch[];
  onBatchComplete: (batchId: string, amount: number) => void;
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

export const KaboomFlyingStars: React.FC<KaboomFlyingStarsProps> = ({
  batches,
  onBatchComplete,
}) => {
  const [activeBatches, setActiveBatches] = useState<
    { batch: FlyingStarBatch; particles: Particle[] }[]
  >([]);

  useEffect(() => {
    batches.forEach((batch) => {
      // Check if batch is already generated
      if (activeBatches.some((b) => b.batch.id === batch.id)) return;

      const particleCount = 7;
      const particles: Particle[] = [];

      for (let i = 0; i < particleCount; i++) {
        // Curve control point with spread
        const spreadX = (Math.random() - 0.5) * 160;
        const midY = (batch.startY + batch.endY) / 2 + (Math.random() - 0.5) * 60;
        const midX = (batch.startX + batch.endX) / 2 + spreadX;

        particles.push({
          id: `${batch.id}-p-${i}`,
          startX: batch.startX,
          startY: batch.startY,
          endX: batch.endX,
          endY: batch.endY,
          controlX: midX,
          controlY: midY,
          delayMs: i * 45,
          durationMs: 500 + i * 25,
          size: 18 + Math.random() * 8,
        });
      }

      setActiveBatches((prev) => [...prev, { batch, particles }]);

      // When the last particle hits the HUD
      const totalTime = 45 * particleCount + 560;
      setTimeout(() => {
        // Trigger Currency HUD Beep sound & dispatch event for visual bounce
        SoundEngine.playHudCoinBeep();
        window.dispatchEvent(
          new CustomEvent('currency-hud-beep', {
            detail: {
              stars: batch.amount,
              totalStars: batch.hudDisplayAmount,
            },
          })
        );
        onBatchComplete(batch.id, batch.amount);
        setActiveBatches((prev) => prev.filter((b) => b.batch.id !== batch.id));
      }, totalTime);
    });
  }, [batches, onBatchComplete]);

  if (activeBatches.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-50 pointer-events-none overflow-hidden select-none"
      aria-hidden="true"
    >
      {activeBatches.map(({ batch, particles }) => (
        <React.Fragment key={batch.id}>
          {particles.map((p) => (
            <FlyingStarParticleItem key={p.id} particle={p} />
          ))}
        </React.Fragment>
      ))}
    </div>
  );
};

const FlyingStarParticleItem: React.FC<{ particle: Particle }> = ({
  particle,
}) => {
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

        // Quadratic Bezier interpolation with ease-in
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

        // Scale starts small, peaks, then shrinks slightly as it enters HUD
        const scale =
          progress < 0.2
            ? progress * 5 * 1.2
            : progress > 0.8
            ? 1.2 - (progress - 0.8) * 3
            : 1.2;

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
        {/* Shimmering core */}
        <div className="absolute w-2 h-2 rounded-full bg-white blur-[1px] animate-ping" />
      </div>
    </div>
  );
};

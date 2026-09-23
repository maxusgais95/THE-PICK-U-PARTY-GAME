/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  decay: number;
}

interface KaboomExplosionCanvasProps {
  originX?: number; // Normalized 0..1 or client coordinates
  originY?: number;
  active: boolean;
  onComplete?: () => void;
}

export const KaboomExplosionCanvas: React.FC<KaboomExplosionCanvasProps> = ({
  originX,
  originY,
  active,
  onComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);

    const centerX = originX !== undefined ? originX : width / 2;
    const centerY = originY !== undefined ? originY : height / 2;

    const colors = [
      '#ff2a5f',
      '#ff5e00',
      '#ffaa00',
      '#ffe600',
      '#ffffff',
      '#f43f5e',
      '#fb923c',
    ];

    // Generate 75 explosion debris and fire embers (optimized count with additive blending)
    const particles: Particle[] = [];
    const particleCount = 75;

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 12 + 3;
      const size = Math.random() * 7 + 3;
      const maxLife = Math.random() * 35 + 30;
      particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 0,
        maxLife,
        decay: 1 / maxLife,
      });
    }

    let frame = 0;
    const maxFrames = 60;

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      // Enable GPU-accelerated additive blending:
      ctx.globalCompositeOperation = 'lighter';

      // Draw fiery explosion particles (batch render with zero shadowBlur)
      particles.forEach((p) => {
        if (p.alpha <= 0.01) return;

        // Outer glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha * 0.4);
        ctx.fill();

        // Inner bright core
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fill();

        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.93; // Air resistance
        p.vy *= 0.93;
        p.vy += 0.16; // Gravity
        p.size *= 0.96;
        p.alpha -= p.decay;
      });

      // Reset composite operation for cleanliness
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;

      if (frame < maxFrames) {
        animId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, width, height);
        if (onComplete) onComplete();
      }
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [active, originX, originY, onComplete]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50 w-full h-full"
    />
  );
};

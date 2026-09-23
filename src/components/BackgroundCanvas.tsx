/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { THEMES } from '../lib/themes';
import { ThemeId, TouchPlayer } from '../types';

interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
  lineWidth: number;
}

interface BackgroundCanvasProps {
  theme: ThemeId;
  touches?: TouchPlayer[];
  showTeamLines?: boolean;
}

export const BackgroundCanvas: React.FC<BackgroundCanvasProps> = ({
  theme,
  touches = [],
  showTeamLines = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const shockwavesRef = useRef<Shockwave[]>([]);
  const animFrameRef = useRef<number | null>(null);

  const themeRef = useRef<ThemeId>(theme);
  themeRef.current = theme;
  const touchesRef = useRef<TouchPlayer[]>(touches);
  touchesRef.current = touches;
  const showTeamLinesRef = useRef<boolean>(showTeamLines);
  showTeamLinesRef.current = showTeamLines;

  // Trigger public shockwave helper
  useEffect(() => {
    const handleAddShockwave = (e: CustomEvent<{ x: number; y: number; color?: string; maxRadius?: number }>) => {
      const themeColors = THEMES[themeRef.current] || THEMES['cyber-neon'];
      shockwavesRef.current.push({
        x: e.detail.x,
        y: e.detail.y,
        radius: 10,
        maxRadius: e.detail.maxRadius || 320,
        color: e.detail.color || themeColors.primary,
        alpha: 1.0,
        lineWidth: 6,
      });
    };

    window.addEventListener('app-shockwave' as any, handleAddShockwave);
    return () => {
      window.removeEventListener('app-shockwave' as any, handleAddShockwave);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    handleResize();

    let wasIdle = false;

    const render = () => {
      const currentTouches = touchesRef.current;
      const currentShowTeam = showTeamLinesRef.current;
      const currentThemeId = themeRef.current;
      const themeColors = THEMES[currentThemeId] || THEMES['cyber-neon'];

      const hasTouches = currentTouches.length > 0;
      const hasShockwaves = shockwavesRef.current.length > 0;

      if (!hasTouches && !hasShockwaves) {
        if (!wasIdle) {
          ctx.clearRect(0, 0, width, height);
          wasIdle = true;
        }
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      wasIdle = false;
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Dynamic Connecting Lines Between Touches
      if (currentTouches.length > 1) {
        ctx.save();
        if (currentShowTeam) {
          // Connect players of the SAME team with thick glowing laser cords
          for (let i = 0; i < currentTouches.length; i++) {
            for (let j = i + 1; j < currentTouches.length; j++) {
              const t1 = currentTouches[i];
              const t2 = currentTouches[j];
              if (t1.teamIndex !== undefined && t2.teamIndex !== undefined && t1.teamIndex === t2.teamIndex) {
                const teamPalette = themeColors.teamPalettes[t1.teamIndex % themeColors.teamPalettes.length];
                ctx.strokeStyle = teamPalette.solid;
                ctx.lineWidth = 4;
                ctx.shadowColor = teamPalette.solid;
                ctx.shadowBlur = 16;
                ctx.globalAlpha = 0.85;

                ctx.beginPath();
                ctx.moveTo(t1.x, t1.y);
                ctx.lineTo(t2.x, t2.y);
                ctx.stroke();
              }
            }
          }
        } else {
          // Standard connecting network mesh
          ctx.strokeStyle = themeColors.primary;
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = 0.35;
          ctx.beginPath();
          for (let i = 0; i < currentTouches.length; i++) {
            for (let j = i + 1; j < currentTouches.length; j++) {
              ctx.moveTo(currentTouches[i].x, currentTouches[i].y);
              ctx.lineTo(currentTouches[j].x, currentTouches[j].y);
            }
          }
          ctx.stroke();
        }
        ctx.restore();
      }

      // 2. Draw Clean Expanding Shockwaves on Round Resolve / Impact
      for (let i = shockwavesRef.current.length - 1; i >= 0; i--) {
        const sw = shockwavesRef.current[i];
        sw.radius += (sw.maxRadius - sw.radius) * 0.12 + 2.5;
        sw.alpha = Math.max(0, 1 - sw.radius / sw.maxRadius);

        ctx.save();
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = sw.color;
        ctx.lineWidth = sw.lineWidth * sw.alpha;
        ctx.globalAlpha = sw.alpha;
        ctx.shadowColor = sw.color;
        ctx.shadowBlur = 20;
        ctx.stroke();
        ctx.restore();

        if (sw.radius >= sw.maxRadius || sw.alpha <= 0.01) {
          shockwavesRef.current.splice(i, 1);
        }
      }

      ctx.globalAlpha = 1.0;
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="bg-canvas"
      className="absolute inset-0 pointer-events-none z-10"
    />
  );
};

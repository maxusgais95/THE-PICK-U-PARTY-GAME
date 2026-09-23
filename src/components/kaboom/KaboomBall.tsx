/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Check, Star, Bomb } from 'lucide-react';
import { KaboomTile } from '../../types';
import kaboomBombImg from '../../assets/images/bombs/Bomb Sprite.webp';
import kaboomBallImg from '../../assets/images/balls/Ball Sprite.webp';
import currencyStarImg from '../../assets/images/Currency Star Sprite.webp';

interface KaboomBallProps {
  tile: KaboomTile;
  dimension: number;
  disabled: boolean;
  onTap: (tile: KaboomTile, event: React.MouseEvent | React.TouchEvent) => void;
  isGameOver: boolean;
  rippleDelay?: number;
  ballImage?: string;
  ballFilter?: string;
  bombImage?: string;
  bombFilter?: string;
}

const KaboomBallComponent: React.FC<KaboomBallProps> = ({
  tile,
  dimension,
  disabled,
  onTap,
  isGameOver,
  rippleDelay,
  ballImage,
  ballFilter,
  bombImage,
  bombFilter,
}) => {
  // Simulated water ripple propagation class & delay
  const rippleClass = rippleDelay !== undefined ? 'animate-water-tile-ripple' : '';
  const rippleStyle = rippleDelay !== undefined ? { animationDelay: `${rippleDelay}ms` } : undefined;

  // Subtle alternating checkerboard for tactile depth in gray monochrome palette
  const isAlternate = (tile.row + tile.col) % 2 === 0;

  // Responsive corner radiuses based on grid dimension
  const getRadiusClasses = () => {
    if (dimension <= 3) {
      return {
        outer: 'rounded-2xl',
        inner: 'rounded-xl',
        inset: 'inset-[4px] sm:inset-[5px]',
      };
    }
    if (dimension === 4) {
      return {
        outer: 'rounded-xl sm:rounded-2xl',
        inner: 'rounded-lg sm:rounded-xl',
        inset: 'inset-[3px] sm:inset-[4px]',
      };
    }
    return {
      outer: 'rounded-lg sm:rounded-xl',
      inner: 'rounded-md sm:rounded-lg',
      inset: 'inset-[2px] sm:inset-[3px]',
    };
  };

  const { outer: outerRadius, inner: innerRadius, inset: insetClass } = getRadiusClasses();

  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (tile.revealed || disabled) return;
    onTap(tile, e);
  };

  // 1. REVEALED STATE
  if (tile.revealed) {
    // A. BOMB
    if (tile.type === 'bomb') {
      if (tile.isDefused) {
        return (
          <div
            id={`kaboom-tile-${tile.id}`}
            className={`relative w-full aspect-square ${outerRadius} flex items-center justify-center border-2 border-emerald-400 bg-[#03150d]/90 shadow-[0_0_20px_rgba(16,185,129,0.8),inset_0_0_10px_rgba(16,185,129,0.45)] animate-pulse overflow-visible z-40 ${rippleClass}`}
            style={rippleStyle}
          >
            <div className={`absolute ${insetClass} ${innerRadius} border border-emerald-400/50 flex items-center justify-center bg-emerald-950/40 overflow-visible`}>
              {/* 3D DEFUSED BOMB SPRITE ABOVE TILE LAYER - UNCLIPPED & PULSING */}
              <div className="absolute -inset-2.5 sm:-inset-3 z-50 flex items-center justify-center select-none pointer-events-none overflow-visible">
                <div
                  className="absolute inset-2 rounded-full pointer-events-none opacity-70"
                  style={{
                    background: 'radial-gradient(circle, rgba(16,185,129,0.6) 20%, rgba(5,150,105,0.3) 55%, transparent 80%)',
                  }}
                />
                <img
                  src={bombImage || kaboomBombImg}
                  alt="Defused Bomb"
                  className="relative z-50 w-full h-full object-contain filter drop-shadow-[0_0_16px_rgba(16,185,129,0.95)] transform scale-150"
                  style={bombFilter ? { filter: `${bombFilter} drop-shadow(0 0 16px rgba(16,185,129,0.95))` } : undefined}
                />
              </div>
            </div>
          </div>
        );
      }

      return (
        <div
          id={`kaboom-tile-${tile.id}`}
          className={`relative w-full aspect-square ${outerRadius} flex items-center justify-center transition-all duration-300 overflow-visible ${
            tile.isDetonated
              ? 'z-50 border-2 border-red-500 bg-red-950/95 shadow-[0_0_30px_rgba(239,68,68,0.95),inset_0_0_14px_rgba(239,68,68,0.6)] animate-bounce'
              : 'z-40 border border-red-500/60 bg-red-950/70 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
          } ${rippleClass}`}
          style={rippleStyle}
        >
          <div className={`absolute ${insetClass} ${innerRadius} border border-red-500/60 flex items-center justify-center bg-black/40 overflow-visible`}>
            {tile.isDetonated && (
              <div className="absolute inset-0 rounded-[inherit] bg-red-600/20 animate-ping opacity-75 pointer-events-none" />
            )}
            {/* 3D CYBER BOMB SPRITE ABOVE TILE LAYER - UNCLIPPED FUSE & SPARKS BOUNCING */}
            <div
              className={`absolute -inset-3 sm:-inset-4 z-50 flex items-center justify-center select-none pointer-events-none overflow-visible ${
                tile.isDetonated ? 'animate-bounce' : ''
              }`}
            >
              {/* Detonation Aura */}
              <div
                className="absolute inset-2.5 rounded-full pointer-events-none"
                style={{
                  background: tile.isDetonated
                    ? 'radial-gradient(circle, rgba(239,68,68,0.75) 20%, rgba(236,72,153,0.4) 50%, transparent 80%)'
                    : 'radial-gradient(circle, rgba(239,68,68,0.4) 20%, rgba(147,51,234,0.3) 50%, transparent 80%)',
                }}
              />
              <img
                src={bombImage || kaboomBombImg}
                alt="Cyber Bomb"
                className={`relative z-50 w-full h-full object-contain transform scale-150 ${
                  tile.isDetonated
                    ? 'filter drop-shadow-[0_0_24px_rgba(239,68,68,1)] brightness-115'
                    : 'filter drop-shadow-[0_0_14px_rgba(239,68,68,0.85)]'
                }`}
                style={bombFilter ? { filter: bombFilter } : undefined}
              />
            </div>
          </div>
        </div>
      );
    }

    // B. BONUS: Double rounded frame matching bomb and ball, with glowing tier frame
    if (tile.type === 'bonus') {
      const bonus = tile.bonusItem;
      const starReward = bonus?.starReward || 15;
      const tierColor = bonus?.accentColor || '#00f0ff';
      const isAutoRevealed = Boolean(tile.isAutoRevealed);

      // Auto-revealed bonus after bomb detonation: DO NOT show +amount star and DO NOT glow
      if (isAutoRevealed) {
        return (
          <div
            id={`kaboom-tile-${tile.id}`}
            className={`relative w-full aspect-square ${outerRadius} flex items-center justify-center border border-zinc-700/60 bg-[#12141a] select-none ${rippleClass}`}
            style={rippleStyle}
          >
            {/* Inner Rounded Frame - subdued with no neon glow or bounce */}
            <div
              className={`absolute ${insetClass} ${innerRadius} border border-zinc-700/40 bg-zinc-950/70 flex items-center justify-center overflow-hidden`}
            >
              <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/[0.06] to-transparent pointer-events-none rounded-t-[inherit]" />
              <div className="relative z-10 w-full h-full flex items-center justify-center overflow-hidden p-0.5">
                {bonus ? (
                  <img
                    src={bonus.image}
                    alt={bonus.name}
                    className="relative z-10 w-[80%] h-[80%] object-contain select-none pointer-events-none opacity-60 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
                  />
                ) : (
                  <Star className="relative z-10 w-1/2 h-1/2 fill-zinc-600 text-zinc-500 opacity-60" />
                )}
              </div>
            </div>
          </div>
        );
      }

      return (
        <div
          id={`kaboom-tile-${tile.id}`}
          className={`relative w-full aspect-square ${outerRadius} flex items-center justify-center border-2 animate-bonus-tile-bounce select-none ${rippleClass}`}
          style={{
            borderColor: tierColor,
            background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.85) 0%, rgba(2, 6, 23, 0.95) 100%)',
            boxShadow: `0 0 16px ${tierColor}, 0 0 28px ${tierColor}40, inset 0 0 10px ${tierColor}50`,
            ...rippleStyle,
          }}
        >
          {/* Inner Rounded Frame - exact same double rounded frame as bomb & ball */}
          <div
            className={`absolute ${insetClass} ${innerRadius} border flex items-center justify-center overflow-hidden`}
            style={{
              borderColor: `${tierColor}80`,
              background: 'radial-gradient(circle at 50% 40%, rgba(30, 41, 59, 0.6) 0%, rgba(2, 6, 23, 0.85) 100%)',
              boxShadow: `inset 0 0 10px ${tierColor}30`,
            }}
          >
            {/* Specular White Gloss Reflection on top of inner chamber */}
            <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/[0.15] to-transparent pointer-events-none rounded-t-[inherit]" />

            {/* Central Flashy Smooth Glowing Bonus Artwork / Sprite - Larger & Prominent */}
            <div className="relative z-10 w-full h-full flex items-center justify-center overflow-hidden p-0.5">
              {/* Smooth hardware-accelerated radial aura behind the sprite */}
              <div
                className="absolute inset-0 rounded-full pointer-events-none blur-md animate-sprite-aura-pulse"
                style={{
                  background: `radial-gradient(circle, ${tierColor} 50%, transparent 75%)`,
                }}
              />

              {bonus ? (
                <img
                  src={bonus.image}
                  alt={bonus.name}
                  className="relative z-10 w-[96%] h-[96%] sm:w-[98%] sm:h-[98%] object-contain select-none pointer-events-none animate-sprite-flashy-glow scale-110 sm:scale-115"
                  style={{
                    ['--sprite-tier-color' as any]: tierColor,
                  }}
                />
              ) : (
                <img
                  src={currencyStarImg}
                  alt="Bonus Star"
                  className="relative z-10 w-2/3 h-2/3 object-contain animate-sprite-flashy-glow"
                  style={{
                    ['--sprite-tier-color' as any]: '#fbbf24',
                  }}
                />
              )}
            </div>

            {/* Golden Yellow Glowing Pill Badge at Bottom */}
            <div className="absolute bottom-1 sm:bottom-1.5 inset-x-0 mx-auto z-20 flex justify-center pointer-events-none">
              <div className="px-2 sm:px-2.5 py-0.5 rounded-full bg-black/90 border border-yellow-400/90 flex items-center gap-1 shadow-[0_0_10px_rgba(255,234,0,0.85)] animate-gold-pill-pulse">
                <img src={currencyStarImg} alt="Stars" className="w-2.5 h-2.5 sm:w-3 sm:h-3 object-contain" />
                <span className="font-header font-black text-[10px] sm:text-xs text-white tracking-wider leading-none">
                  +{starReward}
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // C. SAFE TILE REVEALED: Appears faded gray instead of green with tick
    return (
      <div
        id={`kaboom-tile-${tile.id}`}
        className={`relative w-full aspect-square ${outerRadius} flex items-center justify-center border border-zinc-700/60 bg-zinc-900/75 shadow-[inset_0_2px_6px_rgba(0,0,0,0.6)] opacity-65 transition-all duration-200 ${rippleClass}`}
        style={rippleStyle}
      >
        <div
          className={`absolute ${insetClass} ${innerRadius} border border-zinc-700/40 bg-zinc-800/40 backdrop-blur-xs flex items-center justify-center`}
        >
          <div className="w-[36%] h-[36%] rounded-full bg-zinc-600/40 border border-zinc-500/20 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]" />
        </div>
      </div>
    );
  }

  // 2. UNREVEALED BUT GAME OVER (Ghost state)
  if (isGameOver) {
    return (
      <div
        id={`kaboom-tile-${tile.id}`}
        className={`relative w-full aspect-square ${outerRadius} flex items-center justify-center opacity-55 border border-zinc-700/50 bg-zinc-900/40 ${
          tile.type === 'bomb' ? 'overflow-visible z-40' : 'overflow-hidden'
        } ${rippleClass}`}
        style={rippleStyle}
      >
        <div
          className={`absolute ${insetClass} ${innerRadius} border border-zinc-700/40 flex items-center justify-center ${
            tile.type === 'bomb' ? 'overflow-visible' : 'overflow-hidden'
          } bg-black/40`}
        >
          {tile.type === 'bonus' && (
            <div className="relative w-full h-full flex flex-col items-center justify-center p-0.5">
              {tile.bonusItem ? (
                <img
                  src={tile.bonusItem.image}
                  alt={tile.bonusItem.name}
                  className="w-[82%] h-[82%] object-contain rounded-[inherit] opacity-60 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
                />
              ) : (
                <Star className="w-1/2 h-1/2 text-zinc-500 opacity-60" />
              )}
            </div>
          )}
          {tile.type === 'bomb' && (
            <div className="absolute -inset-2 sm:-inset-2.5 z-50 flex items-center justify-center opacity-90 select-none pointer-events-none overflow-visible">
              <img
                src={bombImage || kaboomBombImg}
                alt="Cyber Bomb"
                className="relative z-50 w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(239,68,68,0.85)] transform scale-150"
                style={bombFilter ? { filter: bombFilter } : undefined}
              />
            </div>
          )}
          {tile.type === 'safe' && (
            <div className="w-[50%] h-[50%] rounded-full border border-zinc-600/40 bg-zinc-800/50" />
          )}
        </div>
      </div>
    );
  }

  // 3. UNREVEALED: TACTILE GRAY GRID TILE WITH 3D BALL SPRITE SITTING ON IT
  // Ordered zig-zag breathing wave from top to bottom:
  // Row 0 (top): left to right (col 0, 1, 2, ...)
  // Row 1: right to left (col D-1, D-2, ..., 0)
  // Row 2: left to right (col 0, 1, 2, ...)
  // Row 3: right to left ...
  const isEvenRow = tile.row % 2 === 0;
  const zigZagCol = isEvenRow ? tile.col : dimension - 1 - tile.col;
  const zigZagIndex = tile.row * dimension + zigZagCol;
  const totalTiles = dimension * dimension;
  const stepMs = Math.round(2400 / totalTiles);
  const breathingDelay = `-${(totalTiles - zigZagIndex) * stepMs}ms`;

  return (
    <div
      id={`kaboom-tile-${tile.id}`}
      className={`relative w-full aspect-square ${outerRadius} flex items-center justify-center select-none overflow-hidden ${
        isAlternate
          ? 'border-[2px] sm:border-[2.5px] border-zinc-500/80 bg-[#15171c]'
          : 'border-[2px] sm:border-[2.5px] border-zinc-600/80 bg-[#0f1114]'
      } ${rippleClass}`}
      style={rippleStyle}
    >
      {/* Outer Recessed Bevel / Inner Chamber Border */}
      <div
        className={`absolute ${insetClass} ${innerRadius} border ${
          isAlternate
            ? 'border-zinc-400/50 shadow-[inset_0_0_8px_rgba(0,0,0,0.6)] bg-gradient-to-b from-[#22252c] via-[#14161b] to-[#0a0b0e]'
            : 'border-zinc-500/40 shadow-[inset_0_0_8px_rgba(0,0,0,0.7)] bg-gradient-to-b from-[#1a1c22] via-[#101115] to-[#07080a]'
        } flex items-center justify-center overflow-hidden`}
      >
        {/* Deep Perspective Ambient Radial Glow in center cavity */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            background: isAlternate
              ? 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.02) 65%, transparent 85%)'
              : 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.01) 65%, transparent 85%)',
          }}
        />

        {/* Gloss Reflection across upper half of tile */}
        <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/[0.14] to-transparent pointer-events-none rounded-t-[inherit]" />

        {/* Drop shadow cast by the ball onto the tile floor */}
        <div
          className="absolute bottom-[9%] w-[58%] h-[16%] rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)',
          }}
        />
      </div>

      {/* 3D TACTILE CYBER BALL SPRITE WITH NEON HORIZONTAL STRIPES & IDLE BREATHING */}
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        aria-label={`Tap ball at row ${tile.row + 1}, column ${tile.col + 1}`}
        className="group relative z-10 w-[80%] h-[80%] rounded-full flex items-center justify-center cursor-pointer select-none transition-transform duration-100 transform active:scale-90 hover:scale-105 focus:outline-none"
      >
        {/* Ambient Neon Back-glow with synchronized zig-zag breathing */}
        <div
          className="absolute -inset-1 rounded-full pointer-events-none opacity-50 group-hover:opacity-90 transition-opacity animate-ball-glow-breathing"
          style={{
            background: 'radial-gradient(circle, rgba(0, 240, 255, 0.45) 25%, rgba(236, 72, 153, 0.25) 55%, transparent 75%)',
            animationDelay: breathingDelay,
          }}
        />

        {/* 3D Cyber Ball Sprite Image (RGBA PNG) with Zig-Zag Breathing Animation */}
        <div
          className="relative z-10 w-full h-full flex items-center justify-center animate-ball-idle-breathing pointer-events-none"
          style={{
            animationDelay: breathingDelay,
          }}
        >
          <img
            src={ballImage || kaboomBallImg}
            alt="Cyber Ball"
            className="w-full h-full object-contain select-none pointer-events-none group-hover:brightness-115 group-hover:scale-105 transition-all"
            style={{
              filter: ballFilter
                ? `${ballFilter} drop-shadow(0 5px 12px rgba(0,0,0,0.9))`
                : 'drop-shadow(0 5px 12px rgba(0,0,0,0.9))',
            }}
          />
        </div>

        {/* Neon interactive hover rim halo */}
        <div className="absolute -inset-0.5 rounded-full border border-cyan-400/50 opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_10px_rgba(0,240,255,0.6)] pointer-events-none" />
      </button>
    </div>
  );
};

export const KaboomBall = React.memo(KaboomBallComponent, (prevProps, nextProps) => {
  return (
    prevProps.tile === nextProps.tile &&
    prevProps.dimension === nextProps.dimension &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.isGameOver === nextProps.isGameOver &&
    prevProps.rippleDelay === nextProps.rippleDelay &&
    prevProps.ballImage === nextProps.ballImage &&
    prevProps.ballFilter === nextProps.ballFilter &&
    prevProps.bombImage === nextProps.bombImage &&
    prevProps.bombFilter === nextProps.bombFilter
  );
});

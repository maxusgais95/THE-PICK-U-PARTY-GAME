/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Sparkles,
  Star,
  ArrowRight,
  Crosshair,
  RotateCcw,
  FastForward,
  Radio,
  ShieldAlert,
  Zap,
  Wine,
  Flame,
  Eye,
  Mic,
  VolumeX,
  HeartHandshake,
  Crown,
  Swords,
  Camera,
  Search,
  Bot,
} from 'lucide-react';
import { KaboomCommand, KaboomBonusItem } from '../../types';
import { SoundEngine, Haptics } from '../../lib/audio';
import currencyStarImg from '../../assets/images/Currency Star Sprite.png';

interface KaboomBonusModalProps {
  command: KaboomCommand;
  bonusItem?: KaboomBonusItem;
  playerName: string;
  onClaim: () => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Crosshair: <Crosshair className="w-8 h-8 text-amber-300" />,
  RotateCcw: <RotateCcw className="w-8 h-8 text-cyan-300" />,
  FastForward: <FastForward className="w-8 h-8 text-purple-300" />,
  Radio: <Radio className="w-8 h-8 text-emerald-300" />,
  ShieldAlert: <ShieldAlert className="w-8 h-8 text-blue-300" />,
  Zap: <Zap className="w-8 h-8 text-yellow-300" />,
  Wine: <Wine className="w-8 h-8 text-rose-300" />,
  Flame: <Flame className="w-8 h-8 text-orange-400" />,
  Eye: <Eye className="w-8 h-8 text-teal-300" />,
  Mic: <Mic className="w-8 h-8 text-fuchsia-300" />,
  Sparkles: <Sparkles className="w-8 h-8 text-yellow-300" />,
  VolumeX: <VolumeX className="w-8 h-8 text-indigo-300" />,
  HeartHandshake: <HeartHandshake className="w-8 h-8 text-pink-300" />,
  Crown: <Crown className="w-8 h-8 text-amber-400" />,
  Swords: <Swords className="w-8 h-8 text-red-400" />,
  Camera: <Camera className="w-8 h-8 text-sky-300" />,
  Search: <Search className="w-8 h-8 text-emerald-300" />,
  Bot: <Bot className="w-8 h-8 text-violet-300" />,
};

export const KaboomBonusModal: React.FC<KaboomBonusModalProps> = ({
  command,
  bonusItem,
  playerName,
  onClaim,
}) => {
  const handleClaim = () => {
    SoundEngine.playButtonClick();
    Haptics.buttonClick();
    onClaim();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#130924] via-[#0b0417] to-black border-2 border-amber-400/80 p-5 sm:p-6 shadow-[0_0_55px_rgba(245,158,11,0.45)] text-center animate-bonus-bounce">
        {/* Top Floating Glow Bonus Sprite / Icon with double rounded frame and glowing frame */}
        <div className="relative mx-auto -mt-14 mb-3 w-28 h-28 flex items-center justify-center select-none">
          {/* Outer Rounded Glow Frame */}
          <div
            className="relative w-full h-full rounded-2xl border-2 flex items-center justify-center"
            style={{
              borderColor: bonusItem?.accentColor || '#00f0ff',
              background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.85) 0%, rgba(2, 6, 23, 0.95) 100%)',
              boxShadow: `0 0 20px ${(bonusItem?.accentColor || '#00f0ff')}, 0 0 32px ${(bonusItem?.accentColor || '#00f0ff')}40, inset 0 0 12px ${(bonusItem?.accentColor || '#00f0ff')}50`,
            }}
          >
            {/* Inner Rounded Frame */}
            <div
              className="absolute inset-1.5 rounded-xl border flex items-center justify-center overflow-hidden"
              style={{
                borderColor: `${bonusItem?.accentColor || '#00f0ff'}80`,
                background: 'radial-gradient(circle at 50% 40%, rgba(30, 41, 59, 0.6) 0%, rgba(2, 6, 23, 0.85) 100%)',
                boxShadow: `inset 0 0 10px ${(bonusItem?.accentColor || '#00f0ff')}30`,
              }}
            >
              {/* Specular White Gloss Reflection */}
              <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/[0.15] to-transparent pointer-events-none rounded-t-[inherit]" />

              {/* Central Flashy Smooth Glowing Bonus Artwork / Sprite */}
              <div className="relative z-10 w-full h-full flex items-center justify-center overflow-hidden p-1.5">
                {/* Smooth hardware-accelerated radial aura behind the sprite */}
                <div
                  className="absolute inset-1 rounded-full pointer-events-none blur-md animate-sprite-aura-pulse"
                  style={{
                    background: `radial-gradient(circle, ${bonusItem?.accentColor || '#00f0ff'} 45%, transparent 75%)`,
                  }}
                />

                {bonusItem ? (
                  <img
                    src={bonusItem.image}
                    alt={bonusItem.name}
                    className="relative z-10 w-[80%] h-[80%] object-contain select-none pointer-events-none animate-sprite-flashy-glow"
                    style={{
                      ['--sprite-tier-color' as any]: bonusItem.accentColor,
                    }}
                  />
                ) : (
                  <div className="relative z-10 w-full h-full rounded-[inherit] bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 flex items-center justify-center">
                    {ICON_MAP[command.icon] || <Star className="w-10 h-10 text-slate-950 fill-current" />}
                  </div>
                )}
              </div>

              {/* Golden pill badge matching reference */}
              <div className="absolute bottom-1.5 inset-x-0 mx-auto w-max px-2.5 py-0.5 rounded-full bg-black/90 border border-yellow-400/90 flex items-center gap-1 shadow-[0_0_10px_rgba(255,234,0,0.85)] animate-gold-pill-pulse">
                <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                <span className="font-header font-black text-[11px] text-white leading-none">
                  +{bonusItem?.starReward || 15}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Rank Badge & Star Reward Capsule */}
        {bonusItem && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
            <span
              className={`px-3 py-0.5 rounded-full border text-[11px] font-header font-black uppercase tracking-wider ${bonusItem.badgeBg}`}
            >
              RANK {bonusItem.rank} • {bonusItem.rankName}
            </span>
            <span className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/60 text-amber-300 font-header font-black text-xs shadow-[0_0_12px_rgba(251,191,36,0.4)] animate-glow-pulse">
              <img src={currencyStarImg} alt="Stars" className="w-3.5 h-3.5 object-contain" />
              +{bonusItem.starReward} STARS
            </span>
          </div>
        )}

        {/* Bonus Name & Tagline */}
        {bonusItem && (
          <div className="mb-2">
            <h3 className="font-header text-2xl font-black text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.4)]">
              {bonusItem.name}
            </h3>
            <p className="font-subbody text-xs text-purple-200/80 italic">
              "{bonusItem.tagline}"
            </p>
          </div>
        )}

        {/* Player Name Callout */}
        <div className="font-subbody text-xs sm:text-sm font-medium text-purple-200/90 mb-2">
          Discovered by <span className="text-amber-300 font-bold">{playerName}</span>!
        </div>

        {/* Command Card (Title + Description) */}
        <div className="bg-slate-950/80 border border-purple-400/30 rounded-2xl p-3.5 mb-5 text-left shadow-inner">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="font-header text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-400">
              {command.title}
            </div>
            <span className="shrink-0 px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-[10px] font-header font-bold text-purple-300 uppercase tracking-widest">
              {command.tag}
            </span>
          </div>
          <div className="font-body text-gray-200 text-xs sm:text-sm font-medium leading-relaxed">
            {command.description}
          </div>
        </div>

        {/* Action Button */}
        <button
          id="kaboom-bonus-claim-button"
          type="button"
          onClick={handleClaim}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-header font-black text-base sm:text-lg shadow-[0_0_25px_rgba(245,158,11,0.6)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer animate-glow-pulse"
        >
          <span className="flex items-center gap-1.5">
            {bonusItem ? (
              <>
                <span>CLAIM +{bonusItem.starReward}</span>
                <img src={currencyStarImg} alt="Stars" className="w-5 h-5 object-contain" />
                <span>STARS & CONTINUE</span>
              </>
            ) : (
              'CLAIM & CONTINUE'
            )}
          </span>
          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};

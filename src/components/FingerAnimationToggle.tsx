/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Check, Zap, Heart, Droplets, Flame, SunMedium } from 'lucide-react';
import { AppSettings, FingerAnimationSettings } from '../types';
import { SoundEngine, Haptics } from '../lib/audio';

interface FingerAnimationToggleProps {
  settings: AppSettings;
  onUpdateSettings?: (settings: Partial<AppSettings>) => void;
}

const DEFAULT_ANIM_SETTINGS: FingerAnimationSettings = {
  springPop: true,
  tensionPulse: true,
  squish: true,
  outcomeReveal: true,
  pastelAura: true,
};

export const FingerAnimationToggle: React.FC<FingerAnimationToggleProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const anim = settings.fingerAnimation || DEFAULT_ANIM_SETTINGS;

  // Check if all are active or partially active
  const activeCount = Object.values(anim).filter(Boolean).length;
  const isAnyActive = activeCount > 0;
  const isAllActive = activeCount === 5;

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const toggleOption = (key: keyof FingerAnimationSettings) => {
    SoundEngine.playButtonClick();
    Haptics.buttonClick();
    const updated: FingerAnimationSettings = {
      ...anim,
      [key]: !anim[key],
    };
    onUpdateSettings?.({ fingerAnimation: updated });
  };

  const applyPreset = (preset: 'all' | 'tension' | 'jelly' | 'minimal') => {
    SoundEngine.playButtonClick();
    Haptics.buttonClick();

    let updated: FingerAnimationSettings;
    if (preset === 'all') {
      updated = {
        springPop: true,
        tensionPulse: true,
        squish: true,
        outcomeReveal: true,
        pastelAura: true,
      };
    } else if (preset === 'tension') {
      updated = {
        springPop: true,
        tensionPulse: true,
        squish: false,
        outcomeReveal: true,
        pastelAura: true,
      };
    } else if (preset === 'jelly') {
      updated = {
        springPop: true,
        tensionPulse: false,
        squish: true,
        outcomeReveal: false,
        pastelAura: true,
      };
    } else {
      // minimal flat
      updated = {
        springPop: false,
        tensionPulse: false,
        squish: false,
        outcomeReveal: false,
        pastelAura: false,
      };
    }

    onUpdateSettings?.({ fingerAnimation: updated });
  };

  const toggleMaster = () => {
    SoundEngine.playButtonClick();
    Haptics.buttonClick();
    const nextState = !isAllActive;
    onUpdateSettings?.({
      fingerAnimation: {
        springPop: nextState,
        tensionPulse: nextState,
        squish: nextState,
        outcomeReveal: nextState,
        pastelAura: nextState,
      },
    });
  };

  const toggleItems: {
    key: keyof FingerAnimationSettings;
    label: string;
    description: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: 'springPop',
      label: 'Spring Touchdown Pop',
      description: 'Elastic bounce & dissipation ripple on touch down',
      icon: <Zap className="w-3.5 h-3.5 text-amber-300" />,
    },
    {
      key: 'tensionPulse',
      label: 'Tension Acceleration',
      description: 'Breathing tempo tightens with countdown pitch',
      icon: <Heart className="w-3.5 h-3.5 text-pink-300" />,
    },
    {
      key: 'squish',
      label: 'Liquid Drag Squish',
      description: 'Fluid jelly stretch on finger slide & drift',
      icon: <Droplets className="w-3.5 h-3.5 text-cyan-300" />,
    },
    {
      key: 'outcomeReveal',
      label: 'Outcome Reveal Pop',
      description: 'Suspense freeze & explosive reveal shockwave',
      icon: <Flame className="w-3.5 h-3.5 text-rose-400" />,
    },
    {
      key: 'pastelAura',
      label: 'Pastel Floating Aura',
      description: 'Soft blurred matching ambient underglow',
      icon: <SunMedium className="w-3.5 h-3.5 text-purple-300" />,
    },
  ];

  return (
    <div className="relative inline-block" ref={menuRef}>
      {/* Top Right Header Toggle Button */}
      <button
        type="button"
        onClick={() => {
          SoundEngine.playButtonClick();
          Haptics.buttonClick();
          setIsOpen((prev) => !prev);
        }}
        aria-label="Finger Indicator Animation Options"
        title="Finger Indicator Animations (Click to toggle FX)"
        className={`w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-[14px] sm:rounded-[16px] backdrop-blur-md border shadow-[0_0_12px_rgba(168,85,247,0.3)] flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none relative ${
          isOpen
            ? 'bg-purple-900/80 border-purple-300 text-purple-100 shadow-[0_0_16px_rgba(168,85,247,0.6)]'
            : isAnyActive
            ? 'bg-purple-950/70 border-purple-400/60 text-purple-200 hover:border-purple-300'
            : 'bg-black/50 border-purple-400/30 text-gray-400'
        }`}
      >
        <Sparkles
          className={`w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.2] transition-colors ${
            isAnyActive
              ? 'text-purple-300 drop-shadow-[0_0_8px_rgba(168,85,247,0.9)]'
              : 'text-gray-400'
          }`}
        />

        {/* Small Active Count Badge */}
        {isAnyActive && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-[10px] font-black text-white flex items-center justify-center shadow-[0_0_8px_rgba(236,72,153,0.8)] border border-black/40">
            {activeCount}
          </span>
        )}
      </button>

      {/* Floating Popover Options Panel */}
      {isOpen && (
        <div className="absolute top-12 right-0 w-72 sm:w-80 bg-zinc-950/95 backdrop-blur-2xl border border-purple-400/40 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.85),0_0_24px_rgba(168,85,247,0.25)] p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150 select-none">
          {/* Header Row */}
          <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="font-header text-xs font-black uppercase tracking-wider text-white">
                Finger Animation FX
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleMaster}
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-purple-300 transition-colors"
              >
                {isAllActive ? 'Disable All' : 'Enable All'}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-5 h-5 rounded-md hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Presets Row */}
          <div className="py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => applyPreset('all')}
              className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all shrink-0 ${
                isAllActive
                  ? 'bg-purple-600/30 border-purple-400 text-purple-200 shadow-[0_0_8px_rgba(168,85,247,0.4)]'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              All FX
            </button>
            <button
              type="button"
              onClick={() => applyPreset('tension')}
              className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all shrink-0 ${
                anim.tensionPulse && anim.springPop && !anim.squish
                  ? 'bg-pink-600/30 border-pink-400 text-pink-200 shadow-[0_0_8px_rgba(244,114,182,0.4)]'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              Tension
            </button>
            <button
              type="button"
              onClick={() => applyPreset('jelly')}
              className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all shrink-0 ${
                anim.squish && !anim.tensionPulse
                  ? 'bg-cyan-600/30 border-cyan-400 text-cyan-200 shadow-[0_0_8px_rgba(34,211,238,0.4)]'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              Fluid Jelly
            </button>
            <button
              type="button"
              onClick={() => applyPreset('minimal')}
              className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all shrink-0 ${
                activeCount === 0
                  ? 'bg-zinc-700/40 border-zinc-500 text-zinc-200'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              Minimal
            </button>
          </div>

          {/* Granular Toggles List */}
          <div className="space-y-1.5 pt-1">
            {toggleItems.map((item) => {
              const active = anim[item.key];
              return (
                <div
                  key={item.key}
                  onClick={() => toggleOption(item.key)}
                  className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer active:scale-[0.98] ${
                    active
                      ? 'bg-white/[0.07] border-purple-500/40 hover:border-purple-400/60'
                      : 'bg-white/[0.02] border-white/5 hover:border-white/10 opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-2 pr-2 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-black/40 flex items-center justify-center shrink-0 border border-white/10">
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white tracking-wide truncate">
                        {item.label}
                      </div>
                      <div className="text-[10px] text-gray-400 truncate">
                        {item.description}
                      </div>
                    </div>
                  </div>

                  {/* Switch Pill */}
                  <div
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 flex items-center ${
                      active ? 'bg-purple-600 justify-end' : 'bg-zinc-700 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-md flex items-center justify-center">
                      {active ? (
                        <Check className="w-2.5 h-2.5 text-purple-700 stroke-[3]" />
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

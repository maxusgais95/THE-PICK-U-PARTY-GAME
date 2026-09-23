/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import currencyStarImg from '../assets/images/Currency Star Sprite.png';
import { SoundEngine, Haptics } from '../lib/audio';
import { EconomyState } from '../lib/economy';

interface CurrencyHudProps {
  stars: number;
  onOpenStore: () => void;
  onEconomyUpdated?: (state: EconomyState) => void;
  onRefillStars?: (amount: number) => void;
}

export const CurrencyHud: React.FC<CurrencyHudProps> = ({
  stars,
  onOpenStore,
}) => {
  const [isBeeping, setIsBeeping] = React.useState<boolean>(false);
  const [addedAmount, setAddedAmount] = React.useState<number | null>(null);

  React.useEffect(() => {
    let hideTimer: any = null;
    let beepTimer: any = null;

    const handleBeep = (event: Event) => {
      const customEvent = event as CustomEvent<{ stars?: number; totalStars?: number }>;
      const amount = customEvent.detail?.stars || 0;
      const explicitTotal = customEvent.detail?.totalStars;

      if (explicitTotal !== undefined && explicitTotal > 0) {
        setAddedAmount(explicitTotal);
      } else if (amount > 0) {
        setAddedAmount((prev) => (prev !== null ? prev + amount : amount));
      }

      setIsBeeping(true);
      clearTimeout(beepTimer);
      beepTimer = setTimeout(() => {
        setIsBeeping(false);
      }, 550);

      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        setAddedAmount(null);
      }, 1600);
    };

    window.addEventListener('currency-hud-beep', handleBeep);
    return () => {
      window.removeEventListener('currency-hud-beep', handleBeep);
      clearTimeout(hideTimer);
      clearTimeout(beepTimer);
    };
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    SoundEngine.playButtonClick();
    Haptics.buttonClick();
    onOpenStore();
  };

  return (
    <div className="relative pointer-events-auto flex items-center justify-center select-none">
      {/* Centered Top Star Currency Pill */}
      <button
        id="star-currency-hud"
        type="button"
        onClick={handleClick}
        className={`group relative flex items-center gap-1.5 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-black/60 backdrop-blur-md transition-all duration-200 cursor-pointer shrink-0 ${
          isBeeping
            ? 'scale-115 border-2 border-amber-300 bg-amber-950/80 shadow-[0_0_28px_rgba(255,230,0,0.95)]'
            : 'border border-amber-400/50 shadow-[0_0_14px_rgba(245,158,11,0.35)] hover:border-amber-300 active:scale-95'
        }`}
        title="Star Currency • Tap to open Party Store"
        aria-label={`Star balance: ${stars.toLocaleString()}`}
      >
        {/* Ambient Gold Radial Glow behind Star */}
        <div
          className={`absolute -left-1 w-6 h-6 rounded-full blur-md pointer-events-none transition-all ${
            isBeeping ? 'bg-amber-300/60 scale-150' : 'bg-amber-400/20 group-hover:bg-amber-400/35'
          }`}
        />

        {/* 3D Radiant Star Icon */}
        <div className="relative flex items-center justify-center shrink-0">
          <img
            src={currencyStarImg}
            alt="Party Star Currency"
            className={`w-4 h-4 sm:w-4.5 sm:h-4.5 object-contain drop-shadow-[0_0_8px_rgba(251,191,36,0.9)] transition-transform ${
              isBeeping ? 'scale-135 animate-spin-hyper' : 'hover:scale-110'
            }`}
          />
        </div>

        {/* Star Currency Balance */}
        <span
          className={`font-header font-bold text-xs sm:text-sm tracking-wider drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] leading-none pt-0.5 whitespace-nowrap transition-colors ${
            isBeeping ? 'text-amber-200 scale-105' : 'text-white'
          }`}
        >
          {stars.toLocaleString()}
        </span>
      </button>

      {/* Floating Star Currency Bonus Tag when Beeped */}
      {addedAmount !== null && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 pointer-events-none animate-bounce-in z-50">
          <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-header font-black text-[10px] tracking-wide shadow-[0_0_10px_rgba(251,191,36,0.9)] whitespace-nowrap flex items-center gap-0.5">
            +{addedAmount}
          </span>
        </div>
      )}
    </div>
  );
};

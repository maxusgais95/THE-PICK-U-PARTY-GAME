/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Star, Check, ShoppingBag, Sparkles, AlertCircle, Lock } from 'lucide-react';
import { ChampagneBottleIcon } from './ChampagneBottleIcon';
import kaboomBombImg from '../assets/images/bombs/Bomb Sprite.webp';
import kaboomBallImg from '../assets/images/balls/Ball Sprite.webp';
import currencyStarImg from '../assets/images/Currency Star Sprite.webp';
import {
  StoreCategory,
  StoreItem,
  getStoreCatalogue,
  EconomyState,
  purchaseItem,
  equipItem,
  DAY7_BUNDLE_BOMB_ID,
  DAY7_BUNDLE_BALL_ID,
} from '../lib/economy';
import { SoundEngine, Haptics } from '../lib/audio';
import { AppSettings, BottleBuiltinStyle } from '../types';

interface StoreModalProps {
  isOpen: boolean;
  economy: EconomyState;
  settings: AppSettings;
  onClose: () => void;
  onEconomyUpdated: (state: EconomyState) => void;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
}

const CATEGORIES: { id: StoreCategory; label: string;}[] = [
  { id: 'bottles', label: 'BOTTLES'},
  { id: 'bombs', label: 'BOMBS'},
  { id: 'balls', label: 'BALLS'},
  { id: 'accessories', label: 'SPECIAL'},
];

export const StoreModal: React.FC<StoreModalProps> = ({
  isOpen,
  economy,
  settings,
  onClose,
  onEconomyUpdated,
  onUpdateSettings,
}) => {
  const [activeCategory, setActiveCategory] = useState<StoreCategory>('bottles');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [catalogue, setCatalogue] = useState<Record<StoreCategory, StoreItem[]>>(() => getStoreCatalogue());

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<Record<StoreCategory, StoreItem[]>>;
      if (customEvent.detail) {
        setCatalogue(customEvent.detail);
      } else {
        setCatalogue(getStoreCatalogue());
      }
    };
    window.addEventListener('picku_store_catalogue_updated', handleUpdate);
    return () => window.removeEventListener('picku_store_catalogue_updated', handleUpdate);
  }, []);

  if (!isOpen) return null;

  const currentItems = catalogue[activeCategory] || [];

  const showToast = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 2800);
  };

  const handlePurchase = (item: StoreItem) => {
    const res = purchaseItem(item.id);
    if (res.success) {
      SoundEngine.playTeamDivisionChime();
      Haptics.touchSuccess();
      onEconomyUpdated(res.updatedState);

      // If this is a bottle item, update app settings directly
      if (item.category === 'bottles') {
        onUpdateSettings({
          bottleStyle: item.builtInBottleStyle || (item.id as any),
          selectedCustomSpriteId: null,
        });
      }

      showToast(`Successfully unlocked & equipped ${item.name}!`, 'success');
    } else {
      SoundEngine.playButtonClick();
      Haptics.buttonClick();
      showToast(res.message, 'error');
    }
  };

  const handleEquip = (item: StoreItem) => {
    SoundEngine.playButtonClick();
    Haptics.buttonClick();
    const res = equipItem(item.category, item.id);
    if (res.success) {
      onEconomyUpdated(res.updatedState);

      if (item.category === 'bottles') {
        onUpdateSettings({
          bottleStyle: item.builtInBottleStyle || (item.id as any),
          selectedCustomSpriteId: null,
        });
      }

      showToast(`Equipped ${item.name}!`, 'success');
    }
  };

  // Render stylized visual preview icon/graphics (real bottle skins + stylized graphics for other items)
  const renderItemVisual = (item: StoreItem) => {
    switch (item.iconType) {
      case 'bottle':
        if (item.image) {
          return (
            <div className="relative flex items-center justify-center w-full h-full p-2 overflow-hidden">
              <div className={`absolute w-20 h-20 rounded-full bg-gradient-to-tr ${item.accentGradient} opacity-30 blur-lg`} />
              <img
                src={item.image}
                alt={item.name}
                className="max-h-24 w-auto object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] transform -rotate-12 group-hover:rotate-0 group-hover:scale-105 transition-all duration-300 pointer-events-none"
                style={{ ...(item.cssFilter ? { filter: item.cssFilter } : {}), ...(item.image.endsWith('.webp') ? { mixBlendMode: 'screen' } : {}) }}
              />
            </div>
          );
        }
        return (
          <div className="relative flex items-center justify-center w-full h-full">
            <div className={`absolute w-16 h-16 rounded-full bg-gradient-to-tr ${item.accentGradient} opacity-30 blur-md`} />
            <ChampagneBottleIcon className="w-12 h-12 text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] transform -rotate-12 group-hover:rotate-0 transition-transform duration-300" />
          </div>
        );
      case 'bomb':
        return (
          <div className="relative flex items-center justify-center w-full h-full p-2 overflow-visible z-30">
            <div className={`absolute w-20 h-20 rounded-full bg-gradient-to-tr ${item.accentGradient} opacity-35 blur-lg pointer-events-none`} />
            <img
              src={item.image || kaboomBombImg}
              alt={item.name}
              className="relative z-30 max-h-20 sm:max-h-24 w-auto object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.85)] transform scale-150 group-hover:scale-[1.65] transition-all duration-300 pointer-events-none"
              style={item.cssFilter ? { filter: item.cssFilter } : undefined}
            />
          </div>
        );
      case 'ball':
        return (
          <div className="relative flex items-center justify-center w-full h-full p-2 overflow-hidden">
            <div className={`absolute w-20 h-20 rounded-full bg-gradient-to-tr ${item.accentGradient} opacity-35 blur-lg`} />
            <img
              src={item.image || kaboomBallImg}
              alt={item.name}
              className="max-h-20 sm:max-h-24 w-auto object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.85)] transform group-hover:scale-110 transition-all duration-300 pointer-events-none"
              style={item.cssFilter ? { filter: item.cssFilter } : undefined}
            />
          </div>
        );
      case "accessory":
        if (item.image) {
          return (
            <div className="relative flex items-center justify-center w-full h-full p-2 overflow-hidden">
              <div className={`absolute w-20 h-20 rounded-full bg-gradient-to-tr ${item.accentGradient} opacity-35 blur-lg`} />
              <img
                src={item.image}
                alt={item.name}
                className="max-h-20 sm:max-h-24 w-auto object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.85)] transform group-hover:scale-110 transition-all duration-300 pointer-events-none"
                style={item.cssFilter ? { filter: item.cssFilter } : undefined}
              />
            </div>
          );
        }
        return (
          <div className="relative flex items-center justify-center w-full h-full gap-2">
            <div className={`absolute w-20 h-20 rounded-full bg-gradient-to-tr ${item.accentGradient} opacity-40 blur-lg animate-pulse`} />
            {/* Pair of glowing star earrings */}
            <div className="relative flex items-center gap-3">
              <div className="flex flex-col items-center animate-bounce" style={{ animationDuration: "2.5s" }}>
                <div className="w-1.5 h-2 rounded-full border border-amber-300 bg-amber-200 shadow-sm" />
                <div className="w-0.5 h-2.5 bg-gradient-to-b from-amber-300 to-yellow-400" />
                <Star className="w-6 h-6 fill-amber-300 text-yellow-100 drop-shadow-[0_0_10px_rgba(251,191,36,0.95)]" />
              </div>
              <div className="flex flex-col items-center animate-bounce" style={{ animationDuration: "2.5s", animationDelay: "0.4s" }}>
                <div className="w-1.5 h-2 rounded-full border border-amber-300 bg-amber-200 shadow-sm" />
                <div className="w-0.5 h-2.5 bg-gradient-to-b from-amber-300 to-yellow-400" />
                <Star className="w-6 h-6 fill-amber-300 text-yellow-100 drop-shadow-[0_0_10px_rgba(251,191,36,0.95)]" />
              </div>
            </div>
          </div>
        );
      default:
        return <ShoppingBag className="w-10 h-10 text-white" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center pt-[max(2.25rem,calc(env(safe-area-inset-top)+1.25rem))] pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))] px-3 sm:px-4 bg-black/80 backdrop-blur-md animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        id="party-store-modal-container"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg h-[min(88vh,720px)] flex flex-col rounded-[28px] bg-gradient-to-b from-[#160b29]/95 via-[#0d071a]/95 to-black/95 border-2 border-purple-500/40 shadow-[0_0_50px_rgba(168,85,247,0.3)] overflow-hidden text-white"
      >
        {/* Toast Notification */}
        {notification && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 animate-bounce pointer-events-none">
            <div
              className={`px-4 py-2 rounded-full font-header font-bold text-xs shadow-lg backdrop-blur-md flex items-center gap-2 border ${
                notification.type === 'success'
                  ? 'bg-emerald-600/90 text-white border-emerald-300'
                  : 'bg-red-600/90 text-white border-red-300'
              }`}
            >
              <span>{notification.message}</span>
            </div>
          </div>
        )}

        {/* Top Header Bar */}
        <div className="relative px-5 pt-4 pb-3 border-b border-purple-500/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 via-pink-500 to-amber-500 flex items-center justify-center shadow-[0_0_15px_rgba(236,72,153,0.5)] border border-pink-300/60">
              <ShoppingBag className="w-5 h-5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
            </div>
            <div>
              <h2 className="font-header text-xl sm:text-2xl font-bold tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-pink-300 to-purple-300 leading-none">
                PARTY STORE
              </h2>
              <div className="text-[11px] text-purple-200/70 mt-1 font-body">
                Customize your party game visuals
              </div>
            </div>
          </div>

          {/* Star Currency Balance In Header */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/60 shadow-[0_0_12px_rgba(245,158,11,0.4)]">
              <img src={currencyStarImg} alt="Stars" className="w-4 h-4 object-contain drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
              <span className="font-header font-bold text-xs sm:text-sm text-amber-200 tracking-wider">
                {economy.stars.toLocaleString()}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                SoundEngine.playButtonClick();
                Haptics.buttonClick();
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-gray-300 hover:text-white transition-all active:scale-95 cursor-pointer"
              aria-label="Close Store"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center justify-around px-2 py-2.5 bg-neutral-950/60 border-b border-white/10 overflow-x-auto shrink-0">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  SoundEngine.playButtonClick();
                  Haptics.buttonClick();
                  setActiveCategory(cat.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-header font-bold tracking-wider uppercase transition-all whitespace-nowrap active:scale-95 ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.5)] border border-pink-300'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Store Grid Items */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
            {currentItems.map((item) => {
              const isUnlocked = economy.unlockedItems.includes(item.id) || (item.id === 'accessory_star_earrings' && Boolean(economy.starEarrings?.unlocked));
              const isEquipped = (() => {
                if (item.category === 'bottles') {
                  if (settings.bottleStyle === 'custom') return false;
                  return (
                    economy.equippedSkins?.bottles === item.id ||
                    (Boolean(item.builtInBottleStyle) && settings.bottleStyle === item.builtInBottleStyle)
                  );
                }
                if (item.category === 'bombs') {
                  return (economy.equippedSkins?.bombs || 'bomb_classic_tnt') === item.id;
                }
                if (item.category === 'balls') {
                  return (economy.equippedSkins?.balls || 'ball_cyan_orbs') === item.id;
                }
                if (item.category === 'accessories') {
                  return (economy.equippedSkins?.accessories || '') === item.id;
                }
                return false;
              })();
              const canAfford = economy.stars >= item.price;
              const isDay7Exclusive =
                item.id === DAY7_BUNDLE_BOMB_ID ||
                item.id === DAY7_BUNDLE_BALL_ID ||
                item.badge === 'DAY 7 EXCLUSIVE';

              const isBomb = item.category === 'bomb';

              return (
                <div
                  key={item.id}
                  className={`group relative rounded-[22px] p-3 sm:p-3.5 bg-neutral-900/60 backdrop-blur-md border transition-all flex flex-col justify-between ${
                    isBomb ? 'overflow-visible z-10 hover:z-30' : ''
                  } ${
                    isEquipped
                      ? 'border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                      : isUnlocked
                      ? 'border-purple-400/40 hover:border-purple-300'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Ribbon Badge */}
                  {item.badge && (
                    <div className="absolute -top-1.5 right-3 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-[9px] font-header font-bold text-white tracking-widest uppercase shadow-sm border border-yellow-200/50">
                      {item.badge}
                    </div>
                  )}

                  {/* Top Item Info */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-[9px] font-header font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        item.rarity === 'Legendary'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-400/50'
                          : item.rarity === 'Epic'
                          ? 'bg-purple-500/20 text-purple-300 border-purple-400/50'
                          : item.rarity === 'Rare'
                          ? 'bg-blue-500/20 text-blue-300 border-blue-400/50'
                          : 'bg-white/10 text-gray-300 border-white/20'
                      }`}
                    >
                      {item.rarity}
                    </span>

                    {/* Price in Stars or Day 7 Exclusive Tag */}
                    <div className="flex items-center gap-1 font-header font-bold text-xs text-amber-300">
                      {isDay7Exclusive && !isUnlocked ? (
                        <span className="text-amber-300 text-[10px] font-header font-bold flex items-center gap-1">
                          <Lock className="w-3 h-3 text-amber-400" /> DAY 7 REWARD
                        </span>
                      ) : item.price === 0 ? (
                        <span className="text-cyan-300 text-[10px]">FREE</span>
                      ) : (
                        <>
                          <img src={currencyStarImg} alt="Stars" className="w-3.5 h-3.5 object-contain" />
                          <span>{item.price}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Item Visual Display Pedestal */}
                  <div
                    className={`relative w-full h-24 sm:h-28 rounded-xl bg-black/40 border border-white/10 ${
                      isBomb ? 'overflow-visible z-20' : 'overflow-hidden'
                    } flex flex-col items-center justify-center p-2 mb-2 group-hover:border-white/25 transition-all`}
                  >
                    {renderItemVisual(item)}
                  </div>

                  {/* Name & Flavor text */}
                  <div className="text-center mb-2">
                    <h3 className="font-header text-xs sm:text-sm font-bold text-white tracking-wide truncate">
                      {item.name}
                    </h3>
                    <p className="text-[10px] text-gray-400 font-body line-clamp-1 mt-0.5">
                      {item.subtitle}
                    </p>
                  </div>

                  {/* Special Mastery Conditions Box for Star Earrings */}
                  {item.id === 'accessory_star_earrings' && (
                    <div className="w-full mb-2.5 p-2 rounded-xl bg-black/60 border border-amber-400/30 text-left space-y-1">
                      <div className="text-[9px] font-bold text-amber-300 uppercase tracking-wider flex items-center justify-between border-b border-amber-400/20 pb-1">
                        <span>Mastery Conditions</span>
                        <span className="text-[8px] text-amber-200">
                          {[
                            economy.starEarrings?.bombVictory,
                            economy.starEarrings?.bottleSpin,
                            economy.starEarrings?.fingerGame,
                          ].filter(Boolean).length}/3
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-gray-300">Bomb Victory</span>
                        {economy.starEarrings?.bombVictory ? (
                          <span className="text-emerald-400 font-bold">✓ Done</span>
                        ) : (
                          <span className="text-gray-500">Pending</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-gray-300">Bottle Spin</span>
                        {economy.starEarrings?.bottleSpin ? (
                          <span className="text-emerald-400 font-bold">✓ Done</span>
                        ) : (
                          <span className="text-gray-500">Pending</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-gray-300">Finger Game</span>
                        {economy.starEarrings?.fingerGame ? (
                          <span className="text-emerald-400 font-bold">✓ Done</span>
                        ) : (
                          <span className="text-gray-500">Pending</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <div>
                    {isEquipped ? (
                      <div className="w-full py-1.5 rounded-full bg-cyan-950/60 border border-cyan-400/60 text-cyan-300 font-header font-bold text-xs tracking-wider flex items-center justify-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>EQUIPPED</span>
                      </div>
                    ) : (isUnlocked || (item.id === 'accessory_star_earrings' && economy.starEarrings?.unlocked)) ? (
                      <button
                        type="button"
                        onClick={() => handleEquip(item)}
                        className="w-full py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-purple-400/50 text-purple-200 font-header font-bold text-xs tracking-wider active:scale-95 transition-all"
                      >
                        EQUIP
                      </button>
                    ) : isDay7Exclusive ? (
                      <button
                        type="button"
                        disabled
                        className="w-full py-1.5 px-1 rounded-full bg-amber-500/10 border border-amber-400/40 text-amber-300 font-header font-bold text-[10px] tracking-wider cursor-not-allowed flex items-center justify-center gap-1 shadow-sm"
                        title="Claim Day 7 Daily Login Reward to unlock!"
                      >
                        <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>DAY 7 LOGIN ONLY</span>
                      </button>
                    ) : item.id === 'accessory_star_earrings' ? (
                      <button
                        type="button"
                        disabled
                        className="w-full py-1.5 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 font-header font-bold text-[10px] tracking-wider cursor-not-allowed flex items-center justify-center gap-1"
                        title="Complete Bomb Victory, Bottle Spin & Finger Game to unlock!"
                      >
                        <Lock className="w-3 h-3 text-amber-400" />
                        <span>LOCKED (CONDITION)</span>
                      </button>
                    ) : canAfford ? (
                      <button
                        type="button"
                        onClick={() => handlePurchase(item)}
                        className="w-full py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 text-black font-header font-bold text-xs tracking-wider shadow-[0_0_12px_rgba(245,158,11,0.5)] border border-yellow-200 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                      >
                        <img src={currencyStarImg} alt="Stars" className="w-3.5 h-3.5 object-contain" />
                        <span>BUY {item.price}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="w-full py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-500 font-header font-bold text-xs tracking-wider cursor-not-allowed flex items-center justify-center gap-1.5"
                        title={`Requires ${item.price} Stars (Need ${item.price - economy.stars} more)`}
                      >
                        <Lock className="w-3 h-3 text-gray-500" />
                        <span className="flex items-center gap-1">
                          LOCKED ({item.price} <img src={currencyStarImg} alt="Stars" className="w-3 h-3 inline-block object-contain" />)
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

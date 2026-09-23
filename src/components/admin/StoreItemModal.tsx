/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Upload, Image as ImageIcon, Check, Star } from 'lucide-react';
import { StoreItem, StoreCategory } from '../../lib/economy';
import { SoundEngine, Haptics } from '../../lib/audio';
import { BOTTLE_SKINS } from '../../lib/bottleSkins';
import kaboomBombImg from '../../assets/images/Bomb Sprite.png';
import kaboomBallImg from '../../assets/images/Ball Sprite.png';

interface StoreItemModalProps {
  isOpen: boolean;
  item: StoreItem | null; // null means adding a new item
  defaultCategory?: StoreCategory;
  onClose: () => void;
  onSave: (item: StoreItem) => void;
}

const RARITY_OPTIONS: ('Common' | 'Rare' | 'Epic' | 'Legendary')[] = [
  'Common',
  'Rare',
  'Epic',
  'Legendary',
];

const CATEGORY_OPTIONS: { id: StoreCategory; label: string }[] = [
  { id: 'bottles', label: 'Bottles' },
  { id: 'bombs', label: 'Bombs' },
  { id: 'balls', label: 'Balls' },
  { id: 'accessories', label: 'Accessories' },
];

const CSS_FILTER_PRESETS: { label: string; filter: string }[] = [
  { label: 'Normal (None)', filter: '' },
  { label: 'Cyan Electric', filter: 'hue-rotate(185deg) saturate(1.8) brightness(1.2)' },
  { label: 'Hot Pink / Magenta', filter: 'hue-rotate(285deg) saturate(1.6) brightness(1.15)' },
  { label: 'Solar Amber / Gold', filter: 'hue-rotate(25deg) saturate(2.2) contrast(1.2) brightness(1.1)' },
  { label: 'Toxic Lime', filter: 'hue-rotate(65deg) saturate(2.2) brightness(1.2)' },
  { label: 'Glacial Cryo Blue', filter: 'hue-rotate(160deg) saturate(1.7) brightness(1.3)' },
  { label: 'Cosmic Violet', filter: 'hue-rotate(240deg) saturate(2.2) brightness(1.25)' },
  { label: 'Glitch Cyberpunk', filter: 'hue-rotate(315deg) saturate(2.5) contrast(1.2) brightness(1.2)' },
];

export const StoreItemModal: React.FC<StoreItemModalProps> = ({
  isOpen,
  item,
  defaultCategory = 'bottles',
  onClose,
  onSave,
}) => {
  const [category, setCategory] = useState<StoreCategory>(defaultCategory);
  const [name, setName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [rarity, setRarity] = useState<'Common' | 'Rare' | 'Epic' | 'Legendary'>('Common');
  const [badge, setBadge] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [cssFilter, setCssFilter] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (item) {
        setCategory(item.category);
        setName(item.name);
        setSubtitle(item.subtitle || '');
        setDescription(item.description || '');
        setPrice(item.price ?? 0);
        setRarity(item.rarity || 'Common');
        setBadge(item.badge || '');
        setImageUrl(item.image || '');
        setCssFilter(item.cssFilter || '');
      } else {
        setCategory(defaultCategory);
        setName('');
        setSubtitle('');
        setDescription('');
        setPrice(100);
        setRarity('Common');
        setBadge('');
        // Default preset image based on category
        if (defaultCategory === 'bottles') setImageUrl(BOTTLE_SKINS[0].image);
        else if (defaultCategory === 'bombs') setImageUrl(kaboomBombImg);
        else if (defaultCategory === 'balls') setImageUrl(kaboomBallImg);
        else setImageUrl('');
        setCssFilter('');
      }
      setValidationError(null);
    }
  }, [isOpen, item, defaultCategory]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setImageUrl(dataUrl);
        SoundEngine.playButtonClick();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setValidationError('Item name is required.');
      return;
    }

    if (price < 0 || isNaN(price)) {
      setValidationError('Price must be 0 or a positive number.');
      return;
    }

    // Determine gradients & glow based on rarity
    let accentGradient = 'from-zinc-400 to-zinc-600';
    let borderGlow = 'border-zinc-500/50';
    if (rarity === 'Rare') {
      accentGradient = 'from-cyan-400 to-blue-600';
      borderGlow = 'border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.4)]';
    } else if (rarity === 'Epic') {
      accentGradient = 'from-purple-400 to-fuchsia-600';
      borderGlow = 'border-purple-400/60 shadow-[0_0_15px_rgba(168,85,247,0.4)]';
    } else if (rarity === 'Legendary') {
      accentGradient = 'from-amber-400 via-orange-500 to-yellow-500';
      borderGlow = 'border-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.5)]';
    }

    const iconTypeMap: Record<StoreCategory, 'bottle' | 'bomb' | 'ball' | 'accessory'> = {
      bottles: 'bottle',
      bombs: 'bomb',
      balls: 'ball',
      accessories: 'accessory',
    };

    const newItem: StoreItem = {
      id: item?.id || `${category}_${Date.now()}`,
      category,
      name: trimmedName,
      subtitle: subtitle.trim(),
      description: description.trim(),
      price: Math.max(0, Math.floor(price)),
      rarity,
      badge: badge.trim() || undefined,
      accentGradient,
      borderGlow,
      iconType: iconTypeMap[category],
      image: imageUrl || undefined,
      cssFilter: cssFilter || undefined,
    };

    SoundEngine.playButtonClick();
    Haptics.buttonClick();
    onSave(newItem);
    onClose();
  };

  return (
    <div
      id="store-item-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center pt-[max(1rem,calc(env(safe-area-inset-top)+0.5rem))] pb-[max(1rem,calc(env(safe-area-inset-bottom)+0.5rem))] px-3 sm:px-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="store-item-modal-dialog"
        className="relative w-full max-w-2xl max-h-[calc(100vh-max(2rem,calc(env(safe-area-inset-top)+env(safe-area-inset-bottom)+1rem)))] bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl text-zinc-100 flex flex-col overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0 bg-zinc-900/90">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-zinc-100">
              {item ? `Edit Store Item: ${item.name}` : 'Add New Store Item'}
            </h3>
          </div>
          <button
            type="button"
            id="btn-close-store-item-modal"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
            {validationError && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/60 text-xs font-semibold text-red-300">
                {validationError}
              </div>
            )}

            {/* Live Preview Card (Side-by-side on desktop, stacked on mobile) */}
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 flex flex-col sm:flex-row items-center gap-4">
              <div className="w-24 h-24 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center p-2 relative overflow-hidden shrink-0">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="max-w-full max-h-full object-contain"
                    style={{ filter: cssFilter || undefined }}
                  />
                ) : (
                  <ImageIcon className="w-8 h-8 text-zinc-600" />
                )}
                {badge && (
                  <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-amber-500 text-black">
                    {badge}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {category}
                  </span>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      rarity === 'Legendary'
                        ? 'bg-amber-950 text-amber-300 border border-amber-600/60'
                        : rarity === 'Epic'
                        ? 'bg-purple-950 text-purple-300 border border-purple-600/60'
                        : rarity === 'Rare'
                        ? 'bg-blue-950 text-blue-300 border border-blue-600/60'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                    }`}
                  >
                    {rarity}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-zinc-100 truncate">
                  {name.trim() || 'Item Name Preview'}
                </h4>
                <p className="text-xs text-zinc-400 line-clamp-2 mt-0.5">
                  {description.trim() || 'Item description will appear here...'}
                </p>
                <div className="flex items-center justify-center sm:justify-start gap-1 mt-2 text-xs font-bold text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{price === 0 ? 'FREE / DEFAULT' : `${price} Stars`}</span>
                </div>
              </div>
            </div>

            {/* Grid Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Category
                </label>
                <select
                  id="store-item-category-select"
                  value={category}
                  onChange={(e) => {
                    const newCat = e.target.value as StoreCategory;
                    setCategory(newCat);
                    // Default image for new category if empty or preset
                    if (!item) {
                      if (newCat === 'bottles') setImageUrl(BOTTLE_SKINS[0].image);
                      else if (newCat === 'bombs') setImageUrl(kaboomBombImg);
                      else if (newCat === 'balls') setImageUrl(kaboomBallImg);
                    }
                  }}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 cursor-pointer"
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rarity */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Rarity Tier
                </label>
                <select
                  id="store-item-rarity-select"
                  value={rarity}
                  onChange={(e) => setRarity(e.target.value as any)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 cursor-pointer"
                >
                  {RARITY_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Item Name */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Item Name <span className="text-red-400">*</span>
                </label>
                <input
                  id="store-item-name-input"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Celestial Starlight Decider"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Subtitle / Edition Tagline
                </label>
                <input
                  id="store-item-subtitle-input"
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g. High Voltage Sunburst"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                />
              </div>

              {/* Price in Stars */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Price (Stars) <span className="text-zinc-500 text-[11px]">(0 = Free)</span>
                </label>
                <input
                  id="store-item-price-input"
                  type="number"
                  min="0"
                  step="50"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-zinc-500"
                />
              </div>

              {/* Custom Badge */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Card Badge <span className="text-zinc-500 text-[11px]">(Optional)</span>
                </label>
                <input
                  id="store-item-badge-input"
                  type="text"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value.toUpperCase())}
                  placeholder="e.g. NEW, POPULAR, VIP, HOT"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 uppercase"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Description
              </label>
              <textarea
                id="store-item-description-input"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this item's visual look, animation vibe, or rarity lore..."
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 resize-none"
              />
            </div>

            {/* Image & Appearance Section */}
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-zinc-400" />
                  <span>Item Artwork & Visual Styling</span>
                </label>
                <button
                  type="button"
                  id="btn-upload-item-image"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] font-semibold text-zinc-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Image File</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* Artwork presets selector */}
              <div>
                <span className="text-[11px] text-zinc-400 block mb-2">Preset Artwork:</span>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {BOTTLE_SKINS.map((skin, idx) => (
                    <button
                      key={skin.id}
                      type="button"
                      onClick={() => setImageUrl(skin.image)}
                      className={`p-1.5 rounded-lg border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        imageUrl === skin.image
                          ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300'
                          : 'border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <img src={skin.image} alt={`Bottle ${idx + 1}`} className="w-7 h-7 object-contain" />
                      <span className="text-[9px] font-medium truncate w-full text-center">
                        Btl {idx + 1}
                      </span>
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setImageUrl(kaboomBombImg)}
                    className={`p-1.5 rounded-lg border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      imageUrl === kaboomBombImg
                        ? 'border-red-400 bg-red-950/40 text-red-300'
                        : 'border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <img src={kaboomBombImg} alt="Bomb" className="w-7 h-7 object-contain" />
                    <span className="text-[9px] font-medium truncate w-full text-center">Bomb</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImageUrl(kaboomBallImg)}
                    className={`p-1.5 rounded-lg border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      imageUrl === kaboomBallImg
                        ? 'border-teal-400 bg-teal-950/40 text-teal-300'
                        : 'border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <img src={kaboomBallImg} alt="Ball" className="w-7 h-7 object-contain" />
                    <span className="text-[9px] font-medium truncate w-full text-center">Orb</span>
                  </button>
                </div>
              </div>

              {/* CSS Visual Filter Preset */}
              <div>
                <span className="text-[11px] text-zinc-400 block mb-1.5">
                  Color Filter / Glow Effect Preset:
                </span>
                <select
                  id="store-item-filter-select"
                  value={cssFilter}
                  onChange={(e) => setCssFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 cursor-pointer"
                >
                  {CSS_FILTER_PRESETS.map((preset, i) => (
                    <option key={i} value={preset.filter}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-800 bg-zinc-900/90 shrink-0">
            <button
              type="button"
              id="btn-cancel-store-item"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-750 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-save-store-item"
              className="px-5 py-2 rounded-xl text-xs font-bold text-zinc-950 bg-zinc-100 hover:bg-white shadow-lg active:scale-98 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{item ? 'Save Changes' : 'Create Item'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

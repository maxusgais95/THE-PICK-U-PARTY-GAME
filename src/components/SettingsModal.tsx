/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  Upload,
  Trash2,
  RotateCw,
  Sliders,
  BarChart2,
  Volume2,
  Check,
  Smartphone,
  Zap,
  Sparkles,
  Bomb,
  Trophy,
  Shield,
  ShoppingBag,
} from 'lucide-react';
import { ChampagneBottleIcon } from './ChampagneBottleIcon';
import {
  AppSettings,
  AppStats,
  BottleBuiltinStyle,
  BottleBlendMode,
  CustomBottleSprite,
} from '../types';
import { THEMES } from '../lib/themes';
import { SoundEngine, Haptics } from '../lib/audio';
import { saveCustomSprite, deleteCustomSprite, saveStats, resetAllStats, DEFAULT_KABOOM_STATS } from '../lib/db';
import { processSpriteImage } from '../lib/imageProcessing';
import { BOTTLE_SKINS } from '../lib/bottleSkins';
import { useTransparentImage } from '../lib/bottleAlphaCache';
import { ResetStatsConfirmModal } from './admin/ResetStatsConfirmModal';

const BottlePresetThumbnail: React.FC<{ image: string; alt: string }> = ({ image, alt }) => {
  const transparentSrc = useTransparentImage(image);
  return (
    <img
      src={transparentSrc || image}
      alt={alt}
      className="max-h-full max-w-full object-contain pointer-events-none transition-transform duration-200 group-hover:scale-105 select-none"
    />
  );
};

import { equipItem, EconomyState } from '../lib/economy';

interface SettingsModalProps {
  isOpen: boolean;
  settings: AppSettings;
  stats: AppStats;
  customSprites: CustomBottleSprite[];
  onClose: () => void;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onRefreshSprites: () => void;
  onRefreshStats: () => void;
  onOpenStore?: () => void;
  onOpenAdmin?: () => void;
  onEconomyUpdated?: (state: EconomyState) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  stats,
  customSprites,
  onClose,
  onUpdateSettings,
  onRefreshSprites,
  onRefreshStats,
  onOpenStore,
  onOpenAdmin,
  onEconomyUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'game' | 'bottle' | 'stats'>('game');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadBlendMode, setUploadBlendMode] = useState<BottleBlendMode>('screen');
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const currentTheme = THEMES[settings.theme] || THEMES['cyber-neon'];

  // Handle Custom Sprite Image Upload with selected blend mode
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const rawDataUrl = event.target?.result as string;
      if (rawDataUrl) {
        const processedDataUrl = await processSpriteImage(rawDataUrl, uploadBlendMode, 0);
        const newSprite: CustomBottleSprite = {
          id: `sprite-${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, '').slice(0, 16),
          dataUrl: processedDataUrl,
          originalDataUrl: rawDataUrl,
          createdAt: Date.now(),
          rotationOffset: 0,
          blendMode: uploadBlendMode,
        };

        await saveCustomSprite(newSprite);
        onUpdateSettings({
          bottleStyle: 'custom',
          selectedCustomSpriteId: newSprite.id,
        });
        const ecoRes = equipItem('bottles', `custom_${newSprite.id}`);
        if (ecoRes.success && onEconomyUpdated) {
          onEconomyUpdated(ecoRes.updatedState);
        }
        onRefreshSprites();
        SoundEngine.playButtonClick();
      }
      setIsUploading(false);
    };
    reader.onerror = () => setIsUploading(false);
    reader.readAsDataURL(file);
  };

  // Rotate custom sprite orientation
  const handleRotateSprite = async (sprite: CustomBottleSprite, e: React.MouseEvent) => {
    e.stopPropagation();
    SoundEngine.playButtonClick();
    const newRot = ((sprite.rotationOffset || 0) + 90) % 360;
    const baseSource = sprite.originalDataUrl || sprite.dataUrl;
    const processed = await processSpriteImage(baseSource, sprite.blendMode || 'normal', newRot);
    const updated: CustomBottleSprite = {
      ...sprite,
      dataUrl: processed,
      originalDataUrl: baseSource,
      rotationOffset: newRot,
    };
    await saveCustomSprite(updated);
    onRefreshSprites();
  };

  // Change custom sprite blend mode
  const handleChangeBlendMode = async (
    sprite: CustomBottleSprite,
    mode: BottleBlendMode,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    SoundEngine.playButtonClick();
    const baseSource = sprite.originalDataUrl || sprite.dataUrl;
    const processed = await processSpriteImage(baseSource, mode, sprite.rotationOffset || 0);
    const updated: CustomBottleSprite = {
      ...sprite,
      dataUrl: processed,
      originalDataUrl: baseSource,
      blendMode: mode,
    };
    await saveCustomSprite(updated);
    onRefreshSprites();
  };

  // Delete custom sprite
  const handleDeleteSprite = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    SoundEngine.playButtonClick();
    await deleteCustomSprite(id);
    if (settings.selectedCustomSpriteId === id) {
      onUpdateSettings({
        bottleStyle: 'btl_e_001',
        selectedCustomSpriteId: null,
      });
      const ecoRes = equipItem('bottles', 'bottle_btl_001');
      if (ecoRes.success && onEconomyUpdated) {
        onEconomyUpdated(ecoRes.updatedState);
      }
    }
    onRefreshSprites();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pt-[max(2.25rem,calc(env(safe-area-inset-top)+1.25rem))] pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))] px-3 sm:px-4 bg-black/85 backdrop-blur-xl animate-fadeIn">
      <div className="glass-panel relative w-full max-w-md h-[min(68vh,520px)] flex flex-col overflow-hidden shadow-2xl rounded-[26px]"
        style={{
          boxShadow: '0 24px 60px -10px rgba(0, 0, 0, 0.95), 0 0 30px rgba(255, 42, 133, 0.25)',
        }}
      >
        {/* Modal Header without Close 'X' Button (Done button in footer only) */}
        <div className="flex items-center justify-center px-5 pt-3.5 pb-2.5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-pink-400 drop-shadow-[0_0_8px_#ff2a85]" />
            <h2 className="font-header text-base font-bold uppercase tracking-widest text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              Settings & Rules
            </h2>
          </div>
        </div>

        {/* Tab Navigation (Rules, Bottle, Stats) */}
        <div className="grid grid-cols-3 gap-1.5 p-1.5 mx-3 sm:mx-4 mt-2.5 mb-1 bg-white/5 rounded-2xl border border-white/10 shrink-0">
          <button
            onClick={() => {
              SoundEngine.playButtonClick();
              setActiveTab('game');
            }}
            style={{
              backgroundColor: activeTab === 'game' ? `${currentTheme.primary}33` : 'transparent',
              color: activeTab === 'game' ? currentTheme.primary : '#9ca3af',
              borderColor: activeTab === 'game' ? currentTheme.primary : 'transparent',
              boxShadow: activeTab === 'game' ? `0 0 12px ${currentTheme.primary}55` : 'none',
            }}
            className="py-2 rounded-xl text-[11px] sm:text-xs font-header font-bold uppercase tracking-wider transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 border cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-white shrink-0" />
            <span>Rules</span>
          </button>

          <button
            onClick={() => {
              SoundEngine.playButtonClick();
              setActiveTab('bottle');
            }}
            style={{
              backgroundColor: activeTab === 'bottle' ? `${currentTheme.secondary}33` : 'transparent',
              color: activeTab === 'bottle' ? currentTheme.secondary : '#9ca3af',
              borderColor: activeTab === 'bottle' ? currentTheme.secondary : 'transparent',
              boxShadow: activeTab === 'bottle' ? `0 0 12px ${currentTheme.secondary}55` : 'none',
            }}
            className="py-2 rounded-xl text-[11px] sm:text-xs font-header font-bold uppercase tracking-wider transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 border cursor-pointer"
          >
            <ChampagneBottleIcon className="w-3.5 h-3.5 text-white fill-white shrink-0" />
            <span>Bottle</span>
          </button>

          <button
            onClick={() => {
              SoundEngine.playButtonClick();
              setActiveTab('stats');
            }}
            style={{
              backgroundColor: activeTab === 'stats' ? `${currentTheme.primary}33` : 'transparent',
              color: activeTab === 'stats' ? currentTheme.primary : '#9ca3af',
              borderColor: activeTab === 'stats' ? currentTheme.primary : 'transparent',
              boxShadow: activeTab === 'stats' ? `0 0 12px ${currentTheme.primary}55` : 'none',
            }}
            className="py-2 rounded-xl text-[11px] sm:text-xs font-header font-bold uppercase tracking-wider transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 border cursor-pointer"
          >
            <BarChart2 className="w-3.5 h-3.5 text-white shrink-0" />
            <span>Stats</span>
          </button>
        </div>

        {/* Scrollable Tab Content */}
        <div
          data-scrollable="true"
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 sm:p-5 space-y-4 w-full min-w-0 custom-scrollbar scrollable-panel"
        >
          {/* TAB 1: GAME RULES */}
          {activeTab === 'game' && (
            <div className="space-y-3.5">
              {/* Countdown Duration */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <div>
                  <div className="text-xs font-extrabold uppercase tracking-wide text-white">
                    Countdown
                  </div>
                  <div className="text-[11px] text-gray-400">Suspense hold timer</div>
                </div>

                <div className="flex items-center gap-1.5">
                  {[5, 8, 10].map((sec) => {
                    const isSelected = settings.countdownSeconds === sec;
                    return (
                      <button
                        key={sec}
                        onClick={() => {
                          SoundEngine.playButtonClick();
                          onUpdateSettings({ countdownSeconds: sec });
                        }}
                        style={{
                          backgroundColor: isSelected ? currentTheme.secondary : 'rgba(255, 255, 255, 0.05)',
                          color: isSelected ? '#ffffff' : '#d1d5db',
                          borderColor: isSelected ? currentTheme.secondary : 'rgba(255, 255, 255, 0.1)',
                          boxShadow: isSelected ? `0 0 10px ${currentTheme.secondary}66` : 'none',
                        }}
                        className="px-2.5 py-1.5 rounded-xl font-black text-xs transition-all border cursor-pointer active:scale-95"
                      >
                        {sec}s
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Audio Volume */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-white">
                    <Volume2 className="w-4 h-4" style={{ color: currentTheme.primary }} />
                    <span>Sound Volume</span>
                  </div>
                  <span className="text-xs font-black" style={{ color: currentTheme.primary }}>
                    {Math.round(settings.soundVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.soundVolume}
                  onChange={(e) => {
                    const vol = parseFloat(e.target.value);
                    onUpdateSettings({ soundVolume: vol });
                    SoundEngine.updateConfig(settings.soundEnabled, vol, settings.hapticsEnabled);
                  }}
                  className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* Haptic Feedback & Tactile Pulse Profiles */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-[#ff6e28]" />
                    <div>
                      <div className="text-xs font-extrabold uppercase tracking-wide text-white">
                        Vibration & Haptics
                      </div>
                      <div className="text-[11px] text-gray-400">Tactile pulses for targets & bottle stop</div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const nextVal = !settings.hapticsEnabled;
                      onUpdateSettings({ hapticsEnabled: nextVal });
                      SoundEngine.updateConfig(settings.soundEnabled, settings.soundVolume, nextVal);
                      if (nextVal) {
                        Haptics.buttonClick();
                      }
                    }}
                    className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                    style={{
                      backgroundColor: settings.hapticsEnabled ? '#ff6e28' : 'rgba(255, 255, 255, 0.15)',
                      boxShadow: settings.hapticsEnabled ? '0 0 10px rgba(255, 110, 40, 0.6)' : 'none',
                    }}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        settings.hapticsEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Haptic Pulse Pattern Testers */}
                {settings.hapticsEnabled && (
                  <div className="pt-1 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        Haptics.targetSelected();
                        SoundEngine.playTargetImpact();
                      }}
                      className="px-2.5 py-2 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 text-pink-300 text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                    >
                      <Zap className="w-3 h-3 text-pink-400" />
                      <span>Test Target Pulse</span>
                    </button>
                    <button
                      onClick={() => {
                        Haptics.bottleSettled();
                        SoundEngine.playBottleSettle();
                      }}
                      className="px-2.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                    >
                      <RotateCw className="w-3 h-3 text-cyan-400" />
                      <span>Test Bottle Stop</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: BOTTLE SPRITES & UPLOAD */}
          {activeTab === 'bottle' && (
            <div data-scrollable="true" className="space-y-4 w-full min-w-0 scrollable-panel">
              {/* Notice: Bottle Skins Moved to Store */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-purple-950/40 border border-purple-500/30 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-extrabold text-white flex items-center gap-1.5 uppercase tracking-wide">
                    <Sparkles className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                    <span className="truncate">Bottle Skins In Party Store</span>
                  </div>
                  <div className="text-[11px] text-gray-300 mt-0.5 leading-snug">
                    All preset bottles are now unlocked and equipped in the Party Store with Stars!
                  </div>
                </div>
                {onOpenStore && (
                  <button
                    type="button"
                    onClick={() => {
                      SoundEngine.playButtonClick();
                      onClose();
                      onOpenStore();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-black text-xs uppercase tracking-wider shrink-0 transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1"
                  >
                    <ShoppingBag className="w-3 h-3" />
                    <span>Store</span>
                  </button>
                )}
              </div>

              {/* Upload Custom Sprite Section */}
              <div className="space-y-2.5 w-full min-w-0">
                <div className="flex items-center justify-between w-full min-w-0">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-gray-400 truncate">
                    Custom Uploaded Bottles
                  </label>
                  <span className="text-[10px] font-bold shrink-0 ml-2" style={{ color: currentTheme.primary }}>
                    {customSprites.length} Saved
                  </span>
                </div>

                {/* Upload Blend Mode Options (Screen, Dodge, Lighten, Multiply, Normal) */}
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-1.5 w-full min-w-0 box-border overflow-hidden">
                  <div className="flex items-center justify-between w-full min-w-0">
                    <span className="text-[11px] font-bold text-gray-200 flex items-center gap-1.5 truncate">
                      <Sparkles className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                      <span className="truncate">Select blending mode:</span>
                    </span>
                    <span className="text-[10px] font-semibold text-cyan-300 capitalize shrink-0 ml-1">
                      {uploadBlendMode.replace('-', ' ')}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 pt-1 w-full min-w-0">
                    {[
                      { id: 'normal' as BottleBlendMode, label: 'Normal', desc: 'Solid original opacity' },
                      { id: 'screen' as BottleBlendMode, label: 'Screen', desc: 'Drops black background' },
                      { id: 'color-dodge' as BottleBlendMode, label: 'Dodge', desc: 'Neon luminous glow' },
                    ].map((opt) => {
                      const isActive = uploadBlendMode === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            SoundEngine.playButtonClick();
                            setUploadBlendMode(opt.id);
                          }}
                          title={opt.desc}
                          style={{
                            backgroundColor: isActive ? 'rgba(0, 240, 255, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                            borderColor: isActive ? '#00f0ff' : 'rgba(255, 255, 255, 0.1)',
                            color: isActive ? '#00f0ff' : '#9ca3af',
                          }}
                          className="py-1 px-1 rounded-lg border text-[10px] font-bold text-center transition-all cursor-pointer active:scale-95 truncate w-full min-w-0"
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Upload Button */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => {
                    SoundEngine.playButtonClick();
                    fileInputRef.current?.click();
                  }}
                  disabled={isUploading}
                  style={{
                    borderColor: `${currentTheme.primary}66`,
                    color: currentTheme.primary,
                  }}
                  className="w-full py-3 px-3 rounded-2xl border-2 border-dashed bg-white/5 font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-98 transition-all mb-3 cursor-pointer min-w-0"
                >
                  <Upload className="w-4 h-4 shrink-0" />
                  <span className="truncate">{isUploading ? 'Saving...' : '+ Upload Custom Bottle'}</span>
                </button>

                {/* List of Custom Uploaded Sprites */}
                {customSprites.length > 0 && (
                  <div
                    data-scrollable="true"
                    className="space-y-3 w-full min-w-0 max-h-[380px] overflow-y-auto overflow-x-hidden custom-scrollbar scrollable-panel pr-1"
                  >
                    {customSprites.map((sprite) => {
                      const isSelected =
                        settings.bottleStyle === 'custom' &&
                        settings.selectedCustomSpriteId === sprite.id;
                      const activeBlend = sprite.blendMode || 'normal';

                      const BLEND_OPTIONS: { id: BottleBlendMode; label: string; desc: string }[] = [
                        { id: 'normal', label: 'Normal', desc: 'Original opacity' },
                        { id: 'screen', label: 'Screen', desc: 'Drops black background' },
                        { id: 'color-dodge', label: 'Dodge', desc: 'Vibrant neon glow' },
                      ];

                      return (
                        <div
                          key={sprite.id}
                          onClick={() => {
                            SoundEngine.playButtonClick();
                            onUpdateSettings({
                              bottleStyle: 'custom',
                              selectedCustomSpriteId: sprite.id,
                            });
                            const ecoRes = equipItem('bottles', `custom_${sprite.id}`);
                            if (ecoRes.success && onEconomyUpdated) {
                              onEconomyUpdated(ecoRes.updatedState);
                            }
                          }}
                          style={{
                            backgroundColor: isSelected ? `${currentTheme.primary}18` : 'rgba(255, 255, 255, 0.04)',
                            borderColor: isSelected ? currentTheme.primary : 'rgba(255, 255, 255, 0.1)',
                            boxShadow: isSelected ? `0 0 14px ${currentTheme.primary}33` : 'none',
                          }}
                          className="p-3 rounded-2xl border flex flex-col gap-2.5 cursor-pointer transition-all w-full min-w-0 overflow-hidden box-border"
                        >
                          {/* Row 1: Sprite Info, Preview & Actions */}
                          <div className="flex items-center justify-between w-full min-w-0 gap-2">
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              {/* Dark Preview Canvas showing blend effect */}
                              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-950/80 to-blue-950/80 border border-white/15 flex items-center justify-center overflow-hidden p-1 shrink-0 relative">
                                <img
                                  src={sprite.dataUrl}
                                  alt={sprite.name}
                                  className="max-w-full max-h-full object-contain"
                                  style={{
                                    transform: (!sprite.originalDataUrl && sprite.rotationOffset)
                                      ? `rotate(${sprite.rotationOffset}deg)`
                                      : undefined,
                                    mixBlendMode: activeBlend !== 'normal' ? (activeBlend as any) : undefined,
                                  }}
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-black text-white truncate">
                                  {sprite.name}
                                </div>
                                <div className="text-[10px] text-gray-400 flex items-center gap-1.5 mt-0.5 truncate">
                                  <span className="shrink-0">{sprite.rotationOffset || 0}°</span>
                                  <span className="shrink-0">•</span>
                                  <span className="font-semibold text-cyan-300 capitalize truncate">{activeBlend.replace('-', ' ')}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => handleRotateSprite(sprite, e)}
                                title="Rotate 90°"
                                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-cyan-300 active:scale-95 transition-all cursor-pointer"
                              >
                                <RotateCw className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteSprite(sprite.id, e)}
                                title="Delete Sprite"
                                className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 active:scale-95 transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Row 2: Blending Modes (Screen, Color Dodge, Lighten, Multiply, etc.) */}
                          <div className="pt-2 border-t border-white/10 w-full min-w-0" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-1.5 w-full min-w-0">
                              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1 truncate">
                                <Sparkles className="w-3 h-3 text-pink-400 shrink-0" />
                                <span>CSS Blend Mode</span>
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-1.5 w-full min-w-0">
                              {BLEND_OPTIONS.map((opt) => {
                                const isBlendActive = activeBlend === opt.id;
                                return (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    onClick={(e) => handleChangeBlendMode(sprite, opt.id, e)}
                                    title={opt.desc}
                                    style={{
                                      backgroundColor: isBlendActive
                                        ? 'rgba(0, 240, 255, 0.25)'
                                        : 'rgba(255, 255, 255, 0.05)',
                                      borderColor: isBlendActive
                                        ? '#00f0ff'
                                        : 'rgba(255, 255, 255, 0.08)',
                                      color: isBlendActive ? '#00f0ff' : '#9ca3af',
                                    }}
                                    className="py-1 px-1 rounded-lg border text-[10px] font-bold text-center transition-all cursor-pointer active:scale-95 hover:text-white truncate w-full min-w-0"
                                  >
                                    {opt.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: STATS */}
          {activeTab === 'stats' && (
            <div data-scrollable="true" className="space-y-4 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar scrollable-panel">
              {/* Classic Game Modes */}
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-2">
                  Classic Party Modes
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                    <div className="text-2xl font-black" style={{ color: currentTheme.primary }}>
                      {stats.totalRouletteRounds}
                    </div>
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                      Roulette Rounds
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                    <div className="text-2xl font-black" style={{ color: currentTheme.secondary }}>
                      {stats.totalBottleSpins}
                    </div>
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                      Bottle Spins
                    </div>
                  </div>
                </div>
              </div>

              {/* KABOOM Bomb Game Statistics */}
              <div className="pt-2 border-t border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Bomb className="w-3.5 h-3.5 text-red-400" />
                    <span>KABOOM Bomb Game</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                    {stats.kaboom?.totalRounds || stats.totalKaboomRounds || 0} Total Rounds
                  </span>
                </div>

                {/* Detailed 3-Stat Grid */}
                <div className="grid grid-cols-3 gap-2">
                  {/* Victories */}
                  <div className="p-3 rounded-xl bg-emerald-950/25 border border-emerald-500/30 text-center">
                    <div className="flex items-center justify-center gap-1 text-emerald-400 mb-1">
                      <Trophy className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-extrabold uppercase tracking-wider">Victories</span>
                    </div>
                    <div className="text-xl font-black text-emerald-300">
                      {stats.kaboom?.victories || 0}
                    </div>
                    <div className="text-[9px] text-gray-400 mt-0.5 leading-tight">
                      No-Bomb Clears
                    </div>
                  </div>

                  {/* Bonus Collected */}
                  <div className="p-3 rounded-xl bg-amber-950/25 border border-amber-500/30 text-center">
                    <div className="flex items-center justify-center gap-1 text-amber-400 mb-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-extrabold uppercase tracking-wider">Bonuses</span>
                    </div>
                    <div className="text-xl font-black text-amber-300">
                      {stats.kaboom?.bonusCollected || 0}
                    </div>
                    <div className="text-[9px] text-gray-400 mt-0.5 leading-tight">
                      Power-ups Found
                    </div>
                  </div>

                  {/* Bomb Hits */}
                  <div className="p-3 rounded-xl bg-red-950/25 border border-red-500/30 text-center">
                    <div className="flex items-center justify-center gap-1 text-red-400 mb-1">
                      <Bomb className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-extrabold uppercase tracking-wider">Bomb Hits</span>
                    </div>
                    <div className="text-xl font-black text-red-300">
                      {stats.kaboom?.bombHits || 0}
                    </div>
                    <div className="text-[9px] text-gray-400 mt-0.5 leading-tight">
                      Detonations
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                id="settings-btn-reset-stats"
                onClick={() => {
                  SoundEngine.playButtonClick();
                  setIsResetConfirmOpen(true);
                }}
                className="w-full py-2.5 rounded-xl border border-red-500/30 bg-red-950/20 text-red-400 hover:bg-red-950/40 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Statistics</span>
              </button>

              {onOpenAdmin && (
                <div className="pt-2 border-t border-white/10">
                  <button
                    type="button"
                    id="settings-btn-open-admin"
                    onClick={() => {
                      SoundEngine.playButtonClick();
                      onClose();
                      onOpenAdmin();
                    }}
                    className="w-full py-2.5 rounded-xl border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    <span>Open Admin Dashboard</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer with Single Done Button */}
        <div className="p-4 border-t border-white/10 bg-black/40 shrink-0">
          <button
            onClick={() => {
              SoundEngine.playButtonClick();
              Haptics.buttonClick();
              onClose();
            }}
            className="font-header w-full py-2.5 rounded-full font-bold uppercase tracking-wider text-xs bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-98 transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>

      {/* Confirmation Modal requiring player to type RESET */}
      <ResetStatsConfirmModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirmReset={async () => {
          await resetAllStats();
          onRefreshStats();
        }}
      />
    </div>
  );
};


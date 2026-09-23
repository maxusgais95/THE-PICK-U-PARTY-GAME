/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AppSettings, AppStats, CustomBottleSprite, ScreenView, TouchPlayer, BottleBuiltinStyle, ThemeId } from './types';
import { THEMES } from './lib/themes';
import { getSettings, saveSettings, getStats, getAllCustomSprites, saveCustomSprite } from './lib/db';
import { SoundEngine, Haptics } from './lib/audio';
import { processSpriteImage } from './lib/imageProcessing';
import { BackgroundCanvas } from './components/BackgroundCanvas';
import { Header } from './components/Header';
import { LandingHub } from './components/LandingHub';
import { FingerRoulette } from './components/FingerRoulette';
import { BottleSpin } from './components/BottleSpin';
import { SettingsModal } from './components/SettingsModal';
import { PartyBackground } from './components/PartyBackground';
import { FingerGameBackground } from './components/FingerGameBackground';
import { SpinBottleBackground } from './components/SpinBottleBackground';
import { BombGameBackground } from './components/BombGameBackground';
import { VersionNotesModal } from './components/VersionNotesModal';
import { AboutGuideModal } from './components/AboutGuideModal';
import { LandscapeBlocker } from './components/LandscapeBlocker';
import { SplashScreen } from './components/SplashScreen';
import { OfflineIndicator } from './components/OfflineIndicator';
import { KaboomGame } from './components/kaboom/KaboomGame';
import { getEconomyState, EconomyState, STORE_CATALOGUE, equipItem } from './lib/economy';
import { StoreModal } from './components/StoreModal';
import { DailyQuestsModal } from './components/DailyQuestsModal';
import { AchievementsModal } from './components/AchievementsModal';
import { RewardsModal } from './components/RewardsModal';
import { GamePreloader } from './components/GamePreloader';
import { preloadGameAssets, GameModeId } from './lib/assetPreloader';
import { AdminDashboard } from './components/admin/AdminDashboard';

export default function App() {
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [currentView, setCurrentView] = useState<ScreenView>('hub');
  const [preloadingGame, setPreloadingGame] = useState<GameModeId | null>(null);
  const [preloadProgress, setPreloadProgress] = useState<number>(0);
  const [preloadStatus, setPreloadStatus] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isVersionNotesOpen, setIsVersionNotesOpen] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [isStoreOpen, setIsStoreOpen] = useState<boolean>(false);
  const [isDailyQuestsOpen, setIsDailyQuestsOpen] = useState<boolean>(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState<boolean>(false);
  const [isRewardsOpen, setIsRewardsOpen] = useState<boolean>(false);
  const [economy, setEconomy] = useState<EconomyState>(() => getEconomyState());
  const [settings, setSettings] = useState<AppSettings>({
    minPlayers: 2,
    targetCount: 1,
    countdownSeconds: 5,
    bottleStyle: 'btl_e_001',
    selectedCustomSpriteId: null,
    bottleBlendMode: 'screen',
    bottleFriction: 0.992,
    theme: 'cyber-neon',
    soundEnabled: true,
    soundVolume: 0.8,
    hapticsEnabled: true,
  });

  const [stats, setStats] = useState<AppStats>({
    totalRouletteRounds: 0,
    totalBottleSpins: 0,
    lastPlayedAt: Date.now(),
  });

  const [customSprites, setCustomSprites] = useState<CustomBottleSprite[]>([]);
  const [currentTouches, setCurrentTouches] = useState<TouchPlayer[]>([]);
  const [showTeamLines, setShowTeamLines] = useState<boolean>(false);
  const [isBottleSpinning, setIsBottleSpinning] = useState<boolean>(false);
  const [bottleSpinSpeed, setBottleSpinSpeed] = useState<number>(0);
  const [rouletteGameState, setRouletteGameState] = useState<'waiting' | 'countdown' | 'resolved'>('waiting');
  const rouletteResolveRef = useRef<(() => void) | null>(null);

  // Load from IndexedDB on startup
  useEffect(() => {
    async function loadDB() {
      const loadedSettings = await getSettings();
      const loadedStats = await getStats();
      const loadedSprites = await getAllCustomSprites();

      // Ensure valid bottle style and screen blend mode
      const validSkins = ['btl_e_001', 'btl_e_002', 'btl_e_003', 'btl_e_004'];
      if (
        !validSkins.includes(loadedSettings.bottleStyle) &&
        loadedSettings.bottleStyle !== 'custom'
      ) {
        loadedSettings.bottleStyle = 'btl_e_001';
      }
      loadedSettings.bottleBlendMode = 'screen';
      loadedSettings.theme = 'cyber-neon';

      setSettings(loadedSettings);
      setStats(loadedStats);

      // Auto-upgrade any existing custom sprites
      const upgradedSprites = await Promise.all(
        loadedSprites.map(async (sprite) => {
          if (!sprite.originalDataUrl) {
            sprite.originalDataUrl = sprite.dataUrl;
          }
          if ((sprite as any).cleanEdgeVersion !== 2) {
            try {
              sprite.dataUrl = await processSpriteImage(
                sprite.originalDataUrl,
                sprite.blendMode || 'color-dodge',
                sprite.rotationOffset || 0
              );
              (sprite as any).cleanEdgeVersion = 2;
              await saveCustomSprite(sprite);
            } catch (err) {
              console.error('Error upgrading sprite:', err);
            }
          }
          return sprite;
        })
      );
      setCustomSprites(upgradedSprites);

      SoundEngine.updateConfig(
        loadedSettings.soundEnabled,
        loadedSettings.soundVolume,
        loadedSettings.hapticsEnabled
      );
      SoundEngine.preloadSounds();
    }
    loadDB();
  }, []);

  // Sync economy whenever stars are earned or items purchased
  useEffect(() => {
    const handleEconomyEvent = (e: Event) => {
      const customEvent = e as CustomEvent<EconomyState>;
      if (customEvent.detail) {
        setEconomy(customEvent.detail);
      } else {
        setEconomy(getEconomyState());
      }
    };
    window.addEventListener('picku_economy_updated', handleEconomyEvent);
    return () => window.removeEventListener('picku_economy_updated', handleEconomyEvent);
  }, []);

  const refreshSprites = useCallback(async () => {
    const sprites = await getAllCustomSprites();
    setCustomSprites(sprites);
  }, []);

  const refreshStats = useCallback(async () => {
    const loadedStats = await getStats();
    setStats(loadedStats);
  }, []);

  // Sync stats whenever any game event is recorded or stats change in real time
  useEffect(() => {
    const handleStatsEvent = (e: Event) => {
      const customEvent = e as CustomEvent<AppStats>;
      if (customEvent.detail) {
        setStats(customEvent.detail);
      } else {
        refreshStats();
      }
    };
    window.addEventListener('picku_stats_updated', handleStatsEvent);
    return () => window.removeEventListener('picku_stats_updated', handleStatsEvent);
  }, [refreshStats]);

  const handleUpdateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      saveSettings(updated);
      SoundEngine.updateConfig(
        updated.soundEnabled,
        updated.soundVolume,
        updated.hapticsEnabled
      );
      return updated;
    });
  }, []);

  const handleToggleSound = useCallback(() => {
    handleUpdateSettings({ soundEnabled: !settings.soundEnabled });
  }, [settings.soundEnabled, handleUpdateSettings]);

  const handleToggleHaptics = useCallback(() => {
    handleUpdateSettings({ hapticsEnabled: !settings.hapticsEnabled });
  }, [settings.hapticsEnabled, handleUpdateSettings]);

  const handleTouchUpdate = useCallback((touches: TouchPlayer[], showTeams: boolean) => {
    setCurrentTouches(touches);
    setShowTeamLines(showTeams);
  }, []);

  const activeCustomSprite = useMemo(() => {
    if (settings.bottleStyle !== 'custom' || !settings.selectedCustomSpriteId) return null;
    return customSprites.find((s) => s.id === settings.selectedCustomSpriteId) || null;
  }, [settings.bottleStyle, settings.selectedCustomSpriteId, customSprites]);

  const currentTheme = THEMES['cyber-neon'];

  // Quick bottle sprite cycle for header action: ONLY switches between purchased bottles!
  const handleCycleBottleSprite = useCallback(() => {
    // Only include unlocked/purchased bottles from STORE_CATALOGUE
    const unlockedBottles = STORE_CATALOGUE.bottles.filter((b) =>
      economy.unlockedItems.includes(b.id)
    );

    type SpriteOption = {
      style: BottleBuiltinStyle | 'custom';
      spriteId: string | null;
      storeItemId: string | null;
    };

    const options: SpriteOption[] = unlockedBottles.map((b) => ({
      style: b.builtInBottleStyle || 'btl_e_001',
      spriteId: null,
      storeItemId: b.id,
    }));

    // Fallback: at least default bottle if none unlocked yet
    if (options.length === 0) {
      options.push({ style: 'btl_e_001', spriteId: null, storeItemId: 'bottle_btl_001' });
    }

    // Include custom user-uploaded sprites
    customSprites.forEach((s) => {
      options.push({ style: 'custom', spriteId: s.id, storeItemId: null });
    });

    const currentIndex = options.findIndex((opt) => {
      if (opt.style === 'custom') {
        return settings.bottleStyle === 'custom' && settings.selectedCustomSpriteId === opt.spriteId;
      }
      return settings.bottleStyle === opt.style;
    });

    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % options.length;
    const nextOpt = options[nextIndex];

    handleUpdateSettings({
      bottleStyle: nextOpt.style,
      selectedCustomSpriteId: nextOpt.spriteId,
    });

    // Sync with economy equippedSkins so the store reflects the selected skin
    if (nextOpt.storeItemId) {
      const res = equipItem('bottles', nextOpt.storeItemId);
      if (res.success) {
        setEconomy(res.updatedState);
      }
    }

    SoundEngine.playButtonClick();
    Haptics.buttonClick();
  }, [economy.unlockedItems, customSprites, settings.bottleStyle, settings.selectedCustomSpriteId, handleUpdateSettings]);

  // Quick ball skin cycle for header action in Kaboom mode: ONLY switches between purchased balls!
  const handleCycleBallSkin = useCallback(() => {
    const unlockedBalls = STORE_CATALOGUE.balls.filter((b) =>
      economy.unlockedItems.includes(b.id)
    );
    if (unlockedBalls.length <= 1) {
      SoundEngine.playButtonClick();
      Haptics.buttonClick();
      return;
    }

    const currentBallId = economy.equippedSkins?.balls || 'ball_cyan_orbs';
    const currentIndex = unlockedBalls.findIndex((b) => b.id === currentBallId);
    const nextIndex = (currentIndex + 1) % unlockedBalls.length;
    const nextBall = unlockedBalls[nextIndex];

    const res = equipItem('balls', nextBall.id);
    if (res.success) {
      setEconomy(res.updatedState);
      SoundEngine.playButtonClick();
      Haptics.touchSuccess();
    }
  }, [economy.unlockedItems, economy.equippedSkins?.balls]);

  const handleNavigateToGame = useCallback((targetView: ScreenView) => {
    setCurrentTouches([]);
    setShowTeamLines(false);
    setIsBottleSpinning(false);
    setBottleSpinSpeed(0);
    setRouletteGameState('waiting');

    if (targetView === 'hub') {
      setCurrentView('hub');
      return;
    }

    const gameId = targetView as GameModeId;
    setPreloadingGame(gameId);
    setPreloadProgress(0);
    setPreloadStatus(`Initializing ${targetView.toUpperCase()} stage files...`);

    const TOTAL_PRELOAD_MS = 1500;
    const startTime = Date.now();

    // Trigger asset preloading in parallel
    preloadGameAssets(gameId).catch(() => {});

    // Smoothly animate progress bar over 1500ms (1.5s)
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / TOTAL_PRELOAD_MS) * 100));
      setPreloadProgress(pct);

      if (pct < 30) {
        setPreloadStatus(`Buffering ${targetView.toUpperCase()} textures...`);
      } else if (pct < 65) {
        setPreloadStatus(`Warming GPU pipelines & sound shaders...`);
      } else if (pct < 95) {
        setPreloadStatus(`Finalizing stage files...`);
      } else {
        setPreloadStatus(`Ready! Entering stage...`);
      }

      if (elapsed >= TOTAL_PRELOAD_MS) {
        clearInterval(interval);
        setPreloadProgress(100);
        setTimeout(() => {
          setCurrentView(targetView);
          setPreloadingGame(null);
        }, 120);
      }
    }, 35);
  }, []);

  if (currentView === 'admin') {
    return (
      <div className="w-screen h-screen overflow-y-auto bg-zinc-950 text-zinc-100 font-sans">
        <AdminDashboard
          settings={settings}
          stats={
            stats || {
              totalRouletteRounds: 0,
              totalBottleSpins: 0,
              totalKaboomRounds: 0,
              lastPlayedAt: Date.now(),
            }
          }
          economy={economy}
          onBackToGame={() => setCurrentView('hub')}
          onRefreshStats={refreshStats}
          onEconomyUpdated={setEconomy}
        />
      </div>
    );
  }

  return (
    <main
      className="relative w-screen h-screen overflow-hidden select-none touch-none font-sans transition-colors duration-500"
      style={{ backgroundColor: currentTheme.bgBase }}
    >
      {/* 1. Main Hub Background: Looping Neon Party DJ Background Video (Preloaded & Persistent for zero lag) */}
      <div className={currentView === 'hub' ? 'contents' : 'hidden'}>
        <PartyBackground theme={settings.theme} active={currentView === 'hub'} />
      </div>

      {/* 2. Finger Roulette Gameplay Background: Static Image, Screen Bleed Ambience Lights & Speed-Adjusted Video */}
      <div className={currentView === 'roulette' ? 'contents' : 'hidden'}>
        <FingerGameBackground
          theme={settings.theme}
          active={currentView === 'roulette'}
          gameState={rouletteGameState}
          activeFingersCount={currentTouches.length}
          minPlayers={settings.minPlayers}
          countdownSeconds={settings.countdownSeconds}
          onVideoEnd={() => {
            rouletteResolveRef.current?.();
          }}
        />
      </div>

      {/* 3. Spin Bottle Gameplay Background: Music Visualizer Spectrum with Table & Lights (Preloaded & Persistent) */}
      <div className={currentView === 'bottle' ? 'contents' : 'hidden'}>
        <SpinBottleBackground
          theme={settings.theme}
          active={currentView === 'bottle'}
          isSpinning={isBottleSpinning}
          spinSpeed={bottleSpinSpeed}
        />
      </div>

      {/* 4. Bomb Game Background (Preloaded & Persistent) */}
      <div className={currentView === 'kaboom' ? 'contents' : 'hidden'}>
        <BombGameBackground active={currentView === 'kaboom'} />
      </div>

      {/* 3. 60FPS Background Particle & Shockwave Canvas */}
      <BackgroundCanvas
        theme={settings.theme}
        touches={currentTouches}
        showTeamLines={showTeamLines}
        isBottleSpinning={isBottleSpinning}
        bottleSpinSpeed={bottleSpinSpeed}
      />

      {/* Persistent Mobile Top Action Header */}
      <Header
        currentView={currentView}
        settings={settings}
        stars={economy.stars}
        onNavigate={handleNavigateToGame}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenStore={() => setIsStoreOpen(true)}
        onOpenInfo={() => setIsGuideOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        onToggleSound={handleToggleSound}
        onToggleHaptics={handleToggleHaptics}
        onToggleBottleSprite={handleCycleBottleSprite}
        onToggleBallSkin={handleCycleBallSkin}
        onEconomyUpdated={setEconomy}
      />

      {/* Screen Views */}
      <div className="relative w-full h-full z-20">
        {currentView === 'hub' && (
          <LandingHub
            settings={settings}
            economy={economy}
            stats={stats || undefined}
            onSelectRoulette={() => handleNavigateToGame('roulette')}
            onSelectBottle={() => handleNavigateToGame('bottle')}
            onSelectKaboom={() => handleNavigateToGame('kaboom')}
            onUpdateSettings={handleUpdateSettings}
            onOpenVersionNotes={() => setIsVersionNotesOpen(true)}
            onOpenStore={() => setIsStoreOpen(true)}
            onOpenDailyQuests={() => setIsDailyQuestsOpen(true)}
            onOpenAchievements={() => setIsAchievementsOpen(true)}
            onOpenRewards={() => setIsRewardsOpen(true)}
          />
        )}

        {currentView === 'roulette' && (
          <FingerRoulette
            settings={settings}
            onTouchUpdate={handleTouchUpdate}
            onUpdateSettings={handleUpdateSettings}
            onGameStateChange={setRouletteGameState}
            registerResolveTrigger={(trigger) => {
              rouletteResolveRef.current = trigger;
            }}
          />
        )}

        {currentView === 'bottle' && (
          <BottleSpin
            settings={settings}
            customSprite={activeCustomSprite}
            onSpinStateChange={(spinning, speed) => {
              setIsBottleSpinning(spinning);
              setBottleSpinSpeed(speed);
            }}
          />
        )}

        {currentView === 'kaboom' && (
          <KaboomGame
            settings={settings}
            economy={economy}
            onBackToMenu={() => setCurrentView('hub')}
            onStatsUpdated={(newStats) => setStats(newStats)}
            onEconomyUpdated={setEconomy}
          />
        )}
      </div>

      {/* Settings & Custom Sprite Upload Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        stats={stats}
        customSprites={customSprites}
        onClose={() => {
          refreshStats();
          setIsSettingsOpen(false);
        }}
        onUpdateSettings={handleUpdateSettings}
        onRefreshSprites={refreshSprites}
        onRefreshStats={refreshStats}
        onOpenStore={() => setIsStoreOpen(true)}
        onOpenAdmin={() => {
          setIsSettingsOpen(false);
          setCurrentView('admin');
        }}
      />

      {/* Version Notes Modal (Changelog History & v1.4.03 Updates) */}
      <VersionNotesModal
        isOpen={isVersionNotesOpen}
        onClose={() => setIsVersionNotesOpen(false)}
      />

      {/* Game Guide Modal (How to Play, Party Tips & Star Economy) */}
      <AboutGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        economy={economy}
        onEconomyUpdated={setEconomy}
        onNavigateToGame={handleNavigateToGame}
        onOpenStore={() => setIsStoreOpen(true)}
      />

      {/* Store Modal (Bottles, Bombs, Balls, Bonus Skins) */}
      <StoreModal
        isOpen={isStoreOpen}
        economy={economy}
        settings={settings}
        onClose={() => setIsStoreOpen(false)}
        onEconomyUpdated={setEconomy}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* Daily Quests Modal */}
      <DailyQuestsModal
        isOpen={isDailyQuestsOpen}
        quests={economy.dailyQuests}
        economy={economy}
        onClose={() => setIsDailyQuestsOpen(false)}
        onNavigateToGame={handleNavigateToGame}
        onEconomyUpdated={setEconomy}
      />

      {/* Achievements / Trophy Gallery Modal */}
      <AchievementsModal
        isOpen={isAchievementsOpen}
        onClose={() => {
          setIsAchievementsOpen(false);
          window.dispatchEvent(new CustomEvent('picku_trophy_claimed'));
        }}
        stats={stats}
        economy={economy}
        onEconomyUpdated={setEconomy}
      />

      {/* Rewards Modal (Daily Login Streak) */}
      <RewardsModal
        isOpen={isRewardsOpen}
        economy={economy}
        onClose={() => setIsRewardsOpen(false)}
        onEconomyUpdated={setEconomy}
      />

      {/* Portrait-Only Guard: Landscape Blocker Overlay */}
      <LandscapeBlocker />

      {/* Offline Status Connectivity Toast */}
      <OfflineIndicator />

      {/* Launch Splash Screen & In-Memory Asset Preloader Modal */}
      {showSplash && (
        <SplashScreen
          onComplete={() => setShowSplash(false)}
          onOpenVersionNotes={() => setIsVersionNotesOpen(true)}
        />
      )}

      {/* Game File Preloader Overlay before entering game */}
      <GamePreloader
        game={preloadingGame}
        progress={preloadProgress}
        statusText={preloadStatus}
      />
    </main>
  );
}

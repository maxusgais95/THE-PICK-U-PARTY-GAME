/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Shield,
  ShoppingBag,
  BarChart2,
  Coins,
  ArrowLeft,
  Plus,
  Search,
  Edit2,
  Trash2,
  RotateCcw,
  Sparkles,
  Bomb,
  Trophy,
  AlertTriangle,
  Star,
  CheckCircle2,
  Sliders,
  Filter,
} from 'lucide-react';
import {
  StoreItem,
  StoreCategory,
  getStoreCatalogue,
  addStoreItem,
  updateStoreItem,
  deleteStoreItem,
  resetStoreCatalogueToDefault,
  EconomyState,
  getEconomyState,
  saveEconomyState,
} from '../../lib/economy';
import { AppStats, AppSettings } from '../../types';
import { getStats, resetAllStats, saveStats } from '../../lib/db';
import { SoundEngine, Haptics } from '../../lib/audio';
import { StoreItemModal } from './StoreItemModal';
import { DeleteItemConfirmModal } from './DeleteItemConfirmModal';
import { ResetStatsConfirmModal } from './ResetStatsConfirmModal';

interface AdminDashboardProps {
  settings: AppSettings;
  stats: AppStats;
  economy: EconomyState;
  onBackToGame: () => void;
  onRefreshStats: () => void;
  onEconomyUpdated: (eco: EconomyState) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  settings,
  stats: initialStats,
  economy: initialEconomy,
  onBackToGame,
  onRefreshStats,
  onEconomyUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'store' | 'stats' | 'economy'>('store');
  const [catalogue, setCatalogue] = useState<Record<StoreCategory, StoreItem[]>>(() => getStoreCatalogue());
  const [activeCategory, setActiveCategory] = useState<StoreCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<AppStats>(initialStats);
  const [economy, setEconomy] = useState<EconomyState>(initialEconomy);

  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StoreItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<StoreItem | null>(null);
  const [isResetStatsModalOpen, setIsResetStatsModalOpen] = useState(false);
  const [isResetCatalogueModalOpen, setIsResetCatalogueModalOpen] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Sync catalogue whenever updated
  useEffect(() => {
    const handleCatalogueUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<Record<StoreCategory, StoreItem[]>>;
      if (customEvent.detail) {
        setCatalogue(customEvent.detail);
      } else {
        setCatalogue(getStoreCatalogue());
      }
    };
    window.addEventListener('picku_store_catalogue_updated', handleCatalogueUpdated);
    return () => window.removeEventListener('picku_store_catalogue_updated', handleCatalogueUpdated);
  }, []);

  // Sync stats
  useEffect(() => {
    setStats(initialStats);
  }, [initialStats]);

  // Sync economy
  useEffect(() => {
    setEconomy(initialEconomy);
  }, [initialEconomy]);

  // Flattened items list based on filter and search
  const filteredItems = useMemo(() => {
    let items: StoreItem[] = [];
    if (activeCategory === 'all') {
      items = [
        ...(catalogue.bottles || []),
        ...(catalogue.bombs || []),
        ...(catalogue.balls || []),
        ...(catalogue.accessories || []),
      ];
    } else {
      items = [...(catalogue[activeCategory] || [])];
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.subtitle?.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q) ||
          i.rarity?.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          i.badge?.toLowerCase().includes(q)
      );
    }

    return items;
  }, [catalogue, activeCategory, searchQuery]);

  // Category counts
  const categoryCounts = useMemo(() => {
    return {
      all:
        (catalogue.bottles?.length || 0) +
        (catalogue.bombs?.length || 0) +
        (catalogue.balls?.length || 0) +
        (catalogue.accessories?.length || 0),
      bottles: catalogue.bottles?.length || 0,
      bombs: catalogue.bombs?.length || 0,
      balls: catalogue.balls?.length || 0,
      accessories: catalogue.accessories?.length || 0,
    };
  }, [catalogue]);

  // Item Actions
  const handleOpenAddItem = () => {
    SoundEngine.playButtonClick();
    setEditingItem(null);
    setIsItemModalOpen(true);
  };

  const handleOpenEditItem = (item: StoreItem) => {
    SoundEngine.playButtonClick();
    setEditingItem(item);
    setIsItemModalOpen(true);
  };

  const handleOpenDeleteItem = (item: StoreItem) => {
    SoundEngine.playButtonClick();
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const handleSaveItem = (savedItem: StoreItem) => {
    if (editingItem) {
      const updated = updateStoreItem(savedItem);
      setCatalogue(updated);
      showToast(`Updated store item: "${savedItem.name}"`);
    } else {
      const updated = addStoreItem(savedItem);
      setCatalogue(updated);
      showToast(`Added new store item: "${savedItem.name}"`);
    }
  };

  const handleConfirmDeleteItem = (itemId: string) => {
    const updated = deleteStoreItem(itemId);
    setCatalogue(updated);
    showToast('Store item successfully removed.');
  };

  const handleRestoreDefaultCatalogue = () => {
    const updated = resetStoreCatalogueToDefault();
    setCatalogue(updated);
    setIsResetCatalogueModalOpen(false);
    showToast('Store catalogue restored to system defaults.');
  };

  // Stats Actions
  const handleExecuteStatsReset = async () => {
    const cleared = await resetAllStats();
    setStats(cleared);
    onRefreshStats();
    showToast('All game statistics have been reset to 0.');
  };

  // Economy Actions
  const handleAdjustStars = (amount: number) => {
    SoundEngine.playButtonClick();
    const currentEco = getEconomyState();
    const newStars = Math.max(0, currentEco.stars + amount);
    const updated = { ...currentEco, stars: newStars };
    saveEconomyState(updated);
    setEconomy(updated);
    onEconomyUpdated(updated);
    showToast(`Stars balance updated: ${newStars.toLocaleString()}`);
  };

  const handleUnlockAllStoreItems = () => {
    SoundEngine.playButtonClick();
    const currentEco = getEconomyState();
    const allIds = [
      ...catalogue.bottles.map((b) => b.id),
      ...catalogue.bombs.map((b) => b.id),
      ...catalogue.balls.map((b) => b.id),
      ...catalogue.accessories.map((a) => a.id),
    ];
    const updated = {
      ...currentEco,
      unlockedItems: Array.from(new Set([...currentEco.unlockedItems, ...allIds])),
    };
    saveEconomyState(updated);
    setEconomy(updated);
    onEconomyUpdated(updated);
    showToast('All store items unlocked for testing.');
  };

  return (
    <div
      id="admin-dashboard-root"
      className="w-full min-h-screen bg-zinc-950 text-zinc-100 flex flex-col antialiased selection:bg-zinc-800 selection:text-white"
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          id="admin-toast"
          className="fixed bottom-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))] right-[max(1.5rem,calc(env(safe-area-inset-right)+1rem))] z-50 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 shadow-2xl text-xs font-semibold text-zinc-100 flex items-center gap-2 animate-fadeIn"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Bar with Safe-Area Notch Inset Support */}
      <header
        id="admin-header"
        className="w-full bg-zinc-900/90 border-b border-zinc-800/80 px-4 sm:px-6 pt-[max(0.875rem,calc(env(safe-area-inset-top)+0.625rem))] pb-3.5 sticky top-0 z-30 backdrop-blur-md"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-white">
                  Admin Dashboard
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-zinc-800 text-zinc-300 border border-zinc-700">
                  Dark Mode
                </span>
              </div>
              <p className="text-xs text-zinc-400 hidden sm:block">
                Manage store catalogue items, configure system stats & monitor player economy.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              id="admin-btn-back-game"
              onClick={() => {
                SoundEngine.playButtonClick();
                Haptics.buttonClick();
                onBackToGame();
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-zinc-200 bg-zinc-800 hover:bg-zinc-700 hover:text-white border border-zinc-700 transition-all flex items-center gap-2 cursor-pointer active:scale-98"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Exit to Hub</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6 pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1.5rem))] flex-1 flex flex-col gap-6">
        {/* Navigation Tabs */}
        <div
          id="admin-tab-navigation"
          className="flex items-center gap-2 p-1.5 bg-zinc-900/80 border border-zinc-800 rounded-xl w-full sm:w-auto self-start overflow-x-auto"
        >
          <button
            type="button"
            id="admin-tab-store"
            onClick={() => {
              SoundEngine.playButtonClick();
              setActiveTab('store');
            }}
             className="px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Store Items Manager</span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] ${
                activeTab === 'store' ? 'bg-zinc-300 text-zinc-900' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {categoryCounts.all}
            </span>
          </button>

          <button
            type="button"
            id="admin-tab-stats"
            onClick={() => {
              SoundEngine.playButtonClick();
              setActiveTab('stats');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'stats'
                ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Game Statistics & Danger Zone</span>
          </button>

          <button
            type="button"
            id="admin-tab-economy"
            onClick={() => {
              SoundEngine.playButtonClick();
              setActiveTab('economy');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'economy'
                ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>Player Economy & Wallet</span>
          </button>
        </div>

        {/* TAB 1: STORE ITEMS MANAGER */}
        {activeTab === 'store' && (
          <div id="admin-store-section" className="flex flex-col gap-5">
            {/* Action Bar: Category filter pills, Search input, Add button */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800/80">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                {(['all', 'bottles', 'bombs', 'balls', 'accessories'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    id={`admin-filter-${cat}`}
                    onClick={() => {
                      SoundEngine.playButtonClick();
                      setActiveCategory(cat);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors cursor-pointer whitespace-nowrap ${
                      activeCategory === cat
                        ? 'bg-zinc-800 text-white border border-zinc-700'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
                    }`}
                  >
                    {cat} ({categoryCounts[cat]})
                  </button>
                ))}
              </div>

              {/* Search & Actions */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="admin-search-items-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search items..."
                    className="w-full pl-9 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                  />
                </div>

                <button
                  type="button"
                  id="admin-btn-add-item"
                  onClick={handleOpenAddItem}
                  className="px-3.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-98 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Item</span>
                </button>

                <button
                  type="button"
                  id="admin-btn-restore-catalogue"
                  onClick={() => setIsResetCatalogueModalOpen(true)}
                  title="Restore Default Catalogue"
                  className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 border border-zinc-700 transition-colors cursor-pointer shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Items Grid */}
            {filteredItems.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-zinc-900/40 border border-zinc-800 text-zinc-400">
                <ShoppingBag className="w-10 h-10 mx-auto text-zinc-600 mb-2" />
                <p className="text-sm font-semibold text-zinc-300">No store items found</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Try adjusting your search query or add a new item using the button above.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    id={`admin-item-card-${item.id}`}
                    className="group bg-zinc-900 border border-zinc-800/90 hover:border-zinc-700/90 rounded-2xl p-4 flex flex-col justify-between gap-3 transition-colors shadow-sm"
                  >
                    {/* Visual Art Preview Area */}
                    <div className="w-full h-32 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-center p-3 relative overflow-hidden">
                      {/* Badges */}
                      <div className="absolute top-2 left-2 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-zinc-850/90 text-zinc-300 border border-zinc-700">
                          {item.category}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            item.rarity === 'Legendary'
                              ? 'bg-amber-950/90 text-amber-300 border border-amber-600/50'
                              : item.rarity === 'Epic'
                              ? 'bg-purple-950/90 text-purple-300 border border-purple-600/50'
                              : item.rarity === 'Rare'
                              ? 'bg-blue-950/90 text-blue-300 border border-blue-600/50'
                              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          }`}
                        >
                          {item.rarity}
                        </span>
                      </div>

                      {item.badge && (
                        <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-amber-500 text-black shadow">
                          {item.badge}
                        </span>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <h4 className="text-sm font-bold text-zinc-100 truncate" title={item.name}>
                          {item.name}
                        </h4>
                        <div className="flex items-center gap-1 text-xs font-extrabold text-amber-400 shrink-0">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{item.price === 0 ? 'FREE' : item.price}</span>
                        </div>
                      </div>

                      {item.subtitle && (
                        <p className="text-[11px] font-medium text-zinc-400 truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      )}

                      <p className="text-xs text-zinc-500 line-clamp-2 mt-1 leading-relaxed">
                        {item.description || 'No description provided.'}
                      </p>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-2.5 border-t border-zinc-800/80">
                      <span className="text-[10px] font-mono text-zinc-500 truncate max-w-[120px]">
                        ID: {item.id}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          id={`admin-btn-edit-${item.id}`}
                          onClick={() => handleOpenEditItem(item)}
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          id={`admin-btn-delete-${item.id}`}
                          onClick={() => handleOpenDeleteItem(item)}
                          className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/40 transition-colors cursor-pointer"
                          title="Delete item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: GAME STATISTICS & DANGER ZONE */}
        {activeTab === 'stats' && (
          <div id="admin-stats-section" className="flex flex-col gap-6">
            {/* Live Stats Overview */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-base font-bold text-zinc-100 mb-1 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-zinc-400" />
                <span>Current Gameplay Statistics</span>
              </h3>
              <p className="text-xs text-zinc-400 mb-4">
                Real-time tracking of party session rounds, user actions, and KABOOM bomb statistics.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-xs font-medium text-zinc-400 block">Roulette Rounds</span>
                  <span className="text-2xl font-black text-white mt-1 block">
                    {stats.totalRouletteRounds.toLocaleString()}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-xs font-medium text-zinc-400 block">Bottle Spins</span>
                  <span className="text-2xl font-black text-white mt-1 block">
                    {stats.totalBottleSpins.toLocaleString()}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-xs font-medium text-zinc-400 block">Kaboom Rounds</span>
                  <span className="text-2xl font-black text-white mt-1 block">
                    {(stats.kaboom?.totalRounds || stats.totalKaboomRounds || 0).toLocaleString()}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-xs font-medium text-zinc-400 block">Kaboom Victories</span>
                  <span className="text-2xl font-black text-emerald-400 mt-1 block">
                    {(stats.kaboom?.victories || 0).toLocaleString()}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-xs font-medium text-zinc-400 block">Bonuses Collected</span>
                  <span className="text-2xl font-black text-amber-400 mt-1 block">
                    {(stats.kaboom?.bonusCollected || 0).toLocaleString()}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-xs font-medium text-zinc-400 block">Bomb Detonations</span>
                  <span className="text-2xl font-black text-red-400 mt-1 block">
                    {(stats.kaboom?.bombHits || 0).toLocaleString()}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-xs font-medium text-zinc-400 block">Kaboom Win Rate</span>
                  <span className="text-2xl font-black text-cyan-400 mt-1 block">
                    {stats.kaboom?.winrate || 0}%
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-xs font-medium text-zinc-400 block">Last Active</span>
                  <span className="text-xs font-semibold text-zinc-300 mt-2 block truncate">
                    {stats.lastPlayedAt ? new Date(stats.lastPlayedAt).toLocaleTimeString() : 'Never'}
                  </span>
                </div>
              </div>
            </div>

            {/* Strict Danger Zone: Statistics Reset Requirement */}
            <div
              id="admin-danger-zone"
              className="p-6 rounded-2xl bg-red-950/20 border border-red-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span>Danger Zone: Reset Statistics</span>
                </div>
                <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
                  Permanently clear all recorded rounds, victories, and player telemetry back to zero.
                  In accordance with strict security standards, you must type{' '}
                  <span className="font-mono font-bold text-red-300">RESET</span> in the confirmation
                  dialog to perform this action.
                </p>
              </div>

              <button
                type="button"
                id="admin-btn-open-reset-stats"
                onClick={() => {
                  SoundEngine.playButtonClick();
                  setIsResetStatsModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer shrink-0 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Reset Statistics</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: ECONOMY & PLAYER SETUP */}
        {activeTab === 'economy' && (
          <div id="admin-economy-section" className="flex flex-col gap-6">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-base font-bold text-zinc-100 mb-1 flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400" />
                <span>Player Currency & Unlocked Items</span>
              </h3>
              <p className="text-xs text-zinc-400 mb-6">
                Adjust testing currency or quickly unlock store catalogue skins for preview.
              </p>

              <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-zinc-400 font-medium">Current Player Stars</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
                    <span className="text-3xl font-black text-white">
                      {economy.stars.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAdjustStars(500)}
                    className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 border border-zinc-700 transition-colors cursor-pointer"
                  >
                    +500 Stars
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustStars(2500)}
                    className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 border border-zinc-700 transition-colors cursor-pointer"
                  >
                    +2,500 Stars
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustStars(-500)}
                    className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 border border-zinc-700 transition-colors cursor-pointer"
                  >
                    -500 Stars
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-zinc-300 block">
                    Unlocked Catalogue Items ({economy.unlockedItems.length})
                  </span>
                  <span className="text-xs text-zinc-500">
                    Grant all current items to the active testing player profile.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleUnlockAllStoreItems}
                  className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Unlock All Store Items
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Add / Edit Store Item Modal */}
      <StoreItemModal
        isOpen={isItemModalOpen}
        item={editingItem}
        defaultCategory={activeCategory === 'all' ? 'bottles' : activeCategory}
        onClose={() => setIsItemModalOpen(false)}
        onSave={handleSaveItem}
      />

      {/* Delete Item Confirmation Modal */}
      <DeleteItemConfirmModal
        isOpen={isDeleteModalOpen}
        item={itemToDelete}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setItemToDelete(null);
        }}
        onConfirmDelete={handleConfirmDeleteItem}
      />

      {/* Reset Statistics Confirmation Modal (Requires typing 'RESET') */}
      <ResetStatsConfirmModal
        isOpen={isResetStatsModalOpen}
        onClose={() => setIsResetStatsModalOpen(false)}
        onConfirmReset={handleExecuteStatsReset}
      />

      {/* Reset Catalogue to Defaults Modal */}
      {isResetCatalogueModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center pt-[max(1.5rem,calc(env(safe-area-inset-top)+1rem))] pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))] px-4 bg-black/85 backdrop-blur-md animate-fadeIn"
          onClick={() => setIsResetCatalogueModalOpen(false)}
        >
          <div
            className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-md w-full text-zinc-100 flex flex-col gap-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-950/60 text-amber-400 border border-amber-800/60">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">Restore Default Store Catalogue</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Reset the store catalogue to the original default items list.
                </p>
              </div>
            </div>
            <p className="text-xs text-zinc-300">
              Any custom items created will be replaced with standard default items.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsResetCatalogueModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-750 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRestoreDefaultCatalogue}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 transition-colors cursor-pointer"
              >
                Restore Defaults
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

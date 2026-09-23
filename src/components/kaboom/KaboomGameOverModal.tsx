/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Bomb, Flame, RotateCcw, Grid, Trophy, Sparkles, ShieldAlert } from 'lucide-react';
import { SoundEngine, Haptics } from '../../lib/audio';
import kaboomBombImg from '../../assets/images/Bomb Sprite.png';

interface KaboomGameOverModalProps {
  detonatorName: string;
  gridTitle: string;
  turnsSurvived: number;
  bonusesFound: number;
  totalBonuses: number;
  safeCleared: number;
  totalSafe: number;
  onPlayAgain: () => void;
  onSelectBoard: () => void;
}

export const KaboomGameOverModal: React.FC<KaboomGameOverModalProps> = ({
  detonatorName,
  gridTitle,
  turnsSurvived,
  bonusesFound,
  totalBonuses,
  safeCleared,
  totalSafe,
  onPlayAgain,
  onSelectBoard,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-red-950 via-slate-950 to-black border-2 border-red-500/80 p-6 shadow-[0_0_60px_rgba(239,68,68,0.6)] text-center animate-screen-shake">
        {/* Floating Bomb Flame Icon */}
        <div className="mx-auto -mt-14 mb-3 w-22 h-22 rounded-2xl bg-gradient-to-tr from-red-600 via-orange-500 to-amber-500 border-2 border-red-300 shadow-[0_0_35px_rgba(239,68,68,0.9)] flex items-center justify-center p-1 overflow-hidden transform rotate-6">
          <img
            src={kaboomBombImg}
            alt="Detonated Bomb"
            className="w-full h-full object-contain filter drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] brightness-110"
          />
        </div>

        {/* Warning Tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/50 text-red-400 text-xs font-header font-bold tracking-widest uppercase mb-2">
          <Flame className="w-3.5 h-3.5 text-orange-400" />
          DETONATION TRIGGERED
        </div>

        {/* Headline */}
        <h2 className="font-header text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-amber-300 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] tracking-wide mb-1">
          KABOOM!
        </h2>
        <div className="font-header text-lg font-bold text-red-200 mb-2">
          YOU HIT THE BOMB!
        </div>

        {/* Detonator Callout */}
        <div className="font-body bg-red-950/60 border border-red-500/30 rounded-2xl py-2 px-4 mb-5 text-sm text-red-200">
          <span className="font-bold text-white text-base">{detonatorName}</span> triggered the lethal bomb!
        </div>

        {/* Round Statistics Grid */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="rounded-2xl bg-slate-900/90 border border-purple-500/30 p-2.5 flex flex-col items-center justify-center">
            <span className="font-subbody text-[10px] uppercase font-semibold text-gray-400 tracking-wider">Board</span>
            <span className="font-header text-xs font-bold text-cyan-300 truncate w-full text-center mt-0.5">{gridTitle}</span>
          </div>

          <div className="rounded-2xl bg-slate-900/90 border border-purple-500/30 p-2.5 flex flex-col items-center justify-center">
            <span className="font-subbody text-[10px] uppercase font-semibold text-gray-400 tracking-wider">Survived</span>
            <span className="font-header text-sm font-bold text-amber-300 mt-0.5">{turnsSurvived} Turns</span>
          </div>

          <div className="rounded-2xl bg-slate-900/90 border border-purple-500/30 p-2.5 flex flex-col items-center justify-center">
            <span className="font-subbody text-[10px] uppercase font-semibold text-gray-400 tracking-wider">Bonuses</span>
            <span className="font-header text-sm font-bold text-yellow-300 mt-0.5">
              {bonusesFound}/{totalBonuses}
            </span>
          </div>
        </div>

        {/* Progress Bar of Cleared Safe Balls */}
        <div className="bg-slate-900/80 rounded-xl p-3 border border-purple-500/20 mb-6">
          <div className="flex justify-between text-xs text-gray-300 mb-1.5 font-subbody font-medium">
            <span>Safe Balls Cleared</span>
            <span className="font-header font-bold text-emerald-400">
              {safeCleared} of {totalSafe} ({Math.round((safeCleared / (totalSafe || 1)) * 100)}%)
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
              style={{ width: `${Math.min(100, Math.round((safeCleared / (totalSafe || 1)) * 100))}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            id="kaboom-play-again-button"
            type="button"
            onClick={() => {
              SoundEngine.playButtonClick();
              Haptics.buttonClick();
              onPlayAgain();
            }}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 text-white font-header font-bold text-base shadow-[0_0_20px_rgba(239,68,68,0.6)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer animate-glow-pulse-restart"
          >
            <RotateCcw className="w-5 h-5 stroke-[2.5]" />
            <span>PLAY AGAIN (SAME SIZE)</span>
          </button>

          <button
            id="kaboom-select-board-button"
            type="button"
            onClick={() => {
              SoundEngine.playButtonClick();
              Haptics.buttonClick();
              onSelectBoard();
            }}
            className="w-full py-3 px-5 rounded-2xl bg-slate-900/90 border border-purple-400/40 text-purple-200 font-header font-bold text-sm hover:border-purple-300 hover:text-white active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.2)]"
          >
            <Grid className="w-4 h-4 stroke-[2]" />
            <span>SELECT NEW BOARD SIZE</span>
          </button>
        </div>
      </div>
    </div>
  );
};

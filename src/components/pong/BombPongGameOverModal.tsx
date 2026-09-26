/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { Trophy, RotateCcw, Home, Zap, Flame, Award, Coins } from 'lucide-react';
import { SoundEngine, Haptics } from '../../lib/audio';

interface BombPongGameOverModalProps {
  isOpen: boolean;
  winner: 'player1' | 'player2';
  player1Score: number;
  player2Score: number;
  longestRally: number;
  totalBounces: number;
  maxSpeed: number;
  isBotGame: boolean;
  isSoloGame?: boolean;
  rewardCoins: number;
  onPlayAgain: () => void;
  onExit: () => void;
}

export const BombPongGameOverModal: React.FC<BombPongGameOverModalProps> = ({
  isOpen,
  winner,
  player1Score,
  player2Score,
  longestRally,
  totalBounces,
  maxSpeed,
  isBotGame,
  isSoloGame = false,
  rewardCoins,
  onPlayAgain,
  onExit,
}) => {
  useEffect(() => {
    if (isOpen) {
      SoundEngine.playBonusFanfare();
      Haptics.heavy();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isP1Winner = winner === 'player1';
  const winnerTitle = isSoloGame
    ? 'SOLO RALLY COMPLETE!'
    : isBotGame
    ? isP1Winner
      ? 'VICTORY!'
      : 'CYBER BOT WINS!'
    : isP1Winner
    ? 'PLAYER 1 WINS!'
    : 'PLAYER 2 WINS!';

  const winnerSubtitle = isSoloGame
    ? `Masterful dual control! Longest rally streak: ${longestRally} volleys!`
    : isBotGame
    ? isP1Winner
      ? 'You detonated the Cyber Bot!'
      : 'The Cyber Bot survived the bombardment!'
    : isP1Winner
    ? 'Bottom Neon Striker prevailed!'
    : 'Top Cyber Defender prevailed!';

  const winnerColor = isSoloGame ? 'text-purple-400' : isP1Winner ? 'text-cyan-400' : 'text-pink-400';
  const winnerBorder = isSoloGame
    ? 'border-purple-500/50 shadow-[0_0_35px_rgba(168,85,247,0.4)]'
    : isP1Winner
    ? 'border-cyan-500/50 shadow-[0_0_35px_rgba(6,182,212,0.4)]'
    : 'border-pink-500/50 shadow-[0_0_35px_rgba(236,72,153,0.4)]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-sm rounded-3xl bg-slate-900/95 border ${winnerBorder} p-6 flex flex-col items-center text-center relative overflow-hidden`}
      >
        {/* Glow backdrop behind trophy */}
        <div
          className={`absolute -top-12 w-48 h-48 rounded-full blur-3xl opacity-30 ${
            isP1Winner ? 'bg-cyan-500' : 'bg-pink-500'
          }`}
        />

        {/* Winner Badge */}
        <div className="relative mb-3 mt-1">
          <div
            className={`w-20 h-20 rounded-2xl flex items-center justify-center border ${
              isP1Winner
                ? 'bg-gradient-to-tr from-cyan-900/70 to-cyan-500/30 border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.6)]'
                : 'bg-gradient-to-tr from-pink-900/70 to-pink-500/30 border-pink-400/60 shadow-[0_0_20px_rgba(236,72,153,0.6)]'
            }`}
          >
            <Trophy className={`w-10 h-10 ${winnerColor} animate-bounce`} />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-amber-500 rounded-full p-1 border-2 border-slate-900 shadow">
            <Flame className="w-4 h-4 text-white animate-pulse" />
          </div>
        </div>

        {/* Title */}
        <h2 className={`text-2xl font-black tracking-wider uppercase ${winnerColor} drop-shadow-md`}>
          {winnerTitle}
        </h2>
        <p className="text-xs text-slate-300 mt-1 mb-4 font-medium">{winnerSubtitle}</p>

        {/* Score Board */}
        <div className="w-full grid grid-cols-2 gap-3 mb-4">
          {/* Box 1 */}
          <div
            className={`p-3 rounded-2xl border ${
              isSoloGame
                ? 'bg-purple-950/40 border-purple-500/60 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                : isP1Winner
                ? 'bg-cyan-950/40 border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'bg-slate-800/40 border-slate-700/60'
            }`}
          >
            <div className={`text-[11px] font-bold tracking-wider ${isSoloGame ? 'text-purple-400' : 'text-cyan-400'}`}>
              {isSoloGame ? 'TOTAL BOUNCES' : isBotGame ? 'YOU (P1)' : 'PLAYER 1'}
            </div>
            <div className="text-2xl font-black text-white mt-0.5">
              {isSoloGame ? totalBounces : player1Score}
            </div>
            <div className="text-[10px] text-slate-400">
              {isSoloGame ? 'Volleys' : 'Wins'}
            </div>
          </div>

          {/* Box 2 */}
          <div
            className={`p-3 rounded-2xl border ${
              isSoloGame
                ? 'bg-indigo-950/40 border-indigo-500/60 shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                : !isP1Winner
                ? 'bg-pink-950/40 border-pink-500/60 shadow-[0_0_12px_rgba(236,72,153,0.3)]'
                : 'bg-slate-800/40 border-slate-700/60'
            }`}
          >
            <div className={`text-[11px] font-bold tracking-wider ${isSoloGame ? 'text-indigo-400' : 'text-pink-400'}`}>
              {isSoloGame ? 'BEST RALLY' : isBotGame ? 'CYBER BOT' : 'PLAYER 2'}
            </div>
            <div className="text-2xl font-black text-white mt-0.5">
              {isSoloGame ? longestRally : player2Score}
            </div>
            <div className="text-[10px] text-slate-400">
              {isSoloGame ? 'Streak' : 'Wins'}
            </div>
          </div>
        </div>

        {/* Match Statistics */}
        <div className="w-full bg-slate-800/60 border border-slate-700/70 rounded-2xl p-3 mb-4 space-y-2 text-left">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-1.5 text-amber-300 font-semibold">
              <Zap className="w-3.5 h-3.5" /> Longest Rally
            </span>
            <span className="font-bold text-white">{longestRally} hits</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-1.5 text-cyan-300 font-semibold">
              <Flame className="w-3.5 h-3.5" /> Max Bomb Velocity
            </span>
            <span className="font-bold text-white">{(maxSpeed * 30).toFixed(0)} km/h</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-1.5 text-purple-300 font-semibold">
              <Award className="w-3.5 h-3.5" /> Total Bounces
            </span>
            <span className="font-bold text-white">{totalBounces}</span>
          </div>
        </div>

        {/* Coins Reward */}
        {rewardCoins > 0 && (
          <div className="w-full bg-gradient-to-r from-amber-500/15 via-yellow-500/20 to-amber-500/15 border border-amber-500/30 rounded-2xl py-2 px-3 mb-4 flex items-center justify-center gap-2">
            <Coins className="w-4 h-4 text-amber-400 animate-spin" />
            <span className="text-xs font-bold text-amber-300">
              +{rewardCoins} Neon Coins Earned!
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full space-y-2">
          <button
            onClick={() => {
              SoundEngine.playButtonClick();
              Haptics.buttonClick();
              onPlayAgain();
            }}
            className="w-full py-3.5 rounded-2xl font-black text-sm tracking-wider uppercase text-white bg-gradient-to-r from-cyan-500 via-indigo-500 to-pink-500 hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(99,102,241,0.5)] flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4 stroke-[2.5]" />
            Rematch Duel
          </button>

          <button
            onClick={() => {
              SoundEngine.playButtonClick();
              Haptics.buttonClick();
              onExit();
            }}
            className="w-full py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase text-slate-400 hover:text-white hover:bg-white/5 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <Home className="w-3.5 h-3.5" />
            Return to Arena Hub
          </button>
        </div>
      </div>
    </div>
  );
};

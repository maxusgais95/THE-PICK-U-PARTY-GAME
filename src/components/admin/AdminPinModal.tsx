/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Lock, Shield, Delete, X, AlertCircle } from 'lucide-react';
import { SoundEngine, Haptics } from '../../lib/audio';

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const REQUIRED_PIN = '12345';
const PIN_LENGTH = 5;

export const AdminPinModal: React.FC<AdminPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState<boolean>(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(null);
      setIsShaking(false);
    }
  }, [isOpen]);

  const verifyPin = useCallback((candidate: string) => {
    if (candidate === REQUIRED_PIN) {
      SoundEngine.playBonusFanfare();
      Haptics.bonusClaim();
      onSuccess();
    } else {
      SoundEngine.playBombExplosion();
      Haptics.bombExplosion();
      setError('Incorrect security PIN. Access denied.');
      setIsShaking(true);
      setTimeout(() => {
        setIsShaking(false);
        setPin('');
      }, 600);
    }
  }, [onSuccess]);

  const handleDigitPress = useCallback((digit: string) => {
    if (isShaking) return;
    setError(null);
    SoundEngine.playButtonClick();
    Haptics.buttonClick();

    setPin((prev) => {
      if (prev.length >= PIN_LENGTH) return prev;
      const next = prev + digit;
      if (next.length === PIN_LENGTH) {
        setTimeout(() => verifyPin(next), 80);
      }
      return next;
    });
  }, [isShaking, verifyPin]);

  const handleDelete = useCallback(() => {
    if (isShaking) return;
    setError(null);
    SoundEngine.playButtonClick();
    Haptics.buttonClick();
    setPin((prev) => prev.slice(0, -1));
  }, [isShaking]);

  const handleClear = useCallback(() => {
    if (isShaking) return;
    setError(null);
    SoundEngine.playButtonClick();
    setPin('');
  }, [isShaking]);

  // Support hardware keyboard input
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleDigitPress, handleDelete, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pt-[max(1.5rem,calc(env(safe-area-inset-top)+1rem))] pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))] px-4 bg-black/85 backdrop-blur-xl animate-fadeIn">
      <div
        className="glass-panel relative w-full max-w-sm flex flex-col overflow-hidden shadow-2xl rounded-[28px] border border-amber-500/30 bg-zinc-950/95"
        style={{
          boxShadow: '0 24px 60px -10px rgba(0, 0, 0, 0.95), 0 0 35px rgba(245, 158, 11, 0.2)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <Shield className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="font-header text-sm font-black uppercase tracking-wider text-white">
                Admin Authentication
              </h2>
              <p className="text-[10px] text-zinc-400">
                Authorized Personnel Only
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              SoundEngine.playButtonClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex flex-col items-center">
          {/* Lock Icon Emblem */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
            <Lock className="w-6 h-6 text-amber-400" />
          </div>

          <p className="text-xs font-medium text-zinc-300 text-center mb-5">
            Enter the 5-digit security PIN to unlock the dashboard
          </p>

          {/* Masked PIN Dots */}
          <div
            className={`flex items-center justify-center gap-3.5 mb-5 transition-transform ${
              isShaking ? 'animate-shake' : ''
            }`}
          >
            {Array.from({ length: PIN_LENGTH }).map((_, index) => {
              const isFilled = index < pin.length;
              return (
                <div
                  key={index}
                  className={`w-4 h-4 rounded-full border transition-all duration-200 ${
                    isFilled
                      ? 'bg-amber-400 border-amber-300 shadow-[0_0_12px_#f59e0b] scale-110'
                      : 'bg-zinc-800/80 border-zinc-600/60'
                  }`}
                />
              );
            })}
          </div>

          {/* Error Message */}
          <div className="min-h-[22px] flex items-center justify-center mb-3">
            {error && (
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-400 animate-fadeIn">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Custom Numeric Numpad */}
          <div className="w-full max-w-[260px] grid grid-cols-3 gap-2.5">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleDigitPress(digit)}
                className="h-12 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 active:bg-amber-500/20 active:border-amber-500/50 border border-zinc-700/60 text-lg font-black text-white shadow-sm transition-all active:scale-95 cursor-pointer flex items-center justify-center"
              >
                {digit}
              </button>
            ))}

            <button
              type="button"
              onClick={handleClear}
              className="h-12 rounded-2xl bg-zinc-900/50 hover:bg-zinc-800/80 active:bg-zinc-800 border border-zinc-800 text-xs font-bold text-zinc-400 hover:text-zinc-200 transition-all active:scale-95 cursor-pointer flex items-center justify-center"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={() => handleDigitPress('0')}
              className="h-12 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 active:bg-amber-500/20 active:border-amber-500/50 border border-zinc-700/60 text-lg font-black text-white shadow-sm transition-all active:scale-95 cursor-pointer flex items-center justify-center"
            >
              0
            </button>

            <button
              type="button"
              onClick={handleDelete}
              className="h-12 rounded-2xl bg-zinc-900/50 hover:bg-zinc-800/80 active:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-rose-400 transition-all active:scale-95 cursor-pointer flex items-center justify-center"
              aria-label="Delete"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-zinc-900/60 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-500">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-zinc-400" />
            <span>Encrypted Session</span>
          </span>
          <button
            type="button"
            onClick={() => {
              SoundEngine.playButtonClick();
              onClose();
            }}
            className="text-zinc-400 hover:text-zinc-200 font-semibold cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

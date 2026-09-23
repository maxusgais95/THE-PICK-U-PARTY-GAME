/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, Check, ShieldAlert } from 'lucide-react';
import { SoundEngine, Haptics } from '../../lib/audio';

interface ResetStatsConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: () => Promise<void> | void;
}

export const ResetStatsConfirmModal: React.FC<ResetStatsConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirmReset,
}) => {
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setInputText('');
      setErrorMsg(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isResetValid = inputText.trim() === 'RESET';

  const handleConfirm = async () => {
    if (!isResetValid) {
      setErrorMsg('Please type RESET exactly as shown to proceed.');
      return;
    }

    try {
      setIsSubmitting(true);
      SoundEngine.playButtonClick();
      Haptics.buttonClick();
      await onConfirmReset();
      onClose();
    } catch (err) {
      setErrorMsg('Failed to reset statistics. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="reset-stats-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="reset-stats-modal-dialog"
        className="relative w-full max-w-md bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl p-6 text-zinc-100 flex flex-col gap-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-modal-title"
      >
        {/* Close Icon Button */}
        <button
          type="button"
          id="btn-close-reset-modal"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning Header */}
        <div className="flex items-start gap-3.5 pr-6">
          <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-800/60 text-red-400 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 id="reset-modal-title" className="text-lg font-bold text-zinc-100">
              Reset All Statistics
            </h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              This action will permanently wipe all player game statistics, rounds, victories, and win percentages back to zero.
            </p>
          </div>
        </div>

        {/* Requirement Notice & Instructions */}
        <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Verification Required</span>
          </div>
          <p className="text-xs text-zinc-300">
            To prevent accidental data loss, please type{' '}
            <span className="font-mono font-black text-red-400 px-1.5 py-0.5 rounded bg-red-950/60 border border-red-800/50">
              RESET
            </span>{' '}
            in the textbox below to confirm:
          </p>
        </div>

        {/* Verification Input */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="reset-stats-textbox" className="text-xs font-medium text-zinc-400">
            Type <span className="font-mono font-bold text-zinc-200">RESET</span> to unlock:
          </label>
          <div className="relative">
            <input
              id="reset-stats-textbox"
              type="text"
              autoFocus
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isResetValid && !isSubmitting) {
                  handleConfirm();
                }
              }}
              placeholder="Type RESET here"
              className={`w-full px-4 py-2.5 bg-zinc-950 border rounded-xl font-mono text-center tracking-widest text-base font-bold text-white placeholder:text-zinc-600 focus:outline-none transition-colors ${
                isResetValid
                  ? 'border-emerald-500 focus:border-emerald-400 text-emerald-300'
                  : 'border-zinc-700 focus:border-zinc-500 text-zinc-200'
              }`}
            />
            {isResetValid && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 flex items-center">
                <Check className="w-5 h-5" />
              </div>
            )}
          </div>
          {errorMsg && (
            <span className="text-[11px] font-medium text-red-400 mt-0.5">
              {errorMsg}
            </span>
          )}
        </div>

        {/* Dialog Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-800/80">
          <button
            type="button"
            id="btn-cancel-reset-stats"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-750 active:scale-98 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            id="confirm-reset-button"
            disabled={!isResetValid || isSubmitting}
            onClick={handleConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              isResetValid && !isSubmitting
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)] active:scale-95 cursor-pointer'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50'
            }`}
          >
            {isSubmitting ? (
              <span>Resetting...</span>
            ) : (
              <span>Reset Statistics</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

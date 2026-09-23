/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { StoreItem } from '../../lib/economy';

interface DeleteItemConfirmModalProps {
  isOpen: boolean;
  item: StoreItem | null;
  onClose: () => void;
  onConfirmDelete: (itemId: string) => void;
}

export const DeleteItemConfirmModal: React.FC<DeleteItemConfirmModalProps> = ({
  isOpen,
  item,
  onClose,
  onConfirmDelete,
}) => {
  if (!isOpen || !item) return null;

  return (
    <div
      id="delete-item-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="delete-item-modal-dialog"
        className="relative w-full max-w-md bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl p-6 text-zinc-100 flex flex-col gap-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          id="btn-close-delete-item-modal"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-3.5 pr-6">
          <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-800/60 text-red-400 shrink-0">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-100">Delete Store Item</h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Are you sure you want to remove{' '}
              <span className="font-bold text-zinc-200">"{item.name}"</span> from the store catalogue?
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 space-y-1">
          <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Equipment Safety Check</span>
          </div>
          <p>
            If any player currently has this item equipped, the game will automatically switch back to the default item.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-800/80">
          <button
            type="button"
            id="btn-cancel-delete-item"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-750 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            id="btn-confirm-delete-item"
            onClick={() => {
              onConfirmDelete(item.id);
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Item</span>
          </button>
        </div>
      </div>
    </div>
  );
};

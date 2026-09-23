/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { WifiOff, Zap } from 'lucide-react';
import { useOnlineStatus } from '../lib/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      id="pwa-offline-indicator"
      className="font-subbody fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/90 border border-cyan-400/40 text-cyan-200 text-xs font-semibold backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.3)] animate-bounce select-none pointer-events-none"
    >
      <WifiOff className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
      <span>Offline Mode Active — 100% Cached Party Suite</span>
      <Zap className="w-3 h-3 text-yellow-400 shrink-0 fill-yellow-400" />
    </div>
  );
};

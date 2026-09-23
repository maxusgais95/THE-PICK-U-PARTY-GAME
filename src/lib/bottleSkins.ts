/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import btlE001 from '../assets/images/Btl_E_001.webp';
import btlE002 from '../assets/images/Btl_E_002.webp';
import btlE003 from '../assets/images/Btl_E_003.webp';
import btlE004 from '../assets/images/Btl_E_004.webp';
import { BottleBlendMode, BottleBuiltinStyle } from '../types';
import { preloadTransparentImages } from './bottleAlphaCache';

export interface BottleSkin {
  id: BottleBuiltinStyle;
  image: string;
  accentColor: string;
  defaultBlendMode: BottleBlendMode;
}

export const BOTTLE_SKINS: BottleSkin[] = [
  {
    id: 'btl_e_001',
    image: btlE001,
    accentColor: '#00f0ff',
    defaultBlendMode: 'screen',
  },
  {
    id: 'btl_e_002',
    image: btlE002,
    accentColor: '#d946ef',
    defaultBlendMode: 'screen',
  },
  {
    id: 'btl_e_003',
    image: btlE003,
    accentColor: '#ff007a',
    defaultBlendMode: 'screen',
  },
  {
    id: 'btl_e_004',
    image: btlE004,
    accentColor: '#f59e0b',
    defaultBlendMode: 'screen',
  },
];

// Eagerly preload and convert images to transparent PNGs in memory
if (typeof window !== 'undefined') {
  preloadTransparentImages(BOTTLE_SKINS.map((b) => b.image));
}

export function getBottleSkin(id: string): BottleSkin {
  return BOTTLE_SKINS.find((b) => b.id === id) || BOTTLE_SKINS[0];
}

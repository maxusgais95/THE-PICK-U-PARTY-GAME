/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BottleBlendMode, BottleBuiltinStyle, CustomBottleSprite, ThemeColors } from '../types';
import { getBottleSkin } from '../lib/bottleSkins';
import { useTransparentImage } from '../lib/bottleAlphaCache';
import { getStoreCatalogue } from '../lib/economy';

interface BottleSpriteProps {
  styleType: BottleBuiltinStyle | 'custom' | string;
  customSprite: CustomBottleSprite | null;
  themeColors: ThemeColors;
  className?: string;
  blendMode?: BottleBlendMode;
}

export const BottleSpriteRenderer: React.FC<BottleSpriteProps> = ({
  styleType,
  customSprite,
  className,
  blendMode,
}) => {
  // If custom uploaded sprite exists and selected
  if (styleType === 'custom' && customSprite && customSprite.dataUrl) {
    const customClass = className || 'w-[min(93vw,88vh)] h-[min(93vw,88vh)] max-w-[762px] max-h-[906px]';
    const effectiveBlend = blendMode || customSprite.blendMode || 'color-dodge';
    const validBlend = (effectiveBlend === 'screen' || effectiveBlend === 'color-dodge') ? effectiveBlend : 'normal';

    return (
      <div
        className={`relative flex items-center justify-center overflow-visible ${customClass}`}
        style={{
          overflow: 'visible',
          mixBlendMode: validBlend !== 'normal' ? (validBlend as any) : undefined,
        }}
      >
        <img
          src={customSprite.dataUrl}
          alt="Custom Bottle"
          className="w-full h-full object-contain pointer-events-none scale-[1.13] sm:scale-[1.24] md:scale-[1.34]"
          style={{
            transform: (!customSprite.originalDataUrl && customSprite.rotationOffset)
              ? `rotate(${customSprite.rotationOffset}deg)`
              : undefined,
            overflow: 'visible',
          }}
        />
      </div>
    );
  }

  // Look for matching store catalogue bottle (supports custom created store bottles and preset skins)
  const storeBottles = getStoreCatalogue().bottles;
  const matchedStoreBottle = storeBottles.find(
    (b) => b.builtInBottleStyle === styleType || b.id === styleType
  );

  const skin = getBottleSkin(styleType);
  const bottleImgSrc = matchedStoreBottle?.image || skin.image;
  const transparentSrc = useTransparentImage(bottleImgSrc);
  const skinClass = className || 'w-[min(93vw,88vh)] h-[min(93vw,88vh)] max-w-[762px] max-h-[906px]';

  return (
    <div
      className={`relative flex items-center justify-center overflow-visible ${skinClass}`}
      style={{ overflow: 'visible' }}
    >
      <img
        src={transparentSrc || bottleImgSrc}
        alt={matchedStoreBottle?.name || "Bottle"}
        className="w-full h-full object-contain pointer-events-none scale-[1.13] sm:scale-[1.24] md:scale-[1.34] select-none"
        style={{
          overflow: 'visible',
          ...(matchedStoreBottle?.cssFilter ? { filter: matchedStoreBottle.cssFilter } : {}),
        }}
      />
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BottleBlendMode, BottleBuiltinStyle, CustomBottleSprite, ThemeColors } from '../types';
import { getBottleSkin } from '../lib/bottleSkins';
import { useTransparentImage } from '../lib/bottleAlphaCache';

interface BottleSpriteProps {
  styleType: BottleBuiltinStyle | 'custom';
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
  const skin = getBottleSkin(styleType);
  const transparentPresetSrc = useTransparentImage(skin.image);
  const transparentCustomSrc = useTransparentImage(customSprite?.dataUrl);

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
          src={transparentCustomSrc || customSprite.dataUrl}
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

  // Built-in Bottle Skins (Btl_E_001 to Btl_E_004)
  // Renders with dynamically auto-keyed transparent PNG - zero black background on iOS Safari and all browsers!
  const skinClass = className || 'w-[min(93vw,88vh)] h-[min(93vw,88vh)] max-w-[762px] max-h-[906px]';

  return (
    <div
      className={`relative flex items-center justify-center overflow-visible ${skinClass}`}
      style={{ overflow: 'visible' }}
    >
      <img
        src={transparentPresetSrc || skin.image}
        alt="Bottle"
        className="w-full h-full object-contain pointer-events-none scale-[1.13] sm:scale-[1.24] md:scale-[1.34] select-none"
        style={{
          overflow: 'visible',
        }}
      />
    </div>
  );
};

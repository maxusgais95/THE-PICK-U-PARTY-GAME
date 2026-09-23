/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BottleBlendMode } from '../types';

/**
 * Processes custom sprite images:
 * 1. Physical Canvas rotation baking so sprites render with full native proportions
 *    without letterboxing or shrinking down.
 * 2. Real-time Alpha Keying and Background Drop:
 *    - 'normal': maintains raw pixel opacity
 *    - 'screen': drops solid black & dark background pixels to transparent alpha with smooth falloff
 *    - 'color-dodge': drops black and boosts vibrant neon glow
 */
export async function processSpriteImage(
  sourceDataUrl: string,
  blendMode: BottleBlendMode = 'normal',
  rotationOffset: number = 0
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const normRot = ((rotationOffset % 360) + 360) % 360;
        const isSwapped = normRot === 90 || normRot === 270;
        const width = isSwapped ? img.naturalHeight : img.naturalWidth;
        const height = isSwapped ? img.naturalWidth : img.naturalHeight;

        // Generous transparent safety padding so pixels never touch canvas boundaries
        const pad = 24;
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width + pad * 2);
        canvas.height = Math.max(1, height + pad * 2);
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
          resolve(sourceDataUrl);
          return;
        }

        // Draw image onto canvas centered with physical rotation baked in
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((normRot * Math.PI) / 180);
        ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
        ctx.restore();

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        const cWidth = canvas.width;
        const cHeight = canvas.height;

        // Ensure the outer 2-pixel border is 100% transparent to prevent any rectangular edge artifacts
        for (let y = 0; y < cHeight; y++) {
          for (let x = 0; x < cWidth; x++) {
            if (x < 2 || x >= cWidth - 2 || y < 2 || y >= cHeight - 2) {
              const idx = (y * cWidth + x) * 4;
              data[idx + 3] = 0;
            }
          }
        }

        // Process pixel alpha keying if blend mode is 'screen' or 'color-dodge'
        if (blendMode === 'screen' || blendMode === 'color-dodge') {
          const len = data.length;
          // Drop black/dark background automatically
          for (let i = 0; i < len; i += 4) {
            const a = data[i + 3];
            if (a === 0) continue;

            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const maxVal = Math.max(r, g, b);

            // Clean threshold keying for solid black background
            if (maxVal <= 12) {
              data[i + 3] = 0;
            } else {
              const alpha = Math.min(255, Math.round(((maxVal - 12) / (255 - 12)) * 255));
              data[i + 3] = Math.min(a, alpha);

              // Un-premultiply colors so the glow remains vibrant
              const normAlpha = data[i + 3] / 255;
              if (normAlpha > 0.04) {
                const boost = blendMode === 'color-dodge' ? 1.15 : 1.0;
                data[i] = Math.min(255, Math.round((r / normAlpha) * boost));
                data[i + 1] = Math.min(255, Math.round((g / normAlpha) * boost));
                data[i + 2] = Math.min(255, Math.round((b / normAlpha) * boost));
              }
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        console.error('Error processing sprite image:', err);
        resolve(sourceDataUrl);
      }
    };

    img.onerror = () => {
      resolve(sourceDataUrl);
    };

    img.src = sourceDataUrl;
  });
}

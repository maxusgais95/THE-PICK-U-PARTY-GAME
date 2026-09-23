/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';

// In-memory cache for auto-alpha converted transparent data URLs
const transparentCache = new Map<string, string>();
const pendingPromises = new Map<string, Promise<string>>();

/**
 * Converts any black-background JPEG or PNG image into a transparent PNG dataURL
 * in memory without requiring an external alpha map or manual image editing.
 *
 * Algorithm (Additive Luminance to Alpha Keying):
 * 1. Black pixels (rgb <= 12) -> alpha = 0 (100% transparent).
 * 2. Neon glow & lines -> alpha = max(R, G, B) with smooth threshold falloff.
 * 3. Un-premultiplies RGB by alpha so neon colors remain bright & vibrant
 *    instead of becoming muddy/gray against backgrounds.
 */
export function processImageToTransparentPng(src: string): Promise<string> {
  if (!src) return Promise.resolve(src);

  if (transparentCache.has(src)) {
    return Promise.resolve(transparentCache.get(src)!);
  }

  if (pendingPromises.has(src)) {
    return pendingPromises.get(src)!;
  }

  const promise = new Promise<string>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
          resolve(src);
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        const len = data.length;

        for (let i = 0; i < len; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Peak color channel determines brightness of neon glow
          const maxVal = Math.max(r, g, b);

          if (maxVal <= 12) {
            // Complete transparency for black background
            data[i + 3] = 0;
          } else {
            // Smooth falloff from threshold (12) to full saturation (255)
            const alpha = Math.min(255, Math.round(((maxVal - 12) / (255 - 12)) * 255));
            data[i + 3] = alpha;

            // Un-premultiply colors so the glow remains punchy and true to original neon
            const normAlpha = alpha / 255;
            if (normAlpha > 0.04) {
              data[i] = Math.min(255, Math.round(r / normAlpha));
              data[i + 1] = Math.min(255, Math.round(g / normAlpha));
              data[i + 2] = Math.min(255, Math.round(b / normAlpha));
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);
        const transparentDataUrl = canvas.toDataURL('image/png');
        transparentCache.set(src, transparentDataUrl);
        pendingPromises.delete(src);
        resolve(transparentDataUrl);
      } catch (err) {
        console.warn('Failed to auto-key image alpha:', err);
        pendingPromises.delete(src);
        resolve(src);
      }
    };

    img.onerror = () => {
      pendingPromises.delete(src);
      resolve(src);
    };

    img.src = src;
  });

  pendingPromises.set(src, promise);
  return promise;
}

/**
 * React hook that returns an auto-keyed transparent version of the image URL.
 * Immediately returns cached dataURL if available, or seamlessly updates when processed.
 */
export function useTransparentImage(src: string | undefined): string {
  const [resolvedSrc, setResolvedSrc] = useState<string>(() => {
    if (!src) return '';
    return transparentCache.get(src) || src;
  });

  useEffect(() => {
    if (!src) {
      setResolvedSrc('');
      return;
    }

    if (transparentCache.has(src)) {
      setResolvedSrc(transparentCache.get(src)!);
      return;
    }

    let isMounted = true;
    processImageToTransparentPng(src).then((url) => {
      if (isMounted) {
        setResolvedSrc(url);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [src]);

  return resolvedSrc;
}

/**
 * Preloads and converts a list of image sources into transparent PNGs in memory
 */
export function preloadTransparentImages(sources: string[]) {
  sources.forEach((src) => {
    if (src && !transparentCache.has(src)) {
      processImageToTransparentPng(src);
    }
  });
}

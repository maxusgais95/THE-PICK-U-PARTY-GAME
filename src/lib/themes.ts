/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ThemeColors, ThemeId } from '../types';

export const THEMES: Record<ThemeId, ThemeColors> = {
  'cyber-neon': {
    id: 'cyber-neon',
    name: 'Cyber Neon',
    tagline: 'Electric Cyan & Neon Magenta',
    primary: '#00f0ff',
    secondary: '#ff2a85',
    accent: '#a855f7',
    bgBase: '#060818',
    bgGrad: 'radial-gradient(ellipse at 50% 30%, #0d1435 0%, #06091c 60%, #03040c 100%)',
    btnRouletteGrad: 'linear-gradient(90deg, #00f0ff 0%, #0077fe 26%, #7928ca 55%, #ff0080 82%, #ff2a85 100%)',
    btnRouletteShadow: '0 8px 24px -2px rgba(0, 0, 0, 0.6), 0 0 18px rgba(0, 240, 255, 0.55), 0 0 28px rgba(255, 42, 133, 0.45)',
    btnBottleGrad: 'linear-gradient(90deg, #00f0ff 0%, #0099ff 25%, #8b5cf6 55%, #ec4899 80%, #3b0764 100%)',
    btnBottleShadow: '0 8px 24px -2px rgba(0, 0, 0, 0.6), 0 0 18px rgba(139, 92, 246, 0.5), 0 0 28px rgba(0, 240, 255, 0.45)',
    laserColors: ['#00f0ff', '#00f0ff', '#ff1493', '#ff1493', '#bd00ff', '#00e5ff', '#3b82f6'],
    scannerLaserColor: '#00f0ff',
    scannerLaserGlow: '#0077fe',
    swirlStops: [
      { r: 0.0, g: 0.94, b: 1.0, hex: '#00f0ff' },   // Electric Cyan
      { r: 0.0, g: 0.55, b: 1.0, hex: '#008cff' },   // Azure Neon
      { r: 0.47, g: 0.16, b: 0.95, hex: '#7928ca' }, // Vivid Violet
      { r: 1.0, g: 0.0, b: 0.52, hex: '#ff0084' },   // Neon Fuchsia
      { r: 0.22, g: 0.03, b: 0.48, hex: '#37077a' }, // Deep Ultraviolet
    ],
    playerPalettes: [
      { gradient: 'linear-gradient(135deg, #00f0ff, #0070f3)', glow: 'rgba(0, 240, 255, 0.85)', text: '#030712', border: '#00f0ff', solid: '#00f0ff' },
      { gradient: 'linear-gradient(135deg, #ff2a85, #ff0055)', glow: 'rgba(255, 42, 133, 0.85)', text: '#ffffff', border: '#ff2a85', solid: '#ff2a85' },
      { gradient: 'linear-gradient(135deg, #ffaa00, #ff5500)', glow: 'rgba(255, 170, 0, 0.85)', text: '#030712', border: '#ffaa00', solid: '#ffaa00' },
      { gradient: 'linear-gradient(135deg, #a855f7, #6366f1)', glow: 'rgba(168, 85, 247, 0.85)', text: '#ffffff', border: '#a855f7', solid: '#a855f7' },
      { gradient: 'linear-gradient(135deg, #00ff66, #00cc44)', glow: 'rgba(0, 255, 102, 0.85)', text: '#030712', border: '#00ff66', solid: '#00ff66' },
      { gradient: 'linear-gradient(135deg, #ff6363, #ff1f71)', glow: 'rgba(255, 99, 99, 0.85)', text: '#ffffff', border: '#ff6363', solid: '#ff6363' },
      { gradient: 'linear-gradient(135deg, #ffd000, #ff8800)', glow: 'rgba(255, 208, 0, 0.85)', text: '#030712', border: '#ffd000', solid: '#ffd000' },
      { gradient: 'linear-gradient(135deg, #38bdf8, #818cf8)', glow: 'rgba(56, 189, 248, 0.85)', text: '#030712', border: '#38bdf8', solid: '#38bdf8' },
    ],
    teamPalettes: [
      { gradient: 'linear-gradient(135deg, #00f0ff, #0070f3)', glow: 'rgba(0, 240, 255, 0.85)', text: '#030712', border: '#00f0ff', solid: '#00f0ff' },
      { gradient: 'linear-gradient(135deg, #ff2a85, #ff0055)', glow: 'rgba(255, 42, 133, 0.85)', text: '#ffffff', border: '#ff2a85', solid: '#ff2a85' },
      { gradient: 'linear-gradient(135deg, #ffaa00, #ff5500)', glow: 'rgba(255, 170, 0, 0.85)', text: '#030712', border: '#ffaa00', solid: '#ffaa00' },
      { gradient: 'linear-gradient(135deg, #a855f7, #6366f1)', glow: 'rgba(168, 85, 247, 0.85)', text: '#ffffff', border: '#a855f7', solid: '#a855f7' },
    ],
  },

  'synthwave': {
    id: 'synthwave',
    name: 'Neon Sunset',
    tagline: 'Warm Tangerine & Electric Purple (IMG_0657)',
    primary: '#ff2a85',
    secondary: '#ff9e00',
    accent: '#8b5cf6',
    bgBase: '#10051d',
    bgGrad: 'radial-gradient(ellipse at 50% 30%, #290a38 0%, #12041d 60%, #05010a 100%)',
    btnRouletteGrad: 'linear-gradient(90deg, #ff057c 0%, #ff2a85 28%, #ff6e28 62%, #ff9e00 82%, #ffd000 100%)',
    btnRouletteShadow: '0 8px 24px -2px rgba(0, 0, 0, 0.6), 0 0 18px rgba(255, 42, 133, 0.55), 0 0 28px rgba(255, 158, 0, 0.45)',
    btnBottleGrad: 'linear-gradient(90deg, #ff5900 0%, #ff9e1f 22%, #ff388f 45%, #b24dfa 72%, #6b1ce0 100%)',
    btnBottleShadow: '0 8px 24px -2px rgba(0, 0, 0, 0.6), 0 0 18px rgba(178, 77, 250, 0.55), 0 0 28px rgba(255, 89, 0, 0.45)',
    laserColors: ['#ff2a85', '#ff9e00', '#ff007f', '#ff5400', '#8b5cf6', '#ffd000', '#c084fc'],
    scannerLaserColor: '#ff2a85',
    scannerLaserGlow: '#ff9e00',
    swirlStops: [
      { r: 1.0, g: 0.35, b: 0.0, hex: '#ff5900' },   // Amber Tangerine
      { r: 1.0, g: 0.62, b: 0.12, hex: '#ff9e1f' },  // Glowing Orange
      { r: 1.0, g: 0.22, b: 0.56, hex: '#ff388f' },  // Neon Coral Pink
      { r: 0.70, g: 0.30, b: 0.98, hex: '#b24dfa' }, // Orchid Violet
      { r: 0.42, g: 0.11, b: 0.88, hex: '#6b1ce0' }, // Deep Electric Purple
    ],
    playerPalettes: [
      { gradient: 'linear-gradient(135deg, #ff007f, #ff4081)', glow: 'rgba(255, 0, 127, 0.85)', text: '#ffffff', border: '#ff007f', solid: '#ff007f' },
      { gradient: 'linear-gradient(135deg, #ff9e00, #ff5400)', glow: 'rgba(255, 158, 0, 0.85)', text: '#030712', border: '#ff9e00', solid: '#ff9e00' },
      { gradient: 'linear-gradient(135deg, #9d4edd, #5a189a)', glow: 'rgba(157, 78, 221, 0.85)', text: '#ffffff', border: '#9d4edd', solid: '#9d4edd' },
      { gradient: 'linear-gradient(135deg, #ff4d6d, #c9184a)', glow: 'rgba(255, 77, 109, 0.85)', text: '#ffffff', border: '#ff4d6d', solid: '#ff4d6d' },
      { gradient: 'linear-gradient(135deg, #c77dff, #7b2cbf)', glow: 'rgba(199, 125, 255, 0.85)', text: '#ffffff', border: '#c77dff', solid: '#c77dff' },
      { gradient: 'linear-gradient(135deg, #ffb703, #fb8500)', glow: 'rgba(255, 183, 3, 0.85)', text: '#030712', border: '#ffb703', solid: '#ffb703' },
      { gradient: 'linear-gradient(135deg, #48cae4, #0077b6)', glow: 'rgba(72, 202, 228, 0.85)', text: '#030712', border: '#48cae4', solid: '#48cae4' },
      { gradient: 'linear-gradient(135deg, #ff0054, #9e0059)', glow: 'rgba(255, 0, 84, 0.85)', text: '#ffffff', border: '#ff0054', solid: '#ff0054' },
    ],
    teamPalettes: [
      { gradient: 'linear-gradient(135deg, #ff007f, #ff4081)', glow: 'rgba(255, 0, 127, 0.85)', text: '#ffffff', border: '#ff007f', solid: '#ff007f' },
      { gradient: 'linear-gradient(135deg, #ff9e00, #ff5400)', glow: 'rgba(255, 158, 0, 0.85)', text: '#030712', border: '#ff9e00', solid: '#ff9e00' },
      { gradient: 'linear-gradient(135deg, #9d4edd, #5a189a)', glow: 'rgba(157, 78, 221, 0.85)', text: '#ffffff', border: '#9d4edd', solid: '#9d4edd' },
      { gradient: 'linear-gradient(135deg, #ff4d6d, #c9184a)', glow: 'rgba(255, 77, 109, 0.85)', text: '#ffffff', border: '#ff4d6d', solid: '#ff4d6d' },
    ],
  },

  'solar-flare': {
    id: 'solar-flare',
    name: 'Solar Flare',
    tagline: 'Fiery Blaze, Electric Gold & Crimson',
    primary: '#ff3b00',
    secondary: '#ffd000',
    accent: '#ff0055',
    bgBase: '#150404',
    bgGrad: 'radial-gradient(ellipse at 50% 30%, #350909 0%, #170404 60%, #080101 100%)',
    btnRouletteGrad: 'linear-gradient(90deg, #ffd000 0%, #ff8800 28%, #ff3b00 60%, #ff0055 84%, #990033 100%)',
    btnRouletteShadow: '0 8px 24px -2px rgba(0, 0, 0, 0.6), 0 0 18px rgba(255, 59, 0, 0.6), 0 0 28px rgba(255, 208, 0, 0.45)',
    btnBottleGrad: 'linear-gradient(90deg, #ffd000 0%, #ff8800 22%, #ff3b00 48%, #ff0055 76%, #4a0404 100%)',
    btnBottleShadow: '0 8px 24px -2px rgba(0, 0, 0, 0.6), 0 0 18px rgba(255, 136, 0, 0.6), 0 0 28px rgba(255, 0, 85, 0.45)',
    laserColors: ['#ffd000', '#ff8800', '#ff3b00', '#ff0055', '#ff5500', '#ffcc00', '#ff0044'],
    scannerLaserColor: '#ffd000',
    scannerLaserGlow: '#ff3b00',
    swirlStops: [
      { r: 1.0, g: 0.82, b: 0.0, hex: '#ffd000' },   // Electric Gold
      { r: 1.0, g: 0.53, b: 0.0, hex: '#ff8800' },   // Solar Amber
      { r: 1.0, g: 0.23, b: 0.0, hex: '#ff3b00' },   // Fiery Orange
      { r: 1.0, g: 0.0, b: 0.33, hex: '#ff0055' },   // Crimson Blaze
      { r: 0.35, g: 0.02, b: 0.02, hex: '#590505' }, // Volcanic Core
    ],
    playerPalettes: [
      { gradient: 'linear-gradient(135deg, #ffd000, #ea580c)', glow: 'rgba(255, 208, 0, 0.85)', text: '#030712', border: '#ffd000', solid: '#ffd000' },
      { gradient: 'linear-gradient(135deg, #ff3b00, #b91c1c)', glow: 'rgba(255, 59, 0, 0.85)', text: '#ffffff', border: '#ff3b00', solid: '#ff3b00' },
      { gradient: 'linear-gradient(135deg, #ff0055, #881337)', glow: 'rgba(255, 0, 85, 0.85)', text: '#ffffff', border: '#ff0055', solid: '#ff0055' },
      { gradient: 'linear-gradient(135deg, #fb923c, #c2410c)', glow: 'rgba(251, 146, 60, 0.85)', text: '#030712', border: '#fb923c', solid: '#fb923c' },
      { gradient: 'linear-gradient(135deg, #fde047, #ca8a04)', glow: 'rgba(253, 224, 71, 0.85)', text: '#030712', border: '#fde047', solid: '#fde047' },
      { gradient: 'linear-gradient(135deg, #f43f5e, #9f1239)', glow: 'rgba(244, 63, 94, 0.85)', text: '#ffffff', border: '#f43f5e', solid: '#f43f5e' },
      { gradient: 'linear-gradient(135deg, #f97316, #9a3412)', glow: 'rgba(249, 115, 22, 0.85)', text: '#030712', border: '#f97316', solid: '#f97316' },
      { gradient: 'linear-gradient(135deg, #fda4af, #e11d48)', glow: 'rgba(253, 164, 175, 0.85)', text: '#030712', border: '#fda4af', solid: '#fda4af' },
    ],
    teamPalettes: [
      { gradient: 'linear-gradient(135deg, #ffd000, #ea580c)', glow: 'rgba(255, 208, 0, 0.85)', text: '#030712', border: '#ffd000', solid: '#ffd000' },
      { gradient: 'linear-gradient(135deg, #ff3b00, #b91c1c)', glow: 'rgba(255, 59, 0, 0.85)', text: '#ffffff', border: '#ff3b00', solid: '#ff3b00' },
      { gradient: 'linear-gradient(135deg, #ff0055, #881337)', glow: 'rgba(255, 0, 85, 0.85)', text: '#ffffff', border: '#ff0055', solid: '#ff0055' },
      { gradient: 'linear-gradient(135deg, #fb923c, #c2410c)', glow: 'rgba(251, 146, 60, 0.85)', text: '#030712', border: '#fb923c', solid: '#fb923c' },
    ],
  },

  'midnight-aurora': {
    id: 'midnight-aurora',
    name: 'Midnight Aurora',
    tagline: 'Northern Lights Teal, Ice Blue & Violet',
    primary: '#a855f7',
    secondary: '#38bdf8',
    accent: '#2dd4bf',
    bgBase: '#07061a',
    bgGrad: 'radial-gradient(ellipse at 50% 30%, #15103d 0%, #090724 60%, #03020e 100%)',
    btnRouletteGrad: 'linear-gradient(90deg, #2dd4bf 0%, #38bdf8 30%, #818cf8 65%, #c084fc 100%)',
    btnRouletteShadow: '0 8px 24px -2px rgba(0, 0, 0, 0.6), 0 0 18px rgba(56, 189, 248, 0.55), 0 0 28px rgba(168, 85, 247, 0.45)',
    btnBottleGrad: 'linear-gradient(90deg, #2dd4bf 0%, #38bdf8 25%, #818cf8 55%, #c084fc 80%, #1e1b4b 100%)',
    btnBottleShadow: '0 8px 24px -2px rgba(0, 0, 0, 0.6), 0 0 18px rgba(45, 212, 191, 0.55), 0 0 28px rgba(192, 132, 252, 0.45)',
    laserColors: ['#2dd4bf', '#38bdf8', '#818cf8', '#c084fc', '#a855f7', '#67e8f9', '#93c5fd'],
    scannerLaserColor: '#38bdf8',
    scannerLaserGlow: '#a855f7',
    swirlStops: [
      { r: 0.18, g: 0.83, b: 0.75, hex: '#2dd4bf' }, // Teal Aurora
      { r: 0.22, g: 0.74, b: 0.97, hex: '#38bdf8' }, // Sky Blue
      { r: 0.51, g: 0.55, b: 0.97, hex: '#818cf8' }, // Indigo Shimmer
      { r: 0.75, g: 0.52, b: 0.99, hex: '#c084fc' }, // Lavender Violet
      { r: 0.12, g: 0.11, b: 0.29, hex: '#1e1b4b' }, // Abyssal Twilight
    ],
    playerPalettes: [
      { gradient: 'linear-gradient(135deg, #38bdf8, #0284c7)', glow: 'rgba(56, 189, 248, 0.85)', text: '#030712', border: '#38bdf8', solid: '#38bdf8' },
      { gradient: 'linear-gradient(135deg, #a855f7, #7e22ce)', glow: 'rgba(168, 85, 247, 0.85)', text: '#ffffff', border: '#a855f7', solid: '#a855f7' },
      { gradient: 'linear-gradient(135deg, #2dd4bf, #0f766e)', glow: 'rgba(45, 212, 191, 0.85)', text: '#030712', border: '#2dd4bf', solid: '#2dd4bf' },
      { gradient: 'linear-gradient(135deg, #c084fc, #9333ea)', glow: 'rgba(192, 132, 252, 0.85)', text: '#ffffff', border: '#c084fc', solid: '#c084fc' },
      { gradient: 'linear-gradient(135deg, #67e8f9, #0891b2)', glow: 'rgba(103, 232, 249, 0.85)', text: '#030712', border: '#67e8f9', solid: '#67e8f9' },
      { gradient: 'linear-gradient(135deg, #818cf8, #4338ca)', glow: 'rgba(129, 140, 248, 0.85)', text: '#ffffff', border: '#818cf8', solid: '#818cf8' },
      { gradient: 'linear-gradient(135deg, #e879f9, #a21caf)', glow: 'rgba(232, 121, 249, 0.85)', text: '#ffffff', border: '#e879f9', solid: '#e879f9' },
      { gradient: 'linear-gradient(135deg, #93c5fd, #1d4ed8)', glow: 'rgba(147, 197, 253, 0.85)', text: '#030712', border: '#93c5fd', solid: '#93c5fd' },
    ],
    teamPalettes: [
      { gradient: 'linear-gradient(135deg, #38bdf8, #0284c7)', glow: 'rgba(56, 189, 248, 0.85)', text: '#030712', border: '#38bdf8', solid: '#38bdf8' },
      { gradient: 'linear-gradient(135deg, #a855f7, #7e22ce)', glow: 'rgba(168, 85, 247, 0.85)', text: '#ffffff', border: '#a855f7', solid: '#a855f7' },
      { gradient: 'linear-gradient(135deg, #2dd4bf, #0f766e)', glow: 'rgba(45, 212, 191, 0.85)', text: '#030712', border: '#2dd4bf', solid: '#2dd4bf' },
      { gradient: 'linear-gradient(135deg, #c084fc, #9333ea)', glow: 'rgba(192, 132, 252, 0.85)', text: '#ffffff', border: '#c084fc', solid: '#c084fc' },
    ],
  },
};

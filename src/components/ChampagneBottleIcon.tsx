/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface ChampagneBottleIconProps {
  className?: string;
  style?: React.CSSProperties;
}

export const ChampagneBottleIcon: React.FC<ChampagneBottleIconProps> = ({
  className = 'w-4 h-4',
  style,
}) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      {/* 
        Champagne bottle rotated diagonally 45° clockwise 
        Pointing to top-right from bottom-left
      */}
      <g transform="rotate(45 12 12)">
        {/* Rounded Champagne Cork */}
        <path
          d="M10.8 1.4 C10.8 0.8 11.3 0.4 12 0.4 C12.7 0.4 13.2 0.8 13.2 1.4 V2.7 H10.8 Z"
          fill="currentColor"
        />

        {/* Champagne Foil Collar / Neck Band */}
        <path
          d="M10.2 3.4 H13.8 V4.8 H10.2 Z"
          fill="currentColor"
        />

        {/* 
          Champagne Bottle Body: 
          Tapered neck, graceful sloping champagne shoulders, cylindrical body, and punt base 
        */}
        <path
          d="M10.8 5.5 H13.2 V8.2 C13.2 10.4 16.5 12.2 16.5 15 V21.6 C16.5 22.8 15.4 23.6 12 23.6 C8.6 23.6 7.5 22.8 7.5 21.6 V15 C7.5 12.2 10.8 10.4 10.8 8.2 Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
};

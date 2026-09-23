/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import currencyStarImg from '../../assets/images/Currency Star Sprite.webp';

interface CurrencyStarIconProps {
  className?: string;
  size?: number | string;
  alt?: string;
  style?: React.CSSProperties;
}

export const CurrencyStarIcon: React.FC<CurrencyStarIconProps> = ({
  className = 'w-4 h-4',
  size,
  alt = 'Stars',
  style,
}) => {
  return (
    <img
      src={currencyStarImg}
      alt={alt}
      style={{
        ...(size ? { width: size, height: size } : {}),
        ...style,
      }}
      className={`object-contain shrink-0 drop-shadow-[0_1px_4px_rgba(245,158,11,0.6)] select-none pointer-events-none ${className}`}
      draggable={false}
    />
  );
};

export { currencyStarImg };
export default CurrencyStarIcon;

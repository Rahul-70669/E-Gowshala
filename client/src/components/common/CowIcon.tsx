import React from 'react';

interface CowIconProps {
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
  variant?: 'color' | 'white' | 'transparent';
}

export const CowIcon: React.FC<CowIconProps> = ({
  size = 20,
  className = '',
  style = {},
  variant = 'transparent',
}) => {
  const iconSrc =
    variant === 'white'
      ? '/cow-icon-white.png'
      : '/cow-icon-transparent.png';

  const pixelSize = typeof size === 'number' ? `${size}px` : size;

  return (
    <img
      src={iconSrc}
      alt="Cow"
      className={className}
      style={{
        width: pixelSize,
        height: pixelSize,
        objectFit: 'contain',
        display: 'inline-block',
        verticalAlign: 'middle',
        ...style,
      }}
    />
  );
};

export default CowIcon;

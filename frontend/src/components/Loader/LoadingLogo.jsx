import React from 'react';
import defaultLogo from '../../assets/logos/logo.png';
import './LoadingLogo.css';

export default function LoadingLogo({
  src = defaultLogo,
  size = 120,
  fullScreen = false,
  className = '',
  style = {}
}) {
  const dimension = typeof size === 'number' ? `${size}px` : size;

  const content = (
    <div className={`logo-loader-wrapper ${className}`} style={style}>
      <img
        src={src}
        alt="Loading..."
        className="logo-loader-img"
        style={{
          width: dimension,
          height: dimension
        }}
      />
    </div>
  );

  if (fullScreen) {
    return <div className="logo-loader-fullscreen">{content}</div>;
  }

  return content;
}

export const LogoLoader = LoadingLogo;

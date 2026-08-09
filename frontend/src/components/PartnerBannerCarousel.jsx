import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import referBanner from '../modules/partner/banner/refer.jpeg';
import teamBanner from '../modules/partner/banner/team.jpeg';

const banners = [
  {
    id: 'team',
    image: teamBanner,
    alt: 'Add Team Member - Earn up to 50000/month',
    link: '/partner/team'
  },
  {
    id: 'refer',
    image: referBanner,
    alt: 'Refer and Earn - Earn up to 500 per referral',
    link: '/partner/referral'
  }
];

export default function PartnerBannerCarousel({ showOnlyRefer = false }) {
  const { C, isDark } = useTheme();
  const location = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Filter banners based on showOnlyRefer prop
  const activeBanners = showOnlyRefer ? banners.filter(b => b.id === 'refer') : banners;

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    
    const interval = setInterval(() => {
      if (!isPaused) {
        setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
      }
    }, 4000); // Rotate every 4 seconds

    return () => clearInterval(interval);
  }, [isPaused, activeBanners.length]);

  const handleBannerClick = (link) => {
    if (link && link !== location.pathname) {
      window.location.href = link;
    }
  };

  if (!activeBanners.length) return null;

  return (
    <div
      style={{
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '12px',
        cursor: 'pointer',
        height: '100px',
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onClick={() => handleBannerClick(activeBanners[currentIndex].link)}
    >
      <img
        src={activeBanners[currentIndex].image}
        alt={activeBanners[currentIndex].alt}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          display: 'block',
        }}
      />

      {/* Dots indicator - only show if multiple banners */}
      {activeBanners.length > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '6px',
          }}
        >
          {activeBanners.map((_, index) => (
            <div
              key={index}
              style={{
                width: index === currentIndex ? '8px' : '6px',
                height: index === currentIndex ? '8px' : '6px',
                borderRadius: '50%',
                backgroundColor: index === currentIndex ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

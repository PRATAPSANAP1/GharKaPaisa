import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filter banners based on showOnlyRefer prop
  const activeBanners = showOnlyRefer ? banners.filter(b => b.id === 'refer') : banners;

  useEffect(() => {
    if (!isMobile || activeBanners.length <= 1) return;
    
    const interval = setInterval(() => {
      if (!isPaused) {
        setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
      }
    }, 4000); // Rotate every 4 seconds

    return () => clearInterval(interval);
  }, [isPaused, activeBanners.length, isMobile]);

  const handleBannerClick = (link) => {
    if (link) {
      navigate(link);
    }
  };

  if (!activeBanners.length) return null;

  // On desktop, render both team & refer banners side by side in a grid
  if (!isMobile && activeBanners.length > 1) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', width: '100%' }}>
        {activeBanners.map((banner) => (
          <div
            key={banner.id}
            onClick={() => handleBannerClick(banner.link)}
            style={{
              width: '100%',
              borderRadius: '16px',
              overflow: 'hidden',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
              transition: 'transform 0.2s ease, boxShadow 0.2s ease',
              border: `1px solid ${isDark ? C.border : 'rgba(0,0,0,0.06)'}`,
              height: '140px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.06)';
            }}
          >
            <img
              src={banner.image}
              alt={banner.alt}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                display: 'block',
              }}
            />
          </div>
        ))}
      </div>
    );
  }

  // On mobile or single banner mode
  return (
    <div
      style={{
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '16px',
        cursor: 'pointer',
        height: '130px',
        boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
        border: `1px solid ${isDark ? C.border : 'rgba(0,0,0,0.06)'}`
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
            bottom: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '6px',
          }}
        >
          {activeBanners.map((_, index) => (
            <div
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(index);
              }}
              style={{
                width: index === currentIndex ? '18px' : '6px',
                height: '6px',
                borderRadius: '3px',
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

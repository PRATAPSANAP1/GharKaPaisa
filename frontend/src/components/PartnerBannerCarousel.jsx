import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import api from '../services/api';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';

// Import local fallback partner banner images
import referenceBanner from '../modules/partner/banner/reference.png';
import team2Banner from '../modules/partner/banner/team (2).png';

const defaultBanners = [
  {
    id: 'team-2',
    image: team2Banner,
    alt: 'Team Growth & Rewards',
    link: '/partner/team-network'
  },
  {
    id: 'refer',
    image: referenceBanner,
    alt: 'Refer and Earn',
    link: '/partner/team-network'
  }
];

export default function PartnerBannerCarousel({ showOnlyRefer = false }) {
  const { C, isDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [dynamicBanners, setDynamicBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch dynamic Team/Partner/Referral banners from backend database
  useEffect(() => {
    const fetchTeamBanners = async () => {
      try {
        const pageParam = showOnlyRefer ? 'referral' : 'team';
        const res = await api.get('/banners', { params: { page: pageParam } });
        if (res.data?.success && res.data.data && res.data.data.length > 0) {
          const mapped = res.data.data.map((b) => ({
            id: `dynamic-${b.id}`,
            image: b.image_url,
            title: b.title,
            subtitle: b.subtitle,
            btn_text: b.btn_text,
            alt: b.title || 'Partner Banner',
            link: b.click_url || (showOnlyRefer ? '/partner/team-network' : '/partner/team-network')
          }));
          setDynamicBanners(mapped);
        }
      } catch (err) {
        console.warn('[PartnerBannerCarousel] Using fallback partner banners:', err);
      }
    };

    fetchTeamBanners();
  }, [showOnlyRefer]);

  // Determine active list of banners
  const activeBanners = dynamicBanners.length > 0
    ? dynamicBanners
    : (showOnlyRefer ? defaultBanners.filter(b => b.id.includes('refer')) : defaultBanners);

  // Infinite Auto-Rotate Slider Effect (Loops continuously)
  useEffect(() => {
    if (activeBanners.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, 4000); // Rotates every 4 seconds continuously

    return () => clearInterval(timer);
  }, [isPaused, activeBanners.length]);

  const handleNext = (e) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  };

  const handlePrev = (e) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  const handleBannerClick = (link) => {
    if (!link) return;
    if (link.startsWith('http://') || link.startsWith('https://')) {
      window.open(link, '_blank');
    } else {
      navigate(link);
    }
  };

  const isEmployee = location.pathname.includes('/employee');
  if (isEmployee || !activeBanners.length) return null;

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{
        width: '100%',
        position: 'relative',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: isDark ? 'none' : '0 8px 24px rgba(0,0,0,0.08)',
        border: `1px solid ${isDark ? C.border : 'rgba(0,0,0,0.06)'}`,
        background: isDark ? C.card : '#FFFFFF',
        height: isMobile ? '160px' : '280px'
      }}
    >
      {/* Banner Slides Stack */}
      {activeBanners.map((banner, idx) => {
        const isActive = idx === currentIndex;
        return (
          <div
            key={banner.id || idx}
            onClick={() => handleBannerClick(banner.link)}
            style={{
              position: 'absolute',
              inset: 0,
              opacity: isActive ? 1 : 0,
              pointerEvents: isActive ? 'auto' : 'none',
              transition: 'opacity 0.6s ease-in-out',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: C.bgSecondary
            }}
          >
            <img
              src={banner.image}
              alt={banner.alt}
              onError={(e) => {
                e.currentTarget.src = referenceBanner;
              }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                display: 'block'
              }}
            />

            {/* Title / Overlay Subtitle if available */}
            {banner.title && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '16px 20px',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  zIndex: 2
                }}
              >
                <h3 style={{ margin: 0, fontSize: isMobile ? '13px' : '16px', fontWeight: 800, color: '#ffffff' }}>
                  {banner.title}
                </h3>
                {banner.subtitle && (
                  <p style={{ margin: 0, fontSize: isMobile ? '11px' : '12px', color: 'rgba(255,255,255,0.9)' }}>
                    {banner.subtitle}
                  </p>
                )}
                {banner.btn_text && (
                  <button
                    style={{
                      marginTop: '6px',
                      alignSelf: 'flex-start',
                      padding: '5px 14px',
                      borderRadius: '8px',
                      background: C.primary || '#6E3FD6',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '11px',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {banner.btn_text}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Navigation Arrows */}
      {activeBanners.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10,
              transition: 'background 0.2s'
            }}
          >
            <MdChevronLeft size={24} />
          </button>
          <button
            onClick={handleNext}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10,
              transition: 'background 0.2s'
            }}
          >
            <MdChevronRight size={24} />
          </button>
        </>
      )}

      {/* Carousel Indicator Dots */}
      {activeBanners.length > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '8px',
            zIndex: 10
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
                width: index === currentIndex ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                backgroundColor: index === currentIndex ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)',
                boxShadow: index === currentIndex ? '0 2px 6px rgba(0,0,0,0.3)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

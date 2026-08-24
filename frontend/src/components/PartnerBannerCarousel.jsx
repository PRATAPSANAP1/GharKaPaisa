import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import api from '../services/api';

// Import local fallback partner banner images
import offerBanner from '../modules/partner/banner/offer.png';
import referenceBanner from '../modules/partner/banner/reference.png';
import teamBanner from '../modules/partner/banner/team.png';
import team2Banner from '../modules/partner/banner/team (2).png';

// Default static fallback banners using the 4 images in partner/banner
const defaultBanners = [
  {
    id: 'team-1',
    image: teamBanner,
    alt: 'Add Team Member - Build Your Network',
    link: '/partner/team'
  },
  {
    id: 'team-2',
    image: team2Banner,
    alt: 'Team Growth & Rewards',
    link: '/partner/team'
  },
  {
    id: 'refer',
    image: referenceBanner,
    alt: 'Refer and Earn',
    link: '/partner/referral'
  },
  {
    id: 'offer',
    image: offerBanner,
    alt: 'Special Offers & Rewards',
    link: '/partner/products'
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
            link: b.click_url || (showOnlyRefer ? '/partner/referral' : '/partner/team')
          }));
          setDynamicBanners(mapped);
        }
      } catch (err) {
        console.warn('[PartnerBannerCarousel] Using fallback partner banners:', err);
      }
    };

    fetchTeamBanners();
  }, [showOnlyRefer]);

  // Determine active list of banners (Dynamic from Super Admin or Default Fallback)
  const activeBanners = dynamicBanners.length > 0
    ? dynamicBanners
    : (showOnlyRefer ? defaultBanners.filter(b => b.id.includes('refer')) : defaultBanners.filter(b => b.id.includes('team')));

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
    if (!link) return;
    if (link.startsWith('http://') || link.startsWith('https://')) {
      window.open(link, '_blank');
    } else {
      navigate(link);
    }
  };

  if (!activeBanners.length) return null;

  // On desktop, render team & offer banners in a clean responsive grid
  if (!isMobile && activeBanners.length > 1) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: activeBanners.length > 2 ? 'repeat(auto-fit, minmax(280px, 1fr))' : 'repeat(2, 1fr)', gap: '16px', width: '100%' }}>
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
              aspectRatio: '16 / 7',
              height: 'auto',
              position: 'relative',
              background: C.bgSecondary
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
              onError={(e) => {
                e.currentTarget.src = showOnlyRefer ? referenceBanner : teamBanner;
              }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                display: 'block',
              }}
            />
            {banner.title && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '14px 18px',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  zIndex: 2
                }}
              >
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>
                  {banner.title}
                </h3>
                {banner.subtitle && (
                  <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.9)', opacity: 0.9 }}>
                    {banner.subtitle}
                  </p>
                )}
                {banner.btn_text && (
                  <button
                    style={{
                      marginTop: '6px',
                      alignSelf: 'flex-start',
                      padding: '4px 12px',
                      borderRadius: '6px',
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
        ))}
      </div>
    );
  }

  // On mobile or single banner mode
  const currentBanner = activeBanners[currentIndex] || activeBanners[0];

  return (
    <div
      style={{
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '16px',
        cursor: 'pointer',
        aspectRatio: '16 / 7',
        height: 'auto',
        boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
        border: `1px solid ${isDark ? C.border : 'rgba(0,0,0,0.06)'}`,
        background: C.bgSecondary
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onClick={() => handleBannerClick(currentBanner?.link)}
    >
      <img
        src={currentBanner?.image}
        alt={currentBanner?.alt}
        onError={(e) => {
          e.currentTarget.src = showOnlyRefer ? referenceBanner : teamBanner;
        }}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          display: 'block',
        }}
      />

      {currentBanner?.title && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '12px 16px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
            color: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            zIndex: 2
          }}
        >
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>
            {currentBanner.title}
          </h3>
          {currentBanner.subtitle && (
            <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.9)', opacity: 0.9 }}>
              {currentBanner.subtitle}
            </p>
          )}
          {currentBanner.btn_text && (
            <button
              style={{
                marginTop: '4px',
                alignSelf: 'flex-start',
                padding: '4px 10px',
                borderRadius: '6px',
                background: C.primary || '#6E3FD6',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '10px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {currentBanner.btn_text}
            </button>
          )}
        </div>
      )}

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
            zIndex: 3
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

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

  // Fetch dynamic Team/Partner banners from backend database
  useEffect(() => {
    const fetchTeamBanners = async () => {
      try {
        const pageParam = showOnlyRefer ? 'referral' : 'team';
        const res = await api.get('/banners', { params: { page: pageParam } });
        if (res.data?.success && res.data.data && res.data.data.length > 0) {
          const mapped = res.data.data.map((b) => ({
            id: `dynamic-${b.id}`,
            image: b.image_url,
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
  const availableBanners = dynamicBanners.length > 0 ? dynamicBanners : defaultBanners;
  const activeBanners = showOnlyRefer ? availableBanners.filter(b => b.id.includes('refer')) : availableBanners;

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
        aspectRatio: '16 / 7',
        height: 'auto',
        boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
        border: `1px solid ${isDark ? C.border : 'rgba(0,0,0,0.06)'}`,
        background: C.bgSecondary
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onClick={() => handleBannerClick(activeBanners[currentIndex]?.link)}
    >
      <img
        src={activeBanners[currentIndex]?.image}
        alt={activeBanners[currentIndex]?.alt}
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

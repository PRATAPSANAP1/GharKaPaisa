import React, { useState, useEffect } from 'react';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import api from '../../../services/api';
import { 
  MdCampaign, MdDownload, MdShare, MdImage, 
  MdOutlineOndemandVideo, MdOutlineMenuBook
} from 'react-icons/md';

export default function PartnerMarketing() {
  const { C } = useTheme();
  const S = makeS(C);
  
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  
  const categories = ['All', 'banners', 'social_media', 'leaflets'];

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const res = await api.get('/marketing/materials');
      if (res.data?.success) {
        setMaterials(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load marketing materials', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const filteredMaterials = filter === 'All' ? materials : materials.filter(m => m.category === filter);

  const getIcon = (category) => {
    switch(category) {
      case 'banners': return <MdImage size={40} style={{ color: C.primary }} />;
      case 'social_media': return <MdOutlineOndemandVideo size={40} style={{ color: C.red }} />;
      case 'leaflets': return <MdOutlineMenuBook size={40} style={{ color: C.gold }} />;
      default: return <MdImage size={40} style={{ color: C.textLight }} />;
    }
  };

  const handleDownload = (fileUrl, title) => {
    // Open the direct marketing file URL in a new tab
    const link = document.createElement('a');
    link.href = fileUrl;
    link.target = '_blank';
    link.download = title;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = (item) => {
    if (navigator.share) {
      navigator.share({
        title: item.title,
        text: item.description,
        url: item.file_url,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(item.file_url);
      alert('Asset link copied to clipboard!');
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {/* Header Banner */}
      <div style={{
        background: `linear-gradient(135deg, ${C.navyMid || C.bgSecondary}, ${C.navy || C.bg})`,
        borderRadius: '16px',
        padding: '28px',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
        border: `1px solid ${C.border}`
      }}>
        <div style={{
          position: 'absolute', right: 0, top: 0, width: 200, height: 200,
          background: C.primary, opacity: 0.15, borderRadius: '50%', filter: 'blur(60px)',
          marginRight: '-40px', marginTop: '-40px'
        }} />
        <div style={{
          position: 'relative', zIndex: 1, display: 'flex', flexWrap: 'wrap',
          justifyContent: 'space-between', alignItems: 'center', gap: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: 56, height: 56, background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <MdCampaign size={28} style={{ color: C.greenLight || C.teal }} />
            </div>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>Marketing Center</h2>
              <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', margin: 0, maxWidth: '480px' }}>
                Download official, high-converting promotional materials to share on WhatsApp, Instagram, and Facebook.
              </p>
            </div>
          </div>
          <button style={{
            ...S.btn('primary'), padding: '10px 20px', fontSize: '13px', border: 'none', borderRadius: '10px'
          }}>
            Request Custom Banner
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            style={{
              padding: '8px 16px', borderRadius: '10px', fontSize: '13px',
              fontWeight: 700, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
              background: filter === cat ? `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})` : C.bgSecondary,
              color: filter === cat ? '#fff' : C.textMid,
              boxShadow: filter === cat ? `0 4px 14px ${C.primary}30` : 'none',
              ...(filter === cat ? {} : { border: `1px solid ${C.border}` })
            }}
          >
            {cat === 'social_media' ? 'Social Media' : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
        {loading ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px', color: C.textLight }}>
            Loading marketing assets...
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px', color: C.textLight }}>
            No marketing materials available in this category.
          </div>
        ) : (
          filteredMaterials.map((item) => (
            <div key={item.id} style={{
              ...S.card, padding: 0, borderRadius: '16px', overflow: 'hidden',
              display: 'flex', flexDirection: 'column', transition: 'all 0.2s ease'
            }}>
              
              {/* Preview Area */}
              <div style={{
                height: '140px', background: C.bgSecondary, display: 'flex',
                alignItems: 'center', justifyContent: 'center', position: 'relative'
              }}>
                {item.thumbnail_url ? (
                  <img 
                    src={item.thumbnail_url} 
                    alt={item.title} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                ) : (
                  <>
                    <div style={{
                      position: 'absolute', inset: 0, opacity: 0.05,
                      backgroundImage: `radial-gradient(${C.text} 1px, transparent 1px)`,
                      backgroundSize: '10px 10px'
                    }} />
                    {getIcon(item.category)}
                  </>
                )}
              </div>

              {/* Details */}
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <span style={{
                  ...S.tag(C.primary), alignSelf: 'flex-start',
                  padding: '2px 8px', fontSize: '9px', marginBottom: '8px'
                }}>
                  {item.category === 'social_media' ? 'Social Media' : item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                </span>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: C.text, margin: '0 0 4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '12px', color: C.textLight, margin: '0 0 16px' }}>
                  {item.description || 'Official Referrals Banner'}
                </p>

                <div style={{
                  display: 'flex', gap: '8px', paddingTop: '12px', borderTop: `1px solid ${C.border}`, marginTop: 'auto'
                }}>
                  <button 
                    onClick={() => handleShare(item)}
                    style={{
                      flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px',
                      padding: '8px', background: C.bgSecondary, color: C.textMid,
                      borderRadius: '8px', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer'
                    }}
                  >
                    <MdShare size={16} /> Share
                  </button>
                  <button 
                    onClick={() => handleDownload(item.file_url, item.title)}
                    style={{
                      flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px',
                      padding: '8px', background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`,
                      color: '#fff', borderRadius: '8px', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer'
                    }}
                  >
                    <MdDownload size={16} /> Get
                  </button>
                </div>
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
}

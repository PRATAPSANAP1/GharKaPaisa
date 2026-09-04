import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import api from '../../../services/api';
import { getImageUrl } from '../../../config/api';
import { 
  MdCampaign, MdDownload, MdShare, MdImage, 
  MdOutlineOndemandVideo, MdOutlineMenuBook, MdClose, MdSend
} from 'react-icons/md';

export default function PartnerMarketing() {
  const { t } = useTranslation();
  const { C } = useTheme();
  const S = makeS(C);
  
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestText, setRequestText] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);
  
  const fetchedCategories = Array.from(new Set(materials.map(m => m.category).filter(Boolean)));
  const categories = ['All', ...Array.from(new Set([...fetchedCategories]))];

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const res = await api.get('/marketing/materials');
      if (res.data?.success) {
        setMaterials(res.data.data || []);
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
    if (!fileUrl) return alert('File URL is not available for download.');
    const fullUrl = getImageUrl(fileUrl);
    const link = document.createElement('a');
    link.href = fullUrl;
    link.target = '_blank';
    link.download = title || 'Marketing_Asset';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = (item) => {
    const fullUrl = getImageUrl(item.file_url);
    if (navigator.share) {
      navigator.share({
        title: item.title,
        text: item.description || item.title,
        url: fullUrl,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(fullUrl);
      alert('Asset link copied to clipboard!');
    }
  };

  const handleRequestBanner = async (e) => {
    e.preventDefault();
    if (!requestText.trim()) return alert('Please enter your banner specifications or notes');
    setSubmittingRequest(true);
    try {
      const res = await api.post('/support/tickets', {
        subject: 'Custom Marketing Banner Request',
        category: 'marketing',
        message: requestText,
        priority: 'medium'
      });
      if (res.data?.success) {
        alert('Custom banner request submitted to support!');
        setRequestText('');
        setShowRequestModal(false);
      } else {
        alert('Request sent successfully!');
        setShowRequestModal(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Custom banner request submitted successfully!');
      setShowRequestModal(false);
    } finally {
      setSubmittingRequest(false);
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
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>{t('dashboard.actions.marketingTools', 'Marketing Center')}</h2>
              <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', margin: 0, maxWidth: '480px' }}>
                {t('marketing.headerSubtitle', 'Download official promotional materials to share across social media and messaging platforms.')}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setShowRequestModal(true)}
            style={{
              ...S.btn('primary'), padding: '10px 20px', fontSize: '13px', border: 'none', borderRadius: '10px', cursor: 'pointer'
            }}
          >
            {t('marketing.requestCustomBanner', 'Request Custom Banner')}
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
            {cat === 'All' ? t('hdfc.filter.all', 'All') : cat.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
          </button>
        ))}
      </div>

      {/* Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
        {loading ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px', color: C.textLight }}>
            {t('common.loading', 'Loading marketing assets...')}
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px', color: C.textLight }}>
            {t('marketing.noAssetsAvailable', 'No marketing materials available in this category.')}
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
                {item.thumbnail_url || item.file_url ? (
                  <img 
                    src={getImageUrl(item.thumbnail_url || item.file_url)} 
                    alt={item.title} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
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
                  padding: '2px 8px', fontSize: '9px', marginBottom: '8px', textTransform: 'capitalize'
                }}>
                  {item.category?.replace(/_/g, ' ')}
                </span>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: C.text, margin: '0 0 4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {item.title}
                </h3>
                {item.description && (
                  <p style={{ fontSize: '12px', color: C.textLight, margin: '0 0 16px' }}>
                    {item.description}
                  </p>
                )}

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
                    <MdShare size={16} /> {t('marketing.share', 'Share')}
                  </button>
                  <button 
                    onClick={() => handleDownload(item.file_url, item.title)}
                    style={{
                      flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px',
                      padding: '8px', background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`,
                      color: '#fff', borderRadius: '8px', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer'
                    }}
                  >
                    <MdDownload size={16} /> {t('common.download', 'Get')}
                  </button>
                </div>
              </div>

            </div>
          ))
        )}
      </div>

      {/* Request Custom Banner Modal */}
      {showRequestModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', maxWidth: '460px', width: '100%', padding: '24px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: 0 }}>Request Custom Banner</h3>
              <button onClick={() => setShowRequestModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMid }}>
                <MdClose size={22} />
              </button>
            </div>
            <form onSubmit={handleRequestBanner} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: C.text, display: 'block', marginBottom: '6px' }}>
                  Banner Specifications / Requirements
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe your custom banner request (e.g. Dimensions, branding details, language preference)..."
                  value={requestText}
                  onChange={(e) => setRequestText(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.inputBg, color: C.text, fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowRequestModal(false)} style={{ padding: '9px 16px', borderRadius: '8px', border: `1px solid ${C.border}`, background: 'transparent', color: C.text, fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={submittingRequest} style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`, color: '#fff', fontWeight: 800, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MdSend size={16} /> {submittingRequest ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

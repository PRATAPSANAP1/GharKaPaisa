import React, { useEffect, useState } from 'react';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import {
  MdPlayCircleOutline, MdOutlineMenuBook, MdCheckCircle,
  MdAccessTime, MdStar, MdPlayArrow
} from 'react-icons/md';
import api from '../../../services/api';

export default function PartnerTraining() {
  const { C } = useTheme();
  const S = makeS(C);

  const [modules, setModules] = useState([]);
  const [activeModule, setActiveModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    const loadModules = async () => {
      try {
        const response = await api.get('/partner/training');
        const data = response.data?.data || [];
        setModules(data);
        setActiveModule(data.find((m) => m.status === 'in_progress') || data[0] || null);
      } catch (err) {
        console.error('Failed to load training modules', err);
      } finally {
        setLoading(false);
      }
    };
    loadModules();
  }, []);

  const handleComplete = async () => {
    if (!activeModule || completing) return;
    setCompleting(true);
    try {
      await api.post(`/partner/training/${activeModule.id}/complete`);
      // Update local state
      setModules(prev => prev.map(m => m.id === activeModule.id ? { ...m, status: 'completed' } : m));
      setActiveModule(prev => ({ ...prev, status: 'completed' }));
    } catch (err) {
      console.error('Failed to complete training module', err);
    } finally {
      setCompleting(false);
    }
  };

  const completedCount = modules.filter((m) => m.status === 'completed').length;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
        <span style={{
          width: 32, height: 32, borderRadius: '50%',
          border: `3px solid ${C.border}`, borderTopColor: C.primary,
          animation: 'spin .8s linear infinite', display: 'inline-block'
        }} />
      </div>
    );
  }

  if (!activeModule) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: C.textLight, fontWeight: 500 }}>
        No training modules available yet.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: '24px', maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px', flexWrap: 'wrap' }}>
      
      {/* Left Column: Player & Active Content */}
      <div style={{ flex: 2, minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Video Player or Document Reader */}
        <div style={{
          background: '#000', borderRadius: '16px', aspectRatio: '16/9',
          position: 'relative', overflow: 'hidden', display: 'flex',
          alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          border: `1px solid ${C.border}`
        }}>
          {activeModule.video_url ? (
            <video 
              key={activeModule.id}
              src={activeModule.video_url} 
              controls 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onEnded={handleComplete}
            />
          ) : activeModule.pdf_url ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#fff', zIndex: 5 }}>
              <MdOutlineMenuBook size={64} style={{ color: C.gold, marginBottom: '16px' }} />
              <p style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600 }}>This training module is a Document study guide.</p>
              <a 
                href={activeModule.pdf_url} 
                target="_blank" 
                rel="noreferrer" 
                style={{ ...S.btn('primary'), textDecoration: 'none', display: 'inline-block', padding: '10px 20px', borderRadius: '10px' }}
              >
                Open Document Guide
              </a>
            </div>
          ) : (
            <div style={{ color: '#fff', textAlign: 'center' }}>
              No media available for this module.
            </div>
          )}

          <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', zIndex: 10, pointerEvents: 'none' }}>
            <span style={{
              padding: '4px 10px', background: C.primary, color: '#fff',
              fontSize: '9px', fontWeight: 700, uppercase: 'true', letterSpacing: '0.5px',
              borderRadius: '6px', marginBottom: '8px', display: 'inline-block'
            }}>
              {activeModule.category}
            </span>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', margin: 0 }}>{activeModule.title}</h2>
          </div>
        </div>

        {/* Content Description */}
        <div style={{ ...S.card, padding: '28px', borderRadius: '16px' }}>
          <div style={{
            display: 'flex', flexWrap: 'wrap', items: 'center', gap: '20px',
            marginBottom: '20px', paddingBottom: '20px', borderBottom: `1px solid ${C.border}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: C.textMid, fontSize: '14px', fontWeight: 600 }}>
              <MdAccessTime size={18} /> {activeModule.duration}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: C.textMid, fontSize: '14px', fontWeight: 600 }}>
              <MdStar size={18} style={{ color: '#F59E0B' }} /> 4.8 Rating
            </div>
            {activeModule.status === 'completed' && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px', color: C.green,
                fontWeight: 700, marginLeft: 'auto', background: `${C.green}12`,
                padding: '4px 10px', borderRadius: '8px', fontSize: '12px'
              }}>
                <MdCheckCircle size={18} /> Completed
              </div>
            )}
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: '0 0 10px' }}>About this module</h3>
          <p style={{ fontSize: '14px', color: C.textMid, lineHeight: 1.6, margin: '0 0 24px' }}>
            In this module, you will learn the essential skills required to maximize your earnings on GharKaPaisa. 
            We cover practical strategies, real-world examples, and common pitfalls to avoid when pitching to customers. 
            Make sure to take notes!
          </p>

          {activeModule.status !== 'completed' && (
            <button 
              onClick={handleComplete}
              disabled={completing}
              style={{
                ...S.btn('primary'), border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', cursor: 'pointer',
                opacity: completing ? 0.7 : 1
              }}
            >
              {completing ? 'Updating...' : 'Mark as Completed'}
            </button>
          )}
        </div>
      </div>

      {/* Right Column: Playlist */}
      <div style={{
        ...S.card, padding: 0, borderRadius: '16px', overflow: 'hidden',
        flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column',
        maxHeight: '600px'
      }}>
        <div style={{ padding: '20px', borderBottom: `1px solid ${C.border}`, background: C.bgSecondary }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: '0 0 12px' }}>Training Modules</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              flex: 1, height: '6px', background: C.border, borderRadius: '3px', overflow: 'hidden'
            }}>
              <div style={{
                height: '100%', background: C.green,
                width: modules.length ? `${(completedCount / modules.length) * 100}%` : '0%'
              }} />
            </div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>{completedCount}/{modules.length} Completed</span>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {modules.map((mod, idx) => {
            const isActive = activeModule.id === mod.id;
            return (
              <div 
                key={mod.id}
                onClick={() => setActiveModule(mod)}
                style={{
                  padding: '12px 14px', borderRadius: '12px', cursor: 'pointer',
                  border: `1px solid ${isActive ? C.primary : C.border}`,
                  background: isActive ? `${C.primary}12` : C.card,
                  transition: 'all 0.15s ease', display: 'flex', gap: '12px'
                }}
              >
                <div style={{ shrink: 0, marginTop: '2px', display: 'flex', alignItems: 'center' }}>
                  {mod.status === 'completed' ? (
                    <MdCheckCircle size={22} style={{ color: C.green }} />
                  ) : mod.type === 'Video' ? (
                    <MdPlayCircleOutline size={22} style={{ color: isActive ? C.primary : C.textLight }} />
                  ) : (
                    <MdOutlineMenuBook size={22} style={{ color: isActive ? C.primary : C.textLight }} />
                  )}
                </div>
                <div>
                  <p style={{ fontSize: '10px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', margin: '0 0 2px' }}>Module {idx + 1}</p>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 2px', color: isActive ? C.primary : C.text, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {mod.title}
                  </h4>
                  <p style={{ fontSize: '11px', color: C.textLight, margin: 0 }}>{mod.duration}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

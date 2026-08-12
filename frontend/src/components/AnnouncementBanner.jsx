import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { MdCampaign, MdClose, MdLaunch, MdPriorityHigh } from 'react-icons/md';

export default function AnnouncementBanner() {
  const { C, isDark } = useTheme();
  const [announcements, setAnnouncements] = useState([]);
  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('dismissed_announcements') || '[]');
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await api.get('/notifications/announcements');
        if (res.data?.success && Array.isArray(res.data.data)) {
          setAnnouncements(res.data.data);
        }
      } catch (e) {
        // silent fail
      }
    };
    fetchAnnouncements();
  }, []);

  const handleDismiss = (id) => {
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    try {
      localStorage.setItem('dismissed_announcements', JSON.stringify(updated));
    } catch (e) {}
  };

  const activeAnnouncements = announcements.filter(a => !dismissedIds.includes(a.id));

  if (activeAnnouncements.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
      {activeAnnouncements.map((ann) => {
        const isUrgent = ann.priority === 'urgent' || ann.priority === 'high';
        const bg = isUrgent
          ? (isDark ? 'rgba(220, 38, 38, 0.15)' : '#FEF2F2')
          : (isDark ? 'rgba(37, 99, 235, 0.15)' : '#EFF6FF');
        const borderColor = isUrgent ? '#FCA5A5' : '#BFDBFE';
        const textColor = isUrgent ? '#991B1B' : '#1E40AF';
        const badgeBg = isUrgent ? '#EF4444' : '#2563EB';

        return (
          <div
            key={ann.id}
            style={{
              background: bg,
              border: `1px solid ${borderColor}`,
              borderRadius: '12px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: badgeBg, color: '#FFFFFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, fontWeight: 800
              }}>
                {isUrgent ? <MdPriorityHigh size={20} /> : <MdCampaign size={22} />}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 800, fontSize: '14px', color: isDark ? (isUrgent ? '#FCA5A5' : '#93C5FD') : textColor }}>
                    {ann.title}
                  </span>
                  {isUrgent && (
                    <span style={{
                      fontSize: '10px', fontWeight: 800, padding: '1px 6px',
                      borderRadius: '4px', background: '#EF4444', color: '#FFFFFF',
                      textTransform: 'uppercase'
                    }}>
                      Urgent Announcement
                    </span>
                  )}
                </div>

                <p style={{
                  fontSize: '12.5px',
                  color: isDark ? '#D1D5DB' : '#374151',
                  margin: '2px 0 0 0',
                  lineHeight: 1.4
                }}>
                  {ann.description}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              {ann.redirect_url && (
                <a
                  href={ann.redirect_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    background: badgeBg,
                    color: '#FFFFFF',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  Action <MdLaunch size={14} />
                </a>
              )}

              <button
                onClick={() => handleDismiss(ann.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isDark ? '#9CA3AF' : '#6B7280',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Dismiss announcement"
              >
                <MdClose size={18} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

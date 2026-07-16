import React from 'react';
import { 
  MdPerson, MdPhone, MdEmail, MdLocationOn, 
  MdAccessTime, MdWork, MdOpenInNew, MdTag 
} from 'react-icons/md';

export default function CustomerCard({ customer, onOpenProfile, C, S }) {
  if (!customer) return null;

  const {
    id, full_name, mobile, email, city, pipeline_status = 'new',
    product_interests = [], partner_first_name, partner_last_name,
    last_activity_at, created_at, tags = []
  } = customer;

  const names = (full_name || 'Customer').split(' ');
  const initials = names.map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const getStatusBadge = (st) => {
    const isThemeDark = C.bg === "#000000";
    switch (st?.toLowerCase()) {
      case 'approved':
      case 'completed':
      case 'commission_generated':
        return {
          bg: isThemeDark ? `${C.green}15` : '#ECFDF5',
          color: isThemeDark ? C.green : '#059669',
          label: isThemeDark ? '🍊 Approved' : '🟢 Approved',
          border: isThemeDark ? `${C.green}40` : '#10B981'
        };
      case 'interested':
        return {
          bg: isThemeDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF',
          color: isThemeDark ? '#3B82F6' : '#2563EB',
          label: '🔵 Interested',
          border: isThemeDark ? '#3B82F640' : '#3B82F640'
        };
      case 'documents_pending':
        return {
          bg: isThemeDark ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB',
          color: isThemeDark ? '#F59E0B' : '#D97706',
          label: '🟡 Docs Pending',
          border: isThemeDark ? '#F59E0B40' : '#F59E0B40'
        };
      case 'lead_created':
      case 'application_submitted':
      case 'bank_verification':
        return {
          bg: isThemeDark ? 'rgba(168, 85, 247, 0.15)' : '#F3E8FF',
          color: isThemeDark ? '#A855F7' : '#7E22CE',
          label: '🟣 Processing',
          border: isThemeDark ? '#A855F740' : '#A855F740'
        };
      case 'rejected':
        return {
          bg: isThemeDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
          color: isThemeDark ? '#EF4444' : '#DC2626',
          label: '🔴 Rejected',
          border: isThemeDark ? '#EF444440' : '#EF444440'
        };
      default:
        return {
          bg: isThemeDark ? 'rgba(148, 163, 184, 0.15)' : '#F1F5F9',
          color: isThemeDark ? '#94A3B8' : '#475569',
          label: '⚪ New Lead',
          border: isThemeDark ? '#94A3B840' : '#94A3B840'
        };
    }
  };

  const badge = getStatusBadge(pipeline_status);

  // Parse product interests if string
  let parsedInterests = [];
  try {
    parsedInterests = typeof product_interests === 'string' ? JSON.parse(product_interests) : product_interests;
  } catch (_) {
    parsedInterests = [];
  }

  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: '16px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      cursor: 'pointer'
    }}
    onClick={() => onOpenProfile && onOpenProfile(customer)}
    >
      <div>
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #4338CA 0%, #6366F1 100%)',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(99, 102, 241, 0.3)'
            }}>
              {initials}
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: 0, lineHeight: 1.2 }}>
                {full_name}
              </h3>
              <div style={{ fontSize: '11px', color: C.textLight, marginTop: '2px' }}>
                ID: #{id ? id.substring(0, 8) : 'CUST'}
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <span style={{
            background: badge.bg,
            color: badge.color,
            border: `1px solid ${badge.border}40`,
            padding: '4px 10px',
            borderRadius: '999px',
            fontSize: '11px',
            fontWeight: 700,
            whiteSpace: 'nowrap'
          }}>
            {badge.label}
          </span>
        </div>

        {/* Contact Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px', fontSize: '12.5px', color: C.textMid }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
            <MdPhone style={{ color: C.textLight, fontSize: '14px', flexShrink: 0 }} />
            <span style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{mobile}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
            <MdEmail style={{ color: C.textLight, fontSize: '14px', flexShrink: 0 }} />
            <span style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{email || 'No email'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MdLocationOn style={{ color: C.textLight, fontSize: '14px', flexShrink: 0 }} />
            <span>{city || 'Location N/A'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MdAccessTime style={{ color: C.textLight, fontSize: '14px', flexShrink: 0 }} />
            <span>{created_at ? new Date(created_at).toLocaleDateString() : 'Today'}</span>
          </div>
        </div>

        {/* Interested Products Tags */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', marginBottom: '6px' }}>
            Interested Products
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {parsedInterests.length > 0 ? (
              parsedInterests.map((prod, idx) => (
                <span key={idx} style={{
                  background: C.bgSecondary,
                  color: C.text,
                  border: `1px solid ${C.border}`,
                  borderRadius: '6px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  fontWeight: 600
                }}>
                  {prod}
                </span>
              ))
            ) : (
              <span style={{ fontSize: '11px', color: C.textLight, italic: 'true' }}>Credit Card & Loan Lead</span>
            )}

            {Array.isArray(tags) && tags.map((t, idx) => (
              <span key={`tag-${idx}`} style={{
                background: `${t.color || '#3B82F6'}15`,
                color: t.color || '#3B82F6',
                border: `1px solid ${t.color || '#3B82F6'}40`,
                borderRadius: '6px',
                padding: '2px 8px',
                fontSize: '11px',
                fontWeight: 700
              }}>
                #{t.name || t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div style={{
        paddingTop: '12px',
        borderTop: `1px dashed ${C.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: '11px', color: C.textLight }}>
          Partner: <strong style={{ color: C.text }}>{partner_first_name ? `${partner_first_name} ${partner_last_name || ''}` : 'Direct/Assigned'}</strong>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenProfile && onOpenProfile(customer);
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            background: C.bgSecondary,
            color: C.teal,
            border: `1px solid ${C.teal}40`,
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <span>Open 360° Profile</span>
          <MdOpenInNew style={{ fontSize: '14px' }} />
        </button>
      </div>
    </div>
  );
}

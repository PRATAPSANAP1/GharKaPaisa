import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  MdPerson, MdPhone, MdEmail, MdLocationOn, 
  MdAccessTime, MdWork, MdOpenInNew, MdTag, MdEdit 
} from 'react-icons/md';

export default function CustomerCard({ customer, onOpenProfile, onEditCustomer, C, S }) {
  const { t } = useTranslation();
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
          label: isThemeDark ? `🍊 ${t("crm.status.approved", "Approved")}` : `🟢 ${t("crm.status.approved", "Approved")}`,
          border: isThemeDark ? `${C.green}40` : '#10B981'
        };
      case 'interested':
        return {
          bg: isThemeDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF',
          color: isThemeDark ? '#3B82F6' : '#2563EB',
          label: `🔵 ${t("crm.status.interested", "Interested")}`,
          border: isThemeDark ? '#3B82F640' : '#3B82F640'
        };
      case 'documents_pending':
        return {
          bg: isThemeDark ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB',
          color: isThemeDark ? '#F59E0B' : '#D97706',
          label: `🟡 ${t("crm.status.docsPending", "Docs Pending")}`,
          border: isThemeDark ? '#F59E0B40' : '#F59E0B40'
        };
      case 'lead_created':
      case 'application_submitted':
      case 'bank_verification':
        return {
          bg: isThemeDark ? 'rgba(168, 85, 247, 0.15)' : '#F3E8FF',
          color: isThemeDark ? '#A855F7' : '#7E22CE',
          label: `🟣 ${t("crm.status.processing", "Processing")}`,
          border: isThemeDark ? '#A855F740' : '#A855F740'
        };
      case 'rejected':
        return {
          bg: isThemeDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
          color: isThemeDark ? '#EF4444' : '#DC2626',
          label: `🔴 ${t("crm.status.rejected", "Rejected")}`,
          border: isThemeDark ? '#EF444440' : '#EF444440'
        };
      default:
        return {
          bg: isThemeDark ? 'rgba(148, 163, 184, 0.15)' : '#F1F5F9',
          color: isThemeDark ? '#94A3B8' : '#475569',
          label: `⚪ ${t("crm.status.newLead", "New Lead")}`,
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
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: '14px',
        padding: '14px 18px',
        width: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '14px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
        transition: 'all 0.2s ease',
        cursor: 'pointer'
      }}
      onClick={() => onOpenProfile && onOpenProfile(customer)}
    >
      {/* Left: Avatar + Name + Contact Details */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 280px' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #4338CA 0%, #6366F1 100%)',
          color: '#FFFFFF',
          fontWeight: 800,
          fontSize: '15px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 3px 8px rgba(99, 102, 241, 0.3)',
          flexShrink: 0
        }}>
          {initials}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: 0, lineHeight: 1.2 }}>
              {full_name}
            </h3>
            <span style={{
              background: badge.bg,
              color: badge.color,
              border: `1px solid ${badge.border}40`,
              padding: '2px 8px',
              borderRadius: '999px',
              fontSize: '10px',
              fontWeight: 700,
              whiteSpace: 'nowrap'
            }}>
              {badge.label}
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '4px', fontSize: '12px', color: C.textMid }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><MdPhone style={{ color: C.textLight }} /> {mobile}</span>
            {email && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><MdEmail style={{ color: C.textLight }} /> {email}</span>}
            {city && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><MdLocationOn style={{ color: C.textLight }} /> {city}</span>}
          </div>
        </div>
      </div>

      {/* Middle: Interested Products & Tags */}
      <div style={{ flex: '1 1 200px' }}>
        <div style={{ fontSize: '10px', fontWeight: 800, color: C.textLight, textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.04em' }}>
          {t("crm.interestedProducts", "Interested Products")}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
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
            <span style={{ fontSize: '11px', color: C.textLight }}>{t("crm.defaultProductLead", "Credit Card & Loan Lead")}</span>
          )}
        </div>
      </div>

      {/* Right: Partner Info & Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0, marginLeft: 'auto' }}>
        <div style={{ fontSize: '11px', color: C.textLight, textAlign: 'right' }}>
          {t("crm.partner", "Partner")}: <strong style={{ color: C.text, display: 'block' }}>{partner_first_name ? `${partner_first_name} ${partner_last_name || ''}` : t("crm.directAssigned", "Direct/Assigned")}</strong>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditCustomer && onEditCustomer(customer);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              background: C.bgSecondary,
              color: C.primary,
              border: `1px solid ${C.primary}40`,
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            <MdEdit style={{ fontSize: '13px' }} />
            <span>Edit</span>
          </button>

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
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            <span>360° Profile</span>
            <MdOpenInNew style={{ fontSize: '13px' }} />
          </button>
        </div>
      </div>
    </div>
  );
}

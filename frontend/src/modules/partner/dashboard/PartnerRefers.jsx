import React, { useState, useEffect } from 'react';
import { 
  Copy, Share2, MessageCircle, Mail, Send, CheckCircle, Users, Link, 
  RefreshCw, UserPlus, AlertCircle, QrCode, Download, Search, Filter, 
  Sparkles, ArrowUpRight, ShieldCheck, CheckCircle2, Clock, UserCheck
} from 'lucide-react';
import { useAuthStore } from '../../../app/store/authStore';
import { useTheme } from '../../../contexts/ThemeContext';
import api from '../../../services/api';
import PartnerBannerCarousel from '../../../components/PartnerBannerCarousel';

export default function PartnerRefers() {
  const { C, isDark } = useTheme();
  const user = useAuthStore((state) => state.user);
  const isTeamMember = user?.role === 'TEAM_MEMBER';

  const [refersData, setRefersData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', mobile: '', email: '' });
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  
  // Filter & Search state for invitation history
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Responsive state
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [isTablet, setIsTablet] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 && window.innerWidth < 1024 : false);

  useEffect(() => {
    setMounted(true);
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchRefers();
  }, []);

  const bg = isDark ? '#08080c' : C.bg;
  const cardBg = isDark ? '#12121a' : '#ffffff';
  const cardBgSecondary = isDark ? '#181824' : '#f8faff';
  const border = isDark ? '#222234' : C.border;
  const textPrimary = C.text;
  const textMuted = C.textMid;
  const accent = C.primary;

  const fetchRefers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/team/refers');
      if (res.data?.success) setRefersData(res.data.data);
    } catch (err) {
      console.error('Failed to load refers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!form.mobile && !form.email) return;
    setSending(true);
    setSendResult(null);
    try {
      const res = await api.post('/team/invite', form);
      if (res.data?.success) {
        setSendResult({ type: 'success', data: res.data.data });
        setForm({ name: '', mobile: '', email: '' });
        fetchRefers();
      }
    } catch (err) {
      setSendResult({ type: 'error', message: err.response?.data?.message || 'Failed to send invitation' });
    } finally {
      setSending(false);
    }
  };

  const copyLink = () => {
    if (!refersData?.referral_link) return;
    navigator.clipboard.writeText(refersData.referral_link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (!refersData?.referral_link) return;
    const shareData = {
      title: 'Join GharKaPaisa Partner Network',
      text: 'Join GharKaPaisa and earn commissions on every approved credit card & loan application!',
      url: refersData.referral_link,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share dismissed', err);
      }
    } else {
      copyLink();
    }
  };

  const shareWhatsApp = () => {
    if (!refersData?.referral_link) return;
    const msg = `Hello! Join GharKaPaisa partner network and earn guaranteed commissions on every approved credit card & loan application. Register now using my link: ${refersData.referral_link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const shareTelegram = () => {
    if (!refersData?.referral_link) return;
    const msg = `Join GharKaPaisa partner network and earn guaranteed commissions on credit card & loan applications!`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(refersData.referral_link)}&text=${encodeURIComponent(msg)}`, '_blank');
  };

  const qrCodeUrl = refersData?.referral_link 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(refersData.referral_link)}&color=4f46e5`
    : '';

  // Filtered invites history
  const allInvites = refersData?.invites || [];
  const filteredInvites = allInvites.filter((inv) => {
    const name = (inv.recipient_name || '').toLowerCase();
    const mobile = (inv.recipient_mobile || '').toLowerCase();
    const email = (inv.recipient_email || '').toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesQuery = !query || name.includes(query) || mobile.includes(query) || email.includes(query);

    if (statusFilter === 'registered') return matchesQuery && !!inv.registered_at;
    if (statusFilter === 'pending') return matchesQuery && !inv.registered_at;
    return matchesQuery;
  });

  const totalInvitesCount = refersData?.total_invites || allInvites.length;
  const totalRegisteredCount = refersData?.total_registered || allInvites.filter(i => i.registered_at).length;
  const conversionRate = totalInvitesCount > 0 ? Math.round((totalRegisteredCount / totalInvitesCount) * 100) : 0;

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', background: bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', border: `3px solid ${border}`, borderTop: `3px solid ${accent}`, animation: 'spin 0.8s linear infinite' }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: textMuted }}>Loading Referral Hub...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: bg, padding: isMobile ? '12px' : '24px 32px' }} className="transition-all duration-300">
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        
        {/* Banner Carousel Hub */}
        <div style={{ marginBottom: 20 }}>
          <PartnerBannerCarousel showOnlyRefer={true} />
        </div>

        {/* Page Header */}
        <div style={{
          background: isDark
            ? 'linear-gradient(135deg, #12121e 0%, #0d0d1a 100%)'
            : 'linear-gradient(135deg, #eef2ff 0%, #ffffff 100%)',
          border: `1px solid ${border}`,
          borderRadius: 20, padding: isMobile ? '16px' : '24px 28px', marginBottom: 20,
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          boxShadow: isDark ? '0 10px 40px rgba(0,0,0,0.6)' : '0 4px 24px rgba(79,70,229,0.06)',
          opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(-12px)',
          transition: 'opacity 0.4s ease, transform 0.4s ease'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: isMobile ? 20 : 26, fontWeight: 900, color: textPrimary, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Share2 size={isMobile ? 22 : 28} color={accent} />
                Partner Referral Hub
              </h1>
              <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 20, background: `${accent}15`, color: accent, border: `1px solid ${accent}30` }}>
                Multi-Level Earn
              </span>
            </div>
            <p style={{ fontSize: isMobile ? 12 : 13, color: textMuted, margin: '6px 0 0', maxWidth: 650 }}>
              Invite partner agents & sub-members to join GharKaPaisa. Earn referral commissions on every approved application processed by your network.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', width: isMobile ? '100%' : 'auto' }}>
            <button
              onClick={() => setShowQrModal(true)}
              style={{
                flex: isMobile ? 1 : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '10px 18px', borderRadius: 12, border: `1px solid ${border}`, cursor: 'pointer',
                background: cardBg, color: textPrimary, fontWeight: 700, fontSize: 13,
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)', transition: 'all 0.2s'
              }}
            >
              <QrCode size={16} color={accent} />
              Show QR
            </button>

            <button 
              onClick={fetchRefers}
              style={{
                flex: isMobile ? 1 : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '10px 18px', borderRadius: 12, border: `1px solid ${border}`, cursor: 'pointer',
                background: cardBg, color: textPrimary, fontWeight: 700, fontSize: 13,
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)', transition: 'all 0.2s'
              }}
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} style={{ color: accent }} />
              Refresh
            </button>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: 16, marginBottom: 20
        }}>
          <div style={{
            background: cardBg, border: `1px solid ${border}`, borderRadius: 18,
            padding: isMobile ? '16px' : '20px',
            boxShadow: isDark ? 'none' : '0 4px 16px rgba(0,0,0,0.03)',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: textMuted }}>Total Invites Sent</span>
              <div style={{ padding: 8, borderRadius: 10, background: `${accent}15`, color: accent }}>
                <Send size={18} />
              </div>
            </div>
            <div style={{ fontSize: isMobile ? 24 : 30, fontWeight: 900, color: textPrimary }}>
              {totalInvitesCount}
            </div>
            <div style={{ fontSize: 11, color: textMuted, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>Direct invitations dispatched</span>
            </div>
          </div>

          <div style={{
            background: cardBg, border: `1px solid ${border}`, borderRadius: 18,
            padding: isMobile ? '16px' : '20px',
            boxShadow: isDark ? 'none' : '0 4px 16px rgba(0,0,0,0.03)',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: textMuted }}>Registered Partners</span>
              <div style={{ padding: 8, borderRadius: 10, background: '#10b98115', color: '#10b981' }}>
                <UserCheck size={18} />
              </div>
            </div>
            <div style={{ fontSize: isMobile ? 24 : 30, fontWeight: 900, color: '#10b981' }}>
              {totalRegisteredCount}
            </div>
            <div style={{ fontSize: 11, color: '#10b981', marginTop: 4, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle2 size={12} /> Active in network
            </div>
          </div>

          <div style={{
            background: cardBg, border: `1px solid ${border}`, borderRadius: 18,
            padding: isMobile ? '16px' : '20px',
            boxShadow: isDark ? 'none' : '0 4px 16px rgba(0,0,0,0.03)',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: textMuted }}>Conversion Rate</span>
              <div style={{ padding: 8, borderRadius: 10, background: '#8b5cf615', color: '#8b5cf6' }}>
                <Sparkles size={18} />
              </div>
            </div>
            <div style={{ fontSize: isMobile ? 24 : 30, fontWeight: 900, color: '#8b5cf6' }}>
              {conversionRate}%
            </div>
            <div style={{ fontSize: 11, color: textMuted, marginTop: 4 }}>
              {totalRegisteredCount} of {totalInvitesCount} accepted
            </div>
          </div>

          <div style={{
            background: cardBg, border: `1px solid ${border}`, borderRadius: 18,
            padding: isMobile ? '16px' : '20px',
            boxShadow: isDark ? 'none' : '0 4px 16px rgba(0,0,0,0.03)',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: textMuted }}>Pending Invites</span>
              <div style={{ padding: 8, borderRadius: 10, background: '#f59e0b15', color: '#f59e0b' }}>
                <Clock size={18} />
              </div>
            </div>
            <div style={{ fontSize: isMobile ? 24 : 30, fontWeight: 900, color: '#f59e0b' }}>
              {totalInvitesCount - totalRegisteredCount}
            </div>
            <div style={{ fontSize: 11, color: textMuted, marginTop: 4 }}>
              Awaiting partner registration
            </div>
          </div>
        </div>

        {/* Main 2-Column Content Layout for Desktop / Stacked on Mobile */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile || isTablet ? '1fr' : '1.1fr 0.9fr',
          gap: 20, marginBottom: 20
        }}>
          
          {/* LEFT COLUMN: Referral Link & Sharing Hub */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{
              background: cardBg, border: `1px solid ${border}`, borderRadius: 20,
              padding: isMobile ? '18px' : '24px',
              boxShadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h2 style={{ fontSize: 15, fontWeight: 800, color: textPrimary, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Link size={18} color={accent} />
                  Your Unique Referral Link
                </h2>
                <span style={{ fontSize: 11, fontWeight: 700, color: textMuted, background: cardBgSecondary, padding: '3px 8px', borderRadius: 6, border: `1px solid ${border}` }}>
                  Auto Tracking
                </span>
              </div>

              <p style={{ fontSize: 12, color: textMuted, margin: '0 0 14px' }}>
                Share this personalized link with potential partners or sub-agents. When they register, they will be mapped under your referral network.
              </p>

              {/* Link Input Bar */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', borderRadius: 14,
                background: cardBgSecondary, border: `1.5px solid ${copied ? accent : border}`,
                marginBottom: 16, transition: 'all 0.2s'
              }}>
                <span style={{ flex: 1, fontSize: 13, color: textPrimary, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
                  {refersData?.referral_link || '—'}
                </span>
                <button
                  onClick={copyLink}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: copied ? '#10b981' : accent, color: '#fff', fontWeight: 800, fontSize: 12,
                    boxShadow: `0 3px 12px ${copied ? '#10b98140' : accent + '40'}`,
                    transition: 'all 0.2s', flexShrink: 0
                  }}
                >
                  {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>

              {/* Quick Share Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 10 }}>
                <button
                  onClick={shareWhatsApp}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '12px', borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: '#25D366', color: '#fff', fontWeight: 800, fontSize: 13,
                    boxShadow: '0 4px 14px rgba(37,211,102,0.3)', transition: 'transform 0.2s'
                  }}
                >
                  <MessageCircle size={17} /> WhatsApp
                </button>

                <button
                  onClick={shareTelegram}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '12px', borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: '#0088cc', color: '#fff', fontWeight: 800, fontSize: 13,
                    boxShadow: '0 4px 14px rgba(0,136,204,0.3)', transition: 'transform 0.2s'
                  }}
                >
                  <Send size={16} /> Telegram
                </button>

                <button
                  onClick={handleNativeShare}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '12px', borderRadius: 12, border: `1px solid ${border}`, cursor: 'pointer',
                    background: cardBgSecondary, color: textPrimary, fontWeight: 800, fontSize: 13,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'transform 0.2s'
                  }}
                >
                  <Share2 size={16} color={accent} /> More Options
                </button>
              </div>
            </div>

            {/* Referral Benefits Overview */}
            <div style={{
              background: cardBg, border: `1px solid ${border}`, borderRadius: 20,
              padding: isMobile ? '18px' : '22px',
              boxShadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.04)'
            }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: textPrimary, margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={18} color={accent} />
                Why Invite Partners to GharKaPaisa?
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ padding: 6, borderRadius: 8, background: `${accent}15`, color: accent, flexShrink: 0, marginTop: 2 }}>
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <strong style={{ fontSize: 13, color: textPrimary, display: 'block' }}>Guaranteed Commission Share</strong>
                    <span style={{ fontSize: 12, color: textMuted }}>Earn overriding commission on every successful product application submitted by your referred team.</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ padding: 6, borderRadius: 8, background: '#10b98115', color: '#10b981', flexShrink: 0, marginTop: 2 }}>
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <strong style={{ fontSize: 13, color: textPrimary, display: 'block' }}>Instant Automated Wallet Payouts</strong>
                    <span style={{ fontSize: 12, color: textMuted }}>Commissions are automatically calculated & credited to your wallet balance with RazorpayX payouts.</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ padding: 6, borderRadius: 8, background: '#8b5cf615', color: '#8b5cf6', flexShrink: 0, marginTop: 2 }}>
                    <Users size={16} />
                  </div>
                  <div>
                    <strong style={{ fontSize: 13, color: textPrimary, display: 'block' }}>360° Real-time Network Tracking</strong>
                    <span style={{ fontSize: 12, color: textMuted }}>Monitor all invite status, registered partners, and active pipelines from your partner portal.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Invite Form (Partners only) */}
          <div>
            {!isTeamMember && (
              <div style={{
                background: cardBg, border: `1px solid ${border}`, borderRadius: 20,
                padding: isMobile ? '18px' : '24px',
                boxShadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.04)'
              }}>
                <h2 style={{ fontSize: 15, fontWeight: 800, color: textPrimary, margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <UserPlus size={18} color={accent} /> Direct Invitation Dispatch
                </h2>
                <p style={{ fontSize: 12, color: textMuted, margin: '0 0 16px' }}>
                  Send an official SMS & WhatsApp invitation directly to a prospective partner or team member.
                </p>

                <form onSubmit={handleSendInvite} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: textMuted, display: 'block', marginBottom: 6 }}>Full Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="E.g., Pratap Sanap"
                      value={form.name}
                      onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                      style={{
                        width: '100%', padding: '12px 14px', borderRadius: 12, fontSize: 13,
                        border: `1.5px solid ${border}`, background: cardBgSecondary,
                        color: textPrimary, outline: 'none', boxSizing: 'border-box',
                        transition: 'border-color 0.2s'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: textMuted, display: 'block', marginBottom: 6 }}>Mobile Number *</label>
                    <input
                      type="tel"
                      placeholder="10-digit mobile number"
                      value={form.mobile}
                      onChange={(e) => setForm(p => ({ ...p, mobile: e.target.value }))}
                      style={{
                        width: '100%', padding: '12px 14px', borderRadius: 12, fontSize: 13,
                        border: `1.5px solid ${border}`, background: cardBgSecondary,
                        color: textPrimary, outline: 'none', boxSizing: 'border-box',
                        transition: 'border-color 0.2s'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: textMuted, display: 'block', marginBottom: 6 }}>Email Address (Optional)</label>
                    <input
                      type="email"
                      placeholder="team@example.com"
                      value={form.email}
                      onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                      style={{
                        width: '100%', padding: '12px 14px', borderRadius: 12, fontSize: 13,
                        border: `1.5px solid ${border}`, background: cardBgSecondary,
                        color: textPrimary, outline: 'none', boxSizing: 'border-box',
                        transition: 'border-color 0.2s'
                      }}
                    />
                  </div>

                  {sendResult && (
                    <div style={{
                      padding: '12px 14px', borderRadius: 12, fontSize: 13, fontWeight: 600,
                      background: sendResult.type === 'success' ? '#10b98115' : '#ef444415',
                      border: `1px solid ${sendResult.type === 'success' ? '#10b98140' : '#ef444440'}`,
                      color: sendResult.type === 'success' ? '#10b981' : '#ef4444'
                    }}>
                      {sendResult.type === 'success' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <div>✅ Invitation logged & dispatched successfully!</div>
                          {sendResult.data?.whatsapp_link && (
                            <a
                              href={sendResult.data.whatsapp_link}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '8px 14px', borderRadius: 10,
                                background: '#10b981', color: '#fff', fontWeight: 800,
                                fontSize: 12, textDecoration: 'none', width: 'fit-content',
                                boxShadow: '0 3px 10px rgba(16,185,129,0.3)',
                                transition: 'all 0.2s'
                              }}
                            >
                              <MessageCircle size={15} /> Open WhatsApp to Send Invite
                            </a>
                          )}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <AlertCircle size={16} /> {sendResult.message}
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={sending || (!form.mobile && !form.email)}
                    style={{
                      padding: '13px', borderRadius: 12, border: 'none', cursor: 'pointer',
                      background: `linear-gradient(135deg, ${accent}, ${C.primaryDark || accent})`,
                      color: '#fff', fontWeight: 800, fontSize: 14,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      opacity: (sending || (!form.mobile && !form.email)) ? 0.6 : 1, 
                      boxShadow: `0 4px 16px ${accent}40`,
                      transition: 'all 0.2s'
                    }}
                  >
                    {sending ? (
                      <><RefreshCw size={15} className="animate-spin" /> Dispatching...</>
                    ) : (
                      <><Send size={15} /> Send Partner Invite</>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Invitation History & Referral Directory */}
        <div style={{
          background: cardBg, border: `1px solid ${border}`, borderRadius: 20,
          padding: isMobile ? '18px' : '24px',
          boxShadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.04)'
        }}>
          <div style={{
            display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
            gap: 12, marginBottom: 16
          }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 900, color: textPrimary, margin: 0 }}>
                Referral Network & Invitation History
              </h2>
              <span style={{ fontSize: 12, color: textMuted }}>
                Showing {filteredInvites.length} of {allInvites.length} recorded invitations
              </span>
            </div>

            {/* Filter Tabs & Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', width: isMobile ? '100%' : 'auto' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4, background: cardBgSecondary,
                padding: 4, borderRadius: 10, border: `1px solid ${border}`, width: isMobile ? '100%' : 'auto'
              }}>
                <button
                  onClick={() => setStatusFilter('all')}
                  style={{
                    flex: isMobile ? 1 : 'none',
                    padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: statusFilter === 'all' ? cardBg : 'transparent',
                    color: statusFilter === 'all' ? textPrimary : textMuted,
                    fontWeight: 700, fontSize: 12,
                    boxShadow: statusFilter === 'all' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
                  }}
                >
                  All ({allInvites.length})
                </button>
                <button
                  onClick={() => setStatusFilter('registered')}
                  style={{
                    flex: isMobile ? 1 : 'none',
                    padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: statusFilter === 'registered' ? cardBg : 'transparent',
                    color: statusFilter === 'registered' ? '#10b981' : textMuted,
                    fontWeight: 700, fontSize: 12,
                    boxShadow: statusFilter === 'registered' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
                  }}
                >
                  Registered ({totalRegisteredCount})
                </button>
                <button
                  onClick={() => setStatusFilter('pending')}
                  style={{
                    flex: isMobile ? 1 : 'none',
                    padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: statusFilter === 'pending' ? cardBg : 'transparent',
                    color: statusFilter === 'pending' ? '#f59e0b' : textMuted,
                    fontWeight: 700, fontSize: 12,
                    boxShadow: statusFilter === 'pending' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
                  }}
                >
                  Pending ({allInvites.length - totalRegisteredCount})
                </button>
              </div>

              <div style={{ position: 'relative', width: isMobile ? '100%' : 220 }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: textMuted }} />
                <input
                  type="text"
                  placeholder="Search name, mobile..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%', padding: '8px 12px 8px 34px', borderRadius: 10, fontSize: 12,
                    border: `1px solid ${border}`, background: cardBgSecondary,
                    color: textPrimary, outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </div>

          {filteredInvites.length === 0 ? (
            <div style={{
              padding: '36px 20px', textAlign: 'center', background: cardBgSecondary,
              borderRadius: 16, border: `1px solid ${border}`
            }}>
              <Users size={36} style={{ color: textMuted, opacity: 0.5, marginBottom: 8 }} />
              <div style={{ fontSize: 14, fontWeight: 800, color: textPrimary }}>No Invitations Found</div>
              <p style={{ fontSize: 12, color: textMuted, margin: '4px 0 0' }}>
                {searchQuery || statusFilter !== 'all' 
                  ? 'No invitations match your search filter criteria.'
                  : 'Start growing your partner network by copying your link or sending direct invitations above!'}
              </p>
            </div>
          ) : isMobile ? (
            /* Mobile Card View */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredInvites.map((inv) => (
                <div key={inv.id} style={{
                  padding: 14, borderRadius: 14, background: cardBgSecondary,
                  border: `1px solid ${border}`, display: 'flex', flexDirection: 'column', gap: 8
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: textPrimary }}>
                        {inv.recipient_name || 'Prospect Partner'}
                      </div>
                      <div style={{ fontSize: 11, color: textMuted, marginTop: 2 }}>
                        {inv.recipient_mobile || inv.recipient_email || '—'}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 8,
                      background: inv.registered_at ? '#10b98115' : '#f59e0b15',
                      color: inv.registered_at ? '#10b981' : '#f59e0b',
                      border: `1px solid ${inv.registered_at ? '#10b98130' : '#f59e0b30'}`
                    }}>
                      {inv.registered_at ? 'Registered ✅' : 'Invite Sent ⏳'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: textMuted, borderTop: `1px solid ${border}`, paddingTop: 8, marginTop: 4 }}>
                    <span>Sent: {inv.sent_at ? new Date(inv.sent_at).toLocaleDateString('en-IN') : 'N/A'}</span>
                    {!inv.registered_at && (
                      <button
                        onClick={() => {
                          const msg = `Hello ${inv.recipient_name || ''}! Reminder to complete your GharKaPaisa partner registration using this link: ${refersData?.referral_link}`;
                          window.open(`https://wa.me/${inv.recipient_mobile}?text=${encodeURIComponent(msg)}`, '_blank');
                        }}
                        style={{
                          background: 'none', border: 'none', color: accent,
                          fontWeight: 800, fontSize: 11, cursor: 'pointer', padding: 0
                        }}
                      >
                        Resend WhatsApp →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Desktop Table View */
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: cardBgSecondary, borderBottom: `1px solid ${border}`, color: textMuted, fontSize: 11, textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 16px' }}>Recipient Name</th>
                    <th style={{ padding: '12px 16px' }}>Mobile / Email</th>
                    <th style={{ padding: '12px 16px' }}>Invitation Date</th>
                    <th style={{ padding: '12px 16px' }}>Network Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvites.map((inv) => (
                    <tr key={inv.id} style={{ borderBottom: `1px solid ${border}` }}>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: textPrimary }}>
                        {inv.recipient_name || 'Prospect Partner'}
                      </td>
                      <td style={{ padding: '12px 16px', color: textMuted }}>
                        {inv.recipient_mobile || 'N/A'}
                        {inv.recipient_email && <div style={{ fontSize: 11, color: textMuted }}>{inv.recipient_email}</div>}
                      </td>
                      <td style={{ padding: '12px 16px', color: textMuted, fontSize: 12 }}>
                        {inv.sent_at ? new Date(inv.sent_at).toLocaleDateString('en-IN') : 'N/A'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 8,
                          background: inv.registered_at ? '#10b98115' : '#f59e0b15',
                          color: inv.registered_at ? '#10b981' : '#f59e0b',
                          border: `1px solid ${inv.registered_at ? '#10b98130' : '#f59e0b30'}`
                        }}>
                          {inv.registered_at ? 'Registered ✅' : 'Invite Sent ⏳'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        {!inv.registered_at && inv.recipient_mobile ? (
                          <button
                            onClick={() => {
                              const msg = `Hello ${inv.recipient_name || ''}! Reminder to complete your GharKaPaisa partner registration using this link: ${refersData?.referral_link}`;
                              window.open(`https://wa.me/${inv.recipient_mobile}?text=${encodeURIComponent(msg)}`, '_blank');
                            }}
                            style={{
                              background: '#10b98115', color: '#10b981', border: '1px solid #10b98130',
                              borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 800, cursor: 'pointer'
                            }}
                          >
                            Resend WhatsApp
                          </button>
                        ) : (
                          <span style={{ fontSize: 11, color: textMuted, fontWeight: 600 }}>Active Partner</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* QR Code Modal */}
      {showQrModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            width: '100%', maxWidth: 420, background: cardBg,
            borderRadius: 24, padding: 24, border: `1px solid ${border}`,
            textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            animation: 'fadeIn 0.2s ease'
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: textPrimary, margin: '0 0 6px' }}>
              Referral QR Code
            </h3>
            <p style={{ fontSize: 12, color: textMuted, margin: '0 0 20px' }}>
              Scan this QR code using any smartphone camera to open your referral link.
            </p>

            <div style={{
              background: '#ffffff', padding: 20, borderRadius: 20,
              display: 'inline-block', border: `1px solid ${border}`, marginBottom: 20
            }}>
              {qrCodeUrl && (
                <img
                  src={qrCodeUrl}
                  alt="Referral QR Code"
                  style={{ width: 200, height: 200, display: 'block' }}
                />
              )}
            </div>

            <div style={{ fontSize: 12, fontWeight: 700, color: accent, marginBottom: 20, wordBreak: 'break-all' }}>
              {refersData?.referral_link}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowQrModal(false)}
                style={{
                  flex: 1, padding: '12px', borderRadius: 12, border: `1px solid ${border}`,
                  background: cardBgSecondary, color: textPrimary, fontWeight: 800, fontSize: 13, cursor: 'pointer'
                }}
              >
                Close
              </button>
              <button
                onClick={copyLink}
                style={{
                  flex: 1, padding: '12px', borderRadius: 12, border: 'none',
                  background: accent, color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer'
                }}
              >
                Copy Link
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

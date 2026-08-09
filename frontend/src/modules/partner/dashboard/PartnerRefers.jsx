import React, { useState, useEffect } from 'react';
import { Copy, Share2, MessageCircle, Mail, Send, CheckCircle, Users, Link, RefreshCw, UserPlus, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../../app/store/authStore';
import { useTheme } from '../../../contexts/ThemeContext';
import api from '../../../services/api';

export default function PartnerRefers() {
  const { C, isDark } = useTheme();
  const isTeamMember = useAuthStore((state) => state.user?.role === 'TEAM_MEMBER');
  const [refersData, setRefersData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', mobile: '', email: '' });
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { fetchRefers(); }, []);

  const bg = isDark ? '#000' : C.bg;
  const cardBg = isDark ? '#0f0f0f' : '#fff';
  const border = isDark ? '#1f1f1f' : C.border;
  const textPrimary = C.text;
  const textMuted = C.textMid;
  const accent = C.primary;

  const fetchRefers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/team/refers');
      if (res.data.success) setRefersData(res.data.data);
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
      if (res.data.success) {
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

  const shareWhatsApp = () => {
    if (!refersData?.referral_link) return;
    const msg = `Join GharKaPaisa and earn commissions on every approved credit card & loan application! Register here: ${refersData.referral_link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const shareTelegram = () => {
    if (!refersData?.referral_link) return;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(refersData.referral_link)}&text=${encodeURIComponent('Join GharKaPaisa and earn commissions!')}`, '_blank');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: `3px solid ${border}`, borderTop: `3px solid ${accent}`, animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: bg, padding: '12px' }} className="transition-all duration-500">
      {/* Header */}
      <div style={{
        background: isDark
          ? 'linear-gradient(135deg,#0f0f0f 0%,#0d0d1a 100%)'
          : 'linear-gradient(135deg,#f0f4ff 0%,#fff 100%)',
        border: `1px solid ${border}`,
        borderRadius: 20, padding: '20px 24px', marginBottom: 16,
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        boxShadow: isDark ? '0 8px 40px rgba(0,0,0,0.5)' : '0 4px 24px rgba(79,70,229,0.08)',
        opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(-16px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease'
      }}>
        <div>
          <h1 style={{ fontSize: 'clamp(18px,4vw,26px)', fontWeight: 900, color: textPrimary, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Share2 size={26} color={accent} />
            My Referrals
          </h1>
          <p style={{ fontSize: 13, color: textMuted, margin: '4px 0 0' }}>
            Invite people to join GharKaPaisa and earn referral bonuses
          </p>
        </div>
        <button onClick={fetchRefers}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 16px', borderRadius: 12, border: `1px solid ${border}`, cursor: 'pointer',
            background: isDark ? '#1a1a1a' : '#f8faff',
            color: textPrimary, fontWeight: 700, fontSize: 13,
            transition: 'all 0.2s'
          }}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} style={{ color: accent }} />
          Refresh
        </button>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
        <div style={{
          background: cardBg, border: `1px solid ${border}`, borderRadius: 16,
          padding: 20, textAlign: 'center',
          boxShadow: isDark ? 'none' : '0 2px 10px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: accent, marginBottom: 4 }}>
            {refersData?.total_invites || 0}
          </div>
          <div style={{ fontSize: 11, color: textMuted, fontWeight: 600 }}>Total Invites Sent</div>
        </div>
        <div style={{
          background: cardBg, border: `1px solid ${border}`, borderRadius: 16,
          padding: 20, textAlign: 'center',
          boxShadow: isDark ? 'none' : '0 2px 10px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#10b981', marginBottom: 4 }}>
            {refersData?.total_registered || 0}
          </div>
          <div style={{ fontSize: 11, color: textMuted, fontWeight: 600 }}>Registered</div>
        </div>
      </div>

      {/* Referral Link Card */}
      <div style={{
        background: cardBg, border: `1px solid ${border}`, borderRadius: 16,
        padding: 20, marginBottom: 16,
        boxShadow: isDark ? 'none' : '0 2px 10px rgba(0,0,0,0.05)'
      }}>
        <h2 style={{ fontSize: 14, fontWeight: 800, color: textPrimary, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link size={16} color={accent} /> Your Referral Link
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10, borderRadius: 12, background: isDark ? '#1a1a1a' : '#f8faff', border: `1px solid ${border}`, marginBottom: 12 }}>
          <span style={{ flex: 1, fontSize: 12, color: textPrimary, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {refersData?.referral_link || '—'}
          </span>
          <button onClick={copyLink}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: accent, color: '#fff', fontWeight: 700, fontSize: 12,
              transition: 'all 0.2s', flexShrink: 0
            }}>
            {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={shareWhatsApp}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '12px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: '#10b981', color: '#fff', fontWeight: 700, fontSize: 13,
              transition: 'all 0.2s'
            }}>
            <MessageCircle size={16} /> WhatsApp
          </button>
          <button onClick={shareTelegram}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '12px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: '#0ea5e9', color: '#fff', fontWeight: 700, fontSize: 13,
              transition: 'all 0.2s'
            }}>
            <Send size={16} /> Telegram
          </button>
        </div>
      </div>

      {/* Invite Form — Partners only */}
      {!isTeamMember && (
        <div style={{
          background: cardBg, border: `1px solid ${border}`, borderRadius: 16,
          padding: 20, marginBottom: 16,
          boxShadow: isDark ? 'none' : '0 2px 10px rgba(0,0,0,0.05)'
        }}>
          <h2 style={{ fontSize: 14, fontWeight: 800, color: textPrimary, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={16} color={accent} /> Invite a Team Member
          </h2>
          <form onSubmit={handleSendInvite} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: textMuted, display: 'block', marginBottom: 6 }}>Name (optional)</label>
              <input
                type="text"
                placeholder="E.g., Pratap Sanap"
                value={form.name}
                onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 12, fontSize: 13,
                  border: `1.5px solid ${border}`, background: isDark ? '#1a1a1a' : '#f8faff',
                  color: textPrimary, outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.2s'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: textMuted, display: 'block', marginBottom: 6 }}>Mobile Number *</label>
              <input
                type="tel"
                placeholder="9876543210"
                value={form.mobile}
                onChange={(e) => setForm(p => ({ ...p, mobile: e.target.value }))}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 12, fontSize: 13,
                  border: `1.5px solid ${border}`, background: isDark ? '#1a1a1a' : '#f8faff',
                  color: textPrimary, outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.2s'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: textMuted, display: 'block', marginBottom: 6 }}>Email Address (optional)</label>
              <input
                type="email"
                placeholder="team@example.com"
                value={form.email}
                onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 12, fontSize: 13,
                  border: `1.5px solid ${border}`, background: isDark ? '#1a1a1a' : '#f8faff',
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div>✅ Invitation sent successfully!</div>
                    {sendResult.data?.whatsapp_link && (
                      <a
                        href={sendResult.data.whatsapp_link}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '8px 12px', borderRadius: 10,
                          background: '#10b981', color: '#fff', fontWeight: 700,
                          fontSize: 12, textDecoration: 'none', width: 'fit-content',
                          transition: 'all 0.2s'
                        }}
                      >
                        <MessageCircle size={14} /> Open WhatsApp to Send
                      </a>
                    )}
                  </div>
                ) : sendResult.message}
              </div>
            )}

            <button
              type="submit"
              disabled={sending || (!form.mobile && !form.email)}
              style={{
                padding: '12px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: `linear-gradient(135deg, ${accent}, ${C.primaryDark})`,
                color: '#fff', fontWeight: 700, fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: sending ? 0.6 : 1, boxShadow: `0 4px 16px ${accent}40`,
                transition: 'all 0.2s'
              }}
            >
              {sending ? (
                <><RefreshCw size={14} className="animate-spin" /> Sending...</>
              ) : (
                <><Send size={14} /> Send Invitation</>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Invites History */}
      {refersData?.invites?.length > 0 && (
        <div style={{
          background: cardBg, border: `1px solid ${border}`, borderRadius: 16,
          padding: 20,
          boxShadow: isDark ? 'none' : '0 2px 10px rgba(0,0,0,0.05)'
        }}>
          <h2 style={{ fontSize: 14, fontWeight: 800, color: textPrimary, margin: '0 0 12px' }}>Invitation History</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {refersData.invites.map((inv) => (
              <div key={inv.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: 12, borderRadius: 12, background: isDark ? '#1a1a1a' : '#f8faff',
                border: `1px solid ${border}`
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: textPrimary }}>{inv.recipient_name || 'Unknown'}</div>
                  <div style={{ fontSize: 11, color: textMuted }}>{inv.recipient_mobile || inv.recipient_email || '—'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8,
                    background: inv.registered_at ? '#10b98115' : '#64748b15',
                    color: inv.registered_at ? '#10b981' : '#64748b',
                    border: `1px solid ${inv.registered_at ? '#10b98130' : '#64748b30'}`
                  }}>
                    {inv.registered_at ? '✅ Registered' : inv.status || 'Sent'}
                  </span>
                  <div style={{ fontSize: 10, color: textMuted, marginTop: 4 }}>
                    {inv.sent_at ? new Date(inv.sent_at).toLocaleDateString('en-IN') : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

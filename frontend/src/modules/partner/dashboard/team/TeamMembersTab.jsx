import React, { useState, useEffect } from 'react';
import {
  Search, Download, ChevronLeft, ChevronRight,
  UserPlus, X, Copy, Check, MessageSquare, Mail, Send,
  RefreshCw, ShieldAlert, CheckCircle, Share2, UserX, UserCheck
} from 'lucide-react';
import { useTheme } from '../../../../contexts/ThemeContext';
import api from '../../../../services/api';

export default function TeamMembersTab({ onSelectMember }) {
  const { C, isDark } = useTheme();
  const border = isDark ? '#1f1f1f' : C.border;
  const cardBg = isDark ? '#0f0f0f' : '#fff';
  const textPrimary = C.text;
  const textMuted = C.textMid;
  const accent = C.primary;
  const inputBg = isDark ? '#1a1a1a' : '#f8faff';

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, total_pages: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [rankFilter, setRankFilter] = useState('');
  const [kycFilter, setKycFilter] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', mobile: '', email: '' });
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState(null);
  const [inviteResult, setInviteResult] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => { fetchMembers(1); }, [search, statusFilter, rankFilter, kycFilter]);

  const fetchMembers = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' });
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (rankFilter) params.append('rank', rankFilter);
      if (kycFilter) params.append('kyc_status', kycFilter);
      const res = await api.get(`/team/members?${params}`);
      if (res.data?.success) {
        setMembers(res.data.data || []);
        setPagination(res.data.pagination || { page: 1, limit: 20, total: 0, total_pages: 1 });
      }
    } catch { /* silent */ } finally { setLoading(false); }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteForm.mobile && !inviteForm.email) { setInviteError('Provide mobile or email.'); return; }
    setInviting(true); setInviteError(null);
    try {
      const res = await api.post('/team/invite', inviteForm);
      if (res.data?.success) { setInviteResult(res.data.data); fetchMembers(1); }
      else setInviteError(res.data?.message || 'Failed to send invitation');
    } catch (err) { setInviteError(err.response?.data?.message || 'Error creating invitation'); }
    finally { setInviting(false); }
  };

  const resetInviteModal = () => {
    setShowInviteModal(false);
    setInviteForm({ name: '', mobile: '', email: '' });
    setInviteResult(null); setInviteError(null); setCopiedLink(false);
  };

  const copyLink = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleNativeShare = async () => {
    if (inviteResult?.invite_link && navigator.share) {
      try {
        await navigator.share({
          title: 'Join GharKaPaisa Team',
          text: `Hi! Join my team on GharKaPaisa using this referral link. Partner Code: ${inviteResult.partner_code}`,
          url: inviteResult.invite_link,
        });
      } catch (err) { /* silent cancel */ }
    } else if (inviteResult?.invite_link) {
      copyLink(inviteResult.invite_link);
    }
  };

  const handleToggleMemberStatus = async (memberId, currentStatus) => {
    const isCurrentlyActive = currentStatus === 'active';
    const newStatus = isCurrentlyActive ? 'inactive' : 'active';
    const actionLabel = isCurrentlyActive ? 'remove/deactivate' : 'reactivate';
    
    if (!window.confirm(`Are you sure you want to ${actionLabel} this team member?`)) return;

    try {
      const res = await api.patch(`/team/${memberId}/status`, { status: newStatus });
      if (res.data?.success) {
        fetchMembers(pagination.page);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update member status');
    }
  };

  const handleExportCSV = () => {
    if (!members.length) return;
    const headers = ['Partner Code', 'Name', 'Email', 'Mobile', 'Rank', 'Level', 'Status', 'KYC Status', 'Business (INR)', 'Commission (INR)', 'Joined Date'];
    const rows = members.map(m => [
      `"${m.partner_code || ''}"`, `"${m.full_name || ''}"`, `"${m.email || ''}"`, `"${m.mobile || ''}"`,
      `"${m.rank || ''}"`, m.level || 1, `"${m.status || ''}"`, `"${m.kyc_status || ''}"`,
      m.total_business || 0, m.total_commission || 0, `"${new Date(m.joined_at).toLocaleDateString()}"`
    ].join(','));
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `team_members_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const fmt = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);

  const selectStyle = {
    padding: '9px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600,
    border: `1.5px solid ${border}`, background: inputBg, color: textPrimary, outline: 'none'
  };

  return (
    <div>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .member-tr:hover td { background: ${isDark ? '#111' : '#f8faff'} !important; }
        .btn-view:hover { background: ${accent} !important; color: #fff !important; }
      `}</style>

      {/* Header Controls */}
      <div style={{
        padding: '18px 20px', borderRadius: 18, marginBottom: 14,
        background: cardBg, border: `1px solid ${border}`,
        boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: textPrimary, margin: 0 }}>Team Members</h3>
            <p style={{ fontSize: 12, color: textMuted, margin: '3px 0 0' }}>Total {pagination.total} members in your downline</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => setShowInviteModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: `linear-gradient(135deg,${accent},${C.primaryDark})`, color: '#fff', fontWeight: 700, fontSize: 12,
                boxShadow: `0 4px 14px ${accent}40`
              }}>
              <UserPlus size={14} /> Invite Member
            </button>
            <button onClick={handleExportCSV}
              style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontWeight: 700, fontSize: 12,
                boxShadow: '0 4px 14px rgba(16,185,129,0.3)'
              }}>
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 10, paddingTop: 14, borderTop: `1px solid ${border}` }}>
          <div style={{ position: 'relative', gridColumn: 'span 2' }}>
            <Search size={14} color={textMuted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, code, mobile..."
              style={{ ...selectStyle, paddingLeft: 36, width: '100%', boxSizing: 'border-box' }} />
          </div>
          <select value={rankFilter} onChange={e => setRankFilter(e.target.value)} style={selectStyle}>
            <option value="">All Ranks</option>
            {['Partner', 'Silver', 'Gold', 'Diamond'].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selectStyle}>
            <option value="">All Statuses</option>
            {['active', 'inactive', 'suspended'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <select value={kycFilter} onChange={e => setKycFilter(e.target.value)} style={selectStyle}>
            <option value="">All KYC</option>
            {['approved', 'pending', 'under_review'].map(k => <option key={k} value={k}>{k.replace('_', ' ')}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ borderRadius: 18, background: cardBg, border: `1px solid ${border}`, overflow: 'hidden', boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: isDark ? '#111' : '#f8faff', borderBottom: `1px solid ${border}` }}>
                {['Member Info', 'Code / Level', 'Rank', 'Status', 'KYC', 'Business', 'Commission', 'Action'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: h === 'Business' || h === 'Commission' ? 'right' : h === 'Action' ? 'center' : 'left', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: textMuted, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} style={{ padding: 12 }}>
                      <div style={{ height: 40, borderRadius: 10, background: isDark ? '#111' : '#f1f5f9', animation: 'shimmer 1.5s infinite' }} />
                    </td>
                  </tr>
                ))
              ) : members.length > 0 ? members.map((m, i) => (
                <tr key={m.id} className="member-tr" style={{ borderBottom: `1px solid ${border}`, animation: `fadeIn 0.3s ease ${i * 40}ms both` }}>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: accent + '15', border: `1px solid ${accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: accent, overflow: 'hidden', fontSize: 11, flexShrink: 0 }}>
                        {m.profile_photo_url ? <img src={m.profile_photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : m.full_name?.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div onClick={() => onSelectMember(m.id)} style={{ fontWeight: 700, color: textPrimary, cursor: 'pointer', fontSize: 13 }}>{m.full_name}</div>
                        <div style={{ fontSize: 11, color: textMuted }}>{m.mobile}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 700, color: textPrimary }}>{m.partner_code}</div>
                    <div style={{ fontSize: 11, color: textMuted }}>Level {m.level}</div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 99, fontWeight: 700, background: accent + '15', color: accent, border: `1px solid ${accent}25` }}>{m.rank}</span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, fontWeight: 700, textTransform: 'uppercase', background: m.status === 'active' ? '#10b98115' : '#ef444415', color: m.status === 'active' ? '#10b981' : '#ef4444', border: `1px solid ${m.status === 'active' ? '#10b98130' : '#ef444430'}` }}>{m.status}</span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, fontWeight: 700, background: m.kyc_status === 'approved' ? '#10b98115' : '#f59e0b15', color: m.kyc_status === 'approved' ? '#10b981' : '#f59e0b' }}>
                      {m.kyc_status === 'approved' ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: '#10b981' }}>{fmt(m.total_business)}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: '#f59e0b' }}>{fmt(m.total_commission)}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <button className="btn-view" onClick={() => onSelectMember(m.id)}
                        style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${accent}30`, background: accent + '15', color: accent, fontWeight: 700, fontSize: 11, cursor: 'pointer', transition: 'all 0.2s' }}>
                        360°
                      </button>
                      {m.status === 'active' ? (
                        <button onClick={() => handleToggleMemberStatus(m.id, m.status)}
                          title="Remove / Deactivate Member"
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 8, border: '1px solid #ef444430', background: '#ef444415', color: '#ef4444', fontWeight: 700, fontSize: 11, cursor: 'pointer', transition: 'all 0.2s' }}>
                          <UserX size={12} /> Remove
                        </button>
                      ) : (
                        <button onClick={() => handleToggleMemberStatus(m.id, m.status)}
                          title="Reactivate Member"
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 8, border: '1px solid #10b98130', background: '#10b98115', color: '#10b981', fontWeight: 700, fontSize: 11, cursor: 'pointer', transition: 'all 0.2s' }}>
                          <UserCheck size={12} /> Reactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={8} style={{ padding: '40px 0', textAlign: 'center', color: textMuted, fontSize: 13 }}>No team members match the filters</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {pagination.total_pages > 1 && (
          <div style={{ padding: '12px 16px', borderTop: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: textMuted }}>
            <span>Page {pagination.page} of {pagination.total_pages}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {[{ icon: ChevronLeft, disabled: pagination.page <= 1, page: pagination.page - 1 }, { icon: ChevronRight, disabled: pagination.page >= pagination.total_pages, page: pagination.page + 1 }].map(({ icon: Icon, disabled, page }) => (
                <button key={page} disabled={disabled} onClick={() => fetchMembers(page)}
                  style={{ padding: 8, borderRadius: 8, border: `1px solid ${border}`, background: isDark ? '#1a1a1a' : '#f1f5f9', color: textPrimary, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1 }}>
                  <Icon size={14} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 460, background: cardBg, border: `1px solid ${border}`, borderRadius: 24, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.5)', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ padding: '18px 22px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ padding: 10, borderRadius: 12, background: accent + '15', border: `1px solid ${accent}25` }}>
                  <UserPlus size={16} color={accent} />
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: textPrimary, margin: 0 }}>Invite Team Member</h3>
                  <p style={{ fontSize: 11, color: textMuted, margin: '2px 0 0' }}>Send via WhatsApp, SMS, or Email</p>
                </div>
              </div>
              <button onClick={resetInviteModal} style={{ padding: 6, borderRadius: 8, border: 'none', background: isDark ? '#1a1a1a' : '#f1f5f9', cursor: 'pointer', color: textMuted }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: 22 }}>
              {inviteError && (
                <div style={{ padding: '10px 14px', borderRadius: 12, background: '#ef444415', border: '1px solid #ef444430', color: '#ef4444', fontSize: 12, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShieldAlert size={14} /> {inviteError}
                </div>
              )}

              {!inviteResult ? (
                <form onSubmit={handleSendInvite} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    { label: 'Member Name', key: 'name', type: 'text', placeholder: 'Full name (optional)' },
                    { label: 'Mobile Number', key: 'mobile', type: 'tel', placeholder: '10-digit mobile' },
                    { label: 'Email Address', key: 'email', type: 'email', placeholder: 'name@example.com' },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: textMuted, display: 'block', marginBottom: 6 }}>{f.label}</label>
                      <input type={f.type} value={inviteForm[f.key]} placeholder={f.placeholder}
                        onChange={e => setInviteForm(p => ({ ...p, [f.key]: e.target.value }))}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 12, fontSize: 13, border: `1.5px solid ${border}`, background: inputBg, color: textPrimary, outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 10, paddingTop: 8, borderTop: `1px solid ${border}` }}>
                    <button type="button" onClick={resetInviteModal}
                      style={{ flex: 1, padding: '10px', borderRadius: 12, border: `1px solid ${border}`, background: isDark ? '#1a1a1a' : '#f1f5f9', color: textPrimary, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                    <button type="submit" disabled={inviting}
                      style={{ flex: 1, padding: '10px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg,${accent},${C.primaryDark})`, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: inviting ? 0.6 : 1, boxShadow: `0 4px 14px ${accent}40` }}>
                      {inviting ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                      Generate Link
                    </button>
                  </div>
                </form>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ padding: '12px 16px', borderRadius: 12, background: '#10b98115', border: '1px solid #10b98130', color: '#10b981' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                      <CheckCircle size={15} /> Invitation Created!
                    </div>
                    <p style={{ fontSize: 12, color: textMuted, margin: 0 }}>
                      Code: <strong style={{ color: textPrimary, fontFamily: 'monospace' }}>{inviteResult.partner_code}</strong>
                      {inviteResult.temp_password && <> | Pass: <strong style={{ color: textPrimary, fontFamily: 'monospace' }}>{inviteResult.temp_password}</strong></>}
                    </p>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: textMuted, display: 'block', marginBottom: 6 }}>Invitation Link</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 6, borderRadius: 12, background: isDark ? '#0a0a0a' : '#f1f5f9', border: `1px solid ${border}` }}>
                      <input readOnly value={inviteResult.invite_link} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 11, color: accent, fontFamily: 'monospace', padding: '4px 8px' }} />
                      <button onClick={() => copyLink(inviteResult.invite_link)}
                        style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: accent, color: '#fff', fontWeight: 700, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {copiedLink ? <Check size={12} /> : <Copy size={12} />}
                        {copiedLink ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                    {[
                      { href: inviteResult.whatsapp_link, label: 'WhatsApp', icon: MessageSquare, color: '#10b981' },
                      { href: inviteResult.sms_link, label: 'SMS', icon: Send, color: '#3b82f6' },
                      { href: inviteResult.email_link, label: 'Email', icon: Mail, color: '#ef4444' },
                    ].map(({ href, label, icon: Icon, color }) => (
                      <a key={label} href={href} target="_blank" rel="noreferrer"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 4px', borderRadius: 12, background: color + '15', color, border: `1px solid ${color}30`, fontSize: 11, fontWeight: 700, textDecoration: 'none', transition: 'all 0.2s' }}>
                        <Icon size={13} /> {label}
                      </a>
                    ))}
                    <button onClick={handleNativeShare}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 4px', borderRadius: 12, background: accent + '15', color: accent, border: `1px solid ${accent}30`, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                      <Share2 size={13} /> Share
                    </button>
                  </div>

                  <button onClick={resetInviteModal}
                    style={{ padding: '10px', borderRadius: 12, border: `1px solid ${border}`, background: isDark ? '#1a1a1a' : '#f1f5f9', color: textPrimary, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Done</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

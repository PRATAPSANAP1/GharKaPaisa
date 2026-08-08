import React, { useState, useEffect } from 'react';
import { Settings, Copy, Check, QrCode, Download, Share2, MessageSquare, Save, RefreshCw } from 'lucide-react';
import { useTheme } from '../../../../contexts/ThemeContext';
import api from '../../../../services/api';

function Toggle({ value, onChange, accent }) {
  return (
    <div onClick={onChange} style={{
      width: 48, height: 26, borderRadius: 99, cursor: 'pointer', position: 'relative',
      background: value ? `linear-gradient(135deg,${accent},${accent}cc)` : '#374151',
      transition: 'background 0.3s', boxShadow: value ? `0 0 12px ${accent}40` : 'none'
    }}>
      <div style={{
        position: 'absolute', top: 3, left: value ? 25 : 3,
        width: 20, height: 20, borderRadius: '50%', background: '#fff',
        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        transition: 'left 0.3s cubic-bezier(0.4,0,0.2,1)'
      }} />
    </div>
  );
}

export default function TeamSettingsTab() {
  const { C, isDark } = useTheme();
  const border = isDark ? '#1f1f1f' : C.border;
  const cardBg = isDark ? '#0f0f0f' : '#fff';
  const textPrimary = C.text;
  const textMuted = C.textMid;
  const accent = C.primary;
  const inputBg = isDark ? '#1a1a1a' : '#f8faff';

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [msgSuccess, setMsgSuccess] = useState(null);
  const [teamEnabled, setTeamEnabled] = useState(true);
  const [referralEnabled, setReferralEnabled] = useState(true);
  const [referralMessage, setReferralMessage] = useState('');

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/team/settings');
      if (res.data?.success) {
        const d = res.data.data;
        setSettings(d);
        setTeamEnabled(d.team_enabled);
        setReferralEnabled(d.referral_enabled);
        setReferralMessage(d.referral_message || '');
      }
    } catch { /* silent */ } finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true); setMsgSuccess(null);
    try {
      const res = await api.patch('/team/settings', { team_enabled: teamEnabled, referral_enabled: referralEnabled, referral_message: referralMessage });
      if (res.data?.success) { setMsgSuccess('Settings saved successfully!'); setTimeout(() => setMsgSuccess(null), 3000); }
    } catch { /* silent */ } finally { setSaving(false); }
  };

  const handleCopy = () => {
    if (!settings?.referral_link) return;
    navigator.clipboard.writeText(settings.referral_link);
    setCopied(true); setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadQR = () => {
    if (!settings?.qr_code_data_url) return;
    const a = document.createElement('a');
    a.href = settings.qr_code_data_url;
    a.download = `referral_qr_${settings.referral_code}.png`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <style>{`@keyframes shimmer{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
        {[200, 280].map((h, i) => (
          <div key={i} style={{ height: h, borderRadius: 18, background: isDark ? '#111' : '#f1f5f9', border: `1px solid ${border}`, animation: 'shimmer 1.5s infinite' }} />
        ))}
      </div>
    );
  }

  if (!settings) return null;

  const shareText = encodeURIComponent(`${settings.referral_message}\nRegister here: ${settings.referral_link}`);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Referral Link & QR */}
      <div style={{
        padding: '22px', borderRadius: 18,
        background: isDark ? 'linear-gradient(135deg,#0d0d1a,#0f0f0f)' : 'linear-gradient(135deg,#f0f4ff,#fff)',
        border: `1px solid ${accent}25`,
        boxShadow: isDark ? '0 8px 40px rgba(0,0,0,0.4)' : `0 8px 40px ${accent}10`,
        animation: 'fadeIn 0.3s ease'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 900, color: textPrimary, margin: 0 }}>Your Referral Link & QR Code</h3>
            <p style={{ fontSize: 12, color: textMuted, margin: '4px 0 0' }}>Share to automatically register partners into your downline</p>
          </div>
          <span style={{ fontSize: 11, padding: '4px 12px', borderRadius: 99, background: accent + '15', color: accent, border: `1px solid ${accent}25`, fontWeight: 700 }}>
            Code: {settings.referral_code}
          </span>
        </div>

        {/* Copy Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 6, borderRadius: 14, background: isDark ? '#0a0a0a' : '#f1f5f9', border: `1px solid ${border}`, marginBottom: 20 }}>
          <input readOnly value={settings.referral_link}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 12, color: accent, fontFamily: 'monospace', padding: '4px 10px' }} />
          <button onClick={handleCopy}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg,${accent},${C.primaryDark})`, color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', boxShadow: `0 4px 12px ${accent}40` }}>
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        {/* QR + Social */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px', borderRadius: 14, background: isDark ? '#111' : '#fff', border: `1px solid ${border}` }}>
            {settings.qr_code_data_url ? (
              <img src={settings.qr_code_data_url} alt="QR" style={{ width: 88, height: 88, borderRadius: 10, background: '#fff', padding: 4 }} />
            ) : (
              <div style={{ width: 88, height: 88, borderRadius: 10, background: isDark ? '#1a1a1a' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <QrCode size={32} color={textMuted} />
              </div>
            )}
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: textPrimary, marginBottom: 4 }}>Referral QR Code</div>
              <div style={{ fontSize: 11, color: textMuted, marginBottom: 12 }}>Scan or download for offline banners</div>
              <button onClick={handleDownloadQR}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, border: `1px solid ${border}`, background: isDark ? '#1a1a1a' : '#f1f5f9', color: textPrimary, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                <Download size={12} /> Download QR
              </button>
            </div>
          </div>

          <div style={{ padding: '16px', borderRadius: 14, background: isDark ? '#111' : '#fff', border: `1px solid ${border}` }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: textPrimary, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Share2 size={14} color={accent} /> Share Options
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[
                { href: `https://wa.me/?text=${shareText}`, label: 'WhatsApp', color: '#10b981' },
                { href: `https://t.me/share/url?url=${encodeURIComponent(settings.referral_link)}&text=${encodeURIComponent(settings.referral_message)}`, label: 'Telegram', color: '#3b82f6' },
                { href: `mailto:?subject=Join my GharKaPaisa Team&body=${shareText}`, label: 'Email', color: '#ef4444' },
              ].map(({ href, label, color }) => (
                <a key={label} href={href} target="_blank" rel="noreferrer"
                  style={{ padding: '7px 14px', borderRadius: 10, background: color + '15', color, border: `1px solid ${color}30`, fontSize: 12, fontWeight: 700, textDecoration: 'none', transition: 'all 0.2s' }}>
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div style={{ padding: '22px', borderRadius: 18, background: cardBg, border: `1px solid ${border}`, boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)', animation: 'fadeIn 0.4s ease' }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: textPrimary, margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Settings size={16} color={accent} /> Team Preferences
        </h3>

        {msgSuccess && (
          <div style={{ padding: '10px 16px', borderRadius: 12, background: '#10b98115', border: '1px solid #10b98130', color: '#10b981', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
            ✅ {msgSuccess}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[
            { label: 'Enable Team Management', desc: 'Allow team overriding earnings and downline metrics', value: teamEnabled, onChange: () => setTeamEnabled(v => !v) },
            { label: 'Allow Referral Registrations', desc: 'Permit new partner registrations via your referral code', value: referralEnabled, onChange: () => setReferralEnabled(v => !v) },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: `1px solid ${border}` }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: textPrimary }}>{item.label}</div>
                <div style={{ fontSize: 11, color: textMuted, marginTop: 2 }}>{item.desc}</div>
              </div>
              <Toggle value={item.value} onChange={item.onChange} accent={accent} />
            </div>
          ))}

          <div style={{ paddingTop: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: textMuted, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <MessageSquare size={13} color={accent} /> Custom Referral Message
            </label>
            <textarea rows={3} value={referralMessage} onChange={e => setReferralMessage(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, fontSize: 13, border: `1.5px solid ${border}`, background: inputBg, color: textPrimary, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
          </div>
        </div>

        <div style={{ paddingTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleSave} disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 24px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg,${accent},${C.primaryDark})`, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: `0 4px 16px ${accent}40`, opacity: saving ? 0.6 : 1 }}>
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
}

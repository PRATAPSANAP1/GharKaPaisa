import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Settings, Copy, Check, QrCode, Download, Share2, 
  MessageSquare, ToggleLeft, ToggleRight, Save, RefreshCw 
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://gharkapaisa.in/api/v1';

export default function TeamSettingsTab() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [msgSuccess, setMsgSuccess] = useState(null);

  // Form state
  const [teamEnabled, setTeamEnabled] = useState(true);
  const [referralEnabled, setReferralEnabled] = useState(true);
  const [referralMessage, setReferralMessage] = useState('');

  const getAuthToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const res = await axios.get(`${API_URL}/team/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        const d = res.data.data;
        setSettings(d);
        setTeamEnabled(d.team_enabled);
        setReferralEnabled(d.referral_enabled);
        setReferralMessage(d.referral_message || '');
      }
    } catch (err) {
      console.error('Failed to fetch team settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setMsgSuccess(null);
    try {
      const token = getAuthToken();
      const res = await axios.patch(`${API_URL}/team/settings`, {
        team_enabled: teamEnabled,
        referral_enabled: referralEnabled,
        referral_message: referralMessage
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setMsgSuccess('Settings updated successfully');
        setTimeout(() => setMsgSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = () => {
    if (!settings?.referral_link) return;
    navigator.clipboard.writeText(settings.referral_link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadQR = () => {
    if (!settings?.qr_code_data_url) return;
    const link = document.createElement('a');
    link.href = settings.qr_code_data_url;
    link.download = `referral_qr_${settings.referral_code}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading settings & referral tools...</div>;
  }

  if (!settings) return null;

  const shareText = encodeURIComponent(`${settings.referral_message}\nRegister here: ${settings.referral_link}`);

  return (
    <div className="space-y-6">
      {/* Referral Link & QR Code Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 border border-indigo-500/40 shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-extrabold text-white">Your Partner Referral Link & QR Code</h3>
            <p className="text-xs text-slate-300 mt-1">Share your unique code to automatically register partners into your downline</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold">
            Code: {settings.referral_code}
          </span>
        </div>

        {/* Copy Link Bar */}
        <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/80 border border-slate-800">
          <input
            type="text"
            readOnly
            value={settings.referral_link}
            className="flex-1 bg-transparent px-3 py-1 text-xs text-indigo-300 font-mono outline-none"
          />
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>

        {/* QR Code & Social Sharing Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
          {/* QR Code */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            {settings.qr_code_data_url ? (
              <img src={settings.qr_code_data_url} alt="QR Code" className="w-24 h-24 rounded-lg bg-white p-1" />
            ) : (
              <div className="w-24 h-24 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500">
                <QrCode className="w-8 h-8" />
              </div>
            )}
            <div>
              <h4 className="text-xs font-bold text-white">Referral QR Code</h4>
              <p className="text-[11px] text-slate-400 mt-1">Scan or download QR code for offline promotional banners</p>
              <button
                onClick={handleDownloadQR}
                className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Download QR
              </button>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Share2 className="w-4 h-4 text-indigo-400" /> Instant Share Options
            </h4>
            <div className="flex flex-wrap gap-2">
              <a
                href={`https://wa.me/?text=${shareText}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-600 hover:text-white transition-all"
              >
                WhatsApp
              </a>
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(settings.referral_link)}&text=${encodeURIComponent(settings.referral_message)}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-semibold hover:bg-blue-600 hover:text-white transition-all"
              >
                Telegram
              </a>
              <a
                href={`mailto:?subject=Join my GharKaPaisa Team&body=${shareText}`}
                className="px-3 py-2 rounded-lg bg-rose-600/20 text-rose-400 border border-rose-500/30 text-xs font-semibold hover:bg-rose-600 hover:text-white transition-all"
              >
                Email
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Control Toggles & Custom Message */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Settings className="w-4 h-4 text-indigo-400" />
          Team Module Preferences & Custom Message
        </h3>

        {msgSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            {msgSuccess}
          </div>
        )}

        <div className="space-y-4 divide-y divide-slate-800">
          {/* Enable Team */}
          <div className="pt-4 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-white">Enable Team Management Layer</h4>
              <p className="text-[11px] text-slate-400">Allow team overriding earnings and downline metrics visualization</p>
            </div>
            <button
              onClick={() => setTeamEnabled(!teamEnabled)}
              className={`p-1.5 rounded-xl transition-colors ${teamEnabled ? 'text-indigo-400' : 'text-slate-600'}`}
            >
              {teamEnabled ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
            </button>
          </div>

          {/* Enable Referral */}
          <div className="pt-4 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-white">Allow Referral Registrations</h4>
              <p className="text-[11px] text-slate-400">Permit new partner registrations via your referral code</p>
            </div>
            <button
              onClick={() => setReferralEnabled(!referralEnabled)}
              className={`p-1.5 rounded-xl transition-colors ${referralEnabled ? 'text-indigo-400' : 'text-slate-600'}`}
            >
              {referralEnabled ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
            </button>
          </div>

          {/* Custom Message */}
          <div className="pt-4 space-y-2">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-indigo-400" /> Custom Referral Invitation Message
            </label>
            <textarea
              rows={3}
              value={referralMessage}
              onChange={(e) => setReferralMessage(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="pt-4 text-right">
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 ml-auto"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}

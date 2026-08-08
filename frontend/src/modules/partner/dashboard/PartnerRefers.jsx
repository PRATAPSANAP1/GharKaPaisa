import React, { useState, useEffect } from 'react';
import { Copy, Share2, MessageCircle, Mail, Phone, Send, CheckCircle, Users, Link, QrCode } from 'lucide-react';
import { useAuthStore } from '../../../app/store/authStore';
import api from '../../../services/api';

export default function PartnerRefers() {
  const isTeamMember = useAuthStore((state) => state.user?.role === 'TEAM_MEMBER');
  const [refersData, setRefersData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', mobile: '', email: '' });
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => { fetchRefers(); }, []);

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
    setTimeout(() => setCopied(false), 2000);
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
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
          <Share2 className="w-6 h-6 text-indigo-400" /> My Referrals
        </h1>
        <p className="text-sm text-slate-400 mt-1">Invite people to join GharKaPaisa and earn referral bonuses</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-center">
          <div className="text-3xl font-extrabold text-indigo-400">{refersData?.total_invites || 0}</div>
          <div className="text-xs text-slate-400 mt-1 font-semibold">Total Invites Sent</div>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-center">
          <div className="text-3xl font-extrabold text-emerald-400">{refersData?.total_registered || 0}</div>
          <div className="text-xs text-slate-400 mt-1 font-semibold">Registered</div>
        </div>
      </div>

      {/* Referral Link Card */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Link className="w-4 h-4 text-indigo-400" /> Your Referral Link
        </h2>
        <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-800 border border-slate-700">
          <span className="flex-1 text-xs text-slate-300 truncate font-mono">{refersData?.referral_link || '—'}</span>
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shrink-0"
          >
            {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <div className="flex gap-3">
          <button
            onClick={shareWhatsApp}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all"
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </button>
          <button
            onClick={shareTelegram}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all"
          >
            <Send className="w-4 h-4" /> Telegram
          </button>
        </div>
      </div>

      {/* Invite Form — Partners only */}
      {!isTeamMember && (
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-400" /> Invite a Team Member
        </h2>
        <form onSubmit={handleSendInvite} className="space-y-3">
          <input
            type="text"
            placeholder="Name (optional)"
            value={form.name}
            onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors"
          />
          <input
            type="tel"
            placeholder="Mobile Number *"
            value={form.mobile}
            onChange={(e) => setForm(p => ({ ...p, mobile: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors"
          />
          <input
            type="email"
            placeholder="Email Address (optional)"
            value={form.email}
            onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors"
          />

          {sendResult && (
            <div className={`p-3 rounded-xl text-xs font-semibold ${sendResult.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'}`}>
              {sendResult.type === 'success' ? (
                <div className="space-y-2">
                  <div>✅ Invitation sent successfully!</div>
                  {sendResult.data?.whatsapp_link && (
                    <a
                      href={sendResult.data.whatsapp_link}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold w-fit transition-all"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> Open WhatsApp to Send
                    </a>
                  )}
                </div>
              ) : sendResult.message}
            </div>
          )}

          <button
            type="submit"
            disabled={sending || (!form.mobile && !form.email)}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {sending ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending...</>
            ) : (
              <><Send className="w-4 h-4" /> Send Invitation</>
            )}
          </button>
        </form>
      </div>
      )}

      {/* Invites History */}
      {refersData?.invites?.length > 0 && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <h2 className="text-sm font-bold text-slate-200">Invitation History</h2>
          <div className="space-y-2">
            {refersData.invites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800 border border-slate-700">
                <div>
                  <div className="text-sm font-semibold text-slate-200">{inv.recipient_name || 'Unknown'}</div>
                  <div className="text-xs text-slate-400">{inv.recipient_mobile || inv.recipient_email || '—'}</div>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${inv.registered_at ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                    {inv.registered_at ? '✅ Registered' : inv.status || 'Sent'}
                  </span>
                  <div className="text-xs text-slate-500 mt-1">{inv.sent_at ? new Date(inv.sent_at).toLocaleDateString('en-IN') : ''}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

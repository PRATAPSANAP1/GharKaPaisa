import React, { useState, useEffect, useCallback } from 'react';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import api from '../../../services/api';
import {
  MdLink,
  MdSave,
  MdCheckCircle,
  MdErrorOutline,
  MdOpenInNew,
  MdAccountBalance,
  MdAdd,
  MdEdit,
  MdClose,
  MdRefresh
} from 'react-icons/md';

/**
 * Validates that a Direct Process link is a non-empty, well-formed HTTP/HTTPS URL.
 * Rejects javascript:, data:, file:, and other unsafe schemes.
 */
export function validateDirectProcessUrlClient(rawUrl) {
  if (typeof rawUrl !== 'string') {
    return { valid: false, message: 'Please enter a valid Direct Process Link.' };
  }
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return { valid: false, message: 'Direct Process Link is required.' };
  }
  if (/\s/.test(trimmed)) {
    return { valid: false, message: 'Direct Process Link cannot contain spaces.' };
  }
  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch (_) {
    return { valid: false, message: 'Please enter a valid URL (e.g. https://bank.example.com/apply).' };
  }
  const protocol = String(parsed.protocol || '').toLowerCase();
  if (protocol !== 'http:' && protocol !== 'https:') {
    return { valid: false, message: 'Only http:// and https:// URLs are supported.' };
  }
  const hostname = String(parsed.hostname || '').trim().toLowerCase();
  if (!hostname || (!hostname.includes('.') && hostname !== 'localhost')) {
    return { valid: false, message: 'Please enter a valid URL with a complete domain name.' };
  }
  return { valid: true, url: trimmed };
}

export default function ManageLinks() {
  const { C, isDark } = useTheme();
  const S = makeS(C);

  // Existing System Settings Links state
  const [settings, setSettings] = useState({
    sbi_cc_digital_journey_link: 'https://www.sbicard.com/sprint/',
    hdfc_fd_wes_cc_link: 'https://applyonline.hdfcbank.com/credit-cards.html',
    digital_journey_link: 'https://www.sbicard.com/sprint/'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Bank-Specific Direct Process Link Management state
  const [banks, setBanks] = useState([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [banksError, setBanksError] = useState('');
  const [configuredBankLinks, setConfiguredBankLinks] = useState([]);
  const [linksLoading, setLinksLoading] = useState(true);

  // Modal / Form state for Bank-Specific Direct Process Link
  const [showBankLinkForm, setShowBankLinkForm] = useState(false);
  const [selectedBankId, setSelectedBankId] = useState('');
  const [directProcessLink, setDirectProcessLink] = useState('');
  const [fetchingBankConfig, setFetchingBankConfig] = useState(false);
  const [savingBankLink, setSavingBankLink] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const showToast = useCallback((type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings');
      const data = res.data?.data || res.data || {};
      setSettings(prev => ({
        ...prev,
        sbi_cc_digital_journey_link: data.sbi_cc_digital_journey_link || data.digital_journey_link || prev.sbi_cc_digital_journey_link,
        hdfc_fd_wes_cc_link: data.hdfc_fd_wes_cc_link || prev.hdfc_fd_wes_cc_link,
        digital_journey_link: data.digital_journey_link || prev.digital_journey_link
      }));
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      showToast('error', 'Failed to load link settings');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const fetchActiveBanks = useCallback(async () => {
    setBanksLoading(true);
    setBanksError('');
    try {
      const res = await api.get('/banks', { params: { status: 'Active', limit: 200 } });
      const rawList = res.data?.data || res.data?.items || (Array.isArray(res.data) ? res.data : []);
      const activeList = (Array.isArray(rawList) ? rawList : []).filter(
        b => b && b.id && b.is_active !== false && String(b.status || 'Active').toLowerCase() !== 'inactive'
      );
      setBanks(activeList);
    } catch (err) {
      try {
        const fallbackRes = await api.get('/banks/active');
        const fallbackList = fallbackRes.data?.data || [];
        setBanks(
          (Array.isArray(fallbackList) ? fallbackList : []).map(b => ({
            ...b,
            name: b.name || b.bank_name
          }))
        );
      } catch (fallbackErr) {
        console.error('Failed to load active banks:', fallbackErr);
        setBanksError(fallbackErr.response?.data?.message || 'Failed to load active banks from server.');
      }
    } finally {
      setBanksLoading(false);
    }
  }, []);

  const fetchConfiguredBankLinks = useCallback(async () => {
    setLinksLoading(true);
    try {
      const res = await api.get('/settings/bank-direct-links');
      const list = res.data?.data || [];
      setConfiguredBankLinks(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to fetch configured bank direct process links:', err);
    } finally {
      setLinksLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchActiveBanks();
    fetchConfiguredBankLinks();
  }, [fetchSettings, fetchActiveBanks, fetchConfiguredBankLinks]);

  // When Super Admin selects a bank in the dropdown, load its existing Direct Process link if one exists
  const handleSelectBankChange = async (newBankId) => {
    setSelectedBankId(newBankId);
    setFormError('');
    setFormSuccess('');

    if (!newBankId) {
      setDirectProcessLink('');
      return;
    }

    // Immediate lookup from already-loaded configurations
    const existingLocal = configuredBankLinks.find(item => String(item.bank_id) === String(newBankId));
    if (existingLocal && existingLocal.direct_process_link) {
      setDirectProcessLink(existingLocal.direct_process_link);
    } else {
      setDirectProcessLink('');
    }

    // Authoritative check from backend for the selected bank
    setFetchingBankConfig(true);
    try {
      const res = await api.get(`/settings/bank-direct-links/${newBankId}`);
      const serverLink = res.data?.data?.direct_process_link || '';
      setDirectProcessLink(serverLink);
    } catch (_) {
      // Keep local state if endpoint check fails transiently
    } finally {
      setFetchingBankConfig(false);
    }
  };

  const handleOpenBankLinkModal = (prefillBankId = '', prefillUrl = '') => {
    setFormError('');
    setFormSuccess('');
    setShowBankLinkForm(true);
    if (prefillBankId) {
      setSelectedBankId(prefillBankId);
      setDirectProcessLink(prefillUrl || '');
    } else {
      setSelectedBankId('');
      setDirectProcessLink('');
    }
  };

  const handleCloseBankLinkModal = () => {
    if (savingBankLink) return;
    setShowBankLinkLinkModalStateReset();
  };

  const setShowBankLinkLinkModalStateReset = () => {
    setShowBankLinkForm(false);
    setSelectedBankId('');
    setDirectProcessLink('');
    setFormError('');
    setFormSuccess('');
  };

  const handleSaveBankDirectLink = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (savingBankLink) return;

    setFormError('');
    setFormSuccess('');

    const cleanBankId = String(selectedBankId || '').trim();
    if (!cleanBankId) {
      setFormError('Please select a bank from the dropdown.');
      return;
    }

    const urlValidation = validateDirectProcessUrlClient(directProcessLink);
    if (!urlValidation.valid) {
      setFormError(urlValidation.message);
      return;
    }

    setSavingBankLink(true);
    try {
      const isExisting = configuredBankLinks.some(item => String(item.bank_id) === cleanBankId);
      const res = isExisting
        ? await api.put(`/settings/bank-direct-links/${cleanBankId}`, {
            bank_id: cleanBankId,
            direct_process_link: urlValidation.url
          })
        : await api.post('/settings/bank-direct-links', {
            bank_id: cleanBankId,
            direct_process_link: urlValidation.url
          });

      const savedMsg = res.data?.message || 'Bank Direct Process link saved successfully!';
      setDirectProcessLink(urlValidation.url);
      setFormSuccess(savedMsg);
      showToast('success', savedMsg);

      await Promise.all([fetchConfiguredBankLinks(), fetchActiveBanks()]);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to save Direct Process link. Please try again.';
      setFormError(errMsg);
      showToast('error', errMsg);
    } finally {
      setSavingBankLink(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...settings,
        digital_journey_link: settings.sbi_cc_digital_journey_link
      };
      await api.post('/settings', { settings: payload });
      showToast('success', 'All link settings updated successfully!');
    } catch (err) {
      console.error('Failed to save link settings:', err);
      showToast('error', err.response?.data?.message || 'Failed to save link settings');
    } finally {
      setSaving(false);
    }
  };

  const linkConfigs = [
    {
      key: 'sbi_cc_digital_journey_link',
      title: '1. SBI CC Digital Journey Link',
      description: 'External destination URL opened when users click the "SBI CC Digital Journey" quick-action card on the Home Page.',
      placeholder: 'https://www.sbicard.com/sprint/'
    },
    {
      key: 'hdfc_fd_wes_cc_link',
      title: '2. HDFC FD-WES CC Link',
      description: 'External destination URL opened when users click the "HDFC FD-WES CC" quick-action card on the Home Page.',
      placeholder: 'https://applyonline.hdfcbank.com/credit-cards.html'
    }
  ];

  const selectedBankHasExistingLink = Boolean(
    selectedBankId && configuredBankLinks.some(item => String(item.bank_id) === String(selectedBankId))
  );

  return (
    <div style={{ padding: '24px', maxWidth: '960px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: C.text, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MdLink style={{ color: '#6366f1' }} />
            Manage Quick Action & Bank Direct Process Links
          </h1>
          <p style={{ fontSize: '14px', color: C.textMute, marginTop: '6px', marginBottom: 0 }}>
            Configure bank-specific Direct Process application URLs and homepage quick-action redirect links.
          </p>
        </div>

        <button
          type="button"
          data-testid="open-bank-direct-link-modal-btn"
          onClick={() => handleOpenBankLinkModal()}
          style={{
            ...S.btnPrimary,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
          }}
        >
          <MdAdd size={18} />
          Configure Bank Direct Process Link
        </button>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          borderRadius: '10px',
          marginBottom: '20px',
          background: toast.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
          border: `1px solid ${toast.type === 'success' ? '#10b981' : '#ef4444'}`,
          color: toast.type === 'success' ? '#10b981' : '#ef4444',
          fontWeight: 600,
          fontSize: '14px'
        }}>
          {toast.type === 'success' ? <MdCheckCircle size={18} /> : <MdErrorOutline size={18} />}
          {toast.msg}
        </div>
      )}

      {/* Bank-Specific Direct Process Link Modal / Form */}
      {showBankLinkForm && (
        <div
          data-testid="bank-direct-link-modal"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div style={{
            ...S.card,
            width: '100%',
            maxWidth: '540px',
            padding: '28px',
            borderRadius: '18px',
            border: `1px solid ${C.border}`,
            background: C.surface || (isDark ? '#1e293b' : '#ffffff'),
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.28)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(99, 102, 241, 0.12)',
                  color: '#6366f1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <MdAccountBalance size={22} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: C.text }}>
                    {selectedBankHasExistingLink ? 'Update Bank Direct Process Link' : 'Assign Bank Direct Process Link'}
                  </h2>
                  <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: C.textMute }}>
                    Assigned link applies automatically to Direct Process for the selected bank&apos;s products.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseBankLinkModal}
                disabled={savingBankLink}
                aria-label="Close"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: C.textMute,
                  cursor: savingBankLink ? 'not-allowed' : 'pointer',
                  padding: '6px',
                  borderRadius: '8px'
                }}
              >
                <MdClose size={20} />
              </button>
            </div>

            {formError && (
              <div
                role="alert"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  marginBottom: '16px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid #ef4444',
                  color: '#ef4444',
                  fontSize: '13px',
                  fontWeight: 600
                }}
              >
                <MdErrorOutline size={18} />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div
                role="status"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  marginBottom: '16px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid #10b981',
                  color: '#10b981',
                  fontSize: '13px',
                  fontWeight: 600
                }}
              >
                <MdCheckCircle size={18} />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveBankDirectLink}>
              {/* Field 1: Select Bank */}
              <div style={{ marginBottom: '18px' }}>
                <label
                  htmlFor="select-bank-dropdown"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: C.text, marginBottom: '6px' }}
                >
                  Select Bank *
                </label>

                {banksLoading ? (
                  <div style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: `1px solid ${C.border}`,
                    background: isDark ? '#0f172a' : '#f8fafc',
                    color: C.textMute,
                    fontSize: '13px'
                  }}>
                    Loading active banks...
                  </div>
                ) : banksError ? (
                  <div style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid #ef4444',
                    background: 'rgba(239, 68, 68, 0.08)',
                    color: '#ef4444',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}>
                    <span>{banksError}</span>
                    <button
                      type="button"
                      onClick={fetchActiveBanks}
                      style={{
                        background: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <MdRefresh size={14} /> Retry
                    </button>
                  </div>
                ) : banks.length === 0 ? (
                  <div style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: `1px solid ${C.border}`,
                    background: isDark ? '#0f172a' : '#f8fafc',
                    color: C.textMute,
                    fontSize: '13px'
                  }}>
                    No active banks available. Please add or activate a bank first.
                  </div>
                ) : (
                  <select
                    id="select-bank-dropdown"
                    data-testid="select-bank-dropdown"
                    value={selectedBankId}
                    onChange={(e) => handleSelectBankChange(e.target.value)}
                    disabled={savingBankLink}
                    style={{
                      ...S.input,
                      width: '100%',
                      padding: '12px 14px',
                      fontSize: '14px',
                      borderRadius: '10px',
                      border: `1px solid ${C.border}`,
                      background: isDark ? '#0f172a' : '#f8fafc',
                      color: C.text,
                      cursor: savingBankLink ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <option value="">-- Select a Bank --</option>
                    {banks.map((bank) => {
                      const bankLabel = bank.name || bank.bank_name || bank.short_code || 'Bank';
                      const hasLink = configuredBankLinks.some(item => String(item.bank_id) === String(bank.id));
                      return (
                        <option key={bank.id} value={bank.id}>
                          {bankLabel}{hasLink ? ' (Link Configured)' : ''}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              {/* Field 2: Direct Process Link */}
              <div style={{ marginBottom: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label
                    htmlFor="direct-process-link-input"
                    style={{ fontSize: '13px', fontWeight: 700, color: C.text }}
                  >
                    Direct Process Link *
                  </label>
                  {fetchingBankConfig && (
                    <span style={{ fontSize: '11.5px', color: C.textMute }}>
                      Loading existing link...
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    id="direct-process-link-input"
                    data-testid="direct-process-link-input"
                    type="url"
                    value={directProcessLink}
                    onChange={(e) => {
                      setDirectProcessLink(e.target.value);
                      if (formError) setFormError('');
                    }}
                    placeholder="https://bank.example.com/apply"
                    disabled={savingBankLink || banksLoading || banks.length === 0}
                    style={{
                      ...S.input,
                      flex: 1,
                      padding: '12px 14px',
                      fontSize: '14px',
                      borderRadius: '10px',
                      border: `1px solid ${C.border}`,
                      background: isDark ? '#0f172a' : '#f8fafc',
                      color: C.text
                    }}
                  />
                  {directProcessLink && validateDirectProcessUrlClient(directProcessLink).valid && (
                    <a
                      href={directProcessLink.trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Test Direct Process Link"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '11px 14px',
                        borderRadius: '10px',
                        background: isDark ? '#334155' : '#e2e8f0',
                        color: C.text,
                        textDecoration: 'none',
                        fontSize: '13px',
                        fontWeight: 600,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <MdOpenInNew size={16} /> Test
                    </a>
                  )}
                </div>
                <p style={{ margin: '6px 0 0', fontSize: '12px', color: C.textMute }}>
                  Enter a valid <code>http://</code> or <code>https://</code> application URL. When a user selects Direct Process on any product belonging to this bank, this URL will be used.
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  data-testid="cancel-bank-direct-link-btn"
                  onClick={handleCloseBankLinkModal}
                  disabled={savingBankLink}
                  style={{
                    padding: '11px 18px',
                    borderRadius: '10px',
                    border: `1px solid ${C.border}`,
                    background: 'transparent',
                    color: C.text,
                    fontSize: '13.5px',
                    fontWeight: 700,
                    cursor: savingBankLink ? 'not-allowed' : 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="save-bank-direct-link-btn"
                  disabled={savingBankLink || banksLoading || banks.length === 0}
                  style={{
                    ...S.btnPrimary,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '11px 22px',
                    borderRadius: '10px',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    color: '#fff',
                    border: 'none',
                    cursor: savingBankLink || banksLoading || banks.length === 0 ? 'not-allowed' : 'pointer',
                    opacity: savingBankLink || banksLoading || banks.length === 0 ? 0.7 : 1
                  }}
                >
                  <MdSave size={17} />
                  {savingBankLink
                    ? 'Saving...'
                    : selectedBankHasExistingLink
                    ? 'Update Link'
                    : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bank-Specific Direct Process Links Section */}
      <div style={{
        ...S.card,
        padding: '24px',
        borderRadius: '16px',
        border: `1px solid ${C.border}`,
        background: C.surface,
        marginBottom: '28px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: 800, color: C.text, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MdAccountBalance style={{ color: '#6366f1' }} />
              Bank-Specific Direct Process Links
            </h2>
            <p style={{ fontSize: '13px', color: C.textMute, margin: '4px 0 0' }}>
              Assign a Direct Process URL to a bank so all products under that bank open the configured link when Direct Process is chosen.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleOpenBankLinkModal()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 14px',
              borderRadius: '10px',
              border: `1px solid ${C.border}`,
              background: isDark ? '#1e293b' : '#f8fafc',
              color: C.text,
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <MdAdd size={16} />
            Select Bank &amp; Assign Link
          </button>
        </div>

        {linksLoading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: C.textMute, fontSize: '13.5px' }}>
            Loading configured bank Direct Process links...
          </div>
        ) : configuredBankLinks.length === 0 ? (
          <div style={{
            padding: '24px',
            textAlign: 'center',
            borderRadius: '12px',
            border: `1px dashed ${C.border}`,
            background: isDark ? 'rgba(15, 23, 42, 0.4)' : '#f8fafc',
            color: C.textMute,
            fontSize: '13.5px'
          }}>
            No bank-specific Direct Process links configured yet. Click <strong>Configure Bank Direct Process Link</strong> above to assign one.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}`, textAlign: 'left', color: C.textMute, fontSize: '12px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 12px' }}>Bank</th>
                  <th style={{ padding: '10px 12px' }}>Direct Process Link</th>
                  <th style={{ padding: '10px 12px' }}>Last Updated</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {configuredBankLinks.map((row) => (
                  <tr key={row.id || row.bank_id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '12px', fontWeight: 700, color: C.text, whiteSpace: 'nowrap' }}>
                      {row.bank_name}
                      {row.bank_short_code ? (
                        <span style={{
                          marginLeft: '8px',
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: '6px',
                          background: 'rgba(99, 102, 241, 0.12)',
                          color: '#6366f1'
                        }}>
                          {row.bank_short_code}
                        </span>
                      ) : null}
                    </td>
                    <td style={{ padding: '12px', maxWidth: '380px', wordBreak: 'break-all' }}>
                      <a
                        href={row.direct_process_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 600 }}
                      >
                        {row.direct_process_link}
                      </a>
                    </td>
                    <td style={{ padding: '12px', color: C.textMute, fontSize: '12.5px', whiteSpace: 'nowrap' }}>
                      {row.updated_at ? new Date(row.updated_at).toLocaleString() : '—'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                        <a
                          href={row.direct_process_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            background: isDark ? '#334155' : '#e2e8f0',
                            color: C.text,
                            textDecoration: 'none',
                            fontSize: '12px',
                            fontWeight: 600
                          }}
                        >
                          <MdOpenInNew size={14} /> Open
                        </a>
                        <button
                          type="button"
                          onClick={() => handleOpenBankLinkModal(row.bank_id, row.direct_process_link)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: `1px solid ${C.border}`,
                            background: 'transparent',
                            color: C.text,
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          <MdEdit size={14} /> Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Existing Quick Action Links Form */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: C.textMute }}>
          Loading link configurations...
        </div>
      ) : (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {linkConfigs.map((item) => (
            <div
              key={item.key}
              style={{
                ...S.card,
                padding: '24px',
                borderRadius: '16px',
                border: `1px solid ${C.border}`,
                background: C.surface
              }}
            >
              <label style={{ display: 'block', fontSize: '16px', fontWeight: 700, color: C.text, marginBottom: '6px' }}>
                {item.title}
              </label>
              <p style={{ fontSize: '13px', color: C.textMute, marginBottom: '16px', marginTop: 0 }}>
                {item.description}
              </p>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input
                  type="url"
                  value={settings[item.key] || ''}
                  onChange={(e) => setSettings({ ...settings, [item.key]: e.target.value })}
                  placeholder={item.placeholder}
                  required
                  style={{
                    ...S.input,
                    flex: 1,
                    padding: '12px 16px',
                    fontSize: '14px',
                    borderRadius: '10px',
                    border: `1px solid ${C.border}`,
                    background: isDark ? '#0f172a' : '#f8fafc',
                    color: C.text
                  }}
                />
                {settings[item.key] && (
                  <a
                    href={settings[item.key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Test Link"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '11px 14px',
                      borderRadius: '10px',
                      background: isDark ? '#334155' : '#e2e8f0',
                      color: C.text,
                      textDecoration: 'none',
                      fontSize: '13px',
                      fontWeight: 600
                    }}
                  >
                    <MdOpenInNew size={16} /> Test
                  </a>
                )}
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                ...S.btnPrimary,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 28px',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: '#fff',
                border: 'none',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1
              }}
            >
              <MdSave size={18} />
              {saving ? 'Saving Changes...' : 'Save Links'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

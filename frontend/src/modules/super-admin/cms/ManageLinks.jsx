import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import {
  FaExternalLinkAlt,
  FaCopy,
  FaCheck,
  FaUndo,
  FaSave,
  FaSync,
  FaLink,
  FaCreditCard,
  FaShieldAlt,
  FaInfoCircle
} from 'react-icons/fa';

export const DEFAULT_SBI_CC_DIGITAL_JOURNEY_URL = 'https://www.sbicard.com/corecards/?CHN=OMLG&GEMID1=SEP1&GEMID2=YOH01';
export const DEFAULT_HDFC_FD_WES_CC_URL = 'https://pixel.hdfc.bank.in/pixel-onboard/landing/?flow=FDLien&sourcing.assist.channelCode=DSA&sourcing.assist.branchCode=XYOH&sourcing.assist.employeeCode=S54558&sourcing.assist.dsaCode=XYOH&sourcing.assist.lgCode=GHAR01&sourcing.assist.lc1Code=GHAR01&sourcing.assist.lc2Code=GHAR01&sourcing.assist.smCode=S54558';

const ManageLinks = () => {
  const { theme, C } = useTheme();
  const S = makeS(C);

  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);
  const [savingAll, setSavingAll] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const [toast, setToast] = useState(null);

  // Form states
  const [sbiLink, setSbiLink] = useState(DEFAULT_SBI_CC_DIGITAL_JOURNEY_URL);
  const [hdfcLink, setHdfcLink] = useState(DEFAULT_HDFC_FD_WES_CC_URL);
  const [globalDigitalLink, setGlobalDigitalLink] = useState('');

  // Initial loaded snapshot to detect changes
  const [initialData, setInitialData] = useState({
    sbiLink: DEFAULT_SBI_CC_DIGITAL_JOURNEY_URL,
    hdfcLink: DEFAULT_HDFC_FD_WES_CC_URL,
    globalDigitalLink: ''
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings');
      if (res.data?.success && res.data?.data) {
        const data = res.data.data;
        const loadedSbi = data.sbi_cc_digital_journey_link || DEFAULT_SBI_CC_DIGITAL_JOURNEY_URL;
        const loadedHdfc = data.hdfc_fd_wes_cc_link || DEFAULT_HDFC_FD_WES_CC_URL;
        const loadedGlobal = data.digital_journey_link || '';

        setSbiLink(loadedSbi);
        setHdfcLink(loadedHdfc);
        setGlobalDigitalLink(loadedGlobal);

        setInitialData({
          sbiLink: loadedSbi,
          hdfcLink: loadedHdfc,
          globalDigitalLink: loadedGlobal
        });
      }
    } catch (err) {
      console.error('Failed to fetch link settings:', err);
      showToast('Failed to load current link settings from server', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast('Link copied to clipboard!');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTestLink = (url) => {
    if (!url || !url.trim()) {
      showToast('Please enter a valid link first', 'error');
      return;
    }
    let target = url.trim();
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = 'https://' + target;
    }
    window.open(target, '_blank', 'noopener,noreferrer');
  };

  const handleSaveSingle = async (key, value, name) => {
    if (!value || !value.trim()) {
      showToast(`Please enter a valid URL for ${name}`, 'error');
      return;
    }
    setSavingKey(key);
    try {
      const res = await api.post('/settings', {
        key,
        value: value.trim()
      });
      if (res.data?.success) {
        showToast(`${name} updated successfully!`);
        setInitialData(prev => ({
          ...prev,
          [key === 'sbi_cc_digital_journey_link' ? 'sbiLink' : key === 'hdfc_fd_wes_cc_link' ? 'hdfcLink' : 'globalDigitalLink']: value.trim()
        }));
      } else {
        throw new Error(res.data?.message || 'Update failed');
      }
    } catch (err) {
      console.error(`Failed to save ${key}:`, err);
      showToast(err.response?.data?.message || `Failed to update ${name}`, 'error');
    } finally {
      setSavingKey(null);
    }
  };

  const handleSaveAll = async () => {
    setSavingAll(true);
    try {
      const res = await api.post('/settings', {
        settings: {
          sbi_cc_digital_journey_link: sbiLink.trim(),
          hdfc_fd_wes_cc_link: hdfcLink.trim(),
          digital_journey_link: globalDigitalLink.trim()
        }
      });
      if (res.data?.success) {
        showToast('All link configurations saved successfully!');
        setInitialData({
          sbiLink: sbiLink.trim(),
          hdfcLink: hdfcLink.trim(),
          globalDigitalLink: globalDigitalLink.trim()
        });
      } else {
        throw new Error(res.data?.message || 'Failed to save all settings');
      }
    } catch (err) {
      console.error('Failed to save all link configurations:', err);
      showToast(err.response?.data?.message || 'Failed to save link settings', 'error');
    } finally {
      setSavingAll(false);
    }
  };

  const isDirty = (
    sbiLink !== initialData.sbiLink ||
    hdfcLink !== initialData.hdfcLink ||
    globalDigitalLink !== initialData.globalDigitalLink
  );

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', color: C.text }}>
      {/* Toast Alert */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 99999,
          padding: '12px 20px',
          borderRadius: '10px',
          background: toast.type === 'error' ? '#ef4444' : '#10b981',
          color: '#ffffff',
          fontWeight: 700,
          fontSize: '14px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          {toast.type === 'error' ? '⚠️' : '✅'} {toast.message}
        </div>
      )}

      {/* Header Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: `${C.teal}15`,
              color: C.teal,
              padding: '10px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FaLink size={20} />
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: C.text }}>
                Link Management
              </h1>
              <p style={{ fontSize: '13.5px', color: C.textMid, margin: '4px 0 0 0' }}>
                Manage and update official bank portal redirect links for Remark Form buttons across the platform.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={fetchSettings}
            disabled={loading}
            style={{
              ...S.btn('outline'),
              padding: '9px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px'
            }}
          >
            <FaSync className={loading ? 'animate-spin' : ''} size={13} /> Refresh
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={savingAll || loading || !isDirty}
            style={{
              ...S.btn('primary'),
              padding: '9px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              opacity: (!isDirty && !savingAll) ? 0.6 : 1,
              cursor: (!isDirty && !savingAll) ? 'not-allowed' : 'pointer'
            }}
          >
            <FaSave size={14} /> {savingAll ? 'Saving All...' : 'Save All Changes'}
          </button>
        </div>
      </div>

      {/* Info Notice Box */}
      <div style={{
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '12px',
        padding: '14px 18px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        color: '#1e40af'
      }}>
        <FaInfoCircle size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#2563eb' }} />
        <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
          <strong>How this works:</strong> Changes made here immediately update the destination URLs opened when operators click buttons in the Application Remark Form. When an operator clicks <strong>"Digital Complete Journey"</strong> (for SBI Bank) or <strong>"FD wes CC link"</strong> (for HDFC Bank), they will be redirected to the exact URLs configured below.
        </div>
      </div>

      {/* Links Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* ── CARD 1: SBI Credit Card Digital Complete Journey ── */}
        <div style={{
          ...S.card,
          border: '1px solid #e2e8f0',
          borderRadius: '14px',
          padding: '20px',
          boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
          background: C.card
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                background: '#dbeafe',
                color: '#1e40af',
                fontSize: '11px',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: '6px',
                textTransform: 'uppercase'
              }}>
                SBI Bank Credit Card
              </span>
              <span style={{
                background: '#f1f5f9',
                color: '#475569',
                fontSize: '11px',
                fontWeight: 700,
                padding: '4px 8px',
                borderRadius: '6px'
              }}>
                Button: Digital Complete Journey
              </span>
            </div>

            <span style={{ fontSize: '11.5px', color: C.textLight }}>
              Setting Key: <code>sbi_cc_digital_journey_link</code>
            </span>
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 6px 0', color: C.text }}>
            SBI Credit Card — Digital Complete Journey Portal Link
          </h3>
          <p style={{ fontSize: '12.5px', color: C.textMid, margin: '0 0 14px 0' }}>
            Controls the URL opened by the blue <strong>"Digital Complete Journey"</strong> button in the SBI Credit Card remark form header.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="url"
                value={sbiLink}
                onChange={(e) => setSbiLink(e.target.value)}
                placeholder="https://www.sbicard.com/..."
                style={{
                  ...S.input,
                  width: '100%',
                  padding: '11px 14px',
                  fontSize: '13px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  color: C.text,
                  background: C.inputBg,
                  fontFamily: 'monospace'
                }}
              />
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
              fontSize: '11.5px',
              color: C.textMid
            }}>
              <div>
                Default: <span style={{ fontFamily: 'monospace', color: '#2563eb' }}>{DEFAULT_SBI_CC_DIGITAL_JOURNEY_URL}</span>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setSbiLink(DEFAULT_SBI_CC_DIGITAL_JOURNEY_URL)}
                  title="Reset to default official SBI link"
                  style={{
                    ...S.btn('outline'),
                    padding: '6px 12px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <FaUndo size={11} /> Reset Default
                </button>

                <button
                  type="button"
                  onClick={() => handleCopy(sbiLink, 'sbi')}
                  style={{
                    ...S.btn('outline'),
                    padding: '6px 12px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  {copiedKey === 'sbi' ? <FaCheck size={11} color="#10b981" /> : <FaCopy size={11} />}
                  {copiedKey === 'sbi' ? 'Copied' : 'Copy'}
                </button>

                <button
                  type="button"
                  onClick={() => handleTestLink(sbiLink)}
                  style={{
                    ...S.btn('outline'),
                    padding: '6px 12px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    color: '#2563eb',
                    borderColor: '#93c5fd'
                  }}
                >
                  <FaExternalLinkAlt size={11} /> Test Link ↗
                </button>

                <button
                  type="button"
                  disabled={savingKey === 'sbi_cc_digital_journey_link'}
                  onClick={() => handleSaveSingle('sbi_cc_digital_journey_link', sbiLink, 'SBI Digital Journey Link')}
                  style={{
                    ...S.btn('primary'),
                    padding: '6px 16px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <FaSave size={11} /> {savingKey === 'sbi_cc_digital_journey_link' ? 'Saving...' : 'Save Link'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── CARD 2: HDFC Bank Credit Card FD wes CC link ── */}
        <div style={{
          ...S.card,
          border: '1px solid #e2e8f0',
          borderRadius: '14px',
          padding: '20px',
          boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
          background: C.card
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                background: '#e0f2fe',
                color: '#0369a1',
                fontSize: '11px',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: '6px',
                textTransform: 'uppercase'
              }}>
                HDFC Bank Credit Card
              </span>
              <span style={{
                background: '#f1f5f9',
                color: '#475569',
                fontSize: '11px',
                fontWeight: 700,
                padding: '4px 8px',
                borderRadius: '6px'
              }}>
                Button: FD wes CC link
              </span>
            </div>

            <span style={{ fontSize: '11.5px', color: C.textLight }}>
              Setting Key: <code>hdfc_fd_wes_cc_link</code>
            </span>
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 6px 0', color: C.text }}>
            HDFC Credit Card — FD wes CC Portal Link
          </h3>
          <p style={{ fontSize: '12.5px', color: C.textMid, margin: '0 0 14px 0' }}>
            Controls the URL opened by the <strong>"FD wes CC link"</strong> button in the HDFC Bank Credit Card remark form header.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="url"
                value={hdfcLink}
                onChange={(e) => setHdfcLink(e.target.value)}
                placeholder="https://pixel.hdfc.bank.in/pixel-onboard/landing/?flow=FDLien..."
                style={{
                  ...S.input,
                  width: '100%',
                  padding: '11px 14px',
                  fontSize: '13px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  color: C.text,
                  background: C.inputBg,
                  fontFamily: 'monospace'
                }}
              />
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
              fontSize: '11.5px',
              color: C.textMid
            }}>
              <div style={{ maxWidth: '600px', wordBreak: 'break-all' }}>
                Default: <span style={{ fontFamily: 'monospace', color: '#0369a1' }}>{DEFAULT_HDFC_FD_WES_CC_URL}</span>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setHdfcLink(DEFAULT_HDFC_FD_WES_CC_URL)}
                  title="Reset to default official HDFC FD wes CC link"
                  style={{
                    ...S.btn('outline'),
                    padding: '6px 12px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <FaUndo size={11} /> Reset Default
                </button>

                <button
                  type="button"
                  onClick={() => handleCopy(hdfcLink, 'hdfc')}
                  style={{
                    ...S.btn('outline'),
                    padding: '6px 12px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  {copiedKey === 'hdfc' ? <FaCheck size={11} color="#10b981" /> : <FaCopy size={11} />}
                  {copiedKey === 'hdfc' ? 'Copied' : 'Copy'}
                </button>

                <button
                  type="button"
                  onClick={() => handleTestLink(hdfcLink)}
                  style={{
                    ...S.btn('outline'),
                    padding: '6px 12px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    color: '#0284c7',
                    borderColor: '#7dd3fc'
                  }}
                >
                  <FaExternalLinkAlt size={11} /> Test Link ↗
                </button>

                <button
                  type="button"
                  disabled={savingKey === 'hdfc_fd_wes_cc_link'}
                  onClick={() => handleSaveSingle('hdfc_fd_wes_cc_link', hdfcLink, 'HDFC FD wes CC Link')}
                  style={{
                    ...S.btn('primary'),
                    padding: '6px 16px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <FaSave size={11} /> {savingKey === 'hdfc_fd_wes_cc_link' ? 'Saving...' : 'Save Link'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── CARD 3: Global / Fallback Digital Complete Journey Link ── */}
        <div style={{
          ...S.card,
          border: '1px solid #e2e8f0',
          borderRadius: '14px',
          padding: '20px',
          boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
          background: C.card
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                background: '#f3e8ff',
                color: '#7e22ce',
                fontSize: '11px',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: '6px',
                textTransform: 'uppercase'
              }}>
                Platform Global Fallback
              </span>
              <span style={{
                background: '#f1f5f9',
                color: '#475569',
                fontSize: '11px',
                fontWeight: 700,
                padding: '4px 8px',
                borderRadius: '6px'
              }}>
                Button: Digital Complete Journey (General)
              </span>
            </div>

            <span style={{ fontSize: '11.5px', color: C.textLight }}>
              Setting Key: <code>digital_journey_link</code>
            </span>
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 6px 0', color: C.text }}>
            Default / Fallback Digital Complete Journey URL
          </h3>
          <p style={{ fontSize: '12.5px', color: C.textMid, margin: '0 0 14px 0' }}>
            Used across the platform for other banks and non-SBI credit card products when no application-specific URL is provided.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="url"
                value={globalDigitalLink}
                onChange={(e) => setGlobalDigitalLink(e.target.value)}
                placeholder="e.g. https://partner-portal.com/complete-journey"
                style={{
                  ...S.input,
                  width: '100%',
                  padding: '11px 14px',
                  fontSize: '13px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  color: C.text,
                  background: C.inputBg,
                  fontFamily: 'monospace'
                }}
              />
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
              fontSize: '11.5px'
            }}>
              {globalDigitalLink && (
                <button
                  type="button"
                  onClick={() => handleCopy(globalDigitalLink, 'global')}
                  style={{
                    ...S.btn('outline'),
                    padding: '6px 12px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  {copiedKey === 'global' ? <FaCheck size={11} color="#10b981" /> : <FaCopy size={11} />}
                  {copiedKey === 'global' ? 'Copied' : 'Copy'}
                </button>
              )}

              {globalDigitalLink && (
                <button
                  type="button"
                  onClick={() => handleTestLink(globalDigitalLink)}
                  style={{
                    ...S.btn('outline'),
                    padding: '6px 12px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    color: '#7e22ce',
                    borderColor: '#d8b4fe'
                  }}
                >
                  <FaExternalLinkAlt size={11} /> Test Link ↗
                </button>
              )}

              <button
                type="button"
                disabled={savingKey === 'digital_journey_link'}
                onClick={() => handleSaveSingle('digital_journey_link', globalDigitalLink, 'Default Digital Journey Link')}
                style={{
                  ...S.btn('primary'),
                  padding: '6px 16px',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <FaSave size={11} /> {savingKey === 'digital_journey_link' ? 'Saving...' : 'Save Link'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ManageLinks;

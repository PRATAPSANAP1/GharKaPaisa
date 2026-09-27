import React, { useState, useEffect } from 'react';
import { 
  FaWhatsapp, FaTimes, FaPaperPlane, FaFileAlt, FaCheckCircle, 
  FaExclamationTriangle, FaEye, FaUser, FaPhone, FaShieldAlt
} from 'react-icons/fa';
import api from '../../services/api';
import { useAuthStore } from '../../app/store/authStore';

export default function SendWhatsAppModal({
  isOpen,
  onClose,
  recipientMobile = '',
  recipientName = '',
  applicationId = null,
  leadId = null,
  customerId = null,
  initialTemplateCategory = null,
  onSuccess = null
}) {
  const { user } = useAuthStore();
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [variables, setVariables] = useState({});
  const [mobile, setMobile] = useState(recipientMobile);
  const [name, setName] = useState(recipientName);
  const [sending, setSending] = useState(false);
  const [successResult, setSuccessResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setMobile(recipientMobile || '');
      setName(recipientName || '');
      setSuccessResult(null);
      setErrorMsg(null);
      fetchTemplates();
    }
  }, [isOpen, recipientMobile, recipientName]);

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await api.get('/whatsapp/templates');
      if (res.data?.success) {
        const tpls = res.data.data || [];
        setTemplates(tpls);

        // Auto select first matching or default template
        if (tpls.length > 0) {
          let defaultTpl = tpls[0];
          if (initialTemplateCategory) {
            const match = tpls.find(t => t.template_category === initialTemplateCategory);
            if (match) defaultTpl = match;
          }
          handleSelectTemplate(defaultTpl);
        }
      }
    } catch (err) {
      console.error('Failed to load WhatsApp templates:', err);
      setErrorMsg('Failed to load templates. Please try again.');
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleSelectTemplate = (tpl) => {
    setSelectedTemplate(tpl);
    const initialVars = {};
    const tplVars = Array.isArray(tpl.variables) ? tpl.variables : [];
    
    tplVars.forEach(v => {
      if (v === 'customer_name') initialVars[v] = name || recipientName || 'Customer';
      else if (v === 'application_id') initialVars[v] = applicationId || 'N/A';
      else if (v === 'document_name') initialVars[v] = 'Required Documents';
      else if (v === 'status') initialVars[v] = 'Under Review';
      else initialVars[v] = tpl.sample_values?.[v] || '';
    });
    setVariables(initialVars);
  };

  const handleVariableChange = (varKey, val) => {
    setVariables(prev => ({ ...prev, [varKey]: val }));
  };

  const renderPreviewText = () => {
    if (!selectedTemplate) return '';
    let text = selectedTemplate.body || '';
    for (const [k, v] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${k}\\s*}}`, 'gi');
      text = text.replace(regex, v || `[${k}]`);
    }
    return text;
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!mobile.trim()) {
      setErrorMsg('Please enter a valid recipient mobile number.');
      return;
    }
    if (!selectedTemplate) {
      setErrorMsg('Please select an approved template.');
      return;
    }

    setSending(true);
    setErrorMsg(null);

    try {
      const payload = {
        template_name: selectedTemplate.template_name,
        recipient_mobile: mobile.trim(),
        recipient_name: name.trim() || 'Customer',
        recipient_type: 'CUSTOMER',
        variables: variables,
        application_id: applicationId,
        lead_id: leadId,
        customer_id: customerId
      };

      const res = await api.post('/whatsapp/send-template', payload);
      if (res.data?.success) {
        setSuccessResult(res.data.data);
        if (onSuccess) onSuccess(res.data.data);
      }
    } catch (err) {
      console.error('Send WhatsApp failed:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to dispatch WhatsApp message.');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px'
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: '18px',
        width: '100%',
        maxWidth: '720px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Inter', sans-serif"
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '18px 24px',
          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTopLeftRadius: '18px',
          borderTopRightRadius: '18px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px', color: '#FFFFFF'
            }}>
              <FaWhatsapp />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, letterSpacing: '-0.2px' }}>
                Send Official WhatsApp Message
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.85)' }}>
                Official GharKaPaisa Business Channel • Audited & Logged
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: '#FFFFFF',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <FaTimes />
          </button>
        </div>

        {/* Modal Content Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Sender Identity Attribution Badge */}
          <div style={{
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: '12px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12.5px',
            color: '#166534'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaShieldAlt size={14} color="#15803D" />
              <span>
                Sending as <strong>GharKaPaisa Official</strong> (Initiated by {user?.full_name || 'Staff'} - {user?.designation || user?.role})
              </span>
            </div>
            <span style={{ fontSize: '11px', background: '#DCFCE7', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
              Audit Logged
            </span>
          </div>

          {errorMsg && (
            <div style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#991B1B',
              padding: '12px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FaExclamationTriangle color="#DC2626" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successResult ? (
            <div style={{
              padding: '30px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                background: '#DCFCE7', color: '#16A34A',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '28px'
              }}>
                <FaCheckCircle />
              </div>
              <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
                WhatsApp Message Dispatched!
              </h4>
              <p style={{ margin: 0, fontSize: '13.5px', color: '#64748B', maxWidth: '420px' }}>
                Message <strong>{successResult.message_uuid}</strong> sent to <strong>{successResult.recipient_mobile}</strong> using template <strong>{successResult.template_name}</strong>.
              </p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button
                  onClick={() => { setSuccessResult(null); onClose(); }}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '10px',
                    background: '#059669',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Recipient Details Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Recipient Name
                  </label>
                  <div style={{
                    display: 'flex', alignItems: 'center', background: '#F8FAFC',
                    border: '1px solid #E2E8F0', borderRadius: '10px', padding: '10px 14px'
                  }}>
                    <FaUser color="#94A3B8" size={13} style={{ marginRight: '8px' }} />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        handleVariableChange('customer_name', e.target.value);
                      }}
                      placeholder="Customer Name"
                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '13.5px', fontWeight: 600, color: '#0F172A' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Recipient Mobile Number *
                  </label>
                  <div style={{
                    display: 'flex', alignItems: 'center', background: '#F8FAFC',
                    border: '1px solid #E2E8F0', borderRadius: '10px', padding: '10px 14px'
                  }}>
                    <FaPhone color="#94A3B8" size={13} style={{ marginRight: '8px' }} />
                    <input
                      type="text"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="e.g. 9876543210"
                      required
                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '13.5px', fontWeight: 600, color: '#0F172A' }}
                    />
                  </div>
                </div>
              </div>

              {/* Template Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Select Approved Template *
                </label>
                {loadingTemplates ? (
                  <div style={{ fontSize: '13px', color: '#64748B', padding: '10px' }}>Loading approved templates...</div>
                ) : (
                  <select
                    value={selectedTemplate?.template_name || ''}
                    onChange={(e) => {
                      const found = templates.find(t => t.template_name === e.target.value);
                      if (found) handleSelectTemplate(found);
                    }}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      background: '#FFFFFF',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      color: '#0F172A',
                      outline: 'none'
                    }}
                  >
                    {templates.map(tpl => (
                      <option key={tpl.id} value={tpl.template_name}>
                        [{tpl.template_category.toUpperCase()}] {tpl.template_name.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Dynamic Variables Inputs */}
              {selectedTemplate && selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                <div style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '14px 16px'
                }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#1E293B', marginBottom: '10px' }}>
                    Template Variables
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {selectedTemplate.variables.map(varKey => (
                      <div key={varKey}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'capitalize', marginBottom: '4px' }}>
                          {varKey.replace(/_/g, ' ')}
                        </label>
                        <input
                          type="text"
                          value={variables[varKey] || ''}
                          onChange={(e) => handleVariableChange(varKey, e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid #CBD5E1',
                            fontSize: '13px',
                            outline: 'none',
                            background: '#FFFFFF',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Message Live Preview */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  <FaEye color="#059669" size={13} /> Live WhatsApp Message Preview
                </label>
                <div style={{
                  background: '#ECE5DD',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid #D1D5DB'
                }}>
                  <div style={{
                    background: '#FFFFFF',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    maxWidth: '85%',
                    position: 'relative'
                  }}>
                    <p style={{ margin: '0 0 6px', fontSize: '13.5px', color: '#111827', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                      {renderPreviewText()}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '10.5px', color: '#9CA3AF' }}>
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • GharKaPaisa ✓✓
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={sending}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    background: '#F1F5F9',
                    border: '1px solid #E2E8F0',
                    color: '#475569',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={sending}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '10px',
                    background: '#059669',
                    border: 'none',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)'
                  }}
                >
                  <FaPaperPlane size={12} /> {sending ? 'Sending WhatsApp...' : 'Send WhatsApp'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

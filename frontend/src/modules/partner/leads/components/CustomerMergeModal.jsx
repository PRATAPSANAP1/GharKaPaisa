import React, { useState } from 'react';
import api from '../../../../services/api';
import { useTheme, makeS } from '../../../../contexts/ThemeContext';
import { MdClose, MdMergeType, MdWarning, MdCheckCircle } from 'react-icons/md';

export default function CustomerMergeModal({ customers = [], onClose, onMerged }) {
  const { C } = useTheme();
  const S = makeS(C);

  const [primaryId, setPrimaryId] = useState('');
  const [duplicateId, setDuplicateId] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handleMerge = async () => {
    if (!primaryId || !duplicateId) return alert('Select both primary master record and secondary duplicate record');
    if (primaryId === duplicateId) return alert('Primary and duplicate records must be different');

    if (!window.confirm('Are you sure you want to merge these customer records? All applications, documents, notes, follow-ups, and activity logs from the secondary record will be combined into the master record.')) {
      return;
    }

    setLoading(true);
    setErr('');
    try {
      const res = await api.post('/customers/merge', {
        primary_id: primaryId,
        duplicate_id: duplicateId
      });

      if (res.data?.success) {
        alert('Customer records merged successfully!');
        if (onMerged) onMerged();
        onClose();
      }
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to merge customer records');
    } finally {
      setLoading(false);
    }
  };

  const primaryCust = customers.find(c => c.id === primaryId);
  const dupCust = customers.find(c => c.id === duplicateId);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1100,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '640px',
        background: C.card,
        borderRadius: '20px',
        padding: '28px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MdMergeType style={{ fontSize: '24px', color: C.teal }} />
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: 0 }}>Merge Duplicate Customer Records</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textLight, fontSize: '20px' }}>
            <MdClose />
          </button>
        </div>

        {err && (
          <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid #EF4444', borderRadius: '10px', color: '#EF4444', fontSize: '13px' }}>
            {err}
          </div>
        )}

        {/* Form Selector */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ ...S.label, color: C.green }}>Master Primary Record (Kept)</label>
            <select
              style={S.input}
              value={primaryId}
              onChange={(e) => setPrimaryId(e.target.value)}
            >
              <option value="">Select Master Record...</option>
              {customers.map(c => (
                <option key={`p-${c.id}`} value={c.id}>
                  {c.full_name} ({c.mobile})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ ...S.label, color: C.red }}>Duplicate Record (Merged & Archived)</label>
            <select
              style={S.input}
              value={duplicateId}
              onChange={(e) => setDuplicateId(e.target.value)}
            >
              <option value="">Select Duplicate Record...</option>
              {customers.map(c => (
                <option key={`d-${c.id}`} value={c.id} disabled={c.id === primaryId}>
                  {c.full_name} ({c.mobile})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Side-by-side Diff Preview */}
        {primaryCust && dupCust && (
          <div style={{ background: C.bgSecondary, padding: '16px', borderRadius: '14px', fontSize: '12.5px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 800, color: C.text }}>Merged Output Summary</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontWeight: 700, color: C.green }}>Master Name: {primaryCust.full_name}</div>
                <div>Primary Mobile: {primaryCust.mobile}</div>
                <div>Email: {primaryCust.email || dupCust.email || 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontWeight: 700, color: C.red }}>Merging Secondary: {dupCust.full_name}</div>
                <div>Applications transferred: Combine both records</div>
                <div>Documents & Notes: Preserved in Master Timeline</div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={onClose} style={{ ...S.btn('outline'), padding: '10px 18px' }}>Cancel</button>
          <button onClick={handleMerge} disabled={loading} style={{ ...S.btn('primary'), background: C.teal, padding: '10px 20px' }}>
            {loading ? 'Merging Records...' : 'Execute Merge'}
          </button>
        </div>
      </div>
    </div>
  );
}

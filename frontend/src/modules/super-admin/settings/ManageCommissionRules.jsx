import React, { useState, useEffect } from 'react';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import api from '../../../services/api';

const ManageCommissionRules = () => {
  const { C } = useTheme();
  const S = makeS(C);

  const [rules, setRules] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    productId: '',
    partnerPercentage: 90,
    parentPercentage: 10,
    campaignBonus: 0,
    status: 'active'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rulesRes, productsRes] = await Promise.all([
        api.get('/superadmin/commission-rules'),
        api.get('/public/products')
      ]);
      setRules(rulesRes.data?.data || []);
      setProducts(productsRes.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/superadmin/commission-rules', formData);
      alert('Commission rule created successfully!');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create commission rule');
    } finally {
      setSubmitting(false);
    }
  };

  const thStyle = {
    padding: '12px 18px', fontSize: '11px', fontWeight: 700,
    color: C.textLight, textTransform: 'uppercase', textAlign: 'left',
    borderBottom: `1px solid ${C.border}`
  };
  const tdStyle = { padding: '14px 18px', fontSize: '14px', color: C.text, borderBottom: `1px solid ${C.border}` };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 800, color: C.text, marginBottom: '24px' }}>Commission Rules</h2>
      
      <div style={{ ...S.card, padding: '24px', borderRadius: '16px', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Add New Rule</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={S.label}>Product</label>
            <select 
              style={S.input} 
              required
              value={formData.productId} 
              onChange={e => setFormData({...formData, productId: e.target.value})}
            >
              <option value="">Select Product...</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div style={{ flex: '1 1 120px' }}>
            <label style={S.label}>Partner %</label>
            <input type="number" style={S.input} required min="0" max="100" 
              value={formData.partnerPercentage} 
              onChange={e => setFormData({...formData, partnerPercentage: e.target.value})} 
            />
          </div>
          <div style={{ flex: '1 1 120px' }}>
            <label style={S.label}>Parent %</label>
            <input type="number" style={S.input} required min="0" max="100" 
              value={formData.parentPercentage} 
              onChange={e => setFormData({...formData, parentPercentage: e.target.value})} 
            />
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <button type="submit" disabled={submitting} style={{ ...S.btn('primary'), width: '100%', padding: '12px' }}>
              {submitting ? 'Saving...' : 'Save Rule'}
            </button>
          </div>
        </form>
      </div>

      <div style={{ ...S.card, padding: 0, borderRadius: '16px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: C.textLight }}>Loading rules...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.bgSecondary }}>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Product</th>
                <th style={thStyle}>Partner Split</th>
                <th style={thStyle}>Parent Split</th>
                <th style={thStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {rules.length === 0 ? (
                <tr><td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: C.textLight }}>No rules defined yet.</td></tr>
              ) : (
                rules.map(r => (
                  <tr key={r.id}>
                    <td style={tdStyle}>{new Date(r.created_at).toLocaleDateString()}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{r.product_name || r.product_id}</td>
                    <td style={tdStyle}>{r.partner_percentage}%</td>
                    <td style={tdStyle}>{r.parent_percentage}%</td>
                    <td style={tdStyle}>
                      <span style={S.tag(r.status === 'active' ? C.green : C.red)}>{r.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ManageCommissionRules;

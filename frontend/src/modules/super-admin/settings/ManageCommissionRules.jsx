import React, { useState, useEffect } from 'react';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import api from '../../../services/api';
import { ChevronDown, ChevronRight, Users, Settings, Edit2, Check, X } from 'lucide-react';

const ManageCommissionRules = () => {
  const { C, isDark } = useTheme();
  const S = makeS(C);

  const [activeTab, setActiveTab] = useState('global'); // 'global' or 'partner_hierarchy'
  const [rules, setRules] = useState([]);
  const [products, setProducts] = useState([]);
  const [partnersOverview, setPartnersOverview] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPartners, setExpandedPartners] = useState({});
  const [search, setSearch] = useState('');

  // Edit commission modal / inline state
  const [editingMember, setEditingMember] = useState(null);
  const [newRate, setNewRate] = useState('');
  const [savingRate, setSavingRate] = useState(false);

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
      const [rulesRes, productsRes, overviewRes] = await Promise.all([
        api.get('/superadmin/commission-rules'),
        api.get('/public/products'),
        api.get('/superadmin/partners-commission-overview').catch(() => ({ data: { data: [] } }))
      ]);
      setRules(rulesRes.data?.data || []);
      setProducts(productsRes.data?.data || []);
      setPartnersOverview(overviewRes.data?.data || []);
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

  const togglePartnerExpand = (partnerId) => {
    setExpandedPartners(prev => ({
      ...prev,
      [partnerId]: !prev[partnerId]
    }));
  };

  const handleSaveMemberRate = async (memberId) => {
    const rateNum = parseFloat(newRate);
    if (isNaN(rateNum) || rateNum < 0 || rateNum > 100) {
      alert('Commission percentage must be between 0 and 100');
      return;
    }
    setSavingRate(true);
    try {
      const res = await api.patch(`/team/${memberId}/commission-rate`, { commission_rate: rateNum });
      if (res.data?.success) {
        alert(res.data.message || 'Commission rate updated successfully');
        setEditingMember(null);
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update commission rate');
    } finally {
      setSavingRate(false);
    }
  };

  const thStyle = {
    padding: '12px 18px', fontSize: '11px', fontWeight: 700,
    color: C.textLight, textTransform: 'uppercase', textAlign: 'left',
    borderBottom: `1px solid ${C.border}`
  };
  const tdStyle = { padding: '14px 18px', fontSize: '14px', color: C.text, borderBottom: `1px solid ${C.border}` };

  const filteredPartners = partnersOverview.filter(p => 
    p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.partner_code?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1050px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: C.text, margin: 0 }}>Commission Management</h2>
          <p style={{ fontSize: '13px', color: C.textLight, margin: '4px 0 0 0' }}>Configure product defaults & oversee partner team commission splits</p>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', background: isDark ? '#1a1a1a' : '#f1f5f9', padding: '4px', borderRadius: '12px' }}>
          <button 
            onClick={() => setActiveTab('global')}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
              background: activeTab === 'global' ? C.primary : 'transparent',
              color: activeTab === 'global' ? '#fff' : C.textLight
            }}>
            Product Commission Rules
          </button>
          <button 
            onClick={() => setActiveTab('partner_hierarchy')}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
              background: activeTab === 'partner_hierarchy' ? C.primary : 'transparent',
              color: activeTab === 'partner_hierarchy' ? '#fff' : C.textLight,
              display: 'flex', alignItems: 'center', gap: '6px'
            }}>
            <Users size={15} /> Partner Team Commission Splits
          </button>
        </div>
      </div>

      {activeTab === 'global' ? (
        <>
          <div style={{ ...S.card, padding: '24px', borderRadius: '16px', marginBottom: '32px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Add New Product Default Rule</h3>
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
                <label style={S.label}>Partner Default %</label>
                <input type="number" style={S.input} required min="0" max="100" 
                  value={formData.partnerPercentage} 
                  onChange={e => setFormData({...formData, partnerPercentage: e.target.value})} 
                />
              </div>
              <div style={{ flex: '1 1 120px' }}>
                <label style={S.label}>Parent Partner %</label>
                <input type="number" style={S.input} required min="0" max="100" 
                  value={formData.parentPercentage} 
                  onChange={e => setFormData({...formData, parentPercentage: e.target.value})} 
                />
              </div>
              <div style={{ flex: '1 1 150px' }}>
                <button type="submit" disabled={submitting} style={{ ...S.btn('primary'), width: '100%', padding: '12px' }}>
                  {submitting ? 'Saving...' : 'Save Default Rule'}
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
                    <th style={thStyle}>Partner Default Split</th>
                    <th style={thStyle}>Parent Split</th>
                    <th style={thStyle}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.length === 0 ? (
                    <tr><td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: C.textLight }}>No product rules defined yet.</td></tr>
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
        </>
      ) : (
        /* PARTNER TEAM HIERARCHY OVERVIEW TAB */
        <div>
          <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input 
              type="text"
              placeholder="Search partner name, code or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ ...S.input, maxWidth: '360px' }}
            />
            <span style={{ fontSize: '13px', color: C.textLight }}>
              Showing {filteredPartners.length} Partners
            </span>
          </div>

          <div style={{ ...S.card, padding: 0, borderRadius: '16px', overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '32px', textAlign: 'center', color: C.textLight }}>Loading partner hierarchy...</div>
            ) : filteredPartners.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: C.textLight }}>No partners found.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {filteredPartners.map(p => {
                  const isExpanded = !!expandedPartners[p.id];
                  const hasMembers = p.team_members && p.team_members.length > 0;
                  return (
                    <div key={p.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                      {/* Partner Row */}
                      <div 
                        onClick={() => togglePartnerExpand(p.id)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '16px 20px', background: isExpanded ? (isDark ? '#1a1a1a' : '#f8fafc') : 'transparent',
                          cursor: 'pointer', transition: 'background 0.2s'
                        }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ color: C.primary, display: 'flex' }}>
                            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                          </span>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '14px', color: C.text }}>
                              {p.full_name} <span style={{ fontSize: '12px', fontWeight: 500, color: C.textLight }}>({p.partner_code})</span>
                            </div>
                            <div style={{ fontSize: '12px', color: C.textLight }}>
                              {p.email} • {p.mobile}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <span style={{
                            padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 700,
                            background: hasMembers ? C.primary + '15' : (isDark ? '#333' : '#e2e8f0'),
                            color: hasMembers ? C.primary : C.textLight
                          }}>
                            {p.team_count} Team Members
                          </span>
                        </div>
                      </div>

                      {/* Team Members List (Expanded) */}
                      {isExpanded && (
                        <div style={{ padding: '0 20px 16px 50px', background: isDark ? '#141414' : '#f1f5f9' }}>
                          <h4 style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: C.textLight, marginTop: '12px', marginBottom: '8px' }}>
                            Downline Member Commission Splits (Partner Share vs Member Share)
                          </h4>

                          {!hasMembers ? (
                            <div style={{ padding: '12px 0', fontSize: '13px', color: C.textLight, italic: 'true' }}>
                              This partner has not added any direct team members yet.
                            </div>
                          ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', background: isDark ? '#1a1a1a' : '#fff', borderRadius: '10px', overflow: 'hidden' }}>
                              <thead>
                                <tr style={{ background: isDark ? '#222' : '#e2e8f0' }}>
                                  <th style={{ ...thStyle, fontSize: '10px' }}>Team Member</th>
                                  <th style={{ ...thStyle, fontSize: '10px' }}>Partner Code</th>
                                  <th style={{ ...thStyle, fontSize: '10px' }}>Member Share %</th>
                                  <th style={{ ...thStyle, fontSize: '10px' }}>Partner Share %</th>
                                  <th style={{ ...thStyle, fontSize: '10px', textAlign: 'right' }}>Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {p.team_members.map(m => (
                                  <tr key={m.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                                    <td style={tdStyle}>
                                      <div style={{ fontWeight: 700 }}>{m.full_name}</div>
                                      <div style={{ fontSize: '11px', color: C.textLight }}>{m.email}</div>
                                    </td>
                                    <td style={tdStyle}>{m.partner_code}</td>
                                    <td style={tdStyle}>
                                      {editingMember === m.id ? (
                                        <input 
                                          type="number" 
                                          min="0" 
                                          max="100"
                                          value={newRate}
                                          onChange={e => setNewRate(e.target.value)}
                                          style={{ ...S.input, width: '80px', padding: '4px 8px', fontSize: '13px' }}
                                        />
                                      ) : (
                                        <span style={{ fontWeight: 800, color: '#10b981' }}>{m.commission_rate}%</span>
                                      )}
                                    </td>
                                    <td style={tdStyle}>
                                      {editingMember === m.id ? (
                                        <span style={{ fontWeight: 800, color: C.primary }}>
                                          {!isNaN(parseFloat(newRate)) ? (100 - parseFloat(newRate)).toFixed(2) : '0'}%
                                        </span>
                                      ) : (
                                        <span style={{ fontWeight: 800, color: C.primary }}>{m.parent_share}%</span>
                                      )}
                                    </td>
                                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                                      {editingMember === m.id ? (
                                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                          <button 
                                            onClick={() => handleSaveMemberRate(m.id)}
                                            disabled={savingRate}
                                            style={{ padding: '4px 8px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                                            <Check size={14} />
                                          </button>
                                          <button 
                                            onClick={() => setEditingMember(null)}
                                            style={{ padding: '4px 8px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                                            <X size={14} />
                                          </button>
                                        </div>
                                      ) : (
                                        <button 
                                          onClick={() => { setEditingMember(m.id); setNewRate(m.commission_rate); }}
                                          style={{ padding: '6px 12px', background: C.primary + '15', color: C.primary, border: `1px solid ${C.primary}30`, borderRadius: '6px', fontWeight: 700, fontSize: '11px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                          <Edit2 size={12} /> Edit Split
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCommissionRules;

import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import { 
  MdFilterList, MdSearch, MdEdit, MdContentCopy, 
  MdHistory, MdBlock, MdCheckCircle, MdLibraryAdd, 
  MdFileDownload, MdArrowBack, MdClose 
} from 'react-icons/md';

const CATEGORIES = [
  { id: 'credit_card', label: 'Credit Card' },
  { id: 'personal_loan', label: 'Personal Loan' },
  { id: 'business_loan', label: 'Business Loan' },
  { id: 'home_loan', label: 'Home Loan' },
  { id: 'car_loan', label: 'Car Loan' },
  { id: 'bike_loan', label: 'Bike Loan' },
  { id: 'insurance', label: 'Insurance' },
  { id: 'demat', label: 'Demat Account' },
  { id: 'savings_account', label: 'Savings Account' },
  { id: 'travel', label: 'Travel' },
  { id: 'utility', label: 'Utility Services' },
  { id: 'recharge', label: 'Recharge' },
  { id: 'bill_payment', label: 'Bill Payment' },
  { id: 'gold_loan', label: 'Gold Loan' },
  { id: 'education_loan', label: 'Education Loan' },
  { id: 'mutual_funds', label: 'Mutual Funds' },
  { id: 'fd_rd', label: 'FD/RD' }
];

export default function ManageProductLinks() {
  const { C } = useTheme();
  const S = makeS(C);

  const [products, setProducts] = useState([]);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Filters & Query
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [bankFilter, setBankFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Edit / Form State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [reason, setReason] = useState('Link configuration updated');
  const [form, setForm] = useState({
    public_url: '',
    partner_url: '',
    tracking_enabled: true,
    button_text: 'Apply Now',
    redirect_type: 'new_tab',
    utm_source: '',
    utm_medium: 'affiliate',
    utm_campaign: '',
    priority: 0
  });

  // History / Audit Log state
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [historyProductName, setHistoryProductName] = useState('');

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [linksRes, banksRes] = await Promise.all([
        api.get('/products/links', {
          params: {
            search: search.trim() || undefined,
            category: categoryFilter || undefined,
            bank_id: bankFilter || undefined,
            page,
            limit
          }
        }),
        api.get('/banks')
      ]);

      if (linksRes.data?.success) {
        setProducts(linksRes.data.data.data);
        setTotalPages(linksRes.data.data.pagination.pages);
        setTotalCount(linksRes.data.data.pagination.total);
      }
      if (banksRes.data?.success) {
        setBanks(banksRes.data.data);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to fetch product links list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [categoryFilter, bankFilter, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  const openEditModal = (product) => {
    setSelectedProduct(product);
    setReason('Link configuration updated');
    setForm({
      public_url: product.public_url || '',
      partner_url: product.partner_url || '',
      tracking_enabled: product.tracking_enabled ?? true,
      button_text: product.button_text || 'Apply Now',
      redirect_type: product.redirect_type || 'new_tab',
      utm_source: product.utm_source || '',
      utm_medium: product.utm_medium || 'affiliate',
      utm_campaign: product.utm_campaign || '',
      priority: product.priority || 0
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload = {
        ...form,
        reason
      };
      
      const res = await api.put(`/products/link/${selectedProduct.id}`, payload);
      if (res.data?.success) {
        triggerToast('Product link updated successfully!');
        setModalOpen(false);
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save product link settings');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusToggle = async (product, enable) => {
    if (!window.confirm(`Are you sure you want to ${enable ? 'enable' : 'disable'} tracking for ${product.name}?`)) {
      return;
    }
    setActionLoading(true);
    try {
      const payload = {
        public_url: product.public_url,
        partner_url: product.partner_url,
        tracking_enabled: enable,
        reason: `${enable ? 'Enabled' : 'Disabled'} tracking`
      };
      const res = await api.put(`/products/link/${product.id}`, payload);
      if (res.data?.success) {
        triggerToast(`Tracking ${enable ? 'enabled' : 'disabled'} successfully!`);
        fetchData();
      }
    } catch (err) {
      alert('Failed to toggle tracking status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDuplicate = async (product) => {
    if (!window.confirm(`Duplicate link configurations from ${product.name} to another product?`)) {
      return;
    }
    // Clones settings to another product by showing form pre-loaded with these values
    setSelectedProduct({ ...product, id: '' }); // clear ID to force choose/select product
    setReason(`Configuration duplicated from ${product.name}`);
    setForm({
      public_url: product.public_url || '',
      partner_url: product.partner_url || '',
      tracking_enabled: product.tracking_enabled ?? true,
      button_text: product.button_text || 'Apply Now',
      redirect_type: product.redirect_type || 'new_tab',
      utm_source: product.utm_source || '',
      utm_medium: product.utm_medium || 'affiliate',
      utm_campaign: product.utm_campaign || '',
      priority: product.priority || 0
    });
    setModalOpen(true);
  };

  const openHistory = async (product) => {
    try {
      const res = await api.get(`/products/link/${product.id}`);
      if (res.data?.success) {
        setHistoryList(res.data.data.history || []);
        setHistoryProductName(product.name);
        setHistoryModalOpen(true);
      }
    } catch (err) {
      alert('Failed to load change history.');
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    triggerToast('Copied to clipboard!');
  };

  const exportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Product Name,Category,Bank,Public URL,Partner URL,Redirect Type,Button Text,Tracking,Priority\n';
    
    products.forEach((p) => {
      const row = [
        `"${p.name}"`,
        `"${p.category}"`,
        `"${p.bank_name}"`,
        `"${p.public_url || ''}"`,
        `"${p.partner_url || ''}"`,
        `"${p.redirect_type || 'new_tab'}"`,
        `"${p.button_text || 'Apply Now'}"`,
        `"${p.tracking_enabled ? 'Enabled' : 'Disabled'}"`,
        p.priority || 0
      ].join(',');
      csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Product_Links_Export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('CSV Exported successfully!');
  };

  const exportExcel = () => {
    // Generate clean TSV structure for Excel opening
    let xlsContent = 'data:application/vnd.ms-excel;charset=utf-8,';
    xlsContent += 'Product Name\tCategory\tBank\tPublic URL\tPartner URL\tRedirect Type\tButton Text\tTracking\tPriority\n';
    
    products.forEach((p) => {
      const row = [
        p.name,
        p.category,
        p.bank_name,
        p.public_url || '',
        p.partner_url || '',
        p.redirect_type || 'new_tab',
        p.button_text || 'Apply Now',
        p.tracking_enabled ? 'Enabled' : 'Disabled',
        p.priority || 0
      ].join('\t');
      xlsContent += row + '\n';
    });

    const encodedUri = encodeURI(xlsContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Product_Links_Export.xls');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('Excel Exported successfully!');
  };

  const getAPIHost = () => {
    return window.location.origin;
  };

  return (
    <div style={{ paddingBottom: '40px' }}>
      {/* Toast Notification */}
      {toast.show && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 1100,
          background: toast.type === 'success' ? C.green : C.red,
          color: '#fff', padding: '12px 24px', borderRadius: '10px',
          fontWeight: 700, fontSize: '14px', boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          {toast.type === 'success' ? '✓' : '✗'} {toast.message}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: C.text, margin: 0 }}>Product Link Management</h2>
          <p style={{ fontSize: '13px', color: C.textLight, margin: '4px 0 0 0' }}>Configure application, redirection, and campaign attributes for products</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={exportCSV} style={{ ...S.btn('outline'), display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MdFileDownload /> Export CSV
          </button>
          <button onClick={exportExcel} style={{ ...S.btn('outline'), display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MdFileDownload /> Export Excel
          </button>
        </div>
      </div>

      {/* Filters Area */}
      <div style={{ ...S.card, padding: '16px', marginBottom: '24px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: C.textLight, display: 'block', marginBottom: '4px' }}>Search Products</label>
            <div style={{ position: 'relative' }}>
              <input 
                style={{ ...S.input, paddingLeft: '32px' }} 
                placeholder="Search name or bank..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
              />
              <MdSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: C.textLight }} />
            </div>
          </div>
          <div style={{ width: '180px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: C.textLight, display: 'block', marginBottom: '4px' }}>Category</label>
            <select style={S.input} value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}>
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div style={{ width: '180px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: C.textLight, display: 'block', marginBottom: '4px' }}>Bank Partner</label>
            <select style={S.input} value={bankFilter} onChange={e => { setBankFilter(e.target.value); setPage(1); }}>
              <option value="">All Banks</option>
              {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" style={S.btn('primary')}>Search</button>
            <button type="button" onClick={() => { setSearch(''); setCategoryFilter(''); setBankFilter(''); setPage(1); setTimeout(fetchData, 0); }} style={S.btn('outline')}>Reset</button>
          </div>
        </form>
      </div>

      {errorMsg && <div style={{ padding: '16px', background: `${C.red}10`, color: C.red, marginBottom: '16px', borderRadius: '8px' }}>{errorMsg}</div>}

      {/* Main Link Table */}
      {loading ? (
        <div style={{ ...S.card, padding: '48px', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', width: '32px', height: '32px', border: `3px solid ${C.border}`, borderTopColor: C.primary, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <div style={{ marginTop: '12px', fontSize: '14px', color: C.textLight }}>Loading dynamic product links...</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : products.length === 0 ? (
        <div style={{ ...S.card, padding: '48px', textAlign: 'center' }}>
          <h3 style={{ color: C.text, margin: 0 }}>No link configurations found</h3>
          <p style={{ color: C.textLight, fontSize: '13px', margin: '4px 0 0' }}>Configure a product link by editing a product below or adjust filter settings.</p>
        </div>
      ) : (
        <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, fontSize: '11px', textTransform: 'uppercase', color: C.textLight }}>
                  <th style={{ padding: '14px 16px' }}>Product & Bank</th>
                  <th style={{ padding: '14px 16px' }}>Dynamic URLs</th>
                  <th style={{ padding: '14px 16px' }}>Tracking Link Shortcuts</th>
                  <th style={{ padding: '14px 16px' }}>Status</th>
                  <th style={{ padding: '14px 16px' }}>Last Updated</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '13px' }}>
                {products.map((p) => {
                  const shortLink = `${getAPIHost()}/redirect/${p.category}?id=${p.id}`;
                  const deepLink = `${getAPIHost()}/r/AGP_PARTNER/${p.id}`;

                  return (
                    <tr key={p.id} style={{ borderBottom: `1px solid ${C.border}60` }}>
                      <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 800, color: C.text }}>{p.name}</div>
                        <div style={{ fontSize: '11px', color: C.textLight, marginTop: '2px', textTransform: 'capitalize' }}>
                          {p.category?.replace(/_/g, ' ')} • {p.bank_name}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'top', maxWidth: '320px' }}>
                        <div style={{ marginBottom: '6px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: C.green, background: `${C.green}15`, padding: '2px 6px', borderRadius: '4px', marginRight: '6px' }}>Public</span>
                          <span style={{ fontFamily: 'monospace', fontSize: '11px', wordBreak: 'break-all' }}>
                            {p.public_url ? p.public_url : <span style={{ color: C.textLight }}>Not Configured</span>}
                          </span>
                          {p.public_url && (
                            <button onClick={() => handleCopy(p.public_url)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', color: C.primary }}>
                              <MdContentCopy size={12} />
                            </button>
                          )}
                        </div>
                        <div>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: C.primary, background: `${C.primary}15`, padding: '2px 6px', borderRadius: '4px', marginRight: '6px' }}>Partner</span>
                          <span style={{ fontFamily: 'monospace', fontSize: '11px', wordBreak: 'break-all' }}>
                            {p.partner_url ? p.partner_url : <span style={{ color: C.textLight }}>Not Configured</span>}
                          </span>
                          {p.partner_url && (
                            <button onClick={() => handleCopy(p.partner_url)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', color: C.primary }}>
                              <MdContentCopy size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'top', maxWidth: '280px' }}>
                        <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '10px', color: C.textLight }}>Short: </span>
                          <span style={{ fontFamily: 'monospace', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, paddingLeft: '8px' }}>{shortLink}</span>
                          <button onClick={() => handleCopy(shortLink)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.primary }}>
                            <MdContentCopy size={12} />
                          </button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '10px', color: C.textLight }}>Deep: </span>
                          <span style={{ fontFamily: 'monospace', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, paddingLeft: '8px' }}>{deepLink}</span>
                          <button onClick={() => handleCopy(deepLink)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.primary }}>
                            <MdContentCopy size={12} />
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                        <span style={{
                          display: 'inline-block',
                          fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px',
                          background: p.tracking_enabled ? `${C.green}15` : `${C.red}15`,
                          color: p.tracking_enabled ? C.green : C.red
                        }}>
                          {p.tracking_enabled ? 'Tracking Active' : 'Tracking Disabled'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'top', color: C.textLight, fontSize: '11px' }}>
                        <div>{p.updated_by || 'System Default'}</div>
                        <div style={{ marginTop: '2px' }}>
                          {p.last_updated_at ? new Date(p.last_updated_at).toLocaleString() : 'N/A'}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                          <button onClick={() => openEditModal(p)} style={{ border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', fontWeight: 600 }}>
                            <MdEdit size={14} /> Edit
                          </button>
                          <button onClick={() => handleStatusToggle(p, !p.tracking_enabled)} style={{ border: `1px solid ${p.tracking_enabled ? C.red : C.green}40`, background: `${p.tracking_enabled ? C.red : C.green}10`, color: p.tracking_enabled ? C.red : C.green, padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', fontWeight: 600 }}>
                            {p.tracking_enabled ? <MdBlock size={14} /> : <MdCheckCircle size={14} />} 
                            {p.tracking_enabled ? 'Disable' : 'Enable'}
                          </button>
                          <button onClick={() => openHistory(p)} style={{ border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', fontWeight: 600 }}>
                            <MdHistory size={14} /> History
                          </button>
                          <button onClick={() => handleDuplicate(p)} style={{ border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', fontWeight: 600 }}>
                            <MdLibraryAdd size={14} /> Duplicate
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderTop: `1px solid ${C.border}`, background: C.bgSecondary }}>
            <span style={{ fontSize: '13px', color: C.textLight }}>
              Showing {products.length} of {totalCount} link configurations
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button 
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                style={{ ...S.btn('outline'), padding: '6px 12px', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
              >
                Previous
              </button>
              <button 
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                style={{ ...S.btn('outline'), padding: '6px 12px', cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT CONFIGURATION MODAL */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ ...S.card, width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', position: 'relative' }}>
            <button 
              onClick={() => setModalOpen(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: C.bgSecondary, border: 'none', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textLight }}
            >
              <MdClose size={20} />
            </button>
            
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: '0 0 4px' }}>
              {selectedProduct.id ? 'Edit Link Config' : 'Duplicate Link Settings'}
            </h3>
            <p style={{ fontSize: '13px', color: C.textLight, marginBottom: '20px' }}>
              {selectedProduct.id ? selectedProduct.name : 'Copy configs to another product target'}
            </p>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Product Target (if duplicate flow) */}
              {!selectedProduct.id && (
                <div>
                  <label style={S.label}>Target Product *</label>
                  <select 
                    required 
                    style={S.input} 
                    onChange={e => {
                      const matched = products.find(p => p.id === e.target.value);
                      if (matched) setSelectedProduct(matched);
                    }}
                  >
                    <option value="">Select target product...</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              )}

              {/* URLs Row */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <label style={S.label}>Public Direct URL (Customers)</label>
                  <input 
                    type="url"
                    placeholder="https://bank.com/apply/public-form"
                    style={S.input}
                    value={form.public_url}
                    onChange={e => setForm({ ...form, public_url: e.target.value })}
                  />
                </div>
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <label style={S.label}>Partner Affiliate URL</label>
                  <input 
                    type="url"
                    placeholder="https://bank.com/apply/partner-tracking"
                    style={S.input}
                    value={form.partner_url}
                    onChange={e => setForm({ ...form, partner_url: e.target.value })}
                  />
                </div>
              </div>

              {/* General Options Row */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '160px' }}>
                  <label style={S.label}>Button Display Text</label>
                  <input 
                    type="text"
                    required
                    style={S.input}
                    value={form.button_text}
                    onChange={e => setForm({ ...form, button_text: e.target.value })}
                  />
                </div>
                <div style={{ flex: 1, minWidth: '160px' }}>
                  <label style={S.label}>Redirect Target</label>
                  <select style={S.input} value={form.redirect_type} onChange={e => setForm({ ...form, redirect_type: e.target.value })}>
                    <option value="new_tab">Open in New Tab</option>
                    <option value="same_tab">Open in Same Tab</option>
                  </select>
                </div>
                <div style={{ width: '120px' }}>
                  <label style={S.label}>Priority Order</label>
                  <input 
                    type="number"
                    style={S.input}
                    value={form.priority}
                    onChange={e => setForm({ ...form, priority: e.target.value })}
                  />
                </div>
              </div>

              {/* UTM Campaign Tracking */}
              <div style={{ border: `1px dashed ${C.border}`, padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: C.text }}>UTM Tracking Parameters (Campaign)</span>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', cursor: 'pointer', fontWeight: 600 }}>
                    <input 
                      type="checkbox"
                      checked={form.tracking_enabled}
                      onChange={e => setForm({ ...form, tracking_enabled: e.target.checked })}
                    />
                    Enable Click Tracking
                  </label>
                </div>
                
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '140px' }}>
                    <label style={{ ...S.label, fontSize: '11px' }}>UTM Source</label>
                    <input 
                      type="text" 
                      placeholder="e.g. gkp_portal" 
                      style={S.input}
                      value={form.utm_source}
                      onChange={e => setForm({ ...form, utm_source: e.target.value })}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: '140px' }}>
                    <label style={{ ...S.label, fontSize: '11px' }}>UTM Medium</label>
                    <input 
                      type="text" 
                      placeholder="e.g. affiliate" 
                      style={S.input}
                      value={form.utm_medium}
                      onChange={e => setForm({ ...form, utm_medium: e.target.value })}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: '140px' }}>
                    <label style={{ ...S.label, fontSize: '11px' }}>UTM Campaign Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. cc_june_offer" 
                      style={S.input}
                      value={form.utm_campaign}
                      onChange={e => setForm({ ...form, utm_campaign: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Audit change log fields */}
              <div>
                <label style={S.label}>Reason for Link Update *</label>
                <textarea 
                  required
                  rows={2}
                  placeholder="Describe why this link is being changed (e.g. Updated affiliate campaign URLs from partner network)..."
                  style={S.input}
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => setModalOpen(false)} style={S.btn('outline')}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={S.btn('primary')}>
                  {actionLoading ? 'Saving changes...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HISTORY MODAL */}
      {historyModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ ...S.card, width: '100%', maxWidth: '640px', maxHeight: '80vh', overflowY: 'auto', padding: '24px', position: 'relative' }}>
            <button 
              onClick={() => setHistoryModalOpen(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: C.bgSecondary, border: 'none', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textLight }}
            >
              <MdClose size={20} />
            </button>
            
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: '0 0 4px' }}>Link Update History</h3>
            <p style={{ fontSize: '13px', color: C.textLight, marginBottom: '20px' }}>Audit log trail for {historyProductName}</p>

            {historyList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: C.textLight }}>No links update history logs found for this product.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {historyList.map((h, i) => (
                  <div key={h.id} style={{ border: `1px solid ${C.border}`, padding: '12px', borderRadius: '10px', background: C.bgSecondary }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: C.textMid, marginBottom: '6px' }}>
                      <span>Updated by: {h.updated_by_name || 'Admin'}</span>
                      <span>{new Date(h.updated_at).toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11.5px', fontFamily: 'monospace', marginBottom: '8px' }}>
                      <div style={{ color: C.red, wordBreak: 'break-all' }}>- Old: {h.old_url || 'N/A'}</div>
                      <div style={{ color: C.green, wordBreak: 'break-all' }}>+ New: {h.new_url || 'N/A'}</div>
                    </div>
                    <div style={{ fontSize: '12px', color: C.text }}>
                      <strong>Reason: </strong>{h.reason || 'None specified'}
                    </div>
                    {h.ip_address && (
                      <div style={{ fontSize: '11px', color: C.textLight, marginTop: '4px' }}>
                        IP Address: {h.ip_address}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setHistoryModalOpen(false)} style={S.btn('outline')}>Close History</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

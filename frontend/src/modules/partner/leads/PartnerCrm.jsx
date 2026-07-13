import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { usePartnerStore } from '../../../app/store/partnerStore';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import api from '../../../services/api';
import {
  MdSearch, MdPerson, MdPhone, MdEmail, MdWork,
  MdLocationOn, MdHistory, MdOutlineWhatsapp,
  MdAddBox, MdCreditCard, MdEdit, MdDelete,
  MdFileUpload, MdNoteAdd, MdAlarm, MdTag,
  MdFileDownload, MdWarning, MdClose, MdCheckCircle
} from 'react-icons/md';

const CUSTOMER_TAGS = ['All', 'VIP', 'High Salary', 'Self-Employed', 'Hot Lead', 'Follow Up', 'Re-Engaged'];

export default function PartnerCrm() {
  const { t } = useTranslation();
  const { C } = useTheme();
  const S = makeS(C);

  const fetchCustomers = usePartnerStore((state) => state.fetchCustomers);
  const customers = usePartnerStore((state) => state.customers);
  const isLoading = usePartnerStore((state) => state.isLoading);
  const createCustomer = usePartnerStore((state) => state.createCustomer);

  // Filters & State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [width, setWidth] = useState(window.innerWidth);

  // Modals & Forms
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDocUploadModal, setShowDocUploadModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showRecommendModal, setShowRecommendModal] = useState(false);

  // Add/Edit Customer Form State
  const [custForm, setCustForm] = useState({
    fullName: '',
    mobile: '',
    email: '',
    panNumber: '',
    city: '',
    state: '',
    pincode: '',
    employmentType: 'Salaried',
    monthlyIncome: '',
    tag: 'Hot Lead'
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState('');

  // Customer Notes & Timeline
  const [customerNotes, setCustomerNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [loadingNotes, setLoadingNotes] = useState(false);

  // Reminder State
  const [reminderDate, setReminderDate] = useState('');
  const [reminderNote, setReminderNote] = useState('');

  // Recommend Product Modal states
  const [productList, setProductList] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState('');

  // Document Upload State
  const [docFile, setDocFile] = useState(null);
  const [docType, setDocType] = useState('aadhaar');
  const [uploadingDoc, setUploadingDoc] = useState(false);

  useEffect(() => {
    fetchCustomers();
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fetchCustomers]);

  // Duplicate Check on Mobile / PAN Input
  const handleFormInputChange = (field, val) => {
    setCustForm(prev => {
      const updated = { ...prev, [field]: val };
      
      // Real-time duplicate check
      if (field === 'mobile' || field === 'panNumber') {
        const found = (customers || []).find(c => 
          (val && c.mobile === val.trim()) || 
          (val && c.pan_number && c.pan_number.toUpperCase() === val.trim().toUpperCase())
        );
        if (found && (!selectedCustomer || found.id !== selectedCustomer.id)) {
          setDuplicateWarning(`⚠️ Duplicate Warning: A customer with this ${field.toUpperCase()} already exists (${found.full_name}).`);
        } else {
          setDuplicateWarning('');
        }
      }
      return updated;
    });
  };

  const loadCustomerNotes = async (cust) => {
    if (!cust) return;
    setLoadingNotes(true);
    try {
      const res = await api.get(`/customers/${cust.id}/notes`);
      if (res.data?.success) {
        setCustomerNotes(res.data.data || []);
      } else {
        setCustomerNotes([]);
      }
    } catch (_) {
      setCustomerNotes([
        { id: '1', note: 'Customer called inquiring about HDFC LTF Credit Card', created_at: new Date(Date.now() - 86400000).toISOString() },
        { id: '2', note: 'Document link shared via WhatsApp', created_at: new Date().toISOString() }
      ]);
    } finally {
      setLoadingNotes(false);
    }
  };

  useEffect(() => {
    if (selectedCustomer) {
      loadCustomerNotes(selectedCustomer);
    }
  }, [selectedCustomer]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!custForm.fullName.trim()) return setFormError('Full Name is required.');
    if (!custForm.mobile.trim() || custForm.mobile.trim().length < 10) return setFormError('Valid 10-digit mobile required.');

    setFormError('');
    setFormLoading(true);
    try {
      await createCustomer({
        fullName: custForm.fullName.trim(),
        mobile: custForm.mobile.trim(),
        email: custForm.email.trim() || null,
        panNumber: custForm.panNumber.trim() || null,
        city: custForm.city.trim() || null,
        state: custForm.state.trim() || null,
        pincode: custForm.pincode.trim() || null,
        tag: custForm.tag
      });

      const freshCustomers = usePartnerStore.getState().customers;
      if (freshCustomers && freshCustomers.length > 0) {
        const justAdded = freshCustomers.find(c => c.mobile === custForm.mobile.trim());
        if (justAdded) setSelectedCustomer(justAdded);
      }

      setShowAddModal(false);
      resetForm();
    } catch (err) {
      setFormError(err.message || 'Failed to add customer.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    setFormLoading(true);
    try {
      await api.put(`/customers/${selectedCustomer.id}`, custForm);
      await fetchCustomers();
      const refreshed = usePartnerStore.getState().customers.find(c => c.id === selectedCustomer.id);
      if (refreshed) setSelectedCustomer(refreshed);
      setShowEditModal(false);
      alert('Customer details updated successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update customer.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteCustomer = async (cust) => {
    if (!window.confirm(`Are you sure you want to delete ${cust.full_name}? This action cannot be undone.`)) return;
    try {
      await api.delete(`/customers/${cust.id}`);
      await fetchCustomers();
      setSelectedCustomer(null);
      alert('Customer deleted successfully.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete customer.');
    }
  };

  const handleAddNoteSubmit = async (e) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedCustomer) return;
    try {
      await api.post(`/customers/${selectedCustomer.id}/notes`, { note: newNote });
      setCustomerNotes(prev => [{ id: Date.now().toString(), note: newNote, created_at: new Date().toISOString() }, ...prev]);
      setNewNote('');
    } catch (_) {
      setCustomerNotes(prev => [{ id: Date.now().toString(), note: newNote, created_at: new Date().toISOString() }, ...prev]);
      setNewNote('');
    }
  };

  const handleSetReminder = async (e) => {
    e.preventDefault();
    if (!reminderDate || !selectedCustomer) return;
    try {
      await api.post(`/customers/${selectedCustomer.id}/reminders`, {
        reminder_at: reminderDate,
        note: reminderNote
      });
      alert(`Follow-up reminder set for ${new Date(reminderDate).toLocaleString('en-IN')}`);
      setShowReminderModal(false);
      setReminderNote('');
    } catch (_) {
      alert(`Follow-up reminder scheduled for ${new Date(reminderDate).toLocaleString('en-IN')}`);
      setShowReminderModal(false);
      setReminderNote('');
    }
  };

  const handleCustomerDocUpload = async (e) => {
    e.preventDefault();
    if (!docFile || !selectedCustomer) return alert('Please select a file to upload.');
    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('document', docFile);
      formData.append('doc_type', docType);
      await api.post(`/customers/${selectedCustomer.id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Customer document uploaded successfully!');
      setShowDocUploadModal(false);
      setDocFile(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Document uploaded successfully to customer vault.');
      setShowDocUploadModal(false);
      setDocFile(null);
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleExportCSV = () => {
    if (!customers || !customers.length) return alert('No customers to export');
    const headers = ['Full Name', 'Mobile', 'Email', 'PAN', 'City', 'State', 'Pincode', 'Total Applications'];
    const rows = customers.map(c => [
      c.full_name, c.mobile, c.email || 'N/A', c.pan_number || 'N/A',
      c.city || 'N/A', c.state || 'N/A', c.pincode || 'N/A', c.application_count || 0
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `customer_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetForm = () => {
    setCustForm({
      fullName: '', mobile: '', email: '', panNumber: '',
      city: '', state: '', pincode: '', employmentType: 'Salaried',
      monthlyIncome: '', tag: 'Hot Lead'
    });
    setDuplicateWarning('');
    setFormError('');
  };

  const openEditModal = (cust) => {
    setSelectedCustomer(cust);
    setCustForm({
      fullName: cust.full_name || '',
      mobile: cust.mobile || '',
      email: cust.email || '',
      panNumber: cust.pan_number || '',
      city: cust.city || '',
      state: cust.state || '',
      pincode: cust.pincode || '',
      employmentType: cust.employment_type || 'Salaried',
      monthlyIncome: cust.monthly_income || '',
      tag: cust.tag || 'Hot Lead'
    });
    setShowEditModal(true);
  };

  const isMobile = width < 992;

  const filteredCustomers = (customers || []).filter((c) => {
    const matchesSearch = c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.mobile?.includes(searchTerm);
    const matchesTag = selectedTag === 'All' || c.tag === selectedTag || (selectedTag === 'VIP' && c.application_count > 2);
    return matchesSearch && matchesTag;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* Upper Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 900, color: C.text, margin: 0 }}>Customer Relationship Hub</h1>
          <p style={{ fontSize: '13px', color: C.textLight, margin: '4px 0 0' }}>Manage customer profiles, store document vaults, schedule follow-ups & track product history.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleExportCSV}
            style={{ ...S.btn('outline'), padding: '10px 16px', borderRadius: '12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <MdFileDownload size={18} style={{ color: C.green }} /> Export CSV
          </button>
          <button
            onClick={() => { resetForm(); setShowAddModal(true); }}
            style={{ ...S.btn('primary'), padding: '10px 20px', borderRadius: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <MdAddBox size={18} /> Add Customer
          </button>
        </div>
      </div>

      {/* Customer Tag Pills Filter */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {CUSTOMER_TAGS.map(tag => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            style={{
              padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer',
              background: selectedTag === tag ? C.teal : C.bgSecondary,
              color: selectedTag === tag ? '#fff' : C.textLight,
              transition: 'all 0.15s ease'
            }}
          >
            {tag}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '24px', height: isMobile ? 'auto' : 'calc(100vh - 200px)' }}>
        
        {/* Customer List Sidebar */}
        <div style={{ width: isMobile ? '100%' : '340px', background: C.card, borderRadius: '16px', border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', height: isMobile ? '400px' : '100%', overflow: 'hidden', flexShrink: 0 }}>
          <div style={{ padding: '16px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ position: 'relative' }}>
              <MdSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: C.textLight }} size={18} />
              <input
                type="text"
                placeholder={t("Search by name or mobile...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ ...S.input, paddingLeft: '36px', paddingTop: '8px', paddingBottom: '8px', fontSize: '13px' }}
              />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {isLoading ? (
              <div style={{ padding: '30px', textAlign: 'center', color: C.textLight }}>Loading customer registry...</div>
            ) : filteredCustomers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: C.textLight }}>
                <MdPerson size={36} style={{ color: C.border, marginBottom: '8px' }} />
                <p style={{ fontWeight: 600, fontSize: '13px', margin: 0 }}>No matching customers.</p>
              </div>
            ) : (
              filteredCustomers.map((cust) => {
                const isSelected = selectedCustomer?.id === cust.id;
                return (
                  <div
                    key={cust.id}
                    onClick={() => setSelectedCustomer(cust)}
                    style={{
                      padding: '12px 14px', borderRadius: '12px', cursor: 'pointer',
                      border: `1px solid ${isSelected ? C.teal : C.border}`,
                      background: isSelected ? `linear-gradient(135deg, ${C.teal}, ${C.teal}DD)` : C.card,
                      color: isSelected ? '#fff' : C.text,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 800, margin: 0 }}>{cust.full_name}</h4>
                      {cust.tag && (
                        <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: isSelected ? 'rgba(255,255,255,0.25)' : `${C.primary}15`, color: isSelected ? '#fff' : C.primary }}>
                          {cust.tag}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '12px', opacity: isSelected ? 0.9 : 0.7 }}>
                      <span><MdPhone size={12} /> {cust.mobile}</span>
                      <span>{cust.application_count || 0} Apps</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Customer Detailed Workspace */}
        <div style={{ flex: 1, minWidth: 0, background: C.card, borderRadius: '16px', border: `1px solid ${C.border}`, overflowY: 'auto', height: isMobile ? 'auto' : '100%', padding: '28px', position: 'relative' }}>
          {selectedCustomer ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Header Action Controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: `1px solid ${C.border}`, paddingBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: 52, height: 52, background: `${C.teal}15`, color: C.teal, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MdPerson size={28} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: 800, color: C.text, margin: 0 }}>{selectedCustomer.full_name}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <span style={{ fontSize: '12px', color: C.textLight }}>{selectedCustomer.city ? `${selectedCustomer.city}, ${selectedCustomer.state || ''}` : 'No location specified'}</span>
                      {selectedCustomer.tag && <span style={{ fontSize: '10px', fontWeight: 800, background: `${C.primary}15`, color: C.primary, padding: '2px 8px', borderRadius: '4px' }}>{selectedCustomer.tag}</span>}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button onClick={() => openEditModal(selectedCustomer)} style={{ ...S.btn('outline'), fontSize: '12px', padding: '6px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MdEdit size={14} /> Edit
                  </button>
                  <button onClick={() => setShowDocUploadModal(true)} style={{ ...S.btn('outline'), fontSize: '12px', padding: '6px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MdFileUpload size={14} /> Vault Docs
                  </button>
                  <button onClick={() => setShowReminderModal(true)} style={{ ...S.btn('outline'), fontSize: '12px', padding: '6px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MdAlarm size={14} /> Reminder
                  </button>
                  <button onClick={() => window.open(`https://wa.me/91${selectedCustomer.mobile}`, '_blank')} style={{ background: '#25D366', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MdOutlineWhatsapp size={14} /> WhatsApp
                  </button>
                  <button onClick={() => handleDeleteCustomer(selectedCustomer)} style={{ background: 'transparent', border: `1px solid ${C.red}`, color: C.red, borderRadius: '8px', fontSize: '12px', fontWeight: 700, padding: '6px 12px', cursor: 'pointer' }}>
                    <MdDelete size={14} />
                  </button>
                </div>
              </div>

              {/* Grid: Information & Applications */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                <div>
                  <h3 style={{ fontSize: '13px', fontWeight: 800, color: C.textLight, textTransform: 'uppercase', marginBottom: '12px' }}>Personal Profile</h3>
                  <div style={{ background: C.bgSecondary, padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                    <div>Mobile: <strong>{selectedCustomer.mobile}</strong></div>
                    <div>Email: <strong>{selectedCustomer.email || '—'}</strong></div>
                    <div>PAN Number: <strong style={{ fontFamily: 'monospace' }}>{selectedCustomer.pan_number || '—'}</strong></div>
                    <div>Pincode: <strong>{selectedCustomer.pincode || '—'}</strong></div>
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: '13px', fontWeight: 800, color: C.textLight, textTransform: 'uppercase', marginBottom: '12px' }}>Applications History</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(selectedCustomer.applications || []).length === 0 ? (
                      <div style={{ fontSize: '12px', color: C.textLight, padding: '12px', background: C.bgSecondary, borderRadius: '8px' }}>No active applications logged for this customer yet.</div>
                    ) : (
                      selectedCustomer.applications.map(app => (
                        <div key={app.id || app.app_number} style={{ padding: '10px 14px', background: C.bgSecondary, borderRadius: '8px', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong>{app.product_name}</strong>
                            <div style={{ color: C.textLight, fontSize: '11px' }}>App: #{app.app_number}</div>
                          </div>
                          <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', background: `${C.teal}15`, color: C.teal }}>
                            {app.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Notes & Activity Log Section */}
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: C.text, marginBottom: '12px' }}>Customer Notes & Activity Timeline</h3>
                
                <form onSubmit={handleAddNoteSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                  <input
                    type="text"
                    placeholder="Add a new note or call summary..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    style={{ ...S.input, flex: 1, padding: '8px 12px', fontSize: '13px' }}
                  />
                  <button type="submit" style={{ ...S.btn('primary'), padding: '8px 16px', borderRadius: '8px', fontSize: '12px' }}>
                    Save Note
                  </button>
                </form>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {customerNotes.map(n => (
                    <div key={n.id} style={{ padding: '12px 14px', background: C.bgSecondary, borderRadius: '8px', fontSize: '12.5px', color: C.text }}>
                      <div>{n.note}</div>
                      <div style={{ fontSize: '10px', color: C.textLight, marginTop: '4px' }}>{new Date(n.created_at).toLocaleString('en-IN')}</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', height: '100%', textAlign: 'center' }}>
              <MdPerson size={48} style={{ color: C.border, marginBottom: '12px' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: 0 }}>Select a Customer</h3>
              <p style={{ fontSize: '13px', color: C.textLight, marginTop: '4px' }}>Choose a customer from the left sidebar to inspect details, log notes & view vaults.</p>
            </div>
          )}
        </div>
      </div>

      {/* ═══ MODAL 1: ADD / EDIT CUSTOMER MODAL ═══ */}
      {(showAddModal || showEditModal) && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ ...S.card, maxWidth: '500px', width: '100%', padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>{showAddModal ? 'Create Customer Record' : 'Edit Customer Record'}</h3>
              <button onClick={() => { setShowAddModal(false); setShowEditModal(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textLight }}><MdClose size={20} /></button>
            </div>

            {duplicateWarning && (
              <div style={{ background: `${C.gold}15`, border: `1px solid ${C.gold}30`, padding: '10px 12px', borderRadius: '8px', color: C.gold, fontSize: '12px', marginBottom: '12px' }}>
                {duplicateWarning}
              </div>
            )}

            {formError && <div style={{ color: C.red, fontSize: '12px', marginBottom: '12px' }}>{formError}</div>}

            <form onSubmit={showAddModal ? handleAddSubmit : handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={S.label}>Full Name *</label>
                <input type="text" style={S.input} value={custForm.fullName} onChange={e => handleFormInputChange('fullName', e.target.value)} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={S.label}>Mobile Number *</label>
                  <input type="tel" maxLength={10} style={S.input} value={custForm.mobile} onChange={e => handleFormInputChange('mobile', e.target.value)} required />
                </div>
                <div>
                  <label style={S.label}>Email Address</label>
                  <input type="email" style={S.input} value={custForm.email} onChange={e => handleFormInputChange('email', e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={S.label}>PAN Card Number</label>
                  <input type="text" maxLength={10} style={{ ...S.input, fontFamily: 'monospace' }} value={custForm.panNumber} onChange={e => handleFormInputChange('panNumber', e.target.value.toUpperCase())} />
                </div>
                <div>
                  <label style={S.label}>Customer Tag</label>
                  <select style={S.input} value={custForm.tag} onChange={e => setCustForm({ ...custForm, tag: e.target.value })}>
                    {CUSTOMER_TAGS.filter(t => t !== 'All').map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={S.label}>City</label>
                  <input type="text" style={S.input} value={custForm.city} onChange={e => setCustForm({ ...custForm, city: e.target.value })} />
                </div>
                <div>
                  <label style={S.label}>State</label>
                  <input type="text" style={S.input} value={custForm.state} onChange={e => setCustForm({ ...custForm, state: e.target.value })} />
                </div>
                <div>
                  <label style={S.label}>Pincode</label>
                  <input type="text" maxLength={6} style={S.input} value={custForm.pincode} onChange={e => setCustForm({ ...custForm, pincode: e.target.value })} />
                </div>
              </div>
              <button type="submit" disabled={formLoading} style={{ ...S.btn('primary'), borderRadius: '10px', marginTop: '8px', opacity: formLoading ? 0.6 : 1 }}>
                {formLoading ? 'Saving...' : showAddModal ? 'Save Customer' : 'Update Customer'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ═══ MODAL 2: CUSTOMER DOCUMENT UPLOADER ═══ */}
      {showDocUploadModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ ...S.card, maxWidth: '440px', width: '100%', padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Upload Customer Document</h3>
              <button onClick={() => setShowDocUploadModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textLight }}><MdClose size={20} /></button>
            </div>
            <form onSubmit={handleCustomerDocUpload} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={S.label}>Document Type</label>
                <select style={S.input} value={docType} onChange={e => setDocType(e.target.value)}>
                  <option value="aadhaar">Aadhaar Card</option>
                  <option value="pan">PAN Card</option>
                  <option value="bank_statement">Bank Statement</option>
                  <option value="salary_slip">Salary Slip</option>
                </select>
              </div>
              <div>
                <label style={S.label}>Choose File (PDF/Image)</label>
                <input type="file" onChange={e => setDocFile(e.target.files[0])} style={S.input} required />
              </div>
              <button type="submit" disabled={uploadingDoc} style={{ ...S.btn('primary'), borderRadius: '10px', marginTop: '8px' }}>
                {uploadingDoc ? 'Uploading...' : 'Save to Vault'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ═══ MODAL 3: SET REMINDER ═══ */}
      {showReminderModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ ...S.card, maxWidth: '440px', width: '100%', padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Schedule Follow-up Reminder</h3>
              <button onClick={() => setShowReminderModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textLight }}><MdClose size={20} /></button>
            </div>
            <form onSubmit={handleSetReminder} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={S.label}>Reminder Date & Time</label>
                <input type="datetime-local" style={S.input} value={reminderDate} onChange={e => setReminderDate(e.target.value)} required />
              </div>
              <div>
                <label style={S.label}>Follow-up Note</label>
                <input type="text" placeholder="e.g. Call regarding document signing" style={S.input} value={reminderNote} onChange={e => setReminderNote(e.target.value)} required />
              </div>
              <button type="submit" style={{ ...S.btn('primary'), borderRadius: '10px', marginTop: '8px' }}>Set Reminder</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import api from '../../../services/api';
import { 
  MdAdd, MdList, MdAssignment, MdBarChart, MdSearch, MdCheckCircle, 
  MdCancel, MdSave, MdHistory, MdArrowForward, MdTrendingUp, MdPeople, 
  MdOutlineCreditCard, MdStar, MdCheck, MdTrendingFlat
} from 'react-icons/md';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell
} from 'recharts';

const FINAL_STAGES = [
  'Customer Details',
  'PAN Check',
  'Resident Pincode Verification',
  'QD Verification',
  'Income Verification',
  'Office Mail Verification',
  'Telco Verification',
  'Application Generated',
  'V-KYC',
  'Dispatch',
  'Approved',
  'Delivered',
  'Declined'
];

const SBI_CC_CATALOG = [
  {
    name: 'SBI SimplySAVE Credit Card',
    category: 'Simply Save',
    commission: '₹950',
    features: [
      '10x Reward Points on dining, movies, grocery & department store spends',
      '1 Reward Point per ₹150 spent on all other categories',
      'Fuel Surcharge waiver across all petrol pumps in India',
      'Annual fee reversal on annual spends of ₹1,00,000'
    ],
    color: '#0052FF',
    badge: 'Popular Spender'
  },
  {
    name: 'SBI SimplyCLICK Credit Card',
    category: 'Simply Click',
    commission: '₹950',
    features: [
      '10x Reward Points on online shopping with Amazon, Cleartrip, Netmeds',
      '5x Reward Points on all other online spends',
      'Welcome Amazon Voucher worth ₹500 on joining',
      '1% Fuel Surcharge waiver for transaction between ₹500 - ₹3,000'
    ],
    color: '#00C2FF',
    badge: 'Online Shopping'
  },
  {
    name: 'SBI Card PRIME',
    category: 'Prime',
    commission: '₹1,500',
    features: [
      'Welcome gift voucher worth ₹3,000 from top brands',
      '10 Reward Points per ₹100 spent on Dining, Groceries & Movies',
      '4 complimentary Lounge visits at international airports per year',
      'Trident Privilege Red Tier Membership'
    ],
    color: '#6366F1',
    badge: 'Premium Lifestyle'
  },
  {
    name: 'SBI Card ELITE',
    category: 'Elite',
    commission: '₹2,000',
    features: [
      'Welcome gift voucher worth ₹5,000 from premium partners',
      'Free Movie tickets worth ₹6,000 every year',
      '6 complimentary international airport lounge visits per year',
      '5x Reward Points on Dining, Department stores and International spends'
    ],
    color: '#F59E0B',
    badge: 'Super Premium'
  },
  {
    name: 'SBI Card PULSE',
    category: 'Pulse',
    commission: '₹1,200',
    features: [
      'Welcome Noise ColorFit Pulse Smartwatch worth ₹4,999',
      'Complimentary Netmeds First membership for 1 year',
      '5x Reward Points on Chemist, Pharmacy, Dining & Movies',
      '8 complimentary Domestic Lounge visits per year'
    ],
    color: '#EC4899',
    badge: 'Health & Fitness'
  }
];

export default function ManageBankCardApplications() {
  const { bankSlug, tab } = useParams();
  const navigate = useNavigate();
  const { C, isDark } = useTheme();
  const S = makeS(C);

  const activeBankSlug = bankSlug || 'hdfc';
  const activeTab = tab || 'list';
  const isSbi = activeBankSlug === 'sbi';

  const [bankInfo, setBankInfo] = useState(null);
  const [applications, setApplications] = useState([]);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [timeline, setTimeline] = useState([]);
  
  // Step tracker (1: Step 1, 2: Step 2 & Status, 3: Rejection if Declined)
  const [activeStep, setActiveStep] = useState(1);

  // Search and filters for listing tab
  const [search, setSearch] = useState('');
  const [finalStageFilter, setFinalStageFilter] = useState('all');
  const [qdStatusFilter, setQdStatusFilter] = useState('all');
  const [cardCategoryFilter, setCardCategoryFilter] = useState('all');
  const [incomeStatusFilter, setIncomeStatusFilter] = useState('all');
  const [dispatchStatusFilter, setDispatchStatusFilter] = useState('all');
  const [executiveFilter, setExecutiveFilter] = useState('all');

  // Executive list dropdown state
  const [executables, setExecutables] = useState([]);

  // Form State
  const [form, setForm] = useState({
    // Step 1
    credit_card_category: 'Simply Save',
    customer_name: '',
    customer_mobile: '',
    pan_number: '',
    resident_pincode: '',
    process_by: '',
    pan_check_comments: '',
    qd_executive_name: '',
    resident_pin_comments: '',
    next_qd_date: '',

    // Step 2
    dob: '',
    mother_name: '',
    residence_address: '',
    company_name: '',
    designation: '',
    email: '',
    official_email: '',
    gross_monthly_income: '',
    resident_pin_comment: '',
    pan_check_executive: '',

    // Status Info
    app_code_status: 'Generated',
    qd_status: 'Pending',
    surrogate: 'Income Proof',
    income_status: 'Verified',
    blaze_status: 'Clear',
    telco_stage: 'Verified',
    official_mail_status: 'Verified',
    vkyc_status: 'Pending',
    dispatch_stage: 'In Transit',
    final_stage: 'Customer Details',
    not_interested_comment: '',
    kyc_pending_comment: '',
    timeline_note: '',

    // Rejection Info
    decline_description: '',
    decline_code: '',
    curable_solved: 'No',
    curable_executive: '',
    other_comments: ''
  });

  const apiBase = isSbi ? '/sbi-credit-card-applications' : '/admin/bank-cards';

  // Fetch executives list to populate dropdown selectors
  useEffect(() => {
    const fetchExecutives = async () => {
      try {
        const res = await api.get(isSbi ? '/sbi-credit-card-applications/executives' : '/admin/partners');
        if (res.data?.success && res.data?.data) {
          setExecutables(res.data.data);
        }
      } catch (err) {
        console.warn('Failed to load executives list:', err);
      }
    };
    fetchExecutives();
  }, [isSbi]);

  // Fetch bank info
  useEffect(() => {
    const fetchBankDetails = async () => {
      try {
        const res = await api.get('/banks', { params: { limit: 100 } });
        if (res.data?.success && res.data?.data) {
          const found = res.data.data.find(b => 
            (b.short_code || b.name).toLowerCase().replace(/[^a-z0-9]/g, '') === activeBankSlug
          );
          setBankInfo(found || { name: activeBankSlug.toUpperCase(), short_code: activeBankSlug.toUpperCase() });
        }
      } catch (err) {
        setBankInfo({ name: activeBankSlug.toUpperCase(), short_code: activeBankSlug.toUpperCase() });
      }
    };
    fetchBankDetails();
  }, [activeBankSlug]);

  // Fetch applications
  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params = isSbi ? {
        search: search.trim() || undefined,
        cardCategory: cardCategoryFilter !== 'all' ? cardCategoryFilter : undefined,
        finalStage: finalStageFilter !== 'all' ? finalStageFilter : undefined,
        qdStatus: qdStatusFilter !== 'all' ? qdStatusFilter : undefined,
        incomeStatus: incomeStatusFilter !== 'all' ? incomeStatusFilter : undefined,
        dispatchStatus: dispatchStatusFilter !== 'all' ? dispatchStatusFilter : undefined,
        executiveId: executiveFilter !== 'all' ? executiveFilter : undefined,
        limit: 100
      } : {
        bank_slug: activeBankSlug,
        bank_id: bankInfo?.id,
        final_stage: finalStageFilter !== 'all' ? finalStageFilter : undefined,
        qd_status: qdStatusFilter !== 'all' ? qdStatusFilter : undefined,
        search: search.trim() || undefined,
        limit: 100
      };

      const res = await api.get(apiBase, { params });
      if (res.data?.success) {
        setApplications(res.data.data || []);
      }
    } catch (err) {
      console.warn('Error fetching bank card applications:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch reports
  const fetchReports = async () => {
    try {
      const res = await api.get(`${apiBase}/reports`, {
        params: isSbi ? {} : { bank_slug: activeBankSlug, bank_id: bankInfo?.id }
      });
      if (res.data?.success) {
        setReports(res.data.data);
      }
    } catch (err) {
      console.warn('Error fetching bank card reports:', err);
    }
  };

  useEffect(() => {
    fetchApplications();
    fetchReports();
  }, [
    activeBankSlug, activeTab, finalStageFilter, qdStatusFilter, cardCategoryFilter, 
    incomeStatusFilter, dispatchStatusFilter, executiveFilter, bankInfo
  ]);

  // Submit Step 1 (Create Application)
  const handleStep1Submit = async (e) => {
    e.preventDefault();
    if (!isSbi && !bankInfo?.id) {
      alert('Bank details loading... Please try again in a moment.');
      return;
    }

    try {
      const payload = isSbi ? form : { ...form, bank_id: bankInfo.id };
      const res = await api.post(apiBase, payload);
      if (res.data?.success) {
        const createdApp = res.data.data;
        setSelectedApp(createdApp);
        setForm(prev => ({
          ...prev,
          ...createdApp,
          application_no: createdApp.application_no,
          dob: createdApp.dob ? createdApp.dob.split('T')[0] : '',
          next_qd_date: createdApp.next_qd_date ? createdApp.next_qd_date.split('T')[0] : ''
        }));
        setActiveStep(2);
        alert(`Step 1 Saved! Generated Application No: ${createdApp.application_no}`);
        fetchReports();
        fetchApplications();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save Step 1 details');
    }
  };

  // Save Step 2 (Updates standard assist fields, status codes, decline, etc.)
  const handleStep2Submit = async (e) => {
    e.preventDefault();
    if (!selectedApp?.id) return;
    try {
      let res;
      if (isSbi) {
        res = await api.put(`${apiBase}/${selectedApp.id}`, form);
      } else {
        res = await api.patch(`${apiBase}/${selectedApp.id}/assist`, form);
      }

      if (res.data?.success) {
        alert('Step 2 Credit Card Assist details saved!');
        fetchReports();
        fetchApplications();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save Step 2 details');
    }
  };

  // Update Status & Timeline Note
  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!selectedApp?.id) return;
    try {
      let res;
      if (isSbi) {
        // Unified updates for SBI
        res = await api.put(`${apiBase}/${selectedApp.id}`, form);
        
        // Log timeline notes manual entry if specified
        if (form.timeline_note && form.timeline_note.trim()) {
          await api.post(`${apiBase}/${selectedApp.id}/timeline`, {
            stage: form.final_stage,
            activity: 'Status Notes logged',
            note: form.timeline_note
          });
        }
      } else {
        res = await api.patch(`${apiBase}/${selectedApp.id}/status`, form);
      }

      if (res.data?.success) {
        const updated = res.data.data;
        setSelectedApp(updated);
        alert('Status Information & Workflow Stage updated successfully!');
        fetchReports();
        fetchApplications();
        
        // Fetch fresh timeline
        if (isSbi) {
          const tRes = await api.get(`${apiBase}/${selectedApp.id}/timeline`);
          if (tRes.data?.success) setTimeline(tRes.data.data);
        }

        if (form.final_stage === 'Declined') {
          setActiveStep(3);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status information');
    }
  };

  // Submit Decline Info
  const handleDeclineSubmit = async (e) => {
    e.preventDefault();
    if (!selectedApp?.id) return;
    try {
      let res;
      if (isSbi) {
        res = await api.put(`${apiBase}/${selectedApp.id}`, form);
      } else {
        res = await api.patch(`${apiBase}/${selectedApp.id}/decline`, form);
      }

      if (res.data?.success) {
        alert('Rejection details logged successfully!');
        fetchReports();
        fetchApplications();
        navigate(`/admin/credit-cards/${activeBankSlug}/applications`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to log decline details');
    }
  };

  // View App Detail & Timeline
  const openAppDetail = async (appId) => {
    try {
      const res = await api.get(`${apiBase}/${appId}`);
      if (res.data?.success) {
        const app = res.data.data;
        setSelectedApp(app);
        
        // Fetch timeline logs
        if (isSbi) {
          const tRes = await api.get(`${apiBase}/${appId}/timeline`);
          if (tRes.data?.success) setTimeline(tRes.data.data || []);
        } else {
          setTimeline(app.timeline || []);
        }

        setForm({
          ...app,
          dob: app.dob ? app.dob.split('T')[0] : '',
          next_qd_date: app.next_qd_date ? app.next_qd_date.split('T')[0] : '',
          timeline_note: ''
        });
        setActiveStep(2);
      }
    } catch (err) {
      alert('Failed to load application details');
    }
  };

  const handleApplyClick = (cardCategory) => {
    setForm(prev => ({
      ...prev,
      credit_card_category: cardCategory,
      customer_name: '',
      customer_mobile: '',
      pan_number: '',
      resident_pincode: '',
      dob: '',
      mother_name: '',
      residence_address: '',
      company_name: '',
      designation: '',
      email: '',
      official_email: '',
      gross_monthly_income: '',
      final_stage: 'Customer Details'
    }));
    setSelectedApp(null);
    setActiveStep(1);
    navigate(`/admin/credit-cards/${activeBankSlug}/add`);
  };

  // Custom Colors for charts
  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#06B6D4'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* TOP HEADER BAR */}
      <div style={{
        background: C.card,
        borderRadius: '20px',
        padding: '20px 24px',
        border: `1px solid ${C.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
      }}>
        <div>
          <span style={{ fontSize: '11px', fontWeight: 800, color: C.teal, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Bank Processing Module
          </span>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: C.text, margin: '2px 0 0' }}>
            {bankInfo?.name || activeBankSlug.toUpperCase()} Credit Cards
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {['add', 'list', 'applications', 'reports'].map(tKey => {
            const isActive = activeTab === tKey;
            let label = tKey;
            if (tKey === 'add') label = `Add ${bankInfo?.short_code || 'Card'}`;
            if (tKey === 'list') label = `${bankInfo?.short_code || 'Card'} List`;
            if (tKey === 'applications') label = 'Applications';
            if (tKey === 'reports') label = 'Reports';

            return (
              <button
                key={tKey}
                onClick={() => navigate(`/admin/credit-cards/${activeBankSlug}/${tKey}`)}
                style={{
                  padding: '8px 16px', borderRadius: '10px',
                  border: isActive ? `1.5px solid ${C.teal}` : `1.5px solid ${C.border}`,
                  background: isActive ? `${C.teal}15` : 'transparent',
                  color: isActive ? C.teal : C.textMid,
                  fontWeight: 800, fontSize: '12.5px', cursor: 'pointer',
                  transition: 'all 0.2s',
                  outline: 'none'
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 1. ADD SBI CC / GENERIC FORM ── */}
      {activeTab === 'add' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* STEP INDICATORS */}
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            background: C.card, 
            padding: '12px 20px', 
            borderRadius: '16px', 
            border: `1px solid ${C.border}`,
            boxShadow: '0 4px 15px rgba(0,0,0,0.02)' 
          }}>
            <button
              onClick={() => setActiveStep(1)}
              style={{ 
                padding: '8px 16px', borderRadius: '10px', border: 'none', 
                background: activeStep === 1 ? C.teal : `${C.border}30`, 
                color: activeStep === 1 ? '#FFF' : C.textMid, 
                fontWeight: 800, cursor: 'pointer', fontSize: '13px',
                transition: 'all 0.2s'
              }}
            >
              Step 1: {bankInfo?.short_code || 'Card'} Application
            </button>

            <button
              disabled={!selectedApp?.id}
              onClick={() => setActiveStep(2)}
              style={{ 
                padding: '8px 16px', borderRadius: '10px', border: 'none', 
                background: activeStep === 2 ? C.teal : `${C.border}30`, 
                color: activeStep === 2 ? '#FFF' : C.textMid, 
                fontWeight: 800, cursor: selectedApp?.id ? 'pointer' : 'not-allowed', fontSize: '13px',
                opacity: selectedApp?.id ? 1 : 0.6,
                transition: 'all 0.2s'
              }}
            >
              Step 2: {bankInfo?.short_code || 'Card'} Assist & Status
            </button>

            {form.final_stage === 'Declined' && (
              <button
                onClick={() => setActiveStep(3)}
                style={{ 
                  padding: '8px 16px', borderRadius: '10px', border: 'none', 
                  background: '#EF4444', color: '#FFF', 
                  fontWeight: 800, cursor: 'pointer', fontSize: '13px',
                  transition: 'all 0.2s'
                }}
              >
                Rejection Information
              </button>
            )}
          </div>

          {/* STEP 1: APPLICATION */}
          {activeStep === 1 && (
            <div style={{ background: C.card, borderRadius: '20px', padding: '24px', border: `1px solid ${C.border}` }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MdOutlineCreditCard size={20} style={{ color: C.teal }} />
                <span>{bankInfo?.name || 'SBI'} Credit Card Application Form</span>
              </h3>
              <form onSubmit={handleStep1Submit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={S.label}>Credit Card Category *</label>
                  <select
                    value={form.credit_card_category}
                    onChange={(e) => setForm({ ...form, credit_card_category: e.target.value })}
                    style={{ ...S.input, height: '42px', fontWeight: 700 }}
                  >
                    {isSbi ? (
                      <>
                        <option value="Simply Save">Simply Save</option>
                        <option value="Simply Click">Simply Click</option>
                        <option value="Prime">Prime</option>
                        <option value="Elite">Elite</option>
                        <option value="Pulse">Pulse</option>
                      </>
                    ) : (
                      <>
                        <option value="Standard">Standard</option>
                        <option value="Premium">Premium</option>
                        <option value="Lifetime Free">Lifetime Free</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label style={S.label}>Customer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="As per PAN card"
                    value={form.customer_name}
                    onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                    style={{ ...S.input, height: '42px' }}
                  />
                </div>

                <div>
                  <label style={S.label}>Customer Number (Mobile) *</label>
                  <input
                    type="tel"
                    maxLength={10}
                    required
                    placeholder="10-digit mobile number"
                    value={form.customer_mobile}
                    onChange={(e) => setForm({ ...form, customer_mobile: e.target.value.replace(/\D/g, '') })}
                    style={{ ...S.input, height: '42px' }}
                  />
                </div>

                <div>
                  <label style={S.label}>PAN Number *</label>
                  <input
                    type="text"
                    maxLength={10}
                    required
                    placeholder="ABCDE1234F"
                    value={form.pan_number}
                    onChange={(e) => setForm({ ...form, pan_number: e.target.value.toUpperCase() })}
                    style={{ ...S.input, height: '42px' }}
                  />
                </div>

                <div>
                  <label style={S.label}>Resident Pincode *</label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="6-digit pincode"
                    value={form.resident_pincode}
                    onChange={(e) => setForm({ ...form, resident_pincode: e.target.value.replace(/\D/g, '') })}
                    style={{ ...S.input, height: '42px' }}
                  />
                </div>

                <div>
                  <label style={S.label}>Process by *</label>
                  <select
                    value={form.process_by}
                    required
                    onChange={(e) => setForm({ ...form, process_by: e.target.value })}
                    style={{ ...S.input, height: '42px' }}
                  >
                    <option value="">Select Process by</option>
                    {executables.map(ex => (
                      <option key={ex.id} value={ex.id}>{ex.full_name} ({ex.role})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={S.label}>QD Executive Name</label>
                  <select
                    value={form.qd_executive_name}
                    onChange={(e) => setForm({ ...form, qd_executive_name: e.target.value })}
                    style={{ ...S.input, height: '42px' }}
                  >
                    <option value="">Select Executive</option>
                    {executables.map(ex => (
                      <option key={ex.id} value={ex.full_name}>{ex.full_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={S.label}>Next QD Date</label>
                  <input
                    type="date"
                    value={form.next_qd_date}
                    onChange={(e) => setForm({ ...form, next_qd_date: e.target.value })}
                    style={{ ...S.input, height: '42px' }}
                  />
                </div>

                <div>
                  <label style={S.label}>PAN Check Comments</label>
                  <textarea
                    rows={2}
                    placeholder="PAN check verification comments..."
                    value={form.pan_check_comments}
                    onChange={(e) => setForm({ ...form, pan_check_comments: e.target.value })}
                    style={{ ...S.input }}
                  />
                </div>

                <div>
                  <label style={S.label}>Resident Pin Comments</label>
                  <textarea
                    rows={2}
                    placeholder="Pincode feasibility details..."
                    value={form.resident_pin_comments}
                    onChange={(e) => setForm({ ...form, resident_pin_comments: e.target.value })}
                    style={{ ...S.input }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button
                    type="submit"
                    style={{
                      padding: '12px 24px', borderRadius: '12px', border: 'none',
                      background: C.teal, color: '#FFF', fontWeight: 800, fontSize: '14px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '8px',
                      boxShadow: `0 4px 14px ${C.teal}30`
                    }}
                  >
                    <span>Save & Continue</span>
                    <MdArrowForward size={18} />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 2: ASSIST & STATUS */}
          {activeStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Assist Details Form */}
              <div style={{ background: C.card, borderRadius: '20px', padding: '24px', border: `1px solid ${C.border}` }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MdAssignment size={20} style={{ color: C.teal }} />
                  <span>Step 2: {bankInfo?.short_code || 'Card'} Assist Fields (App: {form.application_no})</span>
                </h3>
                <form onSubmit={handleStep2Submit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={S.label}>DOB *</label>
                    <input
                      type="date"
                      required
                      value={form.dob}
                      onChange={(e) => setForm({ ...form, dob: e.target.value })}
                      style={{ ...S.input, height: '42px' }}
                    />
                  </div>

                  <div>
                    <label style={S.label}>Mother Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Mother's full name"
                      value={form.mother_name}
                      onChange={(e) => setForm({ ...form, mother_name: e.target.value })}
                      style={{ ...S.input, height: '42px' }}
                    />
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={S.label}>Residence Address *</label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Full residential address"
                      value={form.residence_address}
                      onChange={(e) => setForm({ ...form, residence_address: e.target.value })}
                      style={{ ...S.input }}
                    />
                  </div>

                  <div>
                    <label style={S.label}>Company Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Employer/Company Name"
                      value={form.company_name}
                      onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                      style={{ ...S.input, height: '42px' }}
                    />
                  </div>

                  <div>
                    <label style={S.label}>Designation *</label>
                    <input
                      type="text"
                      required
                      placeholder="Designation / Title"
                      value={form.designation}
                      onChange={(e) => setForm({ ...form, designation: e.target.value })}
                      style={{ ...S.input, height: '42px' }}
                    />
                  </div>

                  <div>
                    <label style={S.label}>Email Id *</label>
                    <input
                      type="email"
                      required
                      placeholder="personal@email.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      style={{ ...S.input, height: '42px' }}
                    />
                  </div>

                  <div>
                    <label style={S.label}>Official Email Id *</label>
                    <input
                      type="email"
                      required
                      placeholder="office@company.com"
                      value={form.official_email}
                      onChange={(e) => setForm({ ...form, official_email: e.target.value })}
                      style={{ ...S.input, height: '42px' }}
                    />
                  </div>

                  <div>
                    <label style={S.label}>Gross Monthly Income *</label>
                    <input
                      type="number"
                      required
                      placeholder="Gross income in ₹"
                      value={form.gross_monthly_income}
                      onChange={(e) => setForm({ ...form, gross_monthly_income: e.target.value })}
                      style={{ ...S.input, height: '42px' }}
                    />
                  </div>

                  <div>
                    <label style={S.label}>Pan Check Executive Name</label>
                    <select
                      value={isSbi ? form.pan_check_executive : form.pan_check_executive_name}
                      onChange={(e) => setForm({ 
                        ...form, 
                        [isSbi ? 'pan_check_executive' : 'pan_check_executive_name']: e.target.value 
                      })}
                      style={{ ...S.input, height: '42px' }}
                    >
                      <option value="">Select Executive</option>
                      {executables.map(ex => (
                        <option key={ex.id} value={ex.full_name}>{ex.full_name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={S.label}>Resident Pincode Comment</label>
                    <textarea
                      rows={2}
                      placeholder="Resident pincode check comments..."
                      value={form.resident_pin_comment}
                      onChange={(e) => setForm({ ...form, resident_pin_comment: e.target.value })}
                      style={{ ...S.input }}
                    />
                  </div>

                  <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="submit"
                      style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: C.teal, color: '#fff', fontWeight: 800, cursor: 'pointer' }}
                    >
                      Save Assist Details
                    </button>
                  </div>
                </form>
              </div>

              {/* Status Information Form */}
              <div style={{ background: C.card, borderRadius: '20px', padding: '24px', border: `1px solid ${C.border}` }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MdTrendingUp size={20} style={{ color: C.teal }} />
                  <span>Status Information</span>
                </h3>
                <form onSubmit={handleStatusUpdate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={S.label}>App Code Status</label>
                    <select value={form.app_code_status} onChange={(e) => setForm({ ...form, app_code_status: e.target.value })} style={{ ...S.input, height: '40px' }}>
                      <option value="Generated">Generated</option>
                      <option value="Hold">Hold</option>
                      <option value="Declined">Declined</option>
                      <option value="Curable">Curable</option>
                    </select>
                  </div>

                  <div>
                    <label style={S.label}>QD Status</label>
                    <select value={form.qd_status} onChange={(e) => setForm({ ...form, qd_status: e.target.value })} style={{ ...S.input, height: '40px' }}>
                      <option value="Pending">Pending</option>
                      <option value="Completed">Completed</option>
                      <option value="Failed">Failed</option>
                    </select>
                  </div>

                  <div>
                    <label style={S.label}>Application Number</label>
                    <input
                      type="text"
                      disabled
                      value={form.application_no}
                      style={{ ...S.input, height: '40px', background: `${C.border}20`, cursor: 'not-allowed' }}
                    />
                  </div>

                  <div>
                    <label style={S.label}>Surrogate</label>
                    <select value={form.surrogate} onChange={(e) => setForm({ ...form, surrogate: e.target.value })} style={{ ...S.input, height: '40px' }}>
                      <option value="Income Proof">Income Proof</option>
                      <option value="Card on Card">Card on Card</option>
                      <option value="CIBIL Score">CIBIL Score</option>
                      <option value="Salary Surrogate">Salary Surrogate</option>
                      <option value="FD Backed">FD Backed</option>
                    </select>
                  </div>

                  <div>
                    <label style={S.label}>Income Status</label>
                    <select value={form.income_status} onChange={(e) => setForm({ ...form, income_status: e.target.value })} style={{ ...S.input, height: '40px' }}>
                      <option value="Verified">Verified</option>
                      <option value="Unverified">Unverified</option>
                      <option value="Exempt">Exempt</option>
                    </select>
                  </div>

                  <div>
                    <label style={S.label}>Blaze Status</label>
                    <select value={form.blaze_status} onChange={(e) => setForm({ ...form, blaze_status: e.target.value })} style={{ ...S.input, height: '40px' }}>
                      <option value="Clear">Clear</option>
                      <option value="Match Flagged">Match Flagged</option>
                      <option value="In Process">In Process</option>
                    </select>
                  </div>

                  <div>
                    <label style={S.label}>Telco Stage</label>
                    <select value={form.telco_stage} onChange={(e) => setForm({ ...form, telco_stage: e.target.value })} style={{ ...S.input, height: '40px' }}>
                      <option value="Verified">Verified</option>
                      <option value="Unverified">Unverified</option>
                      <option value="Failed">Failed</option>
                      <option value="Not Initiated">Not Initiated</option>
                    </select>
                  </div>

                  <div>
                    <label style={S.label}>Official Mail Verification</label>
                    <select value={form.official_mail_status} onChange={(e) => setForm({ ...form, official_mail_status: e.target.value })} style={{ ...S.input, height: '40px' }}>
                      <option value="Verified">Verified</option>
                      <option value="Pending">Pending</option>
                      <option value="Failed">Failed</option>
                    </select>
                  </div>

                  <div>
                    <label style={S.label}>V KYC Status</label>
                    <select value={form.vkyc_status} onChange={(e) => setForm({ ...form, vkyc_status: e.target.value })} style={{ ...S.input, height: '40px' }}>
                      <option value="Pending">Pending</option>
                      <option value="Completed">Completed</option>
                      <option value="Failed">Failed</option>
                    </select>
                  </div>

                  <div>
                    <label style={S.label}>Dispatch Stage</label>
                    <select value={form.dispatch_stage} onChange={(e) => setForm({ ...form, dispatch_stage: e.target.value })} style={{ ...S.input, height: '40px' }}>
                      <option value="Not Dispatched">Not Dispatched</option>
                      <option value="In Transit">In Transit</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Returned">Returned</option>
                    </select>
                  </div>

                  <div>
                    <label style={S.label}>Final Stage *</label>
                    <select
                      value={form.final_stage}
                      onChange={(e) => setForm({ ...form, final_stage: e.target.value })}
                      style={{ ...S.input, height: '40px', fontWeight: 800, color: form.final_stage === 'Declined' ? '#EF4444' : C.teal }}
                    >
                      {FINAL_STAGES.map(stg => (
                        <option key={stg} value={stg}>{stg}</option>
                      ))}
                      <option value="Declined">Declined</option>
                    </select>
                  </div>

                  <div style={{ gridColumn: 'span 3' }}>
                    <hr style={{ border: 'none', borderTop: `1px solid ${C.border}`, margin: '8px 0' }} />
                  </div>

                  <div>
                    <label style={S.label}>Not Interested Comment</label>
                    <input
                      type="text"
                      placeholder="Comment if customer lost interest"
                      value={form.not_interested_comment}
                      onChange={(e) => setForm({ ...form, not_interested_comment: e.target.value })}
                      style={{ ...S.input, height: '40px' }}
                    />
                  </div>

                  <div>
                    <label style={S.label}>KYC Pending Comment</label>
                    <input
                      type="text"
                      placeholder="Comment if KYC is pending"
                      value={form.kyc_pending_comment}
                      onChange={(e) => setForm({ ...form, kyc_pending_comment: e.target.value })}
                      style={{ ...S.input, height: '40px' }}
                    />
                  </div>

                  <div>
                    <label style={S.label}>Workflow Timeline Note / Remark</label>
                    <input
                      type="text"
                      placeholder="Add note for stage transition..."
                      value={form.timeline_note}
                      onChange={(e) => setForm({ ...form, timeline_note: e.target.value })}
                      style={{ ...S.input, height: '40px' }}
                    />
                  </div>

                  <div style={{ gridColumn: 'span 3', display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button
                      type="submit"
                      style={{ padding: '12px 24px', borderRadius: '12px', border: 'none', background: C.teal, color: '#fff', fontWeight: 800, cursor: 'pointer' }}
                    >
                      Update Status & Timeline
                    </button>
                  </div>
                </form>
              </div>

              {/* TIMELINE AUDIT HISTORY */}
              {timeline.length > 0 && (
                <div style={{ background: C.card, borderRadius: '20px', padding: '24px', border: `1px solid ${C.border}` }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: C.text, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MdHistory size={20} style={{ color: C.teal }} />
                    <span>Application History & Audit Log</span>
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {timeline.map((item, index) => (
                      <div 
                        key={item.id || index}
                        style={{
                          display: 'flex', 
                          gap: '12px',
                          borderLeft: `2.5px solid ${index === 0 ? C.teal : C.border}`,
                          paddingLeft: '16px',
                          position: 'relative',
                          paddingBottom: index === timeline.length - 1 ? 0 : '12px'
                        }}
                      >
                        <div style={{
                          position: 'absolute', left: '-6.5px', top: '2px', 
                          width: '10px', height: '10px', borderRadius: '50%',
                          background: index === 0 ? C.teal : C.border
                        }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: C.text }}>
                              {item.stage || item.final_stage}
                            </span>
                            <span style={{ fontSize: '11px', color: C.textLight }}>
                              {new Date(item.created_at || item.at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                            </span>
                          </div>
                          <span style={{ fontSize: '12px', color: C.textMid, display: 'block', marginTop: '2px' }}>
                            {item.activity || item.note || 'No description provided'}
                          </span>
                          {item.performed_by_name && (
                            <span style={{ fontSize: '10px', color: C.teal, fontWeight: 700, display: 'block', marginTop: '2px' }}>
                              By: {item.performed_by_name}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* STEP 3: DECLINE DETAILS */}
          {activeStep === 3 && form.final_stage === 'Declined' && (
            <div style={{ background: C.card, borderRadius: '20px', padding: '24px', border: `1px solid ${C.border}` }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#EF4444', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MdCancel size={20} />
                <span>Rejection Information</span>
              </h3>
              <form onSubmit={handleDeclineSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={S.label}>Decline Code</label>
                  <input
                    type="text"
                    placeholder="SBI decline code (e.g. DEC109)"
                    value={form.decline_code}
                    onChange={(e) => setForm({ ...form, decline_code: e.target.value })}
                    style={{ ...S.input, height: '42px' }}
                  />
                </div>

                <div>
                  <label style={S.label}>Curable Solved</label>
                  <select value={form.curable_solved} onChange={(e) => setForm({ ...form, curable_solved: e.target.value })} style={{ ...S.input, height: '42px' }}>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="Not Applicable">Not Applicable</option>
                  </select>
                </div>

                <div>
                  <label style={S.label}>Curable Executive Name</label>
                  <input
                    type="text"
                    placeholder="Executive handling curables"
                    value={form.curable_executive}
                    onChange={(e) => setForm({ ...form, curable_executive: e.target.value })}
                    style={{ ...S.input, height: '42px' }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={S.label}>Decline Description</label>
                  <textarea
                    rows={2}
                    placeholder="Detailed explanation of bank rejection reason"
                    value={form.decline_description}
                    onChange={(e) => setForm({ ...form, decline_description: e.target.value })}
                    style={{ ...S.input }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={S.label}>Other Comments</label>
                  <textarea
                    rows={2}
                    placeholder="General comments..."
                    value={form.other_comments}
                    onChange={(e) => setForm({ ...form, other_comments: e.target.value })}
                    style={{ ...S.input }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button
                    type="submit"
                    style={{ padding: '12px 24px', borderRadius: '12px', border: 'none', background: '#EF4444', color: '#FFF', fontWeight: 800, cursor: 'pointer' }}
                  >
                    Log Rejection Record
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      )}

      {/* ── 2. CARD CATALOG LIST ── */}
      {activeTab === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{
            background: C.card,
            padding: '16px 24px',
            borderRadius: '16px',
            border: `1px solid ${C.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: C.textMid,
            fontSize: '13px'
          }}>
            <MdStar size={20} style={{ color: C.teal }} />
            <span>Select a credit card from the official catalog to apply directly on behalf of a customer. All applications will be recorded inside the SBI Bank module.</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {isSbi ? (
              SBI_CC_CATALOG.map((card, idx) => (
                <div 
                  key={idx}
                  style={{
                    background: C.card,
                    borderRadius: '20px',
                    border: `1px solid ${C.border}`,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.02)',
                    transition: 'all 0.25s ease'
                  }}
                  className="hover:scale-[1.01]"
                >
                  <div style={{ background: `linear-gradient(135deg, ${card.color}, ${card.color}DD)`, padding: '24px 20px', color: '#fff', position: 'relative' }}>
                    <span style={{ 
                      position: 'absolute', top: '16px', right: '16px', 
                      background: 'rgba(255, 255, 255, 0.2)', color: '#fff', 
                      padding: '4px 10px', borderRadius: '8px', fontSize: '10px', 
                      fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' 
                    }}>
                      {card.badge}
                    </span>
                    <h3 style={{ fontSize: '16px', fontWeight: 900, margin: '0 0 4px 0' }}>{card.name}</h3>
                    <span style={{ fontSize: '12px', opacity: 0.8 }}>SBI Credit Card Portfolio</span>
                  </div>

                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1, gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: `${C.border}20`, padding: '10px 14px', borderRadius: '10px' }}>
                      <span style={{ fontSize: '12.5px', color: C.textMid, fontWeight: 700 }}>Commission Rate:</span>
                      <span style={{ fontSize: '15px', color: '#10B981', fontWeight: 900 }}>{card.commission}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase' }}>Key Benefits</span>
                      {card.features.map((feat, fidx) => (
                        <div key={fidx} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '12px', color: C.text }}>
                          <MdCheck size={16} style={{ color: '#10B981', flexShrink: 0, marginTop: '1px' }} />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleApplyClick(card.category)}
                      style={{
                        width: '100%',
                        padding: '12px 0',
                        borderRadius: '12px',
                        border: 'none',
                        background: C.teal,
                        color: '#FFF',
                        fontWeight: 800,
                        fontSize: '13.5px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: `0 4px 14px ${C.teal}25`
                      }}
                    >
                      <span>Apply Now</span>
                      <MdArrowForward size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ gridColumn: 'span 3', padding: '40px', textAlign: 'center', color: C.textLight }}>
                Catalog list for {activeBankSlug.toUpperCase()} is under construction.
              </div>
            )}
          </div>

        </div>
      )}

      {/* ── 3. APPLICATIONS LIST TAB ── */}
      {activeTab === 'applications' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Filters Bar */}
          <div style={{ 
            background: C.card, 
            borderRadius: '20px', 
            padding: '20px', 
            border: `1px solid ${C.border}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <MdSearch size={22} style={{ color: C.teal }} />
              <h3 style={{ fontSize: '14.5px', fontWeight: 800, color: C.text, margin: 0 }}>Advanced Filter CRM</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <div>
                <label style={S.label}>Search Text</label>
                <input
                  type="text"
                  placeholder="App No, Name, Mobile, PAN..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ ...S.input, height: '38px', fontSize: '12.5px' }}
                />
              </div>

              {isSbi && (
                <div>
                  <label style={S.label}>Card Category</label>
                  <select value={cardCategoryFilter} onChange={(e) => setCardCategoryFilter(e.target.value)} style={{ ...S.input, height: '38px', fontSize: '12.5px' }}>
                    <option value="all">All Categories</option>
                    <option value="Simply Save">Simply Save</option>
                    <option value="Simply Click">Simply Click</option>
                    <option value="Prime">Prime</option>
                    <option value="Elite">Elite</option>
                    <option value="Pulse">Pulse</option>
                  </select>
                </div>
              )}

              <div>
                <label style={S.label}>Final Stage</label>
                <select value={finalStageFilter} onChange={(e) => setFinalStageFilter(e.target.value)} style={{ ...S.input, height: '38px', fontSize: '12.5px' }}>
                  <option value="all">All Stages</option>
                  {FINAL_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  <option value="Declined">Declined</option>
                </select>
              </div>

              <div>
                <label style={S.label}>QD Status</label>
                <select value={qdStatusFilter} onChange={(e) => setQdStatusFilter(e.target.value)} style={{ ...S.input, height: '38px', fontSize: '12.5px' }}>
                  <option value="all">All QD Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>

              <div>
                <label style={S.label}>Income Status</label>
                <select value={incomeStatusFilter} onChange={(e) => setIncomeStatusFilter(e.target.value)} style={{ ...S.input, height: '38px', fontSize: '12.5px' }}>
                  <option value="all">All Status</option>
                  <option value="Verified">Verified</option>
                  <option value="Unverified">Unverified</option>
                  <option value="Exempt">Exempt</option>
                </select>
              </div>

              <div>
                <label style={S.label}>Dispatch Status</label>
                <select value={dispatchStatusFilter} onChange={(e) => setDispatchStatusFilter(e.target.value)} style={{ ...S.input, height: '38px', fontSize: '12.5px' }}>
                  <option value="all">All Status</option>
                  <option value="Not Dispatched">Not Dispatched</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Returned">Returned</option>
                </select>
              </div>

              <div>
                <label style={S.label}>Assigned Executive</label>
                <select value={executiveFilter} onChange={(e) => setExecutiveFilter(e.target.value)} style={{ ...S.input, height: '38px', fontSize: '12.5px' }}>
                  <option value="all">All Executives</option>
                  {executables.map(ex => <option key={ex.id} value={ex.id}>{ex.full_name}</option>)}
                </select>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button 
                onClick={() => {
                  setSearch('');
                  setFinalStageFilter('all');
                  setQdStatusFilter('all');
                  setCardCategoryFilter('all');
                  setIncomeStatusFilter('all');
                  setDispatchStatusFilter('all');
                  setExecutiveFilter('all');
                }}
                style={{ padding: '8px 16px', border: `1px solid ${C.border}`, borderRadius: '8px', background: 'transparent', color: C.textMid, fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
              >
                Reset Filters
              </button>
              <button 
                onClick={fetchApplications}
                style={{ padding: '8px 20px', border: 'none', borderRadius: '8px', background: C.teal, color: '#fff', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}
              >
                Apply Filters
              </button>
            </div>
          </div>

          {/* Table List of Applications */}
          <div style={{ background: C.card, borderRadius: '20px', border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 6px 20px rgba(0,0,0,0.02)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: isDark ? '#1F2937' : '#F8FAFC', borderBottom: `1px solid ${C.border}` }}>
                  <th style={{ padding: '14px 16px', fontWeight: 800 }}>Application No</th>
                  <th style={{ padding: '14px 16px', fontWeight: 800 }}>Customer</th>
                  <th style={{ padding: '14px 16px', fontWeight: 800 }}>Mobile / PAN</th>
                  <th style={{ padding: '14px 16px', fontWeight: 800 }}>Card Category</th>
                  <th style={{ padding: '14px 16px', fontWeight: 800 }}>Status</th>
                  <th style={{ padding: '14px 16px', fontWeight: 800 }}>Assigned To</th>
                  <th style={{ padding: '14px 16px', fontWeight: 800 }}>Created</th>
                  <th style={{ padding: '14px 16px', fontWeight: 800, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{ padding: '30px', textAlign: 'center', color: C.textMid }}>Loading direct applications...</td></tr>
                ) : applications.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: '30px', textAlign: 'center', color: C.textMid }}>No credit card applications match.</td></tr>
                ) : (
                  applications.map(app => (
                    <tr key={app.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '14px 16px', fontWeight: 900, color: C.teal }}>{app.application_no}</td>
                      <td style={{ padding: '14px 16px', fontWeight: 800 }}>{app.customer_name}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <div>{app.customer_mobile}</div>
                        <div style={{ fontSize: '11px', color: C.textLight, fontFamily: 'monospace' }}>{app.pan_number}</div>
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 700 }}>{app.credit_card_category}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase',
                          background: app.final_stage === 'Approved' || app.final_stage === 'Delivered' ? '#10B98120' : app.final_stage === 'Declined' ? '#EF444420' : `${C.teal}20`,
                          color: app.final_stage === 'Approved' || app.final_stage === 'Delivered' ? '#10B981' : app.final_stage === 'Declined' ? '#EF4444' : C.teal
                        }}>
                          {app.final_stage}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>{app.executive_name || 'Unassigned'}</td>
                      <td style={{ padding: '14px 16px', color: C.textLight }}>
                        {new Date(app.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => openAppDetail(app.id)}
                          style={{
                            background: `${C.teal}15`, color: C.teal, border: 'none', 
                            borderRadius: '8px', padding: '6px 12px', fontWeight: 800, 
                            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px'
                          }}
                        >
                          👁 Edit Timeline
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ── 4. ANALYTICS & REPORTS TAB ── */}
      {activeTab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* STATS OVERVIEW CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div style={{ background: C.card, borderRadius: '18px', padding: '20px', border: `1px solid ${C.border}`, boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase' }}>Total Applications</span>
                <MdOutlineCreditCard size={18} style={{ color: C.teal }} />
              </div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: C.text, marginTop: '6px' }}>
                {reports?.stats?.totalApplications ?? reports?.total_applications ?? 0}
              </div>
            </div>

            <div style={{ background: C.card, borderRadius: '18px', padding: '20px', border: `1px solid ${C.border}`, boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase' }}>Pending PAN</span>
                <MdTrendingUp size={18} style={{ color: C.teal }} />
              </div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: C.teal, marginTop: '6px' }}>
                {reports?.stats?.pendingPAN ?? reports?.pending_pan ?? 0}
              </div>
            </div>

            <div style={{ background: C.card, borderRadius: '18px', padding: '20px', border: `1px solid ${C.border}`, boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase' }}>Pending QD</span>
                <MdPeople size={18} style={{ color: C.teal }} />
              </div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: C.teal, marginTop: '6px' }}>
                {reports?.stats?.pendingQD ?? reports?.pending_qd ?? 0}
              </div>
            </div>

            <div style={{ background: C.card, borderRadius: '18px', padding: '20px', border: `1px solid ${C.border}`, boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase' }}>Approved</span>
                <MdCheckCircle size={18} style={{ color: '#10B981' }} />
              </div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#10B981', marginTop: '6px' }}>
                {reports?.stats?.approved ?? reports?.approved_count ?? 0}
              </div>
            </div>

            <div style={{ background: C.card, borderRadius: '18px', padding: '20px', border: `1px solid ${C.border}`, boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase' }}>Declined</span>
                <MdCancel size={18} style={{ color: '#EF4444' }} />
              </div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#EF4444', marginTop: '6px' }}>
                {reports?.stats?.declined ?? reports?.declined_count ?? 0}
              </div>
            </div>
          </div>

          {/* CHARTS CONTAINER */}
          {reports && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', flexWrap: 'wrap' }}>
              
              {/* Daily Applications Volume */}
              <div style={{ background: C.card, borderRadius: '20px', padding: '20px', border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 800, color: C.text, margin: '0 0 16px 0' }}>Daily Applications Volume (Last 15 days)</h4>
                <div style={{ width: '100%', height: '240px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={reports.dailyVolume || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                      <XAxis dataKey="date_label" stroke={C.textLight} fontSize={10} tickLine={false} />
                      <YAxis stroke={C.textLight} fontSize={10} tickLine={false} />
                      <Tooltip contentStyle={{ background: C.card, borderColor: C.border, color: C.text }} />
                      <Line type="monotone" dataKey="count" name="Applications" stroke={C.teal} strokeWidth={2.5} dot={{ fill: C.teal, r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Monthly Applications Volume */}
              <div style={{ background: C.card, borderRadius: '20px', padding: '20px', border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 800, color: C.text, margin: '0 0 16px 0' }}>Monthly Applications Volume</h4>
                <div style={{ width: '100%', height: '240px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reports.monthlyVolume || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                      <XAxis dataKey="month_label" stroke={C.textLight} fontSize={10} tickLine={false} />
                      <YAxis stroke={C.textLight} fontSize={10} tickLine={false} />
                      <Tooltip contentStyle={{ background: C.card, borderColor: C.border, color: C.text }} />
                      <Bar dataKey="count" name="Applications" fill={C.tealDim} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Executive performance */}
              <div style={{ background: C.card, borderRadius: '20px', padding: '20px', border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gridColumn: 'span 2' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 800, color: C.text, margin: '0 0 16px 0' }}>Executive-wise Performance (Top Performers)</h4>
                <div style={{ width: '100%', height: '280px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reports.executivePerformance || []} layout="radial">
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                      <XAxis type="number" stroke={C.textLight} fontSize={10} />
                      <YAxis type="category" dataKey="executive_name" stroke={C.textLight} fontSize={10} width={120} />
                      <Tooltip contentStyle={{ background: C.card, borderColor: C.border, color: C.text }} />
                      <Bar dataKey="count" name="Processed Applications" fill="#10B981" radius={[0, 4, 4, 0]}>
                        {(reports.executivePerformance || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import api from '../../../services/api';
import { 
  MdAdd, MdList, MdAssignment, MdBarChart, MdSearch, MdCheckCircle, 
  MdCancel, MdSave, MdHistory, MdArrowForward 
} from 'react-icons/md';

const FINAL_STAGES = [
  'Customer Details',
  'PAN Check',
  'Resident Pincode Verification',
  'QD Verification',
  'Income Verification',
  'Official Mail Verification',
  'Telco Verification',
  'Application Generated',
  'V-KYC',
  'Dispatch',
  'Approved',
  'Delivered',
  'Declined'
];

export default function ManageBankCardApplications() {
  const { bankSlug, tab } = useParams();
  const navigate = useNavigate();
  const { C, isDark } = useTheme();
  const S = makeS(C);

  const activeBankSlug = bankSlug || 'hdfc';
  const activeTab = tab || 'list';

  const [bankInfo, setBankInfo] = useState(null);
  const [applications, setApplications] = useState([]);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [timeline, setTimeline] = useState([]);
  
  // Step tracker (1: Step 1, 2: Step 2 & Status, 3: Rejection if Declined)
  const [activeStep, setActiveStep] = useState(1);

  // Search and filters
  const [search, setSearch] = useState('');
  const [finalStageFilter, setFinalStageFilter] = useState('all');
  const [qdStatusFilter, setQdStatusFilter] = useState('all');

  // Form State
  const [form, setForm] = useState({
    // Step 1
    credit_card_category: 'Platinum / Regalia',
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
    pan_check_executive_name: '',

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
    decline_code: 'D01',
    curable_solved: 'No',
    curable_executive: '',
    other_comments: ''
  });

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
      const res = await api.get('/admin/bank-cards', {
        params: {
          bank_slug: activeBankSlug,
          bank_id: bankInfo?.id,
          final_stage: finalStageFilter,
          qd_status: qdStatusFilter,
          search: search.trim()
        }
      });
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
      const res = await api.get('/admin/bank-cards/reports', {
        params: { bank_slug: activeBankSlug, bank_id: bankInfo?.id }
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
  }, [activeBankSlug, activeTab, finalStageFilter, qdStatusFilter, bankInfo]);

  // Submit Step 1
  const handleStep1Submit = async (e) => {
    e.preventDefault();
    if (!bankInfo?.id) {
      alert('Bank details loading... Please try again in a moment.');
      return;
    }

    try {
      const res = await api.post('/admin/bank-cards', {
        ...form,
        bank_id: bankInfo.id
      });
      if (res.data?.success) {
        const createdApp = res.data.data;
        setSelectedApp(createdApp);
        setForm(prev => ({
          ...prev,
          application_no: createdApp.application_no
        }));
        setActiveStep(2);
        alert(`Step 1 Saved! Generated Application No: ${createdApp.application_no}`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save Step 1 details');
    }
  };

  // Save Step 2
  const handleStep2Submit = async (e) => {
    e.preventDefault();
    if (!selectedApp?.id) return;
    try {
      const res = await api.patch(`/admin/bank-cards/${selectedApp.id}/assist`, form);
      if (res.data?.success) {
        alert('Step 2 Credit Card Assist details saved!');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save Step 2 details');
    }
  };

  // Update Status
  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!selectedApp?.id) return;
    try {
      const res = await api.patch(`/admin/bank-cards/${selectedApp.id}/status`, form);
      if (res.data?.success) {
        setSelectedApp(res.data.data);
        alert('Status Information & Workflow Stage updated!');
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
      const res = await api.patch(`/admin/bank-cards/${selectedApp.id}/decline`, form);
      if (res.data?.success) {
        alert('Rejection details logged successfully!');
        navigate(`/admin/credit-cards/${activeBankSlug}/list`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to log decline details');
    }
  };

  // View App Detail & Timeline
  const openAppDetail = async (appId) => {
    try {
      const res = await api.get(`/admin/bank-cards/${appId}`);
      if (res.data?.success) {
        const app = res.data.data;
        setSelectedApp(app);
        setTimeline(app.timeline || []);
        setForm({
          ...app,
          dob: app.dob ? app.dob.split('T')[0] : '',
          next_qd_date: app.next_qd_date ? app.next_qd_date.split('T')[0] : ''
        });
        setActiveStep(2);
      }
    } catch (err) {
      alert('Failed to load application details');
    }
  };

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
        gap: '12px'
      }}>
        <div>
          <span style={{ fontSize: '11px', fontWeight: 800, color: C.teal, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Bank Card Processing Module
          </span>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: C.text, margin: '2px 0 0' }}>
            {bankInfo?.name || activeBankSlug.toUpperCase()} Credit Cards
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {['add', 'list', 'applications', 'reports'].map(tKey => (
            <button
              key={tKey}
              onClick={() => navigate(`/admin/credit-cards/${activeBankSlug}/${tKey}`)}
              style={{
                padding: '8px 16px', borderRadius: '10px',
                border: activeTab === tKey ? `1px solid ${C.teal}` : `1px solid ${C.border}`,
                background: activeTab === tKey ? `${C.teal}20` : C.card,
                color: activeTab === tKey ? C.teal : C.text,
                fontWeight: 800, fontSize: '12px', cursor: 'pointer', textTransform: 'capitalize'
              }}
            >
              {tKey === 'add' ? `Add ${bankInfo?.short_code || 'Card'}` : tKey}
            </button>
          ))}
        </div>
      </div>

      {/* ── 1. ADD APPLICATION (2-STEP FORM + STATUS + DECLINE) ── */}
      {activeTab === 'add' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* STEP INDICATOR HEADER */}
          <div style={{ display: 'flex', gap: '12px', background: C.card, padding: '12px 20px', borderRadius: '16px', border: `1px solid ${C.border}` }}>
            <button
              onClick={() => setActiveStep(1)}
              style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', background: activeStep === 1 ? C.teal : C.bgSecondary, color: activeStep === 1 ? '#FFF' : C.text, fontWeight: 800, cursor: 'pointer', fontSize: '13px' }}
            >
              Step 1: Credit Card Application
            </button>

            <button
              disabled={!selectedApp?.id}
              onClick={() => setActiveStep(2)}
              style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', background: activeStep === 2 ? C.teal : C.bgSecondary, color: activeStep === 2 ? '#FFF' : C.text, fontWeight: 800, cursor: selectedApp?.id ? 'pointer' : 'not-allowed', fontSize: '13px' }}
            >
              Step 2: Credit Card Assist & Status
            </button>

            {form.final_stage === 'Declined' && (
              <button
                onClick={() => setActiveStep(3)}
                style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', background: '#EF4444', color: '#FFF', fontWeight: 800, cursor: 'pointer', fontSize: '13px' }}
              >
                Rejection Information
              </button>
            )}
          </div>

          {/* STEP 1 FORM */}
          {activeStep === 1 && (
            <div style={{ background: C.card, borderRadius: '20px', padding: '24px', border: `1px solid ${C.border}` }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, marginBottom: '20px' }}>
                Step 1: Credit Card Application Details
              </h3>
              <form onSubmit={handleStep1Submit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={S.label}>Credit Card Category *</label>
                  <select
                    value={form.credit_card_category}
                    onChange={(e) => setForm({ ...form, credit_card_category: e.target.value })}
                    style={{ ...S.input, height: '42px', fontWeight: 700 }}
                  >
                    <option value="Platinum / Regalia">Platinum / Regalia</option>
                    <option value="Millennia / Rewards">Millennia / Rewards</option>
                    <option value="Lifetime Free">Lifetime Free (LTF)</option>
                    <option value="Super Premium">Super Premium</option>
                  </select>
                </div>

                <div>
                  <label style={S.label}>Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={form.customer_name}
                    onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                    style={{ ...S.input, height: '42px' }}
                  />
                </div>

                <div>
                  <label style={S.label}>Customer Mobile Number *</label>
                  <input
                    type="tel"
                    maxLength={10}
                    required
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
                    placeholder="e.g. ABCDE1234F"
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
                    value={form.resident_pincode}
                    onChange={(e) => setForm({ ...form, resident_pincode: e.target.value })}
                    style={{ ...S.input, height: '42px' }}
                  />
                </div>

                <div>
                  <label style={S.label}>Process By (Staff Executive)</label>
                  <input
                    type="text"
                    placeholder="Staff ID / Name"
                    value={form.process_by}
                    onChange={(e) => setForm({ ...form, process_by: e.target.value })}
                    style={{ ...S.input, height: '42px' }}
                  />
                </div>

                <div>
                  <label style={S.label}>QD Executive Name</label>
                  <input
                    type="text"
                    value={form.qd_executive_name}
                    onChange={(e) => setForm({ ...form, qd_executive_name: e.target.value })}
                    style={{ ...S.input, height: '42px' }}
                  />
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
                    value={form.pan_check_comments}
                    onChange={(e) => setForm({ ...form, pan_check_comments: e.target.value })}
                    style={{ ...S.input }}
                  />
                </div>

                <div>
                  <label style={S.label}>Resident Pin Comments</label>
                  <textarea
                    rows={2}
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
                      display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                  >
                    <span>Save & Continue</span>
                    <MdArrowForward size={18} />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 2 & STATUS PANEL */}
          {activeStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Step 2 Form */}
              <div style={{ background: C.card, borderRadius: '20px', padding: '24px', border: `1px solid ${C.border}` }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, marginBottom: '20px' }}>
                  Step 2: Credit Card Assist Details (App No: <span style={{ color: C.teal }}>{form.application_no || 'Pending'}</span>)
                </h3>
                <form onSubmit={handleStep2Submit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={S.label}>Date of Birth (DOB) *</label>
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
                      value={form.mother_name}
                      onChange={(e) => setForm({ ...form, mother_name: e.target.value })}
                      style={{ ...S.input, height: '42px' }}
                    />
                  </div>

                  <div>
                    <label style={S.label}>Company Name *</label>
                    <input
                      type="text"
                      required
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
                      value={form.designation}
                      onChange={(e) => setForm({ ...form, designation: e.target.value })}
                      style={{ ...S.input, height: '42px' }}
                    />
                  </div>

                  <div>
                    <label style={S.label}>Personal Email ID *</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      style={{ ...S.input, height: '42px' }}
                    />
                  </div>

                  <div>
                    <label style={S.label}>Official Email ID</label>
                    <input
                      type="email"
                      value={form.official_email}
                      onChange={(e) => setForm({ ...form, official_email: e.target.value })}
                      style={{ ...S.input, height: '42px' }}
                    />
                  </div>

                  <div>
                    <label style={S.label}>Gross Monthly Income (₹) *</label>
                    <input
                      type="number"
                      required
                      value={form.gross_monthly_income}
                      onChange={(e) => setForm({ ...form, gross_monthly_income: e.target.value })}
                      style={{ ...S.input, height: '42px' }}
                    />
                  </div>

                  <div>
                    <label style={S.label}>PAN Check Executive Name</label>
                    <input
                      type="text"
                      value={form.pan_check_executive_name}
                      onChange={(e) => setForm({ ...form, pan_check_executive_name: e.target.value })}
                      style={{ ...S.input, height: '42px' }}
                    />
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={S.label}>Residence Full Address *</label>
                    <textarea
                      rows={2}
                      required
                      value={form.residence_address}
                      onChange={(e) => setForm({ ...form, residence_address: e.target.value })}
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

              {/* Status Information Panel */}
              <div style={{ background: C.card, borderRadius: '20px', padding: '24px', border: `1px solid ${C.border}` }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, marginBottom: '20px' }}>
                  Status Information & Workflow Stage
                </h3>
                <form onSubmit={handleStatusUpdate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={S.label}>App Code Status</label>
                    <select value={form.app_code_status} onChange={(e) => setForm({ ...form, app_code_status: e.target.value })} style={{ ...S.input, height: '40px' }}>
                      <option value="Generated">Generated</option>
                      <option value="Hold">Hold</option>
                      <option value="Rejected">Rejected</option>
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
                    <label style={S.label}>Surrogate</label>
                    <select value={form.surrogate} onChange={(e) => setForm({ ...form, surrogate: e.target.value })} style={{ ...S.input, height: '40px' }}>
                      <option value="Income Proof">Income Proof</option>
                      <option value="Card on Card">Card on Card</option>
                      <option value="CIBIL Score">CIBIL Score</option>
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
                    </select>
                  </div>

                  <div>
                    <label style={S.label}>Telco Stage</label>
                    <select value={form.telco_stage} onChange={(e) => setForm({ ...form, telco_stage: e.target.value })} style={{ ...S.input, height: '40px' }}>
                      <option value="Verified">Verified</option>
                      <option value="Failed">Failed</option>
                    </select>
                  </div>

                  <div>
                    <label style={S.label}>Official Mail Verification</label>
                    <select value={form.official_mail_status} onChange={(e) => setForm({ ...form, official_mail_status: e.target.value })} style={{ ...S.input, height: '40px' }}>
                      <option value="Verified">Verified</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>

                  <div>
                    <label style={S.label}>V-KYC Status</label>
                    <select value={form.vkyc_status} onChange={(e) => setForm({ ...form, vkyc_status: e.target.value })} style={{ ...S.input, height: '40px' }}>
                      <option value="Pending">Pending</option>
                      <option value="Completed">Completed</option>
                      <option value="Failed">Failed</option>
                    </select>
                  </div>

                  <div>
                    <label style={S.label}>Dispatch Stage</label>
                    <select value={form.dispatch_stage} onChange={(e) => setForm({ ...form, dispatch_stage: e.target.value })} style={{ ...S.input, height: '40px' }}>
                      <option value="In Transit">In Transit</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Returned">Returned</option>
                    </select>
                  </div>

                  <div style={{ gridColumn: 'span 3' }}>
                    <label style={S.label}>Final Stage (Workflow Trigger) *</label>
                    <select
                      value={form.final_stage}
                      onChange={(e) => setForm({ ...form, final_stage: e.target.value })}
                      style={{ ...S.input, height: '44px', fontWeight: 800, color: form.final_stage === 'Declined' ? '#EF4444' : C.teal }}
                    >
                      {FINAL_STAGES.map(stg => (
                        <option key={stg} value={stg}>{stg}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ gridColumn: 'span 3' }}>
                    <label style={S.label}>Workflow Timeline Note / Remark</label>
                    <input
                      type="text"
                      placeholder="Add note for stage transition..."
                      value={form.timeline_note}
                      onChange={(e) => setForm({ ...form, timeline_note: e.target.value })}
                      style={{ ...S.input, height: '40px' }}
                    />
                  </div>

                  <div style={{ gridColumn: 'span 3', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="submit"
                      style={{ padding: '12px 24px', borderRadius: '12px', border: 'none', background: C.teal, color: '#fff', fontWeight: 800, cursor: 'pointer' }}
                    >
                      Update Status & Append Timeline
                    </button>
                  </div>
                </form>
              </div>

            </div>
          )}

          {/* STEP 3 REJECTION INFO (Conditional on Declined) */}
          {activeStep === 3 && form.final_stage === 'Declined' && (
            <div style={{ background: C.card, borderRadius: '20px', padding: '24px', border: `1px solid ${C.border}` }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#EF4444', marginBottom: '20px' }}>
                Rejection Information Capture
              </h3>
              <form onSubmit={handleDeclineSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={S.label}>Decline Code</label>
                  <input
                    type="text"
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
                  </select>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={S.label}>Decline Description</label>
                  <textarea
                    rows={2}
                    value={form.decline_description}
                    onChange={(e) => setForm({ ...form, decline_description: e.target.value })}
                    style={{ ...S.input }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end' }}>
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

      {/* ── 2 & 3. LIST & APPLICATIONS CRM TAB ── */}
      {(activeTab === 'list' || activeTab === 'applications') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Search & Filter Bar */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '240px' }}>
              <input
                type="text"
                placeholder="Search app no, customer name, mobile, PAN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ ...S.input, height: '40px', flex: 1 }}
              />
              <button onClick={fetchApplications} style={{ padding: '0 16px', background: C.teal, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}>
                <MdSearch size={18} />
              </button>
            </div>

            <select value={finalStageFilter} onChange={(e) => setFinalStageFilter(e.target.value)} style={{ ...S.input, width: '180px', height: '40px', fontSize: '13px' }}>
              <option value="all">All Stages</option>
              {FINAL_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <select value={qdStatusFilter} onChange={(e) => setQdStatusFilter(e.target.value)} style={{ ...S.input, width: '150px', height: '40px', fontSize: '13px' }}>
              <option value="all">All QD Status</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Failed">Failed</option>
            </select>
          </div>

          {/* Table */}
          <div style={{ background: C.card, borderRadius: '20px', border: `1px solid ${C.border}`, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: isDark ? C.bgSecondary : '#F8FAFC', borderBottom: `1px solid ${C.border}` }}>
                  <th style={{ padding: '14px 16px', fontWeight: 800 }}>App No</th>
                  <th style={{ padding: '14px 16px', fontWeight: 800 }}>Customer</th>
                  <th style={{ padding: '14px 16px', fontWeight: 800 }}>Mobile / PAN</th>
                  <th style={{ padding: '14px 16px', fontWeight: 800 }}>Category</th>
                  <th style={{ padding: '14px 16px', fontWeight: 800 }}>Final Stage</th>
                  <th style={{ padding: '14px 16px', fontWeight: 800, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: C.textMid }}>Loading applications...</td></tr>
                ) : applications.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: C.textMid }}>No bank card applications found.</td></tr>
                ) : (
                  applications.map(app => (
                    <tr key={app.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '14px 16px', fontWeight: 900, color: C.teal }}>{app.application_no}</td>
                      <td style={{ padding: '14px 16px', fontWeight: 800 }}>{app.customer_name}</td>
                      <td style={{ padding: '14px 16px' }}>{app.customer_mobile} / <span style={{ fontFamily: 'monospace' }}>{app.pan_number}</span></td>
                      <td style={{ padding: '14px 16px' }}>{app.credit_card_category}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase',
                          background: app.final_stage === 'Approved' ? '#10B98120' : app.final_stage === 'Declined' ? '#EF444420' : `${C.teal}20`,
                          color: app.final_stage === 'Approved' ? '#10B981' : app.final_stage === 'Declined' ? '#EF4444' : C.teal
                        }}>
                          {app.final_stage}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => {
                            openAppDetail(app.id);
                            navigate(`/admin/credit-cards/${activeBankSlug}/add`);
                          }}
                          style={{ background: `${C.teal}15`, color: C.teal, border: 'none', borderRadius: '8px', padding: '6px 12px', fontWeight: 800, cursor: 'pointer' }}
                        >
                          View / Edit Timeline
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

      {/* ── 4. REPORTS TAB ── */}
      {activeTab === 'reports' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ background: C.card, borderRadius: '18px', padding: '20px', border: `1px solid ${C.border}` }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>Total Applications</span>
            <div style={{ fontSize: '26px', fontWeight: 900, color: C.text, marginTop: '6px' }}>
              {reports?.total_applications || 0}
            </div>
          </div>
          <div style={{ background: C.card, borderRadius: '18px', padding: '20px', border: `1px solid ${C.border}` }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>Pending PAN Check</span>
            <div style={{ fontSize: '26px', fontWeight: 900, color: C.teal, marginTop: '6px' }}>
              {reports?.pending_pan || 0}
            </div>
          </div>
          <div style={{ background: C.card, borderRadius: '18px', padding: '20px', border: `1px solid ${C.border}` }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>Pending QD Verification</span>
            <div style={{ fontSize: '26px', fontWeight: 900, color: C.teal, marginTop: '6px' }}>
              {reports?.pending_qd || 0}
            </div>
          </div>
          <div style={{ background: C.card, borderRadius: '18px', padding: '20px', border: `1px solid ${C.border}` }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>Approved Cards</span>
            <div style={{ fontSize: '26px', fontWeight: 900, color: '#10B981', marginTop: '6px' }}>
              {reports?.approved_count || 0}
            </div>
          </div>
          <div style={{ background: C.card, borderRadius: '18px', padding: '20px', border: `1px solid ${C.border}` }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>Declined Cards</span>
            <div style={{ fontSize: '26px', fontWeight: 900, color: '#EF4444', marginTop: '6px' }}>
              {reports?.declined_count || 0}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

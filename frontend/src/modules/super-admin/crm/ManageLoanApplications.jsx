import React, { useState, useEffect } from 'react';
import { 
  FaDownload, FaBriefcase, FaBolt, FaShoppingBag, FaCheckCircle, 
  FaCoins, FaSyncAlt, FaMobileAlt, FaExclamationTriangle, FaCheck,
  FaPlus, FaEdit, FaEye, FaArrowRight, FaCreditCard, FaFileContract,
  FaPercentage, FaCalendarAlt, FaUniversity, FaUserCheck, FaTimes
} from 'react-icons/fa';
import api from "../../../services/api";
import { useTheme, makeS } from "../../../contexts/ThemeContext";

const PAN_CHECK_REMARK_OPTIONS = [
  { code: 'CLEAN', label: 'Clean PAN & Good CIBIL Score' },
  { code: 'DP_DELINQUENT', label: 'DP / Past Delinquent Record' },
  { code: 'NAME_MISMATCH', label: 'Name Mismatch on Bank DB' },
  { code: 'CIBIL_LOW', label: 'CIBIL Score Below Eligibility Threshold' },
  { code: 'RECENT_REJECTION', label: 'Recent Bank Rejection within 90 Days' },
  { code: 'PINCODE_UNSERVICED', label: 'Resident Pincode Unserviced by Bank' }
];

export default function ManageLoanApplications() {
  const { C, isDark } = useTheme();
  const S = makeS(C);

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Listing & Filter State
  const [activeCategory, setActiveCategory] = useState("all");
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [exporting, setExporting] = useState(false);

  // Modal & Form State for Loan Processing
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [activeLoanStep, setActiveLoanStep] = useState(1); // 1: Loan QD Form, 2: Loan Remark Form, 3: Loan Disbursal & Final Stage
  const [selectedLead, setSelectedLead] = useState(null);

  const [loanForm, setLoanForm] = useState({
    // Step 1: Loan QD Form
    id: null,
    category: 'loan_on_credit_card', // 'loan_on_credit_card' or 'smart_emi'
    bank_name: '',
    card_name: '',
    customer_name: '',
    mobile: '',
    pan_number: '',
    resident_pincode: '',
    existing_card_last4: '',
    credit_limit: '',
    requested_loan_amount: '',
    gross_monthly_income: '',
    processed_by: '',
    qd_executive_name: '',
    next_qd_date: '',
    pan_check_comments: 'CLEAN',
    resident_pin_comments: '',

    // Step 2: Loan Assist & Remark Form
    dob: '',
    mother_name: '',
    residence_address: '',
    company_name: '',
    designation: '',
    personal_email: '',
    official_email: '',
    sanctioned_loan_amount: '',
    interest_rate: '12.5',
    tenure_months: '24',
    monthly_emi: '',
    processing_fee: '',
    disbursed_amount: '',
    repayment_account_no: '',
    repayment_ifsc: '',
    bank_reference_no: '',

    // Step 3: Loan Disbursal Workflow & Status
    status: 'verified', // 'verified', 'operational_verified', 'approved', 'disbursed', 'rejected'
    final_stage: 'Loan QD Verification',
    qd_status: 'Cleared',
    disbursal_utr: '',
    decline_reason: '',
    curable_notes: ''
  });

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const res = await api.get("/superadmin/crm/bulk-export", { params: { type: 'loan_applications' }, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'loan_applications_export.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (e) {
      console.error(e);
      setErr("Failed to export loan applications.");
    } finally {
      setExporting(false);
    }
  };

  const fetchLeads = async () => {
    setLoading(true);
    setErr("");
    try {
      const categoryParam = activeCategory === "all" ? "loan_applications" : activeCategory;
      const res = await api.get("/card-applications", {
        params: {
          page,
          limit: 15,
          category: categoryParam,
          search: search || undefined,
        },
      });
      if (res.data?.success) {
        setLeads(res.data.data || []);
        setTotal(res.data.pagination?.total || (res.data.data || []).length);
      } else {
        setErr(res.data?.message || "Failed to load loan applications");
      }
    } catch (e) {
      console.error(e);
      setErr(e.response?.data?.message || "Failed to load loan applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [page, activeCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLeads();
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const res = await api.put(`/card-applications/${id}/status`, { status: newStatus });
      if (res.data?.success) {
        setSuccessMsg("Loan application status updated successfully");
        setTimeout(() => setSuccessMsg(""), 3000);
        fetchLeads();
      }
    } catch (e) {
      console.error("Failed to update status", e);
      setErr("Failed to update status");
    }
  };

  const openNewLoanForm = () => {
    setSelectedLead(null);
    setLoanForm({
      id: null,
      category: 'loan_on_credit_card',
      bank_name: 'HDFC Bank',
      card_name: 'Jumbo Loan on Credit Card',
      customer_name: '',
      mobile: '',
      pan_number: '',
      resident_pincode: '',
      existing_card_last4: '',
      credit_limit: '',
      requested_loan_amount: '',
      gross_monthly_income: '',
      processed_by: '',
      qd_executive_name: '',
      next_qd_date: '',
      pan_check_comments: 'CLEAN',
      resident_pin_comments: '',
      dob: '',
      mother_name: '',
      residence_address: '',
      company_name: '',
      designation: '',
      personal_email: '',
      official_email: '',
      sanctioned_loan_amount: '',
      interest_rate: '12.5',
      tenure_months: '24',
      monthly_emi: '',
      processing_fee: '',
      disbursed_amount: '',
      repayment_account_no: '',
      repayment_ifsc: '',
      bank_reference_no: '',
      status: 'verified',
      final_stage: 'Loan QD Verification',
      qd_status: 'Cleared',
      disbursal_utr: '',
      decline_reason: '',
      curable_notes: ''
    });
    setActiveLoanStep(1);
    setShowLoanModal(true);
  };

  const openEditLoanForm = (lead) => {
    setSelectedLead(lead);
    const isEmi = lead.category === 'smart_emi' || lead.card_name?.toLowerCase().includes('emi');
    setLoanForm({
      id: lead.id,
      category: isEmi ? 'smart_emi' : 'loan_on_credit_card',
      bank_name: lead.bank_name || 'Partner Bank',
      card_name: lead.card_name || 'Loan on Credit Card',
      customer_name: lead.customer_name || '',
      mobile: lead.mobile || '',
      pan_number: lead.pan_number || '',
      resident_pincode: lead.resident_pincode || '',
      existing_card_last4: lead.existing_card_last4 || '',
      credit_limit: lead.credit_limit || '',
      requested_loan_amount: lead.requested_loan_amount || '',
      gross_monthly_income: lead.gross_monthly_income || '',
      processed_by: lead.processed_by || '',
      qd_executive_name: lead.qd_executive_name || '',
      next_qd_date: lead.next_qd_date || '',
      pan_check_comments: lead.pan_check_comments || 'CLEAN',
      resident_pin_comments: lead.resident_pin_comments || '',
      dob: lead.dob || '',
      mother_name: lead.mother_name || '',
      residence_address: lead.residence_address || '',
      company_name: lead.company_name || '',
      designation: lead.designation || '',
      personal_email: lead.personal_email || '',
      official_email: lead.official_email || '',
      sanctioned_loan_amount: lead.sanctioned_loan_amount || lead.requested_loan_amount || '',
      interest_rate: lead.interest_rate || '12.5',
      tenure_months: lead.tenure_months || '24',
      monthly_emi: lead.monthly_emi || '',
      processing_fee: lead.processing_fee || '',
      disbursed_amount: lead.disbursed_amount || '',
      repayment_account_no: lead.repayment_account_no || '',
      repayment_ifsc: lead.repayment_ifsc || '',
      bank_reference_no: lead.bank_reference_no || '',
      status: lead.status || 'verified',
      final_stage: lead.final_stage || 'Loan QD Verification',
      qd_status: lead.qd_status || 'Cleared',
      disbursal_utr: lead.disbursal_utr || '',
      decline_reason: lead.decline_reason || '',
      curable_notes: lead.curable_notes || ''
    });
    setActiveLoanStep(1);
    setShowLoanModal(true);
  };

  const handleSaveLoanForm = async (e) => {
    e.preventDefault();
    try {
      if (loanForm.id) {
        // Update existing application
        await handleStatusUpdate(loanForm.id, loanForm.status);
        alert('Loan Application details updated successfully!');
      } else {
        // Submit new loan application lead
        const res = await api.post('/card-applications', {
          customerName: loanForm.customer_name,
          mobile: loanForm.mobile,
          bankName: loanForm.bank_name,
          cardName: loanForm.card_name,
          category: loanForm.category
        });
        if (res.data?.success) {
          alert('New Loan Application created successfully!');
          fetchLeads();
        }
      }
      setShowLoanModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save loan application');
    }
  };

  // Auto calculate EMI & Net Disbursed Amount in form
  useEffect(() => {
    const P = parseFloat(loanForm.sanctioned_loan_amount || loanForm.requested_loan_amount || 0);
    const r = parseFloat(loanForm.interest_rate || 0) / 12 / 100;
    const n = parseInt(loanForm.tenure_months || 0);
    const fee = parseFloat(loanForm.processing_fee || 0);

    if (P > 0 && r > 0 && n > 0) {
      const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      setLoanForm(prev => ({
        ...prev,
        monthly_emi: Math.round(emi).toString(),
        disbursed_amount: Math.max(0, P - fee).toString()
      }));
    }
  }, [loanForm.sanctioned_loan_amount, loanForm.requested_loan_amount, loanForm.interest_rate, loanForm.tenure_months, loanForm.processing_fee]);

  // Helper stats
  const loanOnCardCount = leads.filter(l => l.category === 'loan_on_credit_card' || l.card_name?.toLowerCase().includes('loan')).length;
  const smartEmiCount = leads.filter(l => l.category === 'smart_emi' || l.card_name?.toLowerCase().includes('emi')).length;
  const verifiedCount = leads.filter(l => l.status === 'verified' || l.status === 'operational_verified' || l.status === 'approved' || l.status === 'disbursed').length;

  const categories = [
    { id: "all", label: "All Loan Applications", icon: <FaCoins size={14} /> },
    { id: "loan_on_credit_card", label: "Loan on Credit Card", icon: <FaBolt size={14} /> },
    { id: "smart_emi", label: "Smart EMI on Credit Card", icon: <FaShoppingBag size={14} /> },
  ];

  return (
    <div style={{ padding: "20px 0", fontFamily: "'Inter', sans-serif" }}>
      {/* Title & Top Action Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontSize: "26px", fontWeight: 800, color: C.text, margin: 0, letterSpacing: "-0.5px" }}>
            Loan Applications Management
          </h2>
          <p style={{ fontSize: "13.5px", color: C.textLight, margin: "6px 0 0 0", lineHeight: 1.4 }}>
            Manage Loan on Credit Card and Smart EMI conversions with custom Loan QD, Assist, and Disbursal workflow forms.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={openNewLoanForm}
            style={{
              padding: "12px 22px", borderRadius: "12px", border: "none",
              background: C.teal, color: "#FFFFFF", fontWeight: 800, fontSize: "14px",
              cursor: "pointer", display: "flex", alignItems: "center", gap: "8px",
              boxShadow: `0 4px 14px ${C.teal}30`
            }}
          >
            <FaPlus size={13} />
            <span>New Loan Application</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={exporting}
            style={{
              padding: "12px 20px", borderRadius: "12px", border: `1px solid ${C.teal}`,
              background: "transparent", color: C.teal, fontWeight: 800, fontSize: "14px",
              cursor: "pointer", display: "flex", alignItems: "center", gap: "8px"
            }}
          >
            <FaDownload size={14} />
            <span>{exporting ? "Exporting..." : "Export CSV"}</span>
          </button>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fit, minmax(220px, 1fr))", gap: isMobile ? "10px" : "16px", marginBottom: "24px" }}>
        <div style={{ ...S.card, display: "flex", alignItems: "center", gap: "14px", padding: isMobile ? "12px" : "18px" }}>
          <div style={{ width: "42px", height: "42px", background: `${C.primary}15`, borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", color: C.primary, fontSize: "18px", flexShrink: 0 }}>
            <FaBriefcase size={20} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: isMobile ? "18px" : "22px", fontWeight: 800, color: C.text }}>{total}</div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: C.textLight, textTransform: "uppercase", marginTop: "2px" }}>Total Loan Apps</div>
          </div>
        </div>

        <div style={{ ...S.card, display: "flex", alignItems: "center", gap: "14px", padding: isMobile ? "12px" : "18px" }}>
          <div style={{ width: "42px", height: "42px", background: `${C.teal}15`, borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", color: C.teal, fontSize: "18px", flexShrink: 0 }}>
            <FaBolt size={20} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: isMobile ? "18px" : "22px", fontWeight: 800, color: C.text }}>{loanOnCardCount}</div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: C.textLight, textTransform: "uppercase", marginTop: "2px" }}>Loan on Card</div>
          </div>
        </div>

        <div style={{ ...S.card, display: "flex", alignItems: "center", gap: "14px", padding: isMobile ? "12px" : "18px" }}>
          <div style={{ width: "42px", height: "42px", background: `${C.gold}15`, borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", color: C.gold, fontSize: "18px", flexShrink: 0 }}>
            <FaShoppingBag size={20} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: isMobile ? "18px" : "22px", fontWeight: 800, color: C.text }}>{smartEmiCount}</div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: C.textLight, textTransform: "uppercase", marginTop: "2px" }}>Smart EMI</div>
          </div>
        </div>

        <div style={{ ...S.card, display: "flex", alignItems: "center", gap: "14px", padding: isMobile ? "12px" : "18px" }}>
          <div style={{ width: "42px", height: "42px", background: `${C.green}15`, borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", color: C.green, fontSize: "18px", flexShrink: 0 }}>
            <FaCheckCircle size={20} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: isMobile ? "18px" : "22px", fontWeight: 800, color: C.text }}>{verifiedCount}</div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: C.textLight, textTransform: "uppercase", marginTop: "2px" }}>Verified / Disbursed</div>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", overflowX: "auto", paddingBottom: "4px" }}>
        {categories.map(cat => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => { setActiveCategory(cat.id); setPage(1); }}
              style={{
                padding: "10px 20px", borderRadius: "12px",
                border: `1.5px solid ${isActive ? C.primary : C.border}`,
                background: isActive ? `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)` : C.card,
                color: isActive ? "#FFFFFF" : C.text,
                fontWeight: 800, fontSize: "13.5px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s",
                whiteSpace: "nowrap", flexShrink: 0
              }}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div style={{ ...S.card, padding: "18px", marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", flex: 1, gap: "12px", maxWidth: isMobile ? "100%" : "500px", width: "100%" }}>
          <input
            style={{ ...S.input, margin: 0, flex: 1 }}
            placeholder="Search by customer name, mobile, bank, scheme..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" style={{ ...S.btn("primary", false), padding: "10px 20px", fontSize: "13px", fontWeight: 700, flexShrink: 0 }}>
            Search
          </button>
        </form>

        <button 
          onClick={fetchLeads}
          style={{ background: `${C.teal}10`, border: `1px solid ${C.teal}35`, color: C.teal, borderRadius: "10px", padding: "10px 18px", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: isMobile ? "100%" : "auto" }}
        >
          <FaSyncAlt size={14} />
          <span>Refresh Table</span>
        </button>
      </div>

      {/* Notifications */}
      {err && (
        <div style={{ padding: "14px 18px", background: `${C.red}10`, border: `1px solid ${C.red}25`, borderRadius: "14px", color: C.red, marginBottom: "20px", fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
          <FaExclamationTriangle size={16} /> {err}
        </div>
      )}
      {successMsg && (
        <div style={{ padding: "14px 18px", background: `${C.green}10`, border: `1px solid ${C.green}25`, borderRadius: "14px", color: C.green, marginBottom: "20px", fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
          <FaCheck size={16} /> {successMsg}
        </div>
      )}

      {/* Data Table */}
      <div style={{ ...S.card, padding: 0, overflow: "hidden", border: `1px solid ${C.border}` }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "50px", color: C.textLight }}>
            <div style={{ width: "24px", height: "24px", border: `3px solid ${C.primary}`, borderTopColor: "transparent", borderRadius: "50%", margin: "0 auto 12px", animation: "spin 1s linear infinite" }}></div>
            Fetching loan applications...
          </div>
        ) : leads.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px", color: C.textLight, fontSize: "14.5px" }}>
            No loan applications found.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, color: C.textLight, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  <th style={{ padding: "16px 20px" }}>Date</th>
                  <th style={{ padding: "16px 20px" }}>Category</th>
                  <th style={{ padding: "16px 20px" }}>Customer Details</th>
                  <th style={{ padding: "16px 20px" }}>Bank / Provider</th>
                  <th style={{ padding: "16px 20px" }}>Product / Scheme</th>
                  <th style={{ padding: "16px 20px" }}>Status</th>
                  <th style={{ padding: "16px 20px", textAlign: "center" }}>Loan Action</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: "13.5px", color: C.text }}>
                {leads.map((lead) => {
                  const isEmi = lead.category === 'smart_emi' || lead.card_name?.toLowerCase().includes('emi');
                  const catLabel = isEmi ? 'Smart EMI' : 'Loan on Credit Card';
                  const badgeBg = isEmi ? `${C.gold}15` : `${C.primary}15`;
                  const badgeColor = isEmi ? C.gold : C.primary;

                  return (
                    <tr key={lead.id} style={{ borderBottom: `1px solid ${C.border}50` }}>
                      <td style={{ padding: "16px 20px", color: C.textLight }}>
                        {new Date(lead.created_at).toLocaleString("en-IN", {
                          day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                        })}
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 800, background: badgeBg, color: badgeColor, padding: "4px 10px", borderRadius: "8px", textTransform: "uppercase" }}>
                          {catLabel}
                        </span>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ fontWeight: 700, fontSize: "14.5px" }}>{lead.customer_name}</div>
                        <div style={{ color: C.textLight, fontSize: "12px", marginTop: "2px", fontWeight: 500, display: "flex", alignItems: "center", gap: "4px" }}>
                          <FaMobileAlt size={12} />
                          <span>{lead.mobile}</span>
                        </div>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 800, background: `${C.teal}12`, color: C.teal, padding: "4px 10px", borderRadius: "8px", textTransform: "uppercase" }}>
                          {lead.bank_name || 'Partner Bank'}
                        </span>
                      </td>
                      <td style={{ padding: "16px 20px", fontWeight: 600 }}>{lead.card_name}</td>
                      <td style={{ padding: "16px 20px" }}>
                        <select
                          value={lead.status || 'verified'}
                          onChange={(e) => handleStatusUpdate(lead.id, e.target.value)}
                          style={{
                            padding: "6px 10px", borderRadius: "8px",
                            border: `1px solid ${C.border}`, background: C.inputBg,
                            color: C.text, fontSize: "12px", fontWeight: 700, cursor: "pointer"
                          }}
                        >
                          <option value="verified">Verified</option>
                          <option value="operational_verified">Operational Verified</option>
                          <option value="approved">Approved</option>
                          <option value="disbursed">Disbursed</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>
                      <td style={{ padding: "16px 20px", textAlign: "center" }}>
                        <button
                          onClick={() => openEditLoanForm(lead)}
                          style={{
                            padding: "8px 14px", borderRadius: "8px",
                            border: `1px solid ${C.teal}`, background: `${C.teal}15`,
                            color: C.teal, fontWeight: 800, fontSize: "12px",
                            cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px"
                          }}
                        >
                          <FaEdit size={12} /> Process Loan
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && total > 15 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderTop: `1px solid ${C.border}`, background: C.bgSecondary }}>
            <span style={{ fontSize: "12.5px", color: C.textLight }}>
              Showing page <b>{page}</b> of <b>{Math.ceil(total / 15)}</b> ({total} total loan apps)
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                style={{ ...S.btn("outline", false), padding: "8px 16px", fontSize: "12px", fontWeight: 700 }}
              >
                Previous
              </button>
              <button
                disabled={page * 15 >= total}
                onClick={() => setPage(page + 1)}
                style={{ ...S.btn("outline", false), padding: "8px 16px", fontSize: "12px", fontWeight: 700 }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── LOAN PROCESSING FORM MODAL (3 STEPS) ── */}
      {showLoanModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: C.card, borderRadius: '24px', border: `1px solid ${C.border}`, maxWidth: '840px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${C.border}`, paddingBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: C.teal, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  Loan Application Workflow
                </span>
                <h3 style={{ fontSize: '20px', fontWeight: 900, color: C.text, margin: '2px 0 0 0' }}>
                  {loanForm.id ? `Process Loan: ${loanForm.customer_name}` : 'New Loan Application Entry'}
                </h3>
              </div>
              <button onClick={() => setShowLoanModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', color: C.textLight, cursor: 'pointer' }}>
                <FaTimes />
              </button>
            </div>

            {/* 3 Step Indicator Tabs */}
            <div style={{ display: 'flex', gap: '10px', background: C.bgSecondary, padding: '6px', borderRadius: '14px', border: `1px solid ${C.border}` }}>
              <button
                onClick={() => setActiveLoanStep(1)}
                style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: activeLoanStep === 1 ? C.teal : 'transparent', color: activeLoanStep === 1 ? '#FFF' : C.textLight, fontWeight: 800, fontSize: '12.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <span>Step 1: Loan QD Form</span>
              </button>

              <button
                onClick={() => setActiveLoanStep(2)}
                style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: activeLoanStep === 2 ? C.teal : 'transparent', color: activeLoanStep === 2 ? '#FFF' : C.textLight, fontWeight: 800, fontSize: '12.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <span>Step 2: Loan Assist & Remarks</span>
              </button>

              <button
                onClick={() => setActiveLoanStep(3)}
                style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: activeLoanStep === 3 ? C.teal : 'transparent', color: activeLoanStep === 3 ? '#FFF' : C.textLight, fontWeight: 800, fontSize: '12.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <span>Step 3: Loan Disbursal Workflow</span>
              </button>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSaveLoanForm} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* STEP 1: LOAN QD FORM */}
              {activeLoanStep === 1 && (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, display: 'block', marginBottom: '4px' }}>LOAN CATEGORY *</label>
                    <select
                      value={loanForm.category}
                      onChange={(e) => setLoanForm({ ...loanForm, category: e.target.value })}
                      style={{ ...S.input, margin: 0, height: '42px', fontWeight: 700 }}
                    >
                      <option value="loan_on_credit_card">Loan on Credit Card</option>
                      <option value="smart_emi">Smart EMI on Credit Card</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, display: 'block', marginBottom: '4px' }}>BANK / PROVIDER NAME *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. HDFC Bank, ICICI Bank, SBI"
                      value={loanForm.bank_name}
                      onChange={(e) => setLoanForm({ ...loanForm, bank_name: e.target.value })}
                      style={{ ...S.input, margin: 0, height: '42px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, display: 'block', marginBottom: '4px' }}>SCHEME / PRODUCT NAME *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jumbo Loan / Smart EMI Conversion"
                      value={loanForm.card_name}
                      onChange={(e) => setLoanForm({ ...loanForm, card_name: e.target.value })}
                      style={{ ...S.input, margin: 0, height: '42px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, display: 'block', marginBottom: '4px' }}>CUSTOMER FULL NAME *</label>
                    <input
                      type="text"
                      required
                      placeholder="As per PAN card"
                      value={loanForm.customer_name}
                      onChange={(e) => setLoanForm({ ...loanForm, customer_name: e.target.value })}
                      style={{ ...S.input, margin: 0, height: '42px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, display: 'block', marginBottom: '4px' }}>MOBILE NUMBER *</label>
                    <input
                      type="tel"
                      maxLength={10}
                      required
                      placeholder="10-digit mobile"
                      value={loanForm.mobile}
                      onChange={(e) => setLoanForm({ ...loanForm, mobile: e.target.value.replace(/\D/g, '') })}
                      style={{ ...S.input, margin: 0, height: '42px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, display: 'block', marginBottom: '4px' }}>PAN NUMBER *</label>
                    <input
                      type="text"
                      maxLength={10}
                      required
                      placeholder="ABCDE1234F"
                      value={loanForm.pan_number}
                      onChange={(e) => setLoanForm({ ...loanForm, pan_number: e.target.value.toUpperCase() })}
                      style={{ ...S.input, margin: 0, height: '42px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, display: 'block', marginBottom: '4px' }}>RESIDENT PINCODE *</label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="6-digit pincode"
                      value={loanForm.resident_pincode}
                      onChange={(e) => setLoanForm({ ...loanForm, resident_pincode: e.target.value.replace(/\D/g, '') })}
                      style={{ ...S.input, margin: 0, height: '42px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, display: 'block', marginBottom: '4px' }}>EXISTING CREDIT CARD LAST 4 DIGITS</label>
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="e.g. 4812"
                      value={loanForm.existing_card_last4}
                      onChange={(e) => setLoanForm({ ...loanForm, existing_card_last4: e.target.value.replace(/\D/g, '') })}
                      style={{ ...S.input, margin: 0, height: '42px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, display: 'block', marginBottom: '4px' }}>CREDIT LIMIT ON CARD (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 250000"
                      value={loanForm.credit_limit}
                      onChange={(e) => setLoanForm({ ...loanForm, credit_limit: e.target.value })}
                      style={{ ...S.input, margin: 0, height: '42px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, display: 'block', marginBottom: '4px' }}>REQUESTED LOAN AMOUNT (₹) *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 150000"
                      value={loanForm.requested_loan_amount}
                      onChange={(e) => setLoanForm({ ...loanForm, requested_loan_amount: e.target.value })}
                      style={{ ...S.input, margin: 0, height: '42px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, display: 'block', marginBottom: '4px' }}>MONTHLY GROSS INCOME (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 65000"
                      value={loanForm.gross_monthly_income}
                      onChange={(e) => setLoanForm({ ...loanForm, gross_monthly_income: e.target.value })}
                      style={{ ...S.input, margin: 0, height: '42px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, display: 'block', marginBottom: '4px' }}>LOAN QD PAN CHECK REMARK</label>
                    <select
                      value={loanForm.pan_check_comments}
                      onChange={(e) => setLoanForm({ ...loanForm, pan_check_comments: e.target.value })}
                      style={{ ...S.input, margin: 0, height: '42px', fontWeight: 700 }}
                    >
                      {PAN_CHECK_REMARK_OPTIONS.map(opt => (
                        <option key={opt.code} value={opt.code}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* STEP 2: LOAN ASSIST & REMARKS FORM */}
              {activeLoanStep === 2 && (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, display: 'block', marginBottom: '4px' }}>DATE OF BIRTH</label>
                    <input
                      type="date"
                      value={loanForm.dob}
                      onChange={(e) => setLoanForm({ ...loanForm, dob: e.target.value })}
                      style={{ ...S.input, margin: 0, height: '42px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, display: 'block', marginBottom: '4px' }}>MOTHER'S FULL NAME</label>
                    <input
                      type="text"
                      placeholder="Mother's name"
                      value={loanForm.mother_name}
                      onChange={(e) => setLoanForm({ ...loanForm, mother_name: e.target.value })}
                      style={{ ...S.input, margin: 0, height: '42px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, display: 'block', marginBottom: '4px' }}>EMPLOYER / COMPANY NAME</label>
                    <input
                      type="text"
                      placeholder="e.g. TCS / Infosys / Self Employed"
                      value={loanForm.company_name}
                      onChange={(e) => setLoanForm({ ...loanForm, company_name: e.target.value })}
                      style={{ ...S.input, margin: 0, height: '42px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, display: 'block', marginBottom: '4px' }}>DESIGNATION</label>
                    <input
                      type="text"
                      placeholder="e.g. Senior Software Engineer"
                      value={loanForm.designation}
                      onChange={(e) => setLoanForm({ ...loanForm, designation: e.target.value })}
                      style={{ ...S.input, margin: 0, height: '42px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, display: 'block', marginBottom: '4px' }}>SANCTIONED LOAN AMOUNT (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 150000"
                      value={loanForm.sanctioned_loan_amount}
                      onChange={(e) => setLoanForm({ ...loanForm, sanctioned_loan_amount: e.target.value })}
                      style={{ ...S.input, margin: 0, height: '42px', fontWeight: 800, color: C.teal }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, display: 'block', marginBottom: '4px' }}>INTEREST RATE (% ROI P.A.)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="12.5"
                      value={loanForm.interest_rate}
                      onChange={(e) => setLoanForm({ ...loanForm, interest_rate: e.target.value })}
                      style={{ ...S.input, margin: 0, height: '42px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, display: 'block', marginBottom: '4px' }}>LOAN TENURE (MONTHS)</label>
                    <select
                      value={loanForm.tenure_months}
                      onChange={(e) => setLoanForm({ ...loanForm, tenure_months: e.target.value })}
                      style={{ ...S.input, margin: 0, height: '42px', fontWeight: 700 }}
                    >
                      <option value="6">6 Months</option>
                      <option value="12">12 Months</option>
                      <option value="18">18 Months</option>
                      <option value="24">24 Months</option>
                      <option value="36">36 Months</option>
                      <option value="48">48 Months</option>
                      <option value="60">60 Months</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, display: 'block', marginBottom: '4px' }}>ESTIMATED MONTHLY EMI (₹)</label>
                    <input
                      type="text"
                      readOnly
                      placeholder="Calculated EMI"
                      value={loanForm.monthly_emi ? `₹${loanForm.monthly_emi} / mo` : ''}
                      style={{ ...S.input, margin: 0, height: '42px', background: C.bgSecondary, fontWeight: 900, color: C.text }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, display: 'block', marginBottom: '4px' }}>PROCESSING FEE & CHARGES (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 1499"
                      value={loanForm.processing_fee}
                      onChange={(e) => setLoanForm({ ...loanForm, processing_fee: e.target.value })}
                      style={{ ...S.input, margin: 0, height: '42px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, display: 'block', marginBottom: '4px' }}>NET DISBURSED AMOUNT (₹)</label>
                    <input
                      type="text"
                      readOnly
                      placeholder="Net Amount credited to customer"
                      value={loanForm.disbursed_amount ? `₹${loanForm.disbursed_amount}` : ''}
                      style={{ ...S.input, margin: 0, height: '42px', background: C.bgSecondary, fontWeight: 900, color: '#10B981' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, display: 'block', marginBottom: '4px' }}>REPAYMENT BANK ACCOUNT NO</label>
                    <input
                      type="text"
                      placeholder="Customer bank account number"
                      value={loanForm.repayment_account_no}
                      onChange={(e) => setLoanForm({ ...loanForm, repayment_account_no: e.target.value })}
                      style={{ ...S.input, margin: 0, height: '42px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, display: 'block', marginBottom: '4px' }}>BANK LOAN REFERENCE NO / ACCOUNT NO</label>
                    <input
                      type="text"
                      placeholder="e.g. LN981293819"
                      value={loanForm.bank_reference_no}
                      onChange={(e) => setLoanForm({ ...loanForm, bank_reference_no: e.target.value })}
                      style={{ ...S.input, margin: 0, height: '42px' }}
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: LOAN DISBURSAL WORKFLOW & FINAL STAGE */}
              {activeLoanStep === 3 && (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, display: 'block', marginBottom: '4px' }}>LOAN STATUS *</label>
                    <select
                      value={loanForm.status}
                      onChange={(e) => setLoanForm({ ...loanForm, status: e.target.value })}
                      style={{ ...S.input, margin: 0, height: '42px', fontWeight: 800 }}
                    >
                      <option value="verified">Verified</option>
                      <option value="operational_verified">Operational Verified</option>
                      <option value="approved">Approved / Sanctioned</option>
                      <option value="disbursed">Disbursed (Success)</option>
                      <option value="rejected">Rejected / Declined</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, display: 'block', marginBottom: '4px' }}>WORKFLOW FINAL STAGE</label>
                    <select
                      value={loanForm.final_stage}
                      onChange={(e) => setLoanForm({ ...loanForm, final_stage: e.target.value })}
                      style={{ ...S.input, margin: 0, height: '42px', fontWeight: 700 }}
                    >
                      <option value="Customer Details">Customer Details</option>
                      <option value="PAN Check">PAN Check</option>
                      <option value="Loan QD Verification">Loan QD Verification</option>
                      <option value="Loan Sanction Approval">Loan Sanction Approval</option>
                      <option value="Document Upload">Document Upload</option>
                      <option value="V-KYC / Agreement">V-KYC / Agreement</option>
                      <option value="Disbursal In Transit">Disbursal In Transit</option>
                      <option value="Disbursed">Disbursed</option>
                      <option value="Declined">Declined</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, display: 'block', marginBottom: '4px' }}>DISBURSAL UTR / TRANSACTION REF NO</label>
                    <input
                      type="text"
                      placeholder="e.g. UTR98129381923"
                      value={loanForm.disbursal_utr}
                      onChange={(e) => setLoanForm({ ...loanForm, disbursal_utr: e.target.value })}
                      style={{ ...S.input, margin: 0, height: '42px', fontWeight: 700 }}
                    />
                  </div>

                  {loanForm.status === 'rejected' && (
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ fontSize: '11px', fontWeight: 800, color: C.red, display: 'block', marginBottom: '4px' }}>DECLINE REASON & NOTES</label>
                      <textarea
                        rows={3}
                        placeholder="Reason for loan rejection..."
                        value={loanForm.decline_reason}
                        onChange={(e) => setLoanForm({ ...loanForm, decline_reason: e.target.value })}
                        style={{ ...S.input, border: `1px solid ${C.red}` }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Form Navigation & Submit Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', borderTop: `1px solid ${C.border}`, paddingTop: '16px' }}>
                <div>
                  {activeLoanStep > 1 && (
                    <button
                      type="button"
                      onClick={() => setActiveLoanStep(prev => prev - 1)}
                      style={{ padding: '10px 18px', borderRadius: '10px', border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}
                    >
                      ← Previous Step
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  {activeLoanStep < 3 ? (
                    <button
                      type="button"
                      onClick={() => setActiveLoanStep(prev => prev + 1)}
                      style={{ padding: '10px 22px', borderRadius: '10px', border: 'none', background: C.teal, color: '#FFF', fontSize: '13px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <span>Next Step</span>
                      <FaArrowRight size={12} />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', background: '#10B981', color: '#FFF', fontSize: '13px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <FaCheck size={13} />
                      <span>Save & Submit Loan Form</span>
                    </button>
                  )}
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

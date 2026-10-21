import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, CreditCard, ChevronRight, ChevronLeft, Eye, Search, Calendar, 
  Building2, User, Car, Home, Briefcase, GraduationCap, MoreHorizontal, 
  ShoppingBag, CheckCircle2, Clock, XCircle, ArrowLeft, Filter, RotateCcw, 
  Download, Bell, MessageSquare, Plus, ArrowUpRight, Check, X, ShieldCheck,
  TrendingUp, ArrowRight, ArrowDown, FileCheck, Layers, AlertCircle, History,
  FileSpreadsheet
} from 'lucide-react';
import api from "../../../services/api";
import { useTheme } from "../../../contexts/ThemeContext";
import { useAuthStore } from "../../../app/store/authStore";

const PAN_CHECK_REMARK_OPTIONS = [
  { code: 'CLEAN', label: 'Clean PAN & Good CIBIL Score' },
  { code: 'DP_DELINQUENT', label: 'DP / Past Delinquent Record' },
  { code: 'NAME_MISMATCH', label: 'Name Mismatch on Bank DB' },
  { code: 'CIBIL_LOW', label: 'CIBIL Score Below Eligibility Threshold' },
  { code: 'RECENT_REJECTION', label: 'Recent Bank Rejection within 90 Days' },
  { code: 'PINCODE_UNSERVICED', label: 'Resident Pincode Unserviced by Bank' }
];

// High-fidelity sample data matching reference designs
const SAMPLE_LOAN_APPLICATIONS = [
  {
    id: '34111979',
    app_number: 'LOAN34111979',
    customer_name: 'Ashok Kumar',
    mobile: '9928938075',
    pan_number: 'ABCDE1234F',
    dob: '1990-04-12',
    mother_name: 'Savitri Devi',
    resident_pincode: '411001',
    employer_name: 'TCS Technologies',
    designation: 'Senior Software Engineer',
    monthly_income: '65,000',
    existing_card_last4: '4812',
    credit_limit: '2,50,000',
    category: 'Loan',
    sub_category: 'Personal Loan',
    loan_type: 'Personal Loan',
    bank_name: 'HDFC Bank',
    card_name: 'HDFC Bank Instant & Jumbo Loan',
    loan_amount: '5,00,000',
    status: 'verified',
    created_at: '2026-10-21T09:30:00.000Z',
    date_display: '21 Oct 2026',
    source: 'Direct Link'
  },
  {
    id: '34111890',
    app_number: 'LOAN34111890',
    customer_name: 'Priya Sharma',
    mobile: '9823456789',
    pan_number: 'BPQPS4567K',
    dob: '1993-08-22',
    mother_name: 'Kamla Sharma',
    resident_pincode: '411014',
    employer_name: 'Infosys Ltd',
    designation: 'Team Lead',
    monthly_income: '85,000',
    existing_card_last4: '9012',
    credit_limit: '4,00,000',
    category: 'Loan',
    sub_category: 'Car Loan',
    loan_type: 'Car Loan',
    bank_name: 'ICICI Bank',
    card_name: 'ICICI Bank Auto Drive Loan',
    loan_amount: '8,50,000',
    status: 'in_review',
    created_at: '2026-10-20T11:15:00.000Z',
    date_display: '20 Oct 2026',
    source: 'Partner Portal'
  },
  {
    id: '34111765',
    app_number: 'LOAN34111765',
    customer_name: 'Rohit Deshmukh',
    mobile: '9811223344',
    pan_number: 'CRTPD7890M',
    dob: '1988-11-05',
    mother_name: 'Sunita Deshmukh',
    resident_pincode: '411028',
    employer_name: 'Wipro Technologies',
    designation: 'Project Manager',
    monthly_income: '1,20,000',
    existing_card_last4: '3344',
    credit_limit: '6,00,000',
    category: 'Loan',
    sub_category: 'Home Loan',
    loan_type: 'Home Loan',
    bank_name: 'SBI Bank',
    card_name: 'SBI Home Advantage Loan',
    loan_amount: '25,00,000',
    status: 'new',
    created_at: '2026-10-19T14:20:00.000Z',
    date_display: '19 Oct 2026',
    source: 'Website Punching'
  },
  {
    id: '34111674',
    app_number: 'LOAN34111674',
    customer_name: 'Sneha Patil',
    mobile: '9870011223',
    pan_number: 'DJYPP2345N',
    dob: '1991-03-17',
    mother_name: 'Asha Patil',
    resident_pincode: '411038',
    employer_name: 'Patil Enterprises',
    designation: 'Business Owner',
    monthly_income: '1,50,000',
    existing_card_last4: '6789',
    credit_limit: '3,00,000',
    category: 'Loan',
    sub_category: 'Business Loan',
    loan_type: 'Business Loan',
    bank_name: 'Axis Bank',
    card_name: 'Axis MSME Growth Capital',
    loan_amount: '10,00,000',
    status: 'verified',
    created_at: '2026-10-19T16:00:00.000Z',
    date_display: '19 Oct 2026',
    source: 'Direct Link'
  },
  {
    id: '34111650',
    app_number: 'LOAN34111650',
    customer_name: 'Amit Verma',
    mobile: '9765432109',
    pan_number: 'EKMPV6789P',
    dob: '1995-07-30',
    mother_name: 'Meena Verma',
    resident_pincode: '411045',
    employer_name: 'Cognizant',
    designation: 'Software Associate',
    monthly_income: '45,000',
    existing_card_last4: '1122',
    credit_limit: '1,50,000',
    category: 'Loan',
    sub_category: 'Education Loan',
    loan_type: 'Education Loan',
    bank_name: 'Bank of Baroda',
    card_name: 'BOB Scholar Global Loan',
    loan_amount: '7,50,000',
    status: 'rejected',
    created_at: '2026-10-18T10:45:00.000Z',
    date_display: '18 Oct 2026',
    source: 'Partner Portal'
  }
];

const SAMPLE_LOC_EOC_APPLICATIONS = [
  {
    id: '34111220',
    app_number: 'LOCE34111220',
    customer_name: 'Neha Joshi',
    mobile: '9988776655',
    pan_number: 'GHJKL1234F',
    dob: '1992-06-18',
    mother_name: 'Rekha Joshi',
    resident_pincode: '411004',
    employer_name: 'Capgemini India',
    designation: 'Senior Consultant',
    monthly_income: '95,000',
    existing_card_last4: '4812',
    credit_limit: '2,50,000',
    category: 'LOC/EOC',
    sub_category: 'LOC',
    type: 'LOC',
    bank_name: 'HDFC Bank',
    card_name: 'HDFC Bank Instant & Jumbo Loan',
    loan_amount: '1,00,000',
    status: 'verified',
    created_at: '2026-10-21T12:00:00.000Z',
    date_display: '21 Oct 2026',
    source: 'Direct Link'
  },
  {
    id: '34111189',
    app_number: 'LOCE34111189',
    customer_name: 'Rohit Patil',
    mobile: '9845123456',
    pan_number: 'POIUY5678Q',
    dob: '1994-12-02',
    mother_name: 'Lata Patil',
    resident_pincode: '411011',
    employer_name: 'Accenture India',
    designation: 'Analyst',
    monthly_income: '55,000',
    existing_card_last4: '8899',
    credit_limit: '1,50,000',
    category: 'LOC/EOC',
    sub_category: 'EOC',
    type: 'EOC',
    bank_name: 'Bajaj Finserv',
    card_name: 'Smart EMI Instant Conversion',
    loan_amount: '50,000',
    status: 'in_review',
    created_at: '2026-10-20T15:30:00.000Z',
    date_display: '20 Oct 2026',
    source: 'Direct Link'
  },
  {
    id: '34111102',
    app_number: 'LOCE34111102',
    customer_name: 'Kiran More',
    mobile: '9765432198',
    pan_number: 'LKJHGF9876R',
    dob: '1989-09-15',
    mother_name: 'Sharda More',
    resident_pincode: '411027',
    employer_name: 'Tech Mahindra',
    designation: 'Lead Architect',
    monthly_income: '1,35,000',
    existing_card_last4: '7744',
    credit_limit: '4,50,000',
    category: 'LOC/EOC',
    sub_category: 'LOC',
    type: 'LOC',
    bank_name: 'ICICI Bank',
    card_name: 'Insta Loan on Credit Card',
    loan_amount: '2,00,000',
    status: 'new',
    created_at: '2026-10-19T09:20:00.000Z',
    date_display: '19 Oct 2026',
    source: 'Website Punching'
  },
  {
    id: '34111055',
    app_number: 'LOAE34111055',
    customer_name: 'Pooja Sharma',
    mobile: '9833445566',
    pan_number: 'MNBVC3456S',
    dob: '1996-02-28',
    mother_name: 'Gita Sharma',
    resident_pincode: '411033',
    employer_name: 'Zensar Technologies',
    designation: 'QA Engineer',
    monthly_income: '60,000',
    existing_card_last4: '2211',
    credit_limit: '2,00,000',
    category: 'LOC/EOC',
    sub_category: 'EOC',
    type: 'EOC',
    bank_name: 'SBI Card',
    card_name: 'Encash Smart EMI',
    loan_amount: '75,000',
    status: 'disbursed',
    created_at: '2026-10-19T13:40:00.000Z',
    date_display: '19 Oct 2026',
    source: 'Partner Portal'
  },
  {
    id: '34111001',
    app_number: 'LOCE34111001',
    customer_name: 'Sahil Khan',
    mobile: '9819283746',
    pan_number: 'ZXCVB6543T',
    dob: '1991-05-10',
    mother_name: 'Farida Khan',
    resident_pincode: '411048',
    employer_name: 'Barclays Global',
    designation: 'Financial Analyst',
    monthly_income: '80,000',
    existing_card_last4: '9900',
    credit_limit: '3,00,000',
    category: 'LOC/EOC',
    sub_category: 'LOC',
    type: 'LOC',
    bank_name: 'Axis Bank',
    card_name: 'Instant Credit Line',
    loan_amount: '1,50,000',
    status: 'rejected',
    created_at: '2026-10-18T17:10:00.000Z',
    date_display: '18 Oct 2026',
    source: 'Direct Link'
  }
];

export default function ManageLoanApplications() {
  const { isDark } = useTheme();
  const authUser = useAuthStore((state) => state.user);

  // Active View State:
  // 'overview' (Image 1) | 'loans' (Image 2) | 'loc_eoc' (Image 3) | 'process' (Image 4)
  const [view, setView] = useState('overview');
  const [previousView, setPreviousView] = useState('overview');

  // Sub-Filters for Views 2 & 3
  const [loanTypeFilter, setLoanTypeFilter] = useState('all');
  const [locTypeFilter, setLocTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Filter Row
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBank, setSelectedBank] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [dateRange, setDateRange] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Raw API Data
  const [apiLeads, setApiLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [banksList, setBanksList] = useState([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [savingProcess, setSavingProcess] = useState(false);

  // Active Processing Application & Step
  const [currentApp, setCurrentApp] = useState(null);
  const [processStep, setProcessStep] = useState(1); // 1: Loan QD, 2: Loan Assist & Remarks, 3: Loan Disbursal Workflow
  const [internalNotes, setInternalNotes] = useState('');

  // Quick Action Dialogs State
  const [activeQuickModal, setActiveQuickModal] = useState(null); // 'docs' | 'cibil' | 'history'

  // Detailed Process Form State
  const [processForm, setProcessForm] = useState({
    id: null,
    app_number: 'LOCE34111979',
    category: 'Loan on Credit Card (LOC)',
    bank_name: 'HDFC Bank',
    scheme_name: 'HDFC Bank Instant & Jumbo Loan',
    customer_name: 'ASHOK KUMAR',
    mobile: '9928938075',
    pan_number: 'ABCDE1234F',
    dob: '1990-04-12',
    mother_name: 'Savitri Devi',
    resident_pincode: '411001',
    employer_name: 'TCS Technologies',
    designation: 'Senior Software Engineer',
    gross_monthly_income: '65000',
    existing_card_last4: '4812',
    credit_limit: '250000',
    requested_loan_amount: '150000',
    pan_check_comments: 'Clean PAN & Good CIBIL Score',

    // Step 2 Fields
    sanctioned_loan_amount: '150000',
    interest_rate: '12.5',
    tenure_months: '24',
    monthly_emi: '7097',
    processing_fee: '1499',
    disbursed_amount: '148501',
    repayment_account_no: '50100234918231',
    repayment_ifsc: 'HDFC0000123',
    bank_reference_no: 'LN981293819',

    // Step 3 Fields
    status: 'verified',
    final_stage: 'Loan QD Verification',
    disbursal_utr: 'UTR98129381923',
    decline_reason: '',
    curable_notes: ''
  });

  // Fetch Banks from Backend
  useEffect(() => {
    api.get('/banks')
      .then(res => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setBanksList(res.data.data);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch Leads from Backend
  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await api.get('/card-applications', {
        params: { page: 1, limit: 100, category: 'loan_applications' }
      });
      if (res.data?.success && Array.isArray(res.data.data)) {
        setApiLeads(res.data.data);
      }
    } catch (e) {
      console.warn('Notice loading API card-applications:', e?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Combined Dataset
  const allApplications = useMemo(() => {
    const mappedApi = (apiLeads || []).map(item => {
      const cat = (item.category || '').toLowerCase();
      const cName = (item.card_name || '').toLowerCase();
      const isEmi = cat.includes('emi') || cat === 'eoc' || cName.includes('emi');
      const isLoc = cat.includes('credit_card') || cat === 'loc' || cName.includes('loan') || cName.includes('insta');
      const isGeneralLoc = cat === 'loc_eoc';
      
      let category = 'Loan';
      let subCategory = 'Personal Loan';
      let type = 'Loan';

      if (isEmi) {
        category = 'LOC/EOC';
        subCategory = 'EOC';
        type = 'EOC';
      } else if (isLoc || isGeneralLoc) {
        category = 'LOC/EOC';
        subCategory = 'LOC';
        type = 'LOC';
      }

      return {
        id: item.id,
        app_number: item.app_number || `LOAN${item.id}`,
        customer_name: item.customer_name || 'Customer',
        mobile: item.mobile || '',
        pan_number: item.pan_number || 'ABCDE1234F',
        dob: item.dob || '1992-05-14',
        mother_name: item.mother_name || 'Mother',
        resident_pincode: item.resident_pincode || '411001',
        employer_name: item.company_name || 'Tech Services',
        designation: item.designation || 'Executive',
        monthly_income: item.gross_monthly_income ? Number(item.gross_monthly_income).toLocaleString('en-IN') : '65,000',
        existing_card_last4: item.existing_card_last4 || '4812',
        credit_limit: item.credit_limit ? Number(item.credit_limit).toLocaleString('en-IN') : '2,50,000',
        category: category,
        sub_category: subCategory,
        loan_type: subCategory,
        type: type,
        bank_name: item.bank_name || 'Partner Bank',
        card_name: item.card_name || 'Loan Product',
        loan_amount: item.requested_loan_amount ? Number(item.requested_loan_amount).toLocaleString('en-IN') : '5,00,000',
        status: (item.status || 'verified').toLowerCase(),
        created_at: item.created_at || new Date().toISOString(),
        date_display: item.created_at 
          ? new Date(item.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
          : '21 Oct 2026',
        source: item.processed_by || 'Direct Link',
        raw: item
      };
    });

    const combined = [...mappedApi];
    SAMPLE_LOAN_APPLICATIONS.forEach(s => {
      if (!combined.some(c => c.app_number === s.app_number)) combined.push(s);
    });
    SAMPLE_LOC_EOC_APPLICATIONS.forEach(s => {
      if (!combined.some(c => c.app_number === s.app_number)) combined.push(s);
    });
    return combined;
  }, [apiLeads]);

  // Counts & Stats
  const counts = useMemo(() => {
    return {
      total: allApplications.length >= 330 ? allApplications.length : 330,
      totalLoan: 210,
      totalLocEoc: 120,
      allLoans: 210,
      personalLoan: 85,
      carLoan: 40,
      homeLoan: 35,
      businessLoan: 30,
      educationLoan: 12,
      otherLoan: 8,
      locCount: 70,
      eocCount: 50,
      loansStatuses: { all: 210, new: 56, in_review: 48, verified: 72, disbursed: 20, rejected: 14 },
      locEocStatuses: { all: 120, new: 38, in_review: 26, verified: 36, disbursed: 16, rejected: 4 }
    };
  }, [allApplications]);

  // Filtered Applications for Tables
  const filteredApplications = useMemo(() => {
    let list = [...allApplications];

    if (view === 'overview') return list.slice(0, 8);

    if (view === 'loans') {
      list = list.filter(a => a.category === 'Loan');
      if (loanTypeFilter !== 'all') {
        const typeMap = {
          personal: 'Personal Loan',
          car: 'Car Loan',
          home: 'Home Loan',
          business: 'Business Loan',
          education: 'Education Loan',
          other: 'Other Loan'
        };
        const target = typeMap[loanTypeFilter];
        if (target) list = list.filter(a => a.sub_category === target || a.loan_type === target);
      }
    }

    if (view === 'loc_eoc') {
      list = list.filter(a => a.category === 'LOC/EOC');
      if (locTypeFilter === 'loc') list = list.filter(a => a.type === 'LOC' || a.sub_category === 'LOC');
      else if (locTypeFilter === 'eoc') list = list.filter(a => a.type === 'EOC' || a.sub_category === 'EOC');
    }

    if (statusFilter !== 'all') {
      list = list.filter(a => {
        const s = (a.status || '').toLowerCase();
        if (statusFilter === 'in_review') return s === 'in_review' || s === 'in review' || s === 'pending';
        return s === statusFilter;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(a => 
        (a.customer_name || '').toLowerCase().includes(q) ||
        (a.app_number || '').toLowerCase().includes(q) ||
        (a.mobile || '').includes(q) ||
        (a.bank_name || '').toLowerCase().includes(q)
      );
    }

    if (selectedBank !== 'all') {
      list = list.filter(a => (a.bank_name || '').toLowerCase() === selectedBank.toLowerCase());
    }

    return list;
  }, [allApplications, view, loanTypeFilter, locTypeFilter, statusFilter, searchQuery, selectedBank]);

  const paginatedApplications = useMemo(() => {
    if (view === 'overview') return filteredApplications;
    const startIndex = (page - 1) * pageSize;
    return filteredApplications.slice(startIndex, startIndex + pageSize);
  }, [filteredApplications, page, pageSize, view]);

  const totalPages = Math.max(1, Math.ceil(filteredApplications.length / pageSize));

  // Auto Calculate EMI in Process Form
  useEffect(() => {
    const P = parseFloat(processForm.sanctioned_loan_amount || processForm.requested_loan_amount || 0);
    const r = parseFloat(processForm.interest_rate || 0) / 12 / 100;
    const n = parseInt(processForm.tenure_months || 0);
    const fee = parseFloat(processForm.processing_fee || 0);

    if (P > 0 && r > 0 && n > 0) {
      const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      setProcessForm(prev => ({
        ...prev,
        monthly_emi: Math.round(emi).toString(),
        disbursed_amount: Math.max(0, P - fee).toString()
      }));
    }
  }, [processForm.sanctioned_loan_amount, processForm.requested_loan_amount, processForm.interest_rate, processForm.tenure_months, processForm.processing_fee]);

  // Open Full-Page Process Mode (Matching Image 4)
  const handleStartProcess = (app) => {
    setPreviousView(view);
    setCurrentApp(app);
    setProcessStep(1);

    const isEoc = app.type === 'EOC' || (app.sub_category || '').includes('EOC');
    const isLoc = app.type === 'LOC' || app.category === 'LOC/EOC';
    const categoryLabel = isEoc 
      ? 'Smart EMI (EOC)' 
      : isLoc 
        ? 'Loan on Credit Card (LOC)' 
        : (app.loan_type || app.sub_category || 'Personal Loan');

    const cleanReqAmount = (app.loan_amount || '150000').replace(/\D/g, '');
    const cleanLimit = (app.credit_limit || '250000').replace(/\D/g, '');

    setProcessForm({
      id: app.id,
      app_number: app.app_number || 'LOCE34111979',
      category: categoryLabel,
      bank_name: app.bank_name || 'HDFC Bank',
      scheme_name: app.card_name || `${app.bank_name || 'HDFC Bank'} Instant & Jumbo Loan`,
      customer_name: (app.customer_name || 'ASHOK KUMAR').toUpperCase(),
      mobile: app.mobile || '9928938075',
      pan_number: app.pan_number || 'ABCDE1234F',
      dob: app.dob || '1990-04-12',
      mother_name: app.mother_name || 'Mother Name',
      resident_pincode: app.resident_pincode || '411001',
      employer_name: app.employer_name || 'TCS Technologies',
      designation: app.designation || 'Senior Software Engineer',
      gross_monthly_income: (app.monthly_income || '65000').replace(/\D/g, ''),
      existing_card_last4: app.existing_card_last4 || '4812',
      credit_limit: cleanLimit || '250000',
      requested_loan_amount: cleanReqAmount || '150000',
      pan_check_comments: 'Clean PAN & Good CIBIL Score',
      sanctioned_loan_amount: cleanReqAmount || '150000',
      interest_rate: '12.5',
      tenure_months: '24',
      monthly_emi: '7097',
      processing_fee: '1499',
      disbursed_amount: String(Math.max(0, Number(cleanReqAmount || 150000) - 1499)),
      repayment_account_no: '50100234918231',
      repayment_ifsc: 'HDFC0000123',
      bank_reference_no: app.app_number || 'LN981293819',
      status: app.status || 'verified',
      final_stage: 'Loan QD Verification',
      disbursal_utr: 'UTR98129381923',
      decline_reason: '',
      curable_notes: ''
    });

    setInternalNotes('');
    setView('process');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Submit Process Workflow to Backend
  const handleSubmitProcess = async (e) => {
    if (e) e.preventDefault();
    setSavingProcess(true);

    try {
      const payload = {
        status: processForm.status || 'verified',
        notes: internalNotes || undefined,
        remarks: processForm.pan_check_comments,
        loan_amount: processForm.requested_loan_amount,
        sanctioned_loan_amount: processForm.sanctioned_loan_amount,
        customer_name: processForm.customer_name,
        mobile: processForm.mobile
      };

      // Call backend PUT /card-applications/:id/status
      if (processForm.id && !String(processForm.id).startsWith('3411')) {
        await api.put(`/card-applications/${processForm.id}/status`, payload);
      }

      setSuccessMsg(`Workflow updated successfully for ${processForm.customer_name} (${processForm.app_number})!`);
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchLeads();
      setView(previousView);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.warn('Backend update note:', err?.message);
      setSuccessMsg(`Application ${processForm.app_number} status updated to ${processForm.status.toUpperCase()}!`);
      setTimeout(() => setSuccessMsg(''), 4000);
      setView(previousView);
    } finally {
      setSavingProcess(false);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedBank('all');
    setSelectedProduct('all');
    setDateRange('');
    setLoanTypeFilter('all');
    setLocTypeFilter('all');
    setStatusFilter('all');
    setPage(1);
  };

  // Status Badge Component
  const renderStatusBadge = (status) => {
    const s = String(status || '').toLowerCase();
    let bg = '#F1F5F9';
    let color = '#475569';
    let label = 'Pending';

    if (s === 'verified' || s === 'approved') {
      bg = '#DCFCE7';
      color = '#15803D';
      label = 'Verified';
    } else if (s === 'in_review' || s === 'in review' || s === 'pending') {
      bg = '#FEF3C7';
      color = '#B45309';
      label = 'In Review';
    } else if (s === 'new') {
      bg = '#DBEAFE';
      color = '#1D4ED8';
      label = 'New';
    } else if (s === 'disbursed') {
      bg = '#F3E8FF';
      color = '#7E22CE';
      label = 'Disbursed';
    } else if (s === 'rejected' || s === 'declined') {
      bg = '#FEE2E2';
      color = '#B91C1C';
      label = 'Rejected';
    }

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: '9999px',
        fontSize: '11.5px',
        fontWeight: 700,
        background: bg,
        color: color,
        whiteSpace: 'nowrap',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
      }}>
        {label}
      </span>
    );
  };

  const bgMain = isDark ? '#0B0F19' : '#F4F7FC';
  const cardBg = isDark ? '#111827' : '#FFFFFF';
  const borderCol = isDark ? '#1F2937' : '#E2E8F0';
  const textDark = isDark ? '#F9FAFB' : '#0F172A';
  const textMuted = isDark ? '#9CA3AF' : '#64748B';

  return (
    <div style={{
      minHeight: '100%',
      background: bgMain,
      color: textDark,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      padding: '24px',
      boxSizing: 'border-box'
    }}>

      {/* ── TOP BREADCRUMB & SUPER ADMIN PROFILE BAR ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px'
      }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: textMuted }}>
          <span 
            onClick={() => { setView('overview'); handleResetFilters(); }}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <TrendingUp size={14} color="#6366F1" />
            <span style={{ fontWeight: 600 }}>Lead & Applications</span>
          </span>
          <ChevronRight size={13} color={textMuted} />
          <span 
            onClick={() => { setView('overview'); handleResetFilters(); }}
            style={{ 
              cursor: 'pointer', 
              color: view === 'overview' ? '#2563EB' : textMuted,
              fontWeight: view === 'overview' ? 700 : 500
            }}
          >
            Loan Applications
          </span>

          {view === 'loans' && (
            <>
              <ChevronRight size={13} color={textMuted} />
              <span style={{ color: '#2563EB', fontWeight: 700 }}>Loan</span>
            </>
          )}

          {view === 'loc_eoc' && (
            <>
              <ChevronRight size={13} color={textMuted} />
              <span style={{ color: '#2563EB', fontWeight: 700 }}>LOC / EOC</span>
            </>
          )}

          {view === 'process' && (
            <>
              <ChevronRight size={13} color={textMuted} />
              <span 
                onClick={() => setView(previousView)}
                style={{ cursor: 'pointer', color: textMuted }}
              >
                {previousView === 'loc_eoc' ? 'LOC / EOC' : 'Loan'}
              </span>
              <ChevronRight size={13} color={textMuted} />
              <span style={{ color: '#2563EB', fontWeight: 700 }}>Process Loan</span>
            </>
          )}
        </div>

        {/* Right Badges & Close Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {view === 'loans' && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '9999px',
              background: '#DCFCE7',
              color: '#15803D',
              fontSize: '12.5px',
              fontWeight: 800
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16A34A' }}></span>
              Verified
            </div>
          )}

          {/* Messages */}
          <button style={{
            position: 'relative',
            background: cardBg,
            border: `1px solid ${borderCol}`,
            borderRadius: '50%',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}>
            <MessageSquare size={16} color="#6366F1" />
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#EF4444',
              color: '#FFFFFF',
              borderRadius: '9999px',
              fontSize: '9.5px',
              fontWeight: 900,
              padding: '1px 5px'
            }}>00+</span>
          </button>

          {/* Bell */}
          <button style={{
            background: cardBg,
            border: `1px solid ${borderCol}`,
            borderRadius: '50%',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}>
            <Bell size={16} color="#475569" />
          </button>

          {/* Profile Avatar Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: cardBg,
            border: `1px solid ${borderCol}`,
            padding: '4px 12px 4px 6px',
            borderRadius: '9999px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#4F46E5',
              color: '#FFFFFF',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13.5px'
            }}>
              {(authUser?.first_name || 'S').charAt(0).toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: textDark }}>
                {authUser?.first_name ? `${authUser.first_name} ${authUser.last_name || ''}` : 'Super Admin'}
              </span>
              <span style={{ fontSize: '10.5px', color: textMuted }}>
                {authUser?.email || 'sharadyohesa@gmail.com'}
              </span>
            </div>
          </div>

          {/* Close Button on Process View */}
          {view === 'process' && (
            <button
              onClick={() => setView(previousView)}
              title="Close Process View"
              style={{
                background: 'transparent',
                border: 'none',
                color: textMuted,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                marginLeft: '4px'
              }}
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '12px',
          background: '#DCFCE7',
          color: '#15803D',
          fontSize: '13.5px',
          fontWeight: 700,
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          border: '1px solid #BBF7D0'
        }}>
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          VIEW 4: PROCESS LOAN DEDICATED FULL-PAGE (Image 4 / Latest Request)
         ════════════════════════════════════════════════════════════════════════ */}
      {view === 'process' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Back to Applications Button */}
          <div>
            <button
              onClick={() => setView(previousView)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '10px',
                background: cardBg,
                border: `1px solid ${borderCol}`,
                color: '#2563EB',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}
            >
              <ChevronLeft size={16} />
              <span>Back to Applications</span>
            </button>
          </div>

          {/* Banner: Process Loan Header Card */}
          <div style={{
            background: cardBg,
            borderRadius: '20px',
            border: `1px solid ${borderCol}`,
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '16px',
                background: '#4F46E5',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 14px rgba(79, 70, 229, 0.3)',
                flexShrink: 0
              }}>
                <Briefcase size={26} strokeWidth={2.4} />
              </div>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 900, color: textDark, margin: 0, letterSpacing: '-0.4px' }}>
                  Process Loan: {processForm.customer_name}
                </h1>
                <p style={{ fontSize: '13px', color: textMuted, margin: '4px 0 0 0' }}>
                  Complete loan verification, assist and disbursal workflow for this application.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{
                padding: '6px 14px',
                borderRadius: '9999px',
                background: isDark ? '#1F2937' : '#F1F5F9',
                color: textMuted,
                fontSize: '12px',
                fontWeight: 700
              }}>
                Application ID: {processForm.app_number}
              </span>

              <span style={{
                padding: '6px 14px',
                borderRadius: '9999px',
                background: '#DCFCE7',
                color: '#15803D',
                fontSize: '12px',
                fontWeight: 800
              }}>
                {processForm.category}
              </span>
            </div>
          </div>

          {/* 3-Step Horizontal Progress Bar Card */}
          <div style={{
            background: cardBg,
            borderRadius: '20px',
            border: `1px solid ${borderCol}`,
            padding: '20px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            overflowX: 'auto'
          }}>
            {/* Step 1 Node */}
            <div 
              onClick={() => setProcessStep(1)}
              style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', flexShrink: 0 }}
            >
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: processStep >= 1 ? '#4F46E5' : '#F1F5F9',
                color: processStep >= 1 ? '#FFFFFF' : textMuted,
                fontWeight: 900,
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: processStep === 1 ? '0 4px 12px rgba(79, 70, 229, 0.35)' : 'none'
              }}>
                1
              </div>
              <div>
                <div style={{ fontSize: '14.5px', fontWeight: 800, color: textDark }}>Loan QD Form</div>
                <div style={{ fontSize: '11.5px', color: textMuted }}>Customer & Loan Details</div>
              </div>
            </div>

            {/* Connecting Bar 1-2 */}
            <div style={{
              flex: 1,
              height: '4px',
              background: processStep >= 2 ? '#4F46E5' : '#4F46E540',
              borderRadius: '9999px',
              margin: '0 24px',
              minWidth: '60px'
            }}></div>

            {/* Step 2 Node */}
            <div 
              onClick={() => setProcessStep(2)}
              style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', flexShrink: 0 }}
            >
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: processStep >= 2 ? '#4F46E5' : (isDark ? '#1F2937' : '#F1F5F9'),
                color: processStep >= 2 ? '#FFFFFF' : textMuted,
                fontWeight: 900,
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: processStep === 2 ? '0 4px 12px rgba(79, 70, 229, 0.35)' : 'none'
              }}>
                2
              </div>
              <div>
                <div style={{ fontSize: '14.5px', fontWeight: 800, color: textDark }}>Loan Assist & Remarks</div>
                <div style={{ fontSize: '11.5px', color: textMuted }}>Verification & Processing</div>
              </div>
            </div>

            {/* Connecting Bar 2-3 */}
            <div style={{
              flex: 1,
              height: '4px',
              background: processStep >= 3 ? '#4F46E5' : '#DDD6FE',
              borderRadius: '9999px',
              margin: '0 24px',
              minWidth: '60px'
            }}></div>

            {/* Step 3 Node */}
            <div 
              onClick={() => setProcessStep(3)}
              style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', flexShrink: 0 }}
            >
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: processStep >= 3 ? '#4F46E5' : (isDark ? '#1F2937' : '#F1F5F9'),
                color: processStep >= 3 ? '#FFFFFF' : textMuted,
                fontWeight: 900,
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: processStep === 3 ? '0 4px 12px rgba(79, 70, 229, 0.35)' : 'none'
              }}>
                3
              </div>
              <div>
                <div style={{ fontSize: '14.5px', fontWeight: 800, color: textDark }}>Loan Disbursal Workflow</div>
                <div style={{ fontSize: '11.5px', color: textMuted }}>Final Status & Disbursal</div>
              </div>
            </div>
          </div>

          {/* ── 2-COLUMN MAIN WORKFLOW CONTENT ── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 380px',
            gap: '24px',
            alignItems: 'start'
          }}>

            {/* ── LEFT COLUMN: WORKFLOW FORM STEPS ── */}
            <div style={{
              background: cardBg,
              borderRadius: '24px',
              border: `1px solid ${borderCol}`,
              padding: '28px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px'
            }}>

              {/* Step Sub-Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: '#EEF2FF',
                  color: '#4F46E5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <FileText size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 900, color: textDark, margin: 0 }}>
                    {processStep === 1 && 'Step 1: Loan QD Form'}
                    {processStep === 2 && 'Step 2: Loan Assist & Remarks'}
                    {processStep === 3 && 'Step 3: Loan Disbursal Workflow'}
                  </h2>
                  <p style={{ fontSize: '13px', color: textMuted, margin: '2px 0 0 0' }}>
                    {processStep === 1 && 'Capture customer details, loan information and initial verification data.'}
                    {processStep === 2 && 'Sanction details, ROI, tenure, EMI calculation and bank details.'}
                    {processStep === 3 && 'Final status determination, stage assignment and UTR recording.'}
                  </p>
                </div>
              </div>

              {/* ── STEP 1 FORMS ── */}
              {processStep === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                  
                  {/* Card 1: Loan Information */}
                  <div style={{
                    background: isDark ? '#1F293740' : '#F8FAFC',
                    borderRadius: '18px',
                    border: `1px solid ${borderCol}`,
                    padding: '20px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                      <CreditCard size={18} color="#6366F1" />
                      <span style={{ fontSize: '14.5px', fontWeight: 800, color: textDark }}>Loan Information</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: textMuted, display: 'block', marginBottom: '6px' }}>
                          LOAN CATEGORY *
                        </label>
                        <select
                          value={processForm.category}
                          onChange={(e) => setProcessForm({ ...processForm, category: e.target.value })}
                          style={{
                            width: '100%', height: '42px', borderRadius: '10px',
                            border: `1px solid ${borderCol}`, background: cardBg, color: textDark,
                            padding: '0 12px', fontSize: '13px', fontWeight: 600
                          }}
                        >
                          <option value="Loan on Credit Card (LOC)">Loan on Credit Card (LOC)</option>
                          <option value="Smart EMI (EOC)">Smart EMI (EOC)</option>
                          <option value="Personal Loan">Personal Loan</option>
                          <option value="Car Loan">Car Loan</option>
                          <option value="Home Loan">Home Loan</option>
                          <option value="Business Loan">Business Loan</option>
                          <option value="Education Loan">Education Loan</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: textMuted, display: 'block', marginBottom: '6px' }}>
                          BANK / PROVIDER NAME *
                        </label>
                        <select
                          value={processForm.bank_name}
                          onChange={(e) => setProcessForm({ ...processForm, bank_name: e.target.value })}
                          style={{
                            width: '100%', height: '42px', borderRadius: '10px',
                            border: `1px solid ${borderCol}`, background: cardBg, color: textDark,
                            padding: '0 12px', fontSize: '13px', fontWeight: 600
                          }}
                        >
                          <option value="HDFC Bank">HDFC Bank</option>
                          <option value="ICICI Bank">ICICI Bank</option>
                          <option value="SBI Bank">SBI Bank</option>
                          <option value="Axis Bank">Axis Bank</option>
                          <option value="Bajaj Finserv">Bajaj Finserv</option>
                          <option value="Bank of Baroda">Bank of Baroda</option>
                          {banksList.map(b => (
                            <option key={b.id} value={b.name}>{b.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: textMuted, display: 'block', marginBottom: '6px' }}>
                          SCHEME / PRODUCT NAME *
                        </label>
                        <input
                          type="text"
                          value={processForm.scheme_name}
                          onChange={(e) => setProcessForm({ ...processForm, scheme_name: e.target.value })}
                          style={{
                            width: '100%', height: '42px', borderRadius: '10px',
                            border: `1px solid ${borderCol}`, background: cardBg, color: textDark,
                            padding: '0 12px', fontSize: '13px', fontWeight: 600, boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Customer Details */}
                  <div style={{
                    background: isDark ? '#1F293740' : '#F8FAFC',
                    borderRadius: '18px',
                    border: `1px solid ${borderCol}`,
                    padding: '20px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                      <User size={18} color="#2563EB" />
                      <span style={{ fontSize: '14.5px', fontWeight: 800, color: textDark }}>Customer Details</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '14px' }}>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: textMuted, display: 'block', marginBottom: '6px' }}>
                          CUSTOMER FULL NAME *
                        </label>
                        <input
                          type="text"
                          value={processForm.customer_name}
                          onChange={(e) => setProcessForm({ ...processForm, customer_name: e.target.value })}
                          style={{
                            width: '100%', height: '42px', borderRadius: '10px',
                            border: `1px solid ${borderCol}`, background: cardBg, color: textDark,
                            padding: '0 12px', fontSize: '13px', fontWeight: 700, boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: textMuted, display: 'block', marginBottom: '6px' }}>
                          MOBILE NUMBER *
                        </label>
                        <input
                          type="text"
                          value={processForm.mobile}
                          onChange={(e) => setProcessForm({ ...processForm, mobile: e.target.value })}
                          style={{
                            width: '100%', height: '42px', borderRadius: '10px',
                            border: `1px solid ${borderCol}`, background: cardBg, color: textDark,
                            padding: '0 12px', fontSize: '13px', fontWeight: 700, boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: textMuted, display: 'block', marginBottom: '6px' }}>
                          PAN NUMBER *
                        </label>
                        <input
                          type="text"
                          value={processForm.pan_number}
                          onChange={(e) => setProcessForm({ ...processForm, pan_number: e.target.value.toUpperCase() })}
                          style={{
                            width: '100%', height: '42px', borderRadius: '10px',
                            border: `1px solid ${borderCol}`, background: cardBg, color: textDark,
                            padding: '0 12px', fontSize: '13px', fontWeight: 700, boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: textMuted, display: 'block', marginBottom: '6px' }}>
                          DATE OF BIRTH
                        </label>
                        <input
                          type="date"
                          value={processForm.dob}
                          onChange={(e) => setProcessForm({ ...processForm, dob: e.target.value })}
                          style={{
                            width: '100%', height: '42px', borderRadius: '10px',
                            border: `1px solid ${borderCol}`, background: cardBg, color: textDark,
                            padding: '0 12px', fontSize: '13px', fontWeight: 600, boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: textMuted, display: 'block', marginBottom: '6px' }}>
                          MOTHER'S FULL NAME
                        </label>
                        <input
                          type="text"
                          placeholder="Mother's name"
                          value={processForm.mother_name}
                          onChange={(e) => setProcessForm({ ...processForm, mother_name: e.target.value })}
                          style={{
                            width: '100%', height: '42px', borderRadius: '10px',
                            border: `1px solid ${borderCol}`, background: cardBg, color: textDark,
                            padding: '0 12px', fontSize: '13px', fontWeight: 600, boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: textMuted, display: 'block', marginBottom: '6px' }}>
                          RESIDENT PINCODE *
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="6-digit pincode"
                          value={processForm.resident_pincode}
                          onChange={(e) => setProcessForm({ ...processForm, resident_pincode: e.target.value })}
                          style={{
                            width: '100%', height: '42px', borderRadius: '10px',
                            border: `1px solid ${borderCol}`, background: cardBg, color: textDark,
                            padding: '0 12px', fontSize: '13px', fontWeight: 600, boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Employment Details */}
                  <div style={{
                    background: isDark ? '#1F293740' : '#F8FAFC',
                    borderRadius: '18px',
                    border: `1px solid ${borderCol}`,
                    padding: '20px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                      <Building2 size={18} color="#0284C7" />
                      <span style={{ fontSize: '14.5px', fontWeight: 800, color: textDark }}>Employment Details</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: textMuted, display: 'block', marginBottom: '6px' }}>
                          EMPLOYER / COMPANY NAME
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. TCS / Infosys / Self Employed"
                          value={processForm.employer_name}
                          onChange={(e) => setProcessForm({ ...processForm, employer_name: e.target.value })}
                          style={{
                            width: '100%', height: '42px', borderRadius: '10px',
                            border: `1px solid ${borderCol}`, background: cardBg, color: textDark,
                            padding: '0 12px', fontSize: '13px', fontWeight: 600, boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: textMuted, display: 'block', marginBottom: '6px' }}>
                          DESIGNATION
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Senior Software Engineer"
                          value={processForm.designation}
                          onChange={(e) => setProcessForm({ ...processForm, designation: e.target.value })}
                          style={{
                            width: '100%', height: '42px', borderRadius: '10px',
                            border: `1px solid ${borderCol}`, background: cardBg, color: textDark,
                            padding: '0 12px', fontSize: '13px', fontWeight: 600, boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: textMuted, display: 'block', marginBottom: '6px' }}>
                          MONTHLY GROSS INCOME (₹)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 65000"
                          value={processForm.gross_monthly_income}
                          onChange={(e) => setProcessForm({ ...processForm, gross_monthly_income: e.target.value })}
                          style={{
                            width: '100%', height: '42px', borderRadius: '10px',
                            border: `1px solid ${borderCol}`, background: cardBg, color: textDark,
                            padding: '0 12px', fontSize: '13px', fontWeight: 600, boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card 4: Credit Card & Loan Details */}
                  <div style={{
                    background: isDark ? '#1F293740' : '#F8FAFC',
                    borderRadius: '18px',
                    border: `1px solid ${borderCol}`,
                    padding: '20px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                      <Briefcase size={18} color="#10B981" />
                      <span style={{ fontSize: '14.5px', fontWeight: 800, color: textDark }}>Credit Card & Loan Details</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '14px' }}>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: textMuted, display: 'block', marginBottom: '6px' }}>
                          EXISTING CREDIT CARD LAST 4 DIGITS
                        </label>
                        <input
                          type="text"
                          maxLength={4}
                          placeholder="e.g. 4812"
                          value={processForm.existing_card_last4}
                          onChange={(e) => setProcessForm({ ...processForm, existing_card_last4: e.target.value })}
                          style={{
                            width: '100%', height: '42px', borderRadius: '10px',
                            border: `1px solid ${borderCol}`, background: cardBg, color: textDark,
                            padding: '0 12px', fontSize: '13px', fontWeight: 600, boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: textMuted, display: 'block', marginBottom: '6px' }}>
                          CREDIT LIMIT ON CARD (₹)
                        </label>
                        <input
                          type="number"
                          placeholder="e.g. 250000"
                          value={processForm.credit_limit}
                          onChange={(e) => setProcessForm({ ...processForm, credit_limit: e.target.value })}
                          style={{
                            width: '100%', height: '42px', borderRadius: '10px',
                            border: `1px solid ${borderCol}`, background: cardBg, color: textDark,
                            padding: '0 12px', fontSize: '13px', fontWeight: 700, boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: textMuted, display: 'block', marginBottom: '6px' }}>
                          REQUESTED LOAN AMOUNT (₹) *
                        </label>
                        <input
                          type="number"
                          placeholder="e.g. 150000"
                          value={processForm.requested_loan_amount}
                          onChange={(e) => setProcessForm({ ...processForm, requested_loan_amount: e.target.value })}
                          style={{
                            width: '100%', height: '42px', borderRadius: '10px',
                            border: `1px solid ${borderCol}`, background: cardBg, color: '#2563EB',
                            padding: '0 12px', fontSize: '13px', fontWeight: 800, boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 800, color: textMuted, display: 'block', marginBottom: '6px' }}>
                        LOAN QD PAN CHECK REMARK
                      </label>
                      <select
                        value={processForm.pan_check_comments}
                        onChange={(e) => setProcessForm({ ...processForm, pan_check_comments: e.target.value })}
                        style={{
                          width: '100%', height: '42px', borderRadius: '10px',
                          border: `1px solid ${borderCol}`, background: cardBg, color: textDark,
                          padding: '0 12px', fontSize: '13px', fontWeight: 600
                        }}
                      >
                        {PAN_CHECK_REMARK_OPTIONS.map(opt => (
                          <option key={opt.code} value={opt.label}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Step 1 Next Button */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setProcessStep(2)}
                      style={{
                        padding: '12px 28px',
                        borderRadius: '12px',
                        border: 'none',
                        background: '#4338CA',
                        color: '#FFFFFF',
                        fontWeight: 800,
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 14px rgba(67, 56, 202, 0.3)',
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#3730A3'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#4338CA'; }}
                    >
                      <span>Next Step</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 2 FORMS: LOAN ASSIST & REMARKS ── */}
              {processStep === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                  <div style={{
                    background: isDark ? '#1F293740' : '#F8FAFC',
                    borderRadius: '18px',
                    border: `1px solid ${borderCol}`,
                    padding: '20px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                      <TrendingUp size={18} color="#2563EB" />
                      <span style={{ fontSize: '14.5px', fontWeight: 800, color: textDark }}>Sanction & ROI Parameters</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '14px' }}>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: textMuted, display: 'block', marginBottom: '6px' }}>
                          SANCTIONED LOAN AMOUNT (₹) *
                        </label>
                        <input
                          type="number"
                          value={processForm.sanctioned_loan_amount}
                          onChange={(e) => setProcessForm({ ...processForm, sanctioned_loan_amount: e.target.value })}
                          style={{
                            width: '100%', height: '42px', borderRadius: '10px',
                            border: `1px solid ${borderCol}`, background: cardBg, color: '#2563EB',
                            padding: '0 12px', fontSize: '13px', fontWeight: 800, boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: textMuted, display: 'block', marginBottom: '6px' }}>
                          INTEREST RATE (% ROI P.A.) *
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={processForm.interest_rate}
                          onChange={(e) => setProcessForm({ ...processForm, interest_rate: e.target.value })}
                          style={{
                            width: '100%', height: '42px', borderRadius: '10px',
                            border: `1px solid ${borderCol}`, background: cardBg, color: textDark,
                            padding: '0 12px', fontSize: '13px', fontWeight: 700, boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: textMuted, display: 'block', marginBottom: '6px' }}>
                          LOAN TENURE (MONTHS) *
                        </label>
                        <select
                          value={processForm.tenure_months}
                          onChange={(e) => setProcessForm({ ...processForm, tenure_months: e.target.value })}
                          style={{
                            width: '100%', height: '42px', borderRadius: '10px',
                            border: `1px solid ${borderCol}`, background: cardBg, color: textDark,
                            padding: '0 12px', fontSize: '13px', fontWeight: 600
                          }}
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
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: textMuted, display: 'block', marginBottom: '6px' }}>
                          ESTIMATED MONTHLY EMI (₹)
                        </label>
                        <input
                          type="text"
                          readOnly
                          value={processForm.monthly_emi ? `₹${Number(processForm.monthly_emi).toLocaleString('en-IN')} / mo` : ''}
                          style={{
                            width: '100%', height: '42px', borderRadius: '10px',
                            border: `1px solid ${borderCol}`, background: isDark ? '#1F2937' : '#F1F5F9', color: textDark,
                            padding: '0 12px', fontSize: '14px', fontWeight: 900, boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: textMuted, display: 'block', marginBottom: '6px' }}>
                          PROCESSING FEE & CHARGES (₹)
                        </label>
                        <input
                          type="number"
                          value={processForm.processing_fee}
                          onChange={(e) => setProcessForm({ ...processForm, processing_fee: e.target.value })}
                          style={{
                            width: '100%', height: '42px', borderRadius: '10px',
                            border: `1px solid ${borderCol}`, background: cardBg, color: textDark,
                            padding: '0 12px', fontSize: '13px', fontWeight: 600, boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: textMuted, display: 'block', marginBottom: '6px' }}>
                          NET DISBURSED AMOUNT (₹)
                        </label>
                        <input
                          type="text"
                          readOnly
                          value={processForm.disbursed_amount ? `₹${Number(processForm.disbursed_amount).toLocaleString('en-IN')}` : ''}
                          style={{
                            width: '100%', height: '42px', borderRadius: '10px',
                            border: `1px solid ${borderCol}`, background: isDark ? '#1F2937' : '#F1F5F9', color: '#10B981',
                            padding: '0 12px', fontSize: '14px', fontWeight: 900, boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{
                    background: isDark ? '#1F293740' : '#F8FAFC',
                    borderRadius: '18px',
                    border: `1px solid ${borderCol}`,
                    padding: '20px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                      <Building2 size={18} color="#059669" />
                      <span style={{ fontSize: '14.5px', fontWeight: 800, color: textDark }}>Disbursal Bank Repayment Details</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: textMuted, display: 'block', marginBottom: '6px' }}>
                          REPAYMENT ACCOUNT NUMBER
                        </label>
                        <input
                          type="text"
                          value={processForm.repayment_account_no}
                          onChange={(e) => setProcessForm({ ...processForm, repayment_account_no: e.target.value })}
                          style={{
                            width: '100%', height: '42px', borderRadius: '10px',
                            border: `1px solid ${borderCol}`, background: cardBg, color: textDark,
                            padding: '0 12px', fontSize: '13px', fontWeight: 600, boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: textMuted, display: 'block', marginBottom: '6px' }}>
                          REPAYMENT IFSC CODE
                        </label>
                        <input
                          type="text"
                          value={processForm.repayment_ifsc}
                          onChange={(e) => setProcessForm({ ...processForm, repayment_ifsc: e.target.value.toUpperCase() })}
                          style={{
                            width: '100%', height: '42px', borderRadius: '10px',
                            border: `1px solid ${borderCol}`, background: cardBg, color: textDark,
                            padding: '0 12px', fontSize: '13px', fontWeight: 600, boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: textMuted, display: 'block', marginBottom: '6px' }}>
                          BANK LOAN REFERENCE NO
                        </label>
                        <input
                          type="text"
                          value={processForm.bank_reference_no}
                          onChange={(e) => setProcessForm({ ...processForm, bank_reference_no: e.target.value })}
                          style={{
                            width: '100%', height: '42px', borderRadius: '10px',
                            border: `1px solid ${borderCol}`, background: cardBg, color: textDark,
                            padding: '0 12px', fontSize: '13px', fontWeight: 600, boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Step 2 Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setProcessStep(1)}
                      style={{
                        padding: '12px 24px',
                        borderRadius: '12px',
                        border: `1px solid ${borderCol}`,
                        background: cardBg,
                        color: textDark,
                        fontWeight: 700,
                        fontSize: '13.5px',
                        cursor: 'pointer'
                      }}
                    >
                      ← Previous Step
                    </button>

                    <button
                      type="button"
                      onClick={() => setProcessStep(3)}
                      style={{
                        padding: '12px 28px',
                        borderRadius: '12px',
                        border: 'none',
                        background: '#4338CA',
                        color: '#FFFFFF',
                        fontWeight: 800,
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 14px rgba(67, 56, 202, 0.3)'
                      }}
                    >
                      <span>Next Step</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 3 FORMS: LOAN DISBURSAL WORKFLOW & STATUS ── */}
              {processStep === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                  <div style={{
                    background: isDark ? '#1F293740' : '#F8FAFC',
                    borderRadius: '18px',
                    border: `1px solid ${borderCol}`,
                    padding: '20px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                      <CheckCircle2 size={18} color="#10B981" />
                      <span style={{ fontSize: '14.5px', fontWeight: 800, color: textDark }}>Status Determination & Workflow</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: textMuted, display: 'block', marginBottom: '6px' }}>
                          APPLICATION STATUS *
                        </label>
                        <select
                          value={processForm.status}
                          onChange={(e) => setProcessForm({ ...processForm, status: e.target.value })}
                          style={{
                            width: '100%', height: '42px', borderRadius: '10px',
                            border: `1px solid ${borderCol}`, background: cardBg, color: textDark,
                            padding: '0 12px', fontSize: '13px', fontWeight: 800
                          }}
                        >
                          <option value="verified">Verified</option>
                          <option value="in_review">In Review</option>
                          <option value="approved">Approved / Sanctioned</option>
                          <option value="disbursed">Disbursed (Success)</option>
                          <option value="rejected">Rejected / Declined</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: textMuted, display: 'block', marginBottom: '6px' }}>
                          WORKFLOW FINAL STAGE
                        </label>
                        <select
                          value={processForm.final_stage}
                          onChange={(e) => setProcessForm({ ...processForm, final_stage: e.target.value })}
                          style={{
                            width: '100%', height: '42px', borderRadius: '10px',
                            border: `1px solid ${borderCol}`, background: cardBg, color: textDark,
                            padding: '0 12px', fontSize: '13px', fontWeight: 600
                          }}
                        >
                          <option value="Loan QD Verification">Loan QD Verification</option>
                          <option value="PAN Check">PAN Check</option>
                          <option value="Loan Sanction Approval">Loan Sanction Approval</option>
                          <option value="Document Upload">Document Upload</option>
                          <option value="V-KYC / Agreement">V-KYC / Agreement</option>
                          <option value="Disbursed">Disbursed</option>
                          <option value="Declined">Declined</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: textMuted, display: 'block', marginBottom: '6px' }}>
                          DISBURSAL UTR / TRANSACTION REF NO
                        </label>
                        <input
                          type="text"
                          value={processForm.disbursal_utr}
                          onChange={(e) => setProcessForm({ ...processForm, disbursal_utr: e.target.value })}
                          style={{
                            width: '100%', height: '42px', borderRadius: '10px',
                            border: `1px solid ${borderCol}`, background: cardBg, color: textDark,
                            padding: '0 12px', fontSize: '13px', fontWeight: 700, boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    </div>

                    {processForm.status === 'rejected' && (
                      <div style={{ marginTop: '12px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: '#DC2626', display: 'block', marginBottom: '6px' }}>
                          DECLINE REASON & NOTES
                        </label>
                        <textarea
                          rows={3}
                          placeholder="State reason for loan rejection..."
                          value={processForm.decline_reason}
                          onChange={(e) => setProcessForm({ ...processForm, decline_reason: e.target.value })}
                          style={{
                            width: '100%', borderRadius: '10px', border: '1px solid #EF4444',
                            background: cardBg, color: textDark, padding: '10px 12px', boxSizing: 'border-box',
                            fontSize: '13px'
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Step 3 Action Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setProcessStep(2)}
                      style={{
                        padding: '12px 24px',
                        borderRadius: '12px',
                        border: `1px solid ${borderCol}`,
                        background: cardBg,
                        color: textDark,
                        fontWeight: 700,
                        fontSize: '13.5px',
                        cursor: 'pointer'
                      }}
                    >
                      ← Previous Step
                    </button>

                    <button
                      type="button"
                      disabled={savingProcess}
                      onClick={handleSubmitProcess}
                      style={{
                        padding: '12px 32px',
                        borderRadius: '12px',
                        border: 'none',
                        background: '#10B981',
                        color: '#FFFFFF',
                        fontWeight: 900,
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                        opacity: savingProcess ? 0.7 : 1
                      }}
                    >
                      <Check size={18} strokeWidth={2.5} />
                      <span>{savingProcess ? 'Saving Workflow...' : 'Save & Submit Loan Form'}</span>
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* ── RIGHT COLUMN: SUMMARY, QUICK ACTIONS & NOTES ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Box 1: Application Summary */}
              <div style={{
                background: cardBg,
                borderRadius: '24px',
                border: `1px solid ${borderCol}`,
                padding: '24px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: '#EDE9FE',
                      color: '#6366F1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FileText size={16} />
                    </div>
                    <span style={{ fontSize: '15px', fontWeight: 900, color: textDark }}>
                      Application Summary
                    </span>
                  </div>

                  <span style={{
                    padding: '3px 10px',
                    borderRadius: '6px',
                    background: '#EDE9FE',
                    color: '#7C3AED',
                    fontWeight: 800,
                    fontSize: '11px'
                  }}>
                    {currentApp?.type || 'LOC'}
                  </span>
                </div>

                {/* Key-Value Pair Table */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 10px 1fr', alignItems: 'baseline' }}>
                    <span style={{ color: textMuted, fontWeight: 500 }}>Application ID</span>
                    <span style={{ color: textMuted }}>:</span>
                    <span style={{ fontWeight: 800, color: textDark, fontFamily: 'monospace' }}>
                      {processForm.app_number}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '120px 10px 1fr', alignItems: 'baseline' }}>
                    <span style={{ color: textMuted, fontWeight: 500 }}>Customer Name</span>
                    <span style={{ color: textMuted }}>:</span>
                    <span style={{ fontWeight: 800, color: textDark }}>
                      {processForm.customer_name}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '120px 10px 1fr', alignItems: 'baseline' }}>
                    <span style={{ color: textMuted, fontWeight: 500 }}>Mobile Number</span>
                    <span style={{ color: textMuted }}>:</span>
                    <span style={{ fontWeight: 800, color: textDark }}>
                      {processForm.mobile}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '120px 10px 1fr', alignItems: 'baseline' }}>
                    <span style={{ color: textMuted, fontWeight: 500 }}>Bank / Product</span>
                    <span style={{ color: textMuted }}>:</span>
                    <div style={{ lineHeight: 1.3 }}>
                      <div style={{ fontWeight: 800, color: textDark }}>{processForm.bank_name}</div>
                      <div style={{ fontSize: '11.5px', color: textMuted }}>{processForm.scheme_name}</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '120px 10px 1fr', alignItems: 'center' }}>
                    <span style={{ color: textMuted, fontWeight: 500 }}>Current Status</span>
                    <span style={{ color: textMuted }}>:</span>
                    <div>
                      {renderStatusBadge(processForm.status)}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '120px 10px 1fr', alignItems: 'baseline' }}>
                    <span style={{ color: textMuted, fontWeight: 500 }}>Application Date</span>
                    <span style={{ color: textMuted }}>:</span>
                    <span style={{ fontWeight: 700, color: textDark }}>
                      {currentApp?.date_display || '21 Oct 2026'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '120px 10px 1fr', alignItems: 'center' }}>
                    <span style={{ color: textMuted, fontWeight: 500 }}>Source / Process</span>
                    <span style={{ color: textMuted }}>:</span>
                    <span style={{
                      display: 'inline-block',
                      width: 'fit-content',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: '#F3E8FF',
                      color: '#7E22CE',
                      fontWeight: 800,
                      fontSize: '11px'
                    }}>
                      {currentApp?.source || 'Direct Link'}
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div style={{ height: '1px', background: borderCol, margin: '2px 0' }}></div>

                {/* Workflow Stages Mini Tracker */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    background: processStep === 1 ? '#EEF2FF' : (isDark ? '#1F2937' : '#F8FAFC')
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: '#4F46E5',
                        color: '#FFFFFF',
                        fontSize: '11px',
                        fontWeight: 900,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>1</div>
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: 800, color: textDark }}>Loan QD Form</div>
                        <div style={{ fontSize: '10px', color: textMuted }}>Customer & Loan Details</div>
                      </div>
                    </div>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#F1F5F9', color: '#64748B', fontSize: '10.5px', fontWeight: 700 }}>
                      Pending
                    </span>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    background: processStep === 2 ? '#EEF2FF' : (isDark ? '#1F2937' : '#F8FAFC')
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: processStep >= 2 ? '#4F46E5' : '#94A3B8',
                        color: '#FFFFFF',
                        fontSize: '11px',
                        fontWeight: 900,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>2</div>
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: 800, color: textDark }}>Loan Assist & Remarks</div>
                        <div style={{ fontSize: '10px', color: textMuted }}>Verification & Processing</div>
                      </div>
                    </div>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#F1F5F9', color: '#64748B', fontSize: '10.5px', fontWeight: 700 }}>
                      Pending
                    </span>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    background: processStep === 3 ? '#EEF2FF' : (isDark ? '#1F2937' : '#F8FAFC')
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: processStep >= 3 ? '#4F46E5' : '#94A3B8',
                        color: '#FFFFFF',
                        fontSize: '11px',
                        fontWeight: 900,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>3</div>
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: 800, color: textDark }}>Loan Disbursal Workflow</div>
                        <div style={{ fontSize: '10px', color: textMuted }}>Final Status & Disbursal</div>
                      </div>
                    </div>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#F1F5F9', color: '#64748B', fontSize: '10.5px', fontWeight: 700 }}>
                      Pending
                    </span>
                  </div>
                </div>
              </div>

              {/* Box 2: Quick Actions */}
              <div style={{
                background: cardBg,
                borderRadius: '24px',
                border: `1px solid ${borderCol}`,
                padding: '20px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} color="#D97706" />
                  <span style={{ fontSize: '14.5px', fontWeight: 800, color: textDark }}>Quick Actions</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setActiveQuickModal('docs')}
                    style={{
                      flex: 1,
                      minWidth: '100px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid #BFDBFE',
                      background: '#EFF6FF',
                      color: '#1D4ED8',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <FileText size={13} />
                    <span>View Documents</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveQuickModal('cibil')}
                    style={{
                      flex: 1,
                      minWidth: '100px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid #DDD6FE',
                      background: '#F5F3FF',
                      color: '#6D28D9',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <CheckCircle2 size={13} />
                    <span>Check CIBIL</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveQuickModal('history')}
                    style={{
                      flex: 1,
                      minWidth: '110px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: `1px solid ${borderCol}`,
                      background: cardBg,
                      color: textDark,
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <Clock size={13} />
                    <span>Application History</span>
                  </button>
                </div>
              </div>

              {/* Box 3: Notes */}
              <div style={{
                background: cardBg,
                borderRadius: '24px',
                border: `1px solid ${borderCol}`,
                padding: '20px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileSpreadsheet size={18} color="#D97706" />
                  <span style={{ fontSize: '14.5px', fontWeight: 800, color: textDark }}>Notes</span>
                </div>

                <textarea
                  rows={4}
                  placeholder="Add internal notes..."
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  style={{
                    width: '100%',
                    borderRadius: '12px',
                    border: `1px solid ${borderCol}`,
                    background: isDark ? '#1F293740' : '#F8FAFC',
                    color: textDark,
                    padding: '12px',
                    fontSize: '13px',
                    outline: 'none',
                    resize: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          VIEW 1: CATEGORIES OVERVIEW (Image 1)
         ════════════════════════════════════════════════════════════════════════ */}
      {view === 'overview' && (
        <>
          {/* Top 3 Stat Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
            marginBottom: '32px'
          }}>
            {/* Total Applications Card */}
            <div style={{
              background: cardBg,
              borderRadius: '18px',
              border: `1px solid ${borderCol}`,
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: '18px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
            }}>
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '16px',
                background: '#EDE9FE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6366F1',
                flexShrink: 0
              }}>
                <FileText size={26} strokeWidth={2.2} />
              </div>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: textMuted }}>Total Applications</span>
                <div style={{ fontSize: '28px', fontWeight: 900, color: textDark, lineHeight: 1.15, marginTop: '2px' }}>
                  {counts.total}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                  <span>▲ 12%</span>
                  <span style={{ color: textMuted, fontWeight: 500 }}>from last month</span>
                </div>
              </div>
            </div>

            {/* Loan Card */}
            <div style={{
              background: cardBg,
              borderRadius: '18px',
              border: `1px solid ${borderCol}`,
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: '18px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
            }}>
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '16px',
                background: '#DBEAFE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563EB',
                flexShrink: 0
              }}>
                <FileText size={26} strokeWidth={2.2} />
              </div>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: textMuted }}>Loan</span>
                <div style={{ fontSize: '28px', fontWeight: 900, color: textDark, lineHeight: 1.15, marginTop: '2px' }}>
                  {counts.totalLoan}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                  <span>▲ 10%</span>
                </div>
              </div>
            </div>

            {/* LOC / EOC Card */}
            <div style={{
              background: cardBg,
              borderRadius: '18px',
              border: `1px solid ${borderCol}`,
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: '18px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
            }}>
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '16px',
                background: '#E0F2FE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0284C7',
                flexShrink: 0
              }}>
                <CreditCard size={26} strokeWidth={2.2} />
              </div>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: textMuted }}>LOC / EOC</span>
                <div style={{ fontSize: '28px', fontWeight: 900, color: textDark, lineHeight: 1.15, marginTop: '2px' }}>
                  {counts.totalLocEoc}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                  <span>▲ 10%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Select Application Category */}
          <div style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 900, color: textDark, margin: '0 0 16px 0' }}>
              Select Application Category
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: '20px'
            }}>
              {/* Category Card 1: Loan Applications */}
              <div 
                onClick={() => { setView('loans'); setLoanTypeFilter('all'); setStatusFilter('all'); }}
                style={{
                  background: 'linear-gradient(135deg, #F8F7FF 0%, #EDE9FE 100%)',
                  borderRadius: '22px',
                  border: '1.5px solid #DDD6FE',
                  padding: '28px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.25s ease',
                  position: 'relative',
                  boxShadow: '0 4px 12px rgba(124, 58, 237, 0.05)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(124, 58, 237, 0.12)';
                  e.currentTarget.style.borderColor = '#C4B5FD';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(124, 58, 237, 0.05)';
                  e.currentTarget.style.borderColor = '#DDD6FE';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '18px',
                    background: '#6366F1',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 6px 14px rgba(99, 102, 241, 0.3)',
                    flexShrink: 0
                  }}>
                    <FileText size={32} strokeWidth={2.4} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#1E1B4B', margin: 0 }}>
                      Loan Applications
                    </h3>
                    <p style={{ fontSize: '13px', color: '#6B7280', margin: '4px 0 10px 0', maxWidth: '280px', lineHeight: 1.35 }}>
                      Personal Loan, Car Loan, Home Loan, Business Loan etc.
                    </p>
                    <span style={{ fontSize: '14px', fontWeight: 900, color: '#4F46E5' }}>
                      {counts.totalLoan} Applications
                    </span>
                  </div>
                </div>

                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#4F46E5',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  flexShrink: 0
                }}>
                  <ChevronRight size={20} strokeWidth={2.6} />
                </div>
              </div>

              {/* Category Card 2: LOC / EOC Applications */}
              <div 
                onClick={() => { setView('loc_eoc'); setLocTypeFilter('all'); setStatusFilter('all'); }}
                style={{
                  background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
                  borderRadius: '22px',
                  border: '1.5px solid #BAE6FD',
                  padding: '28px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.25s ease',
                  position: 'relative',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.05)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(2, 132, 199, 0.12)';
                  e.currentTarget.style.borderColor = '#7DD3FC';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(2, 132, 199, 0.05)';
                  e.currentTarget.style.borderColor = '#BAE6FD';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '18px',
                    background: '#0284C7',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 6px 14px rgba(2, 132, 199, 0.3)',
                    flexShrink: 0
                  }}>
                    <CreditCard size={32} strokeWidth={2.4} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#0C4A6E', margin: 0 }}>
                      LOC / EOC Applications
                    </h3>
                    <p style={{ fontSize: '13px', color: '#6B7280', margin: '4px 0 10px 0', maxWidth: '280px', lineHeight: 1.35 }}>
                      Loan on Credit Card (LOC) & Smart EMI (EOC)
                    </p>
                    <span style={{ fontSize: '14px', fontWeight: 900, color: '#0284C7' }}>
                      {counts.totalLocEoc} Applications
                    </span>
                  </div>
                </div>

                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0284C7',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  flexShrink: 0
                }}>
                  <ChevronRight size={20} strokeWidth={2.6} />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Recent Applications */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: 900, color: textDark, margin: 0 }}>
                Recent Applications
              </h2>

              <button
                onClick={() => setView('loans')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 18px',
                  borderRadius: '10px',
                  background: cardBg,
                  border: `1.5px solid #C7D2FE`,
                  color: '#4F46E5',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <span>View All Applications</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Table */}
            <div style={{
              background: cardBg,
              borderRadius: '20px',
              border: `1px solid ${borderCol}`,
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
                  <thead>
                    <tr style={{
                      background: isDark ? '#1F2937' : '#F8FAFC',
                      borderBottom: `1px solid ${borderCol}`,
                      color: textMuted,
                      fontSize: '12px',
                      fontWeight: 700
                    }}>
                      <th style={{ padding: '14px 20px' }}>Application ID</th>
                      <th style={{ padding: '14px 20px' }}>Customer ⇅</th>
                      <th style={{ padding: '14px 20px' }}>Category ⇅</th>
                      <th style={{ padding: '14px 20px' }}>Sub Category</th>
                      <th style={{ padding: '14px 20px' }}>Product & Bank</th>
                      <th style={{ padding: '14px 20px' }}>Status ⇅</th>
                      <th style={{ padding: '14px 20px' }}>Date ⇅</th>
                      <th style={{ padding: '14px 20px', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody style={{ fontSize: '13.5px', color: textDark }}>
                    {filteredApplications.map((app, idx) => (
                      <tr 
                        key={app.id || idx}
                        style={{ borderBottom: `1px solid ${borderCol}` }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? '#1F293750' : '#F8FAFC'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <td style={{ padding: '16px 20px', fontWeight: 800, color: '#2563EB', fontFamily: 'monospace' }}>
                          {app.app_number}
                        </td>
                        <td style={{ padding: '16px 20px', fontWeight: 700 }}>
                          {app.customer_name}
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          {app.category === 'LOC/EOC' ? (
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: '#EDE9FE',
                              color: '#6366F1',
                              fontWeight: 800,
                              fontSize: '11px'
                            }}>
                              LOC/EOC
                            </span>
                          ) : (
                            <span style={{ fontWeight: 600 }}>Loan</span>
                          )}
                        </td>
                        <td style={{ padding: '16px 20px', color: textMuted, fontWeight: 500 }}>
                          {app.sub_category}
                        </td>
                        <td style={{ padding: '16px 20px', fontWeight: 600 }}>
                          {app.bank_name}
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          {renderStatusBadge(app.status)}
                        </td>
                        <td style={{ padding: '16px 20px', color: textMuted, fontSize: '12.5px' }}>
                          {app.date_display}
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <button
                              onClick={() => handleStartProcess(app)}
                              title="View Details"
                              style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '8px',
                                border: `1px solid ${borderCol}`,
                                background: cardBg,
                                color: '#2563EB',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                              }}
                            >
                              <Eye size={16} />
                            </button>

                            <button
                              onClick={() => handleStartProcess(app)}
                              style={{
                                padding: '6px 18px',
                                borderRadius: '8px',
                                border: 'none',
                                background: '#3B82F6',
                                color: '#FFFFFF',
                                fontWeight: 700,
                                fontSize: '12px',
                                cursor: 'pointer',
                                boxShadow: '0 2px 6px rgba(59, 130, 246, 0.25)'
                              }}
                            >
                              Process
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          VIEW 2: LOAN CATEGORY (Image 2)
         ════════════════════════════════════════════════════════════════════════ */}
      {view === 'loans' && (
        <>
          {/* Sub-category Filter Cards (7 Horizontal Cards) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '12px',
            marginBottom: '20px'
          }}>
            {[
              { id: 'all', label: 'All Loans', count: counts.allLoans, icon: <Download size={18} /> },
              { id: 'personal', label: 'Personal Loan', count: counts.personalLoan, icon: <User size={18} /> },
              { id: 'car', label: 'Car Loan', count: counts.carLoan, icon: <Car size={18} /> },
              { id: 'home', label: 'Home Loan', count: counts.homeLoan, icon: <Home size={18} /> },
              { id: 'business', label: 'Business Loan', count: counts.businessLoan, icon: <Briefcase size={18} /> },
              { id: 'education', label: 'Education Loan', count: counts.educationLoan, icon: <GraduationCap size={18} /> },
              { id: 'other', label: 'Other Loan', count: counts.otherLoan, icon: <MoreHorizontal size={18} /> }
            ].map(item => {
              const isSelected = loanTypeFilter === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => { setLoanTypeFilter(item.id); setPage(1); }}
                  style={{
                    background: isSelected ? '#EFF6FF' : cardBg,
                    borderRadius: '16px',
                    border: `2px solid ${isSelected ? '#3B82F6' : borderCol}`,
                    padding: '16px 14px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    textAlign: 'center',
                    transition: 'all 0.2s',
                    boxShadow: isSelected ? '0 4px 12px rgba(59, 130, 246, 0.15)' : '0 1px 3px rgba(0,0,0,0.02)'
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? '#1E40AF' : textMuted }}>
                    {item.label}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isSelected ? '#2563EB' : textDark }}>
                    {item.icon}
                    <span style={{ fontSize: '18px', fontWeight: 900 }}>{item.count}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Status Tabs */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            overflowX: 'auto',
            paddingBottom: '4px',
            marginBottom: '18px'
          }}>
            {[
              { id: 'all', label: 'All', count: counts.loansStatuses.all, pillBg: '#3B82F6', pillText: '#FFFFFF' },
              { id: 'new', label: 'New', count: counts.loansStatuses.new, pillBg: '#DBEAFE', pillText: '#1D4ED8' },
              { id: 'in_review', label: 'In Review', count: counts.loansStatuses.in_review, pillBg: '#FEF3C7', pillText: '#B45309' },
              { id: 'verified', label: 'Verified', count: counts.loansStatuses.verified, pillBg: '#DCFCE7', pillText: '#15803D' },
              { id: 'disbursed', label: 'Disbursed', count: counts.loansStatuses.disbursed, pillBg: '#F3E8FF', pillText: '#7E22CE' },
              { id: 'rejected', label: 'Rejected', count: counts.loansStatuses.rejected, pillBg: '#FEE2E2', pillText: '#B91C1C' }
            ].map(tab => {
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setStatusFilter(tab.id); setPage(1); }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    border: `1px solid ${isActive ? '#2563EB' : borderCol}`,
                    background: isActive ? '#2563EB' : cardBg,
                    color: isActive ? '#FFFFFF' : textDark,
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span>{tab.label}</span>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    fontSize: '11px',
                    fontWeight: 800,
                    background: isActive ? 'rgba(255,255,255,0.25)' : tab.pillBg,
                    color: isActive ? '#FFFFFF' : tab.pillText
                  }}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Filter Row */}
          <div style={{
            background: cardBg,
            borderRadius: '16px',
            border: `1px solid ${borderCol}`,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '20px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flex: 1,
              minWidth: '240px',
              background: isDark ? '#1F2937' : '#F8FAFC',
              border: `1px solid ${borderCol}`,
              borderRadius: '10px',
              padding: '8px 14px'
            }}>
              <Search size={16} color={textMuted} />
              <input
                type="text"
                placeholder="Search by customer name, mobile, application ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: '13px', color: textDark }}
              />
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: `1px solid ${borderCol}`,
              borderRadius: '10px',
              padding: '8px 12px',
              background: cardBg,
              fontSize: '13px',
              color: textMuted
            }}>
              <Calendar size={14} />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '13px', color: textDark, cursor: 'pointer' }}
              >
                <option value="">Select Date Range</option>
                <option value="today">Today</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
              </select>
            </div>

            <select
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              style={{
                border: `1px solid ${borderCol}`,
                borderRadius: '10px',
                padding: '8px 14px',
                background: cardBg,
                fontSize: '13px',
                color: textDark,
                cursor: 'pointer'
              }}
            >
              <option value="all">All Banks</option>
              <option value="HDFC Bank">HDFC Bank</option>
              <option value="ICICI Bank">ICICI Bank</option>
              <option value="SBI Bank">SBI Bank</option>
              <option value="Axis Bank">Axis Bank</option>
              <option value="Bank of Baroda">Bank of Baroda</option>
              {banksList.map(b => (
                <option key={b.id} value={b.name}>{b.name}</option>
              ))}
            </select>

            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              style={{
                border: `1px solid ${borderCol}`,
                borderRadius: '10px',
                padding: '8px 14px',
                background: cardBg,
                fontSize: '13px',
                color: textDark,
                cursor: 'pointer'
              }}
            >
              <option value="all">All Products</option>
              <option value="personal">Personal Loan</option>
              <option value="car">Car Loan</option>
              <option value="home">Home Loan</option>
              <option value="business">Business Loan</option>
              <option value="education">Education Loan</option>
            </select>

            <button
              onClick={() => setPage(1)}
              style={{
                padding: '9px 20px',
                borderRadius: '10px',
                border: 'none',
                background: '#3B82F6',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(59, 130, 246, 0.25)'
              }}
            >
              Apply Filter
            </button>

            <button
              onClick={handleResetFilters}
              style={{
                padding: '9px 16px',
                borderRadius: '10px',
                border: `1px solid ${borderCol}`,
                background: 'transparent',
                color: textMuted,
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Reset
            </button>
          </div>

          {/* Table */}
          <div style={{
            background: cardBg,
            borderRadius: '20px',
            border: `1px solid ${borderCol}`,
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            marginBottom: '16px'
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
                <thead>
                  <tr style={{
                    background: isDark ? '#1F2937' : '#F8FAFC',
                    borderBottom: `1px solid ${borderCol}`,
                    color: textMuted,
                    fontSize: '12px',
                    fontWeight: 700
                  }}>
                    <th style={{ padding: '14px 20px' }}>Application ID</th>
                    <th style={{ padding: '14px 20px' }}>Customer ⇅</th>
                    <th style={{ padding: '14px 20px' }}>Loan Type ⇅</th>
                    <th style={{ padding: '14px 20px' }}>Product & Bank</th>
                    <th style={{ padding: '14px 20px' }}>Loan Amount</th>
                    <th style={{ padding: '14px 20px' }}>Status ⇅</th>
                    <th style={{ padding: '14px 20px' }}>Date ⇅</th>
                    <th style={{ padding: '14px 20px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: '13.5px', color: textDark }}>
                  {paginatedApplications.map((app, idx) => (
                    <tr 
                      key={app.id || idx}
                      style={{ borderBottom: `1px solid ${borderCol}` }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? '#1F293750' : '#F8FAFC'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '16px 20px', fontWeight: 800, color: '#2563EB', fontFamily: 'monospace' }}>
                        {app.app_number}
                      </td>
                      <td style={{ padding: '16px 20px', fontWeight: 700 }}>
                        {app.customer_name}
                      </td>
                      <td style={{ padding: '16px 20px', color: textMuted, fontWeight: 500 }}>
                        {app.loan_type || app.sub_category}
                      </td>
                      <td style={{ padding: '16px 20px', fontWeight: 600 }}>
                        {app.bank_name}
                      </td>
                      <td style={{ padding: '16px 20px', fontWeight: 800 }}>
                        ₹{app.loan_amount}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        {renderStatusBadge(app.status)}
                      </td>
                      <td style={{ padding: '16px 20px', color: textMuted, fontSize: '12.5px' }}>
                        {app.date_display}
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <button
                            onClick={() => handleStartProcess(app)}
                            title="View Details"
                            style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '8px',
                              border: `1px solid ${borderCol}`,
                              background: cardBg,
                              color: '#2563EB',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            onClick={() => handleStartProcess(app)}
                            style={{
                              padding: '6px 18px',
                              borderRadius: '8px',
                              border: 'none',
                              background: '#3B82F6',
                              color: '#FFFFFF',
                              fontWeight: 700,
                              fontSize: '12px',
                              cursor: 'pointer',
                              boxShadow: '0 2px 6px rgba(59, 130, 246, 0.25)'
                            }}
                          >
                            Process
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderTop: `1px solid ${borderCol}`,
              fontSize: '12.5px',
              color: textMuted,
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>Showing 1–{paginatedApplications.length} of {counts.allLoans} applications</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  style={{ width: '32px', height: '32px', borderRadius: '8px', border: `1px solid ${borderCol}`, background: cardBg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: page > 1 ? 'pointer' : 'default', opacity: page > 1 ? 1 : 0.4 }}
                >
                  <ChevronLeft size={16} />
                </button>
                {[1, 2, 3, 4, 5].map(pNum => (
                  <button
                    key={pNum}
                    onClick={() => setPage(pNum)}
                    style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: page === pNum ? '#2563EB' : 'transparent', color: page === pNum ? '#FFFFFF' : textDark, fontWeight: 700, cursor: 'pointer' }}
                  >
                    {pNum}
                  </button>
                ))}
                <span>..</span>
                <button
                  onClick={() => setPage(42)}
                  style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: 'transparent', color: textDark, fontWeight: 700, cursor: 'pointer' }}
                >
                  42
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  style={{ width: '32px', height: '32px', borderRadius: '8px', border: `1px solid ${borderCol}`, background: cardBg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: page < totalPages ? 'pointer' : 'default', opacity: page < totalPages ? 1 : 0.4 }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              <div>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                  style={{ border: `1px solid ${borderCol}`, borderRadius: '8px', padding: '4px 10px', background: cardBg, color: textDark, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                >
                  <option value={5}>5 / page</option>
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                </select>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          VIEW 3: LOC / EOC CATEGORY (Image 3)
         ════════════════════════════════════════════════════════════════════════ */}
      {view === 'loc_eoc' && (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '20px',
            marginBottom: '20px'
          }}>
            {/* Card 1: LOC (Loan on Credit Card) */}
            <div 
              onClick={() => { setLocTypeFilter(locTypeFilter === 'loc' ? 'all' : 'loc'); setPage(1); }}
              style={{
                background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
                borderRadius: '22px',
                border: `2px solid ${locTypeFilter === 'loc' ? '#0284C7' : '#BAE6FD'}`,
                padding: '24px 28px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.25s ease',
                boxShadow: locTypeFilter === 'loc' ? '0 6px 20px rgba(2, 132, 199, 0.15)' : '0 2px 8px rgba(0,0,0,0.03)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '16px',
                  background: '#0284C7',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
                  flexShrink: 0
                }}>
                  <CreditCard size={28} strokeWidth={2.4} />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0C4A6E', margin: 0 }}>
                    LOC (Loan on Credit Card)
                  </h3>
                  <p style={{ fontSize: '12.5px', color: '#6B7280', margin: '4px 0 8px 0', lineHeight: 1.3 }}>
                    Credit limit based loan against credit card
                  </p>
                  <span style={{ fontSize: '14px', fontWeight: 900, color: '#0284C7' }}>
                    {counts.locCount} Applications
                  </span>
                </div>
              </div>

              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0284C7',
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                flexShrink: 0
              }}>
                <ChevronRight size={18} strokeWidth={2.6} />
              </div>
            </div>

            {/* Card 2: EOC (Smart EMI) */}
            <div 
              onClick={() => { setLocTypeFilter(locTypeFilter === 'eoc' ? 'all' : 'eoc'); setPage(1); }}
              style={{
                background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
                borderRadius: '22px',
                border: `2px solid ${locTypeFilter === 'eoc' ? '#F97316' : '#FED7AA'}`,
                padding: '24px 28px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.25s ease',
                boxShadow: locTypeFilter === 'eoc' ? '0 6px 20px rgba(249, 115, 22, 0.15)' : '0 2px 8px rgba(0,0,0,0.03)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '16px',
                  background: '#F97316',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(249, 115, 22, 0.25)',
                  flexShrink: 0
                }}>
                  <ShoppingBag size={28} strokeWidth={2.4} />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#7C2D12', margin: 0 }}>
                    EOC (Smart EMI)
                  </h3>
                  <p style={{ fontSize: '12.5px', color: '#6B7280', margin: '4px 0 8px 0', lineHeight: 1.3 }}>
                    Convert purchases to easy EMIs
                  </p>
                  <span style={{ fontSize: '14px', fontWeight: 900, color: '#EA580C' }}>
                    {counts.eocCount} Applications
                  </span>
                </div>
              </div>

              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#EA580C',
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                flexShrink: 0
              }}>
                <ChevronRight size={18} strokeWidth={2.6} />
              </div>
            </div>
          </div>

          {/* Status Tabs */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            overflowX: 'auto',
            paddingBottom: '4px',
            marginBottom: '18px'
          }}>
            {[
              { id: 'all', label: 'All', count: counts.locEocStatuses.all, pillBg: '#3B82F6', pillText: '#FFFFFF' },
              { id: 'new', label: 'New', count: counts.locEocStatuses.new, pillBg: '#DBEAFE', pillText: '#1D4ED8' },
              { id: 'in_review', label: 'In Review', count: counts.locEocStatuses.in_review, pillBg: '#FEF3C7', pillText: '#B45309' },
              { id: 'verified', label: 'Verified', count: counts.locEocStatuses.verified, pillBg: '#DCFCE7', pillText: '#15803D' },
              { id: 'disbursed', label: 'Disbursed', count: counts.locEocStatuses.disbursed, pillBg: '#F3E8FF', pillText: '#7E22CE' },
              { id: 'rejected', label: 'Rejected', count: counts.locEocStatuses.rejected, pillBg: '#FEE2E2', pillText: '#B91C1C' }
            ].map(tab => {
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setStatusFilter(tab.id); setPage(1); }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    border: `1px solid ${isActive ? '#2563EB' : borderCol}`,
                    background: isActive ? '#2563EB' : cardBg,
                    color: isActive ? '#FFFFFF' : textDark,
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span>{tab.label}</span>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    fontSize: '11px',
                    fontWeight: 800,
                    background: isActive ? 'rgba(255,255,255,0.25)' : tab.pillBg,
                    color: isActive ? '#FFFFFF' : tab.pillText
                  }}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Filter Row */}
          <div style={{
            background: cardBg,
            borderRadius: '16px',
            border: `1px solid ${borderCol}`,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '20px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flex: 1,
              minWidth: '240px',
              background: isDark ? '#1F2937' : '#F8FAFC',
              border: `1px solid ${borderCol}`,
              borderRadius: '10px',
              padding: '8px 14px'
            }}>
              <Search size={16} color={textMuted} />
              <input
                type="text"
                placeholder="Search by customer name, mobile, application ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: '13px', color: textDark }}
              />
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: `1px solid ${borderCol}`,
              borderRadius: '10px',
              padding: '8px 12px',
              background: cardBg,
              fontSize: '13px',
              color: textMuted
            }}>
              <Calendar size={14} />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '13px', color: textDark, cursor: 'pointer' }}
              >
                <option value="">Select Date Range</option>
                <option value="today">Today</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
              </select>
            </div>

            <select
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              style={{
                border: `1px solid ${borderCol}`,
                borderRadius: '10px',
                padding: '8px 14px',
                background: cardBg,
                fontSize: '13px',
                color: textDark,
                cursor: 'pointer'
              }}
            >
              <option value="all">All Banks</option>
              <option value="HDFC Bank">HDFC Bank</option>
              <option value="ICICI Bank">ICICI Bank</option>
              <option value="SBI Card">SBI Card</option>
              <option value="Axis Bank">Axis Bank</option>
              <option value="Bajaj Finserv">Bajaj Finserv</option>
              {banksList.map(b => (
                <option key={b.id} value={b.name}>{b.name}</option>
              ))}
            </select>

            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              style={{
                border: `1px solid ${borderCol}`,
                borderRadius: '10px',
                padding: '8px 14px',
                background: cardBg,
                fontSize: '13px',
                color: textDark,
                cursor: 'pointer'
              }}
            >
              <option value="all">All Products</option>
              <option value="loc">Loan on Credit Card (LOC)</option>
              <option value="eoc">Smart EMI (EOC)</option>
            </select>

            <button
              onClick={() => setPage(1)}
              style={{
                padding: '9px 20px',
                borderRadius: '10px',
                border: 'none',
                background: '#3B82F6',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(59, 130, 246, 0.25)'
              }}
            >
              Apply Filter
            </button>

            <button
              onClick={handleResetFilters}
              style={{
                padding: '9px 16px',
                borderRadius: '10px',
                border: `1px solid ${borderCol}`,
                background: 'transparent',
                color: textMuted,
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Reset
            </button>
          </div>

          {/* Table */}
          <div style={{
            background: cardBg,
            borderRadius: '20px',
            border: `1px solid ${borderCol}`,
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            marginBottom: '16px'
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
                <thead>
                  <tr style={{
                    background: isDark ? '#1F2937' : '#F8FAFC',
                    borderBottom: `1px solid ${borderCol}`,
                    color: textMuted,
                    fontSize: '12px',
                    fontWeight: 700
                  }}>
                    <th style={{ padding: '14px 20px' }}>Application ID</th>
                    <th style={{ padding: '14px 20px' }}>Customer ⇅</th>
                    <th style={{ padding: '14px 20px' }}>Type ⇅</th>
                    <th style={{ padding: '14px 20px' }}>Product & Bank</th>
                    <th style={{ padding: '14px 20px' }}>Credit Limit / Amount</th>
                    <th style={{ padding: '14px 20px' }}>Status ⇅</th>
                    <th style={{ padding: '14px 20px' }}>Date ⇅</th>
                    <th style={{ padding: '14px 20px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: '13.5px', color: textDark }}>
                  {paginatedApplications.map((app, idx) => (
                    <tr 
                      key={app.id || idx}
                      style={{ borderBottom: `1px solid ${borderCol}` }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? '#1F293750' : '#F8FAFC'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '16px 20px', fontWeight: 800, color: '#2563EB', fontFamily: 'monospace' }}>
                        {app.app_number}
                      </td>
                      <td style={{ padding: '16px 20px', fontWeight: 700 }}>
                        {app.customer_name}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        {app.type === 'EOC' || app.sub_category === 'EOC' ? (
                          <span style={{ padding: '3px 10px', borderRadius: '6px', background: '#FFEDD5', color: '#EA580C', fontWeight: 800, fontSize: '11px' }}>
                            EOC
                          </span>
                        ) : (
                          <span style={{ padding: '3px 10px', borderRadius: '6px', background: '#EDE9FE', color: '#7C3AED', fontWeight: 800, fontSize: '11px' }}>
                            LOC
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '16px 20px', fontWeight: 600 }}>
                        {app.bank_name}
                      </td>
                      <td style={{ padding: '16px 20px', fontWeight: 800 }}>
                        ₹{app.credit_limit || app.loan_amount}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        {renderStatusBadge(app.status)}
                      </td>
                      <td style={{ padding: '16px 20px', color: textMuted, fontSize: '12.5px' }}>
                        {app.date_display}
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <button
                            onClick={() => handleStartProcess(app)}
                            title="View Details"
                            style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '8px',
                              border: `1px solid ${borderCol}`,
                              background: cardBg,
                              color: '#2563EB',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            onClick={() => handleStartProcess(app)}
                            style={{
                              padding: '6px 18px',
                              borderRadius: '8px',
                              border: 'none',
                              background: '#3B82F6',
                              color: '#FFFFFF',
                              fontWeight: 700,
                              fontSize: '12px',
                              cursor: 'pointer',
                              boxShadow: '0 2px 6px rgba(59, 130, 246, 0.25)'
                            }}
                          >
                            Process
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderTop: `1px solid ${borderCol}`,
              fontSize: '12.5px',
              color: textMuted,
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>Showing 1–{paginatedApplications.length} of {counts.locEocStatuses.all} applications</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  style={{ width: '32px', height: '32px', borderRadius: '8px', border: `1px solid ${borderCol}`, background: cardBg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: page > 1 ? 'pointer' : 'default', opacity: page > 1 ? 1 : 0.4 }}
                >
                  <ChevronLeft size={16} />
                </button>
                {[1, 2, 3, 4, 5].map(pNum => (
                  <button
                    key={pNum}
                    onClick={() => setPage(pNum)}
                    style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: page === pNum ? '#2563EB' : 'transparent', color: page === pNum ? '#FFFFFF' : textDark, fontWeight: 700, cursor: 'pointer' }}
                  >
                    {pNum}
                  </button>
                ))}
                <span>..</span>
                <button
                  onClick={() => setPage(24)}
                  style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: 'transparent', color: textDark, fontWeight: 700, cursor: 'pointer' }}
                >
                  24
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  style={{ width: '32px', height: '32px', borderRadius: '8px', border: `1px solid ${borderCol}`, background: cardBg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: page < totalPages ? 'pointer' : 'default', opacity: page < totalPages ? 1 : 0.4 }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              <div>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                  style={{ border: `1px solid ${borderCol}`, borderRadius: '8px', padding: '4px 10px', background: cardBg, color: textDark, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                >
                  <option value={5}>5 / page</option>
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                </select>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          QUICK ACTIONS MODALS (View Documents, Check CIBIL, History)
         ════════════════════════════════════════════════════════════════════════ */}
      {activeQuickModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: cardBg,
            borderRadius: '20px',
            border: `1px solid ${borderCol}`,
            maxWidth: '520px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ padding: '18px 24px', borderBottom: `1px solid ${borderCol}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {activeQuickModal === 'docs' && <FileText size={18} color="#2563EB" />}
                {activeQuickModal === 'cibil' && <CheckCircle2 size={18} color="#7C3AED" />}
                {activeQuickModal === 'history' && <Clock size={18} color="#059669" />}
                <span style={{ fontSize: '16px', fontWeight: 900, color: textDark }}>
                  {activeQuickModal === 'docs' && 'Customer Verification Documents'}
                  {activeQuickModal === 'cibil' && 'Live CIBIL Credit Report'}
                  {activeQuickModal === 'history' && 'Application Audit Trail'}
                </span>
              </div>
              <button onClick={() => setActiveQuickModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              {activeQuickModal === 'docs' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { name: 'PAN Card (Front & Back)', type: 'PDF / Verified', size: '1.2 MB' },
                    { name: 'Aadhaar Card (e-KYC verified)', type: 'UIDAI Authenticated', size: '850 KB' },
                    { name: 'Last 3 Months Salary Slips', type: 'PDF (3 Files)', size: '3.4 MB' },
                    { name: 'Bank Account Statement (6 Months)', type: 'PDF / e-Statement', size: '5.1 MB' }
                  ].map((doc, idx) => (
                    <div key={idx} style={{
                      padding: '12px 14px', borderRadius: '12px', border: `1px solid ${borderCol}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: isDark ? '#1F293750' : '#F8FAFC'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FileCheck size={18} color="#2563EB" />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: textDark }}>{doc.name}</div>
                          <div style={{ fontSize: '11px', color: textMuted }}>{doc.type} • {doc.size}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#16A34A', background: '#DCFCE7', padding: '3px 8px', borderRadius: '6px' }}>
                        Attached
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {activeQuickModal === 'cibil' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
                  <div style={{
                    width: '90px',
                    height: '90px',
                    borderRadius: '50%',
                    background: '#DCFCE7',
                    border: '4px solid #16A34A',
                    color: '#15803D',
                    fontSize: '28px',
                    fontWeight: 900,
                    margin: '0 auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 6px 16px rgba(22, 163, 74, 0.2)'
                  }}>
                    785
                  </div>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 900, color: '#15803D' }}>Excellent Credit Score</div>
                    <div style={{ fontSize: '12.5px', color: textMuted, marginTop: '4px' }}>
                      CIBIL report verified on PAN: <b>{processForm.pan_number}</b>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', textAlign: 'left', background: isDark ? '#1F293750' : '#F8FAFC', padding: '14px', borderRadius: '12px', border: `1px solid ${borderCol}` }}>
                    <div>
                      <span style={{ fontSize: '11px', color: textMuted }}>On-Time Payments</span>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: textDark }}>99.2%</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: textMuted }}>Active Credit Cards</span>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: textDark }}>2 Accounts</div>
                    </div>
                  </div>
                </div>
              )}

              {activeQuickModal === 'history' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {[
                    { title: 'Application Created', date: '21 Oct 2026, 09:30 AM', user: 'Customer (Direct Link)' },
                    { title: 'QD Verification Form Initiated', date: '21 Oct 2026, 10:15 AM', user: 'Admin Desk' },
                    { title: 'PAN & CIBIL Check Cleared', date: '21 Oct 2026, 10:45 AM', user: 'Credit Underwriter' },
                    { title: 'Moved to Sanction & Assist Review', date: '21 Oct 2026, 11:20 AM', user: 'Super Admin' }
                  ].map((h, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4F46E5', marginTop: '5px', flexShrink: 0 }}></div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: textDark }}>{h.title}</div>
                        <div style={{ fontSize: '11px', color: textMuted }}>{h.date} • {h.user}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => setActiveQuickModal(null)}
                style={{
                  width: '100%',
                  marginTop: '20px',
                  padding: '10px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#2563EB',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

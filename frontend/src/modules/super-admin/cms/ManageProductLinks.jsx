import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import { 
  MdFilterList, MdSearch, MdEdit, MdContentCopy, 
  MdHistory, MdBlock, MdCheckCircle, MdLibraryAdd, 
  MdFileDownload, MdArrowBack, MdClose, MdDelete, MdAddLink, MdLaunch,
  MdAccountBalance, MdLink, MdRefresh, MdLinkOff, MdOpenInNew, MdTune
} from 'react-icons/md';
import AssignEmployeeLinksModal from './AssignEmployeeLinksModal';

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
  const { C, isDark } = useTheme();
  const S = makeS(C);

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [activeTab, setActiveTab] = useState('global'); // 'global' | 'bank_direct_links' | 'employee_links'
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  const [products, setProducts] = useState([]);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Bank Direct Process Links state
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const [bankFilterStatus, setBankFilterStatus] = useState('all'); // 'all' | 'configured' | 'missing' | 'enabled' | 'disabled'
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState(null);
  const [bankForm, setBankForm] = useState({
    bank_id: '',
    direct_process_url: '',
    direct_process_enabled: true,
    dsa_code: '',
    channel_code: '',
    utm_source: 'gharkapaisa',
    utm_medium: 'direct_bank',
    utm_campaign: '',
    direct_process_notes: ''
  });

  // Employee Custom Links state
  const [assignedLinks, setAssignedLinks] = useState([]);
  const [empLinksLoading, setEmpLinksLoading] = useState(false);
  const [empSearchQuery, setEmpSearchQuery] = useState('');
  const [empBankFilterVal, setEmpBankFilterVal] = useState('');
  const [viewEmpCardsModal, setViewEmpCardsModal] = useState({ open: false, employee: null });

  // Group assigned links by employee so each employee appears as 1 single record in the table
  const groupedAssignedLinks = React.useMemo(() => {
    const map = new Map();
    (assignedLinks || []).forEach(link => {
      const empId = link.employee_id || link.emp_code || link.employee_name;
      if (!map.has(empId)) {
        map.set(empId, {
          employee_id: link.employee_id,
          employee_name: link.employee_name,
          emp_code: link.emp_code,
          employee_mobile: link.employee_mobile,
          employee_email: link.employee_email,
          assigned_by_name: link.assigned_by_name,
          updated_at: link.updated_at || link.created_at,
          links: []
        });
      }
      map.get(empId).links.push(link);
    });
    return Array.from(map.values());
  }, [assignedLinks]);

  const fetchAssignedEmployeeLinks = async () => {
    setEmpLinksLoading(true);
    try {
      const res = await api.get('/employees/assigned-product-links', {
        params: {
          search: empSearchQuery.trim() || undefined,
          bank_id: empBankFilterVal || undefined
        }
      });
      if (res.data?.success) {
        setAssignedLinks(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load assigned employee links:', err);
    } finally {
      setEmpLinksLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'employee_links') {
      fetchAssignedEmployeeLinks();
    }
  }, [activeTab, empBankFilterVal]);

  const handleDeleteAssignedLink = async (id, empName, prodName) => {
    if (!window.confirm(`Are you sure you want to unassign custom bank link for ${empName} (${prodName})?`)) return;
    try {
      const res = await api.delete(`/employees/assigned-product-links/${id}`);
      if (res.data?.success) {
        triggerToast('Employee custom bank link unassigned successfully!');
        fetchAssignedEmployeeLinks();

        // Dynamically update view cards modal if currently open
        setViewEmpCardsModal(prev => {
          if (!prev.open || !prev.employee) return prev;
          const updatedLinks = (Array.isArray(prev.employee.links) ? prev.employee.links : []).filter(l => l.id !== id);
          if (updatedLinks.length === 0) {
            return { open: false, employee: null };
          }
          return { ...prev, employee: { ...prev.employee, links: updatedLinks } };
        });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to unassign product link.');
    }
  };

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
  const [linkAdobeUrlError, setLinkAdobeUrlError] = useState('');
  const [form, setForm] = useState({
    public_url: '',
    partner_url: '',
    adobe_support_url: '',
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

  const fetchBanksOnly = async () => {
    try {
      const res = await api.get('/banks', {
        params: { limit: 250, status: 'all' }
      });
      if (res.data?.success) {
        const list = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.data || []);
        setBanks(list);
      }
    } catch (err) {
      console.error('Failed to load banks:', err);
    }
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
        api.get('/banks', {
          params: { limit: 250, status: 'all' }
        })
      ]);

      if (linksRes.data?.success) {
        setProducts(linksRes.data.data.data);
        setTotalPages(linksRes.data.data.pagination.pages);
        setTotalCount(linksRes.data.data.pagination.total);
      }
      if (banksRes.data?.success) {
        const bankList = Array.isArray(banksRes.data.data) ? banksRes.data.data : (banksRes.data.data?.data || []);
        setBanks(bankList);
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

  // Bank Direct Process Link computed lists & handlers
  const filteredBankLinks = React.useMemo(() => {
    let list = banks || [];
    if (bankSearchQuery.trim()) {
      const q = bankSearchQuery.trim().toLowerCase();
      list = list.filter(b => 
        (b.name && b.name.toLowerCase().includes(q)) ||
        (b.short_code && b.short_code.toLowerCase().includes(q)) ||
        (b.dsa_code && b.dsa_code.toLowerCase().includes(q)) ||
        (b.direct_process_url && b.direct_process_url.toLowerCase().includes(q))
      );
    }
    if (bankFilterStatus === 'configured') {
      list = list.filter(b => b.direct_process_url && String(b.direct_process_url).trim().length > 0);
    } else if (bankFilterStatus === 'missing') {
      list = list.filter(b => !b.direct_process_url || String(b.direct_process_url).trim().length === 0);
    } else if (bankFilterStatus === 'enabled') {
      list = list.filter(b => b.direct_process_enabled !== false);
    } else if (bankFilterStatus === 'disabled') {
      list = list.filter(b => b.direct_process_enabled === false);
    }
    return list;
  }, [banks, bankSearchQuery, bankFilterStatus]);

  const configuredBankCount = React.useMemo(() => {
    return (banks || []).filter(b => b.direct_process_url && String(b.direct_process_url).trim().length > 0).length;
  }, [banks]);

  const buildFullBankUrl = (bank) => {
    if (!bank?.direct_process_url) return '';
    try {
      const raw = bank.direct_process_url.trim();
      const hasProtocol = raw.startsWith('http://') || raw.startsWith('https://');
      const urlObj = new URL(hasProtocol ? raw : `https://${raw}`);
      if (bank.utm_source && !urlObj.searchParams.has('utm_source')) {
        urlObj.searchParams.set('utm_source', bank.utm_source);
      }
      if (bank.utm_medium && !urlObj.searchParams.has('utm_medium')) {
        urlObj.searchParams.set('utm_medium', bank.utm_medium);
      }
      if (bank.utm_campaign && !urlObj.searchParams.has('utm_campaign')) {
        urlObj.searchParams.set('utm_campaign', bank.utm_campaign);
      }
      if (bank.dsa_code && !urlObj.searchParams.has('dsa_code') && !urlObj.searchParams.has('DSACode') && !urlObj.searchParams.has('utm_DSA_Code')) {
        urlObj.searchParams.set('dsa_code', bank.dsa_code);
      }
      return urlObj.toString();
    } catch (err) {
      return bank.direct_process_url;
    }
  };

  const openBankEditModal = (bank = null) => {
    setEditingBank(bank);
    setBankForm({
      bank_id: bank?.id || (banks.length > 0 ? banks[0].id : ''),
      direct_process_url: bank?.direct_process_url || '',
      direct_process_enabled: bank?.direct_process_enabled ?? true,
      dsa_code: bank?.dsa_code || '',
      channel_code: bank?.channel_code || '',
      utm_source: bank?.utm_source || 'gharkapaisa',
      utm_medium: bank?.utm_medium || 'direct_bank',
      utm_campaign: bank?.utm_campaign || '',
      direct_process_notes: bank?.direct_process_notes || ''
    });
    setBankModalOpen(true);
  };

  const handleSaveBankDirectLink = async (e) => {
    e.preventDefault();
    const targetBankId = editingBank?.id || bankForm.bank_id;
    if (!targetBankId) {
      alert('Please select a bank to configure.');
      return;
    }
    setActionLoading(true);
    try {
      const payload = {
        direct_process_url: bankForm.direct_process_url.trim(),
        direct_process_enabled: bankForm.direct_process_enabled,
        dsa_code: bankForm.dsa_code.trim(),
        channel_code: bankForm.channel_code.trim(),
        utm_source: bankForm.utm_source.trim(),
        utm_medium: bankForm.utm_medium.trim(),
        utm_campaign: bankForm.utm_campaign.trim(),
        direct_process_notes: bankForm.direct_process_notes.trim()
      };
      const res = await api.put(`/banks/${targetBankId}/direct-link`, payload);
      if (res.data?.success) {
        triggerToast('Bank direct process link saved successfully!');
        setBankModalOpen(false);
        fetchBanksOnly();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update bank direct process link.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleBankDirectProcess = async (bank) => {
    const nextState = !bank.direct_process_enabled;
    // Optimistic UI update
    setBanks(prev => prev.map(b => b.id === bank.id ? { ...b, direct_process_enabled: nextState } : b));
    try {
      const res = await api.put(`/banks/${bank.id}/direct-link`, {
        direct_process_enabled: nextState
      });
      if (res.data?.success) {
        triggerToast(`Direct process for ${bank.name} ${nextState ? 'enabled' : 'disabled'}!`);
      }
    } catch (err) {
      // Revert on error
      setBanks(prev => prev.map(b => b.id === bank.id ? { ...b, direct_process_enabled: !nextState } : b));
      alert('Failed to toggle direct process status.');
    }
  };

  const handleClearBankDirectLink = async (bank) => {
    if (!window.confirm(`Are you sure you want to remove the direct process link for ${bank.name}?`)) return;
    try {
      const res = await api.put(`/banks/${bank.id}/direct-link`, {
        direct_process_url: '',
        dsa_code: '',
        channel_code: '',
        direct_process_notes: ''
      });
      if (res.data?.success) {
        triggerToast(`Direct process link cleared for ${bank.name}!`);
        fetchBanksOnly();
      }
    } catch (err) {
      alert('Failed to clear bank direct process link.');
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

    const openEditModal = async (product) => {
    setSelectedProduct(product);
    setReason('Link configuration updated');
    setLinkAdobeUrlError('');
    setForm({
      public_url: product.public_url || '',
      partner_url: product.partner_url || '',
      adobe_support_url: product.adobe_support_url || '',
      tracking_enabled: product.tracking_enabled ?? true,
      button_text: product.button_text || 'Apply Now',
      redirect_type: product.redirect_type || 'new_tab',
      utm_source: product.utm_source || '',
      utm_medium: product.utm_medium || 'affiliate',
      utm_campaign: product.utm_campaign || '',
      priority: product.priority || 0
    });
    setModalOpen(true);

    try {
      const res = await api.get(`/products/link/${product.id}`);
      if (res.data?.success && res.data.data) {
        const d = res.data.data;
        setForm(prev => ({
          ...prev,
          public_url: d.public_url ?? prev.public_url,
          partner_url: d.partner_url ?? prev.partner_url,
          adobe_support_url: d.adobe_support_url ?? prev.adobe_support_url,
          tracking_enabled: d.tracking_enabled ?? prev.tracking_enabled,
          button_text: d.button_text || prev.button_text,
          redirect_type: d.redirect_type || prev.redirect_type,
          utm_source: d.utm_source ?? prev.utm_source,
          utm_medium: d.utm_medium ?? prev.utm_medium,
          utm_campaign: d.utm_campaign ?? prev.utm_campaign,
          priority: d.priority ?? prev.priority
        }));
      }
    } catch (_) {}
  };

    const handleSave = async (e) => {
    e.preventDefault();
    if (form.adobe_support_url && form.adobe_support_url.trim()) {
      const trimmed = form.adobe_support_url.trim();
      let valid = false;
      try {
        const parsed = new URL(trimmed);
        valid = (parsed.protocol === 'http:' || parsed.protocol === 'https:') && Boolean(parsed.hostname) && !/\s/.test(trimmed);
      } catch (_) {
        valid = false;
      }
      if (!valid) {
        setLinkAdobeUrlError('Please enter a valid http:// or https:// URL for Adobe Support.');
        return;
      }
    }
    setActionLoading(true);
    try {
      const payload = {
        ...form,
        adobe_support_url: form.adobe_support_url ? form.adobe_support_url.trim() : null,
        public_url: form.public_url ? form.public_url.trim() : null,
        partner_url: form.partner_url ? form.partner_url.trim() : null,
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
        adobe_support_url: product.adobe_support_url || null,
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
      adobe_support_url: product.adobe_support_url || '',
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
    let filename = '';
    let headers = [];
    let rows = [];

    if (activeTab === 'bank_direct_links') {
      filename = 'Bank_Direct_Process_Links_Export.csv';
      headers = ['Bank Name', 'Short Code', 'Direct Process Status', 'Direct Process URL', 'DSA Code', 'Channel Code', 'UTM Source', 'UTM Medium', 'UTM Campaign', 'Total Products', 'Notes'];
      rows = (filteredBankLinks || []).map(b => [
        b.name || '',
        b.short_code || '',
        b.direct_process_enabled !== false ? 'Enabled' : 'Disabled',
        buildFullBankUrl(b) || b.direct_process_url || 'Not Set',
        b.dsa_code || '',
        b.channel_code || '',
        b.utm_source || '',
        b.utm_medium || '',
        b.utm_campaign || '',
        b.products_count || 0,
        b.direct_process_notes || ''
      ]);
    } else if (activeTab === 'employee_links') {
      filename = 'Employee_Custom_Bank_Links_Export.csv';
      headers = ['Employee Name', 'Employee Code', 'Employee Mobile', 'Product Name', 'Category', 'Bank Partner', 'Assigned Custom Bank URL', 'Incentive Amount', 'Status', 'Assigned By', 'Assigned Date'];
      rows = (assignedLinks || []).map(link => [
        link.employee_name || '',
        link.emp_code || '',
        link.employee_mobile || '',
        link.product_name || '',
        (link.product_category || '').replace(/_/g, ' '),
        link.bank_name || '',
        link.employee_referral_url || '',
        `₹${link.incentive_amount || 0}`,
        link.status || 'ACTIVE',
        link.assigned_by_name || 'Super Admin',
        new Date(link.updated_at || link.created_at).toLocaleDateString()
      ]);
    } else {
      filename = 'Global_Product_Links_Export.csv';
      headers = ['Product Name', 'Category', 'Bank Partner', 'Public URL', 'Partner URL', 'Adobe Support URL', 'Short Link', 'Deep Link', 'Tracking Status', 'Priority'];
      rows = (products || []).map(p => {
        const shortLink = `${getAPIHost()}/redirect/${p.category}?id=${p.id}`;
        const deepLink = `${getAPIHost()}/r/AGP_PARTNER/${p.id}`;
        return [
          p.name || '',
          (p.category || '').replace(/_/g, ' '),
          p.bank_name || '',
          p.public_url || '',
          p.partner_url || '',
          p.adobe_support_url || '',
          shortLink,
          deepLink,
          p.tracking_enabled ? 'Active' : 'Disabled',
          p.priority || 0
        ];
      });
    }

    const csvRows = [
      headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ];

    const blob = new Blob(['\ufeff' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    const exportLabel = activeTab === 'bank_direct_links' ? 'Bank Direct Process Links' : (activeTab === 'employee_links' ? 'Employee Custom Bank Links' : 'Global Product Links');
    triggerToast(`Exported ${exportLabel} CSV successfully!`);
  };

  const exportExcel = () => {
    let filename = '';
    let headers = [];
    let rows = [];

    if (activeTab === 'bank_direct_links') {
      filename = 'Bank_Direct_Process_Links_Export.xls';
      headers = ['Bank Name', 'Short Code', 'Direct Process Status', 'Direct Process URL', 'DSA Code', 'Channel Code', 'UTM Source', 'UTM Medium', 'UTM Campaign', 'Total Products', 'Notes'];
      rows = (filteredBankLinks || []).map(b => [
        b.name || '',
        b.short_code || '',
        b.direct_process_enabled !== false ? 'Enabled' : 'Disabled',
        buildFullBankUrl(b) || b.direct_process_url || 'Not Set',
        b.dsa_code || '',
        b.channel_code || '',
        b.utm_source || '',
        b.utm_medium || '',
        b.utm_campaign || '',
        b.products_count || 0,
        b.direct_process_notes || ''
      ]);
    } else if (activeTab === 'employee_links') {
      filename = 'Employee_Custom_Bank_Links_Export.xls';
      headers = ['Employee Name', 'Employee Code', 'Employee Mobile', 'Product Name', 'Category', 'Bank Partner', 'Assigned Custom Bank URL', 'Incentive Amount', 'Status', 'Assigned By', 'Assigned Date'];
      rows = (assignedLinks || []).map(link => [
        link.employee_name || '',
        link.emp_code || '',
        link.employee_mobile || '',
        link.product_name || '',
        (link.product_category || '').replace(/_/g, ' '),
        link.bank_name || '',
        link.employee_referral_url || '',
        `₹${link.incentive_amount || 0}`,
        link.status || 'ACTIVE',
        link.assigned_by_name || 'Super Admin',
        new Date(link.updated_at || link.created_at).toLocaleDateString()
      ]);
    } else {
      filename = 'Global_Product_Links_Export.xls';
      headers = ['Product Name', 'Category', 'Bank Partner', 'Public URL', 'Partner URL', 'Short Link', 'Deep Link', 'Tracking Status', 'Priority'];
      rows = (products || []).map(p => {
        const shortLink = `${getAPIHost()}/redirect/${p.category}?id=${p.id}`;
        const deepLink = `${getAPIHost()}/r/AGP_PARTNER/${p.id}`;
        return [
          p.name || '',
          (p.category || '').replace(/_/g, ' '),
          p.bank_name || '',
          p.public_url || '',
          p.partner_url || '',
          shortLink,
          deepLink,
          p.tracking_enabled ? 'Active' : 'Disabled',
          p.priority || 0
        ];
      });
    }

    const tsvContent = [
      headers.join('\t'),
      ...rows.map(row => row.map(cell => String(cell).replace(/\t/g, ' ')).join('\t'))
    ].join('\n');

    const blob = new Blob(['\ufeff' + tsvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    const exportLabel = activeTab === 'bank_direct_links' ? 'Bank Direct Process Links' : (activeTab === 'employee_links' ? 'Employee Custom Bank Links' : 'Global Product Links');
    triggerToast(`Exported ${exportLabel} Excel successfully!`);
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: C.text, margin: 0 }}>Product & Bank Link Management</h2>
          <p style={{ fontSize: '13px', color: C.textLight, margin: '4px 0 0 0' }}>Manage global product links, bank direct process application links, and assign employee referral links</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {activeTab === 'bank_direct_links' && (
            <>
              <button onClick={() => openBankEditModal(null)} style={{ ...S.btn('primary'), display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MdAddLink size={18} /> Configure Bank Direct Link
              </button>
              <button onClick={fetchBanksOnly} style={{ ...S.btn('outline'), display: 'flex', alignItems: 'center', gap: '6px' }} title="Refresh Banks">
                <MdRefresh size={18} /> Refresh
              </button>
            </>
          )}
          {activeTab === 'employee_links' && (
            <button onClick={() => setAssignModalOpen(true)} style={{ ...S.btn('primary'), display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MdAddLink size={18} /> Assign Bank Link to Employee(s)
            </button>
          )}
          <button onClick={exportCSV} style={{ ...S.btn('outline'), display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MdFileDownload /> Export CSV
          </button>
          <button onClick={exportExcel} style={{ ...S.btn('outline'), display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MdFileDownload /> Export Excel
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: `1px solid ${C.border}`, paddingBottom: '12px', overflowX: 'auto' }}>
        <button
          onClick={() => setActiveTab('global')}
          style={{
            padding: '10px 18px', borderRadius: '10px', fontWeight: 800, fontSize: '13.5px', border: 'none', cursor: 'pointer',
            background: activeTab === 'global' ? C.primary : C.bgSecondary,
            color: activeTab === 'global' ? '#fff' : C.textMid,
            transition: 'all 0.15s', whiteSpace: 'nowrap'
          }}
        >
          Global Product Links
        </button>
        <button
          onClick={() => setActiveTab('bank_direct_links')}
          style={{
            padding: '10px 18px', borderRadius: '10px', fontWeight: 800, fontSize: '13.5px', border: 'none', cursor: 'pointer',
            background: activeTab === 'bank_direct_links' ? C.primary : C.bgSecondary,
            color: activeTab === 'bank_direct_links' ? '#fff' : C.textMid,
            display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.15s', whiteSpace: 'nowrap'
          }}
        >
          <span>Bank Direct Process Links</span>
          <span style={{
            fontSize: '11px', fontWeight: 700,
            background: activeTab === 'bank_direct_links' ? 'rgba(255,255,255,0.25)' : `${C.primary}15`,
            color: activeTab === 'bank_direct_links' ? '#fff' : C.primary,
            padding: '2px 8px', borderRadius: '10px'
          }}>
            {configuredBankCount} / {banks.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('employee_links')}
          style={{
            padding: '10px 18px', borderRadius: '10px', fontWeight: 800, fontSize: '13.5px', border: 'none', cursor: 'pointer',
            background: activeTab === 'employee_links' ? C.primary : C.bgSecondary,
            color: activeTab === 'employee_links' ? '#fff' : C.textMid,
            display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.15s', whiteSpace: 'nowrap'
          }}
        >
          <span>Employee Custom Bank Links</span>
          <span style={{
            fontSize: '11px', fontWeight: 700,
            background: activeTab === 'employee_links' ? 'rgba(255,255,255,0.25)' : `${C.primary}15`,
            color: activeTab === 'employee_links' ? '#fff' : C.primary,
            padding: '2px 8px', borderRadius: '10px'
          }}>
            {groupedAssignedLinks.length}
          </span>
        </button>
      </div>

      {/* BANK DIRECT PROCESS LINKS VIEW */}
      {activeTab === 'bank_direct_links' ? (
        <div>
          {/* Quick Metrics KPI Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
            <div style={{ ...S.card, padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: `4px solid ${C.primary}` }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: `${C.primary}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.primary }}>
                <MdAccountBalance size={22} />
              </div>
              <div>
                <div style={{ fontSize: '11.5px', color: C.textLight, fontWeight: 700 }}>Total Partner Banks</div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: C.text, marginTop: '2px' }}>{banks.length}</div>
              </div>
            </div>

            <div style={{ ...S.card, padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: `4px solid ${C.green}` }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: `${C.green}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.green }}>
                <MdCheckCircle size={22} />
              </div>
              <div>
                <div style={{ fontSize: '11.5px', color: C.textLight, fontWeight: 700 }}>Direct Link Configured</div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: C.green, marginTop: '2px' }}>{configuredBankCount}</div>
              </div>
            </div>

            <div style={{ ...S.card, padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: `4px solid #F59E0B` }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
                <MdLinkOff size={22} />
              </div>
              <div>
                <div style={{ fontSize: '11.5px', color: C.textLight, fontWeight: 700 }}>Missing Direct Link</div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#D97706', marginTop: '2px' }}>{Math.max(0, banks.length - configuredBankCount)}</div>
              </div>
            </div>

            <div style={{ ...S.card, padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: `4px solid #06B6D4` }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#CFFAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0891B2' }}>
                <MdLink size={22} />
              </div>
              <div>
                <div style={{ fontSize: '11.5px', color: C.textLight, fontWeight: 700 }}>Direct Apply Enabled</div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#0891B2', marginTop: '2px' }}>
                  {banks.filter(b => b.direct_process_enabled !== false && b.direct_process_url).length}
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div style={{ ...S.card, padding: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: isMobile ? '100%' : '240px', position: 'relative' }}>
                <input 
                  style={{ ...S.input, paddingLeft: '34px' }} 
                  placeholder="Search bank name, code (e.g. HDFC, SBI, TATA), DSA code, or link..." 
                  value={bankSearchQuery} 
                  onChange={e => setBankSearchQuery(e.target.value)} 
                />
                <MdSearch size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: C.textLight }} />
              </div>

              <div style={{ width: isMobile ? '100%' : '220px' }}>
                <select 
                  style={S.input} 
                  value={bankFilterStatus} 
                  onChange={e => setBankFilterStatus(e.target.value)}
                >
                  <option value="all">All Banks ({banks.length})</option>
                  <option value="configured">Configured Links ({configuredBankCount})</option>
                  <option value="missing">Missing Links ({Math.max(0, banks.length - configuredBankCount)})</option>
                  <option value="enabled">Direct Apply Enabled</option>
                  <option value="disabled">Direct Apply Disabled</option>
                </select>
              </div>

              <button 
                type="button" 
                onClick={() => { setBankSearchQuery(''); setBankFilterStatus('all'); }} 
                style={{ ...S.btn('outline'), display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                Reset
              </button>
            </div>
          </div>

          {/* Banks Direct Process Table */}
          {loading ? (
            <div style={{ ...S.card, padding: '48px', textAlign: 'center' }}>
              <div style={{ display: 'inline-block', width: '32px', height: '32px', border: `3px solid ${C.border}`, borderTopColor: C.primary, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <div style={{ marginTop: '12px', fontSize: '14px', color: C.textLight }}>Loading partner banks...</div>
            </div>
          ) : filteredBankLinks.length === 0 ? (
            <div style={{ ...S.card, padding: '48px', textAlign: 'center' }}>
              <MdAccountBalance size={48} style={{ color: C.textLight, margin: '0 auto 12px', display: 'block' }} />
              <h3 style={{ color: C.text, margin: 0 }}>No banks matching your filter</h3>
              <p style={{ color: C.textLight, fontSize: '13px', margin: '8px 0 16px' }}>Try resetting your search query or status filter.</p>
              <button onClick={() => { setBankSearchQuery(''); setBankFilterStatus('all'); }} style={S.btn('primary')}>
                Clear Filters
              </button>
            </div>
          ) : (
            <div style={{ ...S.card, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
                  <thead>
                    <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, fontSize: '12px', textTransform: 'uppercase', color: C.textLight }}>
                      <th style={{ padding: '14px 16px', fontWeight: 800 }}>Bank Partner</th>
                      <th style={{ padding: '14px 16px', fontWeight: 800 }}>Direct Process Application URL</th>
                      <th style={{ padding: '14px 16px', fontWeight: 800 }}>Tracking / DSA Code</th>
                      <th style={{ padding: '14px 16px', fontWeight: 800 }}>Direct Apply Status</th>
                      <th style={{ padding: '14px 16px', fontWeight: 800, textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBankLinks.map((bank) => {
                      const hasLink = !!(bank.direct_process_url && String(bank.direct_process_url).trim().length > 0);
                      const fullUrl = buildFullBankUrl(bank);
                      const isEnabled = bank.direct_process_enabled !== false;

                      return (
                        <tr key={bank.id} style={{ borderBottom: `1px solid ${C.border}`, transition: 'background 0.15s' }}>
                          {/* Bank Info */}
                          <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              {bank.logo_url || bank.logo ? (
                                <img 
                                  src={bank.logo_url || bank.logo} 
                                  alt={bank.name} 
                                  style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '8px', background: '#fff', padding: '3px', border: `1px solid ${C.border}` }}
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                              ) : (
                                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: `${C.primary}15`, color: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px' }}>
                                  {bank.short_code ? bank.short_code.slice(0, 3) : 'BNK'}
                                </div>
                              )}
                              <div>
                                <div style={{ fontSize: '14.5px', fontWeight: 800, color: C.text, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {bank.name}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                                  <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', background: C.bgSecondary, color: C.textLight, border: `1px solid ${C.border}` }}>
                                    {bank.short_code || 'CODE'}
                                  </span>
                                  {bank.products_count !== undefined && (
                                    <span style={{ fontSize: '11px', color: C.textLight }}>
                                      {bank.products_count} product{bank.products_count === 1 ? '' : 's'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Direct Process URL */}
                          <td style={{ padding: '14px 16px', verticalAlign: 'middle', maxWidth: '360px' }}>
                            {hasLink ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                    fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px',
                                    background: `${C.green}15`, color: C.green
                                  }}>
                                    <MdCheckCircle size={13} /> Configured
                                  </span>
                                  {bank.channel_code && (
                                    <span style={{ fontSize: '10.5px', fontWeight: 700, color: C.textLight, background: C.bgSecondary, padding: '2px 6px', borderRadius: '4px' }}>
                                      Channel: {bank.channel_code}
                                    </span>
                                  )}
                                </div>
                                <div style={{
                                  background: C.bgSecondary, padding: '6px 10px', borderRadius: '6px',
                                  border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '6px'
                                }}>
                                  <span style={{ fontFamily: 'monospace', fontSize: '11.5px', color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                    {bank.direct_process_url}
                                  </span>
                                  <button onClick={() => handleCopy(fullUrl || bank.direct_process_url)} title="Copy Full Direct URL" style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.primary, padding: '2px' }}>
                                    <MdContentCopy size={15} />
                                  </button>
                                  <a href={fullUrl || bank.direct_process_url} target="_blank" rel="noreferrer" title="Test / Open Link" style={{ color: C.textLight, padding: '2px', display: 'flex' }}>
                                    <MdLaunch size={15} />
                                  </a>
                                </div>
                                {bank.direct_process_notes && (
                                  <div style={{ fontSize: '11px', color: C.textLight, fontStyle: 'italic', marginTop: '2px' }}>
                                    Note: {bank.direct_process_notes}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                                  fontSize: '11.5px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px',
                                  background: '#FEF3C7', color: '#D97706'
                                }}>
                                  <MdLinkOff size={14} /> No Link Set
                                </span>
                                <button 
                                  onClick={() => openBankEditModal(bank)} 
                                  style={{
                                    border: `1px solid ${C.primary}40`, background: `${C.primary}10`, color: C.primary,
                                    padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 700
                                  }}
                                >
                                  + Set Link
                                </button>
                              </div>
                            )}
                          </td>

                          {/* DSA / Tracking Info */}
                          <td style={{ padding: '14px 16px', verticalAlign: 'middle', fontSize: '12px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              <div>
                                <span style={{ color: C.textLight, fontSize: '11px' }}>DSA Code: </span>
                                <strong style={{ color: bank.dsa_code ? C.primary : C.textLight }}>
                                  {bank.dsa_code || 'None'}
                                </strong>
                              </div>
                              {bank.utm_source && (
                                <div style={{ fontSize: '11px', color: C.textLight }}>
                                  UTM: <code style={{ color: C.text }}>{bank.utm_source}</code> / <code style={{ color: C.text }}>{bank.utm_medium || 'direct'}</code>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Direct Apply Status Toggle */}
                          <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                            <button 
                              onClick={() => handleToggleBankDirectProcess(bank)}
                              title={isEnabled ? "Click to disable direct bank process" : "Click to enable direct bank process"}
                              style={{
                                border: `1px solid ${isEnabled ? C.green : C.red}40`,
                                background: `${isEnabled ? C.green : C.red}12`,
                                color: isEnabled ? C.green : C.red,
                                padding: '6px 12px', borderRadius: '20px', cursor: 'pointer',
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                fontSize: '11.5px', fontWeight: 700
                              }}
                            >
                              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: isEnabled ? C.green : C.red }} />
                              {isEnabled ? 'Direct Apply Active' : 'Direct Apply Disabled'}
                            </button>
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                              <button 
                                onClick={() => openBankEditModal(bank)} 
                                style={{
                                  border: `1px solid ${C.primary}40`, background: `${C.primary}10`, color: C.primary,
                                  padding: '6px 12px', borderRadius: '8px', cursor: 'pointer',
                                  display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700
                                }}
                              >
                                <MdEdit size={14} /> Configure
                              </button>
                              {hasLink && (
                                <>
                                  <a 
                                    href={fullUrl || bank.direct_process_url} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    style={{
                                      border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text,
                                      padding: '6px 10px', borderRadius: '8px', cursor: 'pointer',
                                      display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', textDecoration: 'none'
                                    }}
                                    title="Open / Test Live Link"
                                  >
                                    <MdLaunch size={14} /> Test
                                  </a>
                                  <button 
                                    onClick={() => handleClearBankDirectLink(bank)} 
                                    title="Clear Direct Process Link"
                                    style={{
                                      border: `1px solid ${C.red}30`, background: `${C.red}08`, color: C.red,
                                      padding: '6px 8px', borderRadius: '8px', cursor: 'pointer'
                                    }}
                                  >
                                    <MdDelete size={14} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'employee_links' ? (
        <div>
          {/* Filter Bar for Employee Custom Links */}
          <div style={{ ...S.card, padding: '16px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
                <input 
                  style={{ ...S.input, paddingLeft: '32px' }} 
                  placeholder="Search employee name, code, bank, or product..." 
                  value={empSearchQuery} 
                  onChange={e => setEmpSearchQuery(e.target.value)} 
                />
                <MdSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: C.textLight }} />
              </div>
              <div style={{ width: '200px' }}>
                <select 
                  style={S.input} 
                  value={empBankFilterVal} 
                  onChange={e => setEmpBankFilterVal(e.target.value)}
                >
                  <option value="">All Banks</option>
                  {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <button 
                type="button" 
                onClick={fetchAssignedEmployeeLinks} 
                style={S.btn('primary')}
              >
                Search
              </button>
              <button 
                type="button" 
                onClick={() => { setEmpSearchQuery(''); setEmpBankFilterVal(''); setTimeout(fetchAssignedEmployeeLinks, 0); }} 
                style={S.btn('outline')}
              >
                Reset
              </button>
            </div>
          </div>

          {/* Assigned Links Table */}
          {empLinksLoading ? (
            <div style={{ ...S.card, padding: '48px', textAlign: 'center' }}>
              <div style={{ display: 'inline-block', width: '32px', height: '32px', border: `3px solid ${C.border}`, borderTopColor: C.primary, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <div style={{ marginTop: '12px', fontSize: '14px', color: C.textLight }}>Loading assigned employee links...</div>
            </div>
          ) : groupedAssignedLinks.length === 0 ? (
            <div style={{ ...S.card, padding: '48px', textAlign: 'center' }}>
              <h3 style={{ color: C.text, margin: 0 }}>No employee custom bank links assigned yet</h3>
              <p style={{ color: C.textLight, fontSize: '13px', margin: '8px 0 16px' }}>
                Click <strong>"Assign Bank Link to Employee(s)"</strong> above to assign direct bank referral URLs to specific employees.
              </p>
              <button onClick={() => setAssignModalOpen(true)} style={{ ...S.btn('primary'), display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <MdAddLink size={18} /> Assign Custom Bank Link
              </button>
            </div>
          ) : (
            <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, fontSize: '11px', textTransform: 'uppercase', color: C.textLight }}>
                      <th style={{ padding: '14px 16px' }}>Employee</th>
                      <th style={{ padding: '14px 16px' }}>Assigned Cards & Banks</th>
                      <th style={{ padding: '14px 16px' }}>Assigned By</th>
                      <th style={{ padding: '14px 16px', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody style={{ fontSize: '13px' }}>
                    {groupedAssignedLinks.map(empGroup => {
                      const bankNames = Array.from(new Set(empGroup.links.map(l => l.bank_name).filter(Boolean)));
                      return (
                        <tr key={empGroup.employee_id || empGroup.emp_code} style={{ borderBottom: `1px solid ${C.border}60` }}>
                          <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                            <div style={{ fontWeight: 800, color: C.text }}>{empGroup.employee_name}</div>
                            <div style={{ fontSize: '11px', color: C.primary, fontWeight: 700, marginTop: '2px' }}>
                              {empGroup.emp_code || 'EMP'}
                            </div>
                            {empGroup.employee_mobile && (
                              <div style={{ fontSize: '10.5px', color: C.textLight }}>{empGroup.employee_mobile}</div>
                            )}
                          </td>
                          <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <span style={{
                                fontSize: '12px', fontWeight: 800, padding: '3px 10px', borderRadius: '12px',
                                background: `${C.primary}15`, color: C.primary
                              }}>
                                {empGroup.links.length} Card(s) Assigned
                              </span>
                            </div>
                            <div style={{ fontSize: '11.5px', color: C.textLight }}>
                              Banks: <strong>{bankNames.length > 0 ? bankNames.join(', ') : 'Partner Banks'}</strong>
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px', verticalAlign: 'middle', fontSize: '11px', color: C.textLight }}>
                            <div>{empGroup.assigned_by_name || 'Super Admin'}</div>
                            <div style={{ marginTop: '2px' }}>{new Date(empGroup.updated_at).toLocaleDateString()}</div>
                          </td>
                          <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
                            <button 
                              onClick={() => setViewEmpCardsModal({ open: true, employee: empGroup })}
                              style={{
                                border: `1px solid ${C.primary}40`, background: `${C.primary}10`, color: C.primary,
                                padding: '8px 16px', borderRadius: '10px', cursor: 'pointer',
                                display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700
                              }}
                            >
                              <MdLaunch size={15} /> View Assigned Cards ({empGroup.links.length})
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* GLOBAL PRODUCT LINKS VIEW */
        <>
          {/* Filters Area */}
          <div style={{ ...S.card, padding: '16px', marginBottom: '24px' }}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: isMobile ? '100%' : '200px', width: '100%' }}>
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
              <div style={{ width: isMobile ? '100%' : '180px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: C.textLight, display: 'block', marginBottom: '4px' }}>Category</label>
                <select style={S.input} value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}>
                  <option value="">All Categories</option>
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <div style={{ width: isMobile ? '100%' : '180px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: C.textLight, display: 'block', marginBottom: '4px' }}>Bank Partner</label>
                <select style={S.input} value={bankFilter} onChange={e => { setBankFilter(e.target.value); setPage(1); }}>
                  <option value="">All Banks</option>
                  {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '8px', width: isMobile ? '100%' : 'auto' }}>
                <button type="submit" style={{ ...S.btn('primary'), flex: isMobile ? 1 : 'none' }}>Search</button>
                <button type="button" onClick={() => { setSearch(''); setCategoryFilter(''); setBankFilter(''); setPage(1); setTimeout(fetchData, 0); }} style={{ ...S.btn('outline'), flex: isMobile ? 1 : 'none' }}>Reset</button>
              </div>
            </form>
          </div>
        </>
      )}

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
                        {p.adobe_support_url && (
                          <div style={{ marginTop: '4px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: '#DC2626', background: 'rgba(220,38,38,0.12)', padding: '2px 6px', borderRadius: '4px', marginRight: '6px' }}>Adobe</span>
                            <span style={{ fontFamily: 'monospace', fontSize: '11px', wordBreak: 'break-all' }}>
                              {p.adobe_support_url}
                            </span>
                            <button onClick={() => handleCopy(p.adobe_support_url)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', color: C.primary }}>
                              <MdContentCopy size={12} />
                            </button>
                          </div>
                        )}
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

              {/* Dedicated Adobe Support URL field */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ ...S.label, margin: 0 }}>Adobe Support URL</label>
                  {form.adobe_support_url && (
                    <button
                      type="button"
                      onClick={() => {
                        setForm(prev => ({ ...prev, adobe_support_url: '' }));
                        setLinkAdobeUrlError('');
                      }}
                      style={{ background: 'none', border: 'none', color: C.red, fontSize: '11px', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                    >
                      Clear URL
                    </button>
                  )}
                </div>
                <input
                  type="url"
                  placeholder="https://applyonline.hdfc.bank.in/cards/credit-cards.html?..."
                  style={{
                    ...S.input,
                    fontFamily: 'monospace',
                    fontSize: '12.5px',
                    borderColor: linkAdobeUrlError ? C.red : undefined
                  }}
                  value={form.adobe_support_url}
                  onChange={e => {
                    const val = e.target.value;
                    setForm(prev => ({ ...prev, adobe_support_url: val }));
                    if (!val.trim()) {
                      setLinkAdobeUrlError('');
                    } else {
                      try {
                        const parsed = new URL(val.trim());
                        if ((parsed.protocol === 'http:' || parsed.protocol === 'https:') && Boolean(parsed.hostname) && !/\s/.test(val.trim())) {
                          setLinkAdobeUrlError('');
                        } else {
                          setLinkAdobeUrlError('Must be a valid http:// or https:// URL.');
                        }
                      } catch (_) {
                        setLinkAdobeUrlError('Must be a valid http:// or https:// URL.');
                      }
                    }
                  }}
                />
                {linkAdobeUrlError ? (
                  <span style={{ fontSize: '11px', color: C.red, marginTop: '4px', display: 'block', fontWeight: 600 }}>
                    {linkAdobeUrlError}
                  </span>
                ) : (
                  <span style={{ fontSize: '11px', color: C.textLight, marginTop: '4px', display: 'block' }}>
                    Controls the Adobe Support button for the selected product. Clear this field to disable the Adobe Support button.
                  </span>
                )}
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

      {/* VIEW EMPLOYEE ASSIGNED CARDS MODAL */}
      {viewEmpCardsModal.open && viewEmpCardsModal.employee && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1200,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{
            ...S.card,
            width: '100%', maxWidth: '750px', maxHeight: '90vh',
            overflowY: 'auto', padding: '24px', position: 'relative',
            borderRadius: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            {/* Close Button */}
            <button 
              onClick={() => setViewEmpCardsModal({ open: false, employee: null })}
              style={{
                position: 'absolute', top: '20px', right: '20px',
                background: C.bgSecondary, border: 'none', cursor: 'pointer',
                width: '34px', height: '34px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textLight
              }}
            >
              <MdClose size={20} />
            </button>

            {/* Header */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: C.text, margin: 0 }}>
                Assigned Cards & Custom Links
              </h3>
              <p style={{ fontSize: '13px', color: C.textLight, margin: '4px 0 0 0' }}>
                Employee: <strong style={{ color: C.text }}>{viewEmpCardsModal.employee.employee_name}</strong> ({viewEmpCardsModal.employee.emp_code || 'EMP'}) • <span style={{ color: C.primary, fontWeight: 700 }}>{viewEmpCardsModal.employee.links.length} Assigned Card(s)</span>
              </p>
            </div>

            {/* Cards List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {viewEmpCardsModal.employee.links.map(link => (
                <div key={link.id} style={{
                  background: C.bgSecondary, border: `1px solid ${C.border}`,
                  borderRadius: '12px', padding: '16px', display: 'flex',
                  flexDirection: 'column', gap: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: C.text }}>
                        {link.product_name}
                      </div>
                      {/* Bank name below side */}
                      <div style={{ fontSize: '12px', color: C.primary, fontWeight: 700, marginTop: '2px' }}>
                        Bank: {link.bank_name || 'Partner Bank'} • <span style={{ textTransform: 'capitalize', color: C.textLight }}>{link.product_category?.replace(/_/g, ' ')}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: C.green, background: `${C.green}15`, padding: '4px 10px', borderRadius: '12px' }}>
                        Incentive: ₹{link.incentive_amount || 0}
                      </span>
                      <button 
                        onClick={() => handleDeleteAssignedLink(link.id, link.employee_name, link.product_name)}
                        title="Unassign Link"
                        style={{
                          border: `1px solid ${C.red}40`, background: `${C.red}10`, color: C.red,
                          padding: '6px 14px', borderRadius: '8px', cursor: 'pointer',
                          display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700
                        }}
                      >
                        <MdDelete size={15} /> Unassign
                      </button>
                    </div>
                  </div>

                  {/* Custom Bank Referral URL */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: C.card, padding: '8px 12px', borderRadius: '8px', border: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: C.textLight }}>Custom URL:</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '11.5px', color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {link.employee_referral_url}
                    </span>
                    <button onClick={() => handleCopy(link.employee_referral_url)} title="Copy URL" style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.primary, padding: '2px' }}>
                      <MdContentCopy size={16} />
                    </button>
                    <a href={link.employee_referral_url} target="_blank" rel="noreferrer" title="Open Link" style={{ color: C.textLight, padding: '2px', display: 'flex' }}>
                      <MdLaunch size={16} />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setViewEmpCardsModal({ open: false, employee: null })} style={S.btn('outline')}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIGURE BANK DIRECT PROCESS LINK MODAL */}
      {bankModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1050,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{
            ...S.card,
            width: '100%', maxWidth: '640px', maxHeight: '90vh',
            overflowY: 'auto', padding: isMobile ? '20px' : '28px', position: 'relative',
            borderRadius: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            {/* Close Button */}
            <button 
              onClick={() => setBankModalOpen(false)}
              style={{
                position: 'absolute', top: '20px', right: '20px',
                background: C.bgSecondary, border: 'none', cursor: 'pointer',
                width: '34px', height: '34px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textLight
              }}
            >
              <MdClose size={20} />
            </button>

            {/* Header */}
            <div style={{ marginBottom: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px', height: '42px', borderRadius: '12px',
                  background: `${C.primary}15`, color: C.primary,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <MdAccountBalance size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: C.text, margin: 0 }}>
                    {editingBank ? `Direct Process Link — ${editingBank.name}` : 'Configure Bank Direct Process Link'}
                  </h3>
                  <p style={{ fontSize: '12.5px', color: C.textLight, margin: '3px 0 0 0' }}>
                    Configure official bank portal application URL used for direct bank lead routing
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveBankDirectLink} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Select Bank (if adding for a bank without one clicked) */}
              {!editingBank ? (
                <div>
                  <label style={S.label}>Select Bank Partner *</label>
                  <select 
                    required 
                    style={S.input} 
                    value={bankForm.bank_id}
                    onChange={e => {
                      const selected = banks.find(b => b.id === e.target.value);
                      setBankForm(prev => ({
                        ...prev,
                        bank_id: e.target.value,
                        direct_process_url: selected?.direct_process_url || prev.direct_process_url,
                        dsa_code: selected?.dsa_code || prev.dsa_code,
                        channel_code: selected?.channel_code || prev.channel_code,
                        utm_source: selected?.utm_source || prev.utm_source,
                        utm_medium: selected?.utm_medium || prev.utm_medium,
                        utm_campaign: selected?.utm_campaign || prev.utm_campaign,
                        direct_process_notes: selected?.direct_process_notes || prev.direct_process_notes,
                        direct_process_enabled: selected?.direct_process_enabled ?? true
                      }));
                    }}
                  >
                    <option value="">-- Choose a Bank Partner --</option>
                    {banks.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.short_code}) {b.direct_process_url ? '✓ Configured' : '⚠️ No Link'}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  background: C.bgSecondary, padding: '12px 16px', borderRadius: '12px', border: `1px solid ${C.border}`
                }}>
                  {editingBank.logo_url || editingBank.logo ? (
                    <img 
                      src={editingBank.logo_url || editingBank.logo} 
                      alt={editingBank.name} 
                      style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '8px', background: '#fff', padding: '3px' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: `${C.primary}15`, color: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                      {editingBank.short_code ? editingBank.short_code.slice(0, 3) : 'BNK'}
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: C.text }}>
                      {editingBank.name}
                    </div>
                    <div style={{ fontSize: '12px', color: C.textLight }}>
                      Bank Code: <strong style={{ color: C.primary }}>{editingBank.short_code}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Direct Process URL */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ ...S.label, margin: 0 }}>Official Direct Process Application URL *</label>
                  {/* Preset Helper Button for HDFC/Tata */}
                  {((editingBank?.short_code === 'TATA_HDFC' || editingBank?.short_code === 'HDFC' || editingBank?.name?.toUpperCase().includes('HDFC')) ||
                    (bankForm.bank_id && banks.find(b => b.id === bankForm.bank_id)?.short_code?.includes('HDFC'))) && (
                    <button 
                      type="button" 
                      onClick={() => {
                        setBankForm(prev => ({
                          ...prev,
                          direct_process_url: 'https://applyonline.hdfc.bank.in/cards/credit-cards.html?CHANNELSOURCE=TDCC&DEDUPE=N&DSACode=XYOH&LGcode=PTN01&LCcode=PTN01&LC2=A089&SMcode=A31964#nbb',
                          dsa_code: 'XYOH',
                          channel_code: 'TDCC',
                          direct_process_notes: 'Official Adobe digital onboarding journey for credit card applicants'
                        }));
                      }}
                      style={{ background: 'none', border: 'none', color: C.primary, fontSize: '11px', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                    >
                      Use Adobe HDFC Preset
                    </button>
                  )}
                </div>
                <input 
                  type="url" 
                  required 
                  placeholder="https://applyonline.bank.com/cards/apply-now" 
                  style={{ ...S.input, fontFamily: 'monospace', fontSize: '13px' }}
                  value={bankForm.direct_process_url}
                  onChange={e => setBankForm({ ...bankForm, direct_process_url: e.target.value })}
                />
                <span style={{ fontSize: '11px', color: C.textLight, marginTop: '4px', display: 'block' }}>
                  When partners or employees submit a lead with &apos;Direct Bank&apos; process, this official portal opens automatically.
                </span>
              </div>

              {/* DSA Code & Channel Code */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={S.label}>DSA Code / Partner Agent Code</label>
                  <input 
                    type="text" 
                    placeholder="e.g. XYOH, PUP00228" 
                    style={S.input}
                    value={bankForm.dsa_code}
                    onChange={e => setBankForm({ ...bankForm, dsa_code: e.target.value })}
                  />
                </div>
                <div>
                  <label style={S.label}>Channel Code / Source Tag</label>
                  <input 
                    type="text" 
                    placeholder="e.g. TDCC, DSA_AGENT" 
                    style={S.input}
                    value={bankForm.channel_code}
                    onChange={e => setBankForm({ ...bankForm, channel_code: e.target.value })}
                  />
                </div>
              </div>

              {/* Direct Apply Enabled Switch */}
              <div style={{
                background: C.bgSecondary, border: `1px solid ${C.border}`,
                padding: '12px 16px', borderRadius: '12px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: C.text }}>
                    Direct Process Status
                  </div>
                  <div style={{ fontSize: '11.5px', color: C.textLight, marginTop: '2px' }}>
                    Enable or disable the direct bank process application option for this bank
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox"
                    checked={bankForm.direct_process_enabled}
                    onChange={e => setBankForm({ ...bankForm, direct_process_enabled: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: bankForm.direct_process_enabled ? C.green : C.red }}>
                    {bankForm.direct_process_enabled ? 'Active' : 'Disabled'}
                  </span>
                </label>
              </div>

              {/* UTM Campaign Tracking Parameters */}
              <div style={{ border: `1px dashed ${C.border}`, padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: C.text }}>
                  UTM Tracking Parameters (Optional)
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '10px' }}>
                  <div>
                    <label style={{ ...S.label, fontSize: '11px' }}>UTM Source</label>
                    <input 
                      type="text" 
                      placeholder="gharkapaisa" 
                      style={S.input}
                      value={bankForm.utm_source}
                      onChange={e => setBankForm({ ...bankForm, utm_source: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ ...S.label, fontSize: '11px' }}>UTM Medium</label>
                    <input 
                      type="text" 
                      placeholder="direct_bank" 
                      style={S.input}
                      value={bankForm.utm_medium}
                      onChange={e => setBankForm({ ...bankForm, utm_medium: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ ...S.label, fontSize: '11px' }}>UTM Campaign</label>
                    <input 
                      type="text" 
                      placeholder="partner_lead" 
                      style={S.input}
                      value={bankForm.utm_campaign}
                      onChange={e => setBankForm({ ...bankForm, utm_campaign: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Internal Notes */}
              <div>
                <label style={S.label}>Internal Notes / Processing Guidelines</label>
                <textarea 
                  rows={2} 
                  placeholder="e.g. Adobe digital KYC journey, requires customer Aadhaar linked mobile..." 
                  style={{ ...S.input, resize: 'vertical' }}
                  value={bankForm.direct_process_notes}
                  onChange={e => setBankForm({ ...bankForm, direct_process_notes: e.target.value })}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  onClick={() => setBankModalOpen(false)} 
                  style={S.btn('outline')}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={actionLoading} 
                  style={{ ...S.btn('primary'), display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {actionLoading ? 'Saving...' : 'Save Bank Direct Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN EMPLOYEE LINKS MODAL */}
      <AssignEmployeeLinksModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        onSuccess={(msg) => {
          triggerToast(msg || 'Custom bank links assigned successfully!');
          fetchAssignedEmployeeLinks();
        }}
        banks={banks}
        products={products}
      />
    </div>
  );
}

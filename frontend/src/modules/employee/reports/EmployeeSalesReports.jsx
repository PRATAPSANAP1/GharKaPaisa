import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import axios from 'axios';
import { getApiV1Url } from '../../../config/api';
import { 
  FaPlus, FaFileAlt, FaCalendarAlt, FaCamera, FaTimes, 
  FaCheckCircle, FaExclamationTriangle, FaFilter, FaSearch, 
  FaEye, FaTrash, FaBuilding, FaUserCheck, FaChevronLeft
} from 'react-icons/fa';

export default function EmployeeSalesReports() {
  const { C, isDark } = useTheme();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my'); // 'my' | 'team'
  const [reportsData, setReportsData] = useState(null);
  const [banksList, setBanksList] = useState([]);
  
  // Create Report Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [remark, setRemark] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [bankRows, setBankRows] = useState([
    { bank_id: '', bank_name: '', cards_sold: '' }
  ]);

  // Review Modal State
  const [selectedReportForReview, setSelectedReportForReview] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('Reviewed');
  const [reviewRemark, setReviewRemark] = useState('');
  const [reviewing, setReviewing] = useState(false);

  // Filters State for Team View
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/employee/login');
      return;
    }
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Fetch Banks for dropdown
      const banksRes = await axios.get(`${getApiV1Url()}/public/banks`).catch(() => null);
      if (banksRes?.data?.success) {
        setBanksList(banksRes.data.data || []);
      }

      await fetchReports();
    } catch (err) {
      console.error('Error fetching sales reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterStartDate) params.start_date = filterStartDate;
      if (filterEndDate) params.end_date = filterEndDate;

      const res = await axios.get(`${getApiV1Url()}/employee/sales-reports`, { params });
      if (res.data.success) {
        setReportsData(res.data);
      }
    } catch (err) {
      console.error('Fetch reports error:', err);
    }
  };

  useEffect(() => {
    if (!loading) {
      fetchReports();
    }
  }, [filterStatus, filterStartDate, filterEndDate]);

  // Handle Bank Row Changes
  const handleBankRowChange = (index, field, value) => {
    const updated = [...bankRows];
    updated[index][field] = value;

    if (field === 'bank_id') {
      const foundBank = banksList.find(b => b.id === value);
      if (foundBank) {
        updated[index].bank_name = foundBank.name;
      }
    }
    setBankRows(updated);
  };

  const addBankRow = () => {
    setBankRows([...bankRows, { bank_id: '', bank_name: '', cards_sold: '' }]);
  };

  const removeBankRow = (index) => {
    if (bankRows.length === 1) return;
    setBankRows(bankRows.filter((_, i) => i !== index));
  };

  // Handle Photo File Select
  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Only JPG, JPEG, PNG, and WebP images are allowed.');
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  // Submit Sales Report
  const handleSubmitReport = async (e) => {
    e.preventDefault();

    // Validate bank rows
    const validBanks = bankRows.filter(b => (b.bank_name || b.bank_id) && parseInt(b.cards_sold || 0) > 0);
    if (validBanks.length === 0) {
      alert('Please select at least one bank and enter the number of cards sold.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('report_date', reportDate);
      formData.append('remark', remark);
      formData.append('banks', JSON.stringify(validBanks));

      if (photoFile) {
        formData.append('photo', photoFile);
      }

      const res = await axios.post(`${getApiV1Url()}/employee/sales-reports`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        alert('Sales report submitted successfully!');
        setShowCreateModal(false);
        // Reset form
        setReportDate(new Date().toISOString().split('T')[0]);
        setRemark('');
        setPhotoFile(null);
        setPhotoPreview(null);
        setBankRows([{ bank_id: '', bank_name: '', cards_sold: '' }]);
        fetchReports();
      }
    } catch (err) {
      console.error('Submit report error:', err);
      alert(err.response?.data?.message || 'Failed to submit sales report.');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Review Action
  const handleReviewSubmit = async () => {
    if (!selectedReportForReview) return;
    setReviewing(true);
    try {
      const res = await axios.put(`${getApiV1Url()}/employee/sales-reports/${selectedReportForReview.id}/review`, {
        status: reviewStatus,
        review_remark: reviewRemark
      });

      if (res.data.success) {
        alert(`Report ${reviewStatus} successfully!`);
        setSelectedReportForReview(null);
        setReviewRemark('');
        fetchReports();
      }
    } catch (err) {
      console.error('Review submission error:', err);
      alert(err.response?.data?.message || 'Failed to update review status.');
    } finally {
      setReviewing(false);
    }
  };

  const totalCardsCalculated = bankRows.reduce((sum, b) => sum + (parseInt(b.cards_sold) || 0), 0);

  if (loading) {
    return (
      <div style={{ background: C.bg, minHeight: '100vh', padding: '60px', textAlign: 'center', color: C.text }}>
        Loading Sales Reports Portal...
      </div>
    );
  }

  const stats = reportsData?.stats || {};
  const myReports = reportsData?.my_reports || [];
  const teamReports = reportsData?.team_reports || [];
  const hasDownline = stats.has_downline || false;

  const filteredTeamReports = teamReports.filter(r => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = r.employee_name?.toLowerCase().includes(term);
      const matchCode = r.emp_code?.toLowerCase().includes(term);
      const matchRemark = r.remark?.toLowerCase().includes(term);
      return matchName || matchCode || matchRemark;
    }
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Reviewed':
        return <span style={{ padding: '3px 10px', borderRadius: '8px', background: '#D1FAE5', color: '#065F46', fontSize: '11.5px', fontWeight: 900 }}>Reviewed ✓</span>;
      case 'Rejected':
        return <span style={{ padding: '3px 10px', borderRadius: '8px', background: '#FEE2E2', color: '#991B1B', fontSize: '11.5px', fontWeight: 900 }}>Rejected ✕</span>;
      case 'Resubmitted':
        return <span style={{ padding: '3px 10px', borderRadius: '8px', background: '#E0E7FF', color: '#3730A3', fontSize: '11.5px', fontWeight: 900 }}>Resubmitted</span>;
      default:
        return <span style={{ padding: '3px 10px', borderRadius: '8px', background: '#FEF3C7', color: '#92400E', fontSize: '11.5px', fontWeight: 900 }}>Submitted ⏳</span>;
    }
  };

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: '24px', fontFamily: "'Inter', sans-serif", color: C.text }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Navigation & Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <button onClick={() => navigate('/employee/dashboard')} style={{ background: 'none', border: 'none', color: C.teal, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <FaChevronLeft /> Back to Dashboard
            </button>
            <h1 style={{ fontSize: '24px', fontWeight: 900, margin: 0, color: C.text }}>📊 Employee Sales Reports Portal</h1>
            <p style={{ fontSize: '13px', color: C.textMid, margin: '2px 0 0 0' }}>
              Submit daily bank-wise credit card sales, upload proof, and track team progress
            </p>
          </div>

          <button 
            onClick={() => setShowCreateModal(true)}
            style={{
              background: C.teal,
              color: '#ffffff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '14px',
              fontWeight: 900,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
            }}
          >
            <FaPlus /> + Create Sales Report
          </button>
        </div>

        {/* ── KPI METRICS CARDS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '18px', padding: '18px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: C.textMid, marginBottom: '6px' }}>My Total Reports</div>
            <div style={{ fontSize: '26px', fontWeight: 900, color: C.text }}>{stats.my_total_reports || 0}</div>
            <div style={{ fontSize: '11px', color: C.teal, fontWeight: 700, marginTop: '4px' }}>Lifetime Submissions</div>
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '18px', padding: '18px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: C.textMid, marginBottom: '6px' }}>My Cards Sold</div>
            <div style={{ fontSize: '26px', fontWeight: 900, color: '#10B981' }}>{stats.my_total_cards || 0}</div>
            <div style={{ fontSize: '11px', color: '#10B981', fontWeight: 700, marginTop: '4px' }}>Total Approved Cards</div>
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '18px', padding: '18px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: C.textMid, marginBottom: '6px' }}>This Month's Cards</div>
            <div style={{ fontSize: '26px', fontWeight: 900, color: '#3B82F6' }}>{stats.my_this_month_cards || 0}</div>
            <div style={{ fontSize: '11px', color: '#3B82F6', fontWeight: 700, marginTop: '4px' }}>Current Month Progress</div>
          </div>

          {hasDownline && (
            <div style={{ background: C.card, border: `1px solid ${C.teal}40`, borderRadius: '18px', padding: '18px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: C.teal, marginBottom: '6px' }}>Team Cards Sold</div>
              <div style={{ fontSize: '26px', fontWeight: 900, color: C.teal }}>{stats.team_total_cards || 0}</div>
              <div style={{ fontSize: '11px', color: C.textMid, fontWeight: 700, marginTop: '4px' }}>From Assigned Downline</div>
            </div>
          )}
        </div>

        {/* ── TABS SELECTOR ── */}
        <div style={{ display: 'flex', gap: '12px', borderBottom: `2px solid ${C.border}`, marginBottom: '24px' }}>
          <button
            onClick={() => setActiveTab('my')}
            style={{
              padding: '12px 20px',
              border: 'none',
              borderBottom: activeTab === 'my' ? `3px solid ${C.teal}` : '3px solid transparent',
              background: 'none',
              color: activeTab === 'my' ? C.teal : C.textMid,
              fontWeight: 900,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <FaFileAlt /> My Sales Reports ({myReports.length})
          </button>

          {hasDownline && (
            <button
              onClick={() => setActiveTab('team')}
              style={{
                padding: '12px 20px',
                border: 'none',
                borderBottom: activeTab === 'team' ? `3px solid ${C.teal}` : '3px solid transparent',
                background: 'none',
                color: activeTab === 'team' ? C.teal : C.textMid,
                fontWeight: 900,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <FaUserCheck /> Team Sales Reports ({teamReports.length})
            </button>
          )}
        </div>

        {/* ── MY SALES REPORTS TAB CONTENT ── */}
        {activeTab === 'my' && (
          <div>
            {myReports.length === 0 ? (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '48px 24px', textAlign: 'center' }}>
                <FaFileAlt style={{ fontSize: '48px', color: C.textMid, marginBottom: '16px', opacity: 0.5 }} />
                <h3 style={{ fontSize: '18px', fontWeight: 900, margin: '0 0 8px 0', color: C.text }}>No Sales Reports Submitted Yet</h3>
                <p style={{ fontSize: '13px', color: C.textMid, margin: '0 0 20px 0' }}>
                  Click below to submit your daily bank-wise credit card sales report.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  style={{
                    background: C.teal,
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '12px',
                    fontWeight: 900,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  + Submit First Sales Report
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '18px' }}>
                {myReports.map((report) => (
                  <div key={report.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: C.textMid, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FaCalendarAlt style={{ color: C.teal }} /> {new Date(report.report_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 900, color: C.text, marginTop: '4px' }}>
                          Total Sold: <span style={{ color: C.teal }}>{report.total_cards} Cards</span>
                        </div>
                      </div>
                      {getStatusBadge(report.status)}
                    </div>

                    {/* Bank Breakdown List */}
                    <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '12px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: C.textMid, marginBottom: '8px', textTransform: 'uppercase' }}>
                        Bank Breakdown
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {report.banks.map((b, idx) => (
                          <div key={idx} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '6px 12px', fontSize: '12.5px', fontWeight: 800 }}>
                            {b.bank_name}: <span style={{ color: C.teal, fontWeight: 900 }}>{b.cards_sold} Cards</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Remark & Proof */}
                    {report.remark && (
                      <div style={{ fontSize: '12.5px', color: C.textMid, lineHeight: 1.4, fontStyle: 'italic', background: `${C.teal}08`, padding: '10px 12px', borderRadius: '10px' }}>
                        "{report.remark}"
                      </div>
                    )}

                    {report.photo_url && (
                      <div>
                        <a href={report.photo_url} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: C.teal, fontWeight: 800, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          📷 View Uploaded Photo Proof ↗
                        </a>
                      </div>
                    )}

                    {/* Review Feedback if present */}
                    {report.review_remark && (
                      <div style={{ fontSize: '12px', color: report.status === 'Rejected' ? '#991B1B' : C.teal, background: report.status === 'Rejected' ? '#FEE2E2' : '#D1FAE5', padding: '10px 12px', borderRadius: '10px', fontWeight: 700 }}>
                        Reviewer Remark ({report.reviewed_by_name || 'Supervisor'}): "{report.review_remark}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TEAM SALES REPORTS TAB CONTENT (For Supervisors) ── */}
        {activeTab === 'team' && hasDownline && (
          <div>
            {/* Filters Bar */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '18px', padding: '16px', marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '8px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '8px 12px' }}>
                <FaSearch style={{ color: C.textMid }} />
                <input 
                  type="text"
                  placeholder="Search employee name or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ border: 'none', background: 'none', outline: 'none', width: '100%', color: C.text, fontSize: '13px' }}
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ padding: '9px 14px', borderRadius: '12px', border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, fontSize: '13px', fontWeight: 700, outline: 'none' }}
              >
                <option value="">All Statuses</option>
                <option value="Submitted">Submitted (Pending Review)</option>
                <option value="Reviewed">Reviewed</option>
                <option value="Rejected">Rejected</option>
              </select>

              <input 
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '12px', border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, fontSize: '13px', fontWeight: 700, outline: 'none' }}
              />

              <input 
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '12px', border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, fontSize: '13px', fontWeight: 700, outline: 'none' }}
              />
            </div>

            {filteredTeamReports.length === 0 ? (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '40px', textAlign: 'center', color: C.textMid }}>
                No team sales reports found matching your criteria.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '18px' }}>
                {filteredTeamReports.map((report) => (
                  <div key={report.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 900, color: C.text }}>{report.employee_name}</div>
                        <div style={{ fontSize: '12px', color: C.teal, fontWeight: 800 }}>ID: {report.emp_code} | {report.employee_designation || 'TC'}</div>
                      </div>
                      {getStatusBadge(report.status)}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 800 }}>
                      <span>Report Date: <strong style={{ color: C.text }}>{new Date(report.report_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</strong></span>
                      <span style={{ color: C.teal, fontWeight: 900 }}>Total: {report.total_cards} Cards Sold</span>
                    </div>

                    {/* Bank Breakdown */}
                    <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '12px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: C.textMid, marginBottom: '8px' }}>BANK-WISE BREAKDOWN</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {report.banks.map((b, idx) => (
                          <div key={idx} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '6px 12px', fontSize: '12.5px', fontWeight: 800 }}>
                            {b.bank_name}: <span style={{ color: C.teal, fontWeight: 900 }}>{b.cards_sold}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {report.remark && (
                      <div style={{ fontSize: '12px', color: C.textMid, fontStyle: 'italic', background: `${C.teal}08`, padding: '10px 12px', borderRadius: '10px' }}>
                        "{report.remark}"
                      </div>
                    )}

                    {report.photo_url && (
                      <div>
                        <a href={report.photo_url} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: C.teal, fontWeight: 800, textDecoration: 'none' }}>
                          📷 View Photo Proof ↗
                        </a>
                      </div>
                    )}

                    {/* Action Button to Review */}
                    <button
                      onClick={() => {
                        setSelectedReportForReview(report);
                        setReviewStatus(report.status === 'Submitted' ? 'Reviewed' : report.status);
                        setReviewRemark(report.review_remark || '');
                      }}
                      style={{
                        background: C.bgSecondary,
                        border: `1px solid ${C.border}`,
                        color: C.text,
                        padding: '10px',
                        borderRadius: '12px',
                        fontWeight: 800,
                        fontSize: '12.5px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <FaUserCheck style={{ color: C.teal }} /> Review & Add Remark
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── CREATE SALES REPORT MODAL ── */}
      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px', padding: '28px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 900, margin: 0, color: C.text }}>+ Create Daily Sales Report</h2>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', color: C.textMid, cursor: 'pointer' }}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmitReport} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Report Date */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: C.text, marginBottom: '6px' }}>
                  Report Date *
                </label>
                <input 
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  required
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, fontSize: '14px', outline: 'none' }}
                />
              </div>

              {/* Bank-Wise Sold Counter */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: C.text }}>
                    Bank-wise Card Sales *
                  </label>
                  <span style={{ fontSize: '13px', fontWeight: 900, color: C.teal }}>
                    Total Cards: {totalCardsCalculated}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {bankRows.map((row, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <select
                        value={row.bank_id}
                        onChange={(e) => handleBankRowChange(idx, 'bank_id', e.target.value)}
                        required
                        style={{ flex: 2, padding: '11px', borderRadius: '12px', border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, fontSize: '13px', fontWeight: 700, outline: 'none' }}
                      >
                        <option value="">Select Bank...</option>
                        {banksList.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>

                      <input 
                        type="number"
                        placeholder="Cards Sold"
                        min="1"
                        value={row.cards_sold}
                        onChange={(e) => handleBankRowChange(idx, 'cards_sold', e.target.value)}
                        required
                        style={{ flex: 1, padding: '11px', borderRadius: '12px', border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, fontSize: '13px', fontWeight: 700, outline: 'none' }}
                      />

                      {bankRows.length > 1 && (
                        <button type="button" onClick={() => removeBankRow(idx)} style={{ background: '#EF444415', border: 'none', color: '#EF4444', padding: '11px', borderRadius: '12px', cursor: 'pointer' }}>
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addBankRow}
                  style={{
                    marginTop: '10px',
                    background: `${C.teal}15`,
                    color: C.teal,
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    fontWeight: 800,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <FaPlus /> + Add Another Bank
                </button>
              </div>

              {/* Upload Photo Proof */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: C.text, marginBottom: '6px' }}>
                  Upload Photo / Proof (Optional)
                </label>

                {photoPreview ? (
                  <div style={{ position: 'relative', width: '100%', height: '180px', borderRadius: '14px', overflow: 'hidden', border: `1px solid ${C.border}` }}>
                    <img src={photoPreview} alt="Proof Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={removePhoto}
                      style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(239, 68, 68, 0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <FaTimes />
                    </button>
                  </div>
                ) : (
                  <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', border: `2px dashed ${C.border}`, borderRadius: '14px', background: C.bgSecondary, cursor: 'pointer' }}>
                    <FaCamera style={{ fontSize: '28px', color: C.teal, marginBottom: '8px' }} />
                    <span style={{ fontSize: '13px', fontWeight: 800, color: C.text }}>Click to Upload Supporting Photo Proof</span>
                    <span style={{ fontSize: '11px', color: C.textMid, marginTop: '2px' }}>JPG, JPEG, PNG, WebP allowed</span>
                    <input type="file" accept="image/jpeg,image/png,image/jpg,image/webp" onChange={handlePhotoSelect} style={{ display: 'none' }} />
                  </label>
                )}
              </div>

              {/* Remark Textarea */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: C.text, marginBottom: '6px' }}>
                  Remark / Additional Information
                </label>
                <textarea 
                  rows="3"
                  placeholder="Example: Good response from the SBI and HDFC campaigns today."
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, fontSize: '13px', outline: 'none', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: '12px 20px', borderRadius: '12px', border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: '12px 24px', borderRadius: '12px', border: 'none', background: C.teal, color: '#fff', fontWeight: 900, fontSize: '13.5px', cursor: 'pointer' }}
                >
                  {submitting ? 'Submitting Report...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── REVIEW REPORT ACTION MODAL ── */}
      {selectedReportForReview && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px', padding: '28px', maxWidth: '500px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 900, margin: 0, color: C.text }}>Review Sales Report</h3>
              <button onClick={() => setSelectedReportForReview(null)} style={{ background: 'none', border: 'none', fontSize: '18px', color: C.textMid, cursor: 'pointer' }}>
                <FaTimes />
              </button>
            </div>

            <div style={{ fontSize: '13px', color: C.textMid, marginBottom: '16px' }}>
              Employee: <strong style={{ color: C.text }}>{selectedReportForReview.employee_name} ({selectedReportForReview.emp_code})</strong><br />
              Total Cards: <strong style={{ color: C.teal }}>{selectedReportForReview.total_cards} Cards</strong>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: C.text, marginBottom: '6px' }}>
                  Review Status
                </label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, fontSize: '13.5px', fontWeight: 800, outline: 'none' }}
                >
                  <option value="Reviewed">Reviewed (Approved)</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Resubmitted">Requires Resubmission</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: C.text, marginBottom: '6px' }}>
                  Review Remark / Feedback
                </label>
                <textarea 
                  rows="3"
                  placeholder="Enter supervisor notes or feedback..."
                  value={reviewRemark}
                  onChange={(e) => setReviewRemark(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, fontSize: '13px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button
                  onClick={() => setSelectedReportForReview(null)}
                  style={{ padding: '10px 18px', borderRadius: '12px', border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleReviewSubmit}
                  disabled={reviewing}
                  style={{ padding: '10px 22px', borderRadius: '12px', border: 'none', background: C.teal, color: '#fff', fontWeight: 900, fontSize: '13.5px', cursor: 'pointer' }}
                >
                  {reviewing ? 'Saving...' : 'Save Review'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

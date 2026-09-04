import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { 
  FaCalendarAlt, FaUniversity, FaBullseye, FaCheckCircle, FaHourglassHalf, 
  FaCoins, FaClock, FaCheck, FaExclamationTriangle, FaChevronDown, FaLayerGroup, FaCreditCard
} from 'react-icons/fa';
import api from '../../../services/api';

export default function MonthlyIncentiveReportView({ employeeId = null }) {
  const { C } = useTheme();

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  const fetchReport = async (m, y) => {
    setLoading(true);
    try {
      let endpoint = '/employee/monthly-incentive-report';
      if (employeeId) {
        endpoint = `/employees/${employeeId}/monthly-incentive-report`;
      }
      
      const params = {};
      if (m) params.month = m;
      if (y) params.year = y;

      const res = await api.get(endpoint, { params });
      if (res.data?.success) {
        setReport(res.data);
        if (!m || !y) {
          setSelectedMonth(res.data.period?.month || '');
          setSelectedYear(res.data.period?.year || '');
        }
      }
    } catch (err) {
      console.error('Failed to load monthly incentive report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(selectedMonth, selectedYear);
  }, [employeeId, selectedMonth, selectedYear]);

  const handleMonthSelect = (val) => {
    if (!val) return;
    const [y, m] = val.split('-');
    setSelectedYear(y);
    setSelectedMonth(m);
  };

  const formatINR = (amt) => {
    const val = parseFloat(amt || 0);
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  const renderTargetBadge = (bm) => {
    if (!bm.is_department) {
      return (
        <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800, background: '#3B82F615', color: '#3B82F6', border: '1px solid #3B82F630' }}>
          ⚡ Immediate (No Target)
        </span>
      );
    }
    if (bm.target_achieved) {
      return (
        <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800, background: '#10B98115', color: '#10B981', border: '1px solid #10B98130', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <FaCheckCircle size={11} /> Target Achieved ({bm.app_file_yes_cards_count}/{bm.target_count})
        </span>
      );
    }
    return (
      <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800, background: '#F59E0B15', color: '#F59E0B', border: '1px solid #F59E0B30', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <FaHourglassHalf size={11} /> Target Pending ({bm.app_file_yes_cards_count}/{bm.target_count})
      </span>
    );
  };

  const period = report?.period || {};
  const summary = report?.summary || {};
  const bankBreakdown = report?.bank_breakdown || [];
  const applications = report?.applications || [];
  const availableMonths = report?.available_months || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* ── Month & Year Historical Selector Bar ── */}
      <div style={{
        background: C.card,
        borderRadius: '16px',
        border: `1px solid ${C.border}`,
        padding: '18px 22px',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaCalendarAlt color={C.teal} size={18} />
            <h3 style={{ fontSize: '17px', fontWeight: 900, color: C.text, margin: 0 }}>
              Monthly Incentive Structure & Performance Audit
            </h3>
          </div>
          <p style={{ fontSize: '12.5px', color: C.textMid, margin: '4px 0 0 0' }}>
            Inspect historical bank incentive structures, department targets, and card approval performance for <strong style={{ color: C.teal }}>{period.month_name} {period.year}</strong>.
          </p>
        </div>

        {/* Dropdown Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: '12px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase' }}>Select Month:</label>
          <div style={{ position: 'relative' }}>
            <select
              value={`${selectedYear}-${selectedMonth}`}
              onChange={(e) => handleMonthSelect(e.target.value)}
              style={{
                padding: '9px 36px 9px 14px',
                borderRadius: '10px',
                border: `1px solid ${C.teal}`,
                background: C.bgSecondary,
                color: C.text,
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                appearance: 'none',
                outline: 'none'
              }}
            >
              {availableMonths.map((m) => (
                <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>
                  {m.label} {m.is_current ? '(Current Month)' : ''}
                </option>
              ))}
            </select>
            <FaChevronDown size={10} color={C.teal} style={{ position: 'absolute', right: '12px', top: '13px', pointerEvents: 'none' }} />
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '50px', textAlign: 'center', color: C.textMid, background: C.card, borderRadius: '16px', border: `1px solid ${C.border}` }}>
          Loading historical incentive audit data for {period.month_name || 'selected month'}...
        </div>
      ) : (
        <>
          {/* ── Summary KPI Cards for Selected Month ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: `${C.teal}15`, color: C.teal, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                <FaCreditCard />
              </div>
              <div>
                <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 800, textTransform: 'uppercase' }}>Approved Cards</span>
                <div style={{ fontSize: '20px', fontWeight: 900, color: C.text }}>{summary.total_approved_cards || 0}</div>
              </div>
            </div>

            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#10B98115', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                <FaCoins />
              </div>
              <div>
                <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 800, textTransform: 'uppercase' }}>Incentive Earned</span>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#10B981' }}>{formatINR(summary.total_incentive_earned)}</div>
              </div>
            </div>

            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#3B82F615', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                <FaCheck />
              </div>
              <div>
                <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 800, textTransform: 'uppercase' }}>Released Incentive</span>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#3B82F6' }}>{formatINR(summary.total_incentive_released)}</div>
              </div>
            </div>

            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#F59E0B15', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                <FaClock />
              </div>
              <div>
                <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 800, textTransform: 'uppercase' }}>Held / Pending</span>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#F59E0B' }}>{formatINR(summary.total_incentive_held)}</div>
              </div>
            </div>
          </div>

          {/* ── Bank-wise Incentive Structure & Target Performance Matrix ── */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '18px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
            <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 900, margin: 0, color: C.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaUniversity color={C.teal} /> Bank-wise Incentive Structure & Department Target Matrix ({period.month_name} {period.year})
                </h4>
                <span style={{ fontSize: '12px', color: C.textMid }}>
                  Showing incentive rates, targets, and card approvals for all partner banks in {period.month_name} {period.year}.
                </span>
              </div>
            </div>

            {bankBreakdown.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: C.textMid, fontSize: '13px' }}>
                No active bank targets or product applications recorded for {period.month_name} {period.year}.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, color: C.textMid, fontWeight: 800 }}>
                      <th style={{ padding: '12px 18px' }}>Bank</th>
                      <th style={{ padding: '12px 18px' }}>Assignment Type</th>
                      <th style={{ padding: '12px 18px', textAlign: 'center' }}>Monthly Target</th>
                      <th style={{ padding: '12px 18px', textAlign: 'center' }}>Approved Cards (App File Yes)</th>
                      <th style={{ padding: '12px 18px', textAlign: 'right' }}>Incentive Rate</th>
                      <th style={{ padding: '12px 18px', textAlign: 'center' }}>Target Status</th>
                      <th style={{ padding: '12px 18px', textAlign: 'right' }}>Earned Incentive</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bankBreakdown.map((bm, idx) => (
                      <tr key={bm.bank_id || idx} style={{ borderBottom: `1px solid ${C.border}` }}>
                        {/* Bank Info */}
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {bm.bank_logo_url ? (
                              <img src={bm.bank_logo_url} alt={bm.bank_name} style={{ width: '28px', height: '28px', objectFit: 'contain', borderRadius: '6px' }} />
                            ) : (
                              <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: `${C.teal}20`, color: C.teal, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '11px' }}>
                                {bm.bank_name?.slice(0, 3).toUpperCase()}
                              </div>
                            )}
                            <span style={{ fontWeight: 800, color: C.text }}>{bm.bank_name}</span>
                          </div>
                        </td>

                        {/* Assignment Type */}
                        <td style={{ padding: '14px 18px' }}>
                          {bm.is_department ? (
                            <span style={{ padding: '3px 9px', borderRadius: '10px', fontSize: '11px', fontWeight: 800, background: '#8B5CF615', color: '#8B5CF6', border: '1px solid #8B5CF630' }}>
                              🏢 Department Bank
                            </span>
                          ) : (
                            <span style={{ padding: '3px 9px', borderRadius: '10px', fontSize: '11px', fontWeight: 800, background: C.bgSecondary, color: C.textMid, border: `1px solid ${C.border}` }}>
                              💳 General Bank
                            </span>
                          )}
                        </td>

                        {/* Monthly Target */}
                        <td style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 800, color: C.text }}>
                          {bm.is_department && bm.target_count > 0 ? (
                            <span>{bm.target_count} Cards</span>
                          ) : (
                            <span style={{ color: C.textMid, fontSize: '11px' }}>No Target</span>
                          )}
                        </td>

                        {/* Approved Cards */}
                        <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                          <span style={{ fontSize: '14px', fontWeight: 900, color: bm.approved_cards_count > 0 ? '#10B981' : C.textMid }}>
                            {bm.app_file_yes_cards_count} Approved
                          </span>
                          {bm.approved_cards_count > bm.app_file_yes_cards_count && (
                            <span style={{ fontSize: '10.5px', color: '#F59E0B', display: 'block' }}>
                              ({bm.approved_cards_count - bm.app_file_yes_cards_count} pending App File)
                            </span>
                          )}
                        </td>

                        {/* Incentive Rate */}
                        <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 800, color: C.teal }}>
                          {bm.bonus_per_card > 0 ? `${formatINR(bm.bonus_per_card)} / Card` : 'Standard Product Rate'}
                        </td>

                        {/* Target Status Badge */}
                        <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                          {renderTargetBadge(bm)}
                        </td>

                        {/* Earned Incentive */}
                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                          <div style={{ fontSize: '15px', fontWeight: 900, color: '#10B981' }}>
                            {formatINR(bm.earned_incentive)}
                          </div>
                          {bm.held_incentive > 0 && (
                            <span style={{ fontSize: '10.5px', color: '#F59E0B', fontWeight: 700, display: 'block' }}>
                              (Held: {formatINR(bm.held_incentive)})
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Applications & Incentive Ledger for Selected Month ── */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '18px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
            <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 900, margin: 0, color: C.text }}>
                📄 Applications & Incentive Log ({period.month_name} {period.year})
              </h4>
              <span style={{ fontSize: '12px', color: C.textMid, fontWeight: 700 }}>
                {applications.length} Applications Punched
              </span>
            </div>

            {applications.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: C.textMid, fontSize: '13px' }}>
                No applications submitted in {period.month_name} {period.year}.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, color: C.textMid, fontWeight: 700 }}>
                      <th style={{ padding: '10px 16px' }}>App Number</th>
                      <th style={{ padding: '10px 16px' }}>Customer</th>
                      <th style={{ padding: '10px 16px' }}>Bank & Product</th>
                      <th style={{ padding: '10px 16px', textAlign: 'center' }}>App Status</th>
                      <th style={{ padding: '10px 16px', textAlign: 'center' }}>App File Generated</th>
                      <th style={{ padding: '10px 16px', textAlign: 'right' }}>Incentive</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app, idx) => {
                      const isApproved = ['approved', 'disbursed', 'sanctioned', 'super_admin_approved'].includes(String(app.status || '').toLowerCase());
                      const isFileYes = String(app.app_file_generated || '').trim().toLowerCase() === 'yes';

                      return (
                        <tr key={app.id || idx} style={{ borderBottom: `1px solid ${C.border}` }}>
                          <td style={{ padding: '10px 16px', fontWeight: 800, color: C.teal }}>
                            {app.app_number || 'N/A'}
                          </td>
                          <td style={{ padding: '10px 16px' }}>
                            <span style={{ fontWeight: 800, color: C.text, display: 'block' }}>{app.customer_name || 'Customer'}</span>
                            <span style={{ fontSize: '10.5px', color: C.textMid }}>{app.customer_mobile || ''}</span>
                          </td>
                          <td style={{ padding: '10px 16px' }}>
                            <span style={{ fontWeight: 700, color: C.text, display: 'block' }}>{app.product_name}</span>
                            <span style={{ fontSize: '11px', color: C.textMid }}>{app.bank_name}</span>
                          </td>
                          <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                            <span style={{
                              padding: '3px 8px', borderRadius: '10px', fontSize: '10.5px', fontWeight: 800,
                              background: isApproved ? '#10B98115' : C.bgSecondary,
                              color: isApproved ? '#10B981' : C.textMid,
                              border: `1px solid ${isApproved ? '#10B98130' : C.border}`
                            }}>
                              {String(app.status || '').toUpperCase().replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                            <span style={{
                              padding: '3px 8px', borderRadius: '10px', fontSize: '10.5px', fontWeight: 800,
                              background: isFileYes ? '#10B98115' : '#F59E0B15',
                              color: isFileYes ? '#10B981' : '#F59E0B',
                              border: `1px solid ${isFileYes ? '#10B98130' : '#F59E0B30'}`
                            }}>
                              {isFileYes ? 'YES' : (app.app_file_generated || 'NO')}
                            </span>
                          </td>
                          <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 900, color: isApproved && isFileYes ? '#10B981' : C.textMid }}>
                            {formatINR(app.tx_amount || app.default_incentive)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

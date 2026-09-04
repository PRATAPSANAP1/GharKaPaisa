import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  FaCalendarAlt, FaUsers, FaCreditCard, FaCoins, FaBullseye, 
  FaUniversity, FaFilter, FaCheckCircle, FaHourglassHalf, FaChartLine, FaChevronDown 
} from 'react-icons/fa';
import api from '../../services/api';

export default function SuperAdminIncentiveHistory() {
  const { C } = useTheme();

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((now.getMonth() + 1).toString());
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [selectedBank, setSelectedBank] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState(null);

  // Dropdown lists
  const [employeeList, setEmployeeList] = useState([]);
  const [bankList, setBankList] = useState([]);

  useEffect(() => {
    // Load employee list and bank list for filters
    api.get('/employee-management/list?limit=500').then(res => {
      if (res.data?.success) setEmployeeList(res.data.employees || []);
    }).catch(() => {});

    api.get('/public/banks').then(res => {
      if (res.data?.success) setBankList(res.data.banks || []);
    }).catch(() => {});
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/employee-management/incentive-history', {
        params: {
          year: selectedYear,
          month: selectedMonth,
          employee_id: selectedEmployee,
          bank_id: selectedBank,
          department_filter: departmentFilter
        }
      });
      if (res.data?.success) {
        setHistoryData(res.data);
      }
    } catch (err) {
      console.error('Failed to load incentive history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [selectedYear, selectedMonth, selectedEmployee, selectedBank, departmentFilter]);

  const formatINR = (amt) => {
    const val = parseFloat(amt || 0);
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  const period = historyData?.period || {};
  const summary = historyData?.summary || {};
  const records = historyData?.records || [];
  const monthlyComparison = historyData?.monthly_comparison || [];

  const monthNames = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: "'Inter', sans-serif" }}>
      
      {/* ── Header & Filter Bar ── */}
      <div style={{
        background: C.card,
        borderRadius: '20px',
        border: `1px solid ${C.border}`,
        padding: '22px 26px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaCalendarAlt color={C.teal} size={22} />
              <h2 style={{ fontSize: '20px', fontWeight: 900, color: C.text, margin: 0 }}>
                Super Admin Historical Incentive Audit
              </h2>
            </div>
            <p style={{ fontSize: '13px', color: C.textMid, margin: '4px 0 0 0' }}>
              Inspect frozen monthly incentive structures, targets, and card approval performance for <strong style={{ color: C.teal }}>{period.month_name} {period.year}</strong>.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ padding: '6px 14px', borderRadius: '12px', background: `${C.teal}15`, color: C.teal, fontWeight: 900, fontSize: '12px', border: `1px solid ${C.teal}30` }}>
              Period: {period.month_name} {period.year}
            </span>
          </div>
        </div>

        {/* ── Filter Row ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '12px',
          background: C.bgSecondary,
          padding: '16px',
          borderRadius: '14px',
          border: `1px solid ${C.border}`
        }}>
          {/* Year Filter */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: '12.5px', fontWeight: 700 }}
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>

          {/* Month Filter */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: '12.5px', fontWeight: 700 }}
            >
              {monthNames.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Employee Filter */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Employee</label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: '12.5px', fontWeight: 700 }}
            >
              <option value="all">All Employees</option>
              {employeeList.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.emp_code || 'EMP'})</option>
              ))}
            </select>
          </div>

          {/* Bank Filter */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Bank</label>
            <select
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: '12.5px', fontWeight: 700 }}
            >
              <option value="all">All Banks</option>
              {bankList.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Department Filter</label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: '12.5px', fontWeight: 700 }}
            >
              <option value="all">All Banks</option>
              <option value="assigned">Assigned Department Banks Only</option>
              <option value="non_assigned">Non-Department Banks Only</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: C.textMid, background: C.card, borderRadius: '20px', border: `1px solid ${C.border}` }}>
          Loading historical incentive audit data for {period.month_name || 'selected period'}...
        </div>
      ) : (
        <>
          {/* ── KPI Summary Cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(190px, 1fr))', gap: '16px' }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: `${C.teal}15`, color: C.teal, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                <FaUsers />
              </div>
              <div>
                <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 800, textTransform: 'uppercase' }}>Total Employees</span>
                <div style={{ fontSize: '22px', fontWeight: 900, color: C.text }}>{summary.total_employees || 0}</div>
              </div>
            </div>

            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: '#3B82F615', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                <FaCreditCard />
              </div>
              <div>
                <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 800, textTransform: 'uppercase' }}>Approved Cards</span>
                <div style={{ fontSize: '22px', fontWeight: 900, color: '#3B82F6' }}>{summary.total_approved_cards || 0}</div>
              </div>
            </div>

            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: '#10B98115', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                <FaCoins />
              </div>
              <div>
                <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 800, textTransform: 'uppercase' }}>Total Incentive</span>
                <div style={{ fontSize: '22px', fontWeight: 900, color: '#10B981' }}>{formatINR(summary.total_incentive)}</div>
              </div>
            </div>

            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: '#8B5CF615', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                <FaBullseye />
              </div>
              <div>
                <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 800, textTransform: 'uppercase' }}>Targets Achieved</span>
                <div style={{ fontSize: '22px', fontWeight: 900, color: '#8B5CF6' }}>{summary.targets_achieved || 0}</div>
              </div>
            </div>

            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: '#F59E0B15', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                <FaUniversity />
              </div>
              <div>
                <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 800, textTransform: 'uppercase' }}>Department Banks</span>
                <div style={{ fontSize: '22px', fontWeight: 900, color: '#F59E0B' }}>{summary.department_banks || 0}</div>
              </div>
            </div>
          </div>

          {/* ── Historical Performance Snapshot Table ── */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 900, margin: 0, color: C.text }}>
                  Historical Performance Ledger ({period.month_name} {period.year})
                </h3>
                <span style={{ fontSize: '12.5px', color: C.textMid }}>
                  Showing employee bank-wise card targets, approvals, rates, and earned bonuses.
                </span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 800, color: C.teal }}>
                {records.length} Audit Entries
              </span>
            </div>

            {records.length === 0 ? (
              <div style={{ padding: '50px', textAlign: 'center', color: C.textMid, fontSize: '13.5px' }}>
                No performance records matching selected filters in {period.month_name} {period.year}.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, color: C.textMid, fontWeight: 800 }}>
                      <th style={{ padding: '14px 20px' }}>Employee</th>
                      <th style={{ padding: '14px 20px' }}>Bank</th>
                      <th style={{ padding: '14px 20px' }}>Department</th>
                      <th style={{ padding: '14px 20px', textAlign: 'center' }}>Target</th>
                      <th style={{ padding: '14px 20px', textAlign: 'center' }}>Approved</th>
                      <th style={{ padding: '14px 20px', textAlign: 'right' }}>Incentive/Card</th>
                      <th style={{ padding: '14px 20px', textAlign: 'right' }}>Bonus/Card</th>
                      <th style={{ padding: '14px 20px', textAlign: 'center' }}>Target Status</th>
                      <th style={{ padding: '14px 20px', textAlign: 'right' }}>Earned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((rec, idx) => (
                      <tr key={idx} style={{ borderBottom: `1px solid ${C.border}` }}>
                        {/* Employee */}
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{ fontWeight: 900, color: C.text, display: 'block' }}>{rec.employee_name}</span>
                          <span style={{ fontSize: '11px', color: C.teal, fontWeight: 700 }}>{rec.emp_code}</span>
                        </td>

                        {/* Bank */}
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {rec.bank_logo_url ? (
                              <img src={rec.bank_logo_url} alt={rec.bank_name} style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                            ) : null}
                            <span style={{ fontWeight: 800, color: C.text }}>{rec.bank_name}</span>
                          </div>
                        </td>

                        {/* Department */}
                        <td style={{ padding: '14px 20px' }}>
                          {rec.department_assigned ? (
                            <span style={{ padding: '3px 9px', borderRadius: '10px', fontSize: '11px', fontWeight: 800, background: '#8B5CF615', color: '#8B5CF6', border: '1px solid #8B5CF630' }}>
                              Yes (Assigned)
                            </span>
                          ) : (
                            <span style={{ padding: '3px 9px', borderRadius: '10px', fontSize: '11px', fontWeight: 800, background: C.bgSecondary, color: C.textMid, border: `1px solid ${C.border}` }}>
                              No (General)
                            </span>
                          )}
                        </td>

                        {/* Target */}
                        <td style={{ padding: '14px 20px', textAlign: 'center', fontWeight: 800 }}>
                          {rec.department_assigned && rec.target_cards > 0 ? `${rec.target_cards}` : '—'}
                        </td>

                        {/* Approved */}
                        <td style={{ padding: '14px 20px', textAlign: 'center', fontWeight: 900, color: rec.approved_cards > 0 ? '#10B981' : C.textMid }}>
                          {rec.app_file_yes_cards}
                        </td>

                        {/* Incentive/Card */}
                        <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: 800, color: C.teal }}>
                          {!rec.department_assigned && rec.incentive_per_card > 0 ? formatINR(rec.incentive_per_card) : '—'}
                        </td>

                        {/* Bonus/Card */}
                        <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: 800, color: '#8B5CF6' }}>
                          {rec.department_assigned && rec.bonus_per_card > 0 ? formatINR(rec.bonus_per_card) : '—'}
                        </td>

                        {/* Target Status */}
                        <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                          {!rec.department_assigned ? (
                            <span style={{ padding: '3px 9px', borderRadius: '10px', fontSize: '11px', fontWeight: 800, background: '#3B82F615', color: '#3B82F6' }}>
                              Immediate
                            </span>
                          ) : rec.target_achieved ? (
                            <span style={{ padding: '3px 9px', borderRadius: '10px', fontSize: '11px', fontWeight: 800, background: '#10B98115', color: '#10B981', border: '1px solid #10B98130' }}>
                              ✅ Achieved
                            </span>
                          ) : (
                            <span style={{ padding: '3px 9px', borderRadius: '10px', fontSize: '11px', fontWeight: 800, background: '#F59E0B15', color: '#F59E0B', border: '1px solid #F59E0B30' }}>
                              ⏳ Pending
                            </span>
                          )}
                        </td>

                        {/* Earned */}
                        <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: 900, color: rec.earned_incentive > 0 ? '#10B981' : C.textMid }}>
                          {formatINR(rec.earned_incentive)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Monthly Comparison Trend Table ── */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 900, color: C.text, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaChartLine color={C.teal} /> Trailing Monthly Comparison (6-Month Trend)
            </h3>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, color: C.textMid, fontWeight: 800 }}>
                    <th style={{ padding: '12px 18px' }}>Month</th>
                    <th style={{ padding: '12px 18px', textAlign: 'center' }}>Approved Cards</th>
                    <th style={{ padding: '12px 18px', textAlign: 'right' }}>Total Incentive Earned</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyComparison.map((m, idx) => (
                    <tr key={idx} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '12px 18px', fontWeight: 800, color: C.text }}>
                        {m.label}
                      </td>
                      <td style={{ padding: '12px 18px', textAlign: 'center', fontWeight: 900, color: C.teal }}>
                        {m.approved_cards} Cards
                      </td>
                      <td style={{ padding: '12px 18px', textAlign: 'right', fontWeight: 900, color: '#10B981' }}>
                        {formatINR(m.total_incentive)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

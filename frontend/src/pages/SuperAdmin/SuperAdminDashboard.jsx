import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { useTheme, makeS } from '../../components/Partner/ThemeContext';
import { Icons } from '../../components/Partner/PartnerIcons';

export default function SuperAdminDashboard() {
  const { C } = useTheme();
  const S = makeS(C);
  
  // Tabs: 'directory' or 'create'
  const [activeTab, setActiveTab] = useState('directory');
  
  // Data State
  const [admins, setAdmins] = useState([]);
  const [businessStats, setBusinessStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Form State
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    mobile: '',
    employeeId: '',
    password: '',
    confirmPassword: '',
    department: 'Operations',
    designation: ''
  });
  
  const [formLoading, setFormLoading] = useState(false);
  const [formErr, setFormErr] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Fetch Admins
  const fetchAdmins = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.get('/superadmin/admins');
      if (res.data && res.data.success) {
        setAdmins(res.data.data);
      } else {
        setErrorMsg('Failed to load admins list');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Error fetching administrative directory');
    } finally {
      setLoading(false);
    }
  };

  const fetchBusinessStats = async () => {
    try {
      const res = await api.get('/reports/overview');
      if (res.data && res.data.success) {
        setBusinessStats(res.data.data);
      }
    } catch (e) {
      console.error('Failed to load business stats', e);
    }
  };

  useEffect(() => {
    fetchAdmins();
    fetchBusinessStats();
  }, []);

  // Handle Input change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Create Admin Submission
  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setFormErr('');
    setFormSuccess('');

    // Validations
    if (!form.fullName || !form.email || !form.mobile || !form.employeeId || !form.password || !form.confirmPassword || !form.department || !form.designation) {
      return setFormErr('All fields marked with * are required');
    }

    if (form.password !== form.confirmPassword) {
      return setFormErr('Passwords do not match');
    }

    if (form.password.length < 8) {
      return setFormErr('Password must be at least 8 characters long');
    }

    setFormLoading(true);
    try {
      const res = await api.post('/superadmin/create-admin', form);
      if (res.data && res.data.success) {
        setFormSuccess('Admin created successfully.');
        setForm({
          fullName: '',
          email: '',
          mobile: '',
          employeeId: '',
          password: '',
          confirmPassword: '',
          department: 'Operations',
          designation: ''
        });
        fetchAdmins(); // Refresh
        setTimeout(() => setActiveTab('directory'), 1500);
      }
    } catch (err) {
      setFormErr(err.response?.data?.message || 'Failed to create administrative user');
    } finally {
      setFormLoading(false);
    }
  };

  // Toggle Admin block status
  const handleToggleBlock = async (userId, currentStatus) => {
    const shouldBlock = currentStatus === 'active';
    const actionLabel = shouldBlock ? 'suspend' : 'activate';
    
    if (!window.confirm(`Are you sure you want to ${actionLabel} this administrator?`)) {
      return;
    }

    try {
      const res = await api.post('/superadmin/block-user', {
        userId,
        block: shouldBlock
      });
      if (res.data && res.data.success) {
        fetchAdmins();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  // Stats calculations
  const stats = {
    total: admins.length,
    active: admins.filter(a => a.status === 'active' || a.isActive).length,
    suspended: admins.filter(a => a.status === 'suspended').length
  };

  const bStats = businessStats || {
    Partners: { total: 0, active: 0, pending_kyc: 0 },
    leads: { total_leads: 0, approved_leads: 0, rejected_leads: 0, pending_leads: 0 },
    withdrawal: { pending_withdrawals: 0, total_commission_paid: 0 },
    banks: { total_banks: 0 },
    products: { total_products: 0 }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Top Banner / Welcome */}
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", marginBottom: "8px" }}>
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: 800, color: C.text, margin: 0 }}>System Administrators</h2>
          <p style={{ fontSize: "13px", color: C.textLight, margin: "4px 0 0 0" }}>Manage and provision administrator credentials and permission settings.</p>
        </div>
        
        {/* Navigation Tabs */}
        <div style={{ display: "flex", background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "4px" }}>
          <button
            onClick={() => setActiveTab('directory')}
            style={{
              background: activeTab === 'directory' ? C.teal : "transparent",
              color: activeTab === 'directory' ? "#fff" : C.textMid,
              border: "none", borderRadius: "8px", padding: "8px 16px",
              fontWeight: 700, fontSize: "13px", cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            Admins Directory
          </button>
          <button
            onClick={() => setActiveTab('create')}
            style={{
              background: activeTab === 'create' ? C.teal : "transparent",
              color: activeTab === 'create' ? "#fff" : C.textMid,
              border: "none", borderRadius: "8px", padding: "8px 16px",
              fontWeight: 700, fontSize: "13px", cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            Create New Admin
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        {[
          { label: "Total Partners", val: bStats.Partners?.total || 0, icon: <Icons.profile size={24} />, color: C.teal },
          { label: "Active Partners", val: bStats.Partners?.active || 0, icon: <Icons.check size={24} />, color: C.green },
          { label: "Pending KYC", val: bStats.Partners?.pending_kyc || 0, icon: <Icons.clock size={24} />, color: C.gold },
          { label: "Total Leads", val: bStats.leads?.total_leads || 0, icon: <Icons.trending size={24} />, color: C.teal },
          { label: "Approved Leads", val: bStats.leads?.approved_leads || 0, icon: <Icons.check size={24} />, color: C.green },
          { label: "Rejected Leads", val: bStats.leads?.rejected_leads || 0, icon: <Icons.x size={24} />, color: C.red },
          { label: "Commission Paid", val: `₹${parseFloat(bStats.withdrawal?.total_commission_paid || 0).toLocaleString("en-IN")}`, icon: <Icons.wallet size={24} />, color: C.green },
          { label: "Pending Withdrawals", val: bStats.withdrawal?.pending_withdrawals || 0, icon: <Icons.clock size={24} />, color: C.gold },
          { label: "Total Banks", val: bStats.banks?.total_banks || 0, icon: <Icons.wallet size={24} />, color: C.teal },
          { label: "Total Products", val: bStats.products?.total_products || 0, icon: <Icons.creditCard size={24} />, color: C.teal }
        ].map((card, idx) => (
          <div key={idx} style={{ ...S.card, display: "flex", alignItems: "center", gap: "16px", padding: "16px" }}>
            <div style={{ width: "40px", height: "40px", background: `${card.color}15`, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: card.color }}>
              {card.icon}
            </div>
            <div>
              <div style={{ fontSize: "20px", fontWeight: 800, color: C.text }}>{card.val}</div>
              <div style={{ fontSize: "10.5px", fontWeight: 700, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.5px" }}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Container */}
      {activeTab === 'directory' ? (
        <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 800, color: C.text, margin: 0 }}>Directory List</h3>
            <button 
              onClick={fetchAdmins}
              style={{ background: "none", border: "none", color: C.textLight, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600 }}
              title="Refresh"
            >
              🔄 Refresh
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "48px", color: C.textLight }}>
              <div className="animate-spin" style={{ width: "24px", height: "24px", border: `3px solid ${C.teal}`, borderTopColor: "transparent", borderRadius: "50%", margin: "0 auto 8px" }}></div>
              Loading directory list...
            </div>
          ) : errorMsg ? (
            <div style={{ padding: "24px", textAlign: "center", color: C.red, background: `${C.red}10`, margin: "24px", borderRadius: "12px", border: `1px solid ${C.red}20` }}>
              <Icons.x size={24} style={{ margin: "0 auto 8px" }} />
              <p style={{ fontWeight: 600, margin: 0 }}>{errorMsg}</p>
            </div>
          ) : admins.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px", color: C.textLight }}>
              <p style={{ fontSize: "16px", margin: 0 }}>No administrators provisioned yet.</p>
              <button 
                onClick={() => setActiveTab('create')}
                style={{ ...S.btn("primary"), marginTop: "16px", padding: "10px 20px" }}
              >
                Create First Admin
              </button>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, color: C.textLight, fontSize: "12px", textTransform: "uppercase" }}>
                    <th style={{ padding: "14px 16px" }}>Name</th>
                    <th style={{ padding: "14px 16px" }}>Employee ID</th>
                    <th style={{ padding: "14px 16px" }}>Contact Info</th>
                    <th style={{ padding: "14px 16px" }}>Department</th>
                    <th style={{ padding: "14px 16px" }}>Designation</th>
                    <th style={{ padding: "14px 16px" }}>Status</th>
                    <th style={{ padding: "14px 16px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: "13.5px", color: C.text }}>
                  {admins.map((admin) => (
                    <tr key={admin._id} style={{ borderBottom: `1px solid ${C.border}60` }} className="hover:bg-gray-50/10">
                      <td style={{ padding: "14px 16px", fontWeight: 700 }}>
                        {admin.fullName || 'No Name Provided'}
                      </td>
                      <td style={{ padding: "14px 16px", fontFamily: "monospace", fontSize: "12px", color: C.textMid }}>
                        {admin.employeeId}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 600 }}>{admin.email}</div>
                        <div style={{ fontSize: "11px", color: C.textLight }}>{admin.mobile}</div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ display: "inline-block", padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, background: `${C.teal}15`, color: C.teal }}>
                          {admin.department}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        {admin.designation}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        {admin.status === 'active' || admin.isActive ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "3px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: `${C.green}15`, color: C.green }}>
                            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: C.green }}></span> Active
                          </span>
                        ) : (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "3px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: `${C.red}15`, color: C.red }}>
                            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: C.red }}></span> Suspended
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <button
                          onClick={() => handleToggleBlock(admin._id, admin.status)}
                          style={{
                            background: admin.status === 'active' ? `${C.red}15` : `${C.green}15`,
                            color: admin.status === 'active' ? C.red : C.green,
                            border: `1px solid ${admin.status === 'active' ? C.red : C.green}30`,
                            padding: "6px 12px",
                            borderRadius: "8px",
                            fontSize: "12px",
                            fontWeight: 800,
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                        >
                          {admin.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Create Admin Form */
        <div style={{ ...S.card, maxWidth: "600px" }}>
          <div style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: "14px", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 800, color: C.text, margin: 0 }}>Provision Administrator</h3>
          </div>
          
          <form onSubmit={handleCreateAdmin} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {formErr && (
              <div style={{ padding: "12px", background: `${C.red}10`, border: `1px solid ${C.red}30`, borderRadius: "10px", color: C.red, fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Icons.x size={16} /> {formErr}
              </div>
            )}
            
            {formSuccess && (
              <div style={{ padding: "12px", background: `${C.green}10`, border: `1px solid ${C.green}30`, borderRadius: "10px", color: C.green, fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Icons.check size={16} /> {formSuccess}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" }}>
              {/* Full Name */}
              <div>
                <label style={S.label}>Full Name *</label>
                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="e.g. Pratap Sanap"
                  style={S.input}
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label style={S.label}>Email Address *</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="e.g. manager@gharkapaisa.in"
                  style={S.input}
                  required
                />
              </div>

              {/* Mobile */}
              <div>
                <label style={S.label}>Mobile Number *</label>
                <input
                  name="mobile"
                  value={form.mobile}
                  onChange={handleChange}
                  placeholder="10-digit number"
                  style={S.input}
                  required
                />
              </div>

              {/* Employee ID */}
              <div>
                <label style={S.label}>Employee ID *</label>
                <input
                  name="employeeId"
                  value={form.employeeId}
                  onChange={handleChange}
                  placeholder="e.g. GKP-1024"
                  style={S.input}
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label style={S.label}>Password *</label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min 8 characters"
                  style={S.input}
                  required
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label style={S.label}>Confirm Password *</label>
                <input
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat password"
                  style={S.input}
                  required
                />
              </div>

              {/* Department */}
              <div>
                <label style={S.label}>Department *</label>
                <select
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  style={S.input}
                  required
                >
                  <option value="Operations">Operations</option>
                  <option value="Sales">Sales</option>
                  <option value="Credit">Credit</option>
                  <option value="Collection">Collection</option>
                  <option value="Support">Support</option>
                  <option value="Accounts">Accounts</option>
                  <option value="Marketing">Marketing</option>
                </select>
              </div>

              {/* Designation */}
              <div>
                <label style={S.label}>Designation *</label>
                <input
                  name="designation"
                  value={form.designation}
                  onChange={handleChange}
                  placeholder="e.g. Credit Officer"
                  style={S.input}
                  required
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px", borderTop: `1px solid ${C.border}40`, paddingTop: "16px" }}>
              <button
                type="button"
                onClick={() => setActiveTab('directory')}
                style={S.btn("outline")}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formLoading}
                style={S.btn("primary")}
              >
                {formLoading ? 'Creating User...' : 'Provision Admin'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

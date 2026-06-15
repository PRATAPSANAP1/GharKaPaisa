import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { useTheme } from '../../components/Partner/ThemeContext';
import { Icons } from '../../components/Partner/PartnerIcons';

export default function SuperAdminDashboard() {
  const { C } = useTheme();
  
  // Tabs: 'directory' or 'create'
  const [activeTab, setActiveTab] = useState('directory');
  
  // Data State
  const [admins, setAdmins] = useState([]);
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

  useEffect(() => {
    fetchAdmins();
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

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">System Administrators</h2>
          <p className="text-gray-500 text-sm mt-1">Manage and provision administrator credentials and permission settings.</p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-xl mt-4 md:mt-0 self-start md:self-center">
          <button
            onClick={() => setActiveTab('directory')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'directory' ? 'bg-white text-indigo-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Admins Directory
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'create' ? 'bg-white text-indigo-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Create New Admin
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
            <Icons.profile size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
            <div className="text-gray-400 text-xs font-medium uppercase tracking-wider">Total Administrators</div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <Icons.check size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-800">{stats.active}</div>
            <div className="text-gray-400 text-xs font-medium uppercase tracking-wider">Active Admins</div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-500">
            <Icons.x size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-800">{stats.suspended}</div>
            <div className="text-gray-400 text-xs font-medium uppercase tracking-wider">Suspended Admins</div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      {activeTab === 'directory' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-bold text-gray-800 text-lg">Directory List</h3>
            <button 
              onClick={fetchAdmins}
              className="text-gray-400 hover:text-indigo-600 transition"
              title="Refresh"
            >
              🔄 Refresh
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-400">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-indigo-600 rounded-full border-t-transparent mb-2"></div>
              <p>Loading directory list...</p>
            </div>
          ) : errorMsg ? (
            <div className="p-12 text-center text-red-500 bg-red-50/50 m-6 rounded-2xl border border-red-100">
              <Icons.x size={24} className="mx-auto mb-2" />
              <p className="font-semibold">{errorMsg}</p>
            </div>
          ) : admins.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <p className="text-lg">No administrators provisioned yet.</p>
              <button 
                onClick={() => setActiveTab('create')}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition"
              >
                Create First Admin
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-400 font-semibold text-xs tracking-wider border-b border-gray-100">
                    <th className="py-4 px-6">Name</th>
                    <th className="py-4 px-6">Employee ID</th>
                    <th className="py-4 px-6">Contact Info</th>
                    <th className="py-4 px-6">Department</th>
                    <th className="py-4 px-6">Designation</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-600">
                  {admins.map((admin) => (
                    <tr key={admin._id} className="hover:bg-gray-50/50 transition">
                      <td className="py-4 px-6 font-semibold text-gray-800">
                        {admin.fullName || 'No Name Provided'}
                      </td>
                      <td className="py-4 px-6 font-mono text-xs">
                        {admin.employeeId}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-medium text-gray-700">{admin.email}</div>
                        <div className="text-xs text-gray-400">{admin.mobile}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                          {admin.department}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {admin.designation}
                      </td>
                      <td className="py-4 px-6">
                        {admin.status === 'active' || admin.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Suspended
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleToggleBlock(admin._id, admin.status)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${admin.status === 'active' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden max-w-2xl">
          <div className="p-6 border-b border-gray-50">
            <h3 className="font-bold text-gray-800 text-lg">Provision Administrator</h3>
          </div>
          
          <form onSubmit={handleCreateAdmin} className="p-6 space-y-4">
            {formErr && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm flex items-center gap-2">
                <Icons.x size={16} /> {formErr}
              </div>
            )}
            
            {formSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-sm flex items-center gap-2">
                <Icons.check size={16} /> {formSuccess}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-gray-600 text-xs font-bold mb-1.5 uppercase tracking-wide">Full Name *</label>
                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="e.g. Pratap Sanap"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-gray-600 text-xs font-bold mb-1.5 uppercase tracking-wide">Email Address *</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="e.g. manager@gharkapaisa.in"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                  required
                />
              </div>

              {/* Mobile */}
              <div>
                <label className="block text-gray-600 text-xs font-bold mb-1.5 uppercase tracking-wide">Mobile Number *</label>
                <input
                  name="mobile"
                  value={form.mobile}
                  onChange={handleChange}
                  placeholder="10-digit number"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                  required
                />
              </div>

              {/* Employee ID */}
              <div>
                <label className="block text-gray-600 text-xs font-bold mb-1.5 uppercase tracking-wide">Employee ID *</label>
                <input
                  name="employeeId"
                  value={form.employeeId}
                  onChange={handleChange}
                  placeholder="e.g. GKP-1024"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-gray-600 text-xs font-bold mb-1.5 uppercase tracking-wide">Password *</label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min 8 characters"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                  required
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-gray-600 text-xs font-bold mb-1.5 uppercase tracking-wide">Confirm Password *</label>
                <input
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat password"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                  required
                />
              </div>

              {/* Department */}
              <div>
                <label className="block text-gray-600 text-xs font-bold mb-1.5 uppercase tracking-wide">Department *</label>
                <select
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
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
                <label className="block text-gray-600 text-xs font-bold mb-1.5 uppercase tracking-wide">Designation *</label>
                <input
                  name="designation"
                  value={form.designation}
                  onChange={handleChange}
                  placeholder="e.g. Credit Officer"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                  required
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setActiveTab('directory')}
                className="px-5 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-500 rounded-xl text-sm font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition disabled:opacity-75"
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

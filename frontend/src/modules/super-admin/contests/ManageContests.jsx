import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { 
  HiOutlineTrophy, 
  HiOutlinePlus, 
  HiOutlinePencilSquare, 
  HiOutlineTrash, 
  HiOutlineCalendar, 
  HiOutlineSparkles,
  HiOutlineXMark,
  HiOutlinePhoto
} from 'react-icons/hi2';
import api from '../../../services/api';

export default function ManageContests() {
  const { C, isDark } = useTheme();
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    short_description: '',
    description: '',
    image_url: '',
    contest_type: 'credit_card',
    target_value: 50,
    target_unit: 'Approved Applications',
    reward_type: 'Fixed Cash Reward',
    reward_value: 5000,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    department_id: 'Credit Cards',
    eligible_employees: 'All eligible employees',
    status: 'ACTIVE'
  });
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchContests();
  }, []);

  const fetchContests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/contests');
      if (res.data?.success) {
        setContests(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching contests:', err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      title: '',
      short_description: '',
      description: '',
      image_url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80',
      contest_type: 'credit_card',
      target_value: 50,
      target_unit: 'Approved Applications',
      reward_type: 'Fixed Cash Reward',
      reward_value: 5000,
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      department_id: 'Credit Cards',
      eligible_employees: 'All eligible employees',
      status: 'ACTIVE'
    });
    setBannerFile(null);
    setBannerPreview(null);
    setModalOpen(true);
  };

  const openEditModal = (contest) => {
    setEditingId(contest.id);
    setFormData({
      title: contest.title || '',
      short_description: contest.short_description || '',
      description: contest.description || '',
      image_url: contest.image_url || '',
      contest_type: contest.contest_type || 'credit_card',
      target_value: contest.target_value || 50,
      target_unit: contest.target_unit || 'Approved Applications',
      reward_type: contest.reward_type || 'Fixed Cash Reward',
      reward_value: contest.reward_value || 5000,
      start_date: contest.start_date ? new Date(contest.start_date).toISOString().split('T')[0] : '',
      end_date: contest.end_date ? new Date(contest.end_date).toISOString().split('T')[0] : '',
      department_id: contest.department_id || 'Credit Cards',
      eligible_employees: contest.eligible_employees || 'All eligible employees',
      status: contest.status || 'ACTIVE'
    });
    setBannerFile(null);
    setBannerPreview(contest.image_url || null);
    setModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        data.append(key, formData[key]);
      });
      if (bannerFile) {
        data.append('banner', bannerFile);
      }

      if (editingId) {
        await api.put(`/contests/${editingId}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/contests', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setModalOpen(false);
      fetchContests();
    } catch (err) {
      console.error('Error saving contest:', err);
      alert('Failed to save contest: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this contest?')) return;
    try {
      await api.delete(`/contests/${id}`);
      fetchContests();
    } catch (err) {
      console.error('Error deleting contest:', err);
      alert('Failed to delete contest.');
    }
  };

  const filteredContests = contests.filter((c) => {
    if (activeTab === 'ALL') return true;
    return c.status === activeTab;
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, color: C.text, margin: 0 }}>
            🏆 Employee Contest Management
          </h1>
          <p style={{ fontSize: '13.5px', color: isDark ? '#94A3B8' : '#64748B', margin: '4px 0 0 0' }}>
            Create and manage contests, targets, and rewards for sales employees.
          </p>
        </div>

        <button
          onClick={openAddModal}
          style={{
            background: 'linear-gradient(135deg, #0F766E, #0D9488)',
            color: '#FFFFFF',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '12px',
            fontSize: '13.5px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(15,118,110,0.35)'
          }}
        >
          <HiOutlinePlus size={18} /> Create New Contest
        </button>
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          borderBottom: `1px solid ${C.border}`,
          paddingBottom: '12px'
        }}
      >
        {['ALL', 'ACTIVE', 'UPCOMING', 'COMPLETED', 'DRAFT'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === tab ? (C.employeePrimary || '#0F766E') : 'transparent',
              color: activeTab === tab ? '#FFFFFF' : (isDark ? '#94A3B8' : '#64748B'),
              fontSize: '13px',
              fontWeight: activeTab === tab ? 800 : 600,
              cursor: 'pointer'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Contests Table / Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: isDark ? '#94A3B8' : '#64748B' }}>
          Loading contests...
        </div>
      ) : filteredContests.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: C.card,
            borderRadius: '16px',
            border: `1px solid ${C.border}`
          }}
        >
          <HiOutlineTrophy size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 6px 0', color: C.text }}>
            No contests found
          </h3>
          <p style={{ fontSize: '13px', color: isDark ? '#94A3B8' : '#64748B', margin: 0 }}>
            Click "Create New Contest" to add your first employee contest.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '24px'
          }}
        >
          {filteredContests.map((contest) => (
            <div
              key={contest.id}
              style={{
                background: C.card,
                borderRadius: '16px',
                border: `1px solid ${C.border}`,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
              }}
            >
              {/* Banner Header Image */}
              <div style={{ position: 'relative', width: '100%', height: '140px', background: '#0F172A' }}>
                <img
                  src={contest.image_url}
                  alt={contest.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80';
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: contest.status === 'ACTIVE' ? '#10B981' : contest.status === 'UPCOMING' ? '#F59E0B' : '#64748B',
                    color: '#FFFFFF',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '12px',
                    textTransform: 'uppercase'
                  }}
                >
                  {contest.status}
                </span>
              </div>

              {/* Body */}
              <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: '0 0 6px 0' }}>
                    {contest.title}
                  </h3>
                  <p style={{ fontSize: '12.5px', color: isDark ? '#94A3B8' : '#64748B', margin: '0 0 14px 0', lineHeight: 1.4 }}>
                    {contest.short_description || contest.description}
                  </p>

                  <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                    <div>
                      <strong>Target: </strong>{contest.target_value} {contest.target_unit || 'Applications'}
                    </div>
                    <div>
                      <strong>Reward: </strong>₹{parseFloat(contest.reward_value).toLocaleString('en-IN')}
                    </div>
                    <div>
                      <strong>Dates: </strong>{new Date(contest.start_date).toLocaleDateString('en-IN')} - {new Date(contest.end_date).toLocaleDateString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons (Edit & Trash Delete Icon) */}
                <div style={{ display: 'flex', gap: '8px', borderTop: `1px solid ${C.border}`, paddingTop: '12px' }}>
                  <button
                    onClick={() => openEditModal(contest)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '8px',
                      border: `1px solid ${C.border}`,
                      background: isDark ? '#334155' : '#F1F5F9',
                      color: C.text,
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <HiOutlinePencilSquare size={16} /> Edit
                  </button>

                  <button
                    onClick={() => handleDelete(contest.id)}
                    title="Delete Contest"
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#EF4444',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <HiOutlineTrash size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create / Edit Contest Modal ── */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: '20px',
              width: '100%',
              maxWidth: '620px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              position: 'relative'
            }}
          >
            <button
              onClick={() => setModalOpen(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: isDark ? '#334155' : '#E2E8F0',
                border: 'none',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: C.text
              }}
            >
              <HiOutlineXMark size={18} />
            </button>

            <h2 style={{ fontSize: '18px', fontWeight: 900, color: C.text, margin: '0 0 16px 0' }}>
              {editingId ? 'Edit Contest' : 'Create New Employee Contest'}
            </h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px', color: C.text }}>
                  Contest Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Credit Card Champions"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: `1px solid ${C.border}`,
                    background: C.bgSecondary,
                    color: C.text,
                    fontSize: '13px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px', color: C.text }}>
                  Short Subtitle / Promo Text
                </label>
                <input
                  type="text"
                  value={formData.short_description}
                  onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                  placeholder="e.g. Achieve target and win ₹5,000 cash reward"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: `1px solid ${C.border}`,
                    background: C.bgSecondary,
                    color: C.text,
                    fontSize: '13px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px', color: C.text }}>
                  Detailed Contest Description & Rules
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe contest eligibility and application counting rules..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: `1px solid ${C.border}`,
                    background: C.bgSecondary,
                    color: C.text,
                    fontSize: '13px'
                  }}
                />
              </div>

              {/* Image Configuration & Ratio Preview */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px', color: C.text }}>
                  Contest Banner Image (1200 x 500 px / 12:5 ratio recommended)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ marginBottom: '8px', fontSize: '12px' }}
                />
                <input
                  type="text"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="Or enter image URL"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: `1px solid ${C.border}`,
                    background: C.bgSecondary,
                    color: C.text,
                    fontSize: '12px'
                  }}
                />
                {bannerPreview && (
                  <div style={{ marginTop: '8px', width: '100%', height: '120px', borderRadius: '10px', overflow: 'hidden', border: `1px solid ${C.border}` }}>
                    <img src={bannerPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
              </div>

              {/* Grid: Target & Reward */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px', color: C.text }}>
                    Target Value *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.target_value}
                    onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: `1px solid ${C.border}`,
                      background: C.bgSecondary,
                      color: C.text,
                      fontSize: '13px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px', color: C.text }}>
                    Target Unit
                  </label>
                  <input
                    type="text"
                    value={formData.target_unit}
                    onChange={(e) => setFormData({ ...formData, target_unit: e.target.value })}
                    placeholder="Approved Applications"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: `1px solid ${C.border}`,
                      background: C.bgSecondary,
                      color: C.text,
                      fontSize: '13px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px', color: C.text }}>
                    Reward Value (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.reward_value}
                    onChange={(e) => setFormData({ ...formData, reward_value: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: `1px solid ${C.border}`,
                      background: C.bgSecondary,
                      color: C.text,
                      fontSize: '13px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px', color: C.text }}>
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: `1px solid ${C.border}`,
                      background: C.bgSecondary,
                      color: C.text,
                      fontSize: '13px'
                    }}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="UPCOMING">UPCOMING</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="DRAFT">DRAFT</option>
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px', color: C.text }}>
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: `1px solid ${C.border}`,
                      background: C.bgSecondary,
                      color: C.text,
                      fontSize: '13px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px', color: C.text }}>
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: `1px solid ${C.border}`,
                      background: C.bgSecondary,
                      color: C.text,
                      fontSize: '13px'
                    }}
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #0F766E, #0D9488)',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  {submitting ? 'Saving...' : editingId ? 'Update Contest' : 'Create Contest'}
                </button>

                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{
                    padding: '12px 20px',
                    borderRadius: '10px',
                    border: `1px solid ${C.border}`,
                    background: C.bgSecondary,
                    color: C.text,
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

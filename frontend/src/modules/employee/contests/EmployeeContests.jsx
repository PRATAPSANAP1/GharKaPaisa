import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { 
  HiOutlineTrophy, 
  HiOutlineMagnifyingGlass, 
  HiOutlineCalendar, 
  HiOutlineCheckCircle, 
  HiOutlineClock,
  HiOutlineSparkles,
  HiOutlineInformationCircle,
  HiOutlineXMark,
  HiOutlineFire,
  HiOutlineArrowLeft
} from 'react-icons/hi2';
import PartnerBannerCarousel from '../../../components/PartnerBannerCarousel';
import api from '../../../services/api';

export default function EmployeeContests() {
  const { C, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('ACTIVE'); // 'ACTIVE', 'UPCOMING', 'COMPLETED'
  const [searchQuery, setSearchQuery] = useState('');
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContest, setSelectedContest] = useState(null);

  useEffect(() => {
    fetchContests();
  }, []);

  const fetchContests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/contests');
      if (res.data?.success) {
        setContests(res.data.data || []);
      } else {
        setContests(getMockContests());
      }
    } catch (err) {
      console.warn('Using fallback mock contests:', err);
      setContests(getMockContests());
    } finally {
      setLoading(false);
    }
  };

  const getMockContests = () => [
    {
      id: 'mock-1',
      title: 'Credit Card Champions 2026',
      short_description: 'Achieve your monthly credit card target and unlock cash rewards & bonuses.',
      description: 'Supercharge your performance this month! Submit approved credit card applications to climb the leaderboard. Applications approved between the start and end dates will automatically count towards your progress.',
      image_url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80',
      contest_type: 'credit_card',
      target_value: 50,
      target_unit: 'Approved Applications',
      reward_type: 'Fixed Cash Reward',
      reward_value: 5000,
      start_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
      department_id: 'Credit Cards',
      eligible_employees: 'All Active Sales Employees',
      status: 'ACTIVE',
      progress: {
        current_value: 30,
        target_value: 50,
        percentage: 60,
        qualified: false,
        remaining: 20
      }
    },
    {
      id: 'mock-2',
      title: 'Loan Sprint Extravaganza',
      short_description: 'Disburse personal and business loans to win premium gadget vouchers.',
      description: 'Drive high value loan disbursements during the contest window to claim top tier electronics and bonus vouchers.',
      image_url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80',
      contest_type: 'loans',
      target_value: 10,
      target_unit: 'Disbursed Loans',
      reward_type: 'Gadget Voucher + Cash',
      reward_value: 10000,
      start_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString(),
      department_id: 'Loans',
      eligible_employees: 'All Loan Executives',
      status: 'UPCOMING',
      progress: {
        current_value: 0,
        target_value: 10,
        percentage: 0,
        qualified: false,
        remaining: 10
      }
    }
  ];

  // Helper to determine status tab
  const getContestCategory = (contest) => {
    const now = new Date();
    const start = new Date(contest.start_date);
    const end = new Date(contest.end_date);

    if (contest.status === 'COMPLETED' || now > end) return 'COMPLETED';
    if (contest.status === 'UPCOMING' || now < start) return 'UPCOMING';
    return 'ACTIVE';
  };

  const filteredContests = contests.filter((c) => {
    const category = getContestCategory(c);
    const matchesTab = category === activeTab;
    const matchesSearch = 
      c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.short_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.department_id?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getDaysRemaining = (endDateStr) => {
    const diffMs = new Date(endDateStr) - new Date();
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Ended';
    if (days === 0) return 'Ends Today';
    return `${days} Days Left`;
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* ── Top Header Banner ── */}
      <div
        style={{
          background: isDark
            ? 'linear-gradient(135deg, #0F766E 0%, #1E293B 100%)'
            : 'linear-gradient(135deg, #0F766E 0%, #0D9488 100%)',
          borderRadius: '20px',
          padding: '24px 28px',
          color: '#FFFFFF',
          marginBottom: '24px',
          boxShadow: '0 10px 25px rgba(15, 118, 110, 0.25)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '12px', display: 'flex' }}>
              <HiOutlineTrophy size={24} color="#F59E0B" />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>
              Employee Contests
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: '13.5px', opacity: 0.9, fontWeight: 500 }}>
            Participate • Achieve Targets • Earn Rewards & Recognition
          </p>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', width: '280px' }}>
          <HiOutlineMagnifyingGlass
            size={18}
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
          />
          <input
            type="text"
            placeholder="Search contests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 38px',
              borderRadius: '12px',
              border: 'none',
              background: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.9)',
              color: isDark ? '#F8FAFC' : '#0F172A',
              fontSize: '13px',
              outline: 'none',
              backdropFilter: 'blur(4px)'
            }}
          />
        </div>
      </div>

      {/* ── Employee Top Banner Carousel ── */}
      <div style={{ marginBottom: '28px' }}>
        <PartnerBannerCarousel targetPanel="employee" />
      </div>

      {/* ── Contest Status Tabs ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          borderBottom: `2px solid ${isDark ? '#334155' : '#E2E8F0'}`,
          paddingBottom: '12px',
          marginBottom: '24px',
          overflowX: 'auto'
        }}
      >
        {[
          { id: 'ACTIVE', label: 'Active Contests', icon: <HiOutlineFire color="#EF4444" /> },
          { id: 'UPCOMING', label: 'Upcoming Contests', icon: <HiOutlineClock color="#F59E0B" /> },
          { id: 'COMPLETED', label: 'Completed Contests', icon: <HiOutlineCheckCircle color="#10B981" /> }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '12px',
                border: 'none',
                background: isActive ? (C.employeePrimary || '#0F766E') : 'transparent',
                color: isActive ? '#FFFFFF' : (isDark ? '#94A3B8' : '#64748B'),
                fontSize: '13.5px',
                fontWeight: isActive ? 800 : 600,
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                whiteSpace: 'nowrap'
              }}
            >
              <span style={{ fontSize: '16px' }}>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Contests Grid ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: isDark ? '#94A3B8' : '#64748B' }}>
          <div style={{ fontSize: '15px', fontWeight: 600 }}>Loading active contests...</div>
        </div>
      ) : filteredContests.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: C.card,
            borderRadius: '16px',
            border: `1px solid ${C.border}`,
            color: isDark ? '#94A3B8' : '#64748B'
          }}
        >
          <HiOutlineTrophy size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 6px 0', color: C.text }}>
            No {activeTab.toLowerCase()} contests found
          </h3>
          <p style={{ fontSize: '13px', margin: 0 }}>
            Check back soon for new contests and reward opportunities.
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
          {filteredContests.map((contest) => {
            const progress = contest.progress || {
              current_value: 0,
              target_value: contest.target_value,
              percentage: 0,
              qualified: false,
              remaining: contest.target_value
            };

            const isCompleted = activeTab === 'COMPLETED';

            return (
              <div
                key={contest.id}
                style={{
                  background: C.card,
                  borderRadius: '18px',
                  border: `1px solid ${C.border}`,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
              >
                {/* Contest Image Banner (1200x500 px ratio ~ 12:5 ratio) */}
                <div style={{ position: 'relative', width: '100%', paddingTop: '41.67%', background: '#0F172A', overflow: 'hidden' }}>
                  <img
                    src={contest.image_url}
                    alt={contest.title}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80';
                    }}
                  />
                  {/* Status Overlay Badge */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: activeTab === 'ACTIVE' 
                        ? 'linear-gradient(135deg, #EF4444, #DC2626)' 
                        : activeTab === 'UPCOMING'
                        ? 'linear-gradient(135deg, #F59E0B, #D97706)'
                        : 'linear-gradient(135deg, #10B981, #059669)',
                      color: '#FFFFFF',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: '20px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {activeTab === 'ACTIVE' && <HiOutlineFire size={12} />}
                    {activeTab === 'ACTIVE' ? getDaysRemaining(contest.end_date) : activeTab}
                  </div>
                </div>

                {/* Card Body */}
                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '17px', fontWeight: 800, color: C.text, margin: '0 0 8px 0', lineHeight: 1.3 }}>
                      {contest.title}
                    </h3>
                    <p style={{ fontSize: '13px', color: isDark ? '#94A3B8' : '#64748B', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                      {contest.short_description || contest.description}
                    </p>

                    {/* Reward Badge */}
                    <div
                      style={{
                        background: isDark ? 'rgba(245, 158, 11, 0.1)' : '#FEF3C7',
                        border: `1px solid ${isDark ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A'}`,
                        borderRadius: '12px',
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '16px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <HiOutlineSparkles size={18} color="#D97706" />
                        <span style={{ fontSize: '12px', fontWeight: 700, color: isDark ? '#FBBF24' : '#92400E' }}>
                          Reward Prize:
                        </span>
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 900, color: isDark ? '#FBBF24' : '#B45309' }}>
                        {contest.reward_type === 'Fixed Cash Reward' || contest.reward_type === 'Fixed Amount'
                          ? `₹${parseFloat(contest.reward_value).toLocaleString('en-IN')}`
                          : contest.reward_type}
                      </span>
                    </div>

                    {/* Progress Section */}
                    {!isCompleted && (
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                          <span style={{ color: C.text }}>Your Target Progress:</span>
                          <span style={{ color: C.employeePrimary || '#0F766E' }}>
                            {progress.current_value} / {progress.target_value} {contest.target_unit || 'Apps'}
                          </span>
                        </div>

                        {/* Progress Bar Container */}
                        <div
                          style={{
                            width: '100%',
                            height: '10px',
                            background: isDark ? '#334155' : '#E2E8F0',
                            borderRadius: '10px',
                            overflow: 'hidden',
                            marginBottom: '6px'
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${Math.min(100, progress.percentage)}%`,
                              background: progress.qualified
                                ? 'linear-gradient(90deg, #10B981, #059669)'
                                : 'linear-gradient(90deg, #0F766E, #0D9488)',
                              borderRadius: '10px',
                              transition: 'width 0.5s ease-out'
                            }}
                          />
                        </div>

                        {/* Remaining Target Text */}
                        <div style={{ fontSize: '11.5px', fontWeight: 600, color: progress.qualified ? '#10B981' : (isDark ? '#94A3B8' : '#64748B') }}>
                          {progress.qualified
                            ? '🎉 Target Achieved! Reward Qualified.'
                            : `${progress.remaining} more needed to reach target! (${progress.percentage}% completed)`}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* View Details Action Button */}
                  <button
                    onClick={() => setSelectedContest(contest)}
                    style={{
                      width: '100%',
                      padding: '11px',
                      borderRadius: '12px',
                      border: 'none',
                      background: isDark ? '#334155' : '#F1F5F9',
                      color: C.text,
                      fontSize: '13px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'background 0.2s'
                    }}
                  >
                    <HiOutlineInformationCircle size={16} /> View Contest Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Contest Detail Modal ── */}
      {selectedContest && (
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
              borderRadius: '24px',
              width: '100%',
              maxWidth: '640px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
              position: 'relative',
              padding: '24px'
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedContest(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: isDark ? '#334155' : '#E2E8F0',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: C.text
              }}
            >
              <HiOutlineXMark size={20} />
            </button>

            {/* Modal Contest Header Banner */}
            <div style={{ borderRadius: '16px', overflow: 'hidden', marginBottom: '20px', position: 'relative', height: '180px' }}>
              <img
                src={selectedContest.image_url}
                alt={selectedContest.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(15,23,42,0.8), transparent)'
                }}
              />
              <h2
                style={{
                  position: 'absolute',
                  bottom: '16px',
                  left: '20px',
                  right: '20px',
                  color: '#FFFFFF',
                  fontSize: '20px',
                  fontWeight: 900,
                  margin: 0
                }}
              >
                {selectedContest.title}
              </h2>
            </div>

            {/* Contest Overview */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', color: isDark ? '#94A3B8' : '#64748B', margin: '0 0 6px 0' }}>
                  Contest Description & Rules
                </h4>
                <p style={{ fontSize: '14px', color: C.text, margin: 0, lineHeight: 1.6 }}>
                  {selectedContest.description || selectedContest.short_description}
                </p>
              </div>

              {/* Contest Key Details Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                  background: isDark ? '#1E293B' : '#F8FAFC',
                  padding: '16px',
                  borderRadius: '16px',
                  border: `1px solid ${C.border}`
                }}
              >
                <div>
                  <span style={{ fontSize: '11.5px', color: isDark ? '#94A3B8' : '#64748B', display: 'block' }}>Target Goal:</span>
                  <strong style={{ fontSize: '14px', color: C.text }}>
                    {selectedContest.target_value} {selectedContest.target_unit || 'Approved Apps'}
                  </strong>
                </div>

                <div>
                  <span style={{ fontSize: '11.5px', color: isDark ? '#94A3B8' : '#64748B', display: 'block' }}>Reward Prize:</span>
                  <strong style={{ fontSize: '14px', color: '#10B981' }}>
                    {selectedContest.reward_type === 'Fixed Cash Reward' || selectedContest.reward_type === 'Fixed Amount'
                      ? `₹${parseFloat(selectedContest.reward_value).toLocaleString('en-IN')}`
                      : selectedContest.reward_value}
                  </strong>
                </div>

                <div>
                  <span style={{ fontSize: '11.5px', color: isDark ? '#94A3B8' : '#64748B', display: 'block' }}>Department / Category:</span>
                  <strong style={{ fontSize: '13.5px', color: C.text }}>{selectedContest.department_id || 'All'}</strong>
                </div>

                <div>
                  <span style={{ fontSize: '11.5px', color: isDark ? '#94A3B8' : '#64748B', display: 'block' }}>Eligible Employees:</span>
                  <strong style={{ fontSize: '13.5px', color: C.text }}>{selectedContest.eligible_employees || 'All'}</strong>
                </div>
              </div>

              {/* Duration Info */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: `${C.employeePrimary || '#0F766E'}15`,
                  border: `1px solid ${C.employeePrimary || '#0F766E'}30`,
                  color: C.employeePrimary || '#0F766E',
                  fontSize: '13px',
                  fontWeight: 700
                }}
              >
                <HiOutlineCalendar size={18} />
                <span>
                  Valid From: {new Date(selectedContest.start_date).toLocaleDateString('en-IN')} to {new Date(selectedContest.end_date).toLocaleDateString('en-IN')}
                </span>
              </div>

              {/* Back / Close Button */}
              <button
                type="button"
                onClick={() => setSelectedContest(null)}
                style={{
                  width: '100%',
                  marginTop: '12px',
                  padding: '12px',
                  borderRadius: '12px',
                  border: `1px solid ${C.border}`,
                  background: isDark ? '#334155' : '#F1F5F9',
                  color: C.text,
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <HiOutlineArrowLeft size={18} /> Back to Contests
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

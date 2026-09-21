import React, { useState, useEffect } from 'react';
import { FaSearch, FaUser, FaIdCard, FaPhone, FaEnvelope, FaLock, FaArrowLeft, FaShieldAlt } from 'react-icons/fa';
import api from '../../../services/api';
import MessengerView from '../../messenger/MessengerView';

export default function SuperAdminViewMessages() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const handleSearch = async (queryText) => {
    setSearchQuery(queryText);
    if (!queryText.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await api.get('/messenger/admin/search-users', { params: { query: queryText } });
      if (res.data?.success) {
        setSearchResults(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to search accounts for audit:', err);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    // Initial load of top accounts
    handleSearch('');
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 90px)',
      background: '#F8FAFC',
      borderRadius: '16px',
      overflow: 'hidden',
      border: '1px solid #E2E8F0',
      boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
    }}>
      {/* Top Banner Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        padding: '16px 24px',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #334155'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px'
          }}>
            <FaShieldAlt />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, letterSpacing: '-0.3px', color: '#FFFFFF' }}>
              Super Admin Messenger Audit
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94A3B8' }}>
              Select an account by name or code to inspect past conversations in read-only mode
            </p>
          </div>
        </div>

        {selectedUser && (
          <button
            onClick={() => setSelectedUser(null)}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <FaArrowLeft size={12} /> Switch Account
          </button>
        )}
      </div>

      {/* Main Content View */}
      {!selectedUser ? (
        <div style={{ flex: 1, padding: '30px 24px', overflowY: 'auto' }}>
          <div style={{ maxWidth: '650px', margin: '0 auto' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
              Search & Select Account to Audit
            </h3>

            {/* Search Box */}
            <div style={{
              display: 'flex', alignItems: 'center', background: '#FFFFFF',
              borderRadius: '14px', padding: '12px 18px', border: '2px solid #E2E8F0',
              boxShadow: '0 4px 14px rgba(0,0,0,0.04)', marginBottom: '24px'
            }}>
              <FaSearch color="#64748B" size={16} style={{ marginRight: '12px' }} />
              <input
                type="text"
                placeholder="Search by full name, phone, email, partner code, or employee code..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                style={{
                  background: 'transparent', border: 'none', outline: 'none',
                  color: '#0F172A', fontSize: '14.5px', width: '100%', fontWeight: 600
                }}
              />
            </div>

            {/* Results List */}
            {searching ? (
              <div style={{ textAlign: 'center', color: '#64748B', padding: '40px' }}>Searching accounts...</div>
            ) : searchResults.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '40px 20px', background: '#FFFFFF',
                borderRadius: '16px', border: '1px solid #E2E8F0', color: '#64748B'
              }}>
                <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#334155' }}>No accounts found</p>
                <span style={{ fontSize: '13px' }}>Type a name, partner code (e.g. P-1002), or phone number above</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {searchResults.map((u) => {
                  const userCode = u.partner_code || u.employee_code || `USR-${u.id.slice(0, 6).toUpperCase()}`;
                  return (
                    <div
                      key={u.id}
                      onClick={() => setSelectedUser(u)}
                      style={{
                        padding: '16px 20px',
                        background: '#FFFFFF',
                        borderRadius: '14px',
                        border: '1px solid #E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#2563EB';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#E2E8F0';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                          width: '46px', height: '46px', borderRadius: '50%',
                          background: '#EFF6FF', color: '#2563EB', fontWeight: 900,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px'
                        }}>
                          {(u.full_name || 'U').charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 800, fontSize: '15px', color: '#0F172A' }}>{u.full_name}</span>
                            <span style={{
                              padding: '2px 8px', borderRadius: '10px', background: '#F1F5F9',
                              color: '#475569', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase'
                            }}>
                              {u.role}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12.5px', color: '#64748B' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#D97706', fontWeight: 700 }}>
                              <FaIdCard size={12} /> {userCode}
                            </span>
                            {u.mobile && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <FaPhone size={11} /> {u.mobile}
                              </span>
                            )}
                            {u.email && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <FaEnvelope size={11} /> {u.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button style={{
                        padding: '8px 16px', borderRadius: '10px', background: '#EFF6FF',
                        color: '#2563EB', fontWeight: 800, border: '1px solid #BFDBFE',
                        fontSize: '13px', cursor: 'pointer'
                      }}>
                        View Messenger →
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          {/* Read Only Mode Banner */}
          <div style={{
            padding: '10px 24px', background: '#FEF2F2', borderBottom: '1px solid #FCA5A5',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#991B1B'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', fontWeight: 700 }}>
              <FaLock size={13} color="#DC2626" />
              <span>READ-ONLY AUDIT MODE: Viewing Messenger for <strong>{selectedUser.full_name}</strong> ({selectedUser.partner_code || selectedUser.employee_code || selectedUser.role})</span>
            </div>
            <span style={{ fontSize: '12px', background: '#FEE2E2', padding: '3px 10px', borderRadius: '12px', color: '#991B1B', fontWeight: 800 }}>
              Audit View Only • Cannot Send or Modify
            </span>
          </div>

          <div style={{ flex: 1, height: '100%', overflow: 'hidden' }}>
            <MessengerView readOnly={true} targetUserId={selectedUser.id} />
          </div>
        </div>
      )}
    </div>
  );
}

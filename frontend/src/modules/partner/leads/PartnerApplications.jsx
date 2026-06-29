import React, { useEffect, useState } from 'react';
import { usePartnerStore } from '../../../app/store/partnerStore';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import { 
  MdSearch, MdFilterList, MdCheckCircle, MdPendingActions, 
  MdCancel, MdLocalAtm, MdPhone, MdOutlineWhatsapp, MdHistory,
  MdKeyboardArrowDown, MdKeyboardArrowUp, MdPerson
} from 'react-icons/md';

const STAGES = [
  { id: 'submitted', label: 'Applied', step: 1 },
  { id: 'under_review', label: 'Verification', step: 2 },
  { id: 'approved', label: 'Approved', step: 3 },
  { id: 'disbursed', label: 'Disbursed', step: 4 },
];

export default function PartnerApplications() {
  const { C } = useTheme();
  const S = makeS(C);

  const fetchApplications = usePartnerStore((state) => state.fetchApplications);
  const applications = usePartnerStore((state) => state.applications);
  const isLoading = usePartnerStore((state) => state.isLoading);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const filteredApps = applications?.filter(app => {
    const matchesSearch = app.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          app.app_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusColor = (status) => {
    switch(status) {
      case 'approved': return C.green;
      case 'disbursed': return C.green;
      case 'rejected': return C.red;
      case 'under_review': return C.gold;
      default: return C.textLight;
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'approved': return <MdCheckCircle />;
      case 'disbursed': return <MdLocalAtm />;
      case 'rejected': return <MdCancel />;
      default: return <MdPendingActions />;
    }
  };

  const getStepProgress = (status) => {
    if (status === 'rejected') return 0;
    if (status === 'disbursed') return 4;
    if (status === 'approved') return 3;
    if (status === 'under_review') return 2;
    return 1; // submitted
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {/* Header & Filters */}
      <div style={{ ...S.card, padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: C.text, margin: 0 }}>Lead Management</h2>
            <p style={{ fontSize: '14px', color: C.textMid, margin: '4px 0 0' }}>Track and manage your customer applications in real-time.</p>
          </div>
          
          <button style={{
            ...S.btn('outline'), padding: '8px 16px', fontSize: '13px', borderRadius: '10px',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            <MdFilterList size={18} /> Export List
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', width: '100%' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <MdSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: C.textLight }} size={20} />
            <input 
              type="text" 
              placeholder="Search by customer name or App ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ ...S.input, paddingLeft: '38px' }}
            />
          </div>
          
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              ...S.input, width: 'auto', minWidth: '180px',
              backgroundImage: 'none', appearance: 'auto', cursor: 'pointer'
            }}
          >
            <option value="all">All Statuses</option>
            <option value="submitted">New / Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="disbursed">Disbursed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Leads List */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <span style={{
            width: 32, height: 32, borderRadius: '50%',
            border: `3px solid ${C.border}`, borderTopColor: C.primary,
            animation: 'spin .8s linear infinite', display: 'inline-block'
          }} />
        </div>
      ) : filteredApps.length === 0 ? (
        <div style={{ ...S.card, padding: '48px 24px', textAlign: 'center', borderRadius: '16px' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', background: C.bgSecondary,
            color: C.textLight, display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <MdHistory size={28} />
          </div>
          <h3 style={{ fontSize: '17px', fontWeight: 700, color: C.text, margin: '0 0 4px' }}>No Leads Found</h3>
          <p style={{ color: C.textMid, margin: 0 }}>You don't have any applications matching the current filters.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredApps.map((app) => {
            const isExpanded = expandedId === app.app_number;
            const currentStep = getStepProgress(app.status);
            const isRejected = app.status === 'rejected';
            const statusColor = getStatusColor(app.status);

            return (
              <div 
                key={app.app_number} 
                style={{
                  ...S.card, padding: 0, overflow: 'hidden', borderRadius: '16px',
                  border: `1px solid ${isExpanded ? C.primary : C.border}`
                }}
              >
                
                {/* Lead Header (Always Visible) */}
                <div 
                  style={{
                    padding: '20px', cursor: 'pointer', display: 'flex', flexWrap: 'wrap',
                    alignItems: 'center', justifyContent: 'space-between', gap: '16px',
                    background: isExpanded ? C.bgSecondary : 'transparent'
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : app.app_number)}
                >
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flex: 1, minWidth: '240px' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%', background: C.bgSecondary,
                      color: C.textLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
                    }}>
                      <MdPerson />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, color: C.text, margin: 0 }}>{app.customer_name}</h3>
                      <p style={{ fontSize: '13px', color: C.textMid, margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontFamily: 'monospace', background: C.bgSecondary, padding: '2px 6px', borderRadius: '4px', fontSize: '11px', color: C.textMid }}>{app.app_number}</span>
                        <span>•</span>
                        <span>{app.product_name}</span>
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', justifyContent: 'space-between', flexShrink: 0 }}>
                    <div style={{ textAlign: 'right', display: 'none', sm: 'block' }}>
                      <span style={{ fontSize: '10px', color: C.textLight, display: 'block', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Expected Commission</span>
                      <strong style={{ fontSize: '15px', color: C.text, fontWeight: 700 }}>₹{app.commission_amount || 'TBD'}</strong>
                    </div>
                    
                    <span style={{ ...S.tag(statusColor), display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px' }}>
                      {getStatusIcon(app.status)} {app.status.replace('_', ' ')}
                    </span>
                    
                    <button style={{ background: 'none', border: 'none', color: C.textLight, cursor: 'pointer', padding: 4 }}>
                      {isExpanded ? <MdKeyboardArrowUp size={20} /> : <MdKeyboardArrowDown size={20} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Timeline & Details */}
                {isExpanded && (
                  <div style={{
                    borderTop: `1px solid ${C.border}`, background: C.bgSecondary,
                    padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px'
                  }}>
                    
                    {/* Left: Timeline */}
                    <div style={{ gridColumn: 'span 2' }}>
                      <h4 style={{ fontSize: '12px', fontWeight: 700, color: C.textMid, textTransform: 'uppercase', letterSpacing: '0.6px', margin: '0 0 20px' }}>
                        Application Timeline
                      </h4>
                      
                      <div style={{
                        display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between',
                        gap: '16px', position: 'relative', zIndex: 1
                      }}>
                        {STAGES.map((stage, idx) => {
                          const isCompleted = currentStep >= stage.step;
                          const isActive = currentStep === stage.step && !isRejected;
                          const color = isRejected ? C.red : isCompleted ? C.green : isActive ? C.primary : C.border;
                          
                          return (
                            <div key={stage.id} style={{
                              display: 'flex', flexDirection: 'column', alignItems: 'center',
                              gap: '6px', flex: 1, minWidth: '70px', position: 'relative'
                            }}>
                              {/* Horizontal connector line */}
                              {idx < STAGES.length - 1 && (
                                <div style={{
                                  position: 'absolute', top: '14px', left: 'calc(50% + 14px)',
                                  width: 'calc(100% - 28px)', height: '2px',
                                  background: (currentStep > stage.step && !isRejected) ? C.green : C.border,
                                  zIndex: -1
                                }} />
                              )}

                              <div style={{
                                width: 28, height: 28, borderRadius: '50%',
                                background: isCompleted ? color : C.card,
                                border: `2.5px solid ${color}`,
                                color: isCompleted ? '#fff' : color,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '14px', fontWeight: 700
                              }}>
                                {isCompleted ? '✓' : stage.step}
                              </div>
                              
                              <div style={{
                                fontSize: '12px', fontWeight: (isActive || isCompleted) ? 700 : 500,
                                color: isActive ? C.primary : isCompleted ? C.green : C.textMid,
                                textAlign: 'center'
                              }}>
                                {stage.label}
                                {idx === 0 && <span style={{ display: 'block', fontSize: '10px', color: C.textLight, fontWeight: 500, marginTop: '2px' }}>{new Date(app.created_at).toLocaleDateString()}</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {isRejected && (
                        <div style={{
                          marginTop: '20px', padding: '12px 16px', borderRadius: '10px',
                          background: `${C.red}12`, border: `1px solid ${C.red}25`,
                          color: C.red, display: 'flex', gap: '8px', alignItems: 'flex-start'
                        }}>
                          <MdCancel size={18} style={{ marginTop: '2px' }} />
                          <div>
                            <p style={{ fontWeight: 700, fontSize: '13px', margin: 0 }}>Application Rejected</p>
                            <p style={{ fontSize: '12px', margin: '2px 0 0' }}>This application did not meet the bank's criteria during verification.</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right: Quick Actions & Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div>
                        <h4 style={{ fontSize: '12px', fontWeight: 700, color: C.textMid, textTransform: 'uppercase', letterSpacing: '0.6px', margin: '0 0 12px' }}>
                          Quick Actions
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <button style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                            padding: '10px', background: '#25D366', color: '#fff', border: 'none',
                            borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer'
                          }}>
                            <MdOutlineWhatsapp size={18} /> WhatsApp Customer
                          </button>
                          <button style={{
                            ...S.btn('outline'), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                            padding: '10px', borderRadius: '10px', fontSize: '13px', border: `1px solid ${C.border}`,
                            color: C.textMid
                          }}>
                            <MdPhone size={18} /> Call Customer
                          </button>
                        </div>
                      </div>

                      <div style={{
                        background: C.card, border: `1px solid ${C.border}`,
                        borderRadius: '12px', padding: '14px'
                      }}>
                        <h4 style={{ fontSize: '11px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px' }}>
                          Lead Details
                        </h4>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                          <li style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: C.textMid }}>Bank</span> <span style={{ fontWeight: 600, color: C.text }}>{app.bank_code || 'N/A'}</span></li>
                          <li style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: C.textMid }}>Date Applied</span> <span style={{ fontWeight: 600, color: C.text }}>{new Date(app.created_at).toLocaleDateString()}</span></li>
                          <li style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: C.textMid }}>Commission</span> <span style={{ fontWeight: 700, color: C.green }}>₹{app.commission_amount || '0'}</span></li>
                        </ul>
                      </div>
                    </div>
                    
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

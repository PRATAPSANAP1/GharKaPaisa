import React, { useState, useEffect } from 'react';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import { 
  MdAdd, MdPerson, MdEmail, MdPhone, MdCheckCircle, 
  MdPendingActions, MdClose, MdContentCopy,
  MdOutlineQrCode2, MdOutlineWhatsapp
} from 'react-icons/md';
import api from '../../../services/api';
import { useAuthStore } from '../../../app/store/authStore';

export default function PartnerTeam() {
  const { C } = useTheme();
  const S = makeS(C);

  const user = useAuthStore((state) => state.user);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [activeTab, setActiveTab] = useState('tree'); // 'tree' | 'list'
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', mobile: '', password: ''
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/partner/${user.PartnerId}/team`);
      setTeam(res.data.data || []);
    } catch (err) {
      setError('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.PartnerId) {
      fetchTeam();
    }
  }, [user]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError('');
    try {
      const res = await api.post(`/partner/${user.PartnerId}/team`, formData);
      setTeam([res.data.data, ...team]); 
      setIsAddModalOpen(false);
      setFormData({ first_name: '', last_name: '', email: '', mobile: '', password: '' });
      fetchTeam();
    } catch (err) {
      setAddError(err.response?.data?.message || 'Failed to add team member');
    } finally {
      setAddLoading(false);
    }
  };

  const copyReferralLink = () => {
    const link = `https://gharkapaisa.in/register?ref=${user?.PartnerCode || 'GKP'}`;
    navigator.clipboard.writeText(link);
    alert('Referral link copied to clipboard!');
  };

  // Mocking Level 2 for demonstration of the Tree UI
  const buildTree = () => {
    return team.map(member => ({
      ...member,
      children: Math.random() > 0.5 ? [
        { id: `mock-${member.id}-1`, first_name: 'Sub', last_name: 'Partner', Partner_code: 'GKP-SUB1', kyc_status: 'pending' }
      ] : []
    }));
  };

  const treeData = buildTree();

  const thStyle = {
    padding: '12px 18px', fontSize: '11px', fontWeight: 700,
    color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.6px',
    textAlign: 'left', borderBottom: `1px solid ${C.border}`
  };

  const tdStyle = {
    padding: '14px 18px', fontSize: '13px', color: C.textMid,
    borderBottom: `1px solid ${C.border}`
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: C.text, margin: 0 }}>Referral Network</h2>
          <p style={{ fontSize: '14px', color: C.textMid, margin: '4px 0 0' }}>Grow your team and earn passive income on their sales.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          style={{
            ...S.btn('primary'), border: 'none', borderRadius: '10px',
            display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer'
          }}
        >
          <MdAdd size={20} /> Add Direct Partner
        </button>
      </div>

      {/* Referral Tools Banner */}
      <div style={{
        background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`,
        borderRadius: '16px',
        padding: '24px 28px',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div style={{
          position: 'absolute', right: 0, top: 0, width: 200, height: 200,
          background: '#fff', opacity: 0.05, borderRadius: '50%', filter: 'blur(40px)',
          marginRight: '-40px', marginTop: '-40px', pointerEvents: 'none'
        }} />
        
        <div style={{ flex: 1, minWidth: '280px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>Invite Partners & Earn 10% Lifetime</h3>
          <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)', margin: 0, maxWidth: '440px' }}>
            Share your unique partner link. Anyone who registers and sells products will generate override commissions for you.
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <button 
            onClick={copyReferralLink}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 18px', background: C.card, color: C.primary,
              borderRadius: '10px', border: 'none', fontWeight: 700, fontSize: '13px',
              cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
          >
            <MdContentCopy size={16} /> Copy Link
          </button>
          <button style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '10px 18px', background: '#25D366', color: '#fff',
            borderRadius: '10px', border: 'none', fontWeight: 700, fontSize: '13px',
            cursor: 'pointer'
          }}>
            <MdOutlineWhatsapp size={16} /> WhatsApp
          </button>
          <button style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '10px 18px', background: 'rgba(255,255,255,0.1)', color: '#fff',
            borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)', fontWeight: 700, fontSize: '13px',
            cursor: 'pointer'
          }}>
            <MdOutlineQrCode2 size={16} /> QR Code
          </button>
        </div>
      </div>

      {/* Network View Controls */}
      <div style={{ ...S.card, padding: 0, borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{
          display: 'flex', borderBottom: `1px solid ${C.border}`,
          padding: '6px', gap: '6px', background: C.bgSecondary
        }}>
          {['tree', 'list'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 24px', borderRadius: '10px', fontSize: '13px',
                fontWeight: 700, border: 'none', cursor: 'pointer',
                background: activeTab === tab ? C.card : 'transparent',
                color: activeTab === tab ? C.primary : C.textMid,
                boxShadow: activeTab === tab ? '0 2px 6px rgba(0,0,0,0.04)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              {tab === 'tree' ? 'Graphical Tree' : 'List View'}
            </button>
          ))}
        </div>

        <div style={{ padding: '24px' }}>
          {error ? (
            <div style={{
              padding: '14px 18px', background: `${C.red}12`, border: `1px solid ${C.red}25`,
              color: C.red, borderRadius: '12px', fontWeight: 600, fontSize: '13px'
            }}>{error}</div>
          ) : loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
              <span style={{
                width: 32, height: 32, borderRadius: '50%',
                border: `3px solid ${C.border}`, borderTopColor: C.primary,
                animation: 'spin .8s linear infinite', display: 'inline-block'
              }} />
            </div>
          ) : team.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: C.textLight }}>
              <MdPerson size={44} style={{ color: C.border, marginBottom: '12px' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: C.text, margin: '0 0 4px' }}>Your Network is Empty</h3>
              <p style={{ fontSize: '13px', color: C.textMid, maxWidth: '340px', margin: '0 auto' }}>
                Use the referral link above to invite sub-partners and start building your downline.
              </p>
            </div>
          ) : activeTab === 'list' ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', whitespace: 'nowrap' }}>
                <thead>
                  <tr style={{ background: C.bgSecondary }}>
                    <th style={thStyle}>Partner Info</th>
                    <th style={thStyle}>Contact</th>
                    <th style={thStyle}>Code / Level</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {team.map((member) => (
                    <tr key={member.id}>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: `${C.primary}12`, color: C.primary,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: '14px', border: `1px solid ${C.primary}20`
                          }}>
                            {member.first_name?.[0] || 'T'}
                          </div>
                          <div>
                            <p style={{ fontWeight: 700, color: C.text, margin: 0 }}>{member.first_name} {member.last_name}</p>
                          </div>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}><MdEmail style={{ color: C.textLight }} /> {member.email}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}><MdPhone style={{ color: C.textLight }} /> {member.mobile}</div>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          fontFamily: 'monospace', color: C.primary, background: `${C.primary}12`,
                          padding: '2px 8px', borderRadius: '4px', border: `1px solid ${C.primary}20`,
                          fontWeight: 700, fontSize: '11px', display: 'inline-block', marginBottom: '4px'
                        }}>
                          {member.Partner_code}
                        </span>
                        <div style={{ fontSize: '11px', color: C.textLight, fontWeight: 600 }}>Level 1 (Direct)</div>
                      </td>
                      <td style={tdStyle}>
                        <span style={S.tag(member.kyc_status === 'approved' ? C.green : member.kyc_status === 'rejected' ? C.red : C.gold)}>
                          {member.kyc_status || 'PENDING'}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 500 }}>
                        {new Date(member.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* GRAPHICAL TREE VIEW */
            <div style={{ padding: '16px 0', overflowX: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '600px' }}>
                
                {/* Root Node (You) */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                  <div style={{
                    background: C.bgSecondary, border: `1px solid ${C.border}`,
                    padding: '16px', borderRadius: '14px', width: '220px', textCenter: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center'
                  }}>
                    <div style={{
                      width: 40, height: 40, background: C.card, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: C.primary, border: `1px solid ${C.border}`, marginBottom: '8px'
                    }}>
                      <MdPerson size={20} />
                    </div>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: C.text, margin: 0 }}>You</h4>
                    <p style={{ fontSize: '11px', fontFamily: 'monospace', color: C.textLight, margin: '4px 0 0' }}>{user?.PartnerCode || 'GKP-ROOT'}</p>
                  </div>
                  
                  {/* Stem down from root */}
                  <div style={{ width: 1, height: 32, background: C.border }} />
                  
                  {/* Horizontal Line Connector */}
                  {treeData.length > 1 && (
                    <div style={{
                      width: `${(treeData.length - 1) * 260}px`,
                      height: 1, background: C.border
                    }} />
                  )}

                  {/* Level 1 Nodes */}
                  <div style={{ display: 'flex', gap: '20px', paddingTop: '32px', position: 'relative', justifyContent: 'center' }}>
                    {treeData.map((member) => (
                      <div key={member.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '240px', position: 'relative' }}>
                        {/* Line up from node */}
                        <div style={{ position: 'absolute', top: '-32px', width: 1, height: 32, background: C.border }} />
                        
                        {/* Node Card */}
                        <div style={{
                          background: C.card, border: `2px solid ${C.primary}`,
                          padding: '14px', borderRadius: '12px', width: '200px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.02)', textAlign: 'center'
                        }}>
                          <h4 style={{ fontSize: '13px', fontWeight: 700, color: C.text, margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {member.first_name} {member.last_name}
                          </h4>
                          <p style={{ fontSize: '11px', fontFamily: 'monospace', color: C.textLight, margin: '4px 0' }}>{member.Partner_code}</p>
                          <span style={S.tag(member.kyc_status === 'approved' ? C.green : C.gold)}>
                            L1 • {member.kyc_status}
                          </span>
                        </div>

                        {/* Level 2 Sub-children Mock */}
                        {member.children && member.children.length > 0 && (
                          <>
                            <div style={{ width: 1, height: 24, background: C.border }} />
                            <div style={{ display: 'flex', gap: '10px' }}>
                              {member.children.map(child => (
                                <div key={child.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                  <div style={{
                                    background: C.bgSecondary, border: `1px solid ${C.border}`,
                                    padding: '10px', borderRadius: '10px', width: '160px', textAlign: 'center'
                                  }}>
                                    <h4 style={{ fontSize: '12px', fontWeight: 700, color: C.text, margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                      {child.first_name} {child.last_name}
                                    </h4>
                                    <p style={{ fontSize: '10px', fontFamily: 'monospace', color: C.textLight, margin: '3px 0' }}>{child.Partner_code}</p>
                                    <span style={{
                                      fontSize: '9px', fontWeight: 700, color: C.textLight, background: C.card,
                                      padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase'
                                    }}>
                                      L2 • {child.kyc_status}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Direct Partner Modal */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', padding: '16px'
        }}>
          <div style={{
            background: C.card, borderRadius: '20px', w: '100%', maxWidth: '440px',
            overflow: 'hidden', border: `1px solid ${C.border}`,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{
              padding: '16px 20px', borderBottom: `1px solid ${C.border}`,
              background: C.bgSecondary, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: 0 }}>Add Direct Partner</h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: C.textLight, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <MdClose size={20} />
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {addError && <div style={{
                padding: '10px 14px', background: `${C.red}12`, border: `1px solid ${C.red}25`,
                color: C.red, borderRadius: '10px', fontSize: '13px', fontWeight: 600
              }}>{addError}</div>}
              
              <form id="add-team-form" onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={S.label}>First Name *</label>
                    <input type="text" required value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} style={S.input} />
                  </div>
                  <div>
                    <label style={S.label}>Last Name</label>
                    <input type="text" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} style={S.input} />
                  </div>
                </div>

                <div>
                  <label style={S.label}>Email Address *</label>
                  <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={S.input} />
                </div>

                <div>
                  <label style={S.label}>Mobile Number *</label>
                  <input type="tel" required pattern="[0-9]{10}" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} style={S.input} />
                </div>

                <div>
                  <label style={S.label}>Initial Password *</label>
                  <input type="text" required minLength={6} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} style={S.input} />
                  <p style={{
                    fontSize: '11px', color: C.gold, background: `${C.gold}12`,
                    padding: '8px 12px', borderRadius: '8px', border: `1px solid ${C.gold}25`,
                    margin: '8px 0 0', fontWeight: 600
                  }}>
                    User will be forced to change this upon first login.
                  </p>
                </div>
              </form>
            </div>

            <div style={{
              padding: '16px 20px', borderTop: `1px solid ${C.border}`,
              background: C.bgSecondary, display: 'flex', gap: '10px'
            }}>
              <button type="button" onClick={() => setIsAddModalOpen(false)} style={{
                ...S.btn('outline'), flex: 1, padding: '10px', fontSize: '14px', borderRadius: '10px'
              }}>
                Cancel
              </button>
              <button type="submit" form="add-team-form" disabled={addLoading} style={{
                ...S.btn('primary'), flex: 2, padding: '10px', fontSize: '14px', border: 'none', borderRadius: '10px',
                cursor: addLoading ? 'not-allowed' : 'pointer', opacity: addLoading ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {addLoading ? (
                  <span style={{
                    width: 18, height: 18, borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
                    animation: 'spin .8s linear infinite', display: 'inline-block'
                  }} />
                ) : 'Create Partner Account'}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

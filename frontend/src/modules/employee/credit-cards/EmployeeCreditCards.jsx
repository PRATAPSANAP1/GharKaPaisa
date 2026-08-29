import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import { 
  FaCreditCard, FaCopy, FaShareAlt, FaUserPlus, FaArrowLeft, 
  FaCoins, FaBuilding, FaCheckCircle, FaSearch 
} from 'react-icons/fa';
import axios from 'axios';

export default function EmployeeCreditCards() {
  const { C } = useTheme();
  const navigate = useNavigate();

  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Add Lead Modal State
  const [addLeadModalProduct, setAddLeadModalProduct] = useState(null);
  const [leadForm, setLeadForm] = useState({
    full_name: '',
    mobile: '',
    email: '',
    city: '',
    monthly_income: '',
    employment_type: 'salaried'
  });
  const [submittingLead, setSubmittingLead] = useState(false);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/v1/employee/credit-cards');
      if (res.data.success) {
        setCards(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching employee credit cards:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const handleCopyLink = (url, productId) => {
    navigator.clipboard.writeText(url);
    setCopiedId(productId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleAddLeadSubmit = async (e) => {
    e.preventDefault();
    if (!addLeadModalProduct) return;
    setSubmittingLead(true);
    try {
      const res = await axios.post('/api/v1/employee/leads', {
        ...leadForm,
        product_id: addLeadModalProduct.product_id
      });
      if (res.data.success) {
        alert(`Lead added successfully under employee attribution! App Number: ${res.data.data.app_number}`);
        setAddLeadModalProduct(null);
        setLeadForm({ full_name: '', mobile: '', email: '', city: '', monthly_income: '', employment_type: 'salaried' });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add lead.');
    } finally {
      setSubmittingLead(false);
    }
  };

  const filteredCards = cards.filter(c => 
    c.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.bank_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: '32px 24px 80px', fontFamily: "'Inter', sans-serif", color: C.text }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
          <button 
            onClick={() => navigate('/employee/dashboard')}
            style={{ 
              background: C.card, border: `1px solid ${C.border}`, borderRadius: '50%', 
              width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: C.textMid
            }}
          >
            <FaArrowLeft />
          </button>
          <div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: C.teal, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Employee Catalog
            </span>
            <h1 style={{ fontSize: '26px', fontWeight: 900, color: C.text, margin: 0 }}>Credit Cards & Financial Products</h1>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '16px 20px', marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FaSearch style={{ color: C.textMid }} />
          <input 
            type="text" 
            placeholder="Search by card name or bank..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: '15px', color: C.text }}
          />
        </div>

        {/* Cards Grid */}
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: C.textMid }}>Loading products catalog...</div>
        ) : filteredCards.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: C.textMid }}>No products available.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
            {filteredCards.map((card) => (
              <div key={card.product_id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: C.textMid, textTransform: 'uppercase' }}>
                        {card.bank_name || 'Partner Bank'}
                      </span>
                      <h3 style={{ fontSize: '18px', fontWeight: 900, margin: '2px 0 0', color: C.text }}>{card.product_name}</h3>
                    </div>
                    <div style={{ background: `${C.teal}15`, border: `1px solid ${C.teal}30`, padding: '6px 12px', borderRadius: '12px', textAlign: 'right' }}>
                      <span style={{ fontSize: '10px', color: C.textMid, textTransform: 'uppercase', display: 'block', fontWeight: 800 }}>Employee Incentive</span>
                      <strong style={{ fontSize: '16px', fontWeight: 900, color: C.teal }}>₹{card.employee_incentive}</strong>
                    </div>
                  </div>

                  <p style={{ fontSize: '13px', color: C.textMid, lineHeight: 1.5, marginBottom: '20px' }}>
                    {card.description || 'Premium credit card product with instant digital verification and high approval rates.'}
                  </p>
                </div>

                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '16px', display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => handleCopyLink(card.referral_url, card.product_id)}
                    style={{ flex: 1, background: copiedId === card.product_id ? '#D1FAE5' : C.bgSecondary, color: copiedId === card.product_id ? '#065F46' : C.text, border: `1px solid ${C.border}`, padding: '10px', borderRadius: '12px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    {copiedId === card.product_id ? <FaCheckCircle /> : <FaCopy />}
                    {copiedId === card.product_id ? 'Link Copied!' : 'Copy Link'}
                  </button>

                  <button 
                    onClick={() => setAddLeadModalProduct(card)}
                    style={{ flex: 1, background: C.teal, color: '#fff', border: 'none', padding: '10px', borderRadius: '12px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <FaUserPlus /> Punch Lead
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Lead Modal */}
        {addLeadModalProduct && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
            <div style={{ background: C.card, borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '520px', border: `1px solid ${C.border}` }}>
              <h2 style={{ fontSize: '20px', fontWeight: 900, color: C.text, margin: '0 0 4px 0' }}>Punch Customer Lead</h2>
              <p style={{ fontSize: '13px', color: C.textMid, marginBottom: '20px' }}>Product: <strong>{addLeadModalProduct.product_name}</strong> (Incentive: ₹{addLeadModalProduct.employee_incentive})</p>

              <form onSubmit={handleAddLeadSubmit}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Customer Full Name *</label>
                  <input type="text" required value={leadForm.full_name} onChange={(e) => setLeadForm({ ...leadForm, full_name: e.target.value })} placeholder="Full Name" style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Mobile Number *</label>
                  <input type="tel" required value={leadForm.mobile} onChange={(e) => setLeadForm({ ...leadForm, mobile: e.target.value })} placeholder="10 Digit Mobile" style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Email Address</label>
                  <input type="email" value={leadForm.email} onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })} placeholder="email@domain.com" style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Monthly Income (₹)</label>
                    <input type="number" value={leadForm.monthly_income} onChange={(e) => setLeadForm({ ...leadForm, monthly_income: e.target.value })} placeholder="e.g. 45000" style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Employment Type</label>
                    <select value={leadForm.employment_type} onChange={(e) => setLeadForm({ ...leadForm, employment_type: e.target.value })} style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }}>
                      <option value="salaried">Salaried</option>
                      <option value="self_employed">Self Employed</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setAddLeadModalProduct(null)} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text, padding: '10px 20px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={submittingLead} style={{ background: C.teal, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}>
                    {submittingLead ? 'Submitting...' : 'Submit Lead'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

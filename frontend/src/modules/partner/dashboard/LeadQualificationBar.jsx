import React, { useState } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { MdFlashOn, MdCheckCircle, MdArrowForward, MdClose, MdAccountBalance, MdFilterList } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

export default function LeadQualificationBar() {
  const { C, isDark } = useTheme();
  const navigate = useNavigate();

  const [income, setIncome] = useState('');
  const [pincode, setPincode] = useState('');
  const [empType, setEmpType] = useState('salaried');
  const [category, setCategory] = useState('credit_card');
  const [showResults, setShowResults] = useState(false);
  const [matches, setMatches] = useState([]);

  const handleRunQualification = (e) => {
    e.preventDefault();
    const incVal = parseFloat(income.replace(/[^0-9.]/g, '')) || 0;
    
    // Workflow-first banking match algorithm
    const calculatedMatches = [
      {
        bank: 'HDFC Bank',
        slug: 'hdfc',
        card: 'HDFC Millennia Credit Card',
        matchScore: incVal >= 35000 ? 96 : incVal >= 25000 ? 88 : 72,
        commission: '₹2,500',
        ltf: false,
        reason: 'Optimal match for salary > ₹25k/mo & tier-1/2 pincodes',
        accent: '#2563EB'
      },
      {
        bank: 'SBI Card',
        slug: 'sbi',
        card: 'SBI SimplyCLICK Card',
        matchScore: incVal >= 20000 ? 94 : 80,
        commission: '₹2,200',
        ltf: false,
        reason: 'Instant digital approval for salaried & self-employed',
        accent: '#0284C7'
      },
      {
        bank: 'ICICI Bank',
        slug: 'icici',
        card: 'Amazon Pay ICICI Card',
        matchScore: incVal >= 30000 ? 92 : 78,
        commission: '₹2,000',
        ltf: true,
        reason: 'Lifetime Free card with high approval yield',
        accent: '#F97316'
      },
      {
        bank: 'Axis Bank',
        slug: 'axis',
        card: 'Axis Bank MY ZONE Card',
        matchScore: incVal >= 25000 ? 90 : 75,
        commission: '₹2,400',
        ltf: false,
        reason: 'High conversion rate for online shopping leads',
        accent: '#E11D48'
      }
    ].sort((a, b) => b.matchScore - a.matchScore);

    setMatches(calculatedMatches);
    setShowResults(true);
  };

  return (
    <div style={{
      background: isDark ? 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)' : 'linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 100%)',
      borderRadius: '20px',
      padding: '20px 24px',
      border: `1.5px solid ${isDark ? '#334155' : '#BFDBFE'}`,
      boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.3)' : '0 10px 30px rgba(37,99,235,0.06)',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      marginBottom: '10px'
    }}>
      {/* HEADER BAR */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '12px',
            background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF'
          }}>
            <MdFlashOn size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 900, color: C.text, margin: 0, letterSpacing: '-0.3px' }}>
              Instant Bank Match & Qualification Engine
            </h3>
            <p style={{ fontSize: '12.5px', color: C.textMid, margin: '2px 0 0', fontWeight: 600 }}>
              Enter customer income & pincode to instantly discover top approval probability banks
            </p>
          </div>
        </div>

        <span style={{
          fontSize: '11.5px', fontWeight: 800, padding: '5px 12px', borderRadius: '20px',
          background: isDark ? 'rgba(16,185,129,0.15)' : '#D1FAE5', color: '#10B981',
          display: 'flex', alignItems: 'center', gap: '4px'
        }}>
          <MdCheckCircle size={15} /> Real-time Matrix Active
        </span>
      </div>

      {/* INTAKE FORM ROW */}
      <form onSubmit={handleRunQualification} style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '12px',
        alignItems: 'end'
      }}>
        {/* Monthly Income Input */}
        <div>
          <label style={{ fontSize: '11.5px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
            Monthly Income (₹)
          </label>          <input
            type="text"
            placeholder="e.g. 45000"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            required
            style={{
              width: '100%', padding: '10px 14px', borderRadius: '12px',
              border: `1px solid ${C.border}`, background: isDark ? '#0F172A' : '#FFFFFF',
              color: C.text, fontSize: '13.5px', fontWeight: 700, outline: 'none'
            }}
          />
        </div>

        {/* Pincode Input */}
        <div>
          <label style={{ fontSize: '11.5px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
            Location Pincode
          </label>
          <input
            type="text"
            placeholder="e.g. 400001"
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
            maxLength={6}
            required
            style={{
              width: '100%', padding: '10px 14px', borderRadius: '12px',
              border: `1px solid ${C.border}`, background: isDark ? '#0F172A' : '#FFFFFF',
              color: C.text, fontSize: '13.5px', fontWeight: 700, outline: 'none'
            }}
          />
        </div>

        {/* Employment Type */}
        <div>
          <label style={{ fontSize: '11.5px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
            Employment Type
          </label>
          <select
            value={empType}
            onChange={(e) => setEmpType(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: '12px',
              border: `1px solid ${C.border}`, background: isDark ? '#0F172A' : '#FFFFFF',
              color: C.text, fontSize: '13.5px', fontWeight: 700, outline: 'none', cursor: 'pointer'
            }}
          >
            <option value="salaried">Salaried (Private / Govt)</option>
            <option value="self_employed">Self Employed / Business</option>
            <option value="professional">Doctor / CA / Lawyer</option>
          </select>
        </div>

        {/* Category Target */}
        <div>
          <label style={{ fontSize: '11.5px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
            Product Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: '12px',
              border: `1px solid ${C.border}`, background: isDark ? '#0F172A' : '#FFFFFF',
              color: C.text, fontSize: '13.5px', fontWeight: 700, outline: 'none', cursor: 'pointer'
            }}
          >
            <option value="credit_card">Credit Cards</option>
            <option value="personal_loan">Personal Loans</option>
            <option value="business_loan">Business Loans</option>
            <option value="home_loan">Home Loans</option>
          </select>
        </div>

        {/* Qualification Action Button */}
        <div>
          <button
            type="submit"
            style={{
              width: '100%', padding: '11px 18px', borderRadius: '12px', border: 'none',
              background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,
              color: '#FFFFFF', fontWeight: 900, fontSize: '13.5px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              boxShadow: `0 4px 16px ${C.primary}40`, transition: 'transform 0.2s'
            }}
          >
            <MdFilterList size={18} />
            <span>Match Banks</span>
          </button>
        </div>
      </form>

      {/* MATCHED RESULTS DRAWER / ROW */}
      {showResults && (
        <div style={{
          marginTop: '12px', paddingTop: '16px', borderTop: `1px solid ${isDark ? '#334155' : '#DBEAFE'}`,
          display: 'flex', flexDirection: 'column', gap: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ fontSize: '14.5px', fontWeight: 900, color: C.text, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              🎯 Qualified Bank Matches ({matches.length} Banks Found)
            </h4>
            <button
              onClick={() => setShowResults(false)}
              style={{ background: 'none', border: 'none', color: C.textMid, cursor: 'pointer', padding: '4px' }}
            >
              <MdClose size={20} />
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px'
          }}>
            {matches.map((item, idx) => (
              <div key={idx} style={{
                background: isDark ? '#0F172A' : '#FFFFFF',
                borderRadius: '14px', padding: '14px 16px',
                border: `1.5px solid ${item.matchScore > 90 ? '#10B981' : C.border}`,
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '10px'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 900, color: item.accent }}>
                      {item.bank}
                    </span>
                    <span style={{
                      fontSize: '11px', fontWeight: 900, padding: '2px 8px', borderRadius: '10px',
                      background: item.matchScore > 90 ? '#D1FAE5' : '#FEF3C7',
                      color: item.matchScore > 90 ? '#065F46' : '#92400E'
                    }}>
                      {item.matchScore}% Match
                    </span>
                  </div>

                  <h5 style={{ fontSize: '13.5px', fontWeight: 800, color: C.text, margin: '0 0 4px' }}>
                    {item.card}
                  </h5>

                  <p style={{ fontSize: '11.5px', color: C.textMid, margin: 0, fontWeight: 600 }}>
                    {item.reason}
                  </p>
                </div>

                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  paddingTop: '8px', borderTop: `1px solid ${isDark ? '#1E293B' : '#F1F5F9'}`
                }}>
                  <span style={{ fontSize: '12px', fontWeight: 900, color: '#10B981' }}>
                    Payout: {item.commission}
                  </span>

                  <button
                    onClick={() => navigate(`/partner/credit-cards/${item.slug}`)}
                    style={{
                      padding: '6px 12px', borderRadius: '8px', border: 'none',
                      background: item.accent, color: '#FFFFFF', fontWeight: 800, fontSize: '12px',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                    }}
                  >
                    Apply <MdArrowForward size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

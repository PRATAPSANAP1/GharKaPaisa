import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useTheme, makeS } from '../../contexts/ThemeContext';
import { Icons } from '../../components/Icon/PartnerIcons';

export default function LoanRepay() {
  const { C } = useTheme();
  const S = makeS(C);
  const navigate = useNavigate();

  const [form, setForm] = useState({ loan_number: '', provider: 'HDFC Bank', mobile: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/services/request', {
        service_type: 'loan_repay',
        loan_number: form.loan_number,
        provider: form.provider,
        mobile: form.mobile
      });
      setSuccess(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to process loan repayment');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ padding: "40px 20px", maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
        <div style={{ ...S.card, padding: "40px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
          <div style={{ color: C.green, fontSize: "48px" }}>{Icons.CheckCircle || "✅"}</div>
          <h2 style={{ color: C.text, margin: 0 }}>Repayment Initiated</h2>
          <p style={{ color: C.textLight }}>We have received your Loan Repayment request for Loan No: {form.loan_number}. Our team will contact you shortly.</p>
          <button onClick={() => navigate('/money-transfer')} style={{ ...S.btn("primary"), marginTop: "20px" }}>
            Back to Services
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px 20px", maxWidth: "600px", margin: "0 auto" }}>
      <button onClick={() => navigate(-1)} style={{ ...S.btn("outline"), marginBottom: "20px", border: "none", padding: 0 }}>
        {Icons.ArrowLeft || "←"} Back
      </button>
      
      <div style={{ ...S.card, padding: "32px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 800, color: C.text, margin: "0 0 8px 0" }}>Loan Repayment</h1>
        <p style={{ color: C.textLight, marginBottom: "24px" }}>Pay your EMIs instantly</p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={S.label}>Loan / Account Number</label>
            <input 
              required
              type="text"
              placeholder="Enter loan number"
              style={S.input}
              value={form.loan_number}
              onChange={e => setForm({...form, loan_number: e.target.value})}
            />
          </div>

          <div>
            <label style={S.label}>Bank / Financer</label>
            <select 
              required
              style={S.input}
              value={form.provider}
              onChange={e => setForm({...form, provider: e.target.value})}
            >
              <option value="HDFC Bank">HDFC Bank</option>
              <option value="ICICI Bank">ICICI Bank</option>
              <option value="Axis Bank">Axis Bank</option>
              <option value="SBI">State Bank of India</option>
              <option value="Bajaj Finserv">Bajaj Finserv</option>
              <option value="Muthoot Finance">Muthoot Finance</option>
            </select>
          </div>

          <div>
            <label style={S.label}>Mobile Number</label>
            <input 
              required
              type="tel"
              placeholder="Enter mobile number"
              style={S.input}
              value={form.mobile}
              onChange={e => setForm({...form, mobile: e.target.value})}
            />
          </div>

          <button type="submit" disabled={loading} style={{ ...S.btn("primary"), padding: "14px", fontSize: "16px", marginTop: "10px" }}>
            {loading ? "Submitting..." : "Submit Request"}
          </button>
        </form>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { useTheme, makeS } from '../../contexts/ThemeContext';
import { Icons } from '../../components/Icon/PartnerIcons';

export default function Recharge() {
  const { C } = useTheme();
  const S = makeS(C);
  const navigate = useNavigate();

  const [form, setForm] = useState({ mobile: '', operator: 'Jio', amount: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/services/request', {
        service_type: 'recharge',
        mobile: form.mobile,
        operator: form.operator,
        amount: form.amount
      });
      setSuccess(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to process recharge');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ padding: "40px 20px", maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
        <div style={{ ...S.card, padding: "40px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
          <div style={{ color: C.green, fontSize: "48px" }}>{Icons.CheckCircle || "✅"}</div>
          <h2 style={{ color: C.text, margin: 0 }}>Recharge Initiated</h2>
          <p style={{ color: C.textLight }}>Your recharge of ₹{form.amount} for {form.mobile} is processing.</p>
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
        <h1 style={{ fontSize: "24px", fontWeight: 800, color: C.text, margin: "0 0 8px 0" }}>Mobile Recharge</h1>
        <p style={{ color: C.textLight, marginBottom: "24px" }}>Instantly recharge any prepaid mobile number</p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={S.label}>Mobile Number</label>
            <input 
              required
              type="tel"
              pattern="[0-9]{10}"
              placeholder="10-digit mobile number"
              style={S.input}
              value={form.mobile}
              onChange={e => setForm({...form, mobile: e.target.value})}
            />
          </div>

          <div>
            <label style={S.label}>Operator</label>
            <select 
              required
              style={S.input}
              value={form.operator}
              onChange={e => setForm({...form, operator: e.target.value})}
            >
              <option value="Jio">Jio</option>
              <option value="Airtel">Airtel</option>
              <option value="VI">Vodafone Idea</option>
              <option value="BSNL">BSNL</option>
            </select>
          </div>

          <div>
            <label style={S.label}>Amount (₹)</label>
            <input 
              required
              type="number"
              min="10"
              placeholder="Enter amount"
              style={S.input}
              value={form.amount}
              onChange={e => setForm({...form, amount: e.target.value})}
            />
          </div>

          <button type="submit" disabled={loading} style={{ ...S.btn("primary"), padding: "14px", fontSize: "16px", marginTop: "10px" }}>
            {loading ? "Processing..." : "Recharge Now"}
          </button>
        </form>
      </div>
    </div>
  );
}

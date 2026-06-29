import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { useTheme, makeS } from '../../contexts/ThemeContext';
import { Icons } from '../../components/Icon/PartnerIcons';

export default function Fastag() {
  const { C } = useTheme();
  const S = makeS(C);
  const navigate = useNavigate();

  const [form, setForm] = useState({ vehicle_number: '', provider: 'Paytm FASTag', amount: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/services/request', {
        service_type: 'fastag',
        vehicle_number: form.vehicle_number,
        provider: form.provider,
        amount: form.amount
      });
      setSuccess(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to process FASTag recharge');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ padding: "40px 20px", maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
        <div style={{ ...S.card, padding: "40px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
          <div style={{ color: C.green, fontSize: "48px" }}>{Icons.CheckCircle || "✅"}</div>
          <h2 style={{ color: C.text, margin: 0 }}>FASTag Recharge Initiated</h2>
          <p style={{ color: C.textLight }}>Your recharge of ₹{form.amount} for Vehicle: {form.vehicle_number} is processing.</p>
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
        <h1 style={{ fontSize: "24px", fontWeight: 800, color: C.text, margin: "0 0 8px 0" }}>FASTag Recharge</h1>
        <p style={{ color: C.textLight, marginBottom: "24px" }}>Recharge your FASTag wallet instantly</p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={S.label}>Vehicle Registration Number</label>
            <input 
              required
              type="text"
              placeholder="e.g. MH12AB1234"
              style={S.input}
              value={form.vehicle_number}
              onChange={e => setForm({...form, vehicle_number: e.target.value.toUpperCase()})}
            />
          </div>

          <div>
            <label style={S.label}>FASTag Issuing Bank</label>
            <select 
              required
              style={S.input}
              value={form.provider}
              onChange={e => setForm({...form, provider: e.target.value})}
            >
              <option value="Paytm FASTag">Paytm Payments Bank</option>
              <option value="HDFC Bank">HDFC Bank</option>
              <option value="ICICI Bank">ICICI Bank</option>
              <option value="SBI">State Bank of India</option>
              <option value="Axis Bank">Axis Bank</option>
            </select>
          </div>

          <div>
            <label style={S.label}>Amount (₹)</label>
            <input 
              required
              type="number"
              min="100"
              placeholder="Enter amount"
              style={S.input}
              value={form.amount}
              onChange={e => setForm({...form, amount: e.target.value})}
            />
          </div>

          <button type="submit" disabled={loading} style={{ ...S.btn("primary"), padding: "14px", fontSize: "16px", marginTop: "10px" }}>
            {loading ? "Processing..." : "Recharge FASTag"}
          </button>
        </form>
      </div>
    </div>
  );
}

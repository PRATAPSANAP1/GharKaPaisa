import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { useTheme, makeS } from '../../contexts/ThemeContext';
import { Icons } from '../../components/Icon/PartnerIcons';

export default function ApplyForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { C } = useTheme();
  const S = makeS(C);

  const [product, setProduct] = useState(null);
  const [form, setForm] = useState({ full_name: '', mobile: '', email: '', city: '', partner_code: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // If they came with a partner code in URL (e.g. ?ref=PARTNER123)
    const params = new URLSearchParams(location.search);
    const ref = params.get('ref');
    if (ref) setForm(prev => ({ ...prev, partner_code: ref }));

    api.get(`/products/${id}`)
      .then(res => {
        if(res.data?.success) setProduct(res.data.data);
      })
      .catch(err => console.error(err));
  }, [id, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/applications/public', {
        product_id: product?.id || id,
        customer: {
          full_name: form.full_name,
          mobile: form.mobile,
          email: form.email,
          city: form.city
        },
        partner_code: form.partner_code
      });
      setSuccess(true);
      if (product?.public_url) {
        setTimeout(() => {
          window.location.href = product.public_url;
        }, 1500);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ padding: "60px 20px", maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
        <div style={{ ...S.card, padding: "40px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
          <div style={{ color: C.green, fontSize: "64px" }}>{Icons.CheckCircle || "✅"}</div>
          <h2 style={{ color: C.text, margin: 0 }}>Application Submitted!</h2>
          <p style={{ color: C.textLight }}>Thank you! Your application for {product?.name} has been received.</p>
          {product?.public_url ? (
            <p style={{ color: C.primary, fontWeight: 'bold' }}>Redirecting you to the lending partner page...</p>
          ) : (
            <button onClick={() => navigate('/')} style={{ ...S.btn("primary"), marginTop: "20px" }}>
              Return to Homepage
            </button>
          )}
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
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: C.text, margin: "0 0 8px 0" }}>Apply Now</h1>
          <p style={{ color: C.textLight, margin: 0 }}>{product ? `Applying for ${product.name}` : 'Loading product...'}</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={S.label}>Full Name</label>
            <input 
              required
              type="text"
              placeholder="As per PAN card"
              style={S.input}
              value={form.full_name}
              onChange={e => setForm({...form, full_name: e.target.value})}
            />
          </div>

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
            <label style={S.label}>Email Address</label>
            <input 
              required
              type="email"
              placeholder="Your email address"
              style={S.input}
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
            />
          </div>

          <div>
            <label style={S.label}>City</label>
            <input 
              required
              type="text"
              placeholder="Current city of residence"
              style={S.input}
              value={form.city}
              onChange={e => setForm({...form, city: e.target.value})}
            />
          </div>

          <div>
            <label style={S.label}>Partner / Referral Code (Optional)</label>
            <input 
              type="text"
              placeholder="If you were referred by a Partner"
              style={S.input}
              value={form.partner_code}
              onChange={e => setForm({...form, partner_code: e.target.value})}
            />
          </div>

          <button type="submit" disabled={loading} style={{ ...S.btn("primary"), padding: "14px", fontSize: "16px", marginTop: "10px" }}>
            {loading ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </div>
    </div>
  );
}

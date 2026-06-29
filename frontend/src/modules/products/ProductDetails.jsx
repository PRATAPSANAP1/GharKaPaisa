import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { useTheme, makeS } from '../../contexts/ThemeContext';
import { Icons } from '../../components/Icon/PartnerIcons';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { C } = useTheme();
  const S = makeS(C);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/products/${id}`)
      .then(res => {
        if(res.data?.success) setProduct(res.data.data);
      })
      .catch(err => {
        console.error(err);
        alert("Failed to load product details");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ textAlign: "center", padding: "60px" }}>Loading...</div>;
  if (!product) return <div style={{ textAlign: "center", padding: "60px" }}>Product not found.</div>;

  return (
    <div style={{ padding: "40px 20px", maxWidth: "800px", margin: "0 auto" }}>
      <button onClick={() => navigate(-1)} style={{ ...S.btn("outline"), marginBottom: "20px", border: "none", padding: 0 }}>
        {Icons.ArrowLeft || "←"} Back
      </button>

      <div style={{ ...S.card, overflow: "hidden" }}>
        <div style={{ 
          background: `linear-gradient(135deg, ${C.primary}E0, ${C.teal}E0)`,
          padding: "40px",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          gap: "12px"
        }}>
          <span style={{ 
            background: "rgba(255,255,255,0.2)", 
            padding: "4px 12px", 
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: 700,
            width: "max-content"
          }}>
            {product.category.replace('_', ' ').toUpperCase()}
          </span>
          <h1 style={{ fontSize: "36px", margin: 0, fontWeight: 800 }}>{product.name}</h1>
          <p style={{ fontSize: "18px", margin: 0, opacity: 0.9 }}>By {product.bank_name}</p>
        </div>

        <div style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
          <div>
            <h3 style={{ fontSize: "20px", fontWeight: 800, color: C.text, margin: "0 0 16px 0" }}>Features</h3>
            <ul style={{ display: "flex", flexDirection: "column", gap: "12px", padding: 0, margin: 0, listStyle: "none" }}>
              {(product.features || ["Instant Approval", "Minimum Documentation", "Quick Processing"]).map((f, i) => (
                <li key={i} style={{ display: "flex", alignItems: "center", gap: "10px", color: C.textLight }}>
                  <span style={{ color: C.green }}>{Icons.CheckCircle || "✓"}</span> {f}
                </li>
              ))}
            </ul>
          </div>

          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "24px" }}>
            <button 
              onClick={() => navigate(`/product/${id}/apply`)}
              style={{ ...S.btn("primary"), width: "100%", padding: "16px", fontSize: "18px" }}
            >
              Apply Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

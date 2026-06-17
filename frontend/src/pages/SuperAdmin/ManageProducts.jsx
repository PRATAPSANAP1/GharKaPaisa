// ─────────────────────────────────────────────────────────────────────────────
// d:\Internship\yohesa\frontend\src\pages\SuperAdmin\ManageProducts.jsx
// Core Feature: Product Activation & Status Administration
// Roles: SuperAdmin (Toggle active/inactive cards and loans)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from "react";
import api from "../../api/api";
import { useTheme, makeS } from "../../components/Partner/ThemeContext";
import { Icons } from "../../components/Partner/PartnerIcons";

export default function ManageProducts() {
  // ─── THEMING & STYLE TOKENS ────────────────────────────────────────────────
  const { C } = useTheme();
  const S = makeS(C);

  // ─── APPLICATION STATE ─────────────────────────────────────────────────────
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  // ─── API SIDE EFFECTS & HANDLERS ──────────────────────────────────────────

  // Fetch all products matching filters (returns active & inactive products)
  const fetchProducts = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await api.get("/products", {
        params: {
          is_active: "all",
          limit: 100,
          search: search.trim() || undefined,
          category: categoryFilter || undefined,
        },
      });
      if (res.data?.success) {
        setProducts(res.data.data);
      }
    } catch (e) {
      console.error("[ManageProducts] Fetch Error:", e);
      setErrorMsg(e.response?.data?.message || "Failed to load products catalog");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [categoryFilter]);

  // ─── ACTION MUTATIONS ──────────────────────────────────────────────────────

  // Toggle is_active status of selected product
  const toggleProductActivation = async (product) => {
    setUpdatingId(product.id);
    const newStatus = !product.is_active;
    try {
      const res = await api.put(`/products/${product.id}`, {
        is_active: newStatus,
      });
      if (res.data?.success) {
        setProducts(
          products.map((p) => (p.id === product.id ? { ...p, is_active: newStatus } : p))
        );
      }
    } catch (e) {
      alert(e.response?.data?.message || "Failed to update product status.");
    } finally {
      setUpdatingId(null);
    }
  };

  // ─── EVENT HANDLERS ────────────────────────────────────────────────────────

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleResetFilters = () => {
    setSearch("");
    setCategoryFilter("");
    setTimeout(() => fetchProducts(), 0);
  };

  // ─── RENDER BLOCKS ─────────────────────────────────────────────────────────
  return (
    <div>
      {/* ─── PAGE HEADER SECTION ─── */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: 800, color: C.text, margin: 0 }}>Product Status Management</h2>
        <p style={{ fontSize: "13px", color: C.textLight, margin: "4px 0 0 0" }}>Activate or deactivate Credit Cards, Loans, and Insurance plans across the partner network catalog</p>
      </div>

      {/* ─── FILTERS & SEARCH CONTROL PANEL ─── */}
      <div style={{ ...S.card, padding: "16px", marginBottom: "24px" }}>
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "flex-end" }}>
          
          {/* Keyword Search Input */}
          <div style={{ flex: 1, minWidth: "200px" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: C.textLight, display: "block", marginBottom: "4px" }}>Search Products</label>
            <input
              style={S.input}
              placeholder="Search by product name or bank..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Category Select Input */}
          <div style={{ width: "220px" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: C.textLight, display: "block", marginBottom: "4px" }}>Category</label>
            <select
              style={S.input}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="credit_card">Credit Cards</option>
              <option value="personal_loan">Personal Loans</option>
              <option value="business_loan">Business Loans</option>
              <option value="home_loan">Home Loans</option>
              <option value="instant_loan">Instant Loans</option>
              <option value="health_insurance">Health Insurance</option>
              <option value="life_insurance">Life/Term Insurance</option>
              <option value="general_insurance">General Insurance</option>
              <option value="co_branded_card">Co-branded Cards</option>
              <option value="fd_card">FD Cards</option>
            </select>
          </div>

          {/* Form Action buttons */}
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="submit" style={{ ...S.btn("primary"), padding: "10px 20px" }}>
              Search
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              style={{ ...S.btn("outline"), padding: "10px 16px", border: "none", color: C.textLight }}
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Error alert wrapper */}
      {errorMsg && (
        <div style={{ padding: "16px", background: `${C.red}10`, border: `1px solid ${C.red}30`, borderRadius: "12px", color: C.red, marginBottom: "16px" }}>
          {errorMsg}
        </div>
      )}

      {/* ─── DATA TABLE VIEW ─── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "48px", color: C.textLight }}>
          <div className="animate-spin" style={{ width: "24px", height: "24px", border: `3px solid ${C.teal}`, borderTopColor: "transparent", borderRadius: "50%", margin: "0 auto 8px" }}></div>
          Loading products...
        </div>
      ) : products.length === 0 ? (
        <div style={{ ...S.card, textAlign: "center", padding: "48px", color: C.textLight }}>
          No products matched the filtering criteria.
        </div>
      ) : (
        <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, color: C.textLight, fontSize: "12px", textTransform: "uppercase" }}>
                  <th style={{ padding: "14px 16px" }}>Product Name</th>
                  <th style={{ padding: "14px 16px" }}>Category</th>
                  <th style={{ padding: "14px 16px" }}>Bank & Code</th>
                  <th style={{ padding: "14px 16px" }}>Payout rate</th>
                  <th style={{ padding: "14px 16px", textAlign: "center" }}>Active Status</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: "13.5px", color: C.text }}>
                {products.map((p) => (
                  <tr key={p.id} style={{ borderBottom: `1px solid ${C.border}60` }} className="hover:bg-gray-50/10">
                    {/* Product Name & Description */}
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 800 }}>{p.name}</div>
                      <div style={{ fontSize: "11px", color: C.textLight, marginTop: "2px", maxWidth: "400px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.description || "No description provided"}
                      </div>
                    </td>
                    
                    {/* Category Column */}
                    <td style={{ padding: "14px 16px", textTransform: "capitalize", fontWeight: 600 }}>
                      {p.category.replace(/_/g, " ")}
                    </td>
                    
                    {/* Bank & Short Code */}
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 600 }}>{p.bank_name}</div>
                      <div style={{ fontSize: "11px", color: C.textLight }}>{p.bank_code}</div>
                    </td>
                    
                    {/* Payout rate */}
                    <td style={{ padding: "14px 16px", fontWeight: 700, color: C.green }}>
                      {p.commission_type === "fixed" ? `₹${parseFloat(p.commission_value).toLocaleString("en-IN")}` : `${p.commission_value}%`}
                    </td>
                    
                    {/* Toggle activation switch */}
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <button
                        type="button"
                        onClick={() => toggleProductActivation(p)}
                        disabled={updatingId === p.id}
                        style={{
                          background: p.is_active ? `${C.green}15` : `${C.red}15`,
                          color: p.is_active ? C.green : C.red,
                          border: `1px solid ${p.is_active ? C.green : C.red}30`,
                          padding: "6px 14px",
                          borderRadius: "20px",
                          fontWeight: 800,
                          fontSize: "12px",
                          cursor: updatingId === p.id ? "not-allowed" : "pointer",
                          minWidth: "90px",
                          transition: "all 0.2s"
                        }}
                      >
                        {updatingId === p.id ? "Toggling..." : p.is_active ? "🟢 Active" : "🔴 Inactive"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from "react";
import api from "../../api/api";
import { useTheme, makeS } from "../../components/Partner/ThemeContext";
import { Icons } from "../../components/Partner/PartnerIcons";

export default function ManageProducts() {
  const { C } = useTheme();
  const S = makeS(C);

  const [products, setProducts] = useState([]);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [form, setForm] = useState({
    name: "",
    category: "credit_card",
    bank_id: "",
    description: "",
    commission_type: "fixed",
    commission_value: 0,
    min_age: 18,
    max_age: 60,
    min_income: 0,
    features: "[]", // stringified array
    is_active: true
  });

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const [prodRes, bankRes] = await Promise.all([
        api.get("/products", {
          params: {
            is_active: "all",
            limit: 100,
            search: search.trim() || undefined,
            category: categoryFilter || undefined,
          },
        }),
        api.get("/banks")
      ]);
      if (prodRes.data?.success) setProducts(prodRes.data.data);
      if (bankRes.data?.success) setBanks(bankRes.data.data);
    } catch (e) {
      console.error("[ManageProducts] Fetch Error:", e);
      setErrorMsg(e.response?.data?.message || "Failed to load products or banks catalog");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [categoryFilter]);

  const toggleProductActivation = async (product) => {
    setUpdatingId(product.id);
    const newStatus = !product.is_active;
    try {
      const res = await api.put(`/products/${product.id}`, { is_active: newStatus });
      if (res.data?.success) {
        setProducts(products.map((p) => (p.id === product.id ? { ...p, is_active: newStatus } : p)));
      }
    } catch (e) {
      alert(e.response?.data?.message || "Failed to update product status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const openAddModal = () => {
    setEditItem(null);
    setForm({
      name: "",
      category: "credit_card",
      bank_id: banks[0]?.id || "",
      description: "",
      commission_type: "fixed",
      commission_value: 0,
      min_age: 18,
      max_age: 60,
      min_income: 0,
      features: "[\"Benefit 1\", \"Benefit 2\"]",
      is_active: true
    });
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditItem(item);
    setForm({
      name: item.name,
      category: item.category,
      bank_id: item.bank_id,
      description: item.description || "",
      commission_type: item.commission_type || "fixed",
      commission_value: item.commission_value || 0,
      min_age: item.eligibility?.min_age || item.min_age || 18,
      max_age: item.eligibility?.max_age || item.max_age || 60,
      min_income: item.eligibility?.min_income || item.min_income || 0,
      features: JSON.stringify(item.features || []),
      is_active: item.is_active
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let parsedFeatures = [];
      try { parsedFeatures = JSON.parse(form.features); } catch (err) { parsedFeatures = []; }
      
      const payload = {
        name: form.name.trim(),
        category: form.category,
        bank_id: form.bank_id,
        description: form.description.trim(),
        commission_type: form.commission_type,
        commission_value: Number(form.commission_value),
        min_age: Number(form.min_age),
        max_age: Number(form.max_age),
        min_income: Number(form.min_income),
        features: parsedFeatures,
        eligibility: { min_age: Number(form.min_age), max_age: Number(form.max_age), min_income: Number(form.min_income) },
        is_active: form.is_active
      };

      let res;
      if (editItem) {
        res = await api.put(`/products/${editItem.id}`, payload);
      } else {
        res = await api.post("/products", payload);
      }

      if (res.data?.success) {
        alert(editItem ? "Product updated successfully!" : "Product created successfully!");
        setModalOpen(false);
        fetchData();
      }
    } catch (e) {
      alert(e.response?.data?.message || "Failed to save product configuration.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: 800, color: C.text, margin: 0 }}>Product & Commission Master</h2>
          <p style={{ fontSize: "13px", color: C.textLight, margin: "4px 0 0 0" }}>Manage Products, Eligibility, and Payout Structures</p>
        </div>
        <button onClick={openAddModal} style={{ ...S.btn("primary"), display: "flex", alignItems: "center", gap: "8px" }}>
          <Icons.check size={16} /> Add Product
        </button>
      </div>

      <div style={{ ...S.card, padding: "16px", marginBottom: "24px" }}>
        <form onSubmit={(e) => { e.preventDefault(); fetchData(); }} style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "flex-end" }}>
          <div style={{ flex: 1, minWidth: "200px" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: C.textLight, display: "block", marginBottom: "4px" }}>Search Products</label>
            <input style={S.input} placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div style={{ width: "220px" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: C.textLight, display: "block", marginBottom: "4px" }}>Category</label>
            <select style={S.input} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">All Categories</option>
              <option value="credit_card">Credit Cards</option>
              <option value="personal_loan">Personal Loans</option>
              <option value="health_insurance">Health Insurance</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="submit" style={S.btn("primary")}>Search</button>
            <button type="button" onClick={() => { setSearch(""); setCategoryFilter(""); setTimeout(fetchData, 0); }} style={S.btn("outline")}>Reset</button>
          </div>
        </form>
      </div>

      {errorMsg && <div style={{ padding: "16px", background: `${C.red}10`, color: C.red, marginBottom: "16px" }}>{errorMsg}</div>}

      {loading ? (
        <div style={{ textAlign: "center", padding: "48px" }}>Loading products...</div>
      ) : products.length === 0 ? (
        <div style={{ ...S.card, textAlign: "center", padding: "48px" }}>No products found.</div>
      ) : (
        <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, fontSize: "12px", textTransform: "uppercase" }}>
                  <th style={{ padding: "14px 16px" }}>Product Name</th>
                  <th style={{ padding: "14px 16px" }}>Bank & Category</th>
                  <th style={{ padding: "14px 16px" }}>Base Commission</th>
                  <th style={{ padding: "14px 16px", textAlign: "center" }}>Status & Actions</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: "13.5px", color: C.text }}>
                {products.map((p) => (
                  <tr key={p.id} style={{ borderBottom: `1px solid ${C.border}60` }}>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 800 }}>{p.name}</div>
                      <div style={{ fontSize: "11px", color: C.textLight }}>{p.description?.substring(0,50)}...</div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 600 }}>{p.bank_name} ({p.bank_code})</div>
                      <div style={{ fontSize: "11px", textTransform: "capitalize", color: C.textLight }}>{p.category.replace(/_/g, " ")}</div>
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: 700, color: C.green }}>
                      {p.commission_type === "fixed" ? `₹${p.commission_value}` : `${p.commission_value}%`}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button onClick={() => toggleProductActivation(p)} disabled={updatingId === p.id} style={{ background: p.is_active ? `${C.green}15` : `${C.red}15`, color: p.is_active ? C.green : C.red, border: "none", padding: "6px 10px", borderRadius: "8px", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}>
                          {updatingId === p.id ? "..." : p.is_active ? "Active" : "Inactive"}
                        </button>
                        <button onClick={() => openEditModal(p)} style={{ border: `1px solid ${C.border}`, background: 'none', padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD/EDIT MODAL */}
      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
          <div style={{ ...S.card, width: "100%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto", padding: "24px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "16px" }}>{editItem ? "Edit Product" : "Create Product Master"}</h3>
            
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label style={S.label}>Product Name *</label>
                  <input required style={S.input} value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={S.label}>Bank Partner *</label>
                  <select required style={S.input} value={form.bank_id} onChange={e => setForm({...form, bank_id: e.target.value})}>
                    <option value="">Select Bank...</option>
                    {banks.map(b => <option key={b.id} value={b.id}>{b.name} ({b.short_code})</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={S.label}>Category *</label>
                <select required style={S.input} value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                  <option value="credit_card">Credit Card</option>
                  <option value="personal_loan">Personal Loan</option>
                  <option value="home_loan">Home Loan</option>
                  <option value="business_loan">Business Loan</option>
                  <option value="health_insurance">Health Insurance</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "12px", background: `${C.green}10`, padding: "12px", borderRadius: "8px", border: `1px solid ${C.green}30` }}>
                <div style={{ flex: 1 }}>
                  <label style={{...S.label, color: C.green}}>Base Commission Type</label>
                  <select style={S.input} value={form.commission_type} onChange={e => setForm({...form, commission_type: e.target.value})}>
                    <option value="fixed">Fixed Flat Payout (₹)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{...S.label, color: C.green}}>Commission Value *</label>
                  <input required type="number" step="0.01" style={S.input} value={form.commission_value} onChange={e => setForm({...form, commission_value: e.target.value})} />
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label style={S.label}>Min Age</label>
                  <input type="number" style={S.input} value={form.min_age} onChange={e => setForm({...form, min_age: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={S.label}>Min Income (₹)</label>
                  <input type="number" style={S.input} value={form.min_income} onChange={e => setForm({...form, min_income: e.target.value})} />
                </div>
              </div>

              <div>
                <label style={S.label}>Features (JSON Array) *</label>
                <textarea required rows="2" style={{...S.input, fontFamily: "monospace"}} value={form.features} onChange={e => setForm({...form, features: e.target.value})} />
              </div>

              <div>
                <label style={S.label}>Description</label>
                <textarea rows="2" style={S.input} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button type="button" onClick={() => setModalOpen(false)} style={S.btn("outline")}>Cancel</button>
                <button type="submit" disabled={submitting} style={S.btn("primary")}>{submitting ? "Saving..." : "Save Product"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

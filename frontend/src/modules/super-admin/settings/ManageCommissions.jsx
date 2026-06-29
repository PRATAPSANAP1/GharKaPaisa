import React, { useState, useEffect } from "react";
import api from "../../../services/api";
import { useTheme, makeS } from "../../../contexts/ThemeContext";
import { Icons } from "../../../components/Icon/PartnerIcons";

export default function ManageCommissions() {
  const { C } = useTheme();
  const S = makeS(C);

  const [products, setProducts] = useState([]);
  const [partners, setPartners] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  // Tab control: 'base' or 'overrides'
  const [activeTab, setActiveTab] = useState("overrides");
  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [form, setForm] = useState({
    product_id: "",
    Partner_id: "", // empty means Global Override
    commission_type: "fixed",
    commission_value: "",
    effective_from: new Date().toISOString().split("T")[0],
    effective_to: "",
  });

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const [prodRes, partnerRes, rulesRes] = await Promise.all([
        api.get("/products", { params: { is_active: "all", limit: 200 } }),
        api.get("/admin/partners", { params: { limit: 1000 } }),
        api.get("/admin/commission-rules")
      ]);
      
      if (prodRes.data?.success) setProducts(prodRes.data.data);
      if (partnerRes.data?.success) setPartners(partnerRes.data.data);
      if (rulesRes.data?.success) setRules(rulesRes.data.data);
    } catch (e) {
      console.error("[ManageCommissions] Fetch Error:", e);
      setErrorMsg(e.response?.data?.message || "Failed to load commission configuration data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = () => {
    setForm({
      product_id: products[0]?.id || "",
      Partner_id: "", // default: Global
      commission_type: "fixed",
      commission_value: "",
      effective_from: new Date().toISOString().split("T")[0],
      effective_to: "",
    });
    setErrorMsg("");
    setSuccessMsg("");
    setModalOpen(true);
  };

  const handleCreateRule = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    const payload = {
      product_id: form.product_id,
      commission_type: form.commission_type,
      commission_value: parseFloat(form.commission_value),
      effective_from: form.effective_from,
      effective_to: form.effective_to || null,
    };

    // If Partner_id is specified and not empty, include it
    if (form.Partner_id && form.Partner_id !== "global" && form.Partner_id !== "") {
      payload.Partner_id = form.Partner_id;
    }

    try {
      const res = await api.post("/admin/commission-rule", payload);
      if (res.data?.success) {
        setSuccessMsg("Commission rule applied successfully.");
        setModalOpen(false);
        fetchData();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to set commission rule");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRule = async (id) => {
    if (!window.confirm("Are you sure you want to delete this custom commission override?")) {
      return;
    }
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await api.delete(`/admin/commission-rules/${id}`);
      if (res.data?.success) {
        setSuccessMsg("Override rule deleted successfully.");
        fetchData();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to delete commission rule");
    }
  };

  const formatCategory = (cat) => {
    if (!cat) return "";
    return cat.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  };

  return (
    <div style={{ boxSizing: "border-box", minHeight: "100%" }}>
      {/* Title Header */}
      <div className="responsive-header" style={{ marginBottom: "24px", width: "100%" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 900, color: C.text, margin: 0 }}>Commission Manager</h1>
          <p style={{ fontSize: "14px", color: C.textMid, marginTop: "4px", marginBottom: 0 }}>
            Configure default payouts and set partner-specific commission overrides.
          </p>
        </div>
        <button
          onClick={handleOpenModal}
          style={{
            ...S.btn("primary"),
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
          }}
        >
          <Icons.gift size={16} /> Set Override Rule
        </button>
      </div>

      {/* Messages */}
      {successMsg && (
        <div style={{
          background: `${C.green}15`,
          border: `1px solid ${C.green}40`,
          borderRadius: "10px",
          padding: "12px 16px",
          color: C.green,
          fontSize: "14px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <Icons.check size={16} /> {successMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{
          background: `${C.red}15`,
          border: `1px solid ${C.red}40`,
          borderRadius: "10px",
          padding: "12px 16px",
          color: C.red,
          fontSize: "14px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <Icons.x size={16} /> {errorMsg}
        </div>
      )}

      {/* Tabs Layout */}
      <div style={{ display: "flex", gap: "12px", borderBottom: `1px solid ${C.border}`, marginBottom: "20px", paddingBottom: "1px" }}>
        <button
          onClick={() => setActiveTab("overrides")}
          style={{
            background: "none",
            border: "none",
            borderBottom: activeTab === "overrides" ? `3px solid ${C.teal}` : "3px solid transparent",
            color: activeTab === "overrides" ? C.text : C.textMid,
            fontSize: "15px",
            fontWeight: 700,
            padding: "10px 16px",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          Custom Overrides ({rules.length})
        </button>
        <button
          onClick={() => setActiveTab("base")}
          style={{
            background: "none",
            border: "none",
            borderBottom: activeTab === "base" ? `3px solid ${C.teal}` : "3px solid transparent",
            color: activeTab === "base" ? C.text : C.textMid,
            fontSize: "15px",
            fontWeight: 700,
            padding: "10px 16px",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          Default Base Rates ({products.length})
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "60px" }}>
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            border: `3px solid ${C.border}`,
            borderTopColor: C.teal,
            animation: "spin 1s linear infinite"
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : activeTab === "overrides" ? (
        /* TAB: OVERRIDES */
        <div style={S.card}>
          {rules.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 24px" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>⚙️</div>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: C.text }}>No Custom Override Rules</h3>
              <p style={{ fontSize: "13px", color: C.textMid, maxWidth: "360px", margin: "8px auto 0" }}>
                All partners currently receive the standard product commission payouts. Set an override rule to configure customized payouts.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                    <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: 700, color: C.textLight, textTransform: "uppercase" }}>Product</th>
                    <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: 700, color: C.textLight, textTransform: "uppercase" }}>Partner</th>
                    <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: 700, color: C.textLight, textTransform: "uppercase" }}>Type</th>
                    <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: 700, color: C.textLight, textTransform: "uppercase" }}>Payout Value</th>
                    <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: 700, color: C.textLight, textTransform: "uppercase" }}>Effective Period</th>
                    <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: 700, color: C.textLight, textTransform: "uppercase", textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule) => (
                    <tr key={rule.id} style={{ borderBottom: `1px solid ${C.border}`, transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = `${C.border}15`} onMouseLeave={e => e.currentTarget.style.background = "none"}>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 700, color: C.text }}>{rule.product_name}</div>
                        <div style={{ fontSize: "11px", color: C.teal, fontWeight: 600, marginTop: "2px" }}>{formatCategory(rule.product_category)}</div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        {rule.Partner_id || rule.partner_id ? (
                          <div>
                            <span style={{ fontWeight: 700, color: C.text }}>
                              {rule.first_name} {rule.last_name}
                            </span>
                            <span style={{ fontSize: "11px", background: `${C.teal}15`, color: C.teal, borderRadius: "4px", padding: "2px 6px", marginLeft: "6px", fontWeight: 700 }}>
                              {rule.Partner_code || rule.partner_code}
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontWeight: 700, color: C.gold, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            🌐 Global Default Override
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "4px 8px",
                          borderRadius: "6px",
                          background: rule.commission_type === "percentage" ? `${C.green}15` : `${C.primary}15`,
                          color: rule.commission_type === "percentage" ? C.green : C.primary,
                          textTransform: "uppercase"
                        }}>
                          {rule.commission_type}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", fontWeight: 800, color: C.text }}>
                        {rule.commission_type === "percentage" ? `${rule.commission_value}%` : `₹${rule.commission_value}`}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: "13px", color: C.textMid }}>
                        <div>From: {new Date(rule.effective_from).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
                        {rule.effective_to && (
                          <div style={{ fontSize: "11px", color: C.textLight, marginTop: "2px" }}>
                            To: {new Date(rule.effective_to).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          style={{
                            border: `1.5px solid ${C.red}35`,
                            background: `${C.red}12`,
                            color: C.red,
                            padding: "6px 12px",
                            borderRadius: "8px",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = C.red; e.currentTarget.style.color = "#fff"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = `${C.red}12`; e.currentTarget.style.color = C.red; }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* TAB: BASE RATES */
        <div style={S.card}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                  <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: 700, color: C.textLight, textTransform: "uppercase" }}>Product Name</th>
                  <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: 700, color: C.textLight, textTransform: "uppercase" }}>Category</th>
                  <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: 700, color: C.textLight, textTransform: "uppercase" }}>Lending Partner</th>
                  <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: 700, color: C.textLight, textTransform: "uppercase" }}>Commission Type</th>
                  <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: 700, color: C.textLight, textTransform: "uppercase" }}>Default Value</th>
                  <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: 700, color: C.textLight, textTransform: "uppercase" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: "14px 16px", fontWeight: 700, color: C.text }}>{p.name}</td>
                    <td style={{ padding: "14px 16px", fontSize: "13px", color: C.textMid }}>{formatCategory(p.category)}</td>
                    <td style={{ padding: "14px 16px", fontSize: "13px", color: C.textMid }}>{p.bank_name}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "4px 8px",
                        borderRadius: "6px",
                        background: p.commission_type === "percentage" ? `${C.green}15` : `${C.primary}15`,
                        color: p.commission_type === "percentage" ? C.green : C.primary,
                        textTransform: "uppercase"
                      }}>
                        {p.commission_type || "fixed"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: 800, color: C.text }}>
                      {p.commission_type === "percentage" ? `${p.commission_value}%` : `₹${p.commission_value}`}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: "6px",
                        background: p.is_active ? `${C.green}15` : `${C.red}15`,
                        color: p.is_active ? C.green : C.red
                      }}>
                        {p.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* OVERRIDE CREATION MODAL */}
      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
          <div style={{ ...S.card, width: "100%", maxWidth: "520px", maxHeight: "90vh", overflowY: "auto", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", borderBottom: `1px solid ${C.border}`, paddingBottom: "12px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 900, color: C.text, margin: 0 }}>Set Commission Override</h3>
              <button onClick={() => setModalOpen(false)} style={{ background: "none", border: "none", color: C.textLight, cursor: "pointer", padding: "4px" }}>
                <Icons.x size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateRule} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              
              {/* Product */}
              <div>
                <label style={S.label}>Select Product *</label>
                <select
                  required
                  style={S.input}
                  value={form.product_id}
                  onChange={e => setForm({ ...form, product_id: e.target.value })}
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Default: {p.commission_type === "percentage" ? `${p.commission_value}%` : `₹${p.commission_value}`})
                    </option>
                  ))}
                </select>
              </div>

              {/* Partner */}
              <div>
                <label style={S.label}>Select Target Partner (Leave as Global for all Partners)</label>
                <select
                  style={S.input}
                  value={form.Partner_id}
                  onChange={e => setForm({ ...form, Partner_id: e.target.value })}
                >
                  <option value="global">🌐 Apply globally (All Partners)</option>
                  {partners.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.last_name} ({p.Partner_code}) - {p.company_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Commission Config (Split Row) */}
              <div className="responsive-split-row">
                <div style={{ flex: 1 }}>
                  <label style={S.label}>Payout Type *</label>
                  <select
                    required
                    style={S.input}
                    value={form.commission_type}
                    onChange={e => setForm({ ...form, commission_type: e.target.value })}
                  >
                    <option value="fixed">Fixed Flat Payout (₹)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={S.label}>Value *</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 500 or 2.5"
                    style={S.input}
                    value={form.commission_value}
                    onChange={e => setForm({ ...form, commission_value: e.target.value })}
                  />
                </div>
              </div>

              {/* Effective Dates (Split Row) */}
              <div className="responsive-split-row">
                <div style={{ flex: 1 }}>
                  <label style={S.label}>Effective From *</label>
                  <input
                    required
                    type="date"
                    style={S.input}
                    value={form.effective_from}
                    onChange={e => setForm({ ...form, effective_from: e.target.value })}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={S.label}>Effective To (Optional)</label>
                  <input
                    type="date"
                    style={S.input}
                    value={form.effective_to}
                    onChange={e => setForm({ ...form, effective_to: e.target.value })}
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "12px", borderTop: `1px solid ${C.border}`, paddingTop: "16px" }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{ ...S.btn("outline"), padding: "10px 20px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ ...S.btn("primary"), padding: "10px 24px", opacity: submitting ? 0.7 : 1 }}
                >
                  {submitting ? "Applying..." : "Save Override"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}

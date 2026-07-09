import React, { useState, useEffect } from "react";
import api from "../../../services/api";
import { useTheme, makeS } from "../../../contexts/ThemeContext";
import { Icons } from "../../../components/Icon/PartnerIcons";

const HOME_PAGE_BANKS = [
  { name: "HDFC Bank", code: "HDFC" },
  { name: "SBI Card", code: "SBI" },
  { name: "Axis Bank", code: "AXIS" },
  { name: "ICICI Bank", code: "ICICI" },
  { name: "Kotak Bank", code: "KOTAK" },
  { name: "Yes Bank", code: "YES" },
  { name: "Bank of Baroda", code: "BOB" },
  { name: "DCB Bank", code: "DCB" },
  { name: "Federal Bank", code: "FEDERAL" },
  { name: "SBM Bank", code: "SBM" },
  { name: "IDFC FIRST", code: "IDFC" },
  { name: "RBL Bank", code: "RBL" },
  { name: "Equitas", code: "EQUITAS" }
];

export default function ManageBanks() {
  const { C } = useTheme();
  const S = makeS(C);

  // Listing State
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [selectedBankType, setSelectedBankType] = useState("");

  // Form Fields State
  const [form, setForm] = useState({
    name: "",
    short_code: "",
    logo_url: "",
    status: "Active",
    is_active: true
  });
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [logoFile, setLogoFile] = useState(null);

  const fetchBanks = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await api.get("/banks", {
        params: {
          search: search.trim() || undefined,
          limit: 100
        }
      });
      if (res.data?.success) {
        setBanks(res.data.data || []);
      }
    } catch (e) {
      console.error("[ManageBanks] Fetch Error:", e);
      setErrorMsg(e.response?.data?.message || "Failed to fetch bank partners list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  const openAddModal = () => {
    setEditItem(null);
    setLogoFile(null);
    setForm({
      name: "",
      short_code: "",
      logo_url: "",
      status: "Active",
      is_active: true
    });
    setSelectedBankType("");
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditItem(item);
    setLogoFile(null);
    setForm({
      name: item.name,
      short_code: item.short_code,
      logo_url: item.logo_url || "",
      status: item.status || "Active",
      is_active: item.is_active
    });
    const matched = HOME_PAGE_BANKS.find(b => b.name === item.name);
    setSelectedBankType(matched ? item.name : "custom");
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this bank partner?")) return;
    try {
      const res = await api.delete(`/banks/${id}`);
      if (res.data?.success) {
        alert("Bank partner deleted successfully");
        fetchBanks();
      }
    } catch (e) {
      alert(e.response?.data?.message || "Failed to delete bank partner");
    }
  };

  const toggleStatus = async (item) => {
    const newActive = !item.is_active;
    const newStatus = newActive ? "Active" : "Inactive";
    try {
      const res = await api.put(`/banks/${item.id}`, {
        is_active: newActive,
        status: newStatus
      });
      if (res.data?.success) {
        setBanks(banks.map((b) => (b.id === item.id ? { ...b, is_active: newActive, status: newStatus } : b)));
      }
    } catch (e) {
      alert(e.response?.data?.message || "Failed to toggle status");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let res;
      if (logoFile) {
        const formData = new FormData();
        formData.append("name", form.name.trim());
        formData.append("short_code", form.short_code.trim().toUpperCase());
        formData.append("logo", logoFile);
        formData.append("status", form.status);
        formData.append("is_active", (form.status === "Active").toString());

        if (editItem) {
          res = await api.put(`/banks/${editItem.id}`, formData, {
            headers: { "Content-Type": "multipart/form-data" }
          });
        } else {
          res = await api.post("/banks", formData, {
            headers: { "Content-Type": "multipart/form-data" }
          });
        }
      } else {
        const payload = {
          name: form.name.trim(),
          short_code: form.short_code.trim().toUpperCase(),
          logo_url: form.logo_url.trim() || null,
          status: form.status,
          is_active: form.status === "Active"
        };
        if (editItem) {
          res = await api.put(`/banks/${editItem.id}`, payload);
        } else {
          res = await api.post("/banks", payload);
        }
      }

      if (res.data?.success) {
        alert(editItem ? "Bank partner updated successfully!" : "Bank partner created successfully!");
        setModalOpen(false);
        fetchBanks();
      }
    } catch (e) {
      alert(e.response?.data?.message || "Failed to save bank partner configuration.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchBanks();
  };

  return (
    <div>
      {/* Title */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: 800, color: C.text, margin: 0 }}>Bank Partner Management</h2>
          <p style={{ fontSize: "13px", color: C.textLight, margin: "4px 0 0 0" }}>Manage financial lending partners, configure APIs, set status and display logos</p>
        </div>
        <button
          onClick={openAddModal}
          style={{
            ...S.btn("primary"),
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            fontSize: "13.5px"
          }}
        >
          <Icons.check size={16} /> Add Bank Partner
        </button>
      </div>

      {/* Filter panel */}
      <div style={{ ...S.card, padding: "16px", marginBottom: "24px" }}>
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "flex-end" }}>
          <div style={{ flex: 1, minWidth: "200px" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: C.textLight, display: "block", marginBottom: "4px" }}>Search Partners</label>
            <input
              style={S.input}
              placeholder="Search by name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="submit" style={{ ...S.btn("primary"), padding: "10px 20px" }}>
              Search
            </button>
            <button
              type="button"
              onClick={() => { setSearch(""); setTimeout(() => fetchBanks(), 0); }}
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

      {/* Listing Content */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "48px", color: C.textLight }}>
          <div className="animate-spin" style={{ width: "24px", height: "24px", border: `3px solid ${C.teal}`, borderTopColor: "transparent", borderRadius: "50%", margin: "0 auto 8px" }}></div>
          Loading bank partners catalog...
        </div>
      ) : banks.length === 0 ? (
        <div style={{ ...S.card, textAlign: "center", padding: "48px", color: C.textLight }}>
          No bank partners provisioned. Click the button to add a bank partner!
        </div>
      ) : (
        <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, color: C.textLight, fontSize: "12px", textTransform: "uppercase" }}>
                  <th style={{ padding: "14px 16px" }}>Bank Partner</th>
                  <th style={{ padding: "14px 16px" }}>Short Code</th>
                  <th style={{ padding: "14px 16px" }}>Logo / Asset URL</th>
                  <th style={{ padding: "14px 16px" }}>Status</th>
                  <th style={{ padding: "14px 16px", textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: "13.5px", color: C.text }}>
                {banks.map((item) => (
                  <tr key={item.id} style={{ borderBottom: `1px solid ${C.border}60` }} className="hover:bg-gray-50/10">
                    <td style={{ padding: "14px 16px", fontWeight: 800 }}>
                      {item.name}
                    </td>
                    <td style={{ padding: "14px 16px", fontMono: true, fontWeight: 600 }}>
                      {item.short_code}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: "12px", color: C.textLight }}>
                      {item.logo_url ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "18px" }}>🏦</span>
                          <code>{item.logo_url}</code>
                        </div>
                      ) : (
                        <span style={{ fontStyle: "italic" }}>No logo configured</span>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{
                        display: "inline-block", padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 800, textTransform: "uppercase",
                        background: item.status === "Active" ? `${C.green}15` : item.status === "Maintenance" ? `${C.gold}15` : `${C.red}15`,
                        color: item.status === "Active" ? C.green : item.status === "Maintenance" ? C.gold : C.red
                      }}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
                        <button
                          onClick={() => toggleStatus(item)}
                          style={{
                            background: item.is_active ? `${C.red}10` : `${C.green}10`,
                            border: "none",
                            color: item.is_active ? C.red : C.green,
                            borderRadius: "6px",
                            padding: "6px 12px",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                        >
                          {item.is_active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => openEditModal(item)}
                          style={{
                            background: "none",
                            border: `1px solid ${C.border}`,
                            color: C.text,
                            borderRadius: "6px",
                            padding: "6px 12px",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          style={{
                            background: `${C.red}15`,
                            border: "none",
                            color: C.red,
                            borderRadius: "6px",
                            padding: "6px 12px",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                        >
                          Delete
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

      {/* MODAL */}
      {modalOpen && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px"
        }}>
          <div style={{
            ...S.card, width: "100%", maxWidth: "450px", padding: "24px",
            boxShadow: "0 12px 36px rgba(0,0,0,0.15)", position: "relative"
          }}>
            <h3 style={{ fontSize: "18px", fontWeight: 800, color: C.text, margin: "0 0 16px 0" }}>
              {editItem ? "Edit Bank Partner" : "Add Bank Partner"}
            </h3>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={S.label}>Bank Partner Name *</label>
                <select
                  style={S.input}
                  required
                  value={selectedBankType}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedBankType(val);
                    if (val === "custom") {
                      setForm({ ...form, name: "", short_code: "" });
                    } else if (val === "") {
                      setForm({ ...form, name: "", short_code: "" });
                    } else {
                      const matched = HOME_PAGE_BANKS.find(b => b.name === val);
                      if (matched) {
                        setForm({ ...form, name: matched.name, short_code: matched.code });
                      }
                    }
                  }}
                >
                  <option value="">-- Select Bank Partner --</option>
                  {HOME_PAGE_BANKS.map((b) => (
                    <option key={b.name} value={b.name}>{b.name}</option>
                  ))}
                  <option value="custom">Other (Enter custom bank name)</option>
                </select>
              </div>

              {selectedBankType === "custom" && (
                <div>
                  <label style={S.label}>Custom Bank Name *</label>
                  <input
                    style={S.input}
                    required
                    placeholder="e.g. Canara Bank"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
              )}

              <div>
                <label style={S.label}>Short Code *</label>
                <input
                  style={S.input}
                  required
                  placeholder="e.g. HDFCBANK"
                  value={form.short_code}
                  disabled={!!editItem} // Don't modify code after creation to avoid breaking relations
                  onChange={(e) => setForm({ ...form, short_code: e.target.value })}
                />
              </div>

              <div>
                <label style={S.label}>Logo / Asset Image</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ ...S.input, padding: "8px 12px" }}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setLogoFile(file);
                        setForm({ ...form, logo_url: "" }); // Reset URL when file is chosen
                      }
                    }}
                  />
                  {logoFile && (
                    <div style={{ fontSize: "12px", color: C.green, fontWeight: 700 }}>
                      Selected File: {logoFile.name} ({(logoFile.size / 1024).toFixed(1)} KB)
                    </div>
                  )}
                  <div style={{ fontSize: "11px", fontWeight: 700, color: C.textLight, textAlign: "center", margin: "4px 0" }}>— OR —</div>
                  <input
                    style={S.input}
                    placeholder="Enter manual image URL (e.g. https://.../image.png)"
                    value={form.logo_url}
                    onChange={(e) => {
                      setForm({ ...form, logo_url: e.target.value });
                      setLogoFile(null); // Reset file if manual URL is entered
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={S.label}>Operational Status</label>
                <select
                  style={S.input}
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={S.btn("outline")}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={S.btn("primary")}
                >
                  {submitting ? "Saving..." : "Save Config"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import api from "../../../services/api";
import { useTheme, makeS } from "../../../contexts/ThemeContext";
import { MdAdd, MdSearch, MdEdit, MdDelete, MdCheckCircle, MdCancel } from "react-icons/md";

export default function ManageBanks() {
  const { C, isDark } = useTheme();
  const S = makeS(C);

  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [search, setSearch] = useState("");

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bankToDelete, setBankToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: "",
    short_code: "",
    logo_url: "",
    status: "Active",
    display_order: 0
  });

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
      setErrorMsg(e.response?.data?.message || "Failed to fetch banks list");
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
      display_order: banks.length + 1
    });
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
      display_order: item.display_order || 0
    });
    setModalOpen(true);
  };

  const confirmDelete = (bank) => {
    setBankToDelete(bank);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!bankToDelete?.id) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/banks/${bankToDelete.id}`);
      if (res.data?.success) {
        setDeleteModalOpen(false);
        setBankToDelete(null);
        fetchBanks();
      }
    } catch (e) {
      alert(e.response?.data?.message || "Failed to delete bank");
    } finally {
      setDeleting(false);
    }
  };

  const toggleStatus = async (item) => {
    const newStatus = item.status === "Active" ? "Inactive" : "Active";
    try {
      const res = await api.patch(`/banks/${item.id}/status`, { status: newStatus });
      if (res.data?.success) {
        setBanks(banks.map((b) => (b.id === item.id ? { ...b, status: newStatus, is_active: newStatus === "Active" } : b)));
      }
    } catch (e) {
      alert(e.response?.data?.message || "Failed to toggle bank status");
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
        formData.append("display_order", form.display_order.toString());

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
          is_active: form.status === "Active",
          display_order: parseInt(form.display_order) || 0
        };
        if (editItem) {
          res = await api.put(`/banks/${editItem.id}`, payload);
        } else {
          res = await api.post("/banks", payload);
        }
      }

      if (res.data?.success) {
        alert(editItem ? "Bank updated successfully!" : "Bank created successfully!");
        setModalOpen(false);
        fetchBanks();
      }
    } catch (e) {
      alert(e.response?.data?.message || "Failed to save bank configuration.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* HEADER WITH + NEW BANK BUTTON */}
      <div style={{
        background: C.card,
        borderRadius: '20px',
        padding: '20px 24px',
        border: `1px solid ${C.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 900, color: C.text, margin: 0 }}>Bank Management</h2>
          <p style={{ fontSize: '13px', color: C.textLight || '#64748B', margin: '4px 0 0' }}>
            Manage financial lending partners, configure logos, and control status visibility
          </p>
        </div>

        <button
          onClick={openAddModal}
          style={{
            padding: '10px 20px',
            borderRadius: '12px',
            border: 'none',
            background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: '13.5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)'
          }}
        >
          <MdAdd size={20} />
          <span>New Bank</span>
        </button>
      </div>

      {/* SEARCH BAR */}
      <div style={{ background: C.card, borderRadius: '16px', padding: '16px', border: `1px solid ${C.border}` }}>
        <form onSubmit={(e) => { e.preventDefault(); fetchBanks(); }} style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <MdSearch size={20} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: C.textLight }} />
            <input
              type="text"
              placeholder="Search Bank..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...S.input, paddingLeft: '40px', height: '44px' }}
            />
          </div>
          <button type="submit" style={{ padding: '0 20px', borderRadius: '10px', border: 'none', background: C.teal, color: '#FFF', fontWeight: 800, cursor: 'pointer' }}>
            Search
          </button>
        </form>
      </div>

      {/* BANKS TABLE */}
      <div style={{ background: C.card, borderRadius: '20px', border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
          <thead>
            <tr style={{ background: isDark ? C.bgSecondary : '#F8FAFC', borderBottom: `1px solid ${C.border}` }}>
              <th style={{ padding: '14px 16px', fontWeight: 800 }}>Logo</th>
              <th style={{ padding: '14px 16px', fontWeight: 800 }}>Bank Name</th>
              <th style={{ padding: '14px 16px', fontWeight: 800 }}>Short Code</th>
              <th style={{ padding: '14px 16px', fontWeight: 800 }}>Status</th>
              <th style={{ padding: '14px 16px', fontWeight: 800 }}>Products</th>
              <th style={{ padding: '14px 16px', fontWeight: 800 }}>Created On</th>
              <th style={{ padding: '14px 16px', fontWeight: 800, textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: C.textLight }}>Loading banks catalog...</td></tr>
            ) : banks.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: C.textLight }}>No banks found. Click <strong>New Bank</strong> to add one!</td></tr>
            ) : (
              banks.map(bank => (
                <tr key={bank.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: '14px 16px' }}>
                    {bank.logo_url ? (
                      <img src={bank.logo_url} alt={bank.name} style={{ height: '28px', maxWidth: '80px', objectFit: 'contain' }} />
                    ) : (
                      <span style={{ fontSize: '20px' }}>🏦</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 800, color: C.text }}>{bank.name}</td>
                  <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontWeight: 700, color: C.teal }}>{bank.short_code}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <button
                      onClick={() => toggleStatus(bank)}
                      style={{
                        padding: '4px 12px', borderRadius: '10px', fontSize: '11.5px', fontWeight: 800, border: 'none', cursor: 'pointer',
                        background: bank.status === 'Active' ? '#10B98120' : '#EF444420',
                        color: bank.status === 'Active' ? '#10B981' : '#EF4444'
                      }}
                    >
                      {bank.status || (bank.is_active ? 'Active' : 'Inactive')}
                    </button>
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 700 }}>{bank.products_count || 0}</td>
                  <td style={{ padding: '14px 16px', color: C.textLight, fontSize: '12.5px' }}>
                    {bank.created_at ? new Date(bank.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                      <button
                        onClick={() => openEditModal(bank)}
                        style={{ padding: '6px 12px', background: `${C.teal}15`, color: C.teal, border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <MdEdit size={16} /> Edit
                      </button>
                      <button
                        onClick={() => confirmDelete(bank)}
                        style={{ padding: '6px 12px', background: '#EF444415', color: '#EF4444', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <MdDelete size={16} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── ADD / EDIT BANK MODAL ── */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: C.card, borderRadius: '24px', padding: '28px', maxWidth: '500px', width: '100%', border: `1px solid ${C.border}`, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: C.text, margin: '0 0 16px 0' }}>
              {editItem ? 'Edit Bank Partner' : 'New Bank'}
            </h3>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={S.label}>Bank Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC Bank"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={{ ...S.input, height: '42px' }}
                />
              </div>

              <div>
                <label style={S.label}>Short Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC"
                  value={form.short_code}
                  onChange={(e) => setForm({ ...form, short_code: e.target.value.toUpperCase() })}
                  style={{ ...S.input, height: '42px' }}
                />
              </div>

              <div>
                <label style={S.label}>Status *</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  style={{ ...S.input, height: '42px', fontWeight: 700 }}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label style={S.label}>Bank Logo Image (Upload or URL)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files[0])}
                  style={{ ...S.input, padding: '8px' }}
                />
                <input
                  type="text"
                  placeholder="Or paste image URL (e.g. https://.../logo.png)"
                  value={form.logo_url}
                  onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                  style={{ ...S.input, height: '40px', marginTop: '6px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{ padding: '10px 18px', borderRadius: '10px', border: `1px solid ${C.border}`, background: 'transparent', color: C.text, fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: '10px 22px', borderRadius: '10px', border: 'none', background: C.teal, color: '#FFF', fontWeight: 800, cursor: 'pointer' }}
                >
                  {submitting ? 'Saving...' : 'Save Bank'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION MODAL ── */}
      {deleteModalOpen && bankToDelete && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: C.card, borderRadius: '24px', padding: '28px', maxWidth: '420px', width: '100%', border: `1px solid ${C.border}`, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#EF444415', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '24px' }}>
              ⚠️
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: C.text, margin: '0 0 8px 0' }}>
              Delete {bankToDelete.name}?
            </h3>
            <p style={{ fontSize: '13px', color: C.textLight || '#64748B', lineHeight: 1.5, margin: '0 0 20px 0' }}>
              This will permanently delete the bank. This will also affect linked products.
            </p>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => { setDeleteModalOpen(false); setBankToDelete(null); }}
                style={{ flex: 1, padding: '10px 16px', borderRadius: '12px', border: `1px solid ${C.border}`, background: 'transparent', color: C.text, fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{ flex: 1, padding: '10px 16px', borderRadius: '12px', border: 'none', background: '#EF4444', color: '#FFFFFF', fontWeight: 800, cursor: 'pointer' }}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

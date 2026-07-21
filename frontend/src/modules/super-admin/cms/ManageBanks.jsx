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
  const [bannerFile, setBannerFile] = useState(null);
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
    display_order: 0,
    hero_title: "",
    hero_description: "",
    banner: "",
    theme_color: "#004B87",
    secondary_color: "#00296B",
    gradient: "",
    button_color: "#004B87",
    accent_color: "#10B981",
    seo_title: "",
    seo_description: ""
  });

  const fetchBanks = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await api.get("/banks", {
        params: {
          search: search.trim() || undefined,
          status: 'all',
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
    setBannerFile(null);
    setForm({
      name: "",
      short_code: "",
      logo_url: "",
      status: "Active",
      display_order: banks.length + 1,
      hero_title: "",
      hero_description: "",
      banner: "",
      theme_color: "#004B87",
      secondary_color: "#00296B",
      gradient: "",
      button_color: "#004B87",
      accent_color: "#10B981",
      seo_title: "",
      seo_description: ""
    });
    setModalOpen(true);
  };

  const openEditModal = async (item) => {
    setEditItem(item);
    setLogoFile(null);
    setBannerFile(null);
    setForm({
      name: item.name || "",
      short_code: item.short_code || "",
      logo_url: item.logo_url || item.logo || "",
      status: item.status || (item.is_active ? "Active" : "Inactive"),
      display_order: item.display_order !== undefined ? item.display_order : 0,
      hero_title: item.hero_title || "",
      hero_description: item.hero_description || "",
      banner: item.banner || item.banner_url || "",
      theme_color: item.theme_color || "#004B87",
      secondary_color: item.secondary_color || "#00296B",
      gradient: item.gradient || "",
      button_color: item.button_color || item.theme_color || "#004B87",
      accent_color: item.accent_color || "#10B981",
      seo_title: item.seo_title || "",
      seo_description: item.seo_description || ""
    });
    setActiveTab("basic");
    setModalOpen(true);

    try {
      const res = await api.get(`/banks/${item.id}`);
      if (res.data?.success && res.data.data) {
        const b = res.data.data;
        setForm({
          name: b.name || "",
          short_code: b.short_code || "",
          logo_url: b.logo_url || b.logo || "",
          status: b.status || (b.is_active ? "Active" : "Inactive"),
          display_order: b.display_order !== undefined ? b.display_order : 0,
          hero_title: b.hero_title || "",
          hero_description: b.hero_description || "",
          banner: b.banner || b.banner_url || "",
          theme_color: b.theme_color || "#004B87",
          secondary_color: b.secondary_color || "#00296B",
          gradient: b.gradient || "",
          button_color: b.button_color || b.theme_color || "#004B87",
          accent_color: b.accent_color || "#10B981",
          seo_title: b.seo_title || "",
          seo_description: b.seo_description || ""
        });
      }
    } catch (e) {
      console.warn("Could not fetch extra bank details:", e);
    }
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

  const [activeTab, setActiveTab] = useState("basic");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let res;
      if (logoFile || bannerFile) {
        const formData = new FormData();
        formData.append("name", form.name.trim());
        formData.append("short_code", form.short_code.trim().toUpperCase());
        if (logoFile) formData.append("logo", logoFile);
        if (bannerFile) formData.append("banner", bannerFile);
        formData.append("logo_url", form.logo_url.trim());
        formData.append("banner_url", form.banner.trim());
        formData.append("status", form.status);
        formData.append("is_active", (form.status === "Active").toString());
        formData.append("display_order", form.display_order.toString());
        formData.append("hero_title", form.hero_title.trim());
        formData.append("hero_description", form.hero_description.trim());
        formData.append("theme_color", form.theme_color.trim());
        formData.append("secondary_color", form.secondary_color.trim());
        formData.append("gradient", form.gradient.trim());
        formData.append("button_color", form.button_color.trim());
        formData.append("accent_color", form.accent_color.trim());
        formData.append("seo_title", form.seo_title.trim());
        formData.append("seo_description", form.seo_description.trim());

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
          display_order: parseInt(form.display_order) || 0,
          hero_title: form.hero_title.trim() || null,
          hero_description: form.hero_description.trim() || null,
          banner: form.banner.trim() || null,
          banner_url: form.banner.trim() || null,
          theme_color: form.theme_color.trim() || "#004B87",
          secondary_color: form.secondary_color.trim() || "#00296B",
          gradient: form.gradient.trim() || null,
          button_color: form.button_color.trim() || "#004B87",
          accent_color: form.accent_color.trim() || "#10B981",
          seo_title: form.seo_title.trim() || null,
          seo_description: form.seo_description.trim() || null
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
      <div style={{ background: C.card, borderRadius: '20px', border: `1px solid ${C.border}`, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ width: '100%', minWidth: '780px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
           <thead>
             <tr style={{ background: isDark ? C.bgSecondary : '#F8FAFC', borderBottom: `1px solid ${C.border}` }}>
               <th style={{ padding: '14px 16px', fontWeight: 800 }}>Logo</th>
               <th style={{ padding: '14px 16px', fontWeight: 800 }}>Bank Name</th>
               <th style={{ padding: '14px 16px', fontWeight: 800 }}>Short Code</th>
               <th style={{ padding: '14px 16px', fontWeight: 800 }}>Priority</th>
               <th style={{ padding: '14px 16px', fontWeight: 800 }}>Status</th>
               <th style={{ padding: '14px 16px', fontWeight: 800 }}>Products</th>
               <th style={{ padding: '14px 16px', fontWeight: 800 }}>Created On</th>
               <th style={{ padding: '14px 16px', fontWeight: 800, textAlign: 'center' }}>Action</th>
             </tr>
           </thead>
           <tbody>
             {loading ? (
               <tr><td colSpan={8} style={{ padding: '30px', textAlign: 'center', color: C.textLight }}>Loading banks catalog...</td></tr>
             ) : banks.length === 0 ? (
               <tr><td colSpan={8} style={{ padding: '30px', textAlign: 'center', color: C.textLight }}>No banks found. Click <strong>New Bank</strong> to add one!</td></tr>
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
                   <td style={{ padding: '14px 16px', fontWeight: 700, color: C.textLight }}>{bank.display_order}</td>
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
          <div style={{ background: C.card, borderRadius: '24px', padding: '28px', maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto', border: `1px solid ${C.border}`, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: C.text, margin: '0 0 16px 0' }}>
              {editItem ? 'Edit Bank Partner & Theme' : 'New Bank Partner'}
            </h3>

            {/* Modal Tabs */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: `1px solid ${C.border}`, marginBottom: '20px', paddingBottom: '10px', overflowX: 'auto' }}>
              {[
                { id: 'basic', label: 'Basic Info' },
                { id: 'hero', label: 'Hero Header' },
                { id: 'theme', label: 'Theme & Colors' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: activeTab === tab.id ? C.teal : 'transparent',
                    color: activeTab === tab.id ? '#FFF' : C.textLight,
                    fontWeight: 700,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* TAB 1: BASIC INFO */}
              {activeTab === 'basic' && (
                <>
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

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
                      <label style={S.label}>Display Order *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        placeholder="e.g. 1"
                        value={form.display_order}
                        onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                        style={{ ...S.input, height: '42px' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={S.label}>Bank Logo (Upload or URL)</label>
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
                    {(logoFile || form.logo_url) && (
                      <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                          src={logoFile ? URL.createObjectURL(logoFile) : form.logo_url}
                          alt="Logo Preview"
                          style={{ maxHeight: '40px', maxWidth: '120px', objectFit: 'contain', padding: '4px', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                          {logoFile ? `File: ${logoFile.name}` : 'Current Logo Preview'}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* TAB 2: HERO HEADER */}
              {activeTab === 'hero' && (
                <>
                  <div>
                    <label style={S.label}>Hero Title</label>
                    <input
                      type="text"
                      placeholder="e.g. HDFC Bank Credit Cards"
                      value={form.hero_title}
                      onChange={(e) => setForm({ ...form, hero_title: e.target.value })}
                      style={{ ...S.input, height: '42px' }}
                    />
                  </div>

                  <div>
                    <label style={S.label}>Hero Description</label>
                    <textarea
                      rows={3}
                      placeholder="Compare rates, key features, and apply online..."
                      value={form.hero_description}
                      onChange={(e) => setForm({ ...form, hero_description: e.target.value })}
                      style={{ ...S.input, padding: '10px' }}
                    />
                  </div>

                  <div>
                    <label style={S.label}>Hero Banner Image (Upload File or URL)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setBannerFile(e.target.files[0])}
                      style={{ ...S.input, padding: '8px' }}
                    />
                    <input
                      type="text"
                      placeholder="Or paste image URL (e.g. https://.../banner.png)"
                      value={form.banner}
                      onChange={(e) => setForm({ ...form, banner: e.target.value })}
                      style={{ ...S.input, height: '40px', marginTop: '6px' }}
                    />
                    {(bannerFile || form.banner) && (
                      <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                          src={bannerFile ? URL.createObjectURL(bannerFile) : form.banner}
                          alt="Banner Preview"
                          style={{ maxHeight: '60px', maxWidth: '200px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                          {bannerFile ? `File: ${bannerFile.name}` : 'Current Banner Preview'}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* TAB 3: THEME & COLORS */}
              {activeTab === 'theme' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={S.label}>Primary Color</label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="color"
                          value={form.theme_color || '#004B87'}
                          onChange={(e) => setForm({ ...form, theme_color: e.target.value })}
                          style={{ width: '40px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                        />
                        <input
                          type="text"
                          value={form.theme_color}
                          onChange={(e) => setForm({ ...form, theme_color: e.target.value })}
                          style={{ ...S.input, height: '40px', flex: 1 }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={S.label}>Secondary Color</label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="color"
                          value={form.secondary_color || '#00296B'}
                          onChange={(e) => setForm({ ...form, secondary_color: e.target.value })}
                          style={{ width: '40px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                        />
                        <input
                          type="text"
                          value={form.secondary_color}
                          onChange={(e) => setForm({ ...form, secondary_color: e.target.value })}
                          style={{ ...S.input, height: '40px', flex: 1 }}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={S.label}>Button Color</label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="color"
                          value={form.button_color || '#004B87'}
                          onChange={(e) => setForm({ ...form, button_color: e.target.value })}
                          style={{ width: '40px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                        />
                        <input
                          type="text"
                          value={form.button_color}
                          onChange={(e) => setForm({ ...form, button_color: e.target.value })}
                          style={{ ...S.input, height: '40px', flex: 1 }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={S.label}>Accent Color</label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="color"
                          value={form.accent_color || '#10B981'}
                          onChange={(e) => setForm({ ...form, accent_color: e.target.value })}
                          style={{ width: '40px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                        />
                        <input
                          type="text"
                          value={form.accent_color}
                          onChange={(e) => setForm({ ...form, accent_color: e.target.value })}
                          style={{ ...S.input, height: '40px', flex: 1 }}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={S.label}>Custom Linear Gradient CSS</label>
                    <input
                      type="text"
                      placeholder="e.g. linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)"
                      value={form.gradient}
                      onChange={(e) => setForm({ ...form, gradient: e.target.value })}
                      style={{ ...S.input, height: '42px' }}
                    />
                  </div>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px', borderTop: `1px solid ${C.border}`, paddingTop: '16px' }}>
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
                  {submitting ? 'Saving...' : 'Save Configuration'}
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

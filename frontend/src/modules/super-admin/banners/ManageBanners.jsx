// ─────────────────────────────────────────────────────────────────────────────
// d:\Internship\yohesa\frontend\src\modules\super-admin\banners\ManageBanners.jsx
// Core Feature: Multi-Panel Promotional Banner Administration (Home, Partner, Employee)
// Roles: SuperAdmin (CRUD)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import api from "../../../services/api";
import { useTheme, makeS } from "../../../contexts/ThemeContext";
import { Icons } from "../../../components/Icon/PartnerIcons";

// Local fallback banner images map
import ltfBanner from "../../home/components/banner/lifetimefree card.png";
import loanBanner from "../../home/components/banner/loan.png";
import insuranceBanner from "../../home/components/banner/insurance.png";
import emiBanner from "../../home/components/banner/smart emi.png";
import emiNewBanner from "../../home/components/banner/emi.jpeg";
import hdfcBanner from "../../home/components/banner/hdfc pixel card.png";
import offerBanner from "../../home/components/banner/offerbanner.png";

const localBannerMap = {
  'lifetimefree card.png': ltfBanner,
  'loan.png': loanBanner,
  'insurance.png': insuranceBanner,
  'smart emi.png': emiBanner,
  'emi.jpeg': emiNewBanner,
  'hdfc pixel card.png': hdfcBanner,
  'offerbanner.png': offerBanner
};

export default function ManageBanners() {
  // ─── THEMING & STYLE TOKENS ────────────────────────────────────────────────
  const { C, isDark } = useTheme();
  const S = makeS(C);

  // ─── APPLICATION STATE ─────────────────────────────────────────────────────
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  // Form Fields State
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    btn_text: "",
    image_url: "",
    display_order: 0,
    is_active: true,
    target_panels: ['home', 'partner', 'referral', 'employee'], // Multi-choice: ['home', 'partner', 'referral', 'employee']
    
    // Panel specific redirect links & types
    link_type_home: "page",
    click_url_home: "/credit-cards",

    link_type_partner: "page",
    click_url_partner: "/partner/credit-cards",

    link_type_referral: "page",
    click_url_referral: "/partner/team-network",

    link_type_employee: "page",
    click_url_employee: "/employee/dashboard"
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Image Cropper Modal States
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropRawImg, setCropRawImg] = useState(null);
  const [cropRatio, setCropRatio] = useState('3:1');
  const [cropZoom, setCropZoom] = useState(1.0);
  const [cropOffsetX, setCropOffsetX] = useState(0);
  const [cropOffsetY, setCropOffsetY] = useState(0);
  const [croppedPreview, setCroppedPreview] = useState(null);

  // Helper to resolve image URL (Uploaded S3 / Backend static / Local asset / External)
  const resolveBannerImage = (url) => {
    if (!url) return offerBanner;
    if (localBannerMap[url]) return localBannerMap[url];
    
    const basename = url.split('/').pop().split('\\').pop();
    if (localBannerMap[basename]) return localBannerMap[basename];

    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (url.startsWith('/')) {
      const apiBase = api.defaults.baseURL || '';
      const origin = apiBase.replace(/\/api\/v1\/?$/, '');
      return `${origin}${url}`;
    }
    return url;
  };

  // ─── API SIDE EFFECTS & HANDLERS ──────────────────────────────────────────
  const fetchBanners = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await api.get("/banners/all");
      if (res.data?.success) {
        setBanners(res.data.data);
      }
    } catch (e) {
      console.error("[ManageBanners] Fetch Error:", e);
      setErrorMsg(e.response?.data?.message || "Failed to fetch banners catalog");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // Parse target_page string into panels array
  const parseTargetPanels = (targetPageStr) => {
    if (!targetPageStr || targetPageStr === 'all') {
      return ['home', 'partner', 'referral', 'employee'];
    }
    const panels = [];
    if (targetPageStr.includes('home') || targetPageStr.includes('offer')) panels.push('home');
    if (targetPageStr.includes('partner') || targetPageStr.includes('team')) panels.push('partner');
    if (targetPageStr.includes('referral') || targetPageStr.includes('refer')) panels.push('referral');
    if (targetPageStr.includes('employee')) panels.push('employee');
    return panels.length > 0 ? panels : ['home', 'partner', 'referral', 'employee'];
  };

  // ─── MODAL TRIGGER CONTROLS ───────────────────────────────────────────────
  const openAddModal = () => {
    setEditItem(null);
    const initialPanels = activeTab === "all" ? ['home', 'partner', 'referral', 'employee'] : [activeTab];
    setForm({
      title: "",
      subtitle: "",
      btn_text: "",
      image_url: "",
      display_order: banners.length + 1,
      is_active: true,
      target_panels: initialPanels,
      
      link_type_home: "page",
      click_url_home: "/credit-cards",
      
      link_type_partner: "page",
      click_url_partner: "/partner/credit-cards",

      link_type_referral: "page",
      click_url_referral: "/partner/team-network",

      link_type_employee: "page",
      click_url_employee: "/employee/dashboard"
    });
    setImageFile(null);
    setCroppedPreview(null);
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditItem(item);
    const panels = parseTargetPanels(item.target_page);

    setForm({
      title: item.title || "",
      subtitle: item.subtitle || "",
      btn_text: item.btn_text || "",
      image_url: item.image_url || "",
      display_order: item.display_order || 0,
      is_active: item.is_active !== undefined ? item.is_active : true,
      target_panels: panels,
      
      link_type_home: "page",
      click_url_home: item.click_url_home || item.click_url || "/credit-cards",

      link_type_partner: "page",
      click_url_partner: item.click_url_partner || item.click_url || "/partner/credit-cards",

      link_type_referral: "page",
      click_url_referral: item.click_url_referral || item.click_url || "/partner/team-network",

      link_type_employee: "page",
      click_url_employee: item.click_url_employee || item.click_url || "/employee/dashboard"
    });
    setImageFile(null);
    setCroppedPreview(null);
    setModalOpen(true);
  };

  // Toggle Panel Selection Checkbox
  const togglePanelSelection = (panelKey) => {
    setForm(prev => {
      const currentPanels = prev.target_panels;
      let updated;
      if (currentPanels.includes(panelKey)) {
        if (currentPanels.length === 1) {
          alert("At least one target panel must be selected.");
          return prev;
        }
        updated = currentPanels.filter(p => p !== panelKey);
      } else {
        updated = [...currentPanels, panelKey];
      }
      return { ...prev, target_panels: updated };
    });
  };

  // Delete Banner Slide
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this banner slide?")) return;
    try {
      const res = await api.delete(`/banners/${id}`);
      if (res.data?.success) {
        alert("Banner deleted successfully");
        fetchBanners();
      }
    } catch (e) {
      alert(e.response?.data?.message || "Failed to delete banner");
    }
  };

  // Create or Update Banner Slide
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.target_panels || form.target_panels.length === 0) {
      alert("Please select at least one Target Panel.");
      return;
    }
    setSubmitting(true);

    try {
      const targetPageValue = form.target_panels.length === 4 ? 'all' : form.target_panels.join(',');

      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("subtitle", form.subtitle);
      formData.append("btn_text", form.btn_text);
      formData.append("display_order", form.display_order.toString());
      formData.append("is_active", form.is_active.toString());
      formData.append("target_page", targetPageValue);

      // Main fallback click_url
      const primaryUrl = form.target_panels.includes('home')
        ? form.click_url_home
        : (form.target_panels.includes('partner') 
            ? form.click_url_partner 
            : (form.target_panels.includes('referral') ? form.click_url_referral : form.click_url_employee));
      
      formData.append("click_url", primaryUrl || "/credit-cards");
      formData.append("link_type", "custom");

      // Panel Specific URLs
      formData.append("click_url_home", form.target_panels.includes('home') ? form.click_url_home : '');
      formData.append("click_url_partner", form.target_panels.includes('partner') ? form.click_url_partner : '');
      formData.append("click_url_referral", form.target_panels.includes('referral') ? form.click_url_referral : '');
      formData.append("click_url_employee", form.target_panels.includes('employee') ? form.click_url_employee : '');

      if (imageFile) {
        formData.append("image", imageFile);
      } else if (form.image_url) {
        formData.append("image_url", form.image_url);
      } else if (!editItem) {
        alert("Please upload an image file or provide an image asset URL.");
        setSubmitting(false);
        return;
      }

      let res;
      if (editItem) {
        res = await api.put(`/banners/${editItem.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        res = await api.post("/banners", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      if (res.data?.success) {
        alert(editItem ? "Banner updated successfully!" : "Banner created successfully!");
        setModalOpen(false);
        fetchBanners();
      }
    } catch (e) {
      alert(e.response?.data?.message || "Failed to save banner slide.");
    } finally {
      setSubmitting(false);
    }
  };

  // Tab Filtering & Counts
  const isBannerInPanel = (item, panelKey) => {
    if (!item.target_page || item.target_page === 'all') return true;
    if (panelKey === 'home') return item.target_page.includes('home') || item.target_page.includes('offer');
    if (panelKey === 'partner') return item.target_page.includes('partner') || item.target_page.includes('team');
    if (panelKey === 'referral') return item.target_page.includes('referral') || item.target_page.includes('refer');
    if (panelKey === 'employee') return item.target_page.includes('employee');
    return true;
  };

  const getTabCount = (key) => {
    if (key === "all") return banners.length;
    return banners.filter(b => isBannerInPanel(b, key)).length;
  };

  const filteredBanners = banners.filter(item => {
    if (activeTab === "all") return true;
    return isBannerInPanel(item, activeTab);
  });

  return (
    <div>
      {/* ─── PAGE HEADER SECTION ─── */}
      <div className="responsive-header" style={{ marginBottom: "20px", width: "100%" }}>
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: 800, color: C.text, margin: 0 }}>Banner Management</h2>
          <p style={{ fontSize: "13px", color: C.textLight, margin: "4px 0 0 0" }}>Create and target promotional banners dynamically across Home, Partner, Team & Referral, and Employee panels</p>
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
          <Icons.check size={16} /> Add Banner Slide
        </button>
      </div>

      {/* Placement Filter Tabs */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
        {[
          { key: "all", label: "All Panels" },
          { key: "home", label: "Home Panel" },
          { key: "partner", label: "Partner Panel" },
          { key: "referral", label: "Team & Referral" },
          { key: "employee", label: "Employee Panel" }
        ].map(tab => {
          const count = getTabCount(tab.key);
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                border: `1px solid ${activeTab === tab.key ? C.teal : C.border}`,
                background: activeTab === tab.key ? `${C.teal}15` : C.card,
                color: activeTab === tab.key ? C.teal : C.text,
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <span>{tab.label}</span>
              <span style={{
                fontSize: "11px",
                fontWeight: 800,
                padding: "2px 6px",
                borderRadius: "10px",
                background: activeTab === tab.key ? C.teal : `${C.border}`,
                color: activeTab === tab.key ? "#fff" : C.textLight
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div style={{ padding: "16px", background: `${C.red}10`, border: `1px solid ${C.red}30`, borderRadius: "12px", color: C.red, marginBottom: "16px" }}>
          {errorMsg}
        </div>
      )}

      {/* ─── CARDS GRID VIEW ─── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "48px", color: C.textLight }}>
          <div className="animate-spin" style={{ width: "24px", height: "24px", border: `3px solid ${C.teal}`, borderTopColor: "transparent", borderRadius: "50%", margin: "0 auto 8px" }}></div>
          Loading banners catalog...
        </div>
      ) : filteredBanners.length === 0 ? (
        <div style={{ ...S.card, textAlign: "center", padding: "48px", color: C.textLight }}>
          No banners found for this panel filter. Click 'Add Banner Slide' to create one!
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
          {filteredBanners.map((item) => {
            const panels = parseTargetPanels(item.target_page);
            const bannerImgSrc = resolveBannerImage(item.image_url);

            return (
              <div
                key={item.id}
                style={{
                  ...S.card,
                  padding: 0,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  border: `1px solid ${C.border}`,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
                  transition: "transform 0.2s"
                }}
              >
                {/* Real Assigned Banner Image Preview */}
                <div style={{ height: "160px", background: "#0F172A", position: "relative", overflow: "hidden" }}>
                  <img
                    src={bannerImgSrc}
                    alt={item.title || 'Banner Slide'}
                    onError={(e) => { e.currentTarget.src = offerBanner; }}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />

                  {/* Gradient Overlay for Text Visibility */}
                  <div style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to top, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.2) 60%, transparent 100%)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    padding: "14px",
                    zIndex: 2
                  }}>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "4px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "10px", fontWeight: 800, color: "#FFFFFF", background: C.teal, padding: "2px 6px", borderRadius: "4px" }}>
                        Order: {item.display_order}
                      </span>

                      {/* Active Panel Pills */}
                      {panels.map(pKey => (
                        <span
                          key={pKey}
                          style={{
                            fontSize: "10px",
                            fontWeight: 800,
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: pKey === 'home' ? '#2563EB' : pKey === 'partner' ? '#7C3AED' : '#DB2777',
                            color: '#FFFFFF'
                          }}
                        >
                          {pKey === 'home' ? 'Home' : pKey === 'partner' ? 'Partner' : 'Employee'}
                        </span>
                      ))}
                    </div>

                    <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#FFFFFF", margin: 0 }}>{item.title}</h3>
                    {item.subtitle && (
                      <p style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.85)", margin: "2px 0 0 0", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" }}>
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                  
                  {/* Status Badge */}
                  <span style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    zIndex: 3,
                    fontSize: "10px",
                    fontWeight: 800,
                    padding: "4px 8px",
                    borderRadius: "6px",
                    background: item.is_active ? '#10B981' : '#64748B',
                    color: '#FFFFFF'
                  }}>
                    {item.is_active ? "Active" : "Disabled"}
                  </span>
                </div>

                {/* Banner Details & Target Panel URLs */}
                <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", background: C.card }}>
                  <div style={{ fontSize: "12px", color: C.textLight, display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <strong style={{ color: C.text }}>Image Asset:</strong> <code style={{ fontSize: "11px" }}>{item.image_url || 'Uploaded File'}</code>
                    </div>

                    {/* Show target URLs for enabled panels */}
                    {panels.includes('home') && (
                      <div><strong style={{ color: '#2563EB' }}>Home URL:</strong> <code>{item.click_url_home || item.click_url || '/credit-cards'}</code></div>
                    )}
                    {panels.includes('partner') && (
                      <div><strong style={{ color: '#7C3AED' }}>Partner URL:</strong> <code>{item.click_url_partner || item.click_url || '/partner/credit-cards'}</code></div>
                    )}
                    {panels.includes('employee') && (
                      <div><strong style={{ color: '#DB2777' }}>Employee URL:</strong> <code>{item.click_url_employee || item.click_url || '/employee/dashboard'}</code></div>
                    )}
                  </div>

                  {/* CRUD Actions */}
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: `1px solid ${C.border}`, paddingTop: "12px" }}>
                    <button
                      onClick={() => openEditModal(item)}
                      style={{
                        background: "none",
                        border: `1px solid ${C.border}`,
                        color: C.text,
                        borderRadius: "6px",
                        padding: "6px 12px",
                        fontSize: "12.5px",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                    >
                      <Icons.profile size={13} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      style={{
                        background: `${C.red}10`,
                        border: "none",
                        color: C.red,
                        borderRadius: "6px",
                        padding: "6px 12px",
                        fontSize: "12.5px",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                    >
                      <Icons.trash size={14} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── BANNER FORM MODAL ─── */}
      {modalOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(2px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "16px"
        }}>
          <div style={{
            ...S.card,
            width: "100%",
            maxWidth: "560px",
            maxHeight: "92vh",
            overflowY: "auto",
            padding: "24px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            position: "relative"
          }}>
            <h3 style={{ fontSize: "18px", fontWeight: 800, color: C.text, margin: "0 0 16px 0" }}>
              {editItem ? "Edit Banner Slide" : "Add New Banner Slide"}
            </h3>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

              {/* 1. TARGET PANEL SELECTION (Multiple Choice Checkboxes) */}
              <div style={{ background: C.bgSecondary, padding: "14px", borderRadius: "12px", border: `1px solid ${C.border}` }}>
                <label style={{ ...S.label, marginBottom: "8px", display: "block" }}>
                  Target Panel (Select which panels display this banner) *
                </label>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  {[
                    { key: "home", label: "Home Panel", color: "#2563EB" },
                    { key: "partner", label: "Partner Dashboard", color: "#7C3AED" },
                    { key: "referral", label: "Team & Referral Banners", color: "#059669" },
                    { key: "employee", label: "Employee Panel", color: "#DB2777" }
                  ].map(p => {
                    const isChecked = form.target_panels.includes(p.key);
                    return (
                      <label
                        key={p.key}
                        onClick={() => togglePanelSelection(p.key)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "8px 14px",
                          borderRadius: "10px",
                          border: `1.5px solid ${isChecked ? p.color : C.border}`,
                          background: isChecked ? `${p.color}15` : C.card,
                          color: isChecked ? p.color : C.text,
                          fontWeight: 700,
                          fontSize: "13px",
                          cursor: "pointer",
                          transition: "all 0.15s ease"
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Controlled by label click
                          style={{ accentColor: p.color, width: "16px", height: "16px" }}
                        />
                        {p.label}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 2. BANNER METADATA */}
              <div>
                <label style={S.label}>Banner Title *</label>
                <input
                  style={S.input}
                  required
                  placeholder="e.g. Lifetime Free Credit Cards"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div>
                <label style={S.label}>Subtitle / Promo Text</label>
                <input
                  style={S.input}
                  placeholder="e.g. Zero Joining Fee • Zero Annual Fee"
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={S.label}>Button Text</label>
                  <input
                    style={S.input}
                    placeholder="e.g. Explore Now"
                    value={form.btn_text}
                    onChange={(e) => setForm({ ...form, btn_text: e.target.value })}
                  />
                </div>
                <div>
                  <label style={S.label}>Display Order *</label>
                  <input
                    type="number"
                    style={S.input}
                    required
                    value={form.display_order}
                    onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* 3. IMAGE CONFIGURATION */}
              <div>
                <label style={S.label}>Banner Image Assignment</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: C.bgSecondary, padding: "14px", borderRadius: "12px", border: `1px solid ${C.border}` }}>
                  <div>
                    <label style={{ fontSize: "11.5px", fontWeight: 800, color: C.textLight, display: "block", marginBottom: "6px" }}>
                      Option A: Upload & Crop Image File
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            setCropRawImg(reader.result);
                            setCropModalOpen(true);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      style={{ fontSize: "12.5px", color: C.text }}
                    />
                  </div>

                  {/* Cropped Preview Indicator */}
                  {croppedPreview && (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", background: C.card, padding: "8px 12px", borderRadius: "8px", border: `1px dashed ${C.teal}` }}>
                      <img src={croppedPreview} alt="Cropped preview" style={{ width: "80px", height: "40px", objectFit: "cover", borderRadius: "4px" }} />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: "11px", fontWeight: 800, color: C.teal, display: "block" }}>Cropped Image Attached</span>
                        <span style={{ fontSize: "10px", color: C.textLight }}>Ratio: {cropRatio}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCropModalOpen(true)}
                        style={{ background: C.teal, color: "#fff", border: "none", borderRadius: "6px", padding: "4px 10px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
                      >
                        Recrop
                      </button>
                    </div>
                  )}

                  <div style={{ textAlign: "center", fontSize: "11px", color: C.textLight, fontWeight: 800 }}>- OR -</div>

                  <div>
                    <label style={{ fontSize: "11.5px", fontWeight: 800, color: C.textLight, display: "block", marginBottom: "4px" }}>
                      Option B: Asset Filename or External URL
                    </label>
                    <input
                      style={{ ...S.input, padding: "8px 12px", fontSize: "12.5px" }}
                      placeholder="e.g. lifetimefree card.png, loan.png, or https://domain.com/banner.jpg"
                      value={form.image_url}
                      disabled={!!imageFile}
                      onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    />
                  </div>

                  {/* Live preview of image asset URL */}
                  {form.image_url && !imageFile && (
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", background: C.card, padding: "8px 12px", borderRadius: "8px" }}>
                      <img src={resolveBannerImage(form.image_url)} alt="Preview" style={{ width: "70px", height: "35px", objectFit: "cover", borderRadius: "4px" }} />
                      <span style={{ fontSize: "11px", color: C.textLight, overflow: "hidden", textOverflow: "ellipsis" }}>{form.image_url}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 4. PER-PANEL REDIRECT URL & PAGE SELECTION */}
              <div style={{ display: "flex", flexDirection: "column", gap: "14px", background: C.bgSecondary, padding: "14px", borderRadius: "12px", border: `1px solid ${C.border}` }}>
                <label style={{ ...S.label, margin: 0, fontWeight: 800, color: C.text }}>
                  Panel Redirect Actions & Links
                </label>
                <p style={{ margin: "0 0 4px 0", fontSize: "11.5px", color: C.textLight }}>
                  Specify which page or URL opens when clicked from each selected panel
                </p>

                {/* Home Panel URL Selector */}
                {form.target_panels.includes('home') && (
                  <div style={{ background: C.card, padding: "12px", borderRadius: "10px", border: "1px solid #2563EB30" }}>
                    <div style={{ fontSize: "12px", fontWeight: 800, color: "#2563EB", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                      🌐 Home Panel Redirect Action
                    </div>
                    <div style={{ display: "flex", gap: "10px", marginBottom: "8px" }}>
                      <label style={{ fontSize: "12px", color: C.text, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <input
                          type="radio"
                          name="link_type_home"
                          checked={form.link_type_home === "page"}
                          onChange={() => setForm({ ...form, link_type_home: "page", click_url_home: "/credit-cards" })}
                        /> Predefined Page
                      </label>
                      <label style={{ fontSize: "12px", color: C.text, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <input
                          type="radio"
                          name="link_type_home"
                          checked={form.link_type_home === "custom"}
                          onChange={() => setForm({ ...form, link_type_home: "custom", click_url_home: "" })}
                        /> Custom URL
                      </label>
                    </div>

                    {form.link_type_home === "page" ? (
                      <select
                        style={S.input}
                        value={form.click_url_home}
                        onChange={(e) => setForm({ ...form, click_url_home: e.target.value })}
                      >
                        <option value="/credit-cards">All Credit Cards</option>
                        <option value="/loans">All Loans</option>
                        <option value="/insurance">All Insurance Plans</option>
                        <option value="/attractive-cards-loans/lifetime-free-cards">Lifetime Free Credit Cards</option>
                        <option value="/attractive-cards-loans/smart-emi-card">Smart EMI Card</option>
                        <option value="/credit-cards/hdfc-bank">HDFC Credit Cards</option>
                        <option value="/credit-cards/sbi-bank">SBI Credit Cards</option>
                        <option value="/recharge">Mobile Recharge</option>
                        <option value="/fastag">FASTag Recharge</option>
                      </select>
                    ) : (
                      <input
                        style={S.input}
                        placeholder="e.g. /attractive-cards-loans/lifetime-free-cards"
                        value={form.click_url_home}
                        onChange={(e) => setForm({ ...form, click_url_home: e.target.value })}
                      />
                    )}
                  </div>
                )}

                {/* Partner Panel URL Selector */}
                {form.target_panels.includes('partner') && (
                  <div style={{ background: C.card, padding: "12px", borderRadius: "10px", border: "1px solid #7C3AED30" }}>
                    <div style={{ fontSize: "12px", fontWeight: 800, color: "#7C3AED", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                      🤝 Partner Dashboard Redirect Action
                    </div>
                    <div style={{ display: "flex", gap: "10px", marginBottom: "8px" }}>
                      <label style={{ fontSize: "12px", color: C.text, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <input
                          type="radio"
                          name="link_type_partner"
                          checked={form.link_type_partner === "page"}
                          onChange={() => setForm({ ...form, link_type_partner: "page", click_url_partner: "/partner/credit-cards" })}
                        /> Predefined Page
                      </label>
                      <label style={{ fontSize: "12px", color: C.text, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <input
                          type="radio"
                          name="link_type_partner"
                          checked={form.link_type_partner === "custom"}
                          onChange={() => setForm({ ...form, link_type_partner: "custom", click_url_partner: "" })}
                        /> Custom URL
                      </label>
                    </div>

                    {form.link_type_partner === "page" ? (
                      <select
                        style={S.input}
                        value={form.click_url_partner}
                        onChange={(e) => setForm({ ...form, click_url_partner: e.target.value })}
                      >
                        <option value="/partner/credit-cards">Partner Credit Cards</option>
                        <option value="/partner/products?category=personal_loan">Partner Personal Loans</option>
                        <option value="/partner/team-network">Partner Team Network</option>
                        <option value="/partner/wallet">Partner Wallet & Earnings</option>
                        <option value="/partner/applications">Partner Applications</option>
                      </select>
                    ) : (
                      <input
                        style={S.input}
                        placeholder="e.g. /partner/credit-cards"
                        value={form.click_url_partner}
                        onChange={(e) => setForm({ ...form, click_url_partner: e.target.value })}
                      />
                    )}
                  </div>
                )}

                {/* Team & Referral Network Banner URL Selector */}
                {form.target_panels.includes('referral') && (
                  <div style={{ background: C.card, padding: "12px", borderRadius: "10px", border: "1px solid #05966930" }}>
                    <div style={{ fontSize: "12px", fontWeight: 800, color: "#059669", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                      👥 Team & Referral Banner Redirect Action
                    </div>
                    <div style={{ display: "flex", gap: "10px", marginBottom: "8px" }}>
                      <label style={{ fontSize: "12px", color: C.text, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <input
                          type="radio"
                          name="link_type_referral"
                          checked={form.link_type_referral === "page"}
                          onChange={() => setForm({ ...form, link_type_referral: "page", click_url_referral: "/partner/team-network" })}
                        /> Predefined Page
                      </label>
                      <label style={{ fontSize: "12px", color: C.text, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <input
                          type="radio"
                          name="link_type_referral"
                          checked={form.link_type_referral === "custom"}
                          onChange={() => setForm({ ...form, link_type_referral: "custom", click_url_referral: "" })}
                        /> Custom URL
                      </label>
                    </div>

                    {form.link_type_referral === "page" ? (
                      <select
                        style={S.input}
                        value={form.click_url_referral}
                        onChange={(e) => setForm({ ...form, click_url_referral: e.target.value })}
                      >
                        <option value="/partner/team-network">Partner Team & Referral Network</option>
                        <option value="/partner/wallet">Partner Wallet & Payouts</option>
                        <option value="/partner/credit-cards">Partner Credit Cards</option>
                        <option value="/partner/referral">Referral Program Details</option>
                      </select>
                    ) : (
                      <input
                        style={S.input}
                        placeholder="e.g. /partner/team-network"
                        value={form.click_url_referral}
                        onChange={(e) => setForm({ ...form, click_url_referral: e.target.value })}
                      />
                    )}
                  </div>
                )}

                {/* Employee Panel URL Selector */}
                {form.target_panels.includes('employee') && (
                  <div style={{ background: C.card, padding: "12px", borderRadius: "10px", border: "1px solid #DB277730" }}>
                    <div style={{ fontSize: "12px", fontWeight: 800, color: "#DB2777", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                      👔 Employee Panel Redirect Action
                    </div>
                    <div style={{ display: "flex", gap: "10px", marginBottom: "8px" }}>
                      <label style={{ fontSize: "12px", color: C.text, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <input
                          type="radio"
                          name="link_type_employee"
                          checked={form.link_type_employee === "page"}
                          onChange={() => setForm({ ...form, link_type_employee: "page", click_url_employee: "/employee/dashboard" })}
                        /> Predefined Page
                      </label>
                      <label style={{ fontSize: "12px", color: C.text, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <input
                          type="radio"
                          name="link_type_employee"
                          checked={form.link_type_employee === "custom"}
                          onChange={() => setForm({ ...form, link_type_employee: "custom", click_url_employee: "" })}
                        /> Custom URL
                      </label>
                    </div>

                    {form.link_type_employee === "page" ? (
                      <select
                        style={S.input}
                        value={form.click_url_employee}
                        onChange={(e) => setForm({ ...form, click_url_employee: e.target.value })}
                      >
                        <option value="/employee/dashboard">Employee Dashboard</option>
                        <option value="/employee/applications">Employee Applications</option>
                        <option value="/employee/leads">Employee Leads Pool</option>
                        <option value="/employee/attendance">Attendance & Tasks</option>
                      </select>
                    ) : (
                      <input
                        style={S.input}
                        placeholder="e.g. /employee/dashboard"
                        value={form.click_url_employee}
                        onChange={(e) => setForm({ ...form, click_url_employee: e.target.value })}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* 5. VISIBILITY CHECKBOX */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="checkbox"
                  id="is_active_chk"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  style={{ cursor: "pointer", width: "16px", height: "16px" }}
                />
                <label htmlFor="is_active_chk" style={{ fontSize: "13px", fontWeight: 700, color: C.text, cursor: "pointer" }}>
                  Active and Visible in Slideshow
                </label>
              </div>

              {/* Modal Actions */}
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
                  {submitting ? "Saving..." : "Save Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── INTERACTIVE IMAGE CROPPER MODAL ─── */}
      {cropModalOpen && cropRawImg && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "16px"
        }}>
          <div style={{
            ...S.card,
            maxWidth: "600px",
            width: "100%",
            background: isDark ? "#18181B" : "#FFF",
            padding: "20px",
            borderRadius: "16px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
            display: "flex",
            flexDirection: "column",
            gap: "16px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: C.text }}>Crop & Adjust Banner Ratio</h3>
                <span style={{ fontSize: "12px", color: C.textLight }}>Select aspect ratio and position your image to fit banner frames perfectly</span>
              </div>
              <button onClick={() => setCropModalOpen(false)} style={{ background: "none", border: "none", fontSize: "18px", color: C.textLight, cursor: "pointer" }}>✕</button>
            </div>

            {/* Aspect Ratio Selector Pills */}
            <div>
              <label style={{ fontSize: "11px", fontWeight: 800, color: C.textLight, display: "block", marginBottom: "6px" }}>ASPECT RATIO PRESET</label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {[
                  { label: "3:1 Hero Banner", ratio: "3:1" },
                  { label: "16:9 Wide Banner", ratio: "16:9" },
                  { label: "4:3 Card Banner", ratio: "4:3" },
                  { label: "1:1 Square", ratio: "1:1" }
                ].map(item => (
                  <button
                    key={item.ratio}
                    type="button"
                    onClick={() => setCropRatio(item.ratio)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: 800,
                      cursor: "pointer",
                      border: `1px solid ${cropRatio === item.ratio ? C.teal : C.border}`,
                      background: cropRatio === item.ratio ? `${C.teal}20` : C.card,
                      color: cropRatio === item.ratio ? C.teal : C.text
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Canvas Preview */}
            <div style={{
              width: "100%",
              height: "220px",
              background: "#000000",
              borderRadius: "12px",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              border: `2px dashed ${C.teal}`
            }}>
              <CanvasCropper
                imgSrc={cropRawImg}
                ratio={cropRatio}
                zoom={cropZoom}
                offsetX={cropOffsetX}
                offsetY={cropOffsetY}
                onCropDone={(blob, previewUrl) => {
                  const file = new File([blob], `banner_cropped_${Date.now()}.jpg`, { type: 'image/jpeg' });
                  setImageFile(file);
                  setCroppedPreview(previewUrl);
                  setForm(prev => ({ ...prev, image_url: "" }));
                  setCropModalOpen(false);
                }}
              />
            </div>

            {/* Zoom & Positioning Controls */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 800, color: C.textLight, display: "block", marginBottom: "4px" }}>ZOOM ({cropZoom.toFixed(1)}x)</label>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={cropZoom}
                  onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                  style={{ width: "100%", accentColor: C.teal }}
                />
              </div>

              <div>
                <label style={{ fontSize: "11px", fontWeight: 800, color: C.textLight, display: "block", marginBottom: "4px" }}>POSITION X</label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={cropOffsetX}
                  onChange={(e) => setCropOffsetX(parseInt(e.target.value))}
                  style={{ width: "100%", accentColor: C.teal }}
                />
              </div>

              <div>
                <label style={{ fontSize: "11px", fontWeight: 800, color: C.textLight, display: "block", marginBottom: "4px" }}>POSITION Y</label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={cropOffsetY}
                  onChange={(e) => setCropOffsetY(parseInt(e.target.value))}
                  style={{ width: "100%", accentColor: C.teal }}
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: `1px solid ${C.border}`, paddingTop: "12px" }}>
              <button
                type="button"
                onClick={() => {
                  setCropZoom(1.0);
                  setCropOffsetX(0);
                  setCropOffsetY(0);
                }}
                style={{ ...S.btn("outline"), padding: "6px 12px", fontSize: "12px" }}
              >
                Reset Position
              </button>
              <button
                type="button"
                onClick={() => {
                  const cropBtn = document.getElementById('apply_canvas_crop_btn');
                  if (cropBtn) cropBtn.click();
                }}
                style={{ ...S.btn("primary"), background: C.teal, padding: "8px 18px", fontSize: "12.5px" }}
              >
                Apply Crop & Attach
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ── CANVAS CROPPER HELPER COMPONENT ──
function CanvasCropper({ imgSrc, ratio, zoom, offsetX, offsetY, onCropDone }) {
  const canvasRef = React.useRef(null);

  React.useEffect(() => {
    if (!imgSrc || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      let targetW = 1200;
      let targetH = 400;
      if (ratio === '16:9') { targetW = 1200; targetH = 675; }
      else if (ratio === '4:3') { targetW = 800; targetH = 600; }
      else if (ratio === '1:1') { targetW = 600; targetH = 600; }

      canvas.width = targetW;
      canvas.height = targetH;

      ctx.clearRect(0, 0, targetW, targetH);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, targetW, targetH);

      const drawW = targetW * zoom;
      const drawH = (img.height / img.width) * drawW;

      const posX = (targetW - drawW) / 2 + (offsetX * (targetW / 200));
      const posY = (targetH - drawH) / 2 + (offsetY * (targetH / 200));

      ctx.drawImage(img, posX, posY, drawW, drawH);
    };

    img.src = imgSrc;
  }, [imgSrc, ratio, zoom, offsetX, offsetY]);

  const handleExport = () => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob((blob) => {
      if (blob) {
        const previewUrl = URL.createObjectURL(blob);
        onCropDone(blob, previewUrl);
      }
    }, 'image/jpeg', 0.92);
  };

  return (
    <>
      <canvas ref={canvasRef} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
      <button
        id="apply_canvas_crop_btn"
        onClick={handleExport}
        style={{ display: 'none' }}
      />
    </>
  );
}

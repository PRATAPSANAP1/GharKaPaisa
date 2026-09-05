// ─────────────────────────────────────────────────────────────────────────────
// d:\Internship\yohesa\frontend\src\modules\super-admin\banners\ManageBanners.jsx
// Core Feature: Homepage & Partner Dashboard Slideshow Banners Administration
// Roles: SuperAdmin (CRUD)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import api from "../../../services/api";
import { useTheme, makeS } from "../../../contexts/ThemeContext";
import { Icons } from "../../../components/Icon/PartnerIcons";

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
    link_type: "custom",
    click_url: "/credit-cards",
    target_page: "all" // 'all', 'home', 'partner'
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

  // ─── API SIDE EFFECTS & HANDLERS ──────────────────────────────────────────
  
  // Fetch all banners from database (including disabled slides)
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

  // ─── MODAL TRIGGER CONTROLS ───────────────────────────────────────────────
  
  const openAddModal = () => {
    setEditItem(null);
    const defaultPlacement = activeTab === "all" ? "offer" : activeTab;
    setForm({
      title: "",
      subtitle: "",
      btn_text: "",
      image_url: "",
      display_order: banners.length + 1,
      is_active: true,
      link_type: "custom",
      click_url: "/credit-cards",
      target_page: defaultPlacement
    });
    setImageFile(null);
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditItem(item);
    setForm({
      title: item.title,
      subtitle: item.subtitle || "",
      btn_text: item.btn_text || "",
      image_url: item.image_url,
      display_order: item.display_order || 0,
      is_active: item.is_active,
      link_type: item.link_type || "custom",
      click_url: item.click_url || "/credit-cards",
      target_page: item.target_page || "all"
    });
    setImageFile(null);
    setModalOpen(true);
  };

  // ─── ACTION MUTATIONS ──────────────────────────────────────────────────────

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
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("subtitle", form.subtitle);
      formData.append("btn_text", form.btn_text);
      formData.append("display_order", form.display_order.toString());
      formData.append("is_active", form.is_active.toString());
      formData.append("link_type", form.link_type);
      formData.append("click_url", form.click_url);
      formData.append("target_page", form.target_page);

      if (imageFile) {
        formData.append("image", imageFile);
      } else if (form.image_url) {
        formData.append("image_url", form.image_url);
      } else if (!editItem) {
        alert("Please upload an image file or provide an asset filename path.");
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

  // Calculate tab count indicators
  const getTabCount = (key) => {
    if (key === "all") return banners.length;
    if (key === "offer") return banners.filter(b => b.target_page === "offer" || b.target_page === "home").length;
    if (key === "team") return banners.filter(b => b.target_page === "team" || b.target_page === "partner").length;
    if (key === "referral") return banners.filter(b => b.target_page === "referral" || b.target_page === "refer").length;
    return 0;
  };

  // Filter Banners by Active Tab
  const filteredBanners = banners.filter(item => {
    if (activeTab === "all") return true;
    if (activeTab === "offer") return item.target_page === "offer" || item.target_page === "home" || item.target_page === "all" || !item.target_page;
    if (activeTab === "team") return item.target_page === "team" || item.target_page === "partner" || item.target_page === "all" || !item.target_page;
    if (activeTab === "referral") return item.target_page === "referral" || item.target_page === "refer" || item.target_page === "all" || !item.target_page;
    return item.target_page === activeTab || item.target_page === "all" || !item.target_page;
  });

  // ─── RENDER BLOCKS ─────────────────────────────────────────────────────────
  return (
    <div>
      {/* ─── PAGE HEADER SECTION ─── */}
      <div className="responsive-header" style={{ marginBottom: "20px", width: "100%" }}>
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: 800, color: C.text, margin: 0 }}>Banner Management</h2>
          <p style={{ fontSize: "13px", color: C.textLight, margin: "4px 0 0 0" }}>Create and manage promotional banner slides for the Homepage and Partner Dashboard dynamically</p>
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
          { key: "all", label: "All Banners" },
          { key: "offer", label: "Offer Banners (Home Page & Partner Top)" },
          { key: "team", label: "Team & Referral Banners (Partner Dashboard)" }
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

      {/* Error alert wrapper */}
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
          No banners found for this filter tab. Click 'Add Banner Slide' to create one!
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
          {filteredBanners.map((item) => (
            <div
              key={item.id}
              style={{
                ...S.card,
                padding: 0,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                border: `1px solid ${C.border}`,
                boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
                transition: "transform 0.2s"
              }}
            >
              {/* Banner visual render simulation */}
              <div style={{ height: "140px", background: C.bgSecondary, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{
                  position: "absolute",
                  inset: 0,
                  background: `linear-gradient(135deg, ${C.teal}33, ${C.green}22)`,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  padding: "16px",
                  zIndex: 2
                }}>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "4px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: C.teal, textTransform: "uppercase", letterSpacing: "1px" }}>
                      Order: {item.display_order}
                    </span>
                    <span style={{
                      fontSize: "10px",
                      fontWeight: 800,
                      padding: "2px 6px",
                      borderRadius: "4px",
                      background: (item.target_page === 'offer' || item.target_page === 'home') ? '#3B82F6' : (item.target_page === 'team' || item.target_page === 'partner') ? '#8B5CF6' : (item.target_page === 'referral' || item.target_page === 'refer') ? '#F59E0B' : '#10B981',
                      color: '#FFFFFF'
                    }}>
                      {(item.target_page === 'offer' || item.target_page === 'home') ? 'Offer Banner' : (item.target_page === 'team' || item.target_page === 'partner') ? 'Team Banner' : (item.target_page === 'referral' || item.target_page === 'refer') ? 'Referral Banner' : 'All Pages (Offer, Team & Referral)'}
                    </span>
                  </div>
                  <h3 style={{ fontSize: "16px", fontWeight: 800, color: C.text, margin: 0 }}>{item.title}</h3>
                  <p style={{ fontSize: "12px", color: C.textLight, margin: "4px 0 0 0", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {item.subtitle}
                  </p>
                  {item.btn_text && (
                    <span style={{ display: "inline-block", alignSelf: "flex-start", marginTop: "10px", background: C.teal, color: "#fff", fontSize: "10px", fontWeight: 800, padding: "3px 10px", borderRadius: "5px" }}>
                      {item.btn_text}
                    </span>
                  )}
                </div>
                
                {/* Active/Inactive Badge */}
                <span style={{
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  zIndex: 3,
                  fontSize: "10px",
                  fontWeight: 800,
                  padding: "4px 8px",
                  borderRadius: "6px",
                  background: item.is_active ? `${C.green}15` : `${C.textLight}15`,
                  color: item.is_active ? C.green : C.textLight
                }}>
                  {item.is_active ? "Active" : "Disabled"}
                </span>
              </div>

              {/* Banner Details & Parameters */}
              <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", background: C.card }}>
                <div style={{ fontSize: "12px", color: C.textLight, wordBreak: "break-all", marginBottom: "16px" }}>
                  <div><strong>Image Asset:</strong> <code>{item.image_url}</code></div>
                  <div><strong>Redirect URL:</strong> <code>{item.click_url}</code></div>
                </div>

                {/* CRUD Action Buttons */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: `1px solid ${C.border}50`, paddingTop: "12px" }}>
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
                      gap: "4px",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = C.teal}
                    onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
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
                      gap: "4px",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = `${C.red}20`}
                    onMouseLeave={e => e.currentTarget.style.background = `${C.red}10`}
                  >
                    <Icons.x size={13} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── BANNER FORM MODAL ─── */}
      {modalOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "16px"
        }}>
          <div style={{
            ...S.card,
            width: "100%",
            maxWidth: "520px",
            maxHeight: "90vh",
            overflowY: "auto",
            padding: "24px",
            boxShadow: "0 12px 36px rgba(0,0,0,0.15)",
            position: "relative"
          }}>
            <h3 style={{ fontSize: "18px", fontWeight: 800, color: C.text, margin: "0 0 16px 0" }}>
              {editItem ? "Edit Banner Slide" : "Add New Banner Slide"}
            </h3>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Target Page Placement Option */}
              <div>
                <label style={S.label}>Banner Category / Placement *</label>
                <select
                  style={S.input}
                  value={form.target_page}
                  onChange={(e) => setForm({ ...form, target_page: e.target.value })}
                >
                  <option value="offer">Offer Banners (Home Page & Partner Top)</option>
                  <option value="team">Team & Referral Banners (Partner Dashboard)</option>
                  <option value="all">All Pages (Offer, Team & Referral)</option>
                </select>
              </div>

              {/* Form Input fields */}
              <div>
                <label style={S.label}>Banner Title *</label>
                <input
                  style={S.input}
                  required
                  placeholder="e.g. Special Offers"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div>
                <label style={S.label}>Subtitle / Promo Text</label>
                <input
                  style={S.input}
                  placeholder="e.g. Zero joining fees on premium cards"
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={S.label}>Button Text</label>
                  <input
                    style={S.input}
                    placeholder="e.g. Apply Now"
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

              {/* Image Picker Configuration with Interactive Crop Option */}
              <div>
                <label style={S.label}>Image Configuration & Ratio Cropper</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", background: C.bgSecondary, padding: "12px", borderRadius: "10px", border: `1px solid ${C.border}` }}>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 800, color: C.textLight, display: "block", marginBottom: "4px" }}>
                      Option A: Upload & Crop Image (Re-ratio for perfect fit)
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
                      style={{ fontSize: "12px", color: C.text }}
                    />
                  </div>

                  {/* Cropped Image Status / Preview Thumbnail */}
                  {croppedPreview && (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", background: C.card, padding: "8px", borderRadius: "8px", border: `1px dashed ${C.teal}` }}>
                      <img src={croppedPreview} alt="Cropped preview" style={{ width: "80px", height: "40px", objectFit: "cover", borderRadius: "4px" }} />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: "11px", fontWeight: 800, color: C.teal, display: "block" }}>Cropped Image Ready</span>
                        <span style={{ fontSize: "10px", color: C.textLight }}>Ratio: {cropRatio}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCropModalOpen(true)}
                        style={{ background: C.teal, color: "#fff", border: "none", borderRadius: "6px", padding: "4px 8px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
                      >
                        Recrop
                      </button>
                    </div>
                  )}

                  <div style={{ textAlign: "center", fontSize: "11px", color: C.textLight, fontWeight: 700 }}>- OR -</div>

                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 800, color: C.textLight, display: "block", marginBottom: "4px" }}>
                      Option B: Asset Filename / External URL
                    </label>
                    <input
                      style={{ ...S.input, padding: "6px 10px", fontSize: "12.5px" }}
                      placeholder="e.g. offerbanner.png, team.png, or https://..."
                      value={form.image_url}
                      disabled={!!imageFile}
                      onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Redirect Action Configuration */}
              <div>
                <label style={S.label}>Redirect Action *</label>
                <div style={{ display: "flex", gap: "12px", marginBottom: "8px" }}>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: C.text, cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="link_type"
                      checked={form.link_type === "page"}
                      onChange={() => setForm({ ...form, link_type: "page", click_url: "/credit-cards" })}
                    />
                    Predefined Page
                  </label>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: C.text, cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="link_type"
                      checked={form.link_type === "custom"}
                      onChange={() => setForm({ ...form, link_type: "custom", click_url: "" })}
                    />
                    Custom URL/Link
                  </label>
                </div>

                {form.link_type === "page" ? (
                  <select
                    style={S.input}
                    value={form.click_url}
                    onChange={(e) => setForm({ ...form, click_url: e.target.value })}
                  >
                    <option value="/credit-cards">All Credit Cards</option>
                    <option value="/loans">All Loans</option>
                    <option value="/insurance">All Insurances</option>
                    <option value="/credit-cards/hdfc-bank">HDFC Credit Cards</option>
                    <option value="/attractive-cards-loans/smart-emi-card">Smart EMI Card</option>
                    <option value="/credit-cards/lifetime-free-credit-cards-ltf">Lifetime Free Credit Cards</option>
                    <option value="/partner/credit-cards">Partner Credit Cards</option>
                    <option value="/partner/products?category=personal_loan">Partner Personal Loans</option>
                  </select>
                ) : (
                  <input
                    style={S.input}
                    placeholder="e.g. /credit-cards/sbi-bank or custom URL"
                    value={form.click_url}
                    onChange={(e) => setForm({ ...form, click_url: e.target.value })}
                  />
                )}
              </div>

              {/* Status visibility check */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="checkbox"
                  id="is_active_chk"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  style={{ cursor: "pointer" }}
                />
                <label htmlFor="is_active_chk" style={{ fontSize: "13px", fontWeight: 700, color: C.text, cursor: "pointer" }}>
                  Active and Visible in Slideshow
                </label>
              </div>

              {/* Modal controls */}
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
                  { label: "3:1 Hero Banner", ratio: "3:1", w: 1200, h: 400 },
                  { label: "16:9 Wide Banner", ratio: "16:9", w: 1200, h: 675 },
                  { label: "4:3 Card Banner", ratio: "4:3", w: 800, h: 600 },
                  { label: "1:1 Square", ratio: "1:1", w: 600, h: 600 }
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
                  // Trigger Canvas Cropper export button programmatically via event
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
      // Determine canvas width and height based on ratio preset
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

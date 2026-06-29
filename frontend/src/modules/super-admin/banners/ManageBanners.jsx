// ─────────────────────────────────────────────────────────────────────────────
// d:\Internship\yohesa\frontend\src\pages\SuperAdmin\ManageBanners.jsx
// Core Feature: Homepage Slideshow Banners Administration
// Roles: SuperAdmin (CRUD)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from "react";
import api from "../../../api/api";
import { useTheme, makeS } from "../../../contexts/ThemeContext";
import { Icons } from "../../../components/Icon/PartnerIcons";

export default function ManageBanners() {
  // ─── THEMING & STYLE TOKENS ────────────────────────────────────────────────
  const { C } = useTheme();
  const S = makeS(C);

  // ─── APPLICATION STATE ─────────────────────────────────────────────────────
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // Form Fields State
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    btn_text: "",
    image_url: "",
    display_order: 0,
    is_active: true,
    link_type: "custom",
    click_url: "/credit-cards"
  });
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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
    setForm({
      title: "",
      subtitle: "",
      btn_text: "",
      image_url: "",
      display_order: banners.length + 1,
      is_active: true,
      link_type: "custom",
      click_url: "/credit-cards"
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
      click_url: item.click_url || "/credit-cards"
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
      alert(e.response?.data?.message || "Failed to save banner slide. Note: Direct file uploads fail if S3 service settings are unconfigured — please try specifying a local asset string path (e.g. 'offerbanner.png') instead.");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── RENDER BLOCKS ─────────────────────────────────────────────────────────
  return (
    <div>
      {/* ─── PAGE HEADER SECTION ─── */}
      <div className="responsive-header" style={{ marginBottom: "24px", width: "100%" }}>
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: 800, color: C.text, margin: 0 }}>Homepage Banners</h2>
          <p style={{ fontSize: "13px", color: C.textLight, margin: "4px 0 0 0" }}>Create and order active promotional slide cards featured on the customer dashboard slideshow</p>
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
      ) : banners.length === 0 ? (
        <div style={{ ...S.card, textAlign: "center", padding: "48px", color: C.textLight }}>
          No banners found. Click the button to add your first promo slide!
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
          {banners.map((item) => (
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
                  <span style={{ fontSize: "11px", fontWeight: 800, color: C.teal, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>
                    Order: {item.display_order}
                  </span>
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
                  <strong>Source Path:</strong> <code>{item.image_url}</code>
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
            maxWidth: "500px",
            padding: "24px",
            boxShadow: "0 12px 36px rgba(0,0,0,0.15)",
            position: "relative"
          }}>
            <h3 style={{ fontSize: "18px", fontWeight: 800, color: C.text, margin: "0 0 16px 0" }}>
              {editItem ? "Edit Banner Slide" : "Add New Banner Slide"}
            </h3>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
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

              {/* Multimodal Image Picker Configuration */}
              <div>
                <label style={S.label}>Image Configuration</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", background: C.bgSecondary, padding: "10px", borderRadius: "8px", border: `1px solid ${C.border}` }}>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: C.textLight, display: "block", marginBottom: "4px" }}>Option A: Upload File (Requires S3 config)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        setImageFile(e.target.files[0]);
                        setForm({ ...form, image_url: "" });
                      }}
                      style={{ fontSize: "12px", color: C.text }}
                    />
                  </div>
                  <div style={{ textAlign: "center", fontSize: "11px", color: C.textLight }}>- OR -</div>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: C.textLight, display: "block", marginBottom: "4px" }}>Option B: Asset Filename / URL String</label>
                    <input
                      style={{ ...S.input, padding: "6px 10px", fontSize: "12.5px" }}
                      placeholder="e.g. offerbanner.png, loan.png, or public link"
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
    </div>
  );
}

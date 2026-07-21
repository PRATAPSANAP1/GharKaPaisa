import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from "../../../services/api";
import { useTheme, makeS } from "../../../contexts/ThemeContext";
import { useActiveBanks } from "../../../contexts/BanksContext";
import { 
  MdSearch, MdFilterList, MdAdd, MdModeEdit, MdDelete,
  MdStar, MdVisibility, MdAttachMoney, MdSettings, MdCheck, MdClose,
  MdDragIndicator, MdBusiness, MdCategory, MdInfo, MdLabel
} from "react-icons/md";

const PRODUCT_CATEGORIES = [
  { id: "credit_card", label: "Credit Cards" },
  { id: "personal_loan", label: "Personal Loans" },
  { id: "business_loan", label: "Business Loans" },
  { id: "home_loan", label: "Home Loans" },
  { id: "car_loan", label: "Car Loans" },
  { id: "bike_loan", label: "Bike Loans" },
  { id: "gold_loan", label: "Gold Loans" },
  { id: "education_loan", label: "Education Loans" },
  { id: "insurance", label: "Insurance" },
  { id: "health_insurance", label: "Health Insurance" },
  { id: "life_insurance", label: "Life Insurance" },
  { id: "motor_insurance", label: "Motor Insurance" },
  { id: "travel_services", label: "Travel Services" },
  { id: "hotel_booking", label: "Hotel Booking" },
  { id: "flight_booking", label: "Flight Booking" },
  { id: "bus_booking", label: "Bus Booking" },
  { id: "train_booking", label: "Train Booking" },
  { id: "recharge", label: "Recharge" },
  { id: "electricity_bill", label: "Electricity Bill" },
  { id: "gas_bill", label: "Gas Bill" },
  { id: "broadband", label: "Broadband" },
  { id: "water_bill", label: "Water Bill" },
  { id: "fastag", label: "FASTag" },
  { id: "mutual_funds", label: "Mutual Funds" },
  { id: "demat_account", label: "Demat Account" },
  { id: "savings_account", label: "Savings Account" },
  { id: "fixed_deposit", label: "Fixed Deposit" },
  { id: "recurring_deposit", label: "Recurring Deposit" }
];

export default function ManageProducts() {
  const { C } = useTheme();
  const S = makeS(C);

  const [activeTab, setActiveTab] = useState("all-products"); // all-products, featured, categories, banks

  const [products, setProducts] = useState([]);
  const { activeBanks: banks } = useActiveBanks();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Search & Filters state
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get('type') || '';

  const getInitialCategory = () => {
    if (typeParam === 'credit_card') return '%card%';
    if (typeParam === 'loans') return '%loan%';
    if (typeParam === 'insurance') return '%insurance%';
    return '';
  };

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(getInitialCategory());
  const [bankFilter, setBankFilter] = useState("");
  const [commissionFilter, setCommissionFilter] = useState("");
  const [featuredFilter, setFeaturedFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    setCategoryFilter(getInitialCategory());
    setPage(1);
  }, [typeParam]);

  // Edit / Create Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [modalTab, setModalTab] = useState("core"); // core, eligibility, commission, redirect, seo
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    name: "",
    short_description: "",
    description: "",
    logo: "",
    banner: "",
    image: "",
    category: "credit_card",
    bank_id: "",
    is_active: true,
    status: "Active", // Active, Hidden, Coming Soon, Inactive
    public_visible: true,
    partner_visible: true,

    // Eligibility
    min_age: 18,
    max_age: 60,
    min_income: 0,
    features: "[]",
    benefits: "",
    eligibility_criteria: "",
    documents_required: "",
    fees_charges: "",
    annual_fee: "",
    interest_rate: "",
    processing_fee: "",

    // Commission
    commission_enabled: true,
    commission_type: "fixed", // fixed, percentage
    commission_value: 0,
    commission_amount: 0,
    override_percentage: 0, // Parent override %
    min_commission: 0,
    max_commission: 0,
    commission_release_rule: "standard",

    // Redirect & App Settings
    application_url: "",
    partner_url: "",
    redirect_type: "new_tab", // same_tab, new_tab
    tracking_enabled: true,
    apply_button_text: "Apply Now",
    priority: 0,
    featured: false,

    // SEO
    seo_title: "",
    seo_description: "",
    seo_keywords: ""
  });

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewProduct, setViewProduct] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/products", {
        params: {
          page,
          limit: 25,
          search: search.trim() || undefined,
          category: categoryFilter || undefined,
          bank_id: bankFilter || undefined,
          commission_enabled: commissionFilter || undefined,
          featured: featuredFilter || undefined,
          status: statusFilter || undefined,
          is_active: "all"
        }
      });
      if (res.data?.success) {
        setProducts(res.data.data);
        setTotalPages(res.data.pagination?.totalPages || 1);
        setTotalRecords(res.data.pagination?.total || res.data.data?.length || 0);
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("Failed to load products registry.");
    } finally {
      setLoading(false);
    }
  };

  // Reset page to 1 when filters change to avoid empty pages
  useEffect(() => {
    setPage(1);
  }, [categoryFilter, bankFilter, commissionFilter, featuredFilter, statusFilter]);

  useEffect(() => {
    fetchProducts();
  }, [page, categoryFilter, bankFilter, commissionFilter, featuredFilter, statusFilter]);

  const handleResetFilters = () => {
    setSearch("");
    setCategoryFilter("");
    setBankFilter("");
    setCommissionFilter("");
    setFeaturedFilter("");
    setStatusFilter("");
    setPage(1);
  };

  const openAddModal = () => {
    setEditItem(null);
    setModalTab("core");
    setForm({
      name: "",
      short_description: "",
      description: "",
      logo: "",
      banner: "",
      image: "",
      category: "credit_card",
      bank_id: banks[0]?.id || "",
      is_active: true,
      status: "Active",
      public_visible: true,
      partner_visible: true,
      min_age: 18,
      max_age: 60,
      min_income: 0,
      features: "[]",
      benefits: "",
      eligibility_criteria: "",
      documents_required: "",
      fees_charges: "",
      annual_fee: "",
      interest_rate: "",
      processing_fee: "",
      commission_enabled: true,
      commission_type: "fixed",
      commission_value: 0,
      commission_amount: 0,
      override_percentage: 0,
      min_commission: 0,
      max_commission: 0,
      commission_release_rule: "standard",
      application_url: "",
      partner_url: "",
      redirect_type: "new_tab",
      tracking_enabled: true,
      apply_button_text: "Apply Now",
      priority: 0,
      featured: false,
      seo_title: "",
      seo_description: "",
      seo_keywords: ""
    });
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditItem(item);
    setModalTab("core");
    setForm({
      name: item.name || "",
      short_description: item.short_description || "",
      description: item.description || "",
      logo: item.logo || "",
      banner: item.banner || "",
      image: item.image || item.image_url || "",
      category: item.category || "credit_card",
      bank_id: item.bank_id || "",
      is_active: item.is_active ?? true,
      status: item.status || "Active",
      public_visible: item.public_visible ?? true,
      partner_visible: item.partner_visible ?? true,
      min_age: item.min_age ?? 18,
      max_age: item.max_age ?? 60,
      min_income: item.min_income ?? 0,
      features: JSON.stringify(item.features || []),
      benefits: item.benefits || "",
      eligibility_criteria: item.eligibility_criteria || "",
      documents_required: item.documents_required || "",
      fees_charges: item.fees_charges || "",
      annual_fee: item.annual_fee || "",
      interest_rate: item.interest_rate || "",
      processing_fee: item.processing_fee || "",
      commission_enabled: item.commission_enabled ?? true,
      commission_type: item.commission_type || "fixed",
      commission_value: item.commission_value || 0,
      commission_amount: item.commission_amount || 0,
      override_percentage: item.override_percentage || 0,
      min_commission: item.min_commission || 0,
      max_commission: item.max_commission || 0,
      commission_release_rule: item.commission_release_rule || "standard",
      application_url: item.application_url || item.public_url || "",
      partner_url: item.partner_url || "",
      redirect_type: item.redirect_type || "new_tab",
      tracking_enabled: item.tracking_enabled ?? true,
      apply_button_text: item.apply_button_text || "Apply Now",
      priority: item.priority || 0,
      featured: item.featured ?? false,
      seo_title: item.seo_title || "",
      seo_description: item.seo_description || "",
      seo_keywords: item.seo_keywords || ""
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let parsedFeatures = [];
      try {
        parsedFeatures = JSON.parse(form.features);
      } catch (err) {
        parsedFeatures = [];
      }

      const payload = {
        ...form,
        features: parsedFeatures,
        is_active: form.status !== "Inactive",
        eligibility: {
          min_age: Number(form.min_age),
          max_age: Number(form.max_age),
          min_income: Number(form.min_income)
        }
      };

      let res;
      if (editItem) {
        res = await api.put(`/superadmin/products/${editItem.id}`, payload);
      } else {
        res = await api.post("/superadmin/products", payload);
      }

      if (res.data?.success) {
        setModalOpen(false);
        fetchProducts();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save product.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (product) => {
    const newActive = !product.is_active;
    try {
      await api.put(`/superadmin/products/${product.id}`, { is_active: newActive });
      setProducts(products.map(p => p.id === product.id ? { ...p, is_active: newActive } : p));
    } catch (err) {
      alert("Failed to toggle status");
    }
  };

  const handleToggleFeatured = async (product) => {
    const newFeatured = !product.featured;
    try {
      await api.put(`/superadmin/products/featured`, { id: product.id, featured: newFeatured });
      setProducts(products.map(p => p.id === product.id ? { ...p, featured: newFeatured } : p));
    } catch (err) {
      alert("Failed to update featured settings");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product permanently?")) return;
    try {
      const res = await api.delete(`/superadmin/products/${id}`);
      if (res.data?.success) {
        alert("Product deleted.");
        fetchProducts();
      }
    } catch (err) {
      alert("Failed to delete product.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", paddingBottom: "60px" }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: 800, color: C.text, margin: 0 }}>Product & Partner Catalog Master</h2>
          <p style={{ fontSize: "13px", color: C.textLight, margin: "4px 0 0 0" }}>Manage financial products, payout margins, redirects, and SEO parameters — <strong>{totalRecords} Records</strong></p>
        </div>
        <button onClick={openAddModal} style={{ ...S.btn("primary"), display: "flex", alignItems: "center", gap: "6px" }}>
          <MdAdd size={20} /> Create Product
        </button>
      </div>

      <div style={{ height: "4px" }} />

      {/* TAB 1: ALL PRODUCTS MASTER */}
      {activeTab === "all-products" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* Search & Filters */}
          <div style={{ ...S.card, padding: "16px", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "flex-end" }}>
            <div style={{ flex: 1, minWidth: "220px" }}>
              <label style={S.label}>Search products or banks...</label>
              <div style={{ position: "relative" }}>
                <input 
                  style={{ ...S.input, paddingLeft: "32px" }} 
                  placeholder="Type product or issuer name..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <MdSearch style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: C.textLight }} />
              </div>
            </div>

            <div style={{ width: "150px" }}>
              <label style={S.label}>Category</label>
              <select style={S.input} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                <option value="">All Categories</option>
                {categoryFilter && !PRODUCT_CATEGORIES.find(c => c.id === categoryFilter) && (
                  <option value={categoryFilter}>
                    {categoryFilter === '%card%' ? 'All Credit Cards' :
                     categoryFilter === '%loan%' ? 'All Loans' :
                     categoryFilter === '%insurance%' ? 'All Insurance' : 'Active Group'}
                  </option>
                )}
                {PRODUCT_CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
              </select>
            </div>

            <div style={{ width: "150px" }}>
              <label style={S.label}>Bank Partner</label>
              <select style={S.input} value={bankFilter} onChange={e => setBankFilter(e.target.value)}>
                <option value="">All Banks</option>
                {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            <div style={{ width: "120px" }}>
              <label style={S.label}>Featured</label>
              <select style={S.input} value={featuredFilter} onChange={e => setFeaturedFilter(e.target.value)}>
                <option value="">All</option>
                <option value="true">Featured Only</option>
                <option value="false">Non-Featured</option>
              </select>
            </div>

            <div style={{ width: "120px" }}>
              <label style={S.label}>Commission</label>
              <select style={S.input} value={commissionFilter} onChange={e => setCommissionFilter(e.target.value)}>
                <option value="">All</option>
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => { if (page !== 1) { setPage(1); } else { fetchProducts(); } }} style={S.btn("primary")}>Filter</button>
              <button onClick={handleResetFilters} style={S.btn("outline")}>Reset</button>
            </div>
          </div>

          {/* Grid list */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "48px" }}>Loading products catalog...</div>
          ) : products.length === 0 ? (
            <div style={{ ...S.card, padding: "48px", textAlign: "center", color: C.textLight }}>No products match filter settings.</div>
          ) : (
            <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, fontSize: "11.5px", textTransform: "uppercase" }}>
                      <th style={{ padding: "14px 16px" }}>Product Name / Bank</th>
                      <th style={{ padding: "14px 16px" }}>Category</th>
                      <th style={{ padding: "14px 16px" }}>Status</th>
                      <th style={{ padding: "14px 16px" }}>Commission</th>
                      <th style={{ padding: "14px 16px" }}>Visibility</th>
                      <th style={{ padding: "14px 16px" }}>Featured</th>
                      <th style={{ padding: "14px 16px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody style={{ fontSize: "13px", color: C.text }}>
                    {products.map(p => (
                      <tr key={p.id} style={{ borderBottom: `1px solid ${C.border}60` }}>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            {p.logo && <img src={p.logo} alt="logo" style={{ width: "24px", height: "24px", borderRadius: "4px", objectFit: "contain" }} />}
                            <div>
                              <div style={{ fontWeight: 800 }}>{p.name}</div>
                              <div style={{ fontSize: "10px", color: C.textLight }}>{p.bank_name}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "14px 16px", textTransform: "capitalize" }}>
                          {p.category?.replace(/_/g, " ")}
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{
                            fontSize: "10px", fontWeight: 800, padding: "2px 8px", borderRadius: "4px",
                            background: p.status === "Active" ? `${C.green}12` : `${C.border}`,
                            color: p.status === "Active" ? C.green : C.textLight
                          }}>
                            {p.status}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px", fontWeight: 700 }}>
                          {p.commission_enabled ? (
                            <span style={{ color: C.green }}>
                              {p.commission_type === "fixed" ? `₹${p.commission_value}` : `${p.commission_value}%`}
                            </span>
                          ) : (
                            <span style={{ color: C.textLight }}>Disabled</span>
                          )}
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "10.5px" }}>
                            <span>Public: {p.public_visible ? "👁️" : "❌"}</span>
                            <span>Partner: {p.partner_visible ? "👁️" : "❌"}</span>
                          </div>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <button 
                            onClick={() => handleToggleFeatured(p)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: p.featured ? C.amber : C.textLight }}
                          >
                            <MdStar size={20} />
                          </button>
                        </td>
                        <td style={{ padding: "14px 16px", textAlign: "right" }}>
                          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                            <button onClick={() => { setViewProduct(p); setViewModalOpen(true); }} style={{ padding: "6px", border: `1px solid ${C.border}`, background: C.bgSecondary, cursor: "pointer", borderRadius: "6px", color: C.text }} title="View Details"><MdVisibility size={16} /></button>
                            <button onClick={() => openEditModal(p)} style={{ padding: "6px", border: `1px solid ${C.border}`, background: C.bgSecondary, cursor: "pointer", borderRadius: "6px", color: C.text }} title="Edit"><MdModeEdit size={16} /></button>
                            <button onClick={() => handleDelete(p.id)} style={{ padding: "6px", border: `1px solid ${C.red}40`, background: `${C.red}10`, cursor: "pointer", borderRadius: "6px", color: C.red }} title="Delete"><MdDelete size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", marginTop: "16px" }}>
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} style={{ ...S.btn("outline"), opacity: page <= 1 ? 0.5 : 1, cursor: page <= 1 ? 'not-allowed' : 'pointer' }}>← Previous</button>
              <span style={{ fontSize: "14px", fontWeight: 600, color: C.textSecondary }}>Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} style={{ ...S.btn("outline"), opacity: page >= totalPages ? 0.5 : 1, cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}>Next →</button>
            </div>
          )}

        </div>
      )}



      {/* ADD/EDIT DETAILS TABBED DRAWER MODAL */}
      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ ...S.card, width: "100%", maxWidth: "700px", padding: "24px", maxHeight: "90vh", overflowY: "auto", position: "relative" }}>
            
            <button 
              onClick={() => setModalOpen(false)}
              style={{ position: "absolute", top: "16px", right: "16px", background: C.bgSecondary, border: "none", cursor: "pointer", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: C.textLight }}
            >
              <MdClose size={20} />
            </button>

            <h3 style={{ fontSize: "18px", fontWeight: 850, color: C.text, margin: "0 0 16px" }}>
              {editItem ? `Edit product parameters: ${form.name}` : "Create Financial Product Master"}
            </h3>

            {/* Modal Internal Tabs */}
            <div style={{ display: "flex", borderBottom: `1px solid ${C.border}70`, gap: "16px", marginBottom: "20px", overflowX: "auto" }}>
              {[
                { id: "core", label: "Core Details" },
                { id: "eligibility", label: "Eligibility & Details" },
                { id: "commission", label: "Commission split" },
                { id: "redirect", label: "Redirect / Settings" },
                { id: "seo", label: "SEO Config" }
              ].map(tab => (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => setModalTab(tab.id)}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    padding: "8px 2px", fontSize: "13px", fontWeight: modalTab === tab.id ? 800 : 600,
                    color: modalTab === tab.id ? C.primary : C.textLight,
                    borderBottom: modalTab === tab.id ? `2px solid ${C.primary}` : "2px solid transparent"
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              
              {/* CORE DETAILS TAB */}
              {modalTab === "core" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={S.label}>Product Name *</label>
                      <input required style={S.input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div>
                      <label style={S.label}>Issuer Bank Partner *</label>
                      <select required style={S.input} value={form.bank_id} onChange={e => setForm({ ...form, bank_id: e.target.value })}>
                        <option value="">Select Bank...</option>
                        {banks.map(b => <option key={b.id} value={b.id}>{b.name} ({b.short_code})</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={S.label}>Category Catalog *</label>
                      <select required style={S.input} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                        {PRODUCT_CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={S.label}>Status Visibility</label>
                      <select style={S.input} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                        <option value="Active">Active</option>
                        <option value="Coming Soon">Coming Soon</option>
                        <option value="Hidden">Hidden</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={S.label}>Short Description *</label>
                    <input required style={S.input} placeholder="Provide one-liner overview..." value={form.short_description} onChange={e => setForm({ ...form, short_description: e.target.value })} />
                  </div>

                  <div>
                    <label style={S.label}>Full Description</label>
                    <textarea rows={3} style={S.input} placeholder="Write detail product instructions..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={S.label}>Logo URL</label>
                      <input style={S.input} placeholder="https://..." value={form.logo} onChange={e => setForm({ ...form, logo: e.target.value })} />
                    </div>
                    <div>
                      <label style={S.label}>Banner Image URL</label>
                      <input style={S.input} placeholder="https://..." value={form.banner} onChange={e => setForm({ ...form, banner: e.target.value })} />
                    </div>
                    <div>
                      <label style={S.label}>Product Image URL</label>
                      <input style={S.input} placeholder="https://..." value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "16px", marginTop: "6px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer", userSelect: "none" }}>
                      <input type="checkbox" checked={form.public_visible} onChange={e => setForm({ ...form, public_visible: e.target.checked })} />
                      Visible on Public Website
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer", userSelect: "none" }}>
                      <input type="checkbox" checked={form.partner_visible} onChange={e => setForm({ ...form, partner_visible: e.target.checked })} />
                      Visible on Partner Portal
                    </label>
                  </div>
                </div>
              )}

              {/* ELIGIBILITY & TERMS DETAILS TAB */}
              {modalTab === "eligibility" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={S.label}>Min Age Limit</label>
                      <input type="number" style={S.input} value={form.min_age} onChange={e => setForm({ ...form, min_age: e.target.value })} />
                    </div>
                    <div>
                      <label style={S.label}>Max Age Limit</label>
                      <input type="number" style={S.input} value={form.max_age} onChange={e => setForm({ ...form, max_age: e.target.value })} />
                    </div>
                    <div>
                      <label style={S.label}>Min Income (Monthly ₹)</label>
                      <input type="number" style={S.input} value={form.min_income} onChange={e => setForm({ ...form, min_income: e.target.value })} />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={S.label}>Annual Fee / Cost Description</label>
                      <input placeholder="e.g. Free or ₹499" style={S.input} value={form.annual_fee} onChange={e => setForm({ ...form, annual_fee: e.target.value })} />
                    </div>
                    <div>
                      <label style={S.label}>Interest Rate (%)</label>
                      <input placeholder="e.g. 11.5% or 36%" style={S.input} value={form.interest_rate} onChange={e => setForm({ ...form, interest_rate: e.target.value })} />
                    </div>
                    <div>
                      <label style={S.label}>Processing Fee Description</label>
                      <input placeholder="e.g. 1% of loan value" style={S.input} value={form.processing_fee} onChange={e => setForm({ ...form, processing_fee: e.target.value })} />
                    </div>
                  </div>

                  <div>
                    <label style={S.label}>Features List (JSON array)</label>
                    <textarea rows={2} style={{ ...S.input, fontFamily: "monospace" }} value={form.features} onChange={e => setForm({ ...form, features: e.target.value })} />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={S.label}>Eligibility Criteria description</label>
                      <textarea rows={2} style={S.input} placeholder="Write eligibility criteria..." value={form.eligibility_criteria} onChange={e => setForm({ ...form, eligibility_criteria: e.target.value })} />
                    </div>
                    <div>
                      <label style={S.label}>Documents Required</label>
                      <textarea rows={2} style={S.input} placeholder="Aadhaar, PAN, ITR statements..." value={form.documents_required} onChange={e => setForm({ ...form, documents_required: e.target.value })} />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={S.label}>Benefits description</label>
                      <textarea rows={2} style={S.input} placeholder="Describe product benefits..." value={form.benefits} onChange={e => setForm({ ...form, benefits: e.target.value })} />
                    </div>
                    <div>
                      <label style={S.label}>Fees & Charges description</label>
                      <textarea rows={2} style={S.input} placeholder="Other terms or charges details..." value={form.fees_charges} onChange={e => setForm({ ...form, fees_charges: e.target.value })} />
                    </div>
                  </div>
                </div>
              )}

              {/* COMMISSION SETTINGS TAB */}
              {modalTab === "commission" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", fontWeight: 800, cursor: "pointer", userSelect: "none" }}>
                    <input type="checkbox" checked={form.commission_enabled} onChange={e => setForm({ ...form, commission_enabled: e.target.checked })} />
                    Commission Enabled for this Product
                  </label>

                  {form.commission_enabled && (
                    <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, padding: "16px", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "14px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <div>
                          <label style={S.label}>Commission Type</label>
                          <select style={S.input} value={form.commission_type} onChange={e => setForm({ ...form, commission_type: e.target.value })}>
                            <option value="fixed">Flat Fixed Amount (₹)</option>
                            <option value="percentage">Percentage Margin (%)</option>
                          </select>
                        </div>
                        <div>
                          <label style={S.label}>Commission Value *</label>
                          <input type="number" step="0.01" style={S.input} value={form.commission_value} onChange={e => setForm({ ...form, commission_value: e.target.value })} />
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                        <div>
                          <label style={S.label}>Min Commission Cap</label>
                          <input type="number" style={S.input} value={form.min_commission} onChange={e => setForm({ ...form, min_commission: e.target.value })} />
                        </div>
                        <div>
                          <label style={S.label}>Max Commission Cap</label>
                          <input type="number" style={S.input} value={form.max_commission} onChange={e => setForm({ ...form, max_commission: e.target.value })} />
                        </div>
                        <div>
                          <label style={S.label}>Parent Network Override (%)</label>
                          <input type="number" step="0.01" style={S.input} value={form.override_percentage} onChange={e => setForm({ ...form, override_percentage: e.target.value })} />
                        </div>
                      </div>

                      <div>
                        <label style={S.label}>Payout Release Validation Rule</label>
                        <select style={S.input} value={form.commission_release_rule} onChange={e => setForm({ ...form, commission_release_rule: e.target.value })}>
                          <option value="standard">Standard (48 hours digest hold)</option>
                          <option value="instant">Instant Verification Release</option>
                          <option value="disbursement">Disbursement dependent</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* REDIRECT & APP SETTINGS TAB */}
              {modalTab === "redirect" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={S.label}>Public Application Redirect Link *</label>
                      <input type="url" required placeholder="https://..." style={S.input} value={form.application_url} onChange={e => setForm({ ...form, application_url: e.target.value })} />
                    </div>
                    <div>
                      <label style={S.label}>Partner Custom Referral URL</label>
                      <input type="url" placeholder="https://..." style={S.input} value={form.partner_url} onChange={e => setForm({ ...form, partner_url: e.target.value })} />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={S.label}>Apply Button Label</label>
                      <input style={S.input} placeholder="e.g. Apply Now or Get Card" value={form.apply_button_text} onChange={e => setForm({ ...form, apply_button_text: e.target.value })} />
                    </div>
                    <div>
                      <label style={S.label}>Redirect Target Frame</label>
                      <select style={S.input} value={form.redirect_type} onChange={e => setForm({ ...form, redirect_type: e.target.value })}>
                        <option value="new_tab">Open in New Tab</option>
                        <option value="same_tab">Same Tab Redirect</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={S.label}>Display priority order</label>
                      <input type="number" style={S.input} value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} />
                    </div>
                    <div style={{ display: "flex", gap: "16px", alignItems: "center", height: "100%" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer", userSelect: "none" }}>
                        <input type="checkbox" checked={form.tracking_enabled} onChange={e => setForm({ ...form, tracking_enabled: e.target.checked })} />
                        Clicks Tracking Enabled
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* SEO CONFIG TAB */}
              {modalTab === "seo" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <label style={S.label}>SEO Title Tag</label>
                    <input style={S.input} placeholder="Write page header title tag..." value={form.seo_title} onChange={e => setForm({ ...form, seo_title: e.target.value })} />
                  </div>
                  <div>
                    <label style={S.label}>SEO Meta Description</label>
                    <textarea rows={3} style={S.input} placeholder="Compelling meta description summary..." value={form.seo_description} onChange={e => setForm({ ...form, seo_description: e.target.value })} />
                  </div>
                  <div>
                    <label style={S.label}>SEO Search Keywords</label>
                    <input style={S.input} placeholder="credit cards, apply online, lowest rate..." value={form.seo_keywords} onChange={e => setForm({ ...form, seo_keywords: e.target.value })} />
                  </div>
                </div>
              )}

              <div style={{ borderTop: `1px solid ${C.border}70`, paddingTop: "16px", marginTop: "10px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" onClick={() => setModalOpen(false)} style={S.btn("outline")}>Cancel</button>
                <button type="submit" disabled={submitting} style={S.btn("primary")}>
                  {submitting ? "Saving..." : "Save Configuration"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* VIEW PRODUCT SPECIFICATIONS MODAL */}
      {viewModalOpen && viewProduct && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ ...S.card, width: "100%", maxWidth: "580px", padding: "24px", maxHeight: "80vh", overflowY: "auto", position: "relative" }}>
            <button 
              onClick={() => setViewModalOpen(false)}
              style={{ position: "absolute", top: "16px", right: "16px", background: C.bgSecondary, border: "none", cursor: "pointer", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: C.textLight }}
            >
              <MdClose size={20} />
            </button>

            <div style={{ display: "flex", gap: "16px", alignItems: "center", borderBottom: `1px solid ${C.border}`, paddingBottom: "16px", marginBottom: "16px" }}>
              {viewProduct.logo && <img src={viewProduct.logo} alt="bank" style={{ width: "48px", height: "48px", objectFit: "contain" }} />}
              <div>
                <h3 style={{ fontSize: "17px", fontWeight: 800, color: C.text, margin: 0 }}>{viewProduct.name}</h3>
                <span style={{ fontSize: "12px", color: C.textLight }}>Issuer: {viewProduct.bank_name} | Category: {viewProduct.category?.replace(/_/g, " ")}</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "13px", color: C.text }}>
              <div>
                <span style={{ fontWeight: 800, color: C.textLight, display: "block" }}>Overview</span>
                <p style={{ margin: "4px 0 0 0", color: C.textMid }}>{viewProduct.short_description || viewProduct.description}</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: C.bgSecondary, padding: "12px", borderRadius: "10px" }}>
                <div>
                  <strong>Status Visibility:</strong> {viewProduct.status}
                </div>
                <div>
                  <strong>Annual Fee:</strong> {viewProduct.annual_fee || "N/A"}
                </div>
                <div>
                  <strong>Commission Rate:</strong> {viewProduct.commission_enabled ? `${viewProduct.commission_type === "fixed" ? "₹" : ""}${viewProduct.commission_value}${viewProduct.commission_type === "percentage" ? "%" : ""}` : "Disabled"}
                </div>
                <div>
                  <strong>Parent Split Override:</strong> {viewProduct.override_percentage}%
                </div>
              </div>

              {viewProduct.eligibility_criteria && (
                <div>
                  <span style={{ fontWeight: 800, color: C.textLight, display: "block" }}>Eligibility Criteria</span>
                  <p style={{ margin: "4px 0 0 0", color: C.textMid }}>{viewProduct.eligibility_criteria}</p>
                </div>
              )}

              {viewProduct.documents_required && (
                <div>
                  <span style={{ fontWeight: 800, color: C.textLight, display: "block" }}>Documents Required</span>
                  <p style={{ margin: "4px 0 0 0", color: C.textMid }}>{viewProduct.documents_required}</p>
                </div>
              )}

              {viewProduct.benefits && (
                <div>
                  <span style={{ fontWeight: 800, color: C.textLight, display: "block" }}>Benefits & Rewards</span>
                  <p style={{ margin: "4px 0 0 0", color: C.textMid }}>{viewProduct.benefits}</p>
                </div>
              )}

              {viewProduct.fees_charges && (
                <div>
                  <span style={{ fontWeight: 800, color: C.textLight, display: "block" }}>Fees & Tariffs</span>
                  <p style={{ margin: "4px 0 0 0", color: C.textMid }}>{viewProduct.fees_charges}</p>
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px", borderTop: `1px solid ${C.border}60`, paddingTop: "14px" }}>
              <button onClick={() => setViewModalOpen(false)} style={S.btn("primary")}>Close Specs</button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

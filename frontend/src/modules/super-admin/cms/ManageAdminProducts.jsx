import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from "../../../services/api";
import { useTheme, makeS } from "../../../contexts/ThemeContext";
import { useActiveBanks } from "../../../contexts/BanksContext";
import { 
  MdAdd, MdSearch, MdEdit, MdDelete, MdContentCopy, MdVisibility,
  MdStar, MdCheckCircle, MdCancel, MdClose, MdFileUpload 
} from "react-icons/md";

const CATEGORY_MAP = {
  credit_card: "Credit Cards",
  loans: "Loans",
  insurance: "Insurance",
  savings_account: "Savings Account",
  current_account: "Current Account",
  fixed_deposit: "Fixed Deposit",
  demat_account: "DEMAT Account",
  upi_credit: "UPI Credit",
  fastag: "FASTag",
  recharge: "Recharge & Bills",
  other: "Other Products"
};

const FEATURE_OPTIONS = [
  "Airport Lounge", "Cashback", "Reward Points", "Fuel Benefits",
  "Dining Offers", "Movie Offers", "Travel Benefits", "Golf Access",
  "EMI Option", "Insurance Cover", "Contactless", "UPI Enabled"
];

const DOCUMENT_OPTIONS = [
  "PAN Card", "Aadhaar Card", "Salary Slip", "ITR (Income Tax Return)",
  "Bank Statement", "Passport", "Driving License"
];

export default function ManageAdminProducts() {
  const { categorySlug } = useParams();
  const { C, isDark } = useTheme();
  const S = makeS(C);

  const activeCategory = categorySlug || "credit_card";
  const categoryTitle = CATEGORY_MAP[activeCategory] || "Products";

  const [products, setProducts] = useState([]);
  const { activeBanks: banks } = useActiveBanks();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [search, setSearch] = useState("");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalTab, setModalTab] = useState("basic"); // basic, fees, eligibility, commission, features, benefits, documents, compare, visibility, seo

  // File Upload State
  const [cardImageFile, setCardImageFile] = useState(null);

  // Form State
  const [form, setForm] = useState({
    name: "",
    bank_id: "",
    category: activeCategory,
    sub_category: "",
    description: "",
    image_url: "",
    thumbnail_url: "",
    banner_url: "",
    status: "Active",
    is_active: true,

    // Fees
    joining_fee: "₹0",
    annual_fee: "₹500",
    interest_rate: "3.5% p.m.",
    late_payment_charges: "Up to ₹1300",
    foreign_markup: "3.5%",
    fuel_surcharge: "1% waiver",

    // Eligibility
    min_age: 21,
    max_age: 60,
    min_income: 25000,
    employment_type: "Salaried / Self-Employed",
    cibil_required: 750,
    resident_type: "Indian Resident",

    // Commission
    partner_commission: 1500,
    sub_partner_commission: 300,
    super_partner_commission: 200,
    admin_commission: 500,

    // Features & Benefits
    features: ["Cashback", "Airport Lounge"],
    benefits: [
      { title: "5% Cashback", description: "On top online merchants" },
      { title: "Complimentary Lounge", description: "4 visits per year" }
    ],

    // Required Documents
    required_documents: ["PAN Card", "Aadhaar Card", "Salary Slip"],

    // Compare Specs
    compare_annual_fee: "₹500",
    compare_reward_rate: "5%",
    compare_lounge: "Yes (4/yr)",
    compare_fuel: "1% Waiver",
    compare_forex: "3.5%",

    // Visibility
    show_on_website: true,
    show_in_partner: true,
    is_featured: false,
    is_popular: false,

    // SEO
    meta_title: "",
    meta_description: "",
    slug: ""
  });



  // Fetch products
  const fetchProducts = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await api.get('/products', {
        params: {
          category: activeCategory === 'loans' ? '%loan%' :
                    activeCategory === 'insurance' ? '%insurance%' :
                    activeCategory,
          search: search.trim() || undefined,
          limit: 100
        }
      });
      if (res.data?.success) {
        setProducts(res.data.data || []);
      }
    } catch (e) {
      console.error("[ManageAdminProducts] Fetch error:", e);
      setErrorMsg("Failed to fetch products list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [activeCategory, search]);

  const openAddModal = () => {
    setEditItem(null);
    setCardImageFile(null);
    setForm({
      name: "",
      bank_id: banks[0]?.id || "",
      category: activeCategory,
      sub_category: "",
      description: "",
      image_url: "",
      thumbnail_url: "",
      banner_url: "",
      status: "Active",
      is_active: true,

      joining_fee: "₹0",
      annual_fee: "₹500",
      interest_rate: "3.5% p.m.",
      late_payment_charges: "Up to ₹1300",
      foreign_markup: "3.5%",
      fuel_surcharge: "1% waiver",

      min_age: 21,
      max_age: 60,
      min_income: 25000,
      employment_type: "Salaried / Self-Employed",
      cibil_required: 750,
      resident_type: "Indian Resident",

      partner_commission: 1500,
      sub_partner_commission: 300,
      super_partner_commission: 200,
      admin_commission: 500,

      features: ["Cashback", "Airport Lounge"],
      benefits: [
        { title: "5% Cashback", description: "On online shopping" },
        { title: "Airport Lounge Access", description: "4 free passes annually" }
      ],

      required_documents: ["PAN Card", "Aadhaar Card", "Salary Slip"],

      compare_annual_fee: "₹500",
      compare_reward_rate: "5%",
      compare_lounge: "Yes (4/yr)",
      compare_fuel: "1% Waiver",
      compare_forex: "3.5%",

      show_on_website: true,
      show_in_partner: true,
      is_featured: false,
      is_popular: false,

      meta_title: "",
      meta_description: "",
      slug: ""
    });
    setModalTab("basic");
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditItem(item);
    setCardImageFile(null);

    const fees = item.fees_structure || {};
    const elig = item.eligibility_criteria || {};
    const comm = item.commissions_json || {};
    const compare = item.compare_specs || {};
    const vis = item.visibility || {};
    const seo = item.seo_metadata || {};

    setForm({
      name: item.name || "",
      bank_id: item.bank_id || "",
      category: item.category || activeCategory,
      sub_category: item.sub_category || "",
      description: item.description || "",
      image_url: item.image_url || "",
      thumbnail_url: item.thumbnail_url || "",
      banner_url: item.banner_url || "",
      status: item.status || "Active",
      is_active: item.is_active !== undefined ? item.is_active : true,

      joining_fee: fees.joining_fee || "₹0",
      annual_fee: fees.annual_fee || item.annual_fee || "₹500",
      interest_rate: fees.interest_rate || "3.5% p.m.",
      late_payment_charges: fees.late_payment_charges || "",
      foreign_markup: fees.foreign_markup || "",
      fuel_surcharge: fees.fuel_surcharge || "",

      min_age: elig.min_age || item.min_age || 21,
      max_age: elig.max_age || item.max_age || 60,
      min_income: elig.min_income || item.min_income || 25000,
      employment_type: elig.employment_type || "Salaried",
      cibil_required: elig.cibil_required || 750,
      resident_type: elig.resident_type || "Indian Resident",

      partner_commission: comm.partner_commission || item.commission_value || 1500,
      sub_partner_commission: comm.sub_partner_commission || 300,
      super_partner_commission: comm.super_partner_commission || 200,
      admin_commission: comm.admin_commission || 500,

      features: Array.isArray(item.features_list) ? item.features_list : [],
      benefits: Array.isArray(item.benefits_list) ? item.benefits_list : [],
      required_documents: Array.isArray(item.required_documents) ? item.required_documents : [],

      compare_annual_fee: compare.annual_fee || "",
      compare_reward_rate: compare.reward_rate || "",
      compare_lounge: compare.lounge || "",
      compare_fuel: compare.fuel || "",
      compare_forex: compare.forex || "",

      show_on_website: vis.show_on_website !== undefined ? vis.show_on_website : true,
      show_in_partner: vis.show_in_partner !== undefined ? vis.show_in_partner : true,
      is_featured: vis.is_featured || item.featured || false,
      is_popular: vis.is_popular || false,

      meta_title: seo.meta_title || "",
      meta_description: seo.meta_description || "",
      slug: item.slug || "",
      faqs: []
    });

    api.get(`/products/${item.id}/faqs`).then(res => {
      if (res.data?.success && Array.isArray(res.data.data)) {
        setForm(prev => ({ ...prev, faqs: res.data.data }));
      }
    }).catch(() => {});

    setModalTab("basic");
    setModalOpen(true);
  };

  const handleDuplicate = async (id) => {
    try {
      const res = await api.post(`/products/${id}/duplicate`);
      if (res.data?.success) {
        alert("Product duplicated successfully!");
        fetchProducts();
      }
    } catch (e) {
      alert(e.response?.data?.message || "Failed to duplicate product");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await api.delete(`/products/${id}`);
      if (res.data?.success) {
        alert("Product deleted successfully!");
        fetchProducts();
      }
    } catch (e) {
      alert(e.response?.data?.message || "Failed to delete product");
    }
  };

  const toggleStatus = async (item) => {
    const newStatus = item.status === "Active" ? "Inactive" : "Active";
    const newIsActive = newStatus === "Active";
    try {
      const res = await api.patch(`/products/${item.id}/status`, {
        id: item.id,
        status: newStatus,
        is_active: newIsActive
      });
      if (res.data?.success) {
        setProducts(products.map(p => p.id === item.id ? { ...p, status: newStatus, is_active: newIsActive } : p));
      }
    } catch (e) {
      alert(e.response?.data?.message || "Failed to toggle status");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        name: form.name.trim(),
        bank_id: form.bank_id,
        category: activeCategory,
        sub_category: form.sub_category,
        description: form.description,
        image_url: form.image_url,
        thumbnail_url: form.thumbnail_url,
        banner_url: form.banner_url,
        status: form.status,
        is_active: form.status === "Active",

        fees_structure: {
          joining_fee: form.joining_fee,
          annual_fee: form.annual_fee,
          interest_rate: form.interest_rate,
          late_payment_charges: form.late_payment_charges,
          foreign_markup: form.foreign_markup,
          fuel_surcharge: form.fuel_surcharge
        },

        eligibility_criteria: {
          min_age: parseInt(form.min_age),
          max_age: parseInt(form.max_age),
          min_income: parseFloat(form.min_income),
          employment_type: form.employment_type,
          cibil_required: parseInt(form.cibil_required),
          resident_type: form.resident_type
        },

        commissions_json: {
          partner_commission: parseFloat(form.partner_commission),
          sub_partner_commission: parseFloat(form.sub_partner_commission),
          super_partner_commission: parseFloat(form.super_partner_commission),
          admin_commission: parseFloat(form.admin_commission)
        },

        features_list: form.features,
        benefits_list: form.benefits,
        required_documents: form.required_documents,

        compare_specs: {
          annual_fee: form.compare_annual_fee,
          reward_rate: form.compare_reward_rate,
          lounge: form.compare_lounge,
          fuel: form.compare_fuel,
          forex: form.compare_forex
        },

        visibility: {
          show_on_website: form.show_on_website,
          show_in_partner: form.show_in_partner,
          is_featured: form.is_featured,
          is_popular: form.is_popular
        },

        seo_metadata: {
          meta_title: form.meta_title,
          meta_description: form.meta_description,
          slug: form.slug
        },

        commission_type: "fixed",
        commission_value: parseFloat(form.partner_commission) || 0,
        annual_fee: form.annual_fee
      };

      let res;
      if (editItem) {
        res = await api.put(`/products/${editItem.id}`, payload);
      } else {
        res = await api.post(`/products`, payload);
      }

      if (res.data?.success) {
        const productId = editItem ? editItem.id : res.data.data.id;
        // Save FAQs if any
        if (Array.isArray(form.faqs) && form.faqs.length > 0 && productId) {
          for (const f of form.faqs) {
            if (f.question && f.answer) {
              await api.post(`/products/${productId}/faqs`, {
                faq_id: f.id || undefined,
                question: f.question,
                answer: f.answer
              }).catch(() => {});
            }
          }
        }

        alert(editItem ? "Product updated successfully!" : "Product created successfully!");
        setModalOpen(false);
        fetchProducts();
      }
    } catch (e) {
      alert(e.response?.data?.message || "Failed to save product.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* HEADER */}
      <div style={{
        background: C.card, borderRadius: '20px', padding: '20px 24px', border: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px'
      }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 900, color: C.text, margin: 0 }}>
            {categoryTitle} Management
          </h2>
          <p style={{ fontSize: '13px', color: C.textLight || '#64748B', margin: '4px 0 0' }}>
            Add, edit, de-activate and manage full specification for {categoryTitle.toLowerCase()}
          </p>
        </div>

        <button
          onClick={openAddModal}
          style={{
            padding: '10px 20px', borderRadius: '12px', border: 'none',
            background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', color: '#FFFFFF',
            fontWeight: 800, fontSize: '13.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <MdAdd size={20} />
          <span>+ Add {categoryTitle}</span>
        </button>
      </div>

      {/* SEARCH BAR */}
      <div style={{ background: C.card, borderRadius: '16px', padding: '16px', border: `1px solid ${C.border}` }}>
        <form onSubmit={(e) => { e.preventDefault(); fetchProducts(); }} style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <MdSearch size={20} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: C.textLight }} />
            <input
              type="text"
              placeholder={`Search ${categoryTitle}...`}
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

      {/* TABLE */}
      <div style={{ background: C.card, borderRadius: '20px', border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
          <thead>
            <tr style={{ background: isDark ? C.bgSecondary : '#F8FAFC', borderBottom: `1px solid ${C.border}` }}>
              <th style={{ padding: '14px 16px', fontWeight: 800 }}>Image</th>
              <th style={{ padding: '14px 16px', fontWeight: 800 }}>Product Name</th>
              <th style={{ padding: '14px 16px', fontWeight: 800 }}>Bank</th>
              <th style={{ padding: '14px 16px', fontWeight: 800 }}>Status</th>
              <th style={{ padding: '14px 16px', fontWeight: 800 }}>Commission</th>
              <th style={{ padding: '14px 16px', fontWeight: 800 }}>Visibility</th>
              <th style={{ padding: '14px 16px', fontWeight: 800, textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: C.textLight }}>Loading products...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: C.textLight }}>No products found. Click <strong>+ Add {categoryTitle}</strong> to add one!</td></tr>
            ) : (
              products.map(prod => (
                <tr key={prod.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: '14px 16px' }}>
                    {prod.image_url ? (
                      <img src={prod.image_url} alt={prod.name} style={{ height: '36px', width: '56px', objectFit: 'cover', borderRadius: '6px' }} />
                    ) : (
                      <span style={{ fontSize: '20px' }}>💳</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 800, color: C.text }}>{prod.name}</td>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: C.teal }}>{prod.bank_name || 'Generic'}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <button
                      onClick={() => toggleStatus(prod)}
                      style={{
                        padding: '4px 12px', borderRadius: '10px', fontSize: '11.5px', fontWeight: 800, border: 'none', cursor: 'pointer',
                        background: prod.status === 'Active' ? '#10B98120' : '#EF444420',
                        color: prod.status === 'Active' ? '#10B981' : '#EF4444'
                      }}
                    >
                      {prod.status || (prod.is_active ? 'Active' : 'Inactive')}
                    </button>
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 800, color: '#10B981' }}>₹{prod.commission_value || 0}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: `${C.teal}15`, color: C.teal, fontWeight: 700 }}>
                        {prod.visibility?.show_on_website !== false ? 'Website' : 'Hidden Web'}
                      </span>
                      <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: `${C.teal}15`, color: C.teal, fontWeight: 700 }}>
                        {prod.visibility?.show_in_partner !== false ? 'Partner' : 'Hidden Part'}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                      <button onClick={() => openEditModal(prod)} title="Edit" style={{ padding: '6px 10px', background: `${C.teal}15`, color: C.teal, border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                        <MdEdit size={16} />
                      </button>
                      <button onClick={() => handleDuplicate(prod.id)} title="Duplicate" style={{ padding: '6px 10px', background: `${C.teal}15`, color: C.teal, border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                        <MdContentCopy size={16} />
                      </button>
                      <button onClick={() => handleDelete(prod.id)} title="Delete" style={{ padding: '6px 10px', background: '#EF444415', color: '#EF4444', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                        <MdDelete size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── RICH SPECIFICATION ADD/EDIT MODAL ── */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: C.card, borderRadius: '24px', padding: '28px', maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto', border: `1px solid ${C.border}`, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: C.text, margin: 0 }}>
                {editItem ? `Edit ${form.name}` : `Add New ${categoryTitle}`}
              </h3>
              <button onClick={() => setModalOpen(false)} style={{ background: 'transparent', border: 'none', color: C.textLight, cursor: 'pointer' }}>
                <MdClose size={24} />
              </button>
            </div>

            {/* TAB STRIP */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', borderBottom: `1px solid ${C.border}`, marginBottom: '20px' }}>
              {[
                { id: 'basic', label: 'Basic Info' },
                { id: 'images', label: 'Images & Gallery' },
                { id: 'fees', label: 'Fees & Charges' },
                { id: 'eligibility', label: 'Eligibility' },
                { id: 'commission', label: 'Commission' },
                { id: 'features', label: 'Features' },
                { id: 'benefits', label: 'Benefits' },
                { id: 'documents', label: 'Documents' },
                { id: 'compare', label: 'Compare Specs' },
                { id: 'faqs', label: 'FAQs' },
                { id: 'visibility', label: 'Visibility & SEO' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setModalTab(t.id)}
                  style={{
                    padding: '6px 14px', borderRadius: '8px', border: 'none',
                    background: modalTab === t.id ? C.teal : 'transparent',
                    color: modalTab === t.id ? '#FFF' : C.text,
                    fontWeight: 700, fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* TAB 1: BASIC INFO */}
              {modalTab === 'basic' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={S.label}>Product Name *</label>
                    <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ ...S.input, height: '42px' }} />
                  </div>

                  <div>
                    <label style={S.label}>Issuing Bank (Active Banks Only) *</label>
                    <select value={form.bank_id} onChange={(e) => setForm({ ...form, bank_id: e.target.value })} style={{ ...S.input, height: '42px', fontWeight: 700 }}>
                      <option value="">-- Select Bank --</option>
                      {banks.map(b => <option key={b.id} value={b.id}>{b.name} ({b.short_code})</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={S.label}>Status *</label>
                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={{ ...S.input, height: '42px', fontWeight: 700 }}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  <div>
                    <label style={S.label}>Card / Product Image URL</label>
                    <input type="text" placeholder="https://.../card.png" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} style={{ ...S.input, height: '42px' }} />
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={S.label}>Description</label>
                    <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ ...S.input }} />
                  </div>
                </div>
              )}

              {/* TAB 2: FEES & CHARGES */}
              {modalTab === 'fees' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={S.label}>Joining Fee</label>
                    <input type="text" value={form.joining_fee} onChange={(e) => setForm({ ...form, joining_fee: e.target.value })} style={{ ...S.input, height: '42px' }} />
                  </div>
                  <div>
                    <label style={S.label}>Annual Fee</label>
                    <input type="text" value={form.annual_fee} onChange={(e) => setForm({ ...form, annual_fee: e.target.value })} style={{ ...S.input, height: '42px' }} />
                  </div>
                  <div>
                    <label style={S.label}>Interest Rate</label>
                    <input type="text" value={form.interest_rate} onChange={(e) => setForm({ ...form, interest_rate: e.target.value })} style={{ ...S.input, height: '42px' }} />
                  </div>
                  <div>
                    <label style={S.label}>Late Payment Charges</label>
                    <input type="text" value={form.late_payment_charges} onChange={(e) => setForm({ ...form, late_payment_charges: e.target.value })} style={{ ...S.input, height: '42px' }} />
                  </div>
                  <div>
                    <label style={S.label}>Foreign Markup</label>
                    <input type="text" value={form.foreign_markup} onChange={(e) => setForm({ ...form, foreign_markup: e.target.value })} style={{ ...S.input, height: '42px' }} />
                  </div>
                  <div>
                    <label style={S.label}>Fuel Surcharge</label>
                    <input type="text" value={form.fuel_surcharge} onChange={(e) => setForm({ ...form, fuel_surcharge: e.target.value })} style={{ ...S.input, height: '42px' }} />
                  </div>
                </div>
              )}

              {/* TAB 3: ELIGIBILITY */}
              {modalTab === 'eligibility' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={S.label}>Minimum Age</label>
                    <input type="number" value={form.min_age} onChange={(e) => setForm({ ...form, min_age: e.target.value })} style={{ ...S.input, height: '42px' }} />
                  </div>
                  <div>
                    <label style={S.label}>Maximum Age</label>
                    <input type="number" value={form.max_age} onChange={(e) => setForm({ ...form, max_age: e.target.value })} style={{ ...S.input, height: '42px' }} />
                  </div>
                  <div>
                    <label style={S.label}>Minimum Monthly Income (₹)</label>
                    <input type="number" value={form.min_income} onChange={(e) => setForm({ ...form, min_income: e.target.value })} style={{ ...S.input, height: '42px' }} />
                  </div>
                  <div>
                    <label style={S.label}>Minimum CIBIL Score</label>
                    <input type="number" value={form.cibil_required} onChange={(e) => setForm({ ...form, cibil_required: e.target.value })} style={{ ...S.input, height: '42px' }} />
                  </div>
                </div>
              )}

              {/* TAB 4: COMMISSION */}
              {modalTab === 'commission' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={S.label}>Partner Commission (₹)</label>
                    <input type="number" value={form.partner_commission} onChange={(e) => setForm({ ...form, partner_commission: e.target.value })} style={{ ...S.input, height: '42px' }} />
                  </div>
                  <div>
                    <label style={S.label}>Sub Partner Commission (₹)</label>
                    <input type="number" value={form.sub_partner_commission} onChange={(e) => setForm({ ...form, sub_partner_commission: e.target.value })} style={{ ...S.input, height: '42px' }} />
                  </div>
                  <div>
                    <label style={S.label}>Super Partner Commission (₹)</label>
                    <input type="number" value={form.super_partner_commission} onChange={(e) => setForm({ ...form, super_partner_commission: e.target.value })} style={{ ...S.input, height: '42px' }} />
                  </div>
                  <div>
                    <label style={S.label}>Admin Commission (₹)</label>
                    <input type="number" value={form.admin_commission} onChange={(e) => setForm({ ...form, admin_commission: e.target.value })} style={{ ...S.input, height: '42px' }} />
                  </div>
                </div>
              )}

              {/* TAB 5: FEATURES */}
              {modalTab === 'features' && (
                <div>
                  <label style={S.label}>Select Key Features</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                    {FEATURE_OPTIONS.map(feat => {
                      const checked = form.features.includes(feat);
                      return (
                        <label key={feat} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              const next = checked ? form.features.filter(f => f !== feat) : [...form.features, feat];
                              setForm({ ...form, features: next });
                            }}
                          />
                          <span>{feat}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 6: BENEFITS */}
              {modalTab === 'benefits' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={S.label}>Benefit Cards</label>
                  {form.benefits.map((b, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '10px', background: C.bgSecondary, padding: '10px', borderRadius: '10px' }}>
                      <input type="text" placeholder="Title" value={b.title} onChange={(e) => {
                        const next = [...form.benefits]; next[idx].title = e.target.value; setForm({ ...form, benefits: next });
                      }} style={{ ...S.input, flex: 1 }} />
                      <input type="text" placeholder="Description" value={b.description} onChange={(e) => {
                        const next = [...form.benefits]; next[idx].description = e.target.value; setForm({ ...form, benefits: next });
                      }} style={{ ...S.input, flex: 2 }} />
                    </div>
                  ))}
                  <button type="button" onClick={() => setForm({ ...form, benefits: [...form.benefits, { title: '', description: '' }] })} style={{ padding: '8px 14px', background: C.teal, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-start' }}>
                    + Add Benefit Card
                  </button>
                </div>
              )}

              {/* TAB: IMAGES & GALLERY */}
              {modalTab === 'images' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={S.label}>Card Image URL</label>
                    <input type="text" placeholder="https://.../card.png" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} style={{ ...S.input, height: '42px' }} />
                  </div>
                  <div>
                    <label style={S.label}>Thumbnail URL</label>
                    <input type="text" placeholder="https://.../thumb.png" value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} style={{ ...S.input, height: '42px' }} />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={S.label}>Banner Image URL</label>
                    <input type="text" placeholder="https://.../banner.png" value={form.banner_url} onChange={(e) => setForm({ ...form, banner_url: e.target.value })} style={{ ...S.input, height: '42px' }} />
                  </div>
                </div>
              )}

              {/* TAB 7: DOCUMENTS */}
              {modalTab === 'documents' && (
                <div>
                  <label style={S.label}>Required Documents Checklist</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                    {DOCUMENT_OPTIONS.map(doc => {
                      const checked = form.required_documents.includes(doc);
                      return (
                        <label key={doc} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              const next = checked ? form.required_documents.filter(d => d !== doc) : [...form.required_documents, doc];
                              setForm({ ...form, required_documents: next });
                            }}
                          />
                          <span>{doc}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB: COMPARE SPECS */}
              {modalTab === 'compare' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={S.label}>Annual Fee</label>
                    <input type="text" value={form.compare_annual_fee} onChange={(e) => setForm({ ...form, compare_annual_fee: e.target.value })} style={{ ...S.input, height: '42px' }} />
                  </div>
                  <div>
                    <label style={S.label}>Reward Rate</label>
                    <input type="text" value={form.compare_reward_rate} onChange={(e) => setForm({ ...form, compare_reward_rate: e.target.value })} style={{ ...S.input, height: '42px' }} />
                  </div>
                  <div>
                    <label style={S.label}>Lounge Access</label>
                    <input type="text" value={form.compare_lounge} onChange={(e) => setForm({ ...form, compare_lounge: e.target.value })} style={{ ...S.input, height: '42px' }} />
                  </div>
                  <div>
                    <label style={S.label}>Fuel Waiver</label>
                    <input type="text" value={form.compare_fuel} onChange={(e) => setForm({ ...form, compare_fuel: e.target.value })} style={{ ...S.input, height: '42px' }} />
                  </div>
                  <div>
                    <label style={S.label}>Forex Markup</label>
                    <input type="text" value={form.compare_forex} onChange={(e) => setForm({ ...form, compare_forex: e.target.value })} style={{ ...S.input, height: '42px' }} />
                  </div>
                </div>
              )}

              {/* TAB: FAQS */}
              {modalTab === 'faqs' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={S.label}>Frequently Asked Questions (Unlimited)</label>
                  {(form.faqs || []).map((faq, idx) => (
                    <div key={idx} style={{ background: C.bgSecondary, padding: '12px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="Question"
                        value={faq.question}
                        onChange={(e) => {
                          const next = [...(form.faqs || [])];
                          next[idx].question = e.target.value;
                          setForm({ ...form, faqs: next });
                        }}
                        style={{ ...S.input, height: '38px', fontWeight: 700 }}
                      />
                      <textarea
                        rows={2}
                        placeholder="Answer"
                        value={faq.answer}
                        onChange={(e) => {
                          const next = [...(form.faqs || [])];
                          next[idx].answer = e.target.value;
                          setForm({ ...form, faqs: next });
                        }}
                        style={{ ...S.input }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = (form.faqs || []).filter((_, i) => i !== idx);
                          setForm({ ...form, faqs: next });
                        }}
                        style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, alignSelf: 'flex-end' }}
                      >
                        Remove FAQ
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, faqs: [...(form.faqs || []), { question: '', answer: '' }] })}
                    style={{ padding: '8px 16px', background: C.teal, color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-start' }}
                  >
                    + Add Question & Answer
                  </button>
                </div>
              )}

              {/* TAB 8: VISIBILITY & SEO */}
              {modalTab === 'visibility' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.show_on_website} onChange={(e) => setForm({ ...form, show_on_website: e.target.checked })} />
                    <span>Show on Website</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.show_in_partner} onChange={(e) => setForm({ ...form, show_in_partner: e.target.checked })} />
                    <span>Show in Partner Panel</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} />
                    <span>Featured Product Section</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.is_popular} onChange={(e) => setForm({ ...form, is_popular: e.target.checked })} />
                    <span>Popular Product Section</span>
                  </label>

                  <div>
                    <label style={S.label}>Meta Title (SEO)</label>
                    <input type="text" placeholder="SEO Title" value={form.meta_title} onChange={(e) => setForm({ ...form, meta_title: e.target.value })} style={{ ...S.input, height: '42px' }} />
                  </div>

                  <div>
                    <label style={S.label}>Meta Description (SEO)</label>
                    <textarea rows={2} placeholder="SEO Meta Description" value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} style={{ ...S.input }} />
                  </div>

                  <div>
                    <label style={S.label}>URL Slug</label>
                    <input type="text" placeholder="e.g. hdfc-regalia-gold" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} style={{ ...S.input, height: '42px' }} />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px', borderTop: `1px solid ${C.border}`, paddingTop: '16px' }}>
                <button type="button" onClick={() => setModalOpen(false)} style={{ padding: '10px 18px', borderRadius: '10px', border: `1px solid ${C.border}`, background: 'transparent', color: C.text, fontWeight: 700, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting} style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', background: C.teal, color: '#FFF', fontWeight: 800, cursor: 'pointer' }}>
                  {submitting ? 'Saving...' : 'Save Product'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

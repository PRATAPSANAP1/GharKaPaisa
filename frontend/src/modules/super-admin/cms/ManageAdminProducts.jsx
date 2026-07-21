import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from "../../../services/api";
import { useTheme, makeS } from "../../../contexts/ThemeContext";
import { useActiveBanks } from "../../../contexts/BanksContext";
import { getCleanImageUrl } from "../../../utils/urlHelper";
import { 
  MdAdd, MdSearch, MdEdit, MdDelete, MdVisibility,
  MdStar, MdCheckCircle, MdCancel, MdClose, MdFileUpload,
  MdCheck, MdHelpOutline, MdPreview, MdLink, MdContentCopy, MdOpenInNew, MdLaunch
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

const CARD_NETWORKS = ["Visa", "Mastercard", "RuPay", "American Express", "Diners Club"];
const CARD_VARIANTS = ["Classic", "Gold", "Platinum", "Signature", "World", "Infinite", "Select", "Privilege", "Metal"];
const BEST_FOR_OPTIONS = ["Cashback", "Travel", "Shopping", "Fuel", "Rewards", "Business", "Students", "Premium", "Golf", "Dining"];
const BADGE_OPTIONS = ["New", "Hot", "Editor's Choice", "Limited Offer", "Best Seller", "Popular"];

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
  // Filters State
  const [bankFilter, setBankFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [networkFilter, setNetworkFilter] = useState("All");
  const [feeFilter, setFeeFilter] = useState("All");

  const [page, setPage] = useState(1);
  const itemsPerPage = 25;

  // Reset page to 1 on filter changes
  useEffect(() => {
    setPage(1);
  }, [activeCategory, search, bankFilter, typeFilter, statusFilter, networkFilter, feeFilter]);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalTab, setModalTab] = useState("basic"); // basic, fees, benefits, documents, marketing, seo, preview

  // File Upload State
  const [cardImageFile, setCardImageFile] = useState(null);

  // Form State
  const [form, setForm] = useState({
    name: "",
    bank_id: "",
    category: activeCategory,
    sub_category: "Core Cards",
    description: "",
    image_url: "",
    status: "Active",
    is_active: true,

    // Card Specifics
    card_network: "Visa",
    card_variant: "Platinum",
    is_lifetime_free: false,
    best_for: "Cashback",
    welcome_benefits: "₹500 Gift Voucher on first transaction",

    // Fees
    joining_fee: "₹0",
    annual_fee: "₹500 (Waived on ₹50,000 spend)",
    interest_rate: "3.5% p.m.",

    // Eligibility
    min_age: 21,
    max_age: 60,
    min_income: 25000,
    cibil_required: 750,

    // Benefits
    features: ["5% Cashback on top merchants", "1% Fuel Surcharge Waiver", "4 Complimentary Lounge Access"],
    benefits: [
      { title: "Cashback Rewards", description: "Earn up to 5% cashback on online shopping" },
      { title: "Lounge Visits", description: "4 free domestic airport lounge passes per year" }
    ],
    compare_reward_rate: "5% Cashback",
    compare_lounge: "4 Visits/Year",

    // Documents & FAQs
    required_documents: ["PAN Card", "Aadhaar Card", "Salary Slip"],
    faqs: [
      { question: "What is the annual fee for this card?", answer: "The annual fee is ₹500, which is waived on spending ₹50,000 in a year." }
    ],

    // Marketing & Badges
    show_on_website: true,
    show_in_partner: true,
    is_featured: false,
    is_popular: false,
    is_recommended: false,
    is_trending: false,
    badge: "Hot",
    display_order: 1,

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
          category: activeCategory === 'credit_card' ? '%card%' :
                    activeCategory === 'loans' ? '%loan%' :
                    activeCategory === 'insurance' ? '%insurance%' :
                    activeCategory,
          is_active: 'all',
          search: search.trim() || undefined,
          limit: 1000
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

  // Auto-generate slug when name changes if slug hasn't been manually edited
  const handleNameChange = (newName) => {
    const autoSlug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setForm(prev => ({
      ...prev,
      name: newName,
      slug: editItem ? prev.slug : autoSlug,
      meta_title: prev.meta_title || `${newName} - Apply Online | GharKaPaisa`
    }));
  };

  const openAddModal = () => {
    setEditItem(null);
    setCardImageFile(null);
    setForm({
      name: "",
      bank_id: banks[0]?.id || "",
      category: activeCategory,
      sub_category: "Core Cards",
      description: "",
      image_url: "",
      status: "Active",
      is_active: true,

      card_network: "Visa",
      card_variant: "Platinum",
      is_lifetime_free: false,
      best_for: "Cashback",
      welcome_benefits: "₹500 Gift Voucher on first transaction",

      joining_fee: "₹0",
      annual_fee: "₹500 (Waived on ₹50,000 spend)",
      interest_rate: "3.5% p.m.",

      min_age: 21,
      max_age: 60,
      min_income: 25000,
      cibil_required: 750,

      features: ["5% Cashback on top merchants", "1% Fuel Surcharge Waiver", "4 Complimentary Lounge Access"],
      benefits: [
        { title: "Cashback Rewards", description: "Earn up to 5% cashback on online shopping" },
        { title: "Lounge Visits", description: "4 free domestic airport lounge passes per year" }
      ],
      compare_reward_rate: "5% Cashback",
      compare_lounge: "4 Visits/Year",

      required_documents: ["PAN Card", "Aadhaar Card", "Salary Slip"],
      faqs: [],

      show_on_website: true,
      show_in_partner: true,
      is_featured: false,
      is_popular: false,
      is_recommended: false,
      is_trending: false,
      badge: "Hot",
      display_order: 1,

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
    const compare = item.compare_specs || {};
    const vis = item.visibility || {};
    const seo = item.seo_metadata || {};

    setForm({
      name: item.name || "",
      bank_id: item.bank_id || "",
      category: item.category || activeCategory,
      sub_category: item.sub_category || "Core Cards",
      description: item.description || "",
      image_url: item.image_url || "",
      status: item.status || "Active",
      is_active: item.is_active !== undefined ? item.is_active : true,

      card_network: item.card_network || "Visa",
      card_variant: item.card_variant || "Platinum",
      is_lifetime_free: item.is_lifetime_free || false,
      best_for: item.best_for || "Cashback",
      welcome_benefits: item.welcome_benefits || "",

      joining_fee: fees.joining_fee || item.joining_fee || "₹0",
      annual_fee: fees.annual_fee || item.annual_fee || "₹500",
      interest_rate: fees.interest_rate || item.interest_rate || "3.5% p.m.",

      min_age: elig.min_age || item.min_age || 21,
      max_age: elig.max_age || item.max_age || 60,
      min_income: elig.min_income || item.min_income || 25000,
      cibil_required: elig.cibil_required || 750,

      features: Array.isArray(item.features_list) ? item.features_list : (Array.isArray(item.features) ? item.features : []),
      benefits: Array.isArray(item.benefits_list) ? item.benefits_list : [],
      compare_reward_rate: compare.reward_rate || "",
      compare_lounge: compare.lounge || "",

      required_documents: Array.isArray(item.required_documents) ? item.required_documents : [],
      faqs: [],

      show_on_website: vis.show_on_website !== undefined ? vis.show_on_website : true,
      show_in_partner: vis.show_in_partner !== undefined ? vis.show_in_partner : true,
      is_featured: vis.is_featured || item.featured || false,
      is_popular: vis.is_popular || false,
      is_recommended: item.is_recommended || false,
      is_trending: item.is_trending || false,
      badge: item.badge || "Hot",
      display_order: item.display_order || 1,

      meta_title: seo.meta_title || item.seo_title || "",
      meta_description: seo.meta_description || item.seo_description || "",
      slug: item.slug || "",
    });

    api.get(`/products/${item.id}/faqs`).then(res => {
      if (res.data?.success && Array.isArray(res.data.data)) {
        setForm(prev => ({ ...prev, faqs: res.data.data }));
      }
    }).catch(() => {});

    setModalTab("basic");
    setModalOpen(true);
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
      const autoSlug = form.slug?.trim() || form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const payload = {
        name: form.name.trim(),
        bank_id: form.bank_id,
        category: activeCategory,
        sub_category: form.sub_category,
        description: form.description,
        image_url: form.image_url,
        status: form.status,
        is_active: form.status === "Active",

        card_network: form.card_network,
        card_variant: form.card_variant,
        is_lifetime_free: form.is_lifetime_free,
        best_for: form.best_for,
        welcome_benefits: form.welcome_benefits,

        annual_fee: form.annual_fee,
        joining_fee: form.joining_fee,
        interest_rate: form.interest_rate,
        min_age: parseInt(form.min_age),
        max_age: parseInt(form.max_age),
        min_income: parseFloat(form.min_income),

        features_list: form.features,
        features: form.features,
        benefits_list: form.benefits,
        required_documents: form.required_documents,

        compare_specs: {
          annual_fee: form.annual_fee,
          reward_rate: form.compare_reward_rate,
          lounge: form.compare_lounge,
        },

        visibility: {
          show_on_website: form.show_on_website,
          show_in_partner: form.show_in_partner,
          is_featured: form.is_featured,
          is_popular: form.is_popular
        },

        seo_metadata: {
          meta_title: form.meta_title || `${form.name} - Apply Online | GharKaPaisa`,
          meta_description: form.meta_description || form.description,
          slug: autoSlug
        },

        slug: autoSlug,
        badge: form.badge,
        display_order: parseInt(form.display_order) || 1,
        is_recommended: form.is_recommended,
        is_trending: form.is_trending,
        featured: form.is_featured
      };

      let res;
      if (cardImageFile) {
        const formData = new FormData();
        formData.append('image', cardImageFile);
        Object.keys(payload).forEach(key => {
          if (typeof payload[key] === 'object' && payload[key] !== null) {
            formData.append(key, JSON.stringify(payload[key]));
          } else if (payload[key] !== undefined && payload[key] !== null) {
            formData.append(key, payload[key]);
          }
        });
        if (editItem) {
          res = await api.put(`/products/${editItem.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        } else {
          res = await api.post(`/products`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        }
      } else {
        if (editItem) {
          res = await api.put(`/products/${editItem.id}`, payload);
        } else {
          res = await api.post(`/products`, payload);
        }
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

        setModalOpen(false);
        fetchProducts();
      }
    } catch (e) {
      alert(e.response?.data?.message || "Failed to save product.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedBank = banks.find(b => b.id === form.bank_id);

  // Compute Filtered Products
  const filteredProducts = products.filter(p => {
    if (bankFilter !== "All" && p.bank_id !== bankFilter) return false;
    if (typeFilter !== "All" && p.sub_category !== typeFilter) return false;
    const itemStatus = p.status || (p.is_active ? "Active" : "Inactive");
    if (statusFilter !== "All" && itemStatus !== statusFilter) return false;
    if (networkFilter !== "All" && p.card_network !== networkFilter) return false;
    if (feeFilter === "ltf" && !p.is_lifetime_free) return false;
    if (feeFilter === "paid" && p.is_lifetime_free) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* HEADER */}
      <div style={{
        background: C.card, borderRadius: '20px', padding: '20px 24px', border: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 900, color: C.text, margin: 0 }}>
              {categoryTitle} Management
            </h2>
            <span style={{ fontSize: '12px', fontWeight: 800, padding: '4px 10px', borderRadius: '12px', background: `${C.teal}15`, color: C.teal }}>
              {filteredProducts.length} / {products.length} Records
            </span>
          </div>
          <p style={{ fontSize: '13px', color: C.textLight || '#64748B', margin: '4px 0 0' }}>
            Create, edit and manage credit cards and product specifications dynamically
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
          <span>Add {categoryTitle}</span>
        </button>
      </div>

      {/* SEARCH & FILTER CONTROLS */}
      <div style={{ background: C.card, borderRadius: '16px', padding: '16px', border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <form onSubmit={(e) => { e.preventDefault(); fetchProducts(); }} style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <MdSearch size={20} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: C.textLight }} />
            <input
              type="text"
              placeholder={`Search ${categoryTitle} by name, bank, or benefits...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...S.input, paddingLeft: '40px', height: '44px' }}
            />
          </div>
          <button type="submit" style={{ padding: '0 20px', borderRadius: '10px', border: 'none', background: C.teal, color: '#FFF', fontWeight: 800, cursor: 'pointer' }}>
            Search
          </button>
        </form>

        {/* MULTI-FILTER DROPDOWNS */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', paddingTop: '10px', borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: C.textLight }}>Bank</span>
            <select value={bankFilter} onChange={(e) => setBankFilter(e.target.value)} style={{ ...S.input, height: '36px', fontSize: '12.5px', fontWeight: 700 }}>
              <option value="All">All Banks</option>
              {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: C.textLight }}>Card Type</span>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ ...S.input, height: '36px', fontSize: '12.5px', fontWeight: 700 }}>
              <option value="All">All Card Types</option>
              <option value="Core Cards">Core Cards</option>
              <option value="Co-Branded Cards">Co-Branded Cards</option>
              <option value="Secured Cards">Secured Cards</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: C.textLight }}>Status</span>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...S.input, height: '36px', fontSize: '12.5px', fontWeight: 700 }}>
              <option value="All">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: C.textLight }}>Network</span>
            <select value={networkFilter} onChange={(e) => setNetworkFilter(e.target.value)} style={{ ...S.input, height: '36px', fontSize: '12.5px', fontWeight: 700 }}>
              <option value="All">All Networks</option>
              {CARD_NETWORKS.map(net => <option key={net} value={net}>{net}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: C.textLight }}>Annual Fee</span>
            <select value={feeFilter} onChange={(e) => setFeeFilter(e.target.value)} style={{ ...S.input, height: '36px', fontSize: '12.5px', fontWeight: 700 }}>
              <option value="All">All Fee Options</option>
              <option value="ltf">Lifetime Free Only</option>
              <option value="paid">Paid Annual Fee</option>
            </select>
          </div>

          {(bankFilter !== "All" || typeFilter !== "All" || statusFilter !== "All" || networkFilter !== "All" || feeFilter !== "All") && (
            <button
              onClick={() => {
                setBankFilter("All");
                setTypeFilter("All");
                setStatusFilter("All");
                setNetworkFilter("All");
                setFeeFilter("All");
              }}
              style={{ marginTop: '16px', padding: '6px 12px', background: '#EF444420', color: '#EF4444', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* PRODUCT LIST TABLE */}
      <div style={{ background: C.card, borderRadius: '20px', border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
          <thead>
            <tr style={{ background: isDark ? C.bgSecondary : '#F8FAFC', borderBottom: `1px solid ${C.border}` }}>
              <th style={{ padding: '14px 16px', fontWeight: 800 }}>Image</th>
              <th style={{ padding: '14px 16px', fontWeight: 800 }}>Product Name</th>
              <th style={{ padding: '14px 16px', fontWeight: 800 }}>Bank</th>
              <th style={{ padding: '14px 16px', fontWeight: 800 }}>Type</th>
              <th style={{ padding: '14px 16px', fontWeight: 800 }}>Fee</th>
              <th style={{ padding: '14px 16px', fontWeight: 800 }}>Status</th>
              <th style={{ padding: '14px 16px', fontWeight: 800, textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: C.textLight }}>Loading products...</td></tr>
            ) : filteredProducts.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: C.textLight }}>No products match your selected filters. Click <strong>Reset Filters</strong> or add a new card!</td></tr>
            ) : (
              paginatedProducts.map(prod => (
                <tr key={prod.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: '14px 16px' }}>
                    {prod.image_url ? (
                      <img src={getCleanImageUrl(prod.image_url)} alt={prod.name} style={{ height: '36px', width: '56px', objectFit: 'contain', borderRadius: '6px' }} />
                    ) : (
                      <span style={{ fontSize: '20px' }}>💳</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 800, color: C.text }}>
                    {prod.name}
                    {prod.badge && <span style={{ marginLeft: '8px', fontSize: '10px', padding: '2px 6px', background: '#F59E0B20', color: '#D97706', borderRadius: '4px', fontWeight: 800 }}>{prod.badge}</span>}
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: C.teal }}>{prod.bank_name || 'Generic'}</td>
                  <td style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 700 }}>{prod.sub_category || 'Core Cards'}</td>
                  <td style={{ padding: '14px 16px', fontWeight: 700 }}>{prod.is_lifetime_free ? <span style={{ color: '#10B981' }}>Lifetime Free</span> : (prod.annual_fee || '₹500')}</td>
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
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                      <button onClick={() => openEditModal(prod)} title="Edit" style={{ padding: '6px 10px', background: `${C.teal}15`, color: C.teal, border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                        <MdEdit size={16} />
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", marginTop: "16px" }}>
          <button 
            disabled={page <= 1} 
            onClick={() => setPage(page - 1)} 
            style={{ 
              padding: '8px 16px', 
              borderRadius: '8px', 
              border: `1px solid ${C.border}`, 
              background: C.card, 
              color: C.text, 
              fontWeight: 700, 
              fontSize: '13px', 
              opacity: page <= 1 ? 0.5 : 1, 
              cursor: page <= 1 ? 'not-allowed' : 'pointer' 
            }}
          >
            ← Previous
          </button>
          <span style={{ fontSize: "14px", fontWeight: 600, color: C.textLight }}>Page {page} of {totalPages}</span>
          <button 
            disabled={page >= totalPages} 
            onClick={() => setPage(page + 1)} 
            style={{ 
              padding: '8px 16px', 
              borderRadius: '8px', 
              border: `1px solid ${C.border}`, 
              background: C.card, 
              color: C.text, 
              fontWeight: 700, 
              fontSize: '13px', 
              opacity: page >= totalPages ? 0.5 : 1, 
              cursor: page >= totalPages ? 'not-allowed' : 'pointer' 
            }}
          >
            Next →
          </button>
        </div>
      )}

      {/* ── REDESIGNED 7-TAB PRODUCT MODAL ── */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: C.card, borderRadius: '24px', padding: '28px', maxWidth: '850px', width: '100%', maxHeight: '90vh', overflowY: 'auto', border: `1px solid ${C.border}`, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            
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
                { id: 'basic', label: '1. Basic Info' },
                { id: 'fees', label: '2. Fees & Eligibility' },
                { id: 'benefits', label: '3. Benefits' },
                { id: 'documents', label: '4. Docs & FAQs' },
                { id: 'marketing', label: '5. Marketing & Links 🔗' },
                { id: 'seo', label: '6. SEO' },
                { id: 'preview', label: '7. Live Preview 👁️' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setModalTab(t.id)}
                  style={{
                    padding: '8px 16px', borderRadius: '10px', border: 'none',
                    background: modalTab === t.id ? C.teal : (isDark ? '#334155' : '#F1F5F9'),
                    color: modalTab === t.id ? '#FFF' : C.text,
                    fontWeight: 800, fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap',
                    transition: 'all 0.2s'
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
                    <input
                      type="text"
                      required
                      placeholder="e.g. HDFC Regalia Gold"
                      value={form.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      style={{ ...S.input, height: '42px' }}
                    />
                  </div>

                  <div>
                    <label style={S.label}>Issuing Bank *</label>
                    <select
                      required
                      value={form.bank_id}
                      onChange={(e) => setForm({ ...form, bank_id: e.target.value })}
                      style={{ ...S.input, height: '42px', fontWeight: 700 }}
                    >
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
                    <label style={S.label}>Credit Card Type *</label>
                    <select
                      required
                      value={form.sub_category}
                      onChange={(e) => setForm({ ...form, sub_category: e.target.value })}
                      style={{ ...S.input, height: '42px', fontWeight: 700 }}
                    >
                      <option value="Core Cards">Core Card</option>
                      <option value="Co-Branded Cards">Co-Branded Card</option>
                      <option value="Secured Cards">Secured Card</option>
                    </select>
                  </div>

                  <div>
                    <label style={S.label}>Card Network</label>
                    <select value={form.card_network} onChange={(e) => setForm({ ...form, card_network: e.target.value })} style={{ ...S.input, height: '42px', fontWeight: 700 }}>
                      {CARD_NETWORKS.map(net => <option key={net} value={net}>{net}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={S.label}>Card Variant</label>
                    <select value={form.card_variant} onChange={(e) => setForm({ ...form, card_variant: e.target.value })} style={{ ...S.input, height: '42px', fontWeight: 700 }}>
                      {CARD_VARIANTS.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={S.label}>Card Image (Upload File or URL)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setCardImageFile(e.target.files[0])}
                      style={{ ...S.input, padding: '8px', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      placeholder="Or paste image URL (https://.../card.png)"
                      value={form.image_url}
                      onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                      style={{ ...S.input, height: '38px', marginTop: '6px' }}
                    />
                    {(cardImageFile || form.image_url) && (
                      <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                          src={cardImageFile ? URL.createObjectURL(cardImageFile) : getCleanImageUrl(form.image_url)}
                          alt="Card Preview"
                          style={{ width: '80px', height: '50px', objectFit: 'contain', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                          {cardImageFile ? `File: ${cardImageFile.name}` : 'URL Preview'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '24px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 800, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={form.is_lifetime_free}
                        onChange={(e) => setForm({ ...form, is_lifetime_free: e.target.checked, annual_fee: e.target.checked ? 'Lifetime Free' : form.annual_fee })}
                        style={{ width: '18px', height: '18px' }}
                      />
                      <span style={{ color: '#10B981' }}>Is Lifetime Free?</span>
                    </label>
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={S.label}>Short Card Description</label>
                    <textarea rows={3} placeholder="Write 1-2 line summary of the card..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ ...S.input }} />
                  </div>
                </div>
              )}

              {/* TAB 2: FEES & ELIGIBILITY */}
              {modalTab === 'fees' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={S.label}>Joining Fee</label>
                    <input type="text" placeholder="e.g. ₹0 or ₹500" value={form.joining_fee} onChange={(e) => setForm({ ...form, joining_fee: e.target.value })} style={{ ...S.input, height: '42px' }} />
                  </div>
                  <div>
                    <label style={S.label}>Annual Fee</label>
                    <input type="text" placeholder="e.g. ₹500 (Waived on ₹50k spend)" value={form.annual_fee} onChange={(e) => setForm({ ...form, annual_fee: e.target.value })} style={{ ...S.input, height: '42px' }} />
                  </div>
                  <div>
                    <label style={S.label}>Minimum Monthly Income (₹)</label>
                    <input type="number" placeholder="25000" value={form.min_income} onChange={(e) => setForm({ ...form, min_income: e.target.value })} style={{ ...S.input, height: '42px' }} />
                  </div>
                  <div>
                    <label style={S.label}>Minimum CIBIL Score</label>
                    <input type="number" placeholder="750" value={form.cibil_required} onChange={(e) => setForm({ ...form, cibil_required: e.target.value })} style={{ ...S.input, height: '42px' }} />
                  </div>
                  <div>
                    <label style={S.label}>Minimum Age</label>
                    <input type="number" value={form.min_age} onChange={(e) => setForm({ ...form, min_age: e.target.value })} style={{ ...S.input, height: '42px' }} />
                  </div>
                  <div>
                    <label style={S.label}>Maximum Age</label>
                    <input type="number" value={form.max_age} onChange={(e) => setForm({ ...form, max_age: e.target.value })} style={{ ...S.input, height: '42px' }} />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={S.label}>Interest Rate (Optional)</label>
                    <input type="text" placeholder="e.g. 3.5% p.m." value={form.interest_rate} onChange={(e) => setForm({ ...form, interest_rate: e.target.value })} style={{ ...S.input, height: '42px' }} />
                  </div>
                </div>
              )}

              {/* TAB 3: BENEFITS */}
              {modalTab === 'benefits' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={S.label}>Best For Category</label>
                      <select value={form.best_for} onChange={(e) => setForm({ ...form, best_for: e.target.value })} style={{ ...S.input, height: '42px', fontWeight: 700 }}>
                        {BEST_FOR_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={S.label}>Reward Rate Tag</label>
                      <input type="text" placeholder="e.g. 5% Cashback" value={form.compare_reward_rate} onChange={(e) => setForm({ ...form, compare_reward_rate: e.target.value })} style={{ ...S.input, height: '42px' }} />
                    </div>
                    <div>
                      <label style={S.label}>Lounge Access Tag</label>
                      <input type="text" placeholder="e.g. 4 Passes/Year" value={form.compare_lounge} onChange={(e) => setForm({ ...form, compare_lounge: e.target.value })} style={{ ...S.input, height: '42px' }} />
                    </div>
                  </div>

                  <div>
                    <label style={S.label}>Welcome Benefits</label>
                    <input type="text" placeholder="e.g. Amazon voucher worth ₹500" value={form.welcome_benefits} onChange={(e) => setForm({ ...form, welcome_benefits: e.target.value })} style={{ ...S.input, height: '42px' }} />
                  </div>

                  <div>
                    <label style={S.label}>Key Features (Bullets on Card List)</label>
                    {form.features.map((feat, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                        <input
                          type="text"
                          placeholder={`Feature #${idx + 1}`}
                          value={feat}
                          onChange={(e) => {
                            const next = [...form.features];
                            next[idx] = e.target.value;
                            setForm({ ...form, features: next });
                          }}
                          style={{ ...S.input, flex: 1, height: '40px' }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const next = form.features.filter((_, i) => i !== idx);
                            setForm({ ...form, features: next });
                          }}
                          style={{ padding: '6px 12px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, features: [...form.features, ''] })}
                      style={{ padding: '6px 14px', background: C.teal, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      + Add Feature
                    </button>
                  </div>

                  <div>
                    <label style={S.label}>Benefit Cards (Title & Description)</label>
                    {form.benefits.map((b, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '10px', background: isDark ? '#1e293b' : '#f8fafc', padding: '10px', borderRadius: '10px', marginBottom: '8px' }}>
                        <input
                          type="text"
                          placeholder="Title"
                          value={b.title}
                          onChange={(e) => {
                            const next = [...form.benefits];
                            next[idx].title = e.target.value;
                            setForm({ ...form, benefits: next });
                          }}
                          style={{ ...S.input, flex: 1, height: '40px' }}
                        />
                        <input
                          type="text"
                          placeholder="Description"
                          value={b.description}
                          onChange={(e) => {
                            const next = [...form.benefits];
                            next[idx].description = e.target.value;
                            setForm({ ...form, benefits: next });
                          }}
                          style={{ ...S.input, flex: 2, height: '40px' }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const next = form.benefits.filter((_, i) => i !== idx);
                            setForm({ ...form, benefits: next });
                          }}
                          style={{ padding: '6px 12px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, benefits: [...form.benefits, { title: '', description: '' }] })}
                      style={{ padding: '6px 14px', background: C.teal, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      + Add Benefit Card
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: DOCUMENTS & FAQS */}
              {modalTab === 'documents' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={S.label}>Required Documents Checklist</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
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

                  <div>
                    <label style={S.label}>Frequently Asked Questions (Unlimited)</label>
                    {(form.faqs || []).map((faq, idx) => (
                      <div key={idx} style={{ background: isDark ? '#1e293b' : '#f8fafc', padding: '10px', borderRadius: '10px', marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
                      style={{ padding: '6px 14px', background: C.teal, color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      + Add Question & Answer
                    </button>
                  </div>
                </div>
              )}

               {/* TAB 5: MARKETING & LINKS */}
              {modalTab === 'marketing' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={S.label}>Card Badge</label>
                    <select value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} style={{ ...S.input, height: '42px', fontWeight: 700 }}>
                      <option value="">-- No Badge --</option>
                      {BADGE_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={S.label}>Display Priority Order</label>
                    <input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: e.target.value })} style={{ ...S.input, height: '42px' }} />
                  </div>

                  <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', background: isDark ? '#1e293b' : '#f8fafc', padding: '16px', borderRadius: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}>
                      <input type="checkbox" checked={form.show_on_website} onChange={(e) => setForm({ ...form, show_on_website: e.target.checked })} />
                      <span>Show on Home Page</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}>
                      <input type="checkbox" checked={form.show_in_partner} onChange={(e) => setForm({ ...form, show_in_partner: e.target.checked })} />
                      <span>Show on Partner Page</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}>
                      <input type="checkbox" checked={form.is_popular} onChange={(e) => setForm({ ...form, is_popular: e.target.checked })} />
                      <span>Popular Credit Card Section</span>
                    </label>
                  </div>

                  {/* APPLICATION LINKS (Home Page & Partner Page) */}
                  <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '14px', background: isDark ? '#0f172a' : '#f1f5f9', padding: '16px', borderRadius: '12px', border: `1px solid ${C.border}` }}>
                    <div style={{ fontWeight: 800, fontSize: '13.5px', color: C.text, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      🔗 Credit Card Application Links
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={S.label}>Home Page Link (Public Application URL)</label>
                        <input
                          type="url"
                          placeholder="https://bank.com/apply/credit-card-home"
                          value={form.public_url || ''}
                          onChange={(e) => setForm({ ...form, public_url: e.target.value })}
                          style={{ ...S.input, height: '42px' }}
                        />
                      </div>

                      <div>
                        <label style={S.label}>Partner Page Link (Partner Portal URL)</label>
                        <input
                          type="url"
                          placeholder="https://bank.com/apply/credit-card-partner"
                          value={form.partner_url || ''}
                          onChange={(e) => setForm({ ...form, partner_url: e.target.value })}
                          style={{ ...S.input, height: '42px' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={S.label}>Apply Button Display Label</label>
                        <input
                          type="text"
                          placeholder="Apply Now"
                          value={form.button_text || 'Apply Now'}
                          onChange={(e) => setForm({ ...form, button_text: e.target.value })}
                          style={{ ...S.input, height: '42px' }}
                        />
                      </div>

                      <div>
                        <label style={S.label}>Redirect Target Window</label>
                        <select
                          value={form.redirect_type || 'new_tab'}
                          onChange={(e) => setForm({ ...form, redirect_type: e.target.value })}
                          style={{ ...S.input, height: '42px', fontWeight: 700 }}
                        >
                          <option value="new_tab">Open in New Tab</option>
                          <option value="same_tab">Open in Same Tab</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: SEO */}
              {modalTab === 'seo' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={S.label}>URL Slug (Auto-generated)</label>
                    <input type="text" placeholder="e.g. hdfc-regalia-gold" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} style={{ ...S.input, height: '42px' }} />
                  </div>

                  <div>
                    <label style={S.label}>Meta Title</label>
                    <input type="text" placeholder="SEO Title" value={form.meta_title} onChange={(e) => setForm({ ...form, meta_title: e.target.value })} style={{ ...S.input, height: '42px' }} />
                  </div>

                  <div>
                    <label style={S.label}>Meta Description</label>
                    <textarea rows={3} placeholder="SEO Meta Description" value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} style={{ ...S.input }} />
                  </div>
                </div>
              )}

              {/* TAB 7: LIVE PREVIEW */}
              {modalTab === 'preview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, margin: 0, color: C.textLight }}>Live Website Card Preview:</h4>
                  
                  <div style={{
                    background: isDark ? '#1e293b' : '#ffffff',
                    borderRadius: '20px',
                    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                    padding: '20px',
                    maxWidth: '400px',
                    margin: '0 auto',
                    width: '100%',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: selectedBank?.theme_color || '#2563EB', textTransform: 'uppercase' }}>
                        {form.sub_category}
                      </span>
                      {form.badge && (
                        <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '12px', background: '#F59E0B20', color: '#D97706' }}>
                          ★ {form.badge}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
                      <div style={{ width: '80px', height: '52px', borderRadius: '10px', background: isDark ? '#0f172a' : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>
                        <img
                          src={cardImageFile ? URL.createObjectURL(cardImageFile) : getCleanImageUrl(form.image_url || selectedBank?.logo_url)}
                          alt="Preview"
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 4px 0' }}>{form.name || "Card Name"}</h3>
                        <p style={{ fontSize: '12px', color: form.is_lifetime_free ? '#10B981' : '#64748b', margin: 0, fontWeight: 700 }}>
                          {form.is_lifetime_free ? 'Lifetime Free' : form.annual_fee}
                        </p>
                      </div>
                    </div>

                    <p style={{ fontSize: '13px', color: isDark ? '#cbd5e1' : '#475569', margin: '0 0 12px 0', lineHeight: 1.4 }}>
                      {form.description || "Card description goes here..."}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                      {form.features.filter(f => f).slice(0, 3).map((f, i) => (
                        <div key={i} style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: isDark ? '#94a3b8' : '#64748b' }}>
                          <MdCheckCircle size={14} style={{ color: '#10B981', flexShrink: 0 }} />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: selectedBank?.button_color || '#2563EB',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      Apply Now
                    </button>
                  </div>
                </div>
              )}

              {/* ACTION FOOTER */}
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

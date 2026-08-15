import React, { useState, useEffect } from 'react';
import api from "../../../services/api";
import { useTheme, makeS } from "../../../contexts/ThemeContext";
import { Icons } from "../../../components/Icon/PartnerIcons";
import { ChevronDown, ChevronRight, Edit2, Check, X } from 'lucide-react';

export default function ManageCommissions() {
  const { C, isDark } = useTheme();
  const S = makeS(C);

  const [products, setProducts] = useState([]);
  const [partners, setPartners] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  // Tab control: 'overrides', 'partners', 'base', 'team-splits'
  const [activeTab, setActiveTab] = useState("overrides");
  
  // Search & Filter State for Partners/Team Members
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Selection State (for Bulk Actions)
  const [selectedPartnerIds, setSelectedPartnerIds] = useState([]);

  // Splits Config State
  const [childPct, setChildPct] = useState(90);
  const [parentPct, setParentPct] = useState(10);
  const [savingSplits, setSavingSplits] = useState(false);
  
  // Partner Overview / Hierarchy State for DSA Team Splits Tab
  const [partnersOverview, setPartnersOverview] = useState([]);
  const [expandedPartners, setExpandedPartners] = useState({});
  const [teamSearch, setTeamSearch] = useState("");
  const [editingMember, setEditingMember] = useState(null);
  const [newRate, setNewRate] = useState("");
  const [savingRate, setSavingRate] = useState(false);

  // View Assigned Cards Payout Modal State
  const [viewCardsRule, setViewCardsRule] = useState(null);
  const [viewCardsSearch, setViewCardsSearch] = useState("");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [form, setForm] = useState({
    product_id: "",
    product_ids: [], // for multi-product selection
    Partner_id: "", // empty or 'global' means Global Override
    partner_ids: [], // for multiple partner selection
    commission_type: "fixed",
    commission_value: "",
    effective_from: new Date().toISOString().split("T")[0],
    effective_to: "",
  });

  // Product search state
  const [productSearch, setProductSearch] = useState("");
  
  // Partner filter state
  const [partnerRoleFilter, setPartnerRoleFilter] = useState("all"); // all, partners, team_members

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const [prodRes, partnerRes, rulesRes, settingsRes, overviewRes] = await Promise.all([
        api.get("/products", { params: { is_active: "all", limit: 200 } }),
        api.get("/admin/partners", { params: { limit: 1000 } }),
        api.get("/admin/commission-rules"),
        api.get("/settings"),
        api.get("/superadmin/partners-commission-overview").catch(() => ({ data: { data: [] } }))
      ]);
      
      if (prodRes.data?.success) setProducts(prodRes.data.data);
      if (partnerRes.data?.success) setPartners(partnerRes.data.data || []);
      if (rulesRes.data?.success) setRules(rulesRes.data.data || []);
      if (overviewRes.data?.success) setPartnersOverview(overviewRes.data.data || []);
      
      if (settingsRes.data?.success) {
        const settings = settingsRes.data.data;
        if (settings.team_commission_child_pct) {
          setChildPct(parseFloat(settings.team_commission_child_pct));
        }
        if (settings.team_commission_parent_pct) {
          setParentPct(parseFloat(settings.team_commission_parent_pct));
        }
      }
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

  const handleSaveSplits = async (e) => {
    e.preventDefault();
    if (childPct + parentPct !== 100) {
      alert("Child % and Parent % must add up to exactly 100%");
      return;
    }
    setSavingSplits(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await Promise.all([
        api.post("/settings", { key: "team_commission_child_pct", value: childPct.toString() }),
        api.post("/settings", { key: "team_commission_parent_pct", value: parentPct.toString() })
      ]);
      setSuccessMsg("DSA Team commission splits updated successfully.");
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to update team commission splits");
    } finally {
      setSavingSplits(false);
    }
  };

  const togglePartnerExpand = (partnerId) => {
    setExpandedPartners(prev => ({
      ...prev,
      [partnerId]: !prev[partnerId]
    }));
  };

  const handleSaveMemberRate = async (memberId) => {
    const rateNum = parseFloat(newRate);
    if (isNaN(rateNum) || rateNum < 0 || rateNum > 100) {
      alert("Commission percentage must be between 0 and 100%");
      return;
    }
    setSavingRate(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await api.patch(`/team/${memberId}/commission-rate`, { commission_rate: rateNum });
      if (res.data?.success) {
        setSuccessMsg(res.data.message || "Team member commission rate updated successfully.");
        setEditingMember(null);
        fetchData();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to update team member commission rate");
    } finally {
      setSavingRate(false);
    }
  };

  const handleOpenModal = (targetPartnerId = "") => {
    setForm({
      product_id: products[0]?.id || "",
      product_ids: products[0]?.id ? [products[0]?.id] : [],
      Partner_id: targetPartnerId || "",
      partner_ids: targetPartnerId ? [targetPartnerId] : [],
      commission_type: "fixed",
      commission_value: "",
      effective_from: new Date().toISOString().split("T")[0],
      effective_to: "",
    });
    setProductSearch("");
    setPartnerRoleFilter("all");
    setErrorMsg("");
    setSuccessMsg("");
    setModalOpen(true);
  };

  const handleCreateRule = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    const targetProductIds = form.product_ids.length > 0 ? form.product_ids : (form.product_id || "all");

    const payload = {
      product_ids: targetProductIds,
      partner_ids: form.partner_ids.length > 0 ? form.partner_ids : (form.Partner_id || "global"),
      commission_type: form.commission_type,
      commission_value: parseFloat(form.commission_value || 0),
      effective_from: form.effective_from,
      effective_to: form.effective_to || null,
    };

    try {
      const res = await api.post("/admin/commission-rules/bulk", payload);
      if (res.data?.success) {
        setSuccessMsg(res.data?.message || "Commission rule applied successfully.");
        setModalOpen(false);
        fetchData();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to set commission rule");
    } finally {
      setSubmitting(false);
    }
  };

  // Bulk Override creation for selected partners
  const handleBulkCreateRules = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    const targetProductIds = form.product_ids.length > 0 ? form.product_ids : (form.product_id || "all");

    const payload = {
      product_ids: targetProductIds,
      partner_ids: selectedPartnerIds.length > 0 ? selectedPartnerIds : (form.Partner_id || "all"),
      commission_type: form.commission_type,
      commission_value: parseFloat(form.commission_value || 0),
      effective_from: form.effective_from,
      effective_to: form.effective_to || null,
    };

    try {
      const res = await api.post("/admin/commission-rules/bulk", payload);
      if (res.data?.success) {
        setSuccessMsg(res.data?.message || "Bulk commission override successfully applied.");
        setBulkModalOpen(false);
        setSelectedPartnerIds([]);
        fetchData();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to apply bulk commission overrides.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRule = async (ruleGroup) => {
    const count = ruleGroup.cardCount || ruleGroup.product_ids?.length || 1;
    if (!window.confirm(`Are you sure you want to delete this custom commission override for ${count} product(s)?`)) {
      return;
    }
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const idsToDelete = ruleGroup.rules_list ? ruleGroup.rules_list.map(r => r.id) : [ruleGroup.id];
      await Promise.all(idsToDelete.map(id => api.delete(`/admin/commission-rules/${id}`)));
      setSuccessMsg("Override rule(s) deleted successfully.");
      fetchData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to delete commission rule");
    }
  };

  const formatCategory = (cat) => {
    if (!cat) return "";
    return cat.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  };

  // Consolidate rules - group by partner_id, commission_type, commission_value, effective_from, effective_to
  const consolidatedRules = (() => {
    const grouped = {};
    rules.forEach(rule => {
      const partnerKey = rule.Partner_id || rule.partner_id || 'global';
      const key = `${partnerKey}_${rule.commission_type}_${rule.commission_value}_${rule.effective_from}_${rule.effective_to || ''}`;
      
      if (!grouped[key]) {
        grouped[key] = {
          ...rule,
          product_ids: [rule.product_id],
          product_names: [rule.product_name],
          rules_list: [rule]
        };
      } else {
        if (!grouped[key].product_ids.includes(rule.product_id)) {
          grouped[key].product_ids.push(rule.product_id);
          grouped[key].product_names.push(rule.product_name);
          grouped[key].rules_list.push(rule);
        }
      }
    });
    
    const totalActiveProductsCount = products.length;

    return Object.values(grouped).map(rule => {
      const isAllCards = rule.product_ids.includes('all') || (totalActiveProductsCount > 0 && rule.product_ids.length >= totalActiveProductsCount);
      const isMultipleCards = !isAllCards && rule.product_ids.length > 1;
      const isSingleCard = !isAllCards && rule.product_ids.length === 1;

      let displayProduct = rule.product_name;
      if (isAllCards) {
        displayProduct = 'All Cards';
      } else if (isMultipleCards) {
        displayProduct = 'Selected Cards';
      }

      return {
        ...rule,
        isAllCards,
        isMultipleCards,
        isSingleCard,
        displayProduct,
        cardCount: isAllCards ? totalActiveProductsCount : rule.product_ids.length
      };
    });
  })();

  // Filtered partners/team members list
  const filteredPartners = partners.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    const fullName = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase();
    const code = (p.Partner_code || p.partner_code || '').toLowerCase();
    const email = (p.email || '').toLowerCase();
    const mobile = (p.mobile || '').toLowerCase();

    const matchesQuery = !q || fullName.includes(q) || code.includes(q) || email.includes(q) || mobile.includes(q);

    const userRole = (p.role || p.user_role || 'PARTNER').toUpperCase();
    const matchesRole = roleFilter === 'all' || 
                        (roleFilter === 'partner' && userRole === 'PARTNER') || 
                        (roleFilter === 'team' && (userRole === 'TEAM_MEMBER' || p.parent_partner_id));

    const status = (p.status || p.user_status || 'ACTIVE').toUpperCase();
    const matchesStatus = statusFilter === 'all' || statusFilter.toUpperCase() === status;

    return matchesQuery && matchesRole && matchesStatus;
  });

  // Filtered partners overview for Team Splits tab
  const filteredPartnersOverview = partnersOverview.filter(p => {
    const q = teamSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      (p.full_name && p.full_name.toLowerCase().includes(q)) ||
      (p.partner_code && p.partner_code.toLowerCase().includes(q)) ||
      (p.email && p.email.toLowerCase().includes(q)) ||
      (p.mobile && p.mobile.toLowerCase().includes(q))
    );
  });

  const isAllSelected = filteredPartners.length > 0 && filteredPartners.every(p => selectedPartnerIds.includes(p.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedPartnerIds([]);
    } else {
      setSelectedPartnerIds(filteredPartners.map(p => p.id));
    }
  };

  const toggleSelectPartner = (id) => {
    if (selectedPartnerIds.includes(id)) {
      setSelectedPartnerIds(selectedPartnerIds.filter(item => item !== id));
    } else {
      setSelectedPartnerIds([...selectedPartnerIds, id]);
    }
  };

  const thStyle = {
    padding: '12px 18px', fontSize: '11px', fontWeight: 700,
    color: C.textLight, textTransform: 'uppercase', textAlign: 'left',
    borderBottom: `1px solid ${C.border}`
  };
  const tdStyle = { padding: '14px 18px', fontSize: '13px', color: C.text, borderBottom: `1px solid ${C.border}` };

  return (
    <div style={{ boxSizing: "border-box", minHeight: "100%" }}>
      {/* Title Header */}
      <div className="responsive-header" style={{ marginBottom: "24px", width: "100%" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 900, color: C.text, margin: 0 }}>Commission Manager</h1>
          <p style={{ fontSize: "14px", color: C.textMid, marginTop: "4px", marginBottom: 0 }}>
            Configure default payouts, set partner & team member overrides, and manage DSA commission splits.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {selectedPartnerIds.length > 0 && (
            <button
              onClick={() => {
                setForm({
                  product_id: products[0]?.id || "",
                  product_ids: products[0]?.id ? [products[0]?.id] : [],
                  Partner_id: "",
                  partner_ids: [],
                  commission_type: "fixed",
                  commission_value: "",
                  effective_from: new Date().toISOString().split("T")[0],
                  effective_to: "",
                });
                setBulkModalOpen(true);
              }}
              style={{
                ...S.btn("secondary"),
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                background: C.teal,
                color: "#fff",
                border: "none"
              }}
            >
              <Icons.gift size={16} /> Apply Bulk Override ({selectedPartnerIds.length})
            </button>
          )}
          <button
            onClick={() => handleOpenModal()}
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

      {/* Navigation Tabs */}
      <div style={{ display: "flex", gap: "12px", borderBottom: `1px solid ${C.border}`, marginBottom: "20px", paddingBottom: "1px", flexWrap: "wrap" }}>
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
          Active Custom Overrides ({rules.length})
        </button>
        <button
          onClick={() => setActiveTab("partners")}
          style={{
            background: "none",
            border: "none",
            borderBottom: activeTab === "partners" ? `3px solid ${C.teal}` : "3px solid transparent",
            color: activeTab === "partners" ? C.text : C.textMid,
            fontSize: "15px",
            fontWeight: 700,
            padding: "10px 16px",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          Partner & Team Commissions ({partners.length})
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
        <button
          onClick={() => setActiveTab("team-splits")}
          style={{
            background: "none",
            border: "none",
            borderBottom: activeTab === "team-splits" ? `3px solid ${C.teal}` : "3px solid transparent",
            color: activeTab === "team-splits" ? C.text : C.textMid,
            fontSize: "15px",
            fontWeight: 700,
            padding: "10px 16px",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          DSA Team Splits
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
      ) : activeTab === "partners" ? (
        /* TAB: PARTNER & TEAM COMMISSIONS SEARCH & BULK SETTINGS */
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Search & Filter Toolbar */}
          <div style={{ ...S.card, padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
              
              {/* Search Bar */}
              <div style={{ flex: 1, minWidth: "260px", position: "relative" }}>
                <input
                  type="text"
                  placeholder="Search by Partner / Team Member Name, Code, Email, Mobile..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ ...S.input, width: "100%", paddingLeft: "36px" }}
                />
                <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: C.textLight }}>
                  🔍
                </span>
              </div>

              {/* Role Filter */}
              <div style={{ minWidth: "160px" }}>
                <select
                  value={roleFilter}
                  onChange={e => setRoleFilter(e.target.value)}
                  style={S.input}
                >
                  <option value="all">👥 All Roles (Partner & Team)</option>
                  <option value="partner">⭐ Primary Partners</option>
                  <option value="team">🤝 Team Members (Downlines)</option>
                </select>
              </div>

              {/* Status Filter */}
              <div style={{ minWidth: "140px" }}>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  style={S.input}
                >
                  <option value="all">⚡ All Statuses</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              {/* Apply Filter / Select All Helper */}
              {selectedPartnerIds.length > 0 && (
                <button
                  onClick={() => setSelectedPartnerIds([])}
                  style={{ ...S.btn("outline"), padding: "8px 14px", fontSize: "12px" }}
                >
                  Clear Selection ({selectedPartnerIds.length})
                </button>
              )}

            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", color: C.textMid, paddingTop: "8px", borderTop: `1px solid ${C.border}` }}>
              <div>
                Showing <strong>{filteredPartners.length}</strong> of <strong>{partners.length}</strong> partners & team members
              </div>
              {selectedPartnerIds.length > 0 && (
                <div style={{ color: C.teal, fontWeight: 700 }}>
                  ✓ {selectedPartnerIds.length} Selected for Bulk Commission Override
                </div>
              )}
            </div>
          </div>

          {/* Table of Partners & Team Members */}
          <div style={S.card}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                    <th style={{ padding: "12px 16px", width: "40px" }}>
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={toggleSelectAll}
                        style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: C.teal }}
                      />
                    </th>
                    <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: 700, color: C.textLight, textTransform: "uppercase" }}>Member Details</th>
                    <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: 700, color: C.textLight, textTransform: "uppercase" }}>Role / Network</th>
                    <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: 700, color: C.textLight, textTransform: "uppercase" }}>Code</th>
                    <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: 700, color: C.textLight, textTransform: "uppercase" }}>Status</th>
                    <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: 700, color: C.textLight, textTransform: "uppercase" }}>Overrides</th>
                    <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: 700, color: C.textLight, textTransform: "uppercase", textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPartners.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: C.textLight }}>
                        No partners or team members match your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredPartners.map(p => {
                      const isSelected = selectedPartnerIds.includes(p.id);
                      const isTeam = p.parent_partner_id || (p.role && p.role.toUpperCase() === 'TEAM_MEMBER');
                      const partnerOverrides = rules.filter(r => r.Partner_id === p.id || r.partner_id === p.id);

                      return (
                        <tr key={p.id} style={{ borderBottom: `1px solid ${C.border}`, background: isSelected ? `${C.teal}08` : "none" }}>
                          <td style={{ padding: "14px 16px" }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectPartner(p.id)}
                              style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: C.teal }}
                            />
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            <div style={{ fontWeight: 700, color: C.text }}>{p.first_name} {p.last_name}</div>
                            <div style={{ fontSize: "11px", color: C.textLight, marginTop: "2px" }}>{p.mobile} • {p.email}</div>
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            <span style={{
                              fontSize: "11px",
                              fontWeight: 800,
                              padding: "3px 8px",
                              borderRadius: "6px",
                              background: isTeam ? `${C.primary}15` : `${C.teal}15`,
                              color: isTeam ? C.primary : C.teal,
                              textTransform: "uppercase"
                            }}>
                              {isTeam ? "Team Member" : "Partner"}
                            </span>
                            {p.parent_name && (
                              <div style={{ fontSize: "10.5px", color: C.textMid, marginTop: "4px" }}>
                                Downline of: {p.parent_name}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            <span style={{ fontSize: "12px", fontWeight: 700, background: `${C.teal}12`, color: C.teal, padding: "2px 8px", borderRadius: "6px" }}>
                              {p.Partner_code || p.partner_code || "N/A"}
                            </span>
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            <span style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              padding: "3px 8px",
                              borderRadius: "6px",
                              background: (p.status || p.user_status) === "ACTIVE" ? `${C.green}15` : `${C.gold}15`,
                              color: (p.status || p.user_status) === "ACTIVE" ? C.green : C.gold
                            }}>
                              {p.status || p.user_status || "ACTIVE"}
                            </span>
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            {partnerOverrides.length > 0 ? (
                              <span style={{ fontSize: "11px", fontWeight: 800, color: C.green, background: `${C.green}15`, padding: "4px 8px", borderRadius: "6px" }}>
                                {partnerOverrides.length} Custom Rule(s)
                              </span>
                            ) : (
                              <span style={{ fontSize: "11px", color: C.textLight }}>Default Standard</span>
                            )}
                          </td>
                          <td style={{ padding: "14px 16px", textAlign: "center" }}>
                            <button
                              onClick={() => handleOpenModal(p.id)}
                              style={{
                                border: `1.5px solid ${C.teal}`,
                                background: `${C.teal}10`,
                                color: C.teal,
                                padding: "6px 12px",
                                borderRadius: "8px",
                                fontSize: "12px",
                                fontWeight: 700,
                                cursor: "pointer"
                              }}
                            >
                              Set Override
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === "team-splits" ? (
        /* TAB: TEAM SPLITS (GLOBAL CONFIG & PARTNER TEAM HIERARCHY) */
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Card 1: Global Default Commission Split Slider */}
          <div style={S.card}>
            <h3 style={{ fontSize: "16px", fontWeight: 800, margin: "0 0 8px", color: C.text }}>DSA Team Default Split Ratio</h3>
            <p style={{ fontSize: "13px", color: C.textMid, marginBottom: "20px" }}>
              Configure the default commission share percentage between a Child partner (who sells the product) and their Parent partner (DSA referral override). The shares must total exactly 100%.
            </p>
            
            <form onSubmit={handleSaveSplits} style={{ maxWidth: "460px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={S.label}>Child Partner Share (%)</label>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "6px" }}>
                  <input 
                    type="range"
                    min="0"
                    max="100"
                    value={childPct}
                    onChange={e => {
                      const val = parseInt(e.target.value) || 0;
                      setChildPct(val);
                      setParentPct(100 - val);
                    }}
                    style={{ flex: 1, accentColor: C.teal }}
                  />
                  <input 
                    type="number"
                    min="0"
                    max="100"
                    value={childPct}
                    onChange={e => {
                      const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                      setChildPct(val);
                      setParentPct(100 - val);
                    }}
                    style={{ ...S.input, width: "70px", textAlign: "center" }}
                  />
                  <span style={{ fontWeight: 700 }}>%</span>
                </div>
              </div>

              <div>
                <label style={S.label}>Parent Partner Override Share (%)</label>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "6px" }}>
                  <input 
                    type="range"
                    min="0"
                    max="100"
                    value={parentPct}
                    onChange={e => {
                      const val = parseInt(e.target.value) || 0;
                      setParentPct(val);
                      setChildPct(100 - val);
                    }}
                    style={{ flex: 1, accentColor: C.teal }}
                  />
                  <input 
                    type="number"
                    min="0"
                    max="100"
                    value={parentPct}
                    onChange={e => {
                      const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                      setParentPct(val);
                      setChildPct(100 - val);
                    }}
                    style={{ ...S.input, width: "70px", textAlign: "center" }}
                  />
                  <span style={{ fontWeight: 700 }}>%</span>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={savingSplits}
                style={{
                  ...S.btn("primary"),
                  border: "none",
                  borderRadius: "10px",
                  padding: "10px 18px",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: savingSplits ? "not-allowed" : "pointer",
                  alignSelf: "flex-start"
                }}
              >
                {savingSplits ? "Saving..." : "Save Default Split Ratio"}
              </button>
            </form>
          </div>

          {/* Card 2: Partner Team Downline Commission Splits Hierarchy */}
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 800, margin: 0, color: C.text }}>Partner Team Downline Commission Splits</h3>
                <p style={{ fontSize: "13px", color: C.textMid, marginTop: "4px", margin: 0 }}>
                  View partner teams and override individual downline member commission split rates.
                </p>
              </div>
              <div style={{ flex: 1, maxWidth: "340px", position: "relative" }}>
                <input 
                  type="text"
                  placeholder="Search partner by name, code or email..."
                  value={teamSearch}
                  onChange={e => setTeamSearch(e.target.value)}
                  style={{ ...S.input, width: "100%", paddingLeft: "34px" }}
                />
                <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: C.textLight }}>
                  🔍
                </span>
              </div>
            </div>

            {filteredPartnersOverview.length === 0 ? (
              <div style={{ padding: "36px", textAlign: "center", color: C.textLight }}>
                No partner teams found matching your search.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", borderRadius: "10px", border: `1px solid ${C.border}`, overflow: "hidden" }}>
                {filteredPartnersOverview.map(p => {
                  const isExpanded = !!expandedPartners[p.id];
                  const hasMembers = p.team_members && p.team_members.length > 0;
                  return (
                    <div key={p.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                      {/* Partner Accordion Row */}
                      <div 
                        onClick={() => togglePartnerExpand(p.id)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '14px 18px', background: isExpanded ? (isDark ? '#1a1a1a' : '#f8fafc') : 'transparent',
                          cursor: 'pointer', transition: 'background 0.2s'
                        }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ color: C.teal, display: 'flex' }}>
                            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                          </span>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '14px', color: C.text }}>
                              {p.full_name} <span style={{ fontSize: '12px', fontWeight: 600, color: C.teal }}>({p.partner_code})</span>
                            </div>
                            <div style={{ fontSize: '12px', color: C.textMid, marginTop: '2px' }}>
                              {p.email} • {p.mobile}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <span style={{
                            padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800,
                            background: hasMembers ? `${C.teal}15` : `${C.border}40`,
                            color: hasMembers ? C.teal : C.textMid
                          }}>
                            {p.team_count || (p.team_members ? p.team_members.length : 0)} Team Member(s)
                          </span>
                        </div>
                      </div>

                      {/* Expanded Team Members List */}
                      {isExpanded && (
                        <div style={{ padding: '0 18px 16px 44px', background: isDark ? '#141414' : '#f1f5f9' }}>
                          <h4 style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: C.textLight, marginTop: '12px', marginBottom: '8px' }}>
                            Downline Member Commission Splits (Member Share vs Partner Share)
                          </h4>

                          {!hasMembers ? (
                            <div style={{ padding: '12px 0', fontSize: '13px', color: C.textLight, fontStyle: 'italic' }}>
                              This partner has not added any direct team members yet.
                            </div>
                          ) : (
                            <div style={{ overflowX: "auto", borderRadius: '8px', border: `1px solid ${C.border}` }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', background: isDark ? '#1a1a1a' : '#fff' }}>
                                <thead>
                                  <tr style={{ background: isDark ? '#222' : '#e2e8f0' }}>
                                    <th style={{ ...thStyle, fontSize: '10px' }}>Team Member</th>
                                    <th style={{ ...thStyle, fontSize: '10px' }}>Partner Code</th>
                                    <th style={{ ...thStyle, fontSize: '10px' }}>Member Share %</th>
                                    <th style={{ ...thStyle, fontSize: '10px' }}>Partner Share %</th>
                                    <th style={{ ...thStyle, fontSize: '10px', textAlign: 'right' }}>Action</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {p.team_members.map(m => (
                                    <tr key={m.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                                      <td style={tdStyle}>
                                        <div style={{ fontWeight: 700 }}>{m.full_name}</div>
                                        <div style={{ fontSize: '11px', color: C.textLight }}>{m.email}</div>
                                      </td>
                                      <td style={tdStyle}>{m.partner_code}</td>
                                      <td style={tdStyle}>
                                        {editingMember === m.id ? (
                                          <input 
                                            type="number" 
                                            min="0" 
                                            max="100"
                                            value={newRate}
                                            onChange={e => setNewRate(e.target.value)}
                                            style={{ ...S.input, width: '80px', padding: '4px 8px', fontSize: '13px' }}
                                          />
                                        ) : (
                                          <span style={{ fontWeight: 800, color: C.green }}>{m.commission_rate}%</span>
                                        )}
                                      </td>
                                      <td style={tdStyle}>
                                        {editingMember === m.id ? (
                                          <span style={{ fontWeight: 800, color: C.primary }}>
                                            {!isNaN(parseFloat(newRate)) ? (100 - parseFloat(newRate)).toFixed(2) : '0'}%
                                          </span>
                                        ) : (
                                          <span style={{ fontWeight: 800, color: C.primary }}>{m.parent_share}%</span>
                                        )}
                                      </td>
                                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                                        {editingMember === m.id ? (
                                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                            <button 
                                              onClick={() => handleSaveMemberRate(m.id)}
                                              disabled={savingRate}
                                              style={{ padding: '4px 8px', background: C.green, color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                                              <Check size={14} />
                                            </button>
                                            <button 
                                              onClick={() => setEditingMember(null)}
                                              style={{ padding: '4px 8px', background: C.red, color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                                              <X size={14} />
                                            </button>
                                          </div>
                                        ) : (
                                          <button 
                                            onClick={() => { setEditingMember(m.id); setNewRate(m.commission_rate); }}
                                            style={{ padding: '6px 12px', background: `${C.teal}15`, color: C.teal, border: `1px solid ${C.teal}30`, borderRadius: '6px', fontWeight: 700, fontSize: '11px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                            <Edit2 size={12} /> Edit Split
                                          </button>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      ) : activeTab === "overrides" ? (
        /* TAB: OVERRIDES */
        <div style={S.card}>
          {consolidatedRules.length === 0 ? (
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
                    <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: 700, color: C.textLight, textTransform: "uppercase" }}>Target Member</th>
                    <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: 700, color: C.textLight, textTransform: "uppercase" }}>Type</th>
                    <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: 700, color: C.textLight, textTransform: "uppercase" }}>Payout Value</th>
                    <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: 700, color: C.textLight, textTransform: "uppercase" }}>Effective Period</th>
                    <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: 700, color: C.textLight, textTransform: "uppercase", textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {consolidatedRules.map((rule) => (
                    <tr key={rule.id} style={{ borderBottom: `1px solid ${C.border}`, transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = `${C.border}15`} onMouseLeave={e => e.currentTarget.style.background = "none"}>
                      <td style={{ padding: "14px 16px" }}>
                        {rule.isSingleCard ? (
                          <div>
                            <div style={{ fontWeight: 700, color: C.text }}>{rule.displayProduct}</div>
                            <div style={{ fontSize: "11px", color: C.teal, fontWeight: 600, marginTop: "2px" }}>
                              {formatCategory(rule.product_category)}
                            </div>
                          </div>
                        ) : (
                          <div 
                            onClick={() => {
                              setViewCardsRule(rule);
                              setViewCardsSearch("");
                            }}
                            style={{ cursor: "pointer", display: "inline-block" }}
                            title="Click to view all assigned cards & payout details"
                          >
                            <div style={{ fontWeight: 700, color: C.teal, textDecoration: "underline", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              {rule.displayProduct} 🔍
                            </div>
                            <div style={{ fontSize: "11px", color: C.teal, fontWeight: 700, marginTop: "2px", background: `${C.teal}15`, padding: "2px 8px", borderRadius: "10px", display: "block" }}>
                              {rule.cardCount} product(s) (Click to view)
                            </div>
                          </div>
                        )}
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
                          onClick={() => handleDeleteRule(rule)}
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

      {/* VIEW ASSIGNED CARDS PAYOUT MODAL */}
      {viewCardsRule && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
          <div style={{ ...S.card, width: "100%", maxWidth: "680px", maxHeight: "90vh", overflowY: "auto", padding: "24px" }}>
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: `1px solid ${C.border}`, paddingBottom: "12px" }}>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 900, color: C.text, margin: 0 }}>
                  Assigned Cards & Payout Details
                </h3>
                <p style={{ fontSize: "12px", color: C.textMid, marginTop: "4px", margin: 0 }}>
                  {viewCardsRule.Partner_id || viewCardsRule.partner_id ? (
                    <span>Target Member: <strong>{viewCardsRule.first_name} {viewCardsRule.last_name}</strong> ({viewCardsRule.Partner_code || viewCardsRule.partner_code})</span>
                  ) : (
                    <span>🌐 Global Default Override</span>
                  )}
                </p>
              </div>
              <button onClick={() => setViewCardsRule(null)} style={{ background: "none", border: "none", color: C.textLight, cursor: "pointer", padding: "4px" }}>
                <Icons.x size={20} />
              </button>
            </div>

            {/* Summary Chips */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px", padding: "12px", background: `${C.teal}08`, borderRadius: "10px", border: `1px solid ${C.teal}20` }}>
              <div style={{ fontSize: "12px", color: C.textMid }}>
                Payout Type: <strong style={{ color: C.text, textTransform: "capitalize" }}>{viewCardsRule.commission_type}</strong>
              </div>
              <div style={{ fontSize: "12px", color: C.textMid }}>
                Payout Value: <strong style={{ color: C.teal }}>{viewCardsRule.commission_type === "percentage" ? `${viewCardsRule.commission_value}%` : `₹${viewCardsRule.commission_value}`}</strong>
              </div>
              <div style={{ fontSize: "12px", color: C.textMid }}>
                Effective From: <strong style={{ color: C.text }}>{new Date(viewCardsRule.effective_from).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</strong>
              </div>
              <div style={{ fontSize: "12px", color: C.textMid }}>
                Total Cards: <strong style={{ color: C.primary }}>{viewCardsRule.cardCount} product(s)</strong>
              </div>
            </div>

            {/* Search Bar */}
            <div style={{ marginBottom: "14px", position: "relative" }}>
              <input
                type="text"
                placeholder="Search card by name or category..."
                value={viewCardsSearch}
                onChange={e => setViewCardsSearch(e.target.value)}
                style={{ ...S.input, width: "100%", paddingLeft: "36px" }}
              />
              <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: C.textLight }}>
                🔍
              </span>
            </div>

            {/* Table of Assigned Cards */}
            <div style={{ border: `1px solid ${C.border}`, borderRadius: "10px", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: `${C.border}20`, borderBottom: `1px solid ${C.border}` }}>
                    <th style={{ padding: "10px 14px", fontSize: "11px", fontWeight: 700, color: C.textLight, textTransform: "uppercase" }}>Card / Product Name</th>
                    <th style={{ padding: "10px 14px", fontSize: "11px", fontWeight: 700, color: C.textLight, textTransform: "uppercase" }}>Category</th>
                    <th style={{ padding: "10px 14px", fontSize: "11px", fontWeight: 700, color: C.textLight, textTransform: "uppercase" }}>Lending Bank</th>
                    <th style={{ padding: "10px 14px", fontSize: "11px", fontWeight: 700, color: C.textLight, textTransform: "uppercase" }}>Assigned Payout</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    let cardList = [];
                    if (viewCardsRule.isAllCards) {
                      cardList = products;
                    } else if (viewCardsRule.rules_list && viewCardsRule.rules_list.length > 0) {
                      cardList = viewCardsRule.rules_list.map(r => {
                        const matchedProd = products.find(p => p.id === r.product_id);
                        return {
                          id: r.product_id,
                          name: r.product_name || matchedProd?.name || "Product",
                          category: r.product_category || matchedProd?.category || "",
                          bank_name: matchedProd?.bank_name || "N/A"
                        };
                      });
                    } else {
                      cardList = viewCardsRule.product_names.map((name, i) => {
                        const pId = viewCardsRule.product_ids[i];
                        const matchedProd = products.find(p => p.id === pId);
                        return {
                          id: pId || i,
                          name: name || matchedProd?.name || "Product",
                          category: matchedProd?.category || "",
                          bank_name: matchedProd?.bank_name || "N/A"
                        };
                      });
                    }

                    const filteredList = cardList.filter(c => {
                      const q = viewCardsSearch.toLowerCase().trim();
                      return !q || c.name.toLowerCase().includes(q) || (c.category && c.category.toLowerCase().includes(q));
                    });

                    if (filteredList.length === 0) {
                      return (
                        <tr>
                          <td colSpan={4} style={{ padding: "20px", textAlign: "center", color: C.textLight }}>
                            No cards match your search term.
                          </td>
                        </tr>
                      );
                    }

                    return filteredList.map((card, index) => (
                      <tr key={card.id || index} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: "10px 14px", fontWeight: 700, color: C.text }}>{card.name}</td>
                        <td style={{ padding: "10px 14px", color: C.textMid, fontSize: "12px" }}>{formatCategory(card.category)}</td>
                        <td style={{ padding: "10px 14px", color: C.textMid, fontSize: "12px" }}>{card.bank_name || "N/A"}</td>
                        <td style={{ padding: "10px 14px", fontWeight: 800, color: C.teal }}>
                          {viewCardsRule.commission_type === "percentage" ? `${viewCardsRule.commission_value}%` : `₹${viewCardsRule.commission_value}`}
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
              <button
                onClick={() => setViewCardsRule(null)}
                style={{ ...S.btn("primary"), padding: "8px 20px" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INDIVIDUAL OVERRIDE CREATION MODAL */}
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
              
              {/* Product Selection */}
              <div>
                <label style={S.label}>Select Product(s) or Cards *</label>
                <input
                  type="text"
                  placeholder="Search cards by name..."
                  style={S.input}
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                />
                <div style={{ marginTop: "8px", maxHeight: "160px", overflowY: "auto", border: `1px solid ${C.border}`, borderRadius: "8px", padding: "4px" }}>
                  <label
                    style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px", cursor: "pointer", borderBottom: `1px solid ${C.border}`, background: form.product_ids.includes("all") ? `${C.teal}15` : "transparent" }}
                  >
                    <input
                      type="checkbox"
                      checked={form.product_ids.includes("all")}
                      onChange={e => {
                        if (e.target.checked) {
                          setForm({ ...form, product_ids: ["all"], product_id: "all" });
                        } else {
                          setForm({ ...form, product_ids: [], product_id: "" });
                        }
                      }}
                    />
                    🌟 All Cards & Products (Apply same payout to all products)
                  </label>
                  {products.filter(p => !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase())).map(p => {
                    const isChecked = form.product_ids.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 8px", cursor: "pointer", borderBottom: `1px solid ${C.border}`, background: isChecked ? `${C.teal}12` : "transparent" }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            let updated;
                            if (e.target.checked) {
                              updated = [...form.product_ids.filter(id => id !== "all"), p.id];
                            } else {
                              updated = form.product_ids.filter(id => id !== p.id);
                            }
                            setForm({ ...form, product_ids: updated, product_id: updated[0] || "" });
                          }}
                        />
                        {p.name} (Default: {p.commission_type === "percentage" ? `${p.commission_value}%` : `₹${p.commission_value}`})
                      </label>
                    );
                  })}
                </div>
                {form.product_ids.length > 0 && (
                  <div style={{ marginTop: "6px", fontSize: "12px", color: C.teal, fontWeight: 600 }}>
                    {form.product_ids.includes("all") ? "All Products Selected" : `${form.product_ids.length} product(s) selected`}
                  </div>
                )}
              </div>

              {/* Partner Role Filter */}
              <div>
                <label style={S.label}>Filter by Role</label>
                <select
                  style={S.input}
                  value={partnerRoleFilter}
                  onChange={e => setPartnerRoleFilter(e.target.value)}
                >
                  <option value="all">All (Partners & Team Members)</option>
                  <option value="partners">Partners Only</option>
                  <option value="team_members">Team Members Only</option>
                </select>
              </div>

              {/* Target Partner / Team Member - Multiple Selection */}
              <div>
                <label style={S.label}>Select Target Partner or Team Member</label>
                <div style={{ maxHeight: "180px", overflowY: "auto", border: `1px solid ${C.border}`, borderRadius: "8px", padding: "8px" }}>
                  <div style={{ marginBottom: "8px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={form.partner_ids.includes("global")}
                        onChange={e => {
                          if (e.target.checked) {
                            setForm({ ...form, partner_ids: ["global"] });
                          } else {
                            setForm({ ...form, partner_ids: [] });
                          }
                        }}
                      />
                      🌐 Global Override (All Partners & Team Members)
                    </label>
                  </div>
                  <div style={{ marginBottom: "8px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={form.partner_ids.includes("all")}
                        onChange={e => {
                          if (e.target.checked) {
                            setForm({ ...form, partner_ids: ["all"] });
                          } else {
                            setForm({ ...form, partner_ids: [] });
                          }
                        }}
                      />
                      👥 All Active Partners & Team Members
                    </label>
                  </div>
                  {partners.filter(p => {
                    if (partnerRoleFilter === "partners") return p.role === "PARTNER";
                    if (partnerRoleFilter === "team_members") return p.role === "TEAM_MEMBER";
                    return true;
                  }).map(p => (
                    <label key={p.id} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", padding: "4px 0" }}>
                      <input
                        type="checkbox"
                        checked={form.partner_ids.includes(p.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setForm({ ...form, partner_ids: [...form.partner_ids.filter(id => !["global", "all"].includes(id)), p.id] });
                          } else {
                            setForm({ ...form, partner_ids: form.partner_ids.filter(id => id !== p.id) });
                          }
                        }}
                      />
                      {p.first_name} {p.last_name} ({p.Partner_code || p.partner_code || 'N/A'}) - {p.role === 'TEAM_MEMBER' ? 'Team Member' : 'Partner'}
                    </label>
                  ))}
                </div>
                {form.partner_ids.length > 0 && (
                  <div style={{ marginTop: "8px", fontSize: "12px", color: C.teal, fontWeight: 600 }}>
                    {form.partner_ids.length} account(s) selected
                  </div>
                )}
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

      {/* BULK OVERRIDE CREATION MODAL */}
      {bulkModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
          <div style={{ ...S.card, width: "100%", maxWidth: "520px", maxHeight: "90vh", overflowY: "auto", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", borderBottom: `1px solid ${C.border}`, paddingBottom: "12px" }}>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 900, color: C.text, margin: 0 }}>Apply Bulk Commission Override</h3>
                <span style={{ fontSize: "12px", color: C.teal, fontWeight: 700 }}>
                  Applying override rule to {selectedPartnerIds.length} selected member(s)
                </span>
              </div>
              <button onClick={() => setBulkModalOpen(false)} style={{ background: "none", border: "none", color: C.textLight, cursor: "pointer", padding: "4px" }}>
                <Icons.x size={20} />
              </button>
            </div>

            <form onSubmit={handleBulkCreateRules} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              
              {/* Product */}
              <div>
                <label style={S.label}>Select Product or Cards *</label>
                <select
                  required
                  style={S.input}
                  value={form.product_id}
                  onChange={e => {
                    const val = e.target.value;
                    setForm({ ...form, product_id: val, product_ids: val === "all" ? ["all"] : [val] });
                  }}
                >
                  <option value="all">🌟 All Cards & Products (Apply same payout to all products)</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Default: {p.commission_type === "percentage" ? `${p.commission_value}%` : `₹${p.commission_value}`})
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
                  onClick={() => setBulkModalOpen(false)}
                  style={{ ...S.btn("outline"), padding: "10px 20px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ ...S.btn("primary"), padding: "10px 24px", opacity: submitting ? 0.7 : 1 }}
                >
                  {submitting ? "Applying to All..." : `Apply to ${selectedPartnerIds.length} Members`}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}

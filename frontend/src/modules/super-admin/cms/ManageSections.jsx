import React, { useState, useEffect } from 'react';
import api from "../../../services/api";
import { useTheme, makeS } from "../../../contexts/ThemeContext";
import { Icons } from "../../../components/Icon/PartnerIcons";
import {
  FaArrowUp, FaArrowDown, FaPlus, FaTrash, FaEdit, FaTimes, FaSave,
  FaCheck, FaExclamationTriangle, FaChevronDown, FaChevronUp
} from "react-icons/fa";
import * as FaIcons from "react-icons/fa";

const defaultFallbackSections = {
  money_transfer: {
    title: "Recharge & Bills",
    subtitle: "Recharge mobile & DTH or pay utility bills",
    items: [
      { id: "tomobile", label: "To Mobile", icon: "FaMobileAlt", desc: "Send money instantly", color: "#27ae60" },
      { id: "recharge", label: "Recharge", icon: "FaMobileAlt", desc: "Mobile, DTH, FASTag", color: "#2980b9" },
      { id: "electricity", label: "Electricity", icon: "FaBolt", desc: "Pay electricity bills", color: "#f39c12" },
      { id: "loanrepay", label: "Loan Repay", icon: "FaMoneyBillWave", desc: "EMI & Loan Payments", color: "#8e44ad" },
      { id: "fastag", label: "FASTag", icon: "FaTags", desc: "Recharge FASTag tag", color: "#3498db" }
    ]
  },
  attractive_cards: {
    title: "Attractive Cards & Loans",
    subtitle: "Handpicked financial solutions for your profile",
    items: [
      { id: "cibil-loans", label: "CIBIL Score Based Loans", icon: "FaUniversity", desc: "Get loan based on score" },
      { id: "hdfc-cc-loan", label: "Loan on Credit Card", icon: "FaLaptopHouse", desc: "Pre-approved credit card loans" },
      { id: "smart-emi", label: "Smart EMI Cards", icon: "FaMoneyCheckAlt", desc: "Convert purchase to EMI" },
      { id: "secured-cards", label: "FD Backed Cards", icon: "FaRegCreditCard", desc: "Guaranteed approval cards" },
      { id: "upi-cards", label: "UPI Credit Cards", icon: "FaBolt", desc: "Link credit card to UPI" }
    ]
  },
  loans: {
    title: "Loans",
    subtitle: "Instant approvals with minimum documentation",
    items: [
      { id: "personal-loan", label: "Personal Loan", icon: "FaUser", desc: "Instant personal loans" },
      { id: "home-loan", label: "Home Loan", icon: "FaHome", desc: "Home purchase and renovation" },
      { id: "business-loan", label: "Business Loan", icon: "FaBriefcase", desc: "Expand your business" },
      { id: "instant-loan", label: "Instant Loan", icon: "FaBolt", desc: "Quick emergency funds" }
    ]
  },
  insurance: {
    title: "Insurance",
    subtitle: "Secure your future with complete health & life plans",
    items: [
      { id: "health-insurance", label: "Health Insurance", icon: "FaHeartbeat", desc: "Medical coverages" },
      { id: "life-insurance", label: "Life Insurance", icon: "FaShieldAlt", desc: "Term life coverage" },
      { id: "general-insurance", label: "General Insurance", icon: "FaUmbrella", desc: "Vehicle & assets" }
    ]
  },
  travel: {
    title: "Travel & Transit",
    subtitle: "Book flights, trains, hotels, and buses instantly",
    items: [
      { id: "flight", label: "Flight Booking", icon: "FaPlane", desc: "Domestic & international flights" },
      { id: "train", label: "Train Booking", icon: "FaTrain", desc: "IRCTC train tickets" },
      { id: "bus", label: "Bus Booking", icon: "FaBus", desc: "Intercity bus travels" },
      { id: "hotels", label: "Hotel Booking", icon: "FaHotel", desc: "Best hotels & resorts" }
    ]
  },
  recharge: {
    title: "Recharge & Bills",
    subtitle: "Pay utility bills and recharge connections",
    items: [
      { id: "mobile-recharge", label: "Mobile Recharge", icon: "FaMobileAlt", desc: "Recharge prepaid mobile" },
      { id: "dth-recharge", label: "DTH Recharge", icon: "FaTv", desc: "Recharge DTH connection" },
      { id: "electricity-bill", label: "Electricity Bill", icon: "FaBolt", desc: "Pay electricity bills" }
    ]
  },
  offers: {
    title: "Offers & Campaigns",
    subtitle: "Earn cashback and rewards",
    items: [
      { id: "cashback-campaign", label: "Cashback Offers", icon: "FaGift", desc: "Get flat cashback rewards" },
      { id: "referral-program", label: "Refer & Earn", icon: "FaUsers", desc: "Refer friends and earn commissions" }
    ]
  }
};

const POPULAR_ICONS = [
  { value: "FaMobileAlt", label: "Mobile Alt (Recharge)" },
  { value: "FaBolt", label: "Bolt (Electricity)" },
  { value: "FaMoneyBillWave", label: "Money Bill Wave (Repay)" },
  { value: "FaTags", label: "Tags (FASTag)" },
  { value: "FaRegCreditCard", label: "Credit Card" },
  { value: "FaUniversity", label: "University (CIBIL/Bank)" },
  { value: "FaLaptopHouse", label: "Laptop House (CC Loan)" },
  { value: "FaMoneyCheckAlt", label: "Money Check (Smart EMI)" },
  { value: "FaUser", label: "User (Personal Loan)" },
  { value: "FaBriefcase", label: "Briefcase (Business Loan)" },
  { value: "FaHome", label: "Home (Home Loan)" },
  { value: "FaHeartbeat", label: "Heartbeat (Health)" },
  { value: "FaShieldAlt", label: "Shield (Life)" },
  { value: "FaUmbrella", label: "Umbrella (General)" },
  { value: "FaPlane", label: "Plane (Flight)" },
  { value: "FaTrain", label: "Train (Train)" },
  { value: "FaBus", label: "Bus (Bus)" },
  { value: "FaHotel", label: "Hotel" },
  { value: "FaGift", label: "Gift (Offers)" },
  { value: "FaUsers", label: "Users (Referrals)" },
  { value: "FaFileInvoiceDollar", label: "File Invoice Dollar" }
];

export default function ManageSections() {
  const { C } = useTheme();
  const S = makeS(C);

  const [settings, setSettings] = useState({});
  const [cmsSections, setCmsSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [savingKey, setSavingKey] = useState(null);

  // Selected section state for designer
  const [selectedSection, setSelectedSection] = useState(null);
  const [designerTitle, setDesignerTitle] = useState("");
  const [designerSubtitle, setDesignerSubtitle] = useState("");
  const [designerItems, setDesignerItems] = useState([]);
  const [designerActive, setDesignerActive] = useState(true);
  const [designerOrder, setDesignerOrder] = useState(0);
  
  // Item Modal state
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemLabel, setItemLabel] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [itemIcon, setItemIcon] = useState("FaRegCreditCard");
  const [itemColor, setItemColor] = useState("#27ae60");
  const [customIcon, setCustomIcon] = useState("");

  // Footer States
  const [footerCompanyName, setFooterCompanyName] = useState("");
  const [footerCompanyEmail, setFooterCompanyEmail] = useState("");
  const [footerCompanyPhone, setFooterCompanyPhone] = useState("");
  const [footerCompanyAddress, setFooterCompanyAddress] = useState("");
  const [footerCompanyCopyright, setFooterCompanyCopyright] = useState("");
  const [savingFooter, setSavingFooter] = useState(false);

  const sectionsList = [
    { key: "section_visibility_money_transfer", cmsKey: "money_transfer", label: "Money Transfer & Payments", icon: <Icons.wallet size={20} />, description: "Displays fast money transfer and domestic payout service buttons." },
    { key: "section_visibility_attractive_cards", cmsKey: "attractive_cards", label: "Attractive Cards & Loans", icon: <Icons.creditCard size={20} />, description: "Highlighted list of top converting bank credit cards and loan offers." },
    { key: "section_visibility_insurance", cmsKey: "insurance", label: "Insurance Section", icon: <Icons.check size={20} />, description: "Life, health, and vehicle insurance policy application cards." },
    { key: "section_visibility_travel", cmsKey: "travel", label: "Travel Section", icon: <Icons.clock size={20} />, description: "Flight, train, bus, and hotel booking options." },
    { key: "section_visibility_recharge", cmsKey: "recharge", label: "Recharge Section", icon: <Icons.trending size={20} />, description: "Mobile recharge, DTH, utility electricity bill pay widgets." },
    { key: "section_visibility_offers", cmsKey: "offers", label: "Offers Section", icon: <Icons.gift size={20} />, description: "Featured cashback, referral campaigns, and seasonal credit card promotions." },
    { key: null, cmsKey: "loans", label: "Loans Category", icon: <Icons.trending size={20} />, description: "Manage loan subcategories/items shown when users view Loans." }
  ];

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const [settingsRes, cmsRes] = await Promise.all([
        api.get("/settings"),
        api.get("/cms/sections/all")
      ]);

      if (settingsRes.data?.success) {
        const s = settingsRes.data.data;
        setSettings(s);
        setFooterCompanyName(s.company_name || "GharKaPaisa");
        setFooterCompanyEmail(s.company_email || "support@gharkapaisa.com");
        setFooterCompanyPhone(s.company_phone || "+91 99999 99999");
        setFooterCompanyAddress(s.company_address || "Sector 62, Noida, Uttar Pradesh, India");
        setFooterCompanyCopyright(s.company_copyright || "@2026 OIT_stack");
      }
      if (cmsRes.data?.success) {
        setCmsSections(cmsRes.data.data);
      }
    } catch (e) {
      console.error("[ManageSections] Fetch Error:", e);
      setErrorMsg(e.response?.data?.message || "Failed to load homepage sections state");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveFooterSettings = async (e) => {
    if (e) e.preventDefault();
    setSavingFooter(true);
    try {
      await Promise.all([
        api.post("/settings", { key: "company_name", value: footerCompanyName.trim() }),
        api.post("/settings", { key: "company_email", value: footerCompanyEmail.trim() }),
        api.post("/settings", { key: "company_phone", value: footerCompanyPhone.trim() }),
        api.post("/settings", { key: "company_address", value: footerCompanyAddress.trim() }),
        api.post("/settings", { key: "company_copyright", value: footerCompanyCopyright.trim() })
      ]);
      setSettings(prev => ({
        ...prev,
        company_name: footerCompanyName.trim(),
        company_email: footerCompanyEmail.trim(),
        company_phone: footerCompanyPhone.trim(),
        company_address: footerCompanyAddress.trim(),
        company_copyright: footerCompanyCopyright.trim()
      }));
      sessionStorage.removeItem('gkp_settings');
      alert("Footer configurations saved successfully!");
    } catch (err) {
      alert("Failed to save footer settings.");
    } finally {
      setSavingFooter(false);
    }
  };

  const toggleSectionVisibility = async (key, currentValue) => {
    setSavingKey(key);
    const newValue = currentValue === "show" ? "hide" : "show";
    try {
      const res = await api.post("/settings", { key, value: newValue });
      if (res.data?.success) {
        setSettings(prev => ({ ...prev, [key]: newValue }));
      }
    } catch (e) {
      alert(e.response?.data?.message || "Failed to update visibility status");
    } finally {
      setSavingKey(null);
    }
  };

  const handleSelectSection = (section) => {
    const dbSection = cmsSections.find(s => s.key === section.cmsKey);
    setSelectedSection(section);
    
    if (dbSection) {
      setDesignerTitle(dbSection.title || "");
      setDesignerSubtitle(dbSection.subtitle || "");
      setDesignerItems(dbSection.items || []);
      setDesignerActive(dbSection.is_active !== false);
      setDesignerOrder(dbSection.display_order || 0);
    } else {
      // Not initialized in DB yet
      const fallback = defaultFallbackSections[section.cmsKey] || { title: section.label, subtitle: "", items: [] };
      setDesignerTitle(fallback.title);
      setDesignerSubtitle(fallback.subtitle);
      setDesignerItems(fallback.items);
      setDesignerActive(true);
      setDesignerOrder(0);
    }
  };

  const handleInitializeSection = async () => {
    if (!selectedSection) return;
    setSavingKey(selectedSection.cmsKey);
    try {
      const fallback = defaultFallbackSections[selectedSection.cmsKey] || { title: selectedSection.label, subtitle: "", items: [] };
      const res = await api.post("/cms/sections", {
        key: selectedSection.cmsKey,
        title: designerTitle || fallback.title,
        subtitle: designerSubtitle || fallback.subtitle,
        items: designerItems || fallback.items,
        is_active: designerActive,
        display_order: designerOrder
      });

      if (res.data?.success) {
        alert("Section initialized in database successfully!");
        await fetchData();
        // Update loaded section
        if (res.data.data) {
          setCmsSections(prev => [...prev.filter(s => s.key !== selectedSection.cmsKey), res.data.data]);
        }
      }
    } catch (e) {
      alert(e.response?.data?.message || "Failed to initialize section in DB");
    } finally {
      setSavingKey(null);
    }
  };

  const handleSaveSectionDesign = async (e) => {
    if (e) e.preventDefault();
    if (!selectedSection) return;

    const dbSection = cmsSections.find(s => s.key === selectedSection.cmsKey);
    if (!dbSection) {
      // Need to initialize first
      await handleInitializeSection();
      return;
    }

    setSavingKey(selectedSection.cmsKey);
    try {
      const res = await api.put(`/cms/sections/${selectedSection.cmsKey}`, {
        title: designerTitle,
        subtitle: designerSubtitle,
        items: designerItems,
        is_active: designerActive,
        display_order: designerOrder
      });

      if (res.data?.success) {
        alert("Layout section updated successfully!");
        await fetchData();
      }
    } catch (e) {
      alert(e.response?.data?.message || "Failed to update layout section");
    } finally {
      setSavingKey(null);
    }
  };

  // Move item in layout order
  const moveItem = (index, direction) => {
    const updated = [...designerItems];
    if (direction === "up" && index > 0) {
      const temp = updated[index];
      updated[index] = updated[index - 1];
      updated[index - 1] = temp;
    } else if (direction === "down" && index < updated.length - 1) {
      const temp = updated[index];
      updated[index] = updated[index + 1];
      updated[index + 1] = temp;
    }
    setDesignerItems(updated);
  };

  // Open item form for adding or editing
  const openItemForm = (item = null, index = -1) => {
    if (item) {
      setEditingItem({ item, index });
      setItemLabel(item.label || "");
      setItemDesc(item.desc || "");
      if (POPULAR_ICONS.some(i => i.value === item.icon)) {
        setItemIcon(item.icon);
        setCustomIcon("");
      } else {
        setItemIcon("custom");
        setCustomIcon(item.icon || "");
      }
      setItemColor(item.color || "#27ae60");
    } else {
      setEditingItem(null);
      setItemLabel("");
      setItemDesc("");
      setItemIcon("FaRegCreditCard");
      setCustomIcon("");
      setItemColor("#27ae60");
    }
    setShowItemForm(true);
  };

  // Save changes to a single item
  const handleSaveItem = (e) => {
    e.preventDefault();
    if (!itemLabel.trim()) return alert("Item label is required");

    const finalIcon = itemIcon === "custom" ? customIcon.trim() : itemIcon;
    if (!finalIcon) return alert("Item icon is required");

    const newItem = {
      id: editingItem ? editingItem.item.id : itemLabel.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      label: itemLabel.trim(),
      desc: itemDesc.trim(),
      icon: finalIcon,
      color: selectedSection.cmsKey === "money_transfer" ? itemColor : undefined
    };

    let updated = [...designerItems];
    if (editingItem && editingItem.index > -1) {
      updated[editingItem.index] = newItem;
    } else {
      // Check for duplicate ID
      if (updated.some(i => i.id === newItem.id)) {
        newItem.id = `${newItem.id}-${Date.now().toString().slice(-4)}`;
      }
      updated.push(newItem);
    }

    setDesignerItems(updated);
    setShowItemForm(false);
    setEditingItem(null);
  };

  // Delete an item from section
  const handleDeleteItem = (index) => {
    if (confirm("Are you sure you want to delete this item?")) {
      const updated = designerItems.filter((_, idx) => idx !== index);
      setDesignerItems(updated);
    }
  };

  // Dynamic FontAwesome Icon previewer
  const renderIconPreview = (iconName, color = C.teal, size = 20) => {
    const IconComp = FaIcons[iconName];
    if (IconComp) {
      return <IconComp size={size} style={{ color }} />;
    }
    return <FaIcons.FaRegQuestionCircle size={size} style={{ color: C.textLight }} />;
  };

  return (
    <div>
      {/* Title */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: 800, color: C.text, margin: 0 }}>Homepage Layout Sections</h2>
        <p style={{ fontSize: "13px", color: C.textLight, margin: "4px 0 0 0" }}>Control show/hide visibility rules and manage list items inside home layout sections in real-time</p>
      </div>

      {errorMsg && (
        <div style={{ padding: "16px", background: `${C.red}10`, border: `1px solid ${C.red}30`, borderRadius: "12px", color: C.red, marginBottom: "16px" }}>
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "48px", color: C.textLight }}>
          <div className="animate-spin" style={{ width: "24px", height: "24px", border: `3px solid ${C.teal}`, borderTopColor: "transparent", borderRadius: "50%", margin: "0 auto 8px" }}></div>
          Loading sections schema...
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          {/* Main Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
            {sectionsList.map((item) => {
              const isVisible = item.key ? settings[item.key] !== "hide" : true;
              const dbSection = cmsSections.find(s => s.key === item.cmsKey);
              const isSelected = selectedSection?.cmsKey === item.cmsKey;

              return (
                <div
                  key={item.cmsKey}
                  style={{
                    ...S.card,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    border: isSelected ? `2px solid ${C.teal}` : `1px solid ${C.border}`,
                    boxShadow: isSelected ? `0 8px 30px ${C.teal}20` : "0 4px 12px rgba(0,0,0,0.02)",
                    opacity: isVisible ? 1 : 0.8,
                    transform: isSelected ? "scale(1.01)" : "none"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                      <div style={{
                        width: "40px",
                        height: "40px",
                        background: isVisible ? `${C.teal}15` : `${C.textLight}15`,
                        color: isVisible ? C.teal : C.textLight,
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        {item.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: "16px", fontWeight: 800, color: C.text, margin: 0 }}>
                          {item.label}
                        </h4>
                        {item.key ? (
                          <span style={{
                            display: "inline-block", fontSize: "10px", fontWeight: 800, textTransform: "uppercase",
                            color: isVisible ? C.green : C.red, marginTop: "2px"
                          }}>
                            {isVisible ? "🟢 Visible (ON)" : "🔴 Masked (OFF)"}
                          </span>
                        ) : (
                          <span style={{ display: "inline-block", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", color: C.teal, marginTop: "2px" }}>
                            ⚙️ Inside Categories Pages
                          </span>
                        )}
                      </div>
                    </div>
                    <p style={{ fontSize: "12.5px", color: C.textLight, margin: "8px 0 0 0", lineHeight: 1.4 }}>
                      {item.description}
                    </p>
                    <div style={{ marginTop: "12px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, background: C.bgSecondary, padding: "2px 8px", borderRadius: "4px", color: C.textMid }}>
                        Key: {item.cmsKey}
                      </span>
                      <span style={{ fontSize: "11px", fontWeight: 700, background: dbSection ? `${C.green}15` : `${C.gold}15`, padding: "2px 8px", borderRadius: "4px", color: dbSection ? C.green : C.gold }}>
                        {dbSection ? "Database Active" : "Local Fallback"}
                      </span>
                      {dbSection?.items && (
                        <span style={{ fontSize: "11px", fontWeight: 700, background: `${C.teal}15`, padding: "2px 8px", borderRadius: "4px", color: C.teal }}>
                          Items: {dbSection.items.length}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ marginTop: "16px", borderTop: `1px solid ${C.border}50`, paddingTop: "14px", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                    {item.key && (
                      <button
                        onClick={() => toggleSectionVisibility(item.key, isVisible ? "show" : "hide")}
                        disabled={savingKey === item.key}
                        style={{
                          background: "none",
                          color: isVisible ? C.red : C.green,
                          border: `1px solid ${isVisible ? C.red : C.green}40`,
                          borderRadius: "8px",
                          padding: "6px 12px",
                          fontWeight: 700,
                          fontSize: "12px",
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                      >
                        {savingKey === item.key ? "..." : isVisible ? "Hide" : "Show"}
                      </button>
                    )}
                    <button
                      onClick={() => handleSelectSection(item)}
                      style={{
                        background: isSelected ? C.teal : `${C.teal}15`,
                        color: isSelected ? "#fff" : C.teal,
                        border: "none",
                        borderRadius: "8px",
                        padding: "6px 12px",
                        fontWeight: 800,
                        fontSize: "12.5px",
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                    >
                      Manage Content
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* General Website Footer & Contact Configurator */}
          <div style={{ ...S.card, border: `1px solid ${C.border}`, boxShadow: "0 4px 12px rgba(0,0,0,0.02)", background: C.card }}>
            <h3 style={{ fontSize: "18px", fontWeight: 800, color: C.text, margin: "0 0 4px 0" }}>Footer & Corporate Identity Settings</h3>
            <p style={{ fontSize: "12.5px", color: C.textLight, margin: "0 0 20px 0" }}>Update your contact information, registered address, copyright parameters and site identity globally</p>

            <form onSubmit={handleSaveFooterSettings} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
              <div>
                <label style={S.label}>Company / Brand Name</label>
                <input required style={S.input} value={footerCompanyName} onChange={e => setFooterCompanyName(e.target.value)} placeholder="e.g. GharKaPaisa" />
              </div>
              <div>
                <label style={S.label}>Contact Phone Number</label>
                <input required style={S.input} value={footerCompanyPhone} onChange={e => setFooterCompanyPhone(e.target.value)} placeholder="e.g. +91 99999 99999" />
              </div>
              <div>
                <label style={S.label}>Contact Support Email Address</label>
                <input required type="email" style={S.input} value={footerCompanyEmail} onChange={e => setFooterCompanyEmail(e.target.value)} placeholder="e.g. support@gharkapaisa.com" />
              </div>
              <div>
                <label style={S.label}>Copyright Information String</label>
                <input required style={S.input} value={footerCompanyCopyright} onChange={e => setFooterCompanyCopyright(e.target.value)} placeholder="e.g. @2026 OIT_stack" />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={S.label}>Registered / Corporate Office Address</label>
                <textarea required rows="2" style={S.input} value={footerCompanyAddress} onChange={e => setFooterCompanyAddress(e.target.value)} placeholder="Enter full postal address details" />
              </div>
              <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end" }}>
                <button type="submit" disabled={savingFooter} style={{ ...S.btn("primary"), padding: "10px 24px" }}>
                  {savingFooter ? "Saving Settings..." : "Save Footer Configurations"}
                </button>
              </div>
            </form>
          </div>

          {/* Section Designer Area */}
          {selectedSection && (
            <div style={{
              ...S.card,
              border: `1.5px solid ${C.border}`,
              background: C.card,
              display: "flex",
              flexDirection: "column",
              gap: "24px"
            }}>
              {/* Designer Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.border}80`, paddingBottom: "16px" }}>
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: 800, color: C.text, margin: 0 }}>
                    Section Designer: {selectedSection.label}
                  </h3>
                  <p style={{ fontSize: "12.5px", color: C.textLight, margin: "2px 0 0 0" }}>
                    Edit display attributes, add buttons, customize icons, and reorder grid elements.
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSection(null)}
                  style={{
                    background: "none",
                    border: `1px solid ${C.border}`,
                    color: C.textLight,
                    borderRadius: "50%",
                    width: "32px",
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer"
                  }}
                >
                  <FaTimes />
                </button>
              </div>

              {/* DB Status Banner */}
              {!cmsSections.some(s => s.key === selectedSection.cmsKey) && (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: `${C.gold}15`,
                  border: `1px solid ${C.gold}30`,
                  borderRadius: "12px",
                  padding: "14px 18px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", color: C.gold }}>
                    <FaExclamationTriangle size={18} />
                    <span style={{ fontSize: "13px", fontWeight: 600 }}>This section key doesn't exist in the database yet. It's currently using the local client fallback array.</span>
                  </div>
                  <button
                    onClick={handleInitializeSection}
                    disabled={savingKey === selectedSection.cmsKey}
                    style={{
                      background: C.gold,
                      color: "#000",
                      border: "none",
                      padding: "6px 14px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: 800,
                      cursor: "pointer"
                    }}
                  >
                    {savingKey === selectedSection.cmsKey ? "Initializing..." : "Initialize in Database"}
                  </button>
                </div>
              )}

              {/* Designer form */}
              <form onSubmit={handleSaveSectionDesign} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={S.label}>Section Display Title *</label>
                    <input
                      style={S.input}
                      value={designerTitle}
                      onChange={(e) => setDesignerTitle(e.target.value)}
                      placeholder="e.g. Loans & Financing"
                      required
                    />
                  </div>
                  <div>
                    <label style={S.label}>Section Subtitle</label>
                    <input
                      style={S.input}
                      value={designerSubtitle}
                      onChange={(e) => setDesignerSubtitle(e.target.value)}
                      placeholder="e.g. Choose from multiple collateral options"
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: "16px", alignItems: "center" }}>
                  <div>
                    <label style={S.label}>Display Order (Priority)</label>
                    <input
                      type="number"
                      style={S.input}
                      value={designerOrder}
                      onChange={(e) => setDesignerOrder(parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                  <div style={{ paddingTop: "20px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600, color: C.text, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={designerActive}
                        onChange={(e) => setDesignerActive(e.target.checked)}
                        style={{ width: "16px", height: "16px", accentColor: C.teal }}
                      />
                      Active (CMS)
                    </label>
                  </div>
                </div>

                {/* Items Management Header */}
                <div style={{ marginTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h4 style={{ fontSize: "15px", fontWeight: 800, color: C.text, margin: 0 }}>
                    Section Layout Items / Buttons ({designerItems.length})
                  </h4>
                  <button
                    type="button"
                    onClick={() => openItemForm()}
                    style={{
                      background: `${C.teal}15`,
                      color: C.teal,
                      border: `1px dashed ${C.teal}50`,
                      borderRadius: "8px",
                      padding: "6px 14px",
                      fontSize: "12px",
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <FaPlus /> Add New Item
                  </button>
                </div>

                {/* Items list */}
                {designerItems.length === 0 ? (
                  <div style={{ border: `1.5px dashed ${C.border}`, borderRadius: "12px", padding: "32px", textAlign: "center", color: C.textLight, fontSize: "13.5px" }}>
                    No items in this section. Click "Add New Item" to populate it.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {designerItems.map((item, index) => (
                      <div
                        key={item.id || index}
                        style={{
                          background: C.bgSecondary,
                          border: `1px solid ${C.border}`,
                          borderRadius: "12px",
                          padding: "10px 16px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "12px"
                        }}
                      >
                        {/* Drag/Reorder Controls */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <button
                            type="button"
                            onClick={() => moveItem(index, "up")}
                            disabled={index === 0}
                            style={{ background: "none", border: "none", color: index === 0 ? C.textLight + "40" : C.textLight, cursor: index === 0 ? "default" : "pointer", padding: "2px" }}
                          >
                            <FaChevronUp size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveItem(index, "down")}
                            disabled={index === designerItems.length - 1}
                            style={{ background: "none", border: "none", color: index === designerItems.length - 1 ? C.textLight + "40" : C.textLight, cursor: index === designerItems.length - 1 ? "default" : "pointer", padding: "2px" }}
                          >
                            <FaChevronDown size={12} />
                          </button>
                        </div>

                        {/* Icon Preview */}
                        <div style={{
                          width: "42px",
                          height: "42px",
                          borderRadius: "10px",
                          background: C.card,
                          border: `1px solid ${C.border}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0
                        }}>
                          {renderIconPreview(item.icon, item.color || C.teal, 18)}
                        </div>

                        {/* Details */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontWeight: 700, color: C.text, fontSize: "13.5px" }}>{item.label}</span>
                            <span style={{ fontSize: "10.5px", background: C.card, padding: "1px 6px", borderRadius: "4px", border: `1px solid ${C.border}`, color: C.textLight }}>
                              ID: {item.id}
                            </span>
                            {item.color && (
                              <span style={{ display: "inline-block", width: "12px", height: "12px", borderRadius: "50%", background: item.color, border: `1px solid ${C.border}` }} title={`Color: ${item.color}`} />
                            )}
                          </div>
                          <span style={{ fontSize: "12px", color: C.textLight, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {item.desc || "No description set"}
                          </span>
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            type="button"
                            onClick={() => openItemForm(item, index)}
                            style={{
                              background: "none",
                              border: `1px solid ${C.border}`,
                              color: C.teal,
                              borderRadius: "8px",
                              width: "32px",
                              height: "32px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer"
                            }}
                          >
                            <FaEdit size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(index)}
                            style={{
                              background: "none",
                              border: `1px solid ${C.red}30`,
                              color: C.red,
                              borderRadius: "8px",
                              width: "32px",
                              height: "32px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer"
                            }}
                          >
                            <FaTrash size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Save actions */}
                <div style={{ display: "flex", gap: "12px", marginTop: "12px", justifyContent: "flex-end", borderTop: `1px solid ${C.border}80`, paddingTop: "16px" }}>
                  <button
                    type="button"
                    onClick={() => setSelectedSection(null)}
                    style={{ ...S.btn("outline"), border: "none", color: C.textLight }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingKey === selectedSection.cmsKey}
                    style={{
                      ...S.btn("primary"),
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}
                  >
                    <FaSave /> {savingKey === selectedSection.cmsKey ? "Saving..." : "Save Layout Design"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Item Form Modal Overlay */}
      {showItemForm && selectedSection && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 1100,
          background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", padding: "20px",
          backdropFilter: "blur(4px)"
        }}>
          <div style={{
            background: C.card, borderRadius: "20px", border: `1px solid ${C.border}`,
            width: "100%", maxWidth: "480px", padding: "24px", position: "relative",
            boxShadow: "0 12px 36px rgba(0,0,0,0.25)"
          }}>
            <button
              onClick={() => setShowItemForm(false)}
              style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", color: C.textLight, cursor: "pointer" }}
            >
              <FaTimes size={18} />
            </button>

            <h3 style={{ fontSize: "17px", fontWeight: 800, color: C.text, marginBottom: "18px" }}>
              {editingItem ? "Edit Item Detail" : "Add New Item"}
            </h3>

            <form onSubmit={handleSaveItem} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={S.label}>Item Label (Display text) *</label>
                <input
                  style={S.input}
                  value={itemLabel}
                  onChange={(e) => setItemLabel(e.target.value)}
                  placeholder="e.g. Flight Booking"
                  required
                />
              </div>

              <div>
                <label style={S.label}>Description / Tagline</label>
                <input
                  style={S.input}
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  placeholder="e.g. Direct domestic flights at 10% discount"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={S.label}>Select Icon *</label>
                  <select
                    style={S.input}
                    value={itemIcon}
                    onChange={(e) => setItemIcon(e.target.value)}
                  >
                    {POPULAR_ICONS.map(i => (
                      <option key={i.value} value={i.value}>{i.label}</option>
                    ))}
                    <option value="custom">-- Custom Icon --</option>
                  </select>
                </div>
                {itemIcon === "custom" ? (
                  <div>
                    <label style={S.label}>Custom Icon Class *</label>
                    <input
                      style={S.input}
                      value={customIcon}
                      onChange={(e) => setCustomIcon(e.target.value)}
                      placeholder="e.g. FaPlaneDeparture"
                      required
                    />
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", paddingBottom: "6px", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", color: C.textLight, marginBottom: "6px", display: "block" }}>Icon Preview</span>
                    <div style={{
                      width: "38px", height: "38px", borderRadius: "8px", background: C.bgSecondary,
                      display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${C.border}`
                    }}>
                      {renderIconPreview(itemIcon, itemColor, 20)}
                    </div>
                  </div>
                )}
              </div>

              {selectedSection.cmsKey === "money_transfer" && (
                <div>
                  <label style={S.label}>Icon Accent Color *</label>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <input
                      type="color"
                      value={itemColor}
                      onChange={(e) => setItemColor(e.target.value)}
                      style={{ width: "40px", height: "40px", padding: 0, border: "none", background: "none", cursor: "pointer" }}
                    />
                    <input
                      style={{ ...S.input, flex: 1 }}
                      value={itemColor}
                      onChange={(e) => setItemColor(e.target.value)}
                      placeholder="#27ae60"
                      pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                    />
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", marginTop: "12px", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowItemForm(false)} style={{ ...S.btn("outline"), border: "none", color: C.textLight }}>
                  Cancel
                </button>
                <button type="submit" style={S.btn("primary")}>
                  {editingItem ? "Update Item" : "Add Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

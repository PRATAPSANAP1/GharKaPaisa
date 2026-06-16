import React, { useState } from "react";
import { useTheme } from "../../Partner/ThemeContext";
import { 
  FaArrowLeft, FaGift, FaShieldAlt, FaClock, FaSearch, 
  FaCheckCircle, FaArrowRight, FaQuestionCircle, 
  FaChevronDown, FaChevronUp, FaTimes, FaLock, 
  FaPlane, FaShoppingBag, FaBriefcase, FaRegCreditCard,
  FaMobileAlt, FaInfoCircle, FaStar
} from "react-icons/fa";

// User's provided card data with enriched category definitions for filtering
const cards = [
  {
    name: "Freedom Credit Card",
    description: "Perfect entry-level card for daily spends",
    icon: "/icons/freedom.png",
    category: "Rewards",
    highlights: ["Earn 10X CashPoints on select merchants", "1% fuel surcharge waiver", "500 CashPoints welcome benefit"],
    fee: "Annual Fee: ₹500 (Waived on ₹50k annual spend)",
    network: "Visa",
    gradient: "linear-gradient(135deg, #1d2671 0%, #c33764 100%)",
    fallbackIcon: <FaGift />
  },
  {
    name: "MoneyBack+ Credit Card",
    description: "10X CashPoints on popular online merchants",
    icon: "/icons/moneyback.png",
    category: "Rewards",
    highlights: ["10X CashPoints on Amazon, Flipkart, Swiggy", "15% discount at partner restaurants", "Gift vouchers on milestone spends"],
    fee: "Annual Fee: ₹500 (Waived on ₹50k annual spend)",
    network: "Mastercard",
    gradient: "linear-gradient(135deg, #093028 0%, #237a57 100%)",
    fallbackIcon: <FaRegCreditCard />
  },
  {
    name: "Millennia Credit Card",
    description: "5% cashback on top online shopping brands",
    icon: "/icons/millennia.png",
    category: "Cashback",
    highlights: ["5% cashback on Amazon, Flipkart, Swiggy & more", "1% cashback on all other spends", "Complimentary lounge access quarterly"],
    fee: "Annual Fee: ₹1,000 (Waived on ₹1 Lakh annual spend)",
    network: "Visa",
    gradient: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
    fallbackIcon: <FaShoppingBag />
  },
  {
    name: "Regalia Gold Credit Card",
    description: "Premium travel and luxury lifestyle card",
    icon: "/icons/regalia.png",
    category: "Travel",
    highlights: ["Complimentary Club Marriott membership", "12 complimentary domestic & 6 international lounge visits", "5X Reward Points on travel spends"],
    fee: "Annual Fee: ₹2,500 (Waived on ₹3 Lakhs annual spend)",
    network: "Visa",
    gradient: "linear-gradient(135deg, #b88746 0%, #7d5a2b 100%)",
    fallbackIcon: <FaPlane />
  },
  {
    name: "BizGrow Credit Card",
    description: "Tailored for growing business expenses",
    icon: "/icons/bizgrow.png",
    category: "Business",
    highlights: ["10X Reward Points on business utilities & tax payments", "1% fuel surcharge waiver", "Up to 50 days interest-free period"],
    fee: "Annual Fee: ₹500 (Waived on ₹50k annual spend)",
    network: "Mastercard",
    gradient: "linear-gradient(135deg, #232526 0%, #414345 100%)",
    fallbackIcon: <FaBriefcase />
  },
  {
    name: "BizPower Credit Card",
    description: "Powering business spends with premium rewards",
    icon: "/icons/bizpower.png",
    category: "Business",
    highlights: ["4 complimentary lounge visits per year", "Accelerated rewards on business software & travel", "Milestone voucher benefits up to ₹5,000"],
    fee: "Annual Fee: ₹2,500 (Waived on ₹3 Lakhs annual spend)",
    network: "Visa",
    gradient: "linear-gradient(135deg, #4b6cb7 0%, #182848 100%)",
    fallbackIcon: <FaBriefcase />
  },
  {
    name: "BizFirst Credit Card",
    description: "Smart cashback on business utilities",
    icon: "/icons/bizfirst.png",
    category: "Business",
    highlights: ["3% cashback on business utilities, electronics & supplies", "1% cashback on other retail business spends", "Annual fee waiver on milestone spends"],
    fee: "Annual Fee: ₹500 (Waived on ₹50k annual spend)",
    network: "Mastercard",
    gradient: "linear-gradient(135deg, #5C258D 0%, #4389A2 100%)",
    fallbackIcon: <FaBriefcase />
  }
];

export function HDFCCardsPage({ onBack, C, isMobile, breadcrumbs }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Interaction State elements
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  
  // Selection states for comparator
  const [compareCard1, setCompareCard1] = useState(cards[2]); // Millennia
  const [compareCard2, setCompareCard2] = useState(cards[3]); // Regalia Gold

  // Filter criteria
  const filteredCards = cards.filter(card => {
    const matchesFilter = activeFilter === "All" || card.category === activeFilter;
    const matchesSearch = card.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          card.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filterCategories = ["All", "Cashback", "Travel", "Business", "Rewards"];

  // Custom UI Fallback Component for HDFC card layout in the banner
  const BannerImageFallback = () => (
    <div style={{
      width: "100%",
      height: isMobile ? "160px" : "220px",
      background: "linear-gradient(135deg, #0f1c3f 0%, #004b8f 50%, #00296b 100%)",
      borderRadius: "20px",
      position: "relative",
      overflow: "hidden",
      boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
      border: "1px solid rgba(255,255,255,0.08)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      {/* Decorative credit cards floating inside the banner image space */}
      <div style={{
        width: "180px",
        height: "110px",
        background: "linear-gradient(135deg, #b88746 0%, #7d5a2b 100%)",
        borderRadius: "8px",
        padding: "10px",
        color: "#fff",
        boxShadow: "0 10px 20px rgba(0,0,0,0.3)",
        transform: "rotate(-10deg) translate(-20px, 10px)",
        position: "absolute",
        zIndex: 1,
        border: "1px solid rgba(255,255,255,0.1)"
      }}>
        <div style={{ fontSize: "6px", fontWeight: 700, opacity: 0.9 }}>HDFC BANK</div>
        <div style={{ fontSize: "8px", fontWeight: 700, margin: "20px 0 10px 0" }}>•••• •••• •••• 9999</div>
        <div style={{ fontSize: "6px", opacity: 0.7 }}>REGALIA GOLD</div>
      </div>

      <div style={{
        width: "180px",
        height: "110px",
        background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
        borderRadius: "8px",
        padding: "10px",
        color: "#fff",
        boxShadow: "0 12px 25px rgba(0,0,0,0.4)",
        transform: "rotate(5deg) translate(20px, -10px)",
        position: "absolute",
        zIndex: 2,
        border: "1px solid rgba(255,255,255,0.1)"
      }}>
        <div style={{ fontSize: "6px", fontWeight: 700, opacity: 0.9 }}>HDFC BANK</div>
        <div style={{ fontSize: "8px", fontWeight: 700, margin: "20px 0 10px 0" }}>•••• •••• •••• 8888</div>
        <div style={{ fontSize: "6px", opacity: 0.7 }}>MILLENNIA</div>
      </div>
    </div>
  );

  // Card component with custom styling & failback icon loader
  function CardItem({ name, description, icon, fallbackIcon, fee, highlights, gradient }) {
    const [imgFailed, setImgFailed] = useState(false);

    return (
      <div className="bg-white rounded-2xl border p-5 shadow-sm hover:shadow-lg transition-all" style={{ position: "relative" }}>
        
        {/* Render a tiny mockup graphic instead of simple icons to look premium */}
        <div className="flex gap-4">
          <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center" style={{ flexShrink: 0, overflow: "hidden" }}>
            {!imgFailed ? (
              <img
                src={icon}
                alt=""
                className="w-8 h-8"
                onError={() => setImgFailed(true)}
                style={{ objectFit: "contain" }}
              />
            ) : (
              <div style={{ fontSize: "24px", color: "#003B8F" }}>
                {fallbackIcon}
              </div>
            )}
          </div>

          <div className="flex-1">
            <h3 className="font-bold text-slate-800">
              {name}
            </h3>

            <p className="text-sm text-slate-500 mt-2">
              {description}
            </p>

            {/* Added highlights in expansion for user premium look */}
            {highlights && (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "12px", borderTop: "1px dashed var(--border-color)", paddingTop: "10px" }}>
                {highlights.map((h, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "6px", fontSize: "11px", color: "var(--text-slate-500)" }}>
                    <span style={{ color: "#10b981", marginTop: "2px" }}><FaCheckCircle size={10} /></span>
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            )}

            {fee && (
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#eab308", background: isDark ? "rgba(234,179,8,0.06)" : "#fef9c3", padding: "4px 8px", borderRadius: "6px", display: "inline-block", marginTop: "10px" }}>
                {fee}
              </div>
            )}

            <button className="mt-4 w-full bg-[#003B8F] text-white py-2 rounded-lg hover:bg-[#00296B]" style={{ border: "none", cursor: "pointer", display: "block" }}>
              Apply Now →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Sidebar item component
  function SidebarItem({ title, desc }) {
    return (
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center" style={{ flexShrink: 0, color: "#2563eb", fontSize: "16px" }}>
          <FaCheckCircle />
        </div>

        <div>
          <h4 className="font-semibold text-sm">
            {title}
          </h4>

          <p className="text-xs text-slate-500">
            {desc}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* Dynamic CSS styles to build layout values cleanly without Tailwind compilation issues */}
      <style>{`
        :root {
          --bg-slate-50: #f8fafc;
          --bg-white: #ffffff;
          --border-color: #e2e8f0;
          --text-slate-500: #64748b;
          --text-slate-800: #1e293b;
          --bg-blue-50: #eff6ff;
          --bg-green-50: #f0fdf4;
          --bg-cyan-50: #ecfeff;
          --bg-blue-100: #dbeafe;
          --bg-slate-100: #f1f5f9;
          --text-blue-600: #2563eb;
          --text-green-600: #16a34a;
          --text-cyan-600: #0891b2;
        }

        .dark-theme {
          --bg-slate-50: #0f172a;
          --bg-white: #1e293b;
          --border-color: #334155;
          --text-slate-500: #94a3b8;
          --text-slate-800: #f1f5f9;
          --bg-blue-50: rgba(37, 99, 235, 0.1);
          --bg-green-50: rgba(22, 163, 74, 0.1);
          --bg-cyan-50: rgba(8, 145, 178, 0.1);
          --bg-blue-100: rgba(37, 99, 235, 0.2);
          --bg-slate-100: #334155;
          --text-blue-600: #60a5fa;
          --text-green-600: #4ade80;
          --text-cyan-600: #22d3ee;
        }

        .min-h-screen { min-height: 100vh; }
        .bg-slate-50 { background-color: var(--bg-slate-50); }
        .max-w-7xl { max-width: 1280px; }
        .mx-auto { margin-left: auto; margin-right: auto; }
        .px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
        .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
        .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
        .px-5 { padding-left: 1.25rem; padding-right: 1.25rem; }
        .flex { display: flex; }
        .items-center { align-items: center; }
        .gap-2 { gap: 0.5rem; }
        .gap-3 { gap: 0.75rem; }
        .gap-4 { gap: 1rem; }
        .gap-5 { gap: 1.25rem; }
        .gap-6 { gap: 1.5rem; }
        .gap-10 { gap: 2.5rem; }
        .text-sm { font-size: 0.875rem; }
        .text-xs { font-size: 0.75rem; }
        .text-slate-500 { color: var(--text-slate-500); }
        .text-blue-600 { color: var(--text-blue-600); }
        .text-green-600 { color: var(--text-green-600); }
        .text-cyan-600 { color: var(--text-cyan-600); }
        .font-medium { font-weight: 500; }
        .font-semibold { font-weight: 600; }
        .font-bold { font-weight: 700; }
        .bg-white { background-color: var(--bg-white); }
        .rounded-3xl { border-radius: 1.5rem; }
        .rounded-2xl { border-radius: 1rem; }
        .rounded-xl { border-radius: 0.75rem; }
        .rounded-lg { border-radius: 0.5rem; }
        .rounded-full { border-radius: 9999px; }
        .p-8 { padding: 2rem; }
        .p-6 { padding: 1.5rem; }
        .p-5 { padding: 1.25rem; }
        .p-4 { padding: 1rem; }
        .shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
        .border { border: 1px solid var(--border-color); }
        .grid { display: grid; }
        .text-4xl { font-size: 2.25rem; }
        .text-2xl { font-size: 1.5rem; }
        .text-lg { font-size: 1.125rem; }
        .text-slate-800 { color: var(--text-slate-800); }
        .mb-3 { margin-bottom: 0.75rem; }
        .mb-5 { margin-bottom: 1.25rem; }
        .mb-6 { margin-bottom: 1.5rem; }
        .mb-8 { margin-bottom: 2rem; }
        .mt-2 { margin-top: 0.5rem; }
        .mt-4 { margin-top: 1rem; }
        .mt-5 { margin-top: 1.25rem; }
        .mt-8 { margin-top: 2rem; }
        .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
        .bg-blue-50 { background-color: var(--bg-blue-50); }
        .bg-green-50 { background-color: var(--bg-green-50); }
        .bg-cyan-50 { background-color: var(--bg-cyan-50); }
        .bg-blue-100 { background-color: var(--bg-blue-100); }
        .bg-slate-100 { background-color: var(--bg-slate-100); }
        .w-full { width: 100%; }
        .w-16 { width: 4rem; }
        .h-16 { height: 4rem; }
        .w-8 { width: 2rem; }
        .h-8 { height: 2rem; }
        .w-10 { width: 2.5rem; }
        .h-10 { height: 2.5rem; }
        .flex-1 { flex: 1 1 0%; }
        .bg-\[\#003B8F\] { background-color: #003B8F; }
        .bg-blue-700 { background-color: #1d4ed8; }
        .text-white { color: #ffffff; }
        .transition-all { transition-property: all; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }

        .hover\:shadow-lg:hover {
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          transform: translateY(-4px);
        }
        .hover\:bg-\[\#00296B\]:hover {
          background-color: #00296B;
        }

        /* Responsive Columns mapping */
        @media (min-width: 768px) {
          .md\:grid-cols-2 {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .lg\:grid-cols-4 {
            grid-template-columns: repeat(4, 1fr);
          }
          .lg\:col-span-3 {
            grid-column: span 3 / span 3;
          }
        }

        .space-y-4 > * + * {
          margin-top: 1rem;
        }
      `}</style>

      {/* Breadcrumb - user's layout structure with live action triggers */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span onClick={onBack} style={{ cursor: "pointer" }} onMouseEnter={e => e.target.style.textDecoration = 'underline'} onMouseLeave={e => e.target.style.textDecoration = 'none'}>Home</span>
          <span>/</span>
          <span onClick={onBack} style={{ cursor: "pointer" }} onMouseEnter={e => e.target.style.textDecoration = 'underline'} onMouseLeave={e => e.target.style.textDecoration = 'none'}>Credit Cards</span>
          <span>/</span>
          <span className="text-blue-600 font-medium">
            HDFC Bank Credit Cards
          </span>
        </div>
      </div>

      {/* Hero Banner - user's requested layout with fallback handling */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-white rounded-3xl p-8 shadow-sm border">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            
            <div>
              <h1 className="text-4xl font-bold text-slate-800 mb-3">
                HDFC Bank Credit Cards
              </h1>

              <p className="text-slate-500 mb-8">
                Explore a range of credit cards that suit your lifestyle and needs.
              </p>

              <div className="grid grid-cols-3 gap-4">
                
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="text-blue-600 font-semibold">
                    Exclusive Rewards
                  </div>
                  <p className="text-xs text-slate-500">
                    Earn more on every spend
                  </p>
                </div>

                <div className="bg-green-50 rounded-xl p-4">
                  <div className="text-green-600 font-semibold">
                    Secure & Trusted
                  </div>
                  <p className="text-xs text-slate-500">
                    100% safe banking
                  </p>
                </div>

                <div className="bg-cyan-50 rounded-xl p-4">
                  <div className="text-cyan-600 font-semibold">
                    Instant Approval
                  </div>
                  <p className="text-xs text-slate-500">
                    Hassle-free process
                  </p>
                </div>

              </div>
            </div>

            {/* Banner image slot (with robust visual mockup fallback) */}
            <div>
              <img
                src="/images/hdfc-banner.png"
                alt=""
                className="w-full"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
              {/* If image doesn't exist, display visual credit cards */}
              <div id="banner-fallback-container" style={{ display: "block" }}>
                <BannerImageFallback />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Filters and Live Search (Integrated below banner for premium usability) */}
      <div className="max-w-7xl mx-auto px-6 mt-8">
        <div style={{ 
          background: "var(--bg-white)", 
          padding: "16px 20px", 
          borderRadius: "16px", 
          border: "1px solid var(--border-color)", 
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          display: "flex", 
          flexDirection: isMobile ? "column" : "row", 
          justifyContent: "space-between", 
          alignItems: "center", 
          gap: "12px"
        }}>
          {/* Local Search input */}
          <div style={{ position: "relative", width: isMobile ? "100%" : "280px" }}>
            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-slate-500)" }}><FaSearch size={14} /></span>
            <input 
              type="text" 
              placeholder="Search credit cards..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 36px",
                background: "var(--bg-slate-100)",
                border: "1px solid var(--border-color)",
                borderRadius: "8px",
                fontSize: "13px",
                color: "var(--text-slate-800)",
                outline: "none"
              }}
            />
            {searchQuery && (
              <span onClick={() => setSearchQuery("")} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "var(--text-slate-500)" }}><FaTimes size={12} /></span>
            )}
          </div>

          {/* Filter Pills */}
          <div style={{ display: "flex", gap: "6px", overflowX: "auto", width: isMobile ? "100%" : "auto", paddingBottom: isMobile ? "4px" : 0 }}>
            {filterCategories.map((cat, idx) => {
              const isActive = activeFilter === cat;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveFilter(cat)}
                  style={{
                    background: isActive ? "#003B8F" : "var(--bg-slate-100)",
                    color: isActive ? "#fff" : "var(--text-slate-800)",
                    border: `1px solid ${isActive ? "#003B8F" : "var(--border-color)"}`,
                    padding: "6px 12px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content Layout - user's responsive column wrapper */}
      <div className="max-w-7xl mx-auto px-6 mt-8">
        <div className="grid lg:grid-cols-4 gap-6">

          {/* Cards Section (Left span) */}
          <div className="lg:col-span-3">

            <h2 className="text-2xl font-bold mb-6">
              {activeFilter !== "All" ? `${activeFilter} Cards` : "Core Cards"}
            </h2>

            {filteredCards.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-5">
                {filteredCards.map((card) => (
                  <CardItem key={card.name} {...card} />
                ))}
              </div>
            ) : (
              <div style={{ background: "var(--bg-white)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "40px 20px", textAlign: "center" }}>
                <p style={{ color: "var(--text-slate-500)", margin: 0 }}>No cards match your current search/filters.</p>
              </div>
            )}

          </div>

          {/* Sidebar (Right span) */}
          <div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border">
              <h3 className="font-bold text-lg mb-5">
                Why Choose HDFC Bank Credit Cards?
              </h3>

              <div className="space-y-4">

                <SidebarItem
                  title="Wide Range of Cards"
                  desc="For every lifestyle and need"
                />

                <SidebarItem
                  title="Rewarding Benefits"
                  desc="Earn points, cashback and more"
                />

                <SidebarItem
                  title="Secure Transactions"
                  desc="Advanced security features"
                />

                <SidebarItem
                  title="Easy Applications"
                  desc="Quick approval process"
                />

              </div>
            </div>

            {/* Compare Cards box (hooked up to interactive modal) */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 mt-5 border">
              <h3 className="font-semibold text-slate-800">
                Find the perfect card
              </h3>

              <p className="text-sm text-slate-500 mt-2">
                Compare cards and choose the best one.
              </p>

              <button 
                onClick={() => setIsCompareOpen(true)}
                className="mt-4 bg-blue-700 text-white px-5 py-2 rounded-lg"
                style={{ border: "none", cursor: "pointer", fontWeight: 700 }}
              >
                Compare Cards
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* Accordion FAQ Widget (inserted at the bottom of the page for maximum utility) */}
      <div className="max-w-7xl mx-auto px-6 mt-12 pb-12">
        <div className="bg-white rounded-3xl p-8 border shadow-sm">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">
            Frequently Asked Questions
          </h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              { q: "How do I get my annual fee waived?", a: "Most HDFC Credit Cards feature spend-based fee waivers. If you meet the minimum required annual spend limit (e.g. ₹50,000 for Freedom/MoneyBack+ or ₹1 Lakh for Millennia) within your card anniversary year, your annual membership fee is fully waived/reversed." },
              { q: "What are the eligibility criteria for HDFC Credit Cards?", a: "Applicants generally need to be between 21 and 60 years old for salaried professionals (or up to 65 for self-employed). A healthy credit score (750+ CIBIL score) and stable monthly income (starting from ₹20,000 for entry-level cards) increase the approval rate significantly." },
              { q: "Can I apply for a secured card if I have a low CIBIL score?", a: "Yes! HDFC offers FD-backed secured credit cards that require no income proofs, documentation audits, or CIBIL score checks. The credit limit is directly mapped to your Fixed Deposit (up to 90%), making it the fastest way to build credit history." }
            ].map((faq, idx) => {
              const isOpen = expandedFaq === idx;
              return (
                <div key={idx} style={{ 
                  background: "var(--bg-slate-100)", 
                  border: "1px solid var(--border-color)", 
                  borderRadius: "12px", 
                  overflow: "hidden" 
                }}>
                  <div 
                    onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                    style={{ 
                      padding: "16px 20px", 
                      cursor: "pointer", 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "center",
                      fontWeight: 700,
                      fontSize: "14px",
                      color: "var(--text-slate-800)"
                    }}
                  >
                    <span>{faq.q}</span>
                    <span style={{ color: "var(--text-slate-500)" }}>{isOpen ? <FaChevronUp /> : <FaChevronDown />}</span>
                  </div>
                  {isOpen && (
                    <div style={{ 
                      padding: "0 20px 16px 20px", 
                      fontSize: "12px", 
                      color: "var(--text-slate-500)", 
                      lineHeight: 1.5,
                      borderTop: "1px solid var(--border-color)",
                      paddingTop: "12px"
                    }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* INTERACTIVE COMPARE MODAL overlay */}
      {isCompareOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.6)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
          backdropFilter: "blur(4px)"
        }}>
          <div style={{
            background: "var(--bg-white)",
            width: "100%",
            maxWidth: "600px",
            borderRadius: "24px",
            border: "1px solid var(--border-color)",
            padding: "24px",
            position: "relative",
            boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
            color: "var(--text-slate-800)"
          }}>
            {/* Close button */}
            <span 
              onClick={() => setIsCompareOpen(false)}
              style={{ position: "absolute", right: "20px", top: "20px", cursor: "pointer", color: "var(--text-slate-500)" }}
            >
              <FaTimes size={18} />
            </span>

            <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: 900 }}>Compare HDFC Credit Cards</h3>
            
            {/* Selector Dropdowns */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
              <div>
                <label style={{ fontSize: "11px", color: "var(--text-slate-500)", display: "block", marginBottom: "4px", fontWeight: 700 }}>Card 1</label>
                <select 
                  value={compareCard1.name} 
                  onChange={(e) => setCompareCard1(cards.find(c => c.name === e.target.value))}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    background: "var(--bg-slate-100)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-slate-800)",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: 700,
                    outline: "none"
                  }}
                >
                  {cards.map((c, idx) => (
                    <option key={idx} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{ fontSize: "11px", color: "var(--text-slate-500)", display: "block", marginBottom: "4px", fontWeight: 700 }}>Card 2</label>
                <select 
                  value={compareCard2.name} 
                  onChange={(e) => setCompareCard2(cards.find(c => c.name === e.target.value))}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    background: "var(--bg-slate-100)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-slate-800)",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: 700,
                    outline: "none"
                  }}
                >
                  {cards.map((c, idx) => (
                    <option key={idx} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Comparison Grid Table */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", border: "1px solid var(--border-color)", borderRadius: "12px", overflow: "hidden", background: "var(--bg-slate-100)" }}>
              {[
                { label: "Category", val1: compareCard1.category, val2: compareCard2.category },
                { label: "Joining/Annual Fee", val1: compareCard1.fee, val2: compareCard2.fee },
                { label: "Key Spend Benefit", val1: compareCard1.highlights[0], val2: compareCard2.highlights[0] },
                { label: "Primary Advantage", val1: compareCard1.description, val2: compareCard2.description },
                { label: "Payment network", val1: compareCard1.network, val2: compareCard2.network }
              ].map((row, idx) => (
                <div key={idx} style={{ 
                  display: "grid", 
                  gridTemplateColumns: "1fr 1fr 1fr", 
                  borderBottom: idx === 4 ? "none" : "1px solid var(--border-color)",
                  fontSize: "11px",
                  lineHeight: 1.4
                }}>
                  <div style={{ padding: "10px", fontWeight: 800, background: "var(--bg-white)", borderRight: "1px solid var(--border-color)" }}>{row.label}</div>
                  <div style={{ padding: "10px", borderRight: "1px solid var(--border-color)", color: "var(--text-slate-800)" }}>{row.val1}</div>
                  <div style={{ padding: "10px", color: "var(--text-slate-800)" }}>{row.val2}</div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setIsCompareOpen(false)}
              style={{
                marginTop: "20px",
                width: "100%",
                background: "#003B8F",
                color: "#ffffff",
                border: "none",
                padding: "10px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 800,
                cursor: "pointer"
              }}
            >
              Close Comparison
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../Partner/ThemeContext";
import { 
  FaArrowLeft, FaGift, FaShieldAlt, FaClock, FaSearch, 
  FaCheckCircle, FaArrowRight, FaQuestionCircle, 
  FaChevronDown, FaChevronUp, FaTimes, FaLock, 
  FaPlane, FaShoppingBag, FaBriefcase, FaRegCreditCard,
  FaMobileAlt, FaInfoCircle, FaStar
} from "react-icons/fa";
import hdfcBanner from "./image/hdfcbanner.png";

// User's provided card data with enriched category definitions for filtering
const cards = [
  // Core Cards
  {
    id: "freedom",
    name: "Freedom Credit Card",
    description: "Perfect entry-level card for daily spends",
    icon: "/icons/freedom.png",
    category: "Rewards",
    section: "Core Cards",
    highlights: ["Earn 10X CashPoints on select merchants", "1% fuel surcharge waiver", "500 CashPoints welcome benefit"],
    fee: "Annual Fee: ₹500 (Waived on ₹50k annual spend)",
    network: "Visa",
    gradient: "linear-gradient(135deg, #1d2671 0%, #c33764 100%)",
    fallbackIcon: <FaGift />
  },
  {
    id: "moneyback",
    name: "MoneyBack+ Credit Card",
    description: "10X CashPoints on popular online merchants",
    icon: "/icons/moneyback.png",
    category: "Rewards",
    section: "Core Cards",
    highlights: ["10X CashPoints on Amazon, Flipkart, Swiggy", "15% discount at partner restaurants", "Gift vouchers on milestone spends"],
    fee: "Annual Fee: ₹500 (Waived on ₹50k annual spend)",
    network: "Mastercard",
    gradient: "linear-gradient(135deg, #093028 0%, #237a57 100%)",
    fallbackIcon: <FaRegCreditCard />
  },
  {
    id: "millennia",
    name: "Millennia Credit Card",
    description: "5% cashback on top online shopping brands",
    icon: "/icons/millennia.png",
    category: "Cashback",
    section: "Core Cards",
    highlights: ["5% cashback on Amazon, Flipkart, Swiggy & more", "1% cashback on all other spends", "Complimentary lounge access quarterly"],
    fee: "Annual Fee: ₹1,000 (Waived on ₹1 Lakh annual spend)",
    network: "Visa",
    gradient: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
    fallbackIcon: <FaShoppingBag />
  },
  {
    id: "regalia",
    name: "Regalia Gold Credit Card",
    description: "Premium travel and luxury lifestyle card",
    icon: "/icons/regalia.png",
    category: "Travel",
    section: "Core Cards",
    highlights: ["Complimentary Club Marriott membership", "12 complimentary domestic & 6 international lounge visits", "5X Reward Points on travel spends"],
    fee: "Annual Fee: ₹2,500 (Waived on ₹3 Lakhs annual spend)",
    network: "Visa",
    gradient: "linear-gradient(135deg, #b88746 0%, #7d5a2b 100%)",
    fallbackIcon: <FaPlane />
  },
  {
    id: "bizgrow",
    name: "BizGrow Credit Card",
    description: "Tailored for growing business expenses",
    icon: "/icons/bizgrow.png",
    category: "Business",
    section: "Core Cards",
    highlights: ["10X Reward Points on business utilities & tax payments", "1% fuel surcharge waiver", "Up to 50 days interest-free period"],
    fee: "Annual Fee: ₹500 (Waived on ₹50k annual spend)",
    network: "Mastercard",
    gradient: "linear-gradient(135deg, #232526 0%, #414345 100%)",
    fallbackIcon: <FaBriefcase />
  },
  {
    id: "bizpower",
    name: "BizPower Credit Card",
    description: "Powering business spends with premium rewards",
    icon: "/icons/bizpower.png",
    category: "Business",
    section: "Core Cards",
    highlights: ["4 complimentary lounge visits per year", "Accelerated rewards on business software & travel", "Milestone voucher benefits up to ₹5,000"],
    fee: "Annual Fee: ₹2,500 (Waived on ₹3 Lakhs annual spend)",
    network: "Visa",
    gradient: "linear-gradient(135deg, #4b6cb7 0%, #182848 100%)",
    fallbackIcon: <FaBriefcase />
  },
  {
    id: "bizfirst",
    name: "BizFirst Credit Card",
    description: "Smart cashback on business utilities",
    icon: "/icons/bizfirst.png",
    category: "Business",
    section: "Core Cards",
    highlights: ["3% cashback on business utilities, electronics & supplies", "1% cashback on other retail business spends", "Annual fee waiver on milestone spends"],
    fee: "Annual Fee: ₹500 (Waived on ₹50k annual spend)",
    network: "Mastercard",
    gradient: "linear-gradient(135deg, #5C258D 0%, #4389A2 100%)",
    fallbackIcon: <FaBriefcase />
  },
  
  // Co-Branded Cards
  {
    id: "pixelplay",
    name: "Pixel Play Credit Card",
    description: "Customizable rewards in a digital-first avatar",
    icon: "/icons/pixelplay.png",
    category: "Rewards",
    section: "Co-Branded Cards",
    highlights: ["Choose your own reward merchant merchants", "Instant digital activation in minutes", "1% fuel surcharge waiver"],
    fee: "Annual Fee: ₹500 (Waived on ₹50k annual spend)",
    network: "Visa",
    gradient: "linear-gradient(135deg, #FF512F 0%, #DD2476 100%)",
    fallbackIcon: <FaRegCreditCard />,
    link: "https://applyonline.hdfcbank.com/cards/credit-cards.html?CHANNELSOURCE=ZETA&DSACode=XYOH&LGcode=GHAR01&LCcode=GHAR01&LC2=GHAR01&SMcode=S54558#nbb"
  },
  {
    id: "pixelgo",
    name: "Pixel Go Credit Card",
    description: "Smart digital-first card for daily online spends",
    icon: "/icons/pixelgo.png",
    category: "Rewards",
    section: "Co-Branded Cards",
    highlights: ["Custom merchant cashback options", "Digital wallet controls inside PayZapp", "Complimentary insurance covers"],
    fee: "Annual Fee: ₹500 (Waived on ₹50k annual spend)",
    network: "Visa",
    gradient: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
    fallbackIcon: <FaMobileAlt />,
    link: "https://applyonline.hdfcbank.com/cards/credit-cards.html?CHANNELSOURCE=ZETA&DSACode=XYOH&LGcode=GHAR01&LCcode=GHAR01&LC2=GHAR01&SMcode=S54558#nbb"
  },
  {
    id: "tataneuplus",
    name: "Tata Neu Plus Credit Card",
    description: "2% NeuCoins back on Neu spends and partners",
    icon: "/icons/tataneuplus.png",
    category: "Cashback",
    section: "Co-Branded Cards",
    highlights: ["2% NeuCoins on Tata Neu and partner brands", "1% NeuCoins on other domestic & merchant spends", "4 complimentary domestic lounge visits annually"],
    fee: "Annual Fee: ₹499 (Waived on ₹1 Lakh annual spend)",
    network: "RuPay",
    gradient: "linear-gradient(135deg, #4568DC 0%, #B06AB8 100%)",
    fallbackIcon: <FaGift />,
    link: "https://applyonline.hdfcbank.com/cards/credit-cards.html?CHANNELSOURCE=TDCC&DEDUPE=N&DSACode=XYOH&LGcode=GHAR01&LCcode=GHAR01&LC2=GHAR01&SMcode=S54558"
  },
  {
    id: "tataneuinfinity",
    name: "Tata Neu Infinity Credit Card",
    description: "5% NeuCoins back on Neu spends and partners",
    icon: "/icons/tataneuinfinity.png",
    category: "Cashback",
    section: "Co-Branded Cards",
    highlights: ["5% NeuCoins on Tata Neu and partner brands", "1.5% NeuCoins on non-Tata spends", "8 domestic & 4 international lounge visits annually"],
    fee: "Annual Fee: ₹1,499 (Waived on ₹3 Lakhs annual spend)",
    network: "RuPay",
    gradient: "linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)",
    fallbackIcon: <FaGift />,
    link: "https://applyonline.hdfcbank.com/cards/credit-cards.html?CHANNELSOURCE=TDCC&DEDUPE=N&DSACode=XYOH&LGcode=GHAR01&LCcode=GHAR01&LC2=GHAR01&SMcode=S54558"
  },
  {
    id: "swiggy",
    name: "Swiggy HDFC Bank Credit Card",
    description: "10% cashback on Swiggy app dining and delivery",
    icon: "/icons/swiggy.png",
    category: "Cashback",
    section: "Co-Branded Cards",
    highlights: ["10% cashback on Swiggy food, Instamart & Dineout", "5% cashback on top online shopping platforms", "1% cashback on other everyday spends"],
    fee: "Annual Fee: ₹500 (Waived on ₹2 Lakhs annual spend)",
    network: "Mastercard",
    gradient: "linear-gradient(135deg, #f12711 0%, #f5af19 100%)",
    fallbackIcon: <FaShoppingBag />,
    link: "https://applyonline.hdfcbank.com/cards/credit-cards.html?CHANNELSOURCE=SWCC&DSACode=XYOH&LGcode=GHAR01&LCcode=GHAR01&LC2=GHAR01&SMcode=S54558#nbb"
  },
  {
    id: "indianoil",
    name: "IndianOil HDFC Bank Credit Card",
    description: "Earn up to 50 Liters of free fuel annually",
    icon: "/icons/indianoil.png",
    category: "Rewards",
    section: "Co-Branded Cards",
    highlights: ["Earn fuel points on IndianOil fuel purchases", "1% fuel surcharge waiver across outlets", "Reward points on grocery and bill payments"],
    fee: "Annual Fee: ₹500 (Waived on ₹50k annual spend)",
    network: "Visa",
    gradient: "linear-gradient(135deg, #ff9966 0%, #ff5e62 100%)",
    fallbackIcon: <FaGift />,
    link: "https://applyonline.hdfcbank.com/cards/credit-cards.html?FUNC=FLOAT&CHANNEL=DSA&DSACODE=XYOH&LGcode=GHAR01&LCcode=GHAR01&LC2=GHAR01&SMcode=S54558"
  },
  {
    id: "irctc",
    name: "IRCTC HDFC Bank Credit Card",
    description: "Save on railway ticket bookings via IRCTC",
    icon: "/icons/irctc.png",
    category: "Travel",
    section: "Co-Branded Cards",
    highlights: ["Up to 5X reward points on IRCTC app spends", "1% transaction charges waiver on IRCTC website", "Complimentary railway lounge access visits"],
    fee: "Annual Fee: ₹500 (Waived on ₹1.5 Lakhs annual spend)",
    network: "RuPay",
    gradient: "linear-gradient(135deg, #3a7bd5 0%, #3a6073 100%)",
    fallbackIcon: <FaPlane />,
    link: "https://applyonline.hdfcbank.com/cards/credit-cards.html?CHANNELSOURCE=IRCT&DSACode=XYOH&LGcode=GHAR01&LCcode=GHAR01&LC2=GHAR01&SMcode=S54558#nbb"
  },
  {
    id: "dinersprivilege",
    name: "Diners Club Privilege Credit Card",
    description: "Exclusive global lounge access and dining benefits",
    icon: "/icons/dinersprivilege.png",
    category: "Travel",
    section: "Co-Branded Cards",
    highlights: ["Complimentary annual memberships for Amazon Prime & Swiggy", "12 complimentary global airport lounge visits annually", "2X rewards on dining and weekend spends"],
    fee: "Annual Fee: ₹2,500 (Waived on ₹3 Lakhs annual spend)",
    network: "Diners Club",
    gradient: "linear-gradient(135deg, #141e30 0%, #243b55 100%)",
    fallbackIcon: <FaStar />,
    link: "https://applyonline.hdfcbank.com/cards/credit-cards.html?CHANNELSOURCE=DINE&DSACode=XYOH&LGcode=GHAR01&LCcode=GHAR01&LC2=GHAR01&SMcode=S54558#nbb"
  },
  {
    id: "dinersblack",
    name: "Diners Club Black Credit Card",
    description: "Super premium card for global luxury travelers",
    icon: "/icons/dinersblack.png",
    category: "Travel",
    section: "Co-Branded Cards",
    highlights: ["Unlimited airport lounge access globally", "5X reward points on travel and hotel bookings", "Complimentary golf games at premium clubs"],
    fee: "Annual Fee: ₹10,000 (Waived on ₹8 Lakhs annual spend)",
    network: "Diners Club",
    gradient: "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
    fallbackIcon: <FaStar />,
    link: "https://applyonline.hdfcbank.com/cards/credit-cards.html?CHANNELSOURCE=DINE&DSACode=XYOH&LGcode=GHAR01&LCcode=GHAR01&LC2=GHAR01&SMcode=S54558#nbb"
  },
  {
    id: "marriott",
    name: "Marriott Bonvoy HDFC Bank Credit Card",
    description: "Complimentary hotel nights and loyalty points",
    icon: "/icons/marriott.png",
    category: "Travel",
    section: "Co-Branded Cards",
    highlights: ["1 free night award welcome benefit at Marriott properties", "Silver Elite status benefits with late checkout", "10 Elite night credits credited annually"],
    fee: "Annual Fee: ₹3,000 (Non-waivable)",
    network: "Visa",
    gradient: "linear-gradient(135deg, #6441A5 0%, #2a0845 100%)",
    fallbackIcon: <FaPlane />,
    link: "https://applyonline.hdfcbank.com/cards/credit-cards.html?CHANNELSOURCE=MRTB&DEDUPE=N&DSACode=XYOH&LGcode=GHAR01&LCcode=GHAR01&LC2=GHAR01&SMcode=S54558#nbb"
  },
  {
    id: "shoppersstopblack",
    name: "Shoppers Stop Black HDFC Bank Credit Card",
    description: "Elite membership and premium rewards at Shoppers Stop",
    icon: "/icons/shoppersstopblack.png",
    category: "Rewards",
    section: "Co-Branded Cards",
    highlights: ["Complimentary Shoppers Stop Golden Glow Club membership", "Up to 7% back on Shoppers Stop spends", "First citizen loyalty benefits on milestones"],
    fee: "Annual Fee: ₹4,500 (Waived on ₹4 Lakhs annual spend)",
    network: "Visa",
    gradient: "linear-gradient(135deg, #3E5151 0%, #DECBA4 100%)",
    fallbackIcon: <FaShoppingBag />
  },
  {
    id: "shoppersstop",
    name: "Shoppers Stop Credit Card",
    description: "Accelerated reward points on fashion shopping",
    icon: "/icons/shoppersstop.png",
    category: "Rewards",
    section: "Co-Branded Cards",
    highlights: ["Up to 3% back on Shoppers Stop apparel spends", "Accelerated first citizen reward points", "Annual fee waiver on milestone spends"],
    fee: "Annual Fee: ₹500 (Waived on ₹50k annual spend)",
    network: "Visa",
    gradient: "linear-gradient(135deg, #8A2387 0%, #E94057 50%, #F27121 100%)",
    fallbackIcon: <FaShoppingBag />
  },
  
  // Secured Cards
  {
    id: "securedexistingfd",
    name: "Against Existing FD",
    description: "Get credit limit mapped directly against your existing FD",
    icon: "/icons/securedexistingfd.png",
    category: "Business",
    section: "Secured Cards",
    highlights: ["No income proof or income tax documents needed", "Earn high interest on FD while spending on credit", "90% credit limit mapped directly against deposit value"],
    fee: "Annual Fee: Nil (Zero annual fee)",
    network: "Visa",
    gradient: "linear-gradient(135deg, #000000 0%, #434343 100%)",
    fallbackIcon: <FaLock />,
    link: "https://applyonline.hdfcbank.com/digital/etb-fixed-deposit-cc?Channel=DSA&LGCode=XYOH&SMCode=SS4558&LC1=GHAR01&LC2=GHAR01&DSACode=XYOH#nbb"
  },
  {
    id: "securednewfd",
    name: "New FD Based Credit Card",
    description: "Open a new FD instantly to unlock HDFC credit power",
    icon: "/icons/securednewfd.png",
    category: "Business",
    section: "Secured Cards",
    highlights: ["Instant issuance in under 5 minutes online", "Zero document check or CIBIL score checks", "100% safe path to build credit history"],
    fee: "Annual Fee: Nil (Zero annual fee)",
    network: "Visa",
    gradient: "linear-gradient(135deg, #00b09b 0%, #96c93d 100%)",
    fallbackIcon: <FaLock />,
    link: "https://pixel.hdfcbank.in/pixel-onboard/landing/?flow=FDLien&sourcing.assist.channelCode=DSA&sourcing.assist.branchCode=XYOH&sourcing.assist.employeeCode=S54558&sourcing.assist.dsaCode=XYOH&sourcing.assist.lgCode=GHAR01&sourcing.assist.lc1Code=GHAR01&sourcing.assist.lc2Code=GHAR01&sourcing.assist.dsaCode=XYOH"
  }
];

export function HDFCCardsPage({ onBack, C, isMobile, breadcrumbs }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Local products mapping state
  const [dbProducts, setDbProducts] = useState([]);

  useEffect(() => {
    const fetchDbProducts = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const res = await fetch(`${baseUrl}/api/v1/products?limit=100`);
        const data = await res.json();
        if (data && data.success) {
          setDbProducts(data.data);
        }
      } catch (err) {
        console.warn("Failed to load products for mapping in HDFCCardsPage:", err);
      }
    };
    fetchDbProducts();
  }, []);

  const handleApplyClick = (card) => {
    // Check if we have a direct link for this card
    const cardData = cards.find(c => c.id === card.id || c.name === card.name);
    if (cardData && cardData.link) {
      window.location.href = cardData.link;
      return;
    }

    // Attempt to match card.name to db product name
    const match = dbProducts.find(p => 
      p.name.toLowerCase().includes(card.name.toLowerCase()) || 
      card.name.toLowerCase().includes(p.name.toLowerCase())
    );
    if (match) {
      navigate(`/product/${match.id}`);
    } else {
      navigate(`/category/credit_card`);
    }
  };

  // Interaction State elements
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  
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

  // Group filtered cards by section, preserving order
  const sectionOrder = ["Core Cards", "Co-Branded Cards", "Secured Cards"];
  const groupedSections = sectionOrder
    .map(secName => ({
      title: secName,
      cards: filteredCards.filter(c => c.section === secName)
    }))
    .filter(sec => sec.cards.length > 0);

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
  function CardItem({ id, name, icon, fallbackIcon }) {
    const [imgFailed, setImgFailed] = useState(false);

    const translatedName = t(`hdfc.cards.${id}.name`, name);

    return (
      <div className="bg-white rounded-2xl border p-5 shadow-sm hover:shadow-lg transition-all" style={{ position: "relative" }}>
        
        {/* Render a tiny mockup graphic instead of simple icons to look premium */}
        <div className="flex gap-4 items-center">
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
            <h3 className="font-bold text-slate-800" style={{ margin: 0, fontSize: "15px", lineHeight: 1.3 }}>
              {translatedName}
            </h3>

            <button 
              onClick={() => handleApplyClick({ id, name })}
              className="mt-3 bg-[#003B8F] text-white py-1.5 px-4 rounded-lg hover:bg-[#00296B]" 
              style={{ border: "none", cursor: "pointer", display: "inline-block", fontSize: "12px", fontWeight: 700 }}
            >
              {t('popularCardsList.applyNow', 'Apply Now')}
            </button>
          </div>
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
        .p-responsive { padding: 1rem; }
        .text-responsive-title { font-size: 1.5rem; line-height: 1.2; }
        @media (min-width: 768px) {
          .p-responsive { padding: 2rem; }
          .text-responsive-title { font-size: 2.25rem; }
        }
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
        .text-center { text-align: center; }
        .pb-12 { padding-bottom: 3rem; }
        .mt-12 { margin-top: 3rem; }
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
          <span onClick={onBack} style={{ cursor: "pointer" }} onMouseEnter={e => e.target.style.textDecoration = 'underline'} onMouseLeave={e => e.target.style.textDecoration = 'none'}>{t('home.breadcrumbs.home', 'Home')}</span>
          <span>/</span>
          <span onClick={onBack} style={{ cursor: "pointer" }} onMouseEnter={e => e.target.style.textDecoration = 'underline'} onMouseLeave={e => e.target.style.textDecoration = 'none'}>{t('home.breadcrumbs.creditCards', 'Credit Cards')}</span>
          <span>/</span>
          <span className="text-blue-600 font-medium">
            {t('hdfc.title', 'HDFC Bank Credit Cards')}
          </span>
        </div>
      </div>

      {/* Hero Banner - user's requested layout with fallback handling */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-white rounded-3xl p-responsive shadow-sm border">
          <div className="grid md:grid-cols-2 gap-6 items-center">
            
            <div style={{ padding: isMobile ? "10px 0" : "0" }}>
              <h1 className="text-responsive-title font-bold text-slate-800" style={{ margin: 0, textAlign: isMobile ? "center" : "left" }}>
                {t('hdfc.title', 'HDFC Bank Credit Cards')}
              </h1>
            </div>

            {/* Banner image slot */}
            <div>
              <img
                src={hdfcBanner}
                alt="HDFC Bank Credit Cards Banner"
                style={{
                  width: "100%",
                  borderRadius: "20px",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                  display: "block"
                }}
              />
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
              placeholder={t('hdfc.searchPlaceholder', 'Search credit cards...')} 
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
                  {t('hdfc.filter.' + cat.toLowerCase(), cat)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content Layout - user's responsive column wrapper */}
      <div className="max-w-7xl mx-auto px-6 mt-8 pb-12">
        <div className="grid lg:grid-cols-4 gap-6">

          {/* Cards Section (Left span) */}
          <div className="lg:col-span-3">

            {groupedSections.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
                {groupedSections.map((sec) => (
                  <div key={sec.title}>
                    <h2 style={{
                      fontSize: "18px",
                      fontWeight: 800,
                      color: "var(--text-slate-800)",
                      margin: "0 0 14px 0",
                      paddingBottom: "8px",
                      borderBottom: "2px solid #003B8F",
                      display: "inline-block"
                    }}>
                      {sec.title}
                    </h2>
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr",
                      gap: "10px"
                    }}>
                      {sec.cards.map((card) => (
                        <button
                          key={card.id}
                          onClick={() => setSelectedCard(card)}
                          style={{
                            background: "var(--bg-white)",
                            color: "var(--text-slate-800)",
                            border: "1px solid var(--border-color)",
                            padding: "12px 14px",
                            borderRadius: "12px",
                            fontSize: "13px",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-start",
                            gap: "8px",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                            transition: "all 0.2s ease",
                            textAlign: "left",
                            lineHeight: 1.3,
                            minHeight: "48px"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "#003B8F";
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,59,143,0.1)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "var(--border-color)";
                            e.currentTarget.style.transform = "none";
                            e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
                          }}
                        >
                          <span style={{ display: "flex", alignItems: "center", color: "#003B8F", fontSize: "15px", flexShrink: 0 }}>
                            {card.fallbackIcon}
                          </span>
                          <span>{t(`hdfc.cards.${card.id}.name`, card.name)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ background: "var(--bg-white)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "40px 20px", textAlign: "center", width: "100%" }}>
                <p style={{ color: "var(--text-slate-500)", margin: 0 }}>{t('hdfc.noCardsFound', 'No cards match your current search/filters.')}</p>
              </div>
            )}

          </div>

          {/* Sidebar (Right span) */}
          <div style={{ marginBottom: isMobile ? "40px" : "0" }}>

            {/* Compare Cards box (hooked up to interactive modal) */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border">
              <h3 className="font-semibold text-slate-800">
                {t('hdfc.findPerfectCard', 'Find the perfect card')}
              </h3>

              <p className="text-sm text-slate-500 mt-2">
                {t('hdfc.compareDesc', 'Compare cards and choose the best one.')}
              </p>

              <button 
                onClick={() => setIsCompareOpen(true)}
                className="mt-4 bg-blue-700 text-white px-5 py-2 rounded-lg"
                style={{ border: "none", cursor: "pointer", fontWeight: 700 }}
              >
                {t('hdfc.compareBtn', 'Compare Cards')}
              </button>
            </div>

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

            <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: 900 }}>{t('hdfc.compareTitle', 'Compare HDFC Credit Cards')}</h3>
            
            {/* Selector Dropdowns */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
              <div>
                <label style={{ fontSize: "11px", color: "var(--text-slate-500)", display: "block", marginBottom: "4px", fontWeight: 700 }}>{t('hdfc.compareLabelCard1', 'Card 1')}</label>
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
                    <option key={idx} value={c.name}>{t(`hdfc.cards.${c.id}.name`, c.name)}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{ fontSize: "11px", color: "var(--text-slate-500)", display: "block", marginBottom: "4px", fontWeight: 700 }}>{t('hdfc.compareLabelCard2', 'Card 2')}</label>
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
                    <option key={idx} value={c.name}>{t(`hdfc.cards.${c.id}.name`, c.name)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Comparison Grid Table */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", border: "1px solid var(--border-color)", borderRadius: "12px", overflow: "hidden", background: "var(--bg-slate-100)" }}>
              {[
                { label: t("hdfc.tableCategory", "Category"), val1: t('hdfc.filter.' + compareCard1.category.toLowerCase(), compareCard1.category), val2: t('hdfc.filter.' + compareCard2.category.toLowerCase(), compareCard2.category) },
                { label: t("hdfc.tableFee", "Joining/Annual Fee"), val1: t(`hdfc.cards.${compareCard1.id}.fee`, compareCard1.fee), val2: t(`hdfc.cards.${compareCard2.id}.fee`, compareCard2.fee) },
                { label: t("hdfc.tableBenefit", "Key Spend Benefit"), val1: t(`hdfc.cards.${compareCard1.id}.highlights.0`, compareCard1.highlights[0]), val2: t(`hdfc.cards.${compareCard2.id}.highlights.0`, compareCard2.highlights[0]) },
                { label: t("hdfc.tableAdvantage", "Primary Advantage"), val1: t(`hdfc.cards.${compareCard1.id}.desc`, compareCard1.description), val2: t(`hdfc.cards.${compareCard2.id}.desc`, compareCard2.description) },
                { label: t("hdfc.tableNetwork", "Payment network"), val1: compareCard1.network, val2: compareCard2.network }
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
              {t('hdfc.closeBtn', 'Close Comparison')}
            </button>
          </div>
        </div>
      )}

      {/* Card Details Modal Overlay */}
      {selectedCard && (
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
            maxWidth: "500px",
            borderRadius: "24px",
            border: "1px solid var(--border-color)",
            padding: "24px",
            position: "relative",
            boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
            color: "var(--text-slate-800)"
          }}>
            {/* Close button */}
            <span 
              onClick={() => setSelectedCard(null)}
              style={{ position: "absolute", right: "20px", top: "20px", cursor: "pointer", color: "var(--text-slate-500)" }}
            >
              <FaTimes size={18} />
            </span>

            {/* Card Visual Header */}
            <div style={{
              background: selectedCard.gradient,
              padding: "24px",
              borderRadius: "16px",
              color: "#fff",
              marginBottom: "20px",
              boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
              position: "relative",
              overflow: "hidden"
            }}>
              <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "1px", opacity: 0.9 }}>HDFC BANK</div>
              <div style={{ fontSize: "20px", fontWeight: 800, margin: "20px 0 10px 0" }}>{t(`hdfc.cards.${selectedCard.id}.name`, selectedCard.name)}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", opacity: 0.8 }}>
                <span>{selectedCard.network}</span>
                <span>•••• •••• •••• 8888</span>
              </div>
            </div>

            {/* Card Info Details */}
            <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: 800 }}>{t(`hdfc.cards.${selectedCard.id}.name`, selectedCard.name)}</h3>
            <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "var(--text-slate-500)", lineHeight: 1.4 }}>
              {t(`hdfc.cards.${selectedCard.id}.desc`, selectedCard.description)}
            </p>

            {/* Highlights */}
            <div style={{ marginBottom: "16px" }}>
              <h4 style={{ margin: "0 0 8px 0", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", color: "var(--text-slate-500)", letterSpacing: "0.5px" }}>Key Features</h4>
              <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "12px", color: "var(--text-slate-800)", display: "flex", flexDirection: "column", gap: "6px" }}>
                {selectedCard.highlights.map((hl, i) => (
                  <li key={i}>{t(`hdfc.cards.${selectedCard.id}.highlights.${i}`, hl)}</li>
                ))}
              </ul>
            </div>

            {/* Annual Fee */}
            <div style={{
              background: "var(--bg-slate-100)",
              padding: "12px",
              borderRadius: "10px",
              fontSize: "12px",
              fontWeight: 700,
              marginBottom: "20px",
              color: "var(--text-slate-800)"
            }}>
              {t(`hdfc.cards.${selectedCard.id}.fee`, selectedCard.fee)}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "10px" }}>
              <button 
                onClick={() => {
                  setCompareCard1(selectedCard);
                  setIsCompareOpen(true);
                  setSelectedCard(null);
                }}
                style={{
                  flex: 1,
                  background: "none",
                  border: "1px solid #003B8F",
                  color: "#003B8F",
                  padding: "10px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                Compare
              </button>
              <button 
                onClick={() => {
                  const cardToApply = selectedCard;
                  setSelectedCard(null);
                  handleApplyClick(cardToApply);
                }}
                style={{
                  flex: 2,
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
                {t('popularCardsList.applyNow', 'Apply Now')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

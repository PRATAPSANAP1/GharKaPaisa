import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaSearch, FaCheckCircle, FaStar, FaShieldAlt, FaGift, 
  FaPlane, FaShoppingBag, FaGasPump, FaBriefcase, FaCreditCard, 
  FaTimes, FaExternalLinkAlt, FaInfoCircle, FaBolt, FaArrowRight,
  FaPercentage, FaRegClock, FaAward, FaBuilding
} from 'react-icons/fa';

// Official HDFC Bank Application URL with GharKaPaisa DSA Code
export const HDFC_APPLY_URL = "https://applyonline.hdfc.bank.in/cards/credit-cards?CHANNELSOURCE=ZETA&DSACode=XYOH&LGcode=INN01&LCcode=INN01&LC2=INN01&SMcode=A31964#nbb";

export const HDFC_CARD_CATALOG = [
  {
    id: 'hdfc-millennia',
    name: 'HDFC Millennia Credit Card',
    tagline: 'Best for Online Shopping & CashBack',
    badge: 'Most Popular',
    category: 'cashback',
    rating: 4.9,
    reviews: '18.4k',
    joiningFee: '₹1,000 + GST',
    annualFee: '₹1,000 + GST (Waived on ₹1 Lakh annual spend)',
    welcomeGift: '1,000 CashPoints on payment of joining fee',
    keyFeatures: [
      '5% CashBack on Amazon, Flipkart, Swiggy, Zomato, BookMyShow & Cult.fit',
      '1% CashBack on all other online and offline retail transactions',
      '4 Complimentary domestic airport lounge visits per calendar year (1/quarter)',
      '1% Fuel Surcharge waiver across all fuel stations in India',
      '₹1,000 Gift voucher on spends of ₹1 Lakh in each calendar quarter'
    ],
    eligibility: 'Salaried: ₹35,000/month | Self-Employed: ITR ₹6.0 Lakhs/annum | Age: 21-40 yrs',
    cardImage: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=500&auto=format&fit=crop&q=80',
    colorGradient: 'from-blue-600 via-indigo-600 to-slate-900',
    accentColor: '#2563eb'
  },
  {
    id: 'swiggy-hdfc',
    name: 'Swiggy HDFC Bank Credit Card',
    tagline: 'Unbeatable Food, Grocery & Dineout Savings',
    badge: 'Top Dining Pick',
    category: 'cashback',
    rating: 4.8,
    reviews: '14.2k',
    joiningFee: '₹500 + GST',
    annualFee: '₹500 + GST (Waived on ₹2 Lakhs annual spend)',
    welcomeGift: '3 Months complimentary Swiggy One membership',
    keyFeatures: [
      '10% Instant CashBack on Swiggy application (Food delivery, Instamart, Dineout, Genie)',
      '5% CashBack on 1,000+ top online apps (Amazon, Flipkart, Myntra, Nykaa, Uber, Ola)',
      '1% CashBack on all other eligible retail and utility spends',
      'Cashback automatically credited directly to Swiggy Money wallet each month',
      'Zero lost card liability protection on 24x7 reporting'
    ],
    eligibility: 'Salaried: ₹25,000/month | Self-Employed: ITR ₹6.0 Lakhs/annum | Age: 21-65 yrs',
    cardImage: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=500&auto=format&fit=crop&q=80',
    colorGradient: 'from-orange-500 via-amber-600 to-slate-900',
    accentColor: '#f97316'
  },
  {
    id: 'tata-neu-infinity',
    name: 'Tata Neu Infinity HDFC Credit Card',
    tagline: '5% NeuCoins on Tata Brands & RuPay UPI',
    badge: 'Best UPI Card',
    category: 'upi',
    rating: 4.9,
    reviews: '12.8k',
    joiningFee: '₹1,499 + GST',
    annualFee: '₹1,499 + GST (Waived on ₹3 Lakhs annual spend)',
    welcomeGift: '1,499 NeuCoins on Tata Neu app upon first transaction',
    keyFeatures: [
      '5% NeuCoins back on Tata Neu App, Croma, BigBasket, Tata 1mg, Westside & Air India',
      '1.5% NeuCoins on all non-Tata merchant transactions and RuPay UPI spends',
      '8 Complimentary domestic airport lounge access visits per year (2/quarter)',
      '4 Complimentary international airport lounge visits annually via Priority Pass',
      '1 NeuCoin = ₹1. Redeemable directly on flights, hotels, electronics & groceries'
    ],
    eligibility: 'Salaried: ₹1,00,000/month | Self-Employed: ITR ₹12 Lakhs/annum | Age: 21-65 yrs',
    cardImage: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&auto=format&fit=crop&q=80',
    colorGradient: 'from-purple-700 via-violet-800 to-slate-950',
    accentColor: '#7c3aed'
  },
  {
    id: 'tata-neu-plus',
    name: 'Tata Neu Plus HDFC Credit Card',
    tagline: 'Entry-Level Tata Ecosystem & UPI Rewards',
    badge: 'Popular UPI',
    category: 'upi',
    rating: 4.7,
    reviews: '9.6k',
    joiningFee: '₹499 + GST',
    annualFee: '₹499 + GST (Waived on ₹1 Lakh annual spend)',
    welcomeGift: '499 NeuCoins upon first transaction within 30 days',
    keyFeatures: [
      '2% NeuCoins back on Tata Neu app purchases, Croma, BigBasket and partner brands',
      '1% NeuCoins on non-Tata retail spends and RuPay UPI merchant QR code payments',
      '4 Complimentary domestic airport lounge access visits per calendar year (1/quarter)',
      '1% Fuel surcharge waiver on transactions between ₹400 to ₹5,000',
      'No pre-set spending limit for qualified HDFC accountholders'
    ],
    eligibility: 'Salaried: ₹25,000/month | Self-Employed: ITR ₹6.0 Lakhs/annum | Age: 21-65 yrs',
    cardImage: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=500&auto=format&fit=crop&q=80',
    colorGradient: 'from-violet-600 via-indigo-700 to-slate-900',
    accentColor: '#6366f1'
  },
  {
    id: 'hdfc-regalia-gold',
    name: 'HDFC Regalia Gold Credit Card',
    tagline: 'Luxury Lifestyle, Travel Vouchers & Global Lounges',
    badge: 'Premium Travel',
    category: 'travel',
    rating: 4.8,
    reviews: '15.1k',
    joiningFee: '₹2,500 + GST',
    annualFee: '₹2,500 + GST (Waived on ₹4 Lakhs annual spend)',
    welcomeGift: 'Complimentary Club Vistara Silver tier & M&S voucher worth ₹2,500',
    keyFeatures: [
      '4 Reward Points for every ₹150 retail spend',
      '5X Reward Points on leading fashion & tech partners: Marks & Spencer, Myntra, Nykaa, Reliance Digital',
      '12 Complimentary domestic airport lounge visits per year across India',
      '6 Complimentary international airport lounge visits per year with Priority Pass',
      'Flight vouchers worth ₹5,000 on ₹5 Lakh annual milestone spend'
    ],
    eligibility: 'Salaried: ₹1,00,000/month | Self-Employed: ITR ₹12 Lakhs/annum | Age: 21-65 yrs',
    cardImage: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=500&auto=format&fit=crop&q=80',
    colorGradient: 'from-amber-600 via-yellow-700 to-slate-950',
    accentColor: '#d97706'
  },
  {
    id: 'hdfc-freedom',
    name: 'HDFC Freedom Credit Card',
    tagline: 'Ideal First Card for Daily Needs & Dining',
    badge: 'Starter Friendly',
    category: 'starter',
    rating: 4.6,
    reviews: '8.3k',
    joiningFee: '₹500 + GST',
    annualFee: '₹500 + GST (Waived on ₹50,000 annual spend)',
    welcomeGift: '500 CashPoints on payment of joining fee',
    keyFeatures: [
      '5X CashPoints on BigBasket, BookMyShow, OYO, Swiggy & Uber',
      '1 CashPoint per ₹150 spent on all other retail transactions',
      '1% Fuel surcharge waiver at all Indian gas stations',
      'Easy EMI conversion on purchases above ₹2,500 with zero documentation',
      'Zero lost card liability after immediate helpline reporting'
    ],
    eligibility: 'Salaried: ₹12,000/month | Self-Employed: ITR ₹3.0 Lakhs/annum | Age: 21-65 yrs',
    cardImage: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=500&auto=format&fit=crop&q=80',
    colorGradient: 'from-teal-600 via-emerald-700 to-slate-900',
    accentColor: '#059669'
  },
  {
    id: 'hdfc-moneyback-plus',
    name: 'HDFC MoneyBack+ Credit Card',
    tagline: '10X CashPoints on Online Shopping Giants',
    badge: 'Value Cashback',
    category: 'cashback',
    rating: 4.7,
    reviews: '11.5k',
    joiningFee: '₹500 + GST',
    annualFee: '₹500 + GST (Waived on ₹50,000 annual spend)',
    welcomeGift: '500 CashPoints on joining fee payment',
    keyFeatures: [
      '10X CashPoints on Amazon, Flipkart, BigBasket, Reliance Smart & Swiggy',
      '5X CashPoints on EMI transactions at merchant locations',
      '2 CashPoints per ₹150 on all other non-fuel expenses',
      '₹500 Gift voucher on ₹50,000 quarterly spends',
      'Up to 20% savings on partner restaurants via Good Food Trail program'
    ],
    eligibility: 'Salaried: ₹25,000/month | Self-Employed: ITR ₹6.0 Lakhs/annum | Age: 21-65 yrs',
    cardImage: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=500&auto=format&fit=crop&q=80',
    colorGradient: 'from-blue-700 via-cyan-800 to-slate-900',
    accentColor: '#0284c7'
  },
  {
    id: 'hdfc-infinia-metal',
    name: 'HDFC Infinia Credit Card (Metal Edition)',
    tagline: 'India’s Pinnacle Luxury Metal Card (1:1 Flight Redemption)',
    badge: 'Super Premium Metal',
    category: 'premium',
    rating: 5.0,
    reviews: '6.4k',
    joiningFee: '₹12,500 + GST',
    annualFee: '₹12,500 + GST (Waived on ₹10 Lakhs annual spend)',
    welcomeGift: '12,500 Reward Points on joining fee receipt',
    keyFeatures: [
      '5 Reward Points for every ₹150 retail spend with no upper limit',
      'Up to 10X Reward Points on SmartBuy flights, hotels & shopping portal',
      '1:1 Reward Point value on flight & hotel redemptions (1 Point = ₹1)',
      'Unlimited complimentary airport lounge access worldwide for Primary & Add-on members',
      'Unlimited complimentary golf games worldwide + 24/7 Global Concierge'
    ],
    eligibility: 'Invitation / High Net Worth: Salaried ₹3 Lakhs+/month | ITR ₹36 Lakhs+/annum',
    cardImage: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=500&auto=format&fit=crop&q=80',
    colorGradient: 'from-slate-900 via-neutral-900 to-black',
    accentColor: '#0f172a'
  },
  {
    id: 'hdfc-diners-black',
    name: 'HDFC Diners Club Black Credit Card',
    tagline: 'Unlimited Worldwide Lounges & Elite Memberships',
    badge: 'Global Elite',
    category: 'premium',
    rating: 4.9,
    reviews: '7.8k',
    joiningFee: '₹10,000 + GST',
    annualFee: '₹10,000 + GST (Waived on ₹5 Lakhs annual spend)',
    welcomeGift: 'Club Marriott, Amazon Prime, Swiggy One memberships upon spends',
    keyFeatures: [
      '5 Reward Points for every ₹150 spent | 10X Points on SmartBuy partners',
      'Unlimited complimentary domestic and international airport lounge visits',
      '6 Complimentary golf games per quarter across top courses worldwide',
      'Low foreign currency markup fee of only 1.99%',
      '₹10,000 Marriott / Tata CliQ voucher on achieving ₹8 Lakhs annual spend'
    ],
    eligibility: 'Salaried: ₹1,75,000/month | Self-Employed: ITR ₹21 Lakhs/annum | Age: 21-65 yrs',
    cardImage: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=500&auto=format&fit=crop&q=80',
    colorGradient: 'from-stone-900 via-neutral-800 to-zinc-950',
    accentColor: '#1c1917'
  },
  {
    id: 'hdfc-pixel-play',
    name: 'Pixel Play HDFC Bank Credit Card',
    tagline: 'India’s First Digital-First Customizable Credit Card',
    badge: 'Gen-Z Customizer',
    category: 'cashback',
    rating: 4.7,
    reviews: '5.2k',
    joiningFee: '₹500 + GST (Offers available)',
    annualFee: '₹500 + GST (Waived on ₹1 Lakh annual spend)',
    welcomeGift: '₹500 Welcome cashback voucher on app activation',
    keyFeatures: [
      'Pick 2 merchants of your choice for 5% CashBack (Amazon, Flipkart, Blinkit, Swiggy, Zomato, etc.)',
      '3% CashBack on choice dining or travel merchants',
      '1% Unlimited CashBack on all other retail transactions',
      '100% Digital card managed via PayZapp with customized visual skin',
      'Card controls: instant lock, limit set, and contactless tokenization'
    ],
    eligibility: 'Salaried: ₹20,000/month | Self-Employed: ITR ₹4.0 Lakhs/annum | Age: 21-45 yrs',
    cardImage: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&auto=format&fit=crop&q=80',
    colorGradient: 'from-fuchsia-600 via-pink-600 to-slate-900',
    accentColor: '#c026d3'
  },
  {
    id: 'indianoil-hdfc',
    name: 'IndianOil HDFC Bank Credit Card',
    tagline: 'Up to 50 Litres of Free Fuel Annually',
    badge: 'Fuel Saver',
    category: 'fuel',
    rating: 4.6,
    reviews: '9.1k',
    joiningFee: '₹500 + GST',
    annualFee: '₹500 + GST (Waived on ₹50,000 annual spend)',
    welcomeGift: '500 Fuel Points on card payment and first swipe',
    keyFeatures: [
      'Earn 5% of your spends as Fuel Points at IndianOil fuel stations',
      'Earn 5% Fuel Points on grocery shopping and bill payments',
      '1% Fuel Surcharge waiver across IndianOil gas stations nationwide',
      'Redeem Fuel Points directly for free fuel via IndianOil XTRAREWARDS program',
      'Zero liability on lost card protection'
    ],
    eligibility: 'Salaried: ₹15,000/month | Self-Employed: ITR ₹3.6 Lakhs/annum | Age: 21-65 yrs',
    cardImage: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=500&auto=format&fit=crop&q=80',
    colorGradient: 'from-orange-600 via-red-600 to-slate-900',
    accentColor: '#ea580c'
  },
  {
    id: 'marriott-bonvoy-hdfc',
    name: 'Marriott Bonvoy HDFC Bank Credit Card',
    tagline: '1 Free Hotel Night Yearly + Marriott Silver Elite Status',
    badge: 'Luxury Stay',
    category: 'travel',
    rating: 4.8,
    reviews: '4.7k',
    joiningFee: '₹3,000 + GST',
    annualFee: '₹3,000 + GST',
    welcomeGift: '1 Complimentary Free Night Award (up to 15,000 points)',
    keyFeatures: [
      '1 Complimentary Free Night Award each year on card renewal',
      'Automatic Marriott Bonvoy Silver Elite Status + 10 Elite Night Credits yearly',
      '8 Marriott Bonvoy Points per ₹150 spent at participating Marriott properties',
      '12 Domestic & 12 International airport lounge access visits per year',
      'Comprehensive overseas medical insurance coverage while travelling'
    ],
    eligibility: 'Salaried: ₹1,00,000/month | Self-Employed: ITR ₹15 Lakhs/annum | Age: 21-65 yrs',
    cardImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&auto=format&fit=crop&q=80',
    colorGradient: 'from-rose-800 via-burgundy-900 to-black',
    accentColor: '#9f1239'
  },
  {
    id: 'irctc-hdfc',
    name: 'IRCTC HDFC Bank Credit Card',
    tagline: '5X Points on Railway Bookings & Executive Rail Lounges',
    badge: 'Rail Transit',
    category: 'travel',
    rating: 4.5,
    reviews: '6.9k',
    joiningFee: '₹500 + GST',
    annualFee: '₹500 + GST (Waived on ₹1.5 Lakhs annual spend)',
    welcomeGift: '₹500 Amazon Gift voucher on spending ₹1,000 in 30 days',
    keyFeatures: [
      '5 Reward Points per ₹100 spent on IRCTC ticket booking website & Rail Connect App',
      '1% Transaction fee waiver on IRCTC website and mobile app bookings',
      '4 Complimentary Executive Railway Lounge visits per year across major Indian junctions',
      'Additional 5% CashBack on train tickets booked through HDFC SmartBuy',
      '1% Fuel surcharge waiver'
    ],
    eligibility: 'Salaried: ₹15,000/month | Self-Employed: ITR ₹3.6 Lakhs/annum | Age: 21-65 yrs',
    cardImage: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=500&auto=format&fit=crop&q=80',
    colorGradient: 'from-blue-800 via-sky-900 to-slate-900',
    accentColor: '#0369a1'
  },
  {
    id: 'hdfc-biz-grow',
    name: 'HDFC BizGrow Credit Card',
    tagline: '55 Days Interest-Free Period for Freelancers & MSMEs',
    badge: 'Business Core',
    category: 'business',
    rating: 4.7,
    reviews: '5.8k',
    joiningFee: '₹500 + GST',
    annualFee: '₹500 + GST (Waived on ₹50,000 business spend)',
    welcomeGift: '500 Reward Points on first commercial payment',
    keyFeatures: [
      'Up to 55 Days Interest-Free credit cycle for smoother business working capital',
      '2 Reward Points per ₹150 spent on business utilities, taxes and vendor purchases',
      'Cashback on GST and advance income tax payments',
      'Simplified GST invoicing with automated expense categorization',
      '1% Fuel Surcharge waiver'
    ],
    eligibility: 'Self-Employed / Business Owners: ITR ₹4.0 Lakhs/annum | Age: 21-65 yrs',
    cardImage: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=500&auto=format&fit=crop&q=80',
    colorGradient: 'from-emerald-800 via-teal-900 to-slate-950',
    accentColor: '#047857'
  }
];

export default function HdfcCreditCardsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedCardForModal, setSelectedCardForModal] = useState(null);

  // SEO setup
  useEffect(() => {
    document.title = "HDFC Bank Credit Cards - Apply Online | Instant Approval | GharKaPaisa";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'Apply online for HDFC Bank Credit Cards (Millennia, Swiggy HDFC, Tata Neu, Regalia Gold, Infinia). Instant digital approval, 100% paperless KYC with GharKaPaisa.');
    }
    window.scrollTo(0, 0);
  }, []);

  // Filter cards based on category and search query
  const filteredCards = useMemo(() => {
    return HDFC_CARD_CATALOG.filter(card => {
      const matchesCategory = activeCategory === 'all' || card.category === activeCategory;
      const matchesSearch = searchQuery.trim() === '' || 
        card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.keyFeatures.some(f => f.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  // Handle direct redirection in same tab as strictly required
  const handleApplyClick = (cardName) => {
    // Redirects in the SAME tab to the official HDFC portal with GharKaPaisa tracking code
    window.location.href = HDFC_APPLY_URL;
  };

  const categories = [
    { id: 'all', label: 'All Cards', icon: <FaCreditCard /> },
    { id: 'cashback', label: 'Cashback & Shopping', icon: <FaPercentage /> },
    { id: 'upi', label: 'RuPay UPI', icon: <FaBolt /> },
    { id: 'travel', label: 'Travel & Lounges', icon: <FaPlane /> },
    { id: 'starter', label: 'Starter / Everyday', icon: <FaAward /> },
    { id: 'fuel', label: 'Fuel Savings', icon: <FaGasPump /> },
    { id: 'premium', label: 'Super Premium Metal', icon: <FaShieldAlt /> },
    { id: 'business', label: 'Business & MSME', icon: <FaBriefcase /> }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-950 via-slate-900 to-slate-950 text-white pt-10 pb-16 px-4 sm:px-6 lg:px-8 border-b border-blue-900/40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.18),transparent_50%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-8">
            <div className="max-w-2xl text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs sm:text-sm font-semibold mb-4">
                <FaBuilding className="text-blue-400" />
                <span>HDFC Bank Direct Authorization • Zero Commission Fee</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
                Apply for <span className="bg-gradient-to-r from-blue-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">HDFC Bank Credit Cards</span> Online
              </h1>
              <p className="text-slate-300 text-sm sm:text-base lg:text-lg mb-6 leading-relaxed">
                Compare top HDFC credit cards offering up to 10% cashback, unlimited airport lounge access, 5% RuPay UPI rewards, and zero annual fee waivers. Instant approval with 100% digital KYC.
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs sm:text-sm text-slate-300">
                <div className="flex items-center gap-1.5">
                  <FaCheckCircle className="text-emerald-400" />
                  <span>Instant Decision in 5 Mins</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FaCheckCircle className="text-emerald-400" />
                  <span>No Income Proof for Pre-Approved</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FaCheckCircle className="text-emerald-400" />
                  <span>Doorstep / Virtual V-KYC</span>
                </div>
              </div>
            </div>

            {/* Quick Fast-Track CTA Card */}
            <div className="w-full lg:w-96 bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-2xl text-center lg:text-left">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase font-bold tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md">
                  Direct Bank Portal
                </span>
                <span className="text-xs text-slate-400">100% Free Service</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Want HDFC's Best Recommended Card?</h3>
              <p className="text-xs text-slate-300 mb-5 leading-relaxed">
                Check your pre-approved limit and instantly browse all available HDFC credit cards directly on the official HDFC server.
              </p>
              <button
                onClick={() => handleApplyClick('Direct Hero')}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all duration-200 transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Check Eligibility & Apply Now</span>
                <FaArrowRight />
              </button>
              <p className="text-[11px] text-slate-400 text-center mt-3 flex items-center justify-center gap-1">
                <FaShieldAlt className="text-emerald-400" />
                <span>Redirects to official HDFC bank application page</span>
              </p>
            </div>
          </div>

          {/* Search & Category Filter Bar */}
          <div className="mt-8 bg-slate-900/80 p-4 rounded-2xl border border-white/10 shadow-lg">
            <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
              <div className="relative w-full">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search cards by name or perk (e.g. Millennia, Swiggy, Lounge, UPI, Cashback)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-800 text-white rounded-xl border border-slate-700 focus:outline-none focus:border-blue-500 text-sm placeholder-slate-400 transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition cursor-pointer ${
                    activeCategory === cat.id
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                  }`}
                >
                  <span className="text-sm">{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* Main Cards Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              All HDFC Bank Credit Cards ({filteredCards.length})
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Select your preferred card and click Apply Now to open your application on the official HDFC server.
            </p>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <FaShieldAlt className="text-emerald-500" />
            <span>Secure 256-Bit Bank Transfer</span>
          </div>
        </div>

        {/* Empty State */}
        {filteredCards.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
            <FaCreditCard className="text-5xl text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">No matching cards found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Try adjusting your search terms or selecting another category filter.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredCards.map((card) => (
            <div
              key={card.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1"
            >
              <div>
                {/* Visual Card Header */}
                <div className={`p-6 bg-gradient-to-br ${card.colorGradient} text-white relative overflow-hidden`}>
                  <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
                  
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-white border border-white/20">
                      {card.badge}
                    </span>
                    <div className="flex items-center gap-1 text-amber-300 text-xs font-bold bg-black/30 px-2 py-1 rounded-md backdrop-blur-sm">
                      <FaStar className="text-amber-400" />
                      <span>{card.rating}</span>
                      <span className="text-slate-300 font-normal">({card.reviews})</span>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold tracking-tight mb-1 text-white relative z-10 leading-snug">
                    {card.name}
                  </h3>
                  <p className="text-xs text-blue-100/90 relative z-10 line-clamp-1 mb-3">
                    {card.tagline}
                  </p>

                  {/* Simulated Chip & Bank Tag */}
                  <div className="flex items-center justify-between text-[11px] text-white/70 pt-2 border-t border-white/15 relative z-10">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-4 bg-amber-400/80 rounded-sm border border-amber-300/40" />
                      <span>Contactless Chip</span>
                    </div>
                    <span className="font-bold tracking-wider text-white/90">HDFC BANK</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6">
                  {/* Fees Strip */}
                  <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl mb-5 text-xs border border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Joining Fee</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">{card.joiningFee}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Annual Fee</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block line-clamp-1" title={card.annualFee}>
                        {card.annualFee}
                      </span>
                    </div>
                  </div>

                  {/* Welcome Benefit */}
                  {card.welcomeGift && (
                    <div className="flex items-start gap-2 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-200/60 dark:border-emerald-800/40 mb-4 font-medium">
                      <FaGift className="mt-0.5 shrink-0 text-emerald-600" />
                      <span><strong>Welcome:</strong> {card.welcomeGift}</span>
                    </div>
                  )}

                  {/* Key Highlights */}
                  <div className="space-y-2 mb-6">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">Key Highlights</span>
                    {card.keyFeatures.slice(0, 3).map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        <FaCheckCircle className="text-emerald-500 mt-0.5 shrink-0 text-xs" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>

                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-6 pt-0 space-y-2.5">
                <button
                  onClick={() => handleApplyClick(card.name)}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer transform active:scale-[0.98]"
                >
                  <span>Apply Now</span>
                  <FaArrowRight className="text-xs" />
                </button>

                <button
                  onClick={() => setSelectedCardForModal(card)}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FaInfoCircle className="text-slate-400" />
                  <span>View All Features & Eligibility</span>
                </button>
              </div>

            </div>
          ))}
        </div>

        {/* Why Apply with GharKaPaisa & HDFC */}
        <section className="mt-16 bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-full">
              Benefits of Applying Here
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-3">
              Why Apply for HDFC Cards on GharKaPaisa?
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
              We connect your application directly with HDFC Bank’s instant DSA processing network for faster decisioning and exclusive welcome vouchers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-lg mb-3">
                <FaBolt />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-1">Instant Approval Track</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Direct integration with HDFC Bank's official online portal for fast-track processing and immediate clearance.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg mb-3">
                <FaShieldAlt />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-1">100% Digital & Safe</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Your data is submitted securely via 256-bit encrypted bank connection. No physical papers or branch visits required.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 flex items-center justify-center text-lg mb-3">
                <FaGift />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-1">Exclusive Welcome Treats</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Get CashPoints, voucher coupons, and Swiggy/Tata Neu benefits automatically bundled with your new card approval.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg mb-3">
                <FaRegClock />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-1">Zero Hidden Charges</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Complete transparency on joining charges, annual fee waivers on spend milestones, and interest-free billing cycles.
              </p>
            </div>
          </div>
        </section>

        {/* Eligibility & Documents Guide */}
        <section className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <FaAward className="text-blue-600" />
              <span>General Eligibility Criteria</span>
            </h3>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <FaCheckCircle className="text-emerald-500 mt-1 shrink-0" />
                <span><strong>Nationality:</strong> Citizen and resident of India</span>
              </li>
              <li className="flex items-start gap-2">
                <FaCheckCircle className="text-emerald-500 mt-1 shrink-0" />
                <span><strong>Age Range:</strong> 21 to 65 years for primary cardholder</span>
              </li>
              <li className="flex items-start gap-2">
                <FaCheckCircle className="text-emerald-500 mt-1 shrink-0" />
                <span><strong>Salaried Individuals:</strong> Minimum monthly in-hand income of ₹25,000+</span>
              </li>
              <li className="flex items-start gap-2">
                <FaCheckCircle className="text-emerald-500 mt-1 shrink-0" />
                <span><strong>Self-Employed / Business:</strong> Annual Income Tax Return (ITR) of ₹6.0 Lakhs+</span>
              </li>
              <li className="flex items-start gap-2">
                <FaCheckCircle className="text-emerald-500 mt-1 shrink-0" />
                <span><strong>Credit Score:</strong> Preferable CIBIL score of 720+ for instant automated approval</span>
              </li>
            </ul>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <FaShieldAlt className="text-emerald-600" />
              <span>Required Verification Documents</span>
            </h3>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <FaCheckCircle className="text-emerald-500 mt-1 shrink-0" />
                <span><strong>Identity Proof:</strong> PAN Card (Mandatory for credit verification)</span>
              </li>
              <li className="flex items-start gap-2">
                <FaCheckCircle className="text-emerald-500 mt-1 shrink-0" />
                <span><strong>Address Proof:</strong> Aadhaar Card (with OTP verification), Passport, or Driving License</span>
              </li>
              <li className="flex items-start gap-2">
                <FaCheckCircle className="text-emerald-500 mt-1 shrink-0" />
                <span><strong>Income Proof (Salaried):</strong> Latest 3 months salary slips or bank statements</span>
              </li>
              <li className="flex items-start gap-2">
                <FaCheckCircle className="text-emerald-500 mt-1 shrink-0" />
                <span><strong>Income Proof (Self-Employed):</strong> Latest ITR acknowledgement with computation sheet</span>
              </li>
              <li className="flex items-start gap-2">
                <FaCheckCircle className="text-emerald-500 mt-1 shrink-0" />
                <span><strong>Existing HDFC Customers:</strong> Zero paperwork needed if pre-approved limit is available!</span>
              </li>
            </ul>
          </div>
        </section>

        {/* FAQs */}
        <section className="mt-12 bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            Frequently Asked Questions
          </h3>

          <div className="space-y-4 text-sm">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <h5 className="font-bold text-slate-800 dark:text-slate-100 mb-1">
                How do I track my HDFC credit card application?
              </h5>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Once submitted on HDFC's portal, you will immediately receive an Application Reference Number (ARN) via SMS and Email. You can track status 24/7 on HDFC's official portal.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <h5 className="font-bold text-slate-800 dark:text-slate-100 mb-1">
                How does the annual fee waiver work?
              </h5>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Most HDFC cards (such as Millennia, Freedom, and Tata Neu) automatically waive the subsequent year’s annual fee when you reach the minimum spending threshold (typically ₹50,000 to ₹1,00,000) within 12 months.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <h5 className="font-bold text-slate-800 dark:text-slate-100 mb-1">
                Can I apply for an HDFC credit card if I don't have an HDFC bank account?
              </h5>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Yes! HDFC Bank credit cards are open to all eligible Indian residents regardless of where you maintain your primary savings or salary account.
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* Floating Bottom Sticky Bar */}
      <aside aria-label="Quick application banner" className="sticky bottom-0 z-30 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 text-white py-3 px-4 shadow-2xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0">
              <FaCreditCard />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-white leading-tight">
                Ready to Apply for an HDFC Credit Card?
              </p>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Direct official bank link • 100% paperless instant digital decision
              </p>
            </div>
          </div>

          <button
            onClick={() => handleApplyClick('Sticky Bar')}
            className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center gap-2"
          >
            <span>Apply on HDFC Portal</span>
            <FaArrowRight className="text-xs" />
          </button>
        </div>
      </aside>

      {/* Card Details Modal */}
      {selectedCardForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 relative">
            <button
              onClick={() => setSelectedCardForModal(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <FaTimes />
            </button>

            <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-full mb-3 inline-block">
              {selectedCardForModal.badge}
            </span>

            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              {selectedCardForModal.name}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              {selectedCardForModal.tagline}
            </p>

            {/* Fees Breakdown */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl mb-6 text-xs border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px]">Joining Fee</span>
                <span className="block font-bold text-slate-800 dark:text-slate-200 mt-1 text-sm">{selectedCardForModal.joiningFee}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px]">Annual Fee</span>
                <span className="block font-bold text-slate-800 dark:text-slate-200 mt-1 text-sm">{selectedCardForModal.annualFee}</span>
              </div>
            </div>

            {/* Features */}
            <div className="mb-6">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                Complete Feature Set & Rewards
              </h4>
              <ul className="space-y-2.5">
                {selectedCardForModal.keyFeatures.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    <FaCheckCircle className="text-emerald-500 mt-1 shrink-0 text-sm" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Eligibility */}
            <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-100 dark:border-blue-900/40 text-xs">
              <span className="font-bold text-blue-900 dark:text-blue-300 block mb-1">Eligibility Criteria</span>
              <p className="text-blue-800 dark:text-blue-300/80 leading-relaxed">{selectedCardForModal.eligibility}</p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleApplyClick(selectedCardForModal.name)}
                className="flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Proceed to Apply on HDFC Portal</span>
                <FaExternalLinkAlt className="text-xs" />
              </button>
              <button
                onClick={() => setSelectedCardForModal(null)}
                className="py-3.5 px-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

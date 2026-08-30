import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuthStore } from '../../app/store/authStore';
import * as chatbotAPI from '../../services/chatbotService';
import { 
  FaComments, FaPaperPlane, FaTimes, FaRedo, 
  FaRobot, FaUser, FaChevronRight, FaRegSmile,
  FaCreditCard, FaHandHoldingUsd, FaChartLine, FaHeadset,
  FaShoppingBag, FaPlane, FaStar, FaHome, FaBriefcase,
  FaInfoCircle, FaRupeeSign, FaWallet, FaUsers, FaUserPlus,
  FaSignInAlt, FaThumbsUp, FaThumbsDown
} from 'react-icons/fa';
import './Chatbot.css';
import chatbotIcon from '../../assets/logos/chatbot-icon.png';

// ── Icon map for chips returned from backend ──────────────────────────────────
const ACTION_ICON_MAP = {
  cards_start: <FaCreditCard />,
  cards_ltf: <FaCreditCard />,
  cards_cashback: <FaShoppingBag />,
  cards_travel: <FaPlane />,
  cards_rewards: <FaStar />,
  loans_start: <FaHandHoldingUsd />,
  loans_personal: <FaUser />,
  loans_business: <FaBriefcase />,
  loans_home: <FaHome />,
  partner_start: <FaChartLine />,
  partner_join: <FaInfoCircle />,
  partner_rates: <FaRupeeSign />,
  partner_payouts: <FaWallet />,
  partner_referral: <FaUsers />,
  support_start: <FaHeadset />,
  lead_process: <FaInfoCircle />,
  main_menu: <FaHome />,
  go_ltf: <FaCreditCard />,
  go_cards: <FaCreditCard />,
  go_travel: <FaPlane />,
  go_loans: <FaHandHoldingUsd />,
  go_register: <FaUserPlus />,
  go_login: <FaSignInAlt />,
  go_contact: <FaHeadset />,
  go_partner_products: <FaCreditCard />,
  go_partner_add_lead: <FaUserPlus />,
  go_partner_applications: <FaChartLine />,
  go_employee_cards: <FaCreditCard />,
  go_employee_applications: <FaChartLine />,
  go_employee_incentives: <FaRupeeSign />,
  go_admin_leads: <FaUsers />,
  go_admin_direct_leads: <FaCreditCard />,
  go_admin_applications: <FaChartLine />,
};

// ── Default chips tailored by user role ───────────────────────────────────────
function getDefaultChips(userRole = 'PUBLIC') {
  const role = userRole.toUpperCase();

  if (role === 'PARTNER' || role === 'TEAM_MEMBER') {
    return [
      { label: 'Select Product', action: 'go_partner_products', icon: <FaCreditCard /> },
      { label: 'Add Lead', action: 'go_partner_add_lead', icon: <FaUserPlus /> },
      { label: 'Lead Process', action: 'lead_process', icon: <FaInfoCircle /> },
      { label: 'My Applications', action: 'go_partner_applications', icon: <FaChartLine /> }
    ];
  }

  if (role === 'EMPLOYEE') {
    return [
      { label: 'Punch Credit Card', action: 'go_employee_cards', icon: <FaCreditCard /> },
      { label: 'Lead Process', action: 'lead_process', icon: <FaInfoCircle /> },
      { label: 'My Applications', action: 'go_employee_applications', icon: <FaChartLine /> },
      { label: 'My Incentives', action: 'go_employee_incentives', icon: <FaRupeeSign /> }
    ];
  }

  if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
    return [
      { label: 'Manage Leads', action: 'go_admin_leads', icon: <FaUsers /> },
      { label: 'Lead Process', action: 'lead_process', icon: <FaInfoCircle /> },
      { label: 'Applications CRM', action: 'go_admin_applications', icon: <FaChartLine /> },
      { label: 'Direct Cards', action: 'go_admin_direct_leads', icon: <FaCreditCard /> }
    ];
  }

  return [
    { label: 'Find Credit Card', action: 'cards_start', icon: <FaCreditCard /> },
    { label: 'Apply for Loan', action: 'loans_start', icon: <FaHandHoldingUsd /> },
    { label: 'Lead Process', action: 'lead_process', icon: <FaInfoCircle /> },
    { label: 'Partner Earnings', action: 'partner_start', icon: <FaChartLine /> }
  ];
}

const DEFAULT_CHIPS = getDefaultChips('PUBLIC');

// ── Redirect actions handled client-side ──────────────────────────────────────
const REDIRECT_ACTIONS = {
  go_ltf: '/credit-cards/lifetime-free-credit-cards-ltf',
  go_cards: '/credit-cards',
  go_travel: '/travel-transit',
  go_loans: '/loans',
  go_register: '/register',
  go_login: '/login',
  go_contact: '/contact',
  go_partner_products: '/partner/products',
  go_partner_add_lead: '/partner/leads/add',
  go_partner_applications: '/partner/applications',
  go_employee_cards: '/employee/credit-cards',
  go_employee_applications: '/employee/applications',
  go_employee_incentives: '/employee/incentives',
};

// ── Client-side fallback responses (used when backend is unavailable) ─────────
function getClientFallbackResponse(text, userRole = 'PUBLIC') {
  const t = text.toLowerCase();
  const defaultChips = getDefaultChips(userRole);

  if (t.includes('lead') || t.includes('process') || t.includes('create') || t.includes('punch') || t.includes('step')) {
    return getClientFallbackAction('lead_process', userRole);
  }

  // Bank & Card Product Searches
  if (t.includes('hdfc')) {
    return {
      text: "💳 *HDFC Bank Products Available on GharKaPaisa:*\n\n1. *HDFC Pixel Play Credit Card* [CREDIT CARD]\n   • Instant cashback on dining & online shopping\n   • ₹0 Joining / LTF Offers\n\n2. *HDFC Swiggy Credit Card* [CO-BRANDED]\n   • 10% cashback on Swiggy food & Instamart\n\n3. *HDFC Personal Loan* [LOAN]\n   • Interest rates starting from 10.5%",
      chips: [
        { label: 'View HDFC Pixel Card', action: 'go_prod_hdfc-pixel', icon: <FaCreditCard /> },
        { label: 'Explore HDFC Cards', action: 'go_bank_hdfc', icon: <FaCreditCard /> },
        { label: 'Main Menu', action: 'main_menu', icon: <FaHome /> }
      ]
    };
  }

  if (t.includes('axis') || t.includes('flipkart')) {
    return {
      text: "💳 *Axis Bank Products Available on GharKaPaisa:*\n\n1. *Axis Bank Flipkart Credit Card* [CASHBACK]\n   • 5% unlimited cashback on Flipkart & Myntra\n\n2. *Axis Bank Neo Credit Card* [LIFESTYLE]\n   • Discounts on Zomato, BookMyShow & Amazon\n\n3. *Axis Bank MY ZONE Credit Card* [MOVIES & DINING]\n   • Buy 1 Get 1 Free Movie Tickets",
      chips: [
        { label: 'View Axis Flipkart Card', action: 'go_prod_axis-flipkart', icon: <FaCreditCard /> },
        { label: 'Explore Axis Cards', action: 'go_bank_axis', icon: <FaCreditCard /> },
        { label: 'Main Menu', action: 'main_menu', icon: <FaHome /> }
      ]
    };
  }

  if (t.includes('sbi') || t.includes('simplysave')) {
    return {
      text: "💳 *SBI Card Products Available on GharKaPaisa:*\n\n1. *SBI SimplySave Credit Card* [REWARDS]\n   • 10x reward points on grocery & dining\n\n2. *SBI Cashback Credit Card* [CASHBACK]\n   • 5% cashback on all online merchant spends",
      chips: [
        { label: 'View SBI SimplySave', action: 'go_prod_sbi-simplysave', icon: <FaCreditCard /> },
        { label: 'Explore SBI Cards', action: 'go_bank_sbi', icon: <FaCreditCard /> },
        { label: 'Main Menu', action: 'main_menu', icon: <FaHome /> }
      ]
    };
  }

  if (t.includes('icici') || t.includes('amazon')) {
    return {
      text: "💳 *ICICI Bank Products Available on GharKaPaisa:*\n\n1. *ICICI Amazon Pay Credit Card* [LTF]\n   • 5% cashback for Amazon Prime members\n\n2. *ICICI Rubyx / Coral Credit Card* [PREMIUM]\n   • Complimentary airport lounge access",
      chips: [
        { label: 'View ICICI Amazon Pay', action: 'go_prod_icici-amazon-pay', icon: <FaCreditCard /> },
        { label: 'Explore ICICI Cards', action: 'go_bank_icici', icon: <FaCreditCard /> },
        { label: 'Main Menu', action: 'main_menu', icon: <FaHome /> }
      ]
    };
  }

  if (t.includes('hello') || t.includes('hi') || t.includes('hey')) {
    return {
      text: "Hello! I am your GharKaPaisa Finance Buddy. How can I help you today?",
      chips: defaultChips
    };
  }
  if (t.includes('card') || t.includes('credit') || t.includes('cc')) {
    return {
      text: "GharKaPaisa lists multiple premium credit cards from SBI, ICICI, HDFC, Axis, and Kotak. Which category is your interest?",
      chips: [
        { label: 'Find Credit Card', action: 'cards_start', icon: <FaCreditCard /> },
        { label: 'Lifetime Free Cards', action: 'cards_ltf', icon: <FaCreditCard /> },
        { label: 'Main Menu', action: 'main_menu', icon: <FaHome /> }
      ]
    };
  }
  if (t.includes('loan') || t.includes('borrow') || t.includes('personal loan')) {
    return {
      text: "We assist with Personal Loans, Business Loans, and Home Loans from major lending partners. Which one do you want to explore?",
      chips: [
        { label: 'Apply for Loan', action: 'loans_start', icon: <FaHandHoldingUsd /> },
        { label: 'Personal Loan', action: 'loans_personal', icon: <FaUser /> },
        { label: 'Main Menu', action: 'main_menu', icon: <FaHome /> }
      ]
    };
  }
  if (t.includes('partner') || t.includes('earn') || t.includes('commission') || t.includes('agent')) {
    return {
      text: "Earn high payouts by submitting customer applications as a Partner! Grow your Level 1, 2, and 3 referral network.",
      chips: [
        { label: 'Partner Earnings', action: 'partner_start', icon: <FaChartLine /> },
        { label: 'How to Join?', action: 'partner_join', icon: <FaInfoCircle /> },
        { label: 'Main Menu', action: 'main_menu', icon: <FaHome /> }
      ]
    };
  }
  if (t.includes('kyc') || t.includes('pan') || t.includes('aadhaar')) {
    return {
      text: "To clear your KYC verification and withdraw earnings, upload your Aadhaar Card (front & back), PAN Card, and a cancelled check photo inside the KYC panel.",
      chips: [
        { label: 'Login to KYC', action: 'go_login', icon: <FaSignInAlt /> },
        { label: 'Main Menu', action: 'main_menu', icon: <FaHome /> }
      ]
    };
  }
  if (t.includes('cibil') || t.includes('score')) {
    return {
      text: "A CIBIL score of 750 or higher increases your chances of credit card and loan approval with better interest rates.",
      chips: [
        { label: 'Apply for Loan', action: 'loans_start', icon: <FaHandHoldingUsd /> },
        { label: 'Main Menu', action: 'main_menu', icon: <FaHome /> }
      ]
    };
  }
  if (t.includes('recharge') || t.includes('electricity') || t.includes('fastag') || t.includes('bill')) {
    return {
      text: "We support quick mobile recharge, DTH payments, electricity bill payments, loan repayments, and Fastag recharges via the Services tab.",
      chips: [{ label: 'Main Menu', action: 'main_menu', icon: <FaHome /> }]
    };
  }
  if (t.includes('contact') || t.includes('support') || t.includes('help') || t.includes('email') || t.includes('phone')) {
    return {
      text: "You can write to us at support@gharkapaisa.com or call 1800-GKP-HELP. We will be happy to help you!",
      chips: [
        { label: 'Contact Support', action: 'support_start', icon: <FaHeadset /> },
        { label: 'Main Menu', action: 'main_menu', icon: <FaHome /> }
      ]
    };
  }
  return {
    text: "I couldn't find an exact match for your question. You can use our quick links below or type details like 'hdfc cards', 'axis flipkart', 'loan', or 'partner' to search.",
    chips: defaultChips
  };
}

// ── Fallback action responses (client-side, used when backend is down) ────────
function getClientFallbackAction(action, userRole = 'PUBLIC') {
  const role = userRole.toUpperCase();
  const defaultChips = getDefaultChips(userRole);

  if (action === 'lead_process') {
    if (role === 'PARTNER' || role === 'TEAM_MEMBER') {
      return {
        text: "📋 Partner Lead Creation Process:\n\nStep 1: Select Financial Product (Credit Card, Personal/Business Loan, Insurance).\nStep 2: Generate referral share link or open the Add Lead form.\nStep 3: Enter Customer details (Name, Mobile, PAN, Income).\nStep 4: Customer completes OTP verification & document upload.\nStep 5: Track lead status & payout credit in 'My Applications'.",
        chips: [
          { label: 'Step 1: Select Product', action: 'go_partner_products', icon: <FaCreditCard /> },
          { label: 'Step 2: Add Lead Form', action: 'go_partner_add_lead', icon: <FaUserPlus /> },
          { label: 'Step 5: Track Applications', action: 'go_partner_applications', icon: <FaChartLine /> },
          { label: 'Main Menu', action: 'main_menu', icon: <FaHome /> }
        ]
      };
    }

    if (role === 'EMPLOYEE') {
      return {
        text: "📋 Employee Lead Punching Process:\n\nStep 1: Select Bank Credit Card or Loan product.\nStep 2: Punch customer details (Name, Mobile Number, PAN, Salary/Income).\nStep 3: Trigger customer OTP & KYC verification link.\nStep 4: Track application stage progress & earned incentives in Applications.",
        chips: [
          { label: 'Step 1: Select Product', action: 'go_employee_cards', icon: <FaCreditCard /> },
          { label: 'Step 4: Track Applications', action: 'go_employee_applications', icon: <FaChartLine /> },
          { label: 'My Incentives', action: 'go_employee_incentives', icon: <FaRupeeSign /> },
          { label: 'Main Menu', action: 'main_menu', icon: <FaHome /> }
        ]
      };
    }

    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      return {
        text: "📋 Admin Lead Management Workflow:\n\nStep 1: Open Manage Leads to review incoming lead queue.\nStep 2: Assign leads to Partners/Executives or process direct punching.\nStep 3: Audit customer documents, CIBIL, and verification state.\nStep 4: Update application stage and monitor conversions in CRM.",
        chips: [
          { label: 'Step 1: Manage Leads', action: 'go_admin_leads', icon: <FaUsers /> },
          { label: 'Step 1: Direct Leads', action: 'go_admin_direct_leads', icon: <FaCreditCard /> },
          { label: 'Step 4: Applications CRM', action: 'go_admin_applications', icon: <FaChartLine /> },
          { label: 'Main Menu', action: 'main_menu', icon: <FaHome /> }
        ]
      };
    }

    return {
      text: "📋 Lead Submission & Referral Process:\n\nStep 1: Register as a Partner on GharKaPaisa.\nStep 2: Complete quick KYC verification with PAN & Aadhaar.\nStep 3: Select Product (Credit Card, Loan) & share direct referral link.\nStep 4: Earn up to ₹3,500 per credit card approval credited directly to your GKP Wallet!",
      chips: [
        { label: 'Step 1: Register as Partner', action: 'go_register', icon: <FaUserPlus /> },
        { label: 'Step 1: Login Account', action: 'go_login', icon: <FaSignInAlt /> },
        { label: 'Explore Credit Cards', action: 'go_cards', icon: <FaCreditCard /> },
        { label: 'Main Menu', action: 'main_menu', icon: <FaHome /> }
      ]
    };
  }

  const actions = {
    cards_start: {
      text: "Awesome! Let's find your perfect credit card. Which category interests you the most?",
      chips: [
        { label: 'Lifetime Free Cards', action: 'cards_ltf', icon: <FaCreditCard /> },
        { label: 'Cashback & Shopping', action: 'cards_cashback', icon: <FaShoppingBag /> },
        { label: 'Travel & Transit', action: 'cards_travel', icon: <FaPlane /> },
        { label: 'Rewards & Lifestyle', action: 'cards_rewards', icon: <FaStar /> },
        { label: 'Main Menu', action: 'main_menu', icon: <FaHome /> }
      ]
    },
    cards_ltf: {
      text: "We offer multiple Lifetime Free (LTF) credit cards with ₹0 annual fee and ₹0 joining fee. You can view bank options like Axis Bank, HDFC Pixel, or Kotak. You can read the benefits details and apply online.",
      chips: [
        { label: 'Explore LTF Cards Now', action: 'go_ltf', icon: <FaCreditCard /> },
        { label: 'Card Categories', action: 'cards_start', icon: <FaCreditCard /> },
        { label: 'Main Menu', action: 'main_menu', icon: <FaHome /> }
      ]
    },
    cards_cashback: {
      text: "For shopping enthusiasts, our cashback cards offer up to 5% cashback on top e-commerce websites like Flipkart and Amazon (Axis Flipkart, ICICI Amazon Pay). They are great for saving money on everyday purchases.",
      chips: [
        { label: 'View Credit Cards list', action: 'go_cards', icon: <FaCreditCard /> },
        { label: 'Card Categories', action: 'cards_start', icon: <FaCreditCard /> },
        { label: 'Main Menu', action: 'main_menu', icon: <FaHome /> }
      ]
    },
    cards_travel: {
      text: "If you travel frequently, co-branded travel cards give you complimentary lounge access, air miles, and hotel points to save on flights and transit.",
      chips: [
        { label: 'View Travel Benefits', action: 'go_travel', icon: <FaPlane /> },
        { label: 'Card Categories', action: 'cards_start', icon: <FaCreditCard /> },
        { label: 'Main Menu', action: 'main_menu', icon: <FaHome /> }
      ]
    },
    cards_rewards: {
      text: "Our premium reward and lifestyle cards reward your dining, movies, and utility spends with high multipliers, which you can redeem for vouchers or items.",
      chips: [
        { label: 'Compare All Cards', action: 'go_cards', icon: <FaCreditCard /> },
        { label: 'Card Categories', action: 'cards_start', icon: <FaCreditCard /> }
      ]
    },
    loans_start: {
      text: "We offer quick loans via our top banking partners. What kind of loan are you looking for?",
      chips: [
        { label: 'Personal Loan', action: 'loans_personal', icon: <FaUser /> },
        { label: 'Business Loan', action: 'loans_business', icon: <FaBriefcase /> },
        { label: 'Home Loan / LAP', action: 'loans_home', icon: <FaHome /> },
        { label: 'Main Menu', action: 'main_menu', icon: <FaHome /> }
      ]
    },
    loans_personal: {
      text: "Personal loans have minimum documentation and quick approval, starting from 10.5% interest. You can check your eligibility and submit details on our Loans page.",
      chips: [
        { label: 'Check Loan Options', action: 'go_loans', icon: <FaHandHoldingUsd /> },
        { label: 'Loan Options', action: 'loans_start', icon: <FaHandHoldingUsd /> }
      ]
    },
    loans_business: {
      text: "Expand your business with unsecured lines of credit up to ₹50 Lakhs. Rates start from 13.5%.",
      chips: [
        { label: 'Go to Loans Page', action: 'go_loans', icon: <FaHandHoldingUsd /> },
        { label: 'Loan Options', action: 'loans_start', icon: <FaHandHoldingUsd /> }
      ]
    },
    loans_home: {
      text: "Get home loans or Loans Against Property (LAP) starting from 8.4% interest rate with flexible tenure options.",
      chips: [
        { label: 'Go to Loans Page', action: 'go_loans', icon: <FaHandHoldingUsd /> },
        { label: 'Loan Options', action: 'loans_start', icon: <FaHandHoldingUsd /> }
      ]
    },
    partner_start: {
      text: "As a GharKaPaisa Partner, you can submit leads for financial products and earn huge commission payouts on every approval. How can I help you?",
      chips: [
        { label: 'How to Join?', action: 'partner_join', icon: <FaInfoCircle /> },
        { label: 'Commission Rates', action: 'partner_rates', icon: <FaRupeeSign /> },
        { label: 'Wallet & Payouts', action: 'partner_payouts', icon: <FaWallet /> },
        { label: 'Referral Network', action: 'partner_referral', icon: <FaUsers /> },
        { label: 'Main Menu', action: 'main_menu', icon: <FaHome /> }
      ]
    },
    partner_join: {
      text: "It is free and fast! 1. Go to register. 2. Sign up with your mobile number. 3. Upload KYC files (PAN, Aadhaar) inside your panel. 4. Share links and start earning!",
      chips: [
        { label: 'Register Now', action: 'go_register', icon: <FaUserPlus /> },
        { label: 'Login to Account', action: 'go_login', icon: <FaSignInAlt /> }
      ]
    },
    partner_rates: {
      text: "Partners earn up to ₹3,500 per credit card approval and up to 3.5% payout on loan disbursements. Commission slabs are tier-based so you earn more as your monthly volume grows.",
      chips: [
        { label: 'Become a Partner', action: 'go_register', icon: <FaUserPlus /> },
        { label: 'Partner Info', action: 'partner_start', icon: <FaInfoCircle /> }
      ]
    },
    partner_payouts: {
      text: "Your approved lead payouts are credited directly to your GKP Wallet. You can withdraw withdrawable funds instantly to your registered bank account or UPI ID with one click.",
      chips: [
        { label: 'Login & Check Wallet', action: 'go_login', icon: <FaSignInAlt /> },
        { label: 'Partner Info', action: 'partner_start', icon: <FaInfoCircle /> }
      ]
    },
    partner_referral: {
      text: "Build your network and earn passive income! You get commissions on Level 1 (direct), Level 2, and Level 3 sub-agents' earnings. Check the Team Referral tab in your Dashboard.",
      chips: [
        { label: 'Register as Agent', action: 'go_register', icon: <FaUserPlus /> },
        { label: 'Partner Info', action: 'partner_start', icon: <FaInfoCircle /> }
      ]
    },
    support_start: {
      text: "Our dedicated support team is available Mon-Sat, 10 AM to 7 PM. You can call us, send a message on WhatsApp, or email us at support@gharkapaisa.com.",
      chips: [
        { label: 'Go to Contact Page', action: 'go_contact', icon: <FaHeadset /> },
        { label: 'Main Menu', action: 'main_menu', icon: <FaHome /> }
      ]
    },
    main_menu: {
      text: "Here is your main menu. What would you like to explore today?",
      chips: defaultChips
    },
  };
  return actions[action] || {
    text: "I am not sure how to handle that request, but I can help you find cards, loans, or partner details.",
    chips: defaultChips
  };
}

// ── Normalize chips from backend (add icons) ──────────────────────────────────
function normalizeChips(chips) {
  if (!chips || !Array.isArray(chips)) return [];
  return chips.map(chip => ({
    ...chip,
    icon: ACTION_ICON_MAP[chip.action] || <FaChevronRight />,
  }));
}

// ══════════════════════════════════════════════════════════════════════════════
//  CHATBOT COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export default function Chatbot() {
  const { isDark, C } = useTheme();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Derive user role for backend intent filtering
  const userRole = user?.role?.toUpperCase() || 'PUBLIC';
  const roleDefaultChips = getDefaultChips(userRole);

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Hello! Welcome to GharKaPaisa. I am your GKP Finance Buddy. How can I help you today?',
      timestamp: new Date(),
      chips: roleDefaultChips
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(true);
  const [sessionId, setSessionId] = useState(() => chatbotAPI.getSessionId());
  const [backendAvailable, setBackendAvailable] = useState(true);

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom on new messages or typing
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Update initial message chips if user auth/role changes
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].sender === 'bot') {
        return [{ ...prev[0], chips: roleDefaultChips }];
      }
      return prev;
    });
  }, [userRole]);

  // Initialize conversation with backend on first open
  const initializedRef = useRef(false);
  useEffect(() => {
    if (isOpen && !initializedRef.current) {
      initializedRef.current = true;
      chatbotAPI.createConversation(sessionId).catch(() => {
        setBackendAvailable(false);
      });
    }
  }, [isOpen, sessionId]);

  const addMessage = useCallback((message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  // ── Send text message ───────────────────────────────────────────────────────
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue;
    addMessage({
      sender: 'user',
      text: userText,
      timestamp: new Date()
    });
    setInputValue('');
    setIsTyping(true);

    try {
      if (backendAvailable) {
        // Try backend NLP intent detection (free, self-hosted)
        const res = await chatbotAPI.sendMessage(sessionId, userText, userRole);
        setIsTyping(false);

        const botResponse = res.data || res;
        addMessage({
          sender: 'bot',
          text: botResponse.message || botResponse.response_template || "I'm here to help!",
          timestamp: new Date(),
          chips: normalizeChips(botResponse.chips),
          intent: botResponse.intent,
          confidence: botResponse.confidence
        });
      } else {
        throw new Error('Backend unavailable, using fallback');
      }
    } catch (err) {
      // Graceful fallback to client-side keyword matching
      setBackendAvailable(false);
      setTimeout(() => {
        setIsTyping(false);
        const fallback = getClientFallbackResponse(userText, userRole);
        addMessage({
          sender: 'bot',
          text: fallback.text,
          timestamp: new Date(),
          chips: fallback.chips
        });
      }, 800 + Math.random() * 500);
    }
  };

  // ── Handle chip/action click ────────────────────────────────────────────────
  const handleChipClick = async (action, label) => {
    // Check if it's a direct redirect
    if (REDIRECT_ACTIONS[action]) {
      addMessage({ sender: 'user', text: label, timestamp: new Date() });
      navigate(REDIRECT_ACTIONS[action]);
      setIsOpen(false);
      return;
    }

    // Dynamic Product & Bank Redirects (per userRole rules & permissions)
    if (action.startsWith('go_prod_')) {
      const slug = action.replace('go_prod_', '');
      addMessage({ sender: 'user', text: label, timestamp: new Date() });
      if (userRole === 'PARTNER' || userRole === 'TEAM_MEMBER') {
        navigate('/partner/products');
      } else if (userRole === 'EMPLOYEE') {
        navigate('/employee/credit-cards');
      } else if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
        navigate(userRole === 'SUPER_ADMIN' ? '/super-admin/products' : '/admin/products');
      } else {
        navigate(`/products/credit_card/${slug}`);
      }
      setIsOpen(false);
      return;
    }

    if (action.startsWith('go_bank_')) {
      const bankSlug = action.replace('go_bank_', '');
      addMessage({ sender: 'user', text: label, timestamp: new Date() });
      if (userRole === 'PARTNER' || userRole === 'TEAM_MEMBER') {
        navigate(`/partner/credit-cards/${bankSlug}`);
      } else if (userRole === 'EMPLOYEE') {
        navigate('/employee/credit-cards');
      } else if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
        navigate(userRole === 'SUPER_ADMIN' ? `/super-admin/leads` : `/admin/credit-cards/${bankSlug}`);
      } else {
        navigate(`/cards/${bankSlug}`);
      }
      setIsOpen(false);
      return;
    }

    // Dynamic Admin / Super Admin redirects
    if (action === 'go_admin_leads') {
      addMessage({ sender: 'user', text: label, timestamp: new Date() });
      navigate(userRole === 'SUPER_ADMIN' ? '/super-admin/leads' : '/admin/leads');
      setIsOpen(false);
      return;
    }
    if (action === 'go_admin_direct_leads') {
      addMessage({ sender: 'user', text: label, timestamp: new Date() });
      navigate(userRole === 'SUPER_ADMIN' ? '/super-admin/direct-leads' : '/admin/direct-leads');
      setIsOpen(false);
      return;
    }
    if (action === 'go_admin_applications') {
      addMessage({ sender: 'user', text: label, timestamp: new Date() });
      navigate(userRole === 'SUPER_ADMIN' ? '/super-admin/applications' : '/admin/applications');
      setIsOpen(false);
      return;
    }

    // External redirects
    if (action === 'go_whatsapp') {
      window.open('https://wa.me/919876543210', '_blank');
      return;
    }
    if (action === 'go_cibil') {
      window.open('https://cibil.com', '_blank');
      return;
    }

    addMessage({
      sender: 'user',
      text: label,
      timestamp: new Date()
    });
    setIsTyping(true);

    try {
      if (backendAvailable) {
        // Try backend knowledge base action handler
        const res = await chatbotAPI.sendAction(sessionId, action, label, userRole);
        setIsTyping(false);

        const botResponse = res.data || res;

        // Handle server-side redirect instructions
        if (botResponse.redirect) {
          if (botResponse.redirect.startsWith('http')) {
            window.open(botResponse.redirect, '_blank');
          } else {
            navigate(botResponse.redirect);
            setIsOpen(false);
          }
          return;
        }

        addMessage({
          sender: 'bot',
          text: botResponse.message || "Here's what I found:",
          timestamp: new Date(),
          chips: normalizeChips(botResponse.chips)
        });
      } else {
        throw new Error('Backend unavailable, using fallback');
      }
    } catch (err) {
      // Graceful fallback to client-side action handling
      setBackendAvailable(false);
      setTimeout(() => {
        setIsTyping(false);
        const fallback = getClientFallbackAction(action, userRole);
        addMessage({
          sender: 'bot',
          text: fallback.text,
          timestamp: new Date(),
          chips: fallback.chips
        });
      }, 800 + Math.random() * 500);
    }
  };

  // ── Reset chat ──────────────────────────────────────────────────────────────
  const handleClearChat = async () => {
    try {
      if (backendAvailable) {
        await chatbotAPI.resetConversation(sessionId);
      }
    } catch {
      // Silent fail — reset locally anyway
    }

    const newSid = chatbotAPI.resetSessionId();
    setSessionId(newSid);
    initializedRef.current = false;
    setBackendAvailable(true); // Retry backend on reset

    setMessages([
      {
        sender: 'bot',
        text: 'Hello! I reset the chat. How can I assist you with credit cards or loans today?',
        timestamp: new Date(),
        chips: DEFAULT_CHIPS
      }
    ]);
  };

  // ── Toggle chat window ──────────────────────────────────────────────────────
  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHasNewMessage(false);
    }
  };

  // Derive panel badge title
  const getRoleBadgeLabel = () => {
    switch (userRole) {
      case 'PARTNER':
      case 'TEAM_MEMBER':
        return 'Partner AI';
      case 'EMPLOYEE':
        return 'Employee Assistant';
      case 'ADMIN':
      case 'SUPER_ADMIN':
        return 'Admin Helpdesk';
      default:
        return 'Finance Buddy';
    }
  };

  const primaryDark = C.primaryDark || C.primary;
  const primaryGlow = isDark ? `${C.primary}50` : `${C.primary}30`;

  return (
    <div 
      className="gkp-chatbot-container" 
      style={{ 
        '--theme-primary': C.primary, 
        '--theme-primary-dark': primaryDark,
        '--theme-glow': primaryGlow,
        '--theme-bg': C.bg, 
        '--theme-card': C.card, 
        '--theme-text': C.text, 
        '--theme-border': C.border, 
        '--theme-secondary': C.bgSecondary, 
        '--theme-text-mid': C.textMid 
      }}
    >
      {/* Floating Launcher & Tooltip Speech Bubble */}
      {!isOpen && (
        <div className="gkp-chatbot-launcher-wrapper">
          <div className="robot-speech-bubble" style={{ background: C.card, color: C.text, borderColor: C.border }}>
            <span>Need help with leads or cards?</span>
            <span className="speech-arrow" style={{ borderTopColor: C.border }} />
          </div>
          <button 
            className="gkp-chatbot-launcher robot-launcher" 
            onClick={toggleChat}
            aria-label="Open Chatbot"
          >
            <img src={chatbotIcon} className="dancing-robot-img" alt="Dancing Robot Assistant" />
            {hasNewMessage && <span className="notification-badge" />}
          </button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div 
          className={`gkp-chatbot-window ${isOpen ? 'open' : ''}`} 
          style={{ 
            background: C.card, 
            border: `1.5px solid ${C.border}`, 
            boxShadow: `0 20px 50px rgba(0, 0, 0, ${isDark ? '0.5' : '0.18'}), 0 0 30px ${primaryGlow}` 
          }}
        >
          {/* Vibrant Gradient Header */}
          <div 
            className="gkp-chatbot-header" 
            style={{ 
              background: `linear-gradient(135deg, ${C.primary} 0%, ${primaryDark} 100%)` 
            }}
          >
            <div className="header-info">
              <div className="avatar-container robot-avatar">
                <img src={chatbotIcon} className="header-robot-img" alt="Robot avatar" />
                <span className="online-indicator" />
              </div>
              <div>
                <h3 className="bot-title">GKP {getRoleBadgeLabel()}</h3>
                <span className="bot-subtitle-badge">
                  {backendAvailable ? 'Online • AI Agent' : 'Online • Agent'}
                </span>
              </div>
            </div>
            <div className="header-actions">
              <button 
                className="header-btn" 
                onClick={handleClearChat} 
                title="Reset Conversation"
              >
                <FaRedo size={12} />
              </button>
              <button 
                className="header-btn close-btn" 
                onClick={toggleChat} 
                title="Close Chat"
              >
                <FaTimes size={15} />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="gkp-chatbot-body" style={{ background: C.bg }}>
            <div className="messages-list">
              {messages.map((msg, index) => (
                <div key={index} className={`message-wrapper ${msg.sender}`}>
                  <div 
                    className="message-bubble" 
                    style={{
                      background: msg.sender === 'bot' 
                        ? C.card 
                        : `linear-gradient(135deg, ${C.primary}, ${primaryDark})`,
                      color: msg.sender === 'bot' ? C.text : '#ffffff',
                      border: msg.sender === 'bot' ? `1px solid ${C.border}` : 'none'
                    }}
                  >
                    <p className="message-text">{msg.text}</p>
                    <span 
                      className="message-time" 
                      style={{ color: msg.sender === 'bot' ? C.textLight : 'rgba(255,255,255,0.75)' }}
                    >
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Interactive Action Chips */}
                  {msg.sender === 'bot' && msg.chips && msg.chips.length > 0 && index === messages.length - 1 && !isTyping && (
                    <div className="chips-container">
                      {msg.chips.map((chip, idx) => (
                        <button
                          key={idx}
                          className="chip-btn"
                          onClick={() => handleChipClick(chip.action, chip.label)}
                          style={{
                            background: C.bgSecondary,
                            color: C.primary,
                            border: `1.5px solid ${C.border}`
                          }}
                        >
                          {chip.icon && <span className="chip-icon">{chip.icon}</span>}
                          <span>{chip.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="message-wrapper bot typing">
                  <div className="message-bubble typing-indicator-bubble" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                    <div className="typing-dots">
                      <span className="dot" style={{ background: C.primary }} />
                      <span className="dot" style={{ background: C.primary }} />
                      <span className="dot" style={{ background: C.primary }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Footer Input Bar */}
          <form className="gkp-chatbot-footer" onSubmit={handleSendMessage} style={{ borderTop: `1px solid ${C.border}`, background: C.card }}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask me about leads, cards, or loans..."
              className="chatbot-input"
              style={{ background: C.bgSecondary, color: C.text, border: `1px solid ${C.border}` }}
            />
            <button 
              type="submit" 
              className="chatbot-send-btn"
              disabled={!inputValue.trim()}
              style={{ 
                background: `linear-gradient(135deg, ${C.primary}, ${primaryDark})`, 
                color: '#ffffff' 
              }}
            >
              <FaPaperPlane size={14} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

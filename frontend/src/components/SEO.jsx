import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE_URL = "https://gharkapaisa.in";

const BANK_NAMES = {
  hdfc: "HDFC Bank",
  sbi: "SBI Bank",
  icici: "ICICI Bank",
  axis: "Axis Bank",
  kotak: "Kotak Mahindra Bank",
  yes: "YES Bank",
  bob: "Bank of Baroda",
  au: "AU Small Finance Bank",
  idfc: "IDFC First Bank",
  federal: "Federal Bank",
  rbl: "RBL Bank",
  indusind: "IndusInd Bank",
  equitas: "Equitas Small Finance Bank",
  dcb: "DCB Bank",
  hsbc: "HSBC Bank",
};

const SEO_CONFIG = {
  "/guides": {
    title: "Financial Guides & Articles | GharKaPaisa",
    description:
      "Read expert guides and articles on credit cards, personal loans, CIBIL scores, and financial planning in India.",
    index: true,
  },
  "/guides/best-lifetime-free-credit-cards-india": {
    title: "Lifetime Free Credit Cards in India | GharKaPaisa",
    description:
      "Discover lifetime-free credit card options, compare benefits and understand eligibility requirements.",
    index: true,
  },
  "/guides/how-to-choose-first-credit-card": {
    title: "How to Choose Your First Credit Card in India | GharKaPaisa",
    description:
      "Learn how to choose your first credit card in India. Step-by-step guide on fees, reward types, CIBIL score requirements, and smart application tips.",
    index: true,
  },
  "/guides/credit-card-eligibility-criteria-india": {
    title: "Credit Card Eligibility Criteria in India | GharKaPaisa",
    description:
      "Understand credit card eligibility requirements in India, including minimum salary, CIBIL score thresholds, age limits, and mandatory KYC documents.",
    index: true,
  },
  "/guides/what-is-credit-score-how-it-works": {
    title: "What Is a Credit Score and How Does It Work? | GharKaPaisa",
    description:
      "Learn what a credit score is, how CIBIL scores are calculated in India, what factors impact your score, and proven ways to improve it.",
    index: true,
  },
  "/guides/personal-loan-eligibility-documents-required": {
    title: "Personal Loans in India – Explore Loan Offers | GharKaPaisa",
    description:
      "Explore personal loan options, eligibility criteria, interest rates and application information.",
    index: true,
  },
  "/": {
    title: "GharKaPaisa – Apply for Best Credit Cards, Personal Loans & Insurance in India",
    description:
      "Compare and apply for top credit cards, lifetime free credit cards, instant personal loans, home loans, and insurance online with GharKaPaisa. Get fast approval and best bank offers.",
    index: true,
  },
  "/credit-cards": {
    title: "Best Credit Cards in India – Compare Offers | GharKaPaisa",
    description:
      "Compare credit cards, annual fees, rewards, benefits and eligibility. Explore available credit card offers with GharKaPaisa.",
    index: true,
  },
  "/credit-cards/lifetime-free-credit-cards-ltf": {
    title: "Lifetime Free Credit Cards in India | GharKaPaisa",
    description:
      "Discover lifetime-free credit card options, compare benefits and understand eligibility requirements.",
    index: true,
  },
  "/attractive-cards-loans": {
    title: "Top Credit Cards & Personal Loan Offers in India | GharKaPaisa",
    description:
      "Explore exclusive credit card deals, low-interest personal loans, smart EMI options, and fast-track loan approvals with GharKaPaisa.",
    index: true,
  },
  "/loans": {
    title: "Personal Loans in India – Explore Loan Offers | GharKaPaisa",
    description:
      "Explore personal loan options, eligibility criteria, interest rates and application information.",
    index: true,
  },
  "/insurance": {
    title: "Compare Insurance Plans in India | GharKaPaisa",
    description:
      "Explore health, life and general insurance plans in India. Compare coverage, premiums and benefits with GharKaPaisa.",
    index: true,
  },
  "/services": {
    title: "Financial Services in India | GharKaPaisa",
    description:
      "Explore digital financial services, utility bill payments, recharge, and business compliance solutions with GharKaPaisa.",
    index: true,
  },
  "/money-transfer": {
    title: "Instant Money Transfer & Digital Payments | GharKaPaisa",
    description:
      "Safe, secure, and instant money transfer and digital financial services online at GharKaPaisa.",
    index: true,
  },
  "/recharge": {
    title: "Online Mobile Recharge & DTH Payments | GharKaPaisa",
    description:
      "Quick and easy mobile recharge and bill payments for all major telecom operators at GharKaPaisa.",
    index: true,
  },
  "/electricity": {
    title: "Online Electricity Bill Payment | GharKaPaisa",
    description:
      "Pay your electricity bills online instantly across all Indian state electricity boards at GharKaPaisa.",
    index: true,
  },
  "/loan-repay": {
    title: "Online Loan EMI Repayment | GharKaPaisa",
    description:
      "Pay your loan EMIs online securely and instantly for all partner banks and NBFCs at GharKaPaisa.",
    index: true,
  },
  "/fastag": {
    title: "Online FASTag Recharge & Management | GharKaPaisa",
    description:
      "Recharge your toll FASTag online instantly with multiple payment modes at GharKaPaisa.",
    index: true,
  },
  "/travel-transit": {
    title: "Travel & Transit Booking Services | GharKaPaisa",
    description:
      "Book flights, trains, buses, and hotels with exclusive discounts and cashback at GharKaPaisa.",
    index: true,
  },
  "/careers": {
    title: "Careers & Job Opportunities | GharKaPaisa",
    description:
      "Explore career opportunities, advisor onboarding, and open positions at GharKaPaisa.",
    index: true,
  },
  "/career": {
    title: "Join Our Team – Career Opportunities | GharKaPaisa",
    description:
      "Build your career in fintech and financial distribution with GharKaPaisa.",
    index: true,
  },
  "/contact": {
    title: "Contact GharKaPaisa | Customer Support & Advisory",
    description:
      "Get in touch with GharKaPaisa for assistance with credit cards, loans, insurance, or general financial inquiries.",
    index: true,
  },
  "/terms-and-conditions": {
    title: "Terms and Conditions | GharKaPaisa",
    description:
      "Read the official terms and conditions for using GharKaPaisa financial platform and services.",
    index: true,
  },
  "/privacy-policy": {
    title: "Privacy Policy | GharKaPaisa",
    description:
      "Read GharKaPaisa's privacy policy regarding data protection, user security, and confidentiality.",
    index: true,
  },
  "/track-application": {
    title: "Track Application Status | GharKaPaisa",
    description:
      "Track your loan or credit card application status online in real time with GharKaPaisa.",
    index: true,
  },
  "/track": {
    title: "Track Application Status | GharKaPaisa",
    description:
      "Check your application status with your reference number at GharKaPaisa.",
    index: true,
  },
};

const PRIVATE_PREFIXES = [
  "/partner",
  "/employee",
  "/admin",
  "/super-admin",
  "/superadmin",
  "/hr",
  "/kyc",
  "/physical-application",
  "/apply",
  "/customer-upload",
  "/customer/upload",
  "/customer/application",
  "/messenger",
  "/verify-email",
  "/reset-password",
  "/login",
  "/register",
  "/admin-login",
];

const DEFAULT_SEO = {
  title: "GharKaPaisa – Credit Cards, Loans & Insurance in India",
  description:
    "Explore credit cards, personal loans, business loans, and insurance in India with GharKaPaisa. Find financial products that match your needs.",
  index: true,
};

export default function SEO({ noIndex = false }) {
  const location = useLocation();

  useEffect(() => {
    const rawPath = location.pathname.toLowerCase().replace(/\/+$/, "") || "/";
    const isPrivate = noIndex || PRIVATE_PREFIXES.some((p) => rawPath.startsWith(p));

    let config = SEO_CONFIG[rawPath];

    // Check dynamic credit card bank routes: /credit-cards/:bankSlug or /cards/:bankSlug
    if (!config && (rawPath.startsWith("/credit-cards/") || rawPath.startsWith("/cards/"))) {
      const parts = rawPath.split("/").filter(Boolean);
      const bankSlug = parts[parts.length - 1];
      const bankName = BANK_NAMES[bankSlug] || bankSlug.toUpperCase();
      config = {
        title: `${bankName} Credit Cards – Compare & Apply Online | GharKaPaisa`,
        description: `Apply online for ${bankName} credit cards at GharKaPaisa. Compare features, rewards, cashback, joining fees, and eligibility.`,
        index: true,
      };
    }

    if (!config) {
      config = DEFAULT_SEO;
    }

    document.title = config.title;

    const setMeta = (attribute, key, content) => {
      let element = document.head.querySelector(`meta[${attribute}="${key}"]`);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    setMeta("name", "description", config.description);
    setMeta(
      "name",
      "robots",
      isPrivate || !config.index ? "noindex, nofollow" : "index, follow"
    );

    // OpenGraph
    setMeta("property", "og:title", config.title);
    setMeta("property", "og:description", config.description);
    setMeta("property", "og:url", `${SITE_URL}${rawPath}`);
    setMeta("property", "og:image", `${SITE_URL}/logo.png`);

    // Twitter Card
    setMeta("property", "twitter:title", config.title);
    setMeta("property", "twitter:description", config.description);
    setMeta("property", "twitter:url", `${SITE_URL}${rawPath}`);
    setMeta("property", "twitter:image", `${SITE_URL}/logo.png`);

    // Canonical URL
    const canonicalUrl = `${SITE_URL}${rawPath}`;
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", canonicalUrl);
  }, [location.pathname, noIndex]);

  return null;
}

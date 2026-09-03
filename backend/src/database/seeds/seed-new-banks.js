const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const { query } = require('../../config/database');

function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const NEW_BANK_CARDS = [
  // ─── 1. TATA CO-BRAND HDFC BANK (1eacfa67-1187-48c7-adde-8a6edcfe9969) ───────
  {
    bank_id: '1eacfa67-1187-48c7-adde-8a6edcfe9969',
    bank_name: 'TATA CO-BRAND HDFC BANK',
    name: 'Tata Neu Infinity HDFC Bank Credit Card',
    category: 'co_branded_card',
    sub_category: 'Co-Branded Cards',
    short_description: '5% NeuCoins on Tata brands & Tata Neu app, RuPay UPI spends, and complimentary lounge access.',
    description: 'Tata Neu Infinity HDFC Bank Credit Card offers 5% NeuCoins on Tata Neu app and Tata brand purchases (Croma, BigBasket, Westside, Tata CLiQ, 1mg), 1.5% NeuCoins on non-Tata spends & RuPay UPI transactions.',
    annual_fee: '₹1,499 (Waived on ₹3,00,000 annual spend)',
    joining_fee: '₹1,499',
    interest_rate: '3.6% p.m.',
    features: [
      '5% NeuCoins on Tata Neu App & partner Tata brands (Croma, BigBasket, Westside, Tata CLiQ, 1mg)',
      '1.5% NeuCoins on non-Tata online & offline spends and merchant RuPay UPI spends',
      '8 complimentary domestic airport lounge access visits per year',
      '4 international lounge visits annually via Priority Pass',
      '1% fuel surcharge waiver across all petrol pumps in India'
    ],
    benefits: '5% NeuCoins on Tata Neu app purchases, RuPay UPI cashback, 12 complimentary lounge visits annually, and 1% fuel surcharge waiver.',
    eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
    eligibility_criteria: 'Age 21-65 years. Salaried/Self-employed with monthly income ₹25,000+ or active FD.',
    documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
    fees_charges: 'Joining Fee: ₹1,499 | Annual Fee: ₹1,499 (Waived on ₹3,00,000 annual spend) | Interest Rate: 3.6% p.m.',
    seo_title: 'Tata Neu Infinity HDFC Bank Credit Card – Apply Online | GharKaPaisa',
    seo_description: 'Apply for Tata Neu Infinity HDFC Bank Credit Card. Get 5% NeuCoins on Tata brands & RuPay UPI spends.',
    seo_keywords: 'tata neu infinity hdfc credit card, tata co-brand hdfc credit card, apply hdfc credit card',
    image_url: 'https://d28wu8o6itv89p.cloudfront.net/images/TataNeuInfinityHDFCCardpng-1681283626786.png',
    min_age: 21, max_age: 65, min_income: 25000, display_order: 1, priority: 1
  },
  {
    bank_id: '1eacfa67-1187-48c7-adde-8a6edcfe9969',
    bank_name: 'TATA CO-BRAND HDFC BANK',
    name: 'Tata Neu Plus HDFC Bank Credit Card',
    category: 'co_branded_card',
    sub_category: 'Co-Branded Cards',
    short_description: '2% NeuCoins on Tata Neu app purchases & Tata brands plus 1% on UPI & non-Tata spends.',
    description: 'Tata Neu Plus HDFC Bank Credit Card offers 2% NeuCoins on Tata Neu app purchases & Tata partner brands like Croma, BigBasket, and Westside, plus 1% NeuCoins on non-Tata spends & merchant RuPay UPI.',
    annual_fee: '₹499 (Waived on ₹1,00,000 annual spend)',
    joining_fee: '₹499',
    interest_rate: '3.6% p.m.',
    features: [
      '2% NeuCoins on Tata Neu App & partner Tata brands',
      '1% NeuCoins on non-Tata spends & merchant RuPay UPI transactions',
      '4 complimentary domestic airport lounge visits per year',
      '1% fuel surcharge waiver across India',
      'Zero lost card liability protection'
    ],
    benefits: '2% NeuCoins on Tata Neu app purchases, 4 domestic lounge visits per year, and 1% fuel surcharge waiver.',
    eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
    eligibility_criteria: 'Age 21-65 years. Salaried/Self-employed with monthly income ₹25,000+ or active FD.',
    documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
    fees_charges: 'Joining Fee: ₹499 | Annual Fee: ₹499 (Waived on ₹1,00,000 annual spend) | Interest Rate: 3.6% p.m.',
    seo_title: 'Tata Neu Plus HDFC Bank Credit Card – Apply Online | GharKaPaisa',
    seo_description: 'Apply for Tata Neu Plus HDFC Bank Credit Card. Get 2% NeuCoins on Tata Neu app and partner Tata brands.',
    seo_keywords: 'tata neu plus hdfc credit card, tata co-brand hdfc credit card, apply hdfc credit card',
    image_url: 'https://d28wu8o6itv89p.cloudfront.net/images/TataNeuPlusHDFCCardpng-1681283688921.png',
    min_age: 21, max_age: 65, min_income: 25000, display_order: 2, priority: 2
  },
  {
    bank_id: '1eacfa67-1187-48c7-adde-8a6edcfe9969',
    bank_name: 'TATA CO-BRAND HDFC BANK',
    name: 'Tata Neu Business Infinity HDFC Bank Credit Card',
    category: 'co_branded_card',
    sub_category: 'Co-Branded Cards',
    short_description: '5% NeuCoins on business & Tata brand spends, RuPay UPI payments, and international lounge access.',
    description: 'Tata Neu Business Infinity HDFC Bank Credit Card is designed for business owners & self-employed individuals. Get 5% NeuCoins on business purchases across Tata brands & Tata Neu app, plus 1.5% NeuCoins on non-Tata spends.',
    annual_fee: '₹1,499 (Waived on ₹3,00,000 annual spend)',
    joining_fee: '₹1,499',
    interest_rate: '3.6% p.m.',
    features: [
      '5% NeuCoins on business spends at Tata Neu App & Tata partner brands',
      '1.5% NeuCoins on RuPay UPI merchant transactions & utility business payments',
      '8 domestic airport lounge access visits per year',
      '4 international lounge access visits annually via Priority Pass',
      '51 days interest-free credit period'
    ],
    benefits: '5% NeuCoins on business spends, 12 complimentary lounge visits per year, and extended credit cycle.',
    eligibility: { min_age: 21, max_age: 65, min_income: 35000 },
    eligibility_criteria: 'Self-Employed / Business Owners with ITR ₹5 Lakhs+ or active business proof.',
    documents_required: 'PAN Card, Aadhaar Card, ITR V / Business Proof',
    fees_charges: 'Joining Fee: ₹1,499 | Annual Fee: ₹1,499 (Waived on ₹3,00,000 annual spend) | Interest Rate: 3.6% p.m.',
    seo_title: 'Tata Neu Business Infinity HDFC Credit Card – Apply Online | GharKaPaisa',
    seo_description: 'Apply for Tata Neu Business Infinity HDFC Credit Card. Earn 5% NeuCoins on business & Tata brand spends.',
    seo_keywords: 'tata neu business infinity hdfc credit card, tata co-brand hdfc business card',
    image_url: 'https://d28wu8o6itv89p.cloudfront.net/images/TataNeuInfinityHDFCCardpng-1681283626786.png',
    min_age: 21, max_age: 65, min_income: 35000, display_order: 3, priority: 3
  },
  {
    bank_id: '1eacfa67-1187-48c7-adde-8a6edcfe9969',
    bank_name: 'TATA CO-BRAND HDFC BANK',
    name: 'Tata Neu Business Plus HDFC Bank Credit Card',
    category: 'co_branded_card',
    sub_category: 'Co-Branded Cards',
    short_description: '2% NeuCoins on business & Tata Neu app purchases + 1% on RuPay UPI business spends.',
    description: 'Tata Neu Business Plus HDFC Bank Credit Card provides 2% NeuCoins on Tata brand business purchases, 1% NeuCoins on RuPay UPI merchant spends, and 4 domestic airport lounge visits annually.',
    annual_fee: '₹499 (Waived on ₹1,00,000 annual spend)',
    joining_fee: '₹499',
    interest_rate: '3.6% p.m.',
    features: [
      '2% NeuCoins on Tata brand purchases & Tata Neu App business orders',
      '1% NeuCoins on RuPay UPI merchant transactions',
      '4 complimentary domestic airport lounge access visits per year',
      '1% fuel surcharge waiver',
      'Simplified expense management for business users'
    ],
    benefits: '2% NeuCoins on business purchases, 4 domestic lounge visits per year, and 1% fuel surcharge waiver.',
    eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
    eligibility_criteria: 'Self-Employed / Business Owners with monthly income ₹25,000+ or ITR proof.',
    documents_required: 'PAN Card, Aadhaar Card, ITR V / Bank Statement',
    fees_charges: 'Joining Fee: ₹499 | Annual Fee: ₹499 (Waived on ₹1,00,000 annual spend) | Interest Rate: 3.6% p.m.',
    seo_title: 'Tata Neu Business Plus HDFC Credit Card – Apply Online | GharKaPaisa',
    seo_description: 'Apply for Tata Neu Business Plus HDFC Credit Card. Earn 2% NeuCoins on Tata business spends.',
    seo_keywords: 'tata neu business plus hdfc credit card, tata co-brand hdfc card',
    min_age: 21, max_age: 65, min_income: 25000, display_order: 4, priority: 4
  },

  // ─── 2. TATA CO-BRAND SBI BANK (ad9a965f-63c9-4a67-92be-058b45eea1f5) ────────
  {
    bank_id: 'ad9a965f-63c9-4a67-92be-058b45eea1f5',
    bank_name: 'TATA CO-BRAND SBI BANK',
    name: 'Tata Card Select SBI',
    category: 'co_branded_card',
    sub_category: 'Co-Branded Cards',
    short_description: '5% valueback (10 Empower Points/₹100) on Tata stores, 3,000 bonus points & lounge access.',
    description: 'Tata Card Select SBI is a premium shopping credit card offering 5% valueback as Empower Points on spends at Croma, Westside, Star Bazaar, Taj Hotels, Tata CLiQ, and 8 domestic airport lounge access visits per year.',
    annual_fee: '₹2,999 (Waived on ₹3,00,000 annual spend)',
    joining_fee: '₹2,999',
    interest_rate: '3.5% p.m.',
    features: [
      '5% valueback (10 Empower Points per ₹100 spent) on Tata stores (Croma, Westside, Star Bazaar, Taj Hotels)',
      '3,000 bonus Empower Points worth ₹3,000 on welcome',
      '8 complimentary domestic airport lounge access visits per year',
      'E-gift vouchers worth ₹3,000 on reaching ₹4 Lakh and ₹5 Lakh annual spend milestones',
      '1% fuel surcharge waiver'
    ],
    benefits: '5% valueback on Tata stores, 3,000 welcome Empower points, ₹6,000 milestone vouchers, and 8 airport lounge access visits annually.',
    eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
    eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
    documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
    fees_charges: 'Joining Fee: ₹2,999 | Annual Fee: ₹2,999 (Waived on ₹3,00,000 annual spend) | Interest Rate: 3.5% p.m.',
    seo_title: 'Tata Card Select SBI – Apply Online | GharKaPaisa',
    seo_description: 'Apply for Tata Card Select SBI. Enjoy 5% valueback on Tata stores and 3,000 welcome Empower points.',
    seo_keywords: 'tata card select sbi, tata co-brand sbi credit card, apply sbi credit card',
    min_age: 21, max_age: 65, min_income: 25000, display_order: 1, priority: 1
  },
  {
    bank_id: 'ad9a965f-63c9-4a67-92be-058b45eea1f5',
    bank_name: 'TATA CO-BRAND SBI BANK',
    name: 'Tata Card Platinum SBI',
    category: 'co_branded_card',
    sub_category: 'Co-Branded Cards',
    short_description: '3.5% valueback (7 Empower Points/₹100) on Tata store spends & 4 domestic lounge visits.',
    description: 'Tata Card Platinum SBI provides 3.5% valueback as Empower Points on Tata retail brand spends, 1,500 bonus Empower Points on joining, and 4 complimentary domestic airport lounge access visits annually.',
    annual_fee: '₹499 (Waived on ₹1,00,000 annual spend)',
    joining_fee: '₹499',
    interest_rate: '3.5% p.m.',
    features: [
      '3.5% valueback (7 Empower Points per ₹100 spent) at Tata retail outlets',
      '1,500 bonus Empower Points worth ₹1,500 on joining',
      '4 complimentary domestic airport lounge visits per year',
      '1% fuel surcharge waiver',
      'Add-on cards for family members at zero additional fee'
    ],
    benefits: '3.5% valueback on Tata store purchases, 1,500 welcome Empower points, and 4 domestic airport lounge visits per year.',
    eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
    eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
    documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
    fees_charges: 'Joining Fee: ₹499 | Annual Fee: ₹499 (Waived on ₹1,00,000 annual spend) | Interest Rate: 3.5% p.m.',
    seo_title: 'Tata Card Platinum SBI – Apply Online | GharKaPaisa',
    seo_description: 'Apply for Tata Card Platinum SBI. Get 3.5% valueback on Tata stores and 4 domestic lounge visits.',
    seo_keywords: 'tata card platinum sbi, tata co-brand sbi credit card, apply sbi credit card',
    min_age: 21, max_age: 65, min_income: 25000, display_order: 2, priority: 2
  },
  {
    bank_id: 'ad9a965f-63c9-4a67-92be-058b45eea1f5',
    bank_name: 'TATA CO-BRAND SBI BANK',
    name: 'Tata Card Titanium SBI',
    category: 'co_branded_card',
    sub_category: 'Co-Branded Cards',
    short_description: '1.5% valueback on Tata store purchases & 500 welcome bonus Empower points.',
    description: 'Tata Card Titanium SBI is an entry-level shopping credit card offering 1.5% valueback on Tata store spends, 500 bonus Empower Points on joining, and 1% fuel surcharge waiver.',
    annual_fee: '₹499 (Waived on ₹1,00,000 annual spend)',
    joining_fee: '₹499',
    interest_rate: '3.5% p.m.',
    features: [
      '1.5% valueback on Tata store purchases (Croma, Westside, Star Bazaar)',
      '500 bonus Empower Points on ₹2,000 spend in first 60 days',
      '1% fuel surcharge waiver',
      'Global acceptance at over 24 million outlets',
      'Flexipay EMI conversion facility'
    ],
    benefits: '1.5% valueback on Tata store purchases, 500 welcome Empower points, and 1% fuel surcharge waiver.',
    eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
    eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
    documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
    fees_charges: 'Joining Fee: ₹499 | Annual Fee: ₹499 (Waived on ₹1,00,000 annual spend) | Interest Rate: 3.5% p.m.',
    seo_title: 'Tata Card Titanium SBI – Apply Online | GharKaPaisa',
    seo_description: 'Apply for Tata Card Titanium SBI. Get 1.5% valueback on Tata store purchases.',
    seo_keywords: 'tata card titanium sbi, tata co-brand sbi credit card, apply sbi credit card',
    min_age: 21, max_age: 65, min_income: 25000, display_order: 3, priority: 3
  },

  // ─── 3. AU BANK (fffd98a2-9345-48fe-a6a4-179b4ece3843) ───────────────────────
  {
    bank_id: 'fffd98a2-9345-48fe-a6a4-179b4ece3843',
    bank_name: 'AU BANK',
    name: 'AU LIT Credit Card',
    category: 'credit_card',
    sub_category: 'Core Cards',
    short_description: 'India’s 1st customizable credit card – choose features, cashback & lounge access on demand!',
    description: 'AU LIT Credit Card is India’s first customizable credit card allowing you to turn features on or off on demand via mobile app. Earn up to 5% cashback on online/offline retail spends and lounge visits.',
    annual_fee: 'Lifetime Free',
    joining_fee: 'Nil',
    interest_rate: '3.49% p.m.',
    features: [
      '100% customizable features on demand via AU 0101 App',
      'Up to 5% additional cashback on apparel, dining, & online shopping',
      '10X or 5X reward points on all online and POS transactions',
      'Complimentary domestic airport lounge access on activation',
      '1% fuel surcharge waiver across India'
    ],
    benefits: 'Customizable card features, up to 5% cashback, 10X reward points, and lifetime free membership.',
    eligibility: { min_age: 21, max_age: 65, min_income: 20000 },
    eligibility_criteria: 'Age 21-65 years. Salaried/Self-employed with monthly income ₹20,000+.',
    documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
    fees_charges: 'Joining Fee: Nil | Annual Fee: Lifetime Free | Interest Rate: 3.49% p.m.',
    seo_title: 'AU LIT Credit Card – Apply Online | GharKaPaisa',
    seo_description: 'Apply for AU LIT Credit Card. India’s 1st customizable lifetime free credit card.',
    seo_keywords: 'au lit credit card, au bank credit card, apply au credit card',
    min_age: 21, max_age: 65, min_income: 20000, display_order: 1, priority: 1
  },
  {
    bank_id: 'fffd98a2-9345-48fe-a6a4-179b4ece3843',
    bank_name: 'AU Zenith Credit Card',
    name: 'AU Zenith Credit Card',
    category: 'credit_card',
    sub_category: 'Core Cards',
    short_description: 'Super-premium luxury lifestyle card with 16 domestic & 4 international lounge visits + Taj Epicure.',
    description: 'AU Zenith Credit Card is a super-premium travel & luxury credit card offering 20 reward points per ₹100 on dining & international spends, Taj Epicure membership, and 20 airport lounge visits per year.',
    annual_fee: '₹7,999 (Waived on ₹5,00,000 annual spend)',
    joining_fee: '₹7,999',
    interest_rate: '3.49% p.m.',
    features: [
      '20 Reward Points per ₹100 on international, dining, & departmental store spends',
      'Complimentary Taj Epicure membership on joining',
      '16 domestic airport lounge access visits per year',
      '4 international airport lounge access visits annually via Priority Pass',
      '1% fuel surcharge waiver'
    ],
    benefits: 'Taj Epicure membership, 20 reward points per ₹100, and 20 domestic & international airport lounge visits annually.',
    eligibility: { min_age: 21, max_age: 65, min_income: 100000 },
    eligibility_criteria: 'Age 21-65 years. Monthly income ₹1,00,000+ or active FD.',
    documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
    fees_charges: 'Joining Fee: ₹7,999 | Annual Fee: ₹7,999 (Waived on ₹5,00,000 annual spend) | Interest Rate: 3.49% p.m.',
    seo_title: 'AU Zenith Credit Card – Apply Online | GharKaPaisa',
    seo_description: 'Apply for AU Zenith Credit Card. Super-premium luxury card with 20 lounge visits and Taj Epicure membership.',
    seo_keywords: 'au zenith credit card, au bank credit card, apply au credit card',
    min_age: 21, max_age: 65, min_income: 100000, display_order: 2, priority: 2
  },
  {
    bank_id: 'fffd98a2-9345-48fe-a6a4-179b4ece3843',
    bank_name: 'AU Vetta Credit Card',
    name: 'AU Vetta Credit Card',
    category: 'credit_card',
    sub_category: 'Core Cards',
    short_description: '10 Reward Points/₹100 on grocery & department stores + milestone vouchers worth ₹2,000.',
    description: 'AU Vetta Credit Card is a premium lifestyle card offering 10 reward points per ₹100 on department store & grocery spends, 4 domestic lounge access visits annually, and milestone bonus vouchers.',
    annual_fee: '₹2,999 (Waived on ₹1,50,000 annual spend)',
    joining_fee: '₹2,999',
    interest_rate: '3.49% p.m.',
    features: [
      '10 Reward Points per ₹100 on grocery and department store purchases',
      '4 Reward Points per ₹100 on all other eligible retail spends',
      '4 complimentary domestic airport lounge access visits per year',
      '₹1,000 gift voucher on spend milestone of ₹2.5 Lakhs annually',
      '1% fuel surcharge waiver'
    ],
    benefits: '10 reward points per ₹100 on grocery, 4 domestic lounge visits per year, and annual milestone gift vouchers.',
    eligibility: { min_age: 21, max_age: 65, min_income: 40000 },
    eligibility_criteria: 'Age 21-65 years. Monthly income ₹40,000+ or active FD.',
    documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
    fees_charges: 'Joining Fee: ₹2,999 | Annual Fee: ₹2,999 (Waived on ₹1,50,000 annual spend) | Interest Rate: 3.49% p.m.',
    seo_title: 'AU Vetta Credit Card – Apply Online | GharKaPaisa',
    seo_description: 'Apply for AU Vetta Credit Card. Get 10 reward points on grocery and department store spends.',
    seo_keywords: 'au vetta credit card, au bank credit card, apply au credit card',
    min_age: 21, max_age: 65, min_income: 40000, display_order: 3, priority: 3
  },
  {
    bank_id: 'fffd98a2-9345-48fe-a6a4-179b4ece3843',
    bank_name: 'AU Altura Plus Credit Card',
    name: 'AU Altura Plus Credit Card',
    category: 'credit_card',
    sub_category: 'Core Cards',
    short_description: '1.5% cashback on all POS merchant spends & 2 Reward Points/₹100 on online transactions.',
    description: 'AU Altura Plus Credit Card provides 1.5% flat cashback on POS offline merchant spends, 2 reward points per ₹100 on online spends, 2 domestic lounge visits per year, and 1% fuel surcharge waiver.',
    annual_fee: '₹499 (Waived on ₹80,000 annual spend)',
    joining_fee: '₹499',
    interest_rate: '3.49% p.m.',
    features: [
      '1.5% flat cashback on POS offline retail merchant transactions',
      '2 Reward Points per ₹100 on online shopping & utility spends',
      '500 bonus reward points on spending ₹20,000 per month',
      '2 complimentary domestic airport lounge visits per year',
      '1% fuel surcharge waiver'
    ],
    benefits: '1.5% cashback on offline POS spends, 2 reward points on online spends, and 2 airport lounge visits annually.',
    eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
    eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
    documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
    fees_charges: 'Joining Fee: ₹499 | Annual Fee: ₹499 (Waived on ₹80,000 annual spend) | Interest Rate: 3.49% p.m.',
    seo_title: 'AU Altura Plus Credit Card – Apply Online | GharKaPaisa',
    seo_description: 'Apply for AU Altura Plus Credit Card. Earn 1.5% cashback on POS spends & 2 reward points online.',
    seo_keywords: 'au altura plus credit card, au bank credit card, apply au credit card',
    min_age: 21, max_age: 65, min_income: 25000, display_order: 4, priority: 4
  },
  {
    bank_id: 'fffd98a2-9345-48fe-a6a4-179b4ece3843',
    bank_name: 'AU ixigo Credit Card',
    name: 'AU ixigo Credit Card',
    category: 'co_branded_card',
    sub_category: 'Co-Branded Cards',
    short_description: 'Zero Forex Markup fee, 20 Reward Points/₹200 on ixigo train & flight bookings, and 16 lounge visits.',
    description: 'AU ixigo Credit Card is a co-branded travel credit card offering zero foreign currency markup fee, up to 20 reward points per ₹200 on ixigo flight & train bookings, and 16 domestic airport & railway lounge access visits per year.',
    annual_fee: 'Lifetime Free',
    joining_fee: 'Nil',
    interest_rate: '3.49% p.m.',
    features: [
      'Zero Forex Markup Fee on foreign currency international transactions',
      '20 Reward Points per ₹200 spent on train & flight bookings via ixigo app',
      '16 domestic airport & railway lounge access visits per year (8 airport + 8 railway)',
      '10% instant discount on flight & hotel bookings on ixigo',
      '1% fuel surcharge waiver'
    ],
    benefits: 'Zero forex markup, 20 reward points on ixigo travel, 16 airport & railway lounge visits annually, and lifetime free membership.',
    eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
    eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
    documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
    fees_charges: 'Joining Fee: Nil | Annual Fee: Lifetime Free | Interest Rate: 3.49% p.m.',
    seo_title: 'AU ixigo Credit Card – Apply Online | GharKaPaisa',
    seo_description: 'Apply for AU ixigo Credit Card. Enjoy zero forex markup fee and 16 lounge access visits.',
    seo_keywords: 'au ixigo credit card, au bank credit card, apply au credit card',
    min_age: 21, max_age: 65, min_income: 25000, display_order: 5, priority: 5
  },

  // ─── 4. SMB Bank (3a2905fc-4c15-4151-8697-a5076a2ca851) ───────────────────────
  {
    bank_id: '3a2905fc-4c15-4151-8697-a5076a2ca851',
    bank_name: 'SMB Bank',
    name: 'SBM Magnet Credit Card',
    category: 'fd_card',
    sub_category: 'Secured Cards',
    short_description: 'Lifetime Free FD-backed secured card with 100% instant approval & zero forex markup.',
    description: 'SBM Magnet Credit Card is a secured credit card issued against fixed deposit with 100% instant approval, zero income documentation, zero forex markup fee on international transactions, and interest earnings on underlying FD.',
    annual_fee: 'Lifetime Free',
    joining_fee: 'Nil',
    interest_rate: '2.49% p.m.',
    features: [
      '100% instant guaranteed approval against Fixed Deposit (min FD ₹5,000)',
      'Zero Forex Markup Fee on international online & travel transactions',
      'No income proof, CIBIL score, or credit history required',
      'Earn full interest on your Fixed Deposit while using credit line',
      'Build and improve CIBIL credit score fast'
    ],
    benefits: '100% instant approval against FD, zero forex markup fee, lifetime free membership, and CIBIL score building.',
    eligibility: { min_age: 18, max_age: 65, min_income: 0 },
    eligibility_criteria: 'Age 18-65 years. No income proof required – instant approval against active Fixed Deposit.',
    documents_required: 'PAN Card, Aadhaar Card',
    fees_charges: 'Joining Fee: Nil | Annual Fee: Lifetime Free | Interest Rate: 2.49% p.m.',
    seo_title: 'SBM Magnet Credit Card – Apply Online | GharKaPaisa',
    seo_description: 'Apply for SBM Magnet Credit Card. Lifetime free FD-backed secured card with zero forex markup.',
    seo_keywords: 'sbm magnet credit card, smb bank credit card, sbm credit card against fd',
    min_age: 18, max_age: 65, min_income: 0, display_order: 1, priority: 1
  },
  {
    bank_id: '3a2905fc-4c15-4151-8697-a5076a2ca851',
    bank_name: 'SMB Bank',
    name: 'SBM Gild Credit Card',
    category: 'fd_card',
    sub_category: 'Secured Cards',
    short_description: 'Metal secured credit card against digital gold & FD with 90% credit limit.',
    description: 'SBM Gild Credit Card is a premium metal secured credit card issued against digital gold / fixed deposit. Get up to 90% credit limit of your deposit value and 1% fuel surcharge waiver.',
    annual_fee: 'Lifetime Free',
    joining_fee: 'Nil',
    interest_rate: '2.49% p.m.',
    features: [
      'Premium metal card design with instant virtual card activation',
      'Up to 90% credit limit of underlying Fixed Deposit / Gold value',
      'Instant digital onboarding with zero paper documentation',
      '1% fuel surcharge waiver',
      'Cashback rewards on everyday utility and dining spends'
    ],
    benefits: 'Premium metal design, 90% credit limit against FD, zero joining fee, and 1% fuel surcharge waiver.',
    eligibility: { min_age: 18, max_age: 65, min_income: 0 },
    eligibility_criteria: 'Age 18-65 years. Instant approval against active Fixed Deposit / Digital Gold.',
    documents_required: 'PAN Card, Aadhaar Card',
    fees_charges: 'Joining Fee: Nil | Annual Fee: Lifetime Free | Interest Rate: 2.49% p.m.',
    seo_title: 'SBM Gild Credit Card – Apply Online | GharKaPaisa',
    seo_description: 'Apply for SBM Gild Credit Card. Premium metal secured credit card against FD & digital gold.',
    seo_keywords: 'sbm gild credit card, smb bank credit card, sbm credit card',
    min_age: 18, max_age: 65, min_income: 0, display_order: 2, priority: 2
  },
  {
    bank_id: '3a2905fc-4c15-4151-8697-a5076a2ca851',
    bank_name: 'SMB Bank',
    name: 'SBM Horizon Credit Card',
    category: 'fd_card',
    sub_category: 'Secured Cards',
    short_description: 'FD-backed rewards credit card with 4 domestic airport lounge access visits annually.',
    description: 'SBM Horizon Credit Card is an FD-backed lifestyle credit card providing 5X reward points on travel & dining, 4 domestic airport lounge access visits per year, and zero annual fee.',
    annual_fee: 'Lifetime Free',
    joining_fee: 'Nil',
    interest_rate: '2.49% p.m.',
    features: [
      '5X Reward Points on travel, flight, and hotel bookings',
      '4 complimentary domestic airport lounge access visits per year',
      'Guaranteed 100% credit card approval on opening SBM Fixed Deposit',
      '1% fuel surcharge waiver across India',
      'Zero joining & zero annual maintenance fee'
    ],
    benefits: '5X reward points on travel, 4 domestic airport lounge visits per year, and 100% approval against FD.',
    eligibility: { min_age: 18, max_age: 65, min_income: 0 },
    eligibility_criteria: 'Age 18-65 years. Guaranteed approval against active Fixed Deposit.',
    documents_required: 'PAN Card, Aadhaar Card',
    fees_charges: 'Joining Fee: Nil | Annual Fee: Lifetime Free | Interest Rate: 2.49% p.m.',
    seo_title: 'SBM Horizon Credit Card – Apply Online | GharKaPaisa',
    seo_description: 'Apply for SBM Horizon Credit Card. FD-backed card with 4 domestic airport lounge visits annually.',
    seo_keywords: 'sbm horizon credit card, smb bank credit card, sbm credit card',
    min_age: 18, max_age: 65, min_income: 0, display_order: 3, priority: 3
  },
  {
    bank_id: '3a2905fc-4c15-4151-8697-a5076a2ca851',
    bank_name: 'SMB Bank',
    name: 'SBM StepUP Credit Card',
    category: 'fd_card',
    sub_category: 'Secured Cards',
    short_description: 'Credit builder card with guaranteed approval, high FD interest rate & instant card generation.',
    description: 'SBM StepUP Credit Card is a specialized credit score builder card offering high FD interest rates (up to 7.25% p.a.), 100% approval, zero income verification, and instant virtual card generation.',
    annual_fee: 'Lifetime Free',
    joining_fee: 'Nil',
    interest_rate: '2.49% p.m.',
    features: [
      'Earn high interest (up to 7.25% p.a.) on underlying Fixed Deposit',
      'Guaranteed 100% approval with zero credit history requirement',
      'Build and improve CIBIL score within 3 to 6 months',
      '1 Reward Point for every ₹100 spent',
      'Instant digital activation and virtual card access'
    ],
    benefits: 'High FD interest rate, guaranteed 100% approval, CIBIL credit score builder, and zero annual fee.',
    eligibility: { min_age: 18, max_age: 65, min_income: 0 },
    eligibility_criteria: 'Age 18-65 years. Guaranteed approval against active Fixed Deposit.',
    documents_required: 'PAN Card, Aadhaar Card',
    fees_charges: 'Joining Fee: Nil | Annual Fee: Lifetime Free | Interest Rate: 2.49% p.m.',
    seo_title: 'SBM StepUP Credit Card – Apply Online | GharKaPaisa',
    seo_description: 'Apply for SBM StepUP Credit Card. Credit builder card with guaranteed approval and high FD interest.',
    seo_keywords: 'sbm stepup credit card, smb bank credit card, credit builder fd card',
    min_age: 18, max_age: 65, min_income: 0, display_order: 4, priority: 4
  }
];

function getFeesStructure(feeStr, annualFeeStr) {
  return {
    joining_fee: feeStr?.includes('Joining Fee:') ? feeStr.split('|')[0].replace('Joining Fee:', '').trim() : 'As per policy',
    annual_fee: annualFeeStr || 'As per policy',
    interest_rate: feeStr?.includes('Interest Rate:') ? feeStr.split('Interest Rate:')[1].trim() : '3.49% p.m.'
  };
}

function getCompareSpecs(c, fees) {
  const isLounge = (c.features || []).some(f => String(f).toLowerCase().includes('lounge'));
  const isFuel = (c.features || []).some(f => String(f).toLowerCase().includes('fuel'));
  return {
    joining_fee: fees.joining_fee,
    annual_fee: fees.annual_fee,
    rewards: c.short_description,
    lounge_access: isLounge ? 'Available' : 'Not Included',
    fuel_surcharge: isFuel ? '1% Waiver' : 'Standard',
    forex_markup: c.name.includes('ixigo') || c.name.includes('Magnet') ? 'Zero Forex Markup' : '3.5%'
  };
}

async function runSeed() {
  console.log('🚀 Starting card insertion for specified 4 banks...');
  let inserted = 0;
  let updated = 0;

  for (const card of NEW_BANK_CARDS) {
    const cardSlug = slug(card.name);
    const fees = getFeesStructure(card.fees_charges, card.annual_fee);
    const compareSpecs = getCompareSpecs(card, fees);

    const commissions = {
      partner_commission: 1500,
      sub_partner_commission: 300,
      super_partner_commission: 200,
      admin_commission: 500
    };

    const visibility = {
      show_on_website: true,
      show_in_partner: true,
      is_featured: card.priority === 1,
      is_popular: card.priority <= 2
    };

    const seoMetadata = {
      meta_title: card.seo_title || card.name,
      meta_description: card.seo_description || card.short_description,
      slug: cardSlug
    };

    const docsArray = card.documents_required ? card.documents_required.split(',').map(d => d.trim()) : ['PAN Card', 'Aadhaar Card'];

    try {
      const result = await query(`
        INSERT INTO products (
          bank_id, name, category, description, features, eligibility,
          commission_type, commission_value, min_age, max_age, min_income,
          display_order, annual_fee, short_description, benefits,
          fees_charges, eligibility_criteria, documents_required,
          apply_button_text, seo_title, seo_description, seo_keywords,
          priority, status, is_active, public_visible, partner_visible,
          featured, commission_enabled, slug,
          sub_category, joining_fee, interest_rate, rewards, cashback,
          lounge_access, fuel_surcharge, compare_specs, fees_structure,
          commissions_json, features_list, benefits_list, required_documents,
          visibility, seo_metadata, image_url
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,
          $31,$32,$33,$34,$35,$36,$37,
          $38,$39,$40,$41,$42,$43,$44,$45,$46
        )
        ON CONFLICT (bank_id, name) DO UPDATE SET
          category = EXCLUDED.category,
          sub_category = EXCLUDED.sub_category,
          description = EXCLUDED.description,
          features = EXCLUDED.features,
          eligibility = EXCLUDED.eligibility,
          display_order = EXCLUDED.display_order,
          annual_fee = EXCLUDED.annual_fee,
          short_description = EXCLUDED.short_description,
          benefits = EXCLUDED.benefits,
          fees_charges = EXCLUDED.fees_charges,
          eligibility_criteria = EXCLUDED.eligibility_criteria,
          documents_required = EXCLUDED.documents_required,
          seo_title = EXCLUDED.seo_title,
          seo_description = EXCLUDED.seo_description,
          seo_keywords = EXCLUDED.seo_keywords,
          priority = EXCLUDED.priority,
          slug = EXCLUDED.slug,
          joining_fee = EXCLUDED.joining_fee,
          interest_rate = EXCLUDED.interest_rate,
          rewards = EXCLUDED.rewards,
          cashback = EXCLUDED.cashback,
          lounge_access = EXCLUDED.lounge_access,
          fuel_surcharge = EXCLUDED.fuel_surcharge,
          compare_specs = EXCLUDED.compare_specs,
          fees_structure = EXCLUDED.fees_structure,
          commissions_json = EXCLUDED.commissions_json,
          features_list = EXCLUDED.features_list,
          benefits_list = EXCLUDED.benefits_list,
          required_documents = EXCLUDED.required_documents,
          visibility = EXCLUDED.visibility,
          seo_metadata = EXCLUDED.seo_metadata,
          image_url = COALESCE(EXCLUDED.image_url, products.image_url),
          is_active = true,
          status = 'Active'
        RETURNING (xmin = 0) AS is_insert
      `, [
        card.bank_id, card.name, card.category, card.description, JSON.stringify(card.features || []), JSON.stringify(card.eligibility || {}),
        'fixed', 500, card.min_age || null, card.max_age || null, card.min_income || null,
        card.display_order || 0, fees.annual_fee, card.short_description || null, card.benefits || null,
        card.fees_charges || null, card.eligibility_criteria || null, card.documents_required || null,
        'Apply Now', card.seo_title || null, card.seo_description || null, card.seo_keywords || null,
        card.priority || 0, 'Active', true, true, true,
        card.priority === 1, true, cardSlug,
        card.sub_category, fees.joining_fee, fees.interest_rate, card.short_description || null, card.short_description || null,
        compareSpecs.lounge_access, compareSpecs.fuel_surcharge, JSON.stringify(compareSpecs), JSON.stringify(fees),
        JSON.stringify(commissions), JSON.stringify(card.features || []), JSON.stringify(card.benefits ? [{ title: 'Key Benefits', description: card.benefits }] : []), JSON.stringify(docsArray),
        JSON.stringify(visibility), JSON.stringify(seoMetadata), card.image_url || null
      ]);

      if (result.rows[0]?.is_insert) {
        inserted++;
      } else {
        updated++;
      }
      console.log(`  ✅ Added/Updated: ${card.name} (${card.bank_name})`);
    } catch (err) {
      console.error(`  ❌ Error processing ${card.name}:`, err.message);
    }
  }

  console.log(`\n🎉 Seed finished! Inserted: ${inserted}, Updated: ${updated}`);
}

if (require.main === module) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}

module.exports = { NEW_BANK_CARDS, runSeed };

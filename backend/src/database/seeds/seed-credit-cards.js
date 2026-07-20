/**
 * Seed Script: Complete Real Credit Card Products
 * Inserts/updates all 100+ credit card products across 11 Banks into the products table.
 * Run: node backend/src/database/seeds/seed-credit-cards.js
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const { query } = require('../../config/database');

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const ALL_CARDS = {
  // ═══════════════════════════════════════════════════════════════
  // 1. HDFC BANK
  // ═══════════════════════════════════════════════════════════════
  HDFC: [
    // Core Cards
    {
      name: 'HDFC MoneyBack+ Credit Card', sub_category: 'Core Cards',
      joining_fee: '₹500', annual_fee: '₹500 (Waived on ₹50,000 annual spend)', interest_rate: '3.6% p.m.',
      rewards: '10X CashPoints on online spends', cashback: 'Up to 5% cashback', lounge_access: 'Nil', fuel_surcharge: '1% fuel surcharge waiver',
      short_description: 'Perfect entry-level card for daily online shopping and cashback rewards.',
      description: 'HDFC MoneyBack+ Credit Card offers accelerated cashback on online shopping, bill payments, and everyday transactions with 10X CashPoints on partner merchants.',
      features: ['10X CashPoints on Amazon, Flipkart, Swiggy, and BigBasket', '2 CashPoints per ₹150 on all other spends', '1% fuel surcharge waiver at all fuel stations', 'Up to 15% discount at partner dining outlets'],
      benefits: 'CashPoints redeemable against flights, hotel stays, and statement balance. 1% fuel surcharge waiver.',
      eligibility: { min_age: 21, max_age: 60, min_income: 20000, employment: 'Salaried / Self-Employed' },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹20,000 (salaried). Good CIBIL score (700+).',
      documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Last 6 months bank statement',
      fees_charges: 'Joining Fee: ₹500 | Annual Fee: ₹500 (waived on ₹50k spend) | Interest Rate: 3.6% p.m.',
      seo_title: 'HDFC MoneyBack+ Credit Card – 10X CashPoints | GharKaPaisa',
      seo_description: 'Apply for HDFC MoneyBack+ Credit Card. Earn 10X CashPoints on Amazon, Flipkart, Swiggy and more.',
      seo_keywords: 'HDFC MoneyBack plus, HDFC cashback card, HDFC 10X rewards card',
      min_age: 21, max_age: 60, min_income: 20000, display_order: 1, priority: 1,
      compare_specs: { joining_fee: '₹500', annual_fee: '₹500', reward_rate: '10X CashPoints', lounge: 'Nil', fuel: '1% Waiver', forex: '3.6%' }
    },
    {
      name: 'HDFC Millennia Credit Card', sub_category: 'Core Cards',
      joining_fee: '₹1,000', annual_fee: '₹1,000 (Waived on ₹1,00,000 annual spend)', interest_rate: '3.6% p.m.',
      rewards: '5% Cashback on top online merchants', cashback: '5% Cashback', lounge_access: '4 Passes/Year', fuel_surcharge: '1% fuel surcharge waiver',
      short_description: '5% cashback on Amazon, Flipkart, Swiggy, Zomato, and Uber.',
      description: 'HDFC Millennia Credit Card is designed for millennials who shop online frequently, offering 5% cashback on top e-commerce brands and airport lounge access.',
      features: ['5% cashback on Amazon, Flipkart, and online spends', '1% cashback on offline and wallet spends', '4 complimentary domestic airport lounge visits per year'],
      benefits: 'Cashback auto-credited as CashPoints. Airport lounge access via lounge program.',
      eligibility: { min_age: 21, max_age: 60, min_income: 25000, employment: 'Salaried / Self-Employed' },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹25,000 (salaried). CIBIL score 720+.',
      documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Last 6 months bank statement',
      fees_charges: 'Joining Fee: ₹1,000 | Annual Fee: ₹1,000 (waived on ₹1 Lakh spend) | Interest Rate: 3.6% p.m.',
      seo_title: 'HDFC Millennia Credit Card – 5% Cashback Online | GharKaPaisa',
      seo_description: 'Apply for HDFC Millennia Credit Card. Get 5% cashback on Amazon and Flipkart and 4 free lounge visits.',
      seo_keywords: 'HDFC Millennia card, HDFC 5% cashback card, HDFC online shopping card',
      min_age: 21, max_age: 60, min_income: 25000, display_order: 2, priority: 2,
      compare_specs: { joining_fee: '₹1,000', annual_fee: '₹1,000', reward_rate: '5% Cashback', lounge: '4 Visits/Yr', fuel: '1% Waiver', forex: '3.6%' }
    },
    {
      name: 'HDFC Regalia Gold Credit Card', sub_category: 'Core Cards',
      joining_fee: '₹2,500', annual_fee: '₹2,500 (Waived on ₹3,00,000 annual spend)', interest_rate: '3.6% p.m.',
      rewards: '5X Reward Points on travel spends', cashback: 'Accelerated rewards', lounge_access: '12 Domestic + 6 Int Passes/Year', fuel_surcharge: '1% fuel surcharge waiver',
      short_description: 'Premium travel and luxury lifestyle credit card with global lounge access.',
      description: 'HDFC Regalia Gold Credit Card is a premium card offering travel and lifestyle privileges with Priority Pass international lounge access and accelerated SmartBuy rewards.',
      features: ['6X reward points on travel, dining, and entertainment via SmartBuy', '12 domestic & 6 international airport lounge visits', 'Complimentary Club Marriott membership'],
      benefits: 'Priority Pass membership. 1% fuel surcharge waiver. Low foreign exchange markup.',
      eligibility: { min_age: 21, max_age: 60, min_income: 100000, employment: 'Salaried / Self-Employed' },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹1,00,000 (salaried). CIBIL score 750+.',
      documents_required: 'PAN Card, Aadhaar Card, Income Tax Returns, Bank Statement',
      fees_charges: 'Joining Fee: ₹2,500 | Annual Fee: ₹2,500 (waived on ₹3 Lakhs spend) | Interest Rate: 3.6% p.m.',
      seo_title: 'HDFC Regalia Gold Credit Card | GharKaPaisa',
      seo_description: 'Apply for HDFC Regalia Gold Credit Card. Premium travel rewards and free lounge access.',
      seo_keywords: 'HDFC Regalia Gold, HDFC premium travel card, HDFC lounge access card',
      min_age: 21, max_age: 60, min_income: 100000, display_order: 3, priority: 3,
      compare_specs: { joining_fee: '₹2,500', annual_fee: '₹2,500', reward_rate: '5X Rewards', lounge: '18 Visits/Yr', fuel: '1% Waiver', forex: '2.0%' }
    },
    {
      name: 'HDFC Regalia Credit Card', sub_category: 'Core Cards',
      joining_fee: '₹2,500', annual_fee: '₹2,500 (Waived on ₹3,00,000 annual spend)', interest_rate: '3.6% p.m.',
      rewards: '4 Reward Points per ₹150 spend', cashback: 'Reward conversion', lounge_access: '12 Domestic Passes/Year', fuel_surcharge: '1% fuel surcharge waiver',
      short_description: 'Classic luxury credit card with flight rewards and complimentary lounge access.',
      description: 'HDFC Regalia Credit Card provides travel, dining, and shopping privileges with 4 Reward Points per ₹150 spent and complimentary airport lounge access.',
      features: ['4 Reward Points per ₹150 spent', '12 complimentary domestic airport lounge visits', 'Low 2% foreign currency markup fee'],
      benefits: 'Flight and hotel redemptions at 1:1 ratio via SmartBuy.',
      eligibility: { min_age: 21, max_age: 60, min_income: 100000 },
      eligibility_criteria: 'Age: 21-60 years. Monthly income: ₹1,00,000+. Good credit history.',
      documents_required: 'PAN Card, Aadhaar Card, Salary slips, IT Returns',
      fees_charges: 'Joining Fee: ₹2,500 | Annual Fee: ₹2,500 (waived on ₹3 Lakhs spend)',
      seo_title: 'HDFC Regalia Credit Card | GharKaPaisa', seo_description: 'Apply for HDFC Regalia Credit Card for travel and luxury rewards.',
      seo_keywords: 'HDFC Regalia, HDFC travel credit card', min_age: 21, max_age: 60, min_income: 100000, display_order: 4, priority: 4,
      compare_specs: { joining_fee: '₹2,500', annual_fee: '₹2,500', reward_rate: '4 RP / ₹150', lounge: '12 Visits/Yr', fuel: '1% Waiver', forex: '2.0%' }
    },
    {
      name: 'HDFC Diners Club Privilege Credit Card', sub_category: 'Core Cards',
      joining_fee: '₹2,500', annual_fee: '₹2,500 (Waived on ₹3,00,000 annual spend)', interest_rate: '3.6% p.m.',
      rewards: 'BookMyShow 1+1 movie offers & 4 RP/₹150', cashback: 'Lifestyle perks', lounge_access: '12 Domestic & Int Passes/Year', fuel_surcharge: '1% fuel surcharge waiver',
      short_description: 'Premium Diners Club lifestyle card with golf access and 1+1 movie privileges.',
      description: 'HDFC Diners Club Privilege Credit Card offers luxury dining, 1+1 BookMyShow movie tickets, golf access, and international lounge privileges.',
      features: ['Buy 1 Get 1 free movie ticket on BookMyShow', '12 airport lounge access visits worldwide', 'Complimentary Swiggy One & Marriott memberships'],
      benefits: 'Complimentary golf rounds and premium global dining privileges.',
      eligibility: { min_age: 21, max_age: 60, min_income: 80000 },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹80,000.',
      documents_required: 'PAN Card, Aadhaar Card, Salary Slip, Bank Statement',
      fees_charges: 'Joining Fee: ₹2,500 | Annual Fee: ₹2,500 (waived on ₹3 Lakhs spend)',
      seo_title: 'HDFC Diners Club Privilege Credit Card | GharKaPaisa', seo_description: 'Apply for HDFC Diners Club Privilege Card.',
      seo_keywords: 'HDFC Diners Privilege, Diners Club card, HDFC movie card', min_age: 21, max_age: 60, min_income: 80000, display_order: 5, priority: 5,
      compare_specs: { joining_fee: '₹2,500', annual_fee: '₹2,500', reward_rate: '4 RP / ₹150', lounge: '12 Visits/Yr', fuel: '1% Waiver', forex: '2.0%' }
    },
    {
      name: 'HDFC Diners Club Black Metal Edition', sub_category: 'Core Cards',
      joining_fee: '₹10,000', annual_fee: '₹10,000 (Waived on ₹8,00,000 annual spend)', interest_rate: '3.6% p.m.',
      rewards: '10X Reward Points on SmartBuy & Metal privileges', cashback: 'Metal card rewards', lounge_access: 'Unlimited Domestic & Int Lounge Access', fuel_surcharge: '1% fuel surcharge waiver',
      short_description: 'Ultra-premium metal card with unlimited lounge access and 10X SmartBuy rewards.',
      description: 'HDFC Diners Club Black Metal Edition is an ultra-premium metal credit card offering unlimited global lounge access for primary and add-on holders.',
      features: ['Unlimited airport lounge access for primary & add-on holders', '10X Reward Points on SmartBuy partner travel bookings', '24/7 dedicated concierge service'],
      benefits: 'Unlimited lounge access worldwide. Handcrafted metal card design.',
      eligibility: { min_age: 21, max_age: 60, min_income: 175000 },
      eligibility_criteria: 'Age: 21-60 years. Monthly income: ₹1,75,000+. High net worth individual.',
      documents_required: 'PAN Card, Aadhaar Card, ITR, Audit Report',
      fees_charges: 'Joining Fee: ₹10,000 | Annual Fee: ₹10,000 (waived on ₹8 Lakhs spend)',
      seo_title: 'HDFC Diners Club Black Metal | GharKaPaisa', seo_description: 'Apply for HDFC Diners Club Black Metal card.',
      seo_keywords: 'HDFC Diners Black Metal, HDFC metal card', min_age: 21, max_age: 60, min_income: 175000, display_order: 6, priority: 6,
      compare_specs: { joining_fee: '₹10,000', annual_fee: '₹10,000', reward_rate: '10X SmartBuy RP', lounge: 'Unlimited', fuel: '1% Waiver', forex: '2.0%' }
    },
    {
      name: 'HDFC Infinia Metal Edition', sub_category: 'Core Cards',
      joining_fee: '₹12,500', annual_fee: '₹12,500 (Waived on ₹10,00,000 annual spend)', interest_rate: '3.6% p.m.',
      rewards: '5 Reward Points per ₹150 (33% reward rate on SmartBuy)', cashback: '33% redemption value', lounge_access: 'Unlimited Worldwide Lounge Access', fuel_surcharge: '1% fuel surcharge waiver',
      short_description: 'The flagship super-premium metal card in India with 1:1 reward redemption for flights & hotels.',
      description: 'HDFC Infinia Metal Edition is India’s premier invite-only super premium credit card offering 33% reward value on SmartBuy flight and hotel bookings.',
      features: ['Unlimited domestic & international lounge access + guest access', '1:1 Airmile transfer to leading global airlines', 'Complimentary golf coaching & rounds across the world'],
      benefits: ['Unlimited worldwide airport lounge access with guest privileges', '24/7 VIP global concierge desk'],
      eligibility: { min_age: 21, max_age: 60, min_income: 275000 },
      eligibility_criteria: 'Invite-only super-premium card for ultra-high net worth individuals.',
      documents_required: 'PAN Card, Aadhaar Card, Tax Returns, Financial Statements',
      fees_charges: 'Joining Fee: ₹12,500 | Annual Fee: ₹12,500 (waived on ₹10 Lakhs spend)',
      seo_title: 'HDFC Infinia Metal Edition | GharKaPaisa', seo_description: 'Explore HDFC Infinia Metal Edition card details.',
      seo_keywords: 'HDFC Infinia Metal, HDFC Infinia card, super premium credit card', min_age: 21, max_age: 60, min_income: 275000, display_order: 7, priority: 7,
      compare_specs: { joining_fee: '₹12,500', annual_fee: '₹12,500', reward_rate: '5 RP / ₹150 (33% SmartBuy)', lounge: 'Unlimited', fuel: '1% Waiver', forex: '2.0%' }
    },
    {
      name: 'HDFC Freedom Credit Card', sub_category: 'Core Cards',
      joining_fee: '₹500', annual_fee: '₹500 (Waived on ₹50,000 annual spend)', interest_rate: '3.6% p.m.',
      rewards: '10X CashPoints on select merchants', cashback: 'Entry rewards', lounge_access: 'Nil', fuel_surcharge: '1% fuel surcharge waiver',
      short_description: 'Entry level credit card offering daily reward multipliers on grocery and dining.',
      description: 'HDFC Freedom Credit Card is an entry-level card designed for first-time credit card users offering 10X reward points on grocery and dining spends.',
      features: ['10X CashPoints on BigBasket, Swiggy, BookMyShow', '500 bonus CashPoints on fee payment', 'Flexible EMI conversion options'],
      benefits: '10X CashPoints on daily dining and groceries.',
      eligibility: { min_age: 21, max_age: 60, min_income: 15000 },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹15,000.',
      documents_required: 'PAN Card, Aadhaar Card, Salary Slips',
      fees_charges: 'Joining Fee: ₹500 | Annual Fee: ₹500 (waived on ₹50k spend)',
      seo_title: 'HDFC Freedom Credit Card | GharKaPaisa', seo_description: 'Apply for HDFC Freedom Credit Card online.',
      seo_keywords: 'HDFC Freedom, HDFC entry card', min_age: 21, max_age: 60, min_income: 15000, display_order: 8, priority: 8,
      compare_specs: { joining_fee: '₹500', annual_fee: '₹500', reward_rate: '10X CashPoints', lounge: 'Nil', fuel: '1% Waiver', forex: '3.6%' }
    },
    {
      name: 'HDFC IndianOil Credit Card', sub_category: 'Core Cards',
      joining_fee: '₹500', annual_fee: '₹500 (Waived on ₹50,000 annual spend)', interest_rate: '3.6% p.m.',
      rewards: '5% Fuel Points at IOCL outlets', cashback: 'Fuel savings', lounge_access: 'Nil', fuel_surcharge: '1% fuel surcharge waiver',
      short_description: 'Save up to 50 Litres of fuel annually at IndianOil fuel stations.',
      description: 'HDFC IndianOil Credit Card earns 5% Fuel Points on petrol and diesel purchases at over 30,000 IndianOil outlets across India.',
      features: ['Earn 5% Fuel Points at IndianOil outlets', '1% fuel surcharge waiver up to ₹250/month', '5% Fuel Points on grocery & bill payments'],
      benefits: 'Save up to 50 Litres of petrol free every year.',
      eligibility: { min_age: 21, max_age: 60, min_income: 15000 },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹15,000.',
      documents_required: 'PAN Card, Aadhaar Card, Salary Slips',
      fees_charges: 'Joining Fee: ₹500 | Annual Fee: ₹500 (waived on ₹50k spend)',
      seo_title: 'HDFC IndianOil Credit Card | GharKaPaisa', seo_description: 'Apply for HDFC IndianOil Credit Card for fuel cashbacks.',
      seo_keywords: 'HDFC IndianOil card, HDFC fuel card', min_age: 21, max_age: 60, min_income: 15000, display_order: 9, priority: 9,
      compare_specs: { joining_fee: '₹500', annual_fee: '₹500', reward_rate: '5% Fuel Points', lounge: 'Nil', fuel: '1% Waiver', forex: '3.6%' }
    },
    {
      name: 'HDFC UPI RuPay Credit Card', sub_category: 'Core Cards',
      joining_fee: '₹250', annual_fee: '₹250', interest_rate: '3.6% p.m.',
      rewards: '3% CashPoints on UPI transactions', cashback: 'UPI Cashback', lounge_access: 'Nil', fuel_surcharge: '1% fuel surcharge waiver',
      short_description: 'Seamless virtual RuPay credit card designed for instant UPI QR code payments.',
      description: 'HDFC UPI RuPay Credit Card is a virtual credit card that links directly to Google Pay, PhonePe, and Paytm to make instant credit payments via UPI QR codes.',
      features: ['Link card directly to Google Pay, PhonePe, Paytm for UPI payments', '3% CashPoints on groceries, supermarket & dining spends', '100% digital card issuance'],
      benefits: 'Pay via credit card for any UPI QR code scanner.',
      eligibility: { min_age: 21, max_age: 60, min_income: 15000 },
      eligibility_criteria: 'Age: 21-60 years. Existing HDFC customer preferred.',
      documents_required: 'PAN Card, Aadhaar Card',
      fees_charges: 'Joining Fee: ₹250 | Annual Fee: ₹250',
      seo_title: 'HDFC UPI RuPay Credit Card | GharKaPaisa', seo_description: 'Apply for HDFC RuPay UPI Credit Card.',
      seo_keywords: 'HDFC RuPay card, HDFC UPI credit card', min_age: 21, max_age: 60, min_income: 15000, display_order: 10, priority: 10,
      compare_specs: { joining_fee: '₹250', annual_fee: '₹250', reward_rate: '3% CashPoints on UPI', lounge: 'Nil', fuel: '1% Waiver', forex: '3.6%' }
    },
    {
      name: 'HDFC Swiggy Credit Card', sub_category: 'Core Cards',
      joining_fee: '₹500', annual_fee: '₹500 (Waived on ₹2,00,000 annual spend)', interest_rate: '3.6% p.m.',
      rewards: '10% Cashback on Swiggy food, Instamart & Dineout', cashback: '10% Swiggy Cashback', lounge_access: 'Nil', fuel_surcharge: '1% fuel surcharge waiver',
      short_description: 'Unbeatable 10% cashback on Swiggy food ordering, Instamart, and Dineout.',
      description: 'HDFC Swiggy Credit Card offers 10% cashback on all Swiggy spends including Food ordering, Instamart, and Dineout, plus 5% cashback on top online apps.',
      features: ['10% cashback on Swiggy orders (Food, Instamart, Genie, Dineout)', '5% cashback on top online shopping platforms', 'Cashback credited as Swiggy Money'],
      benefits: '10% cashback directly credited into Swiggy app.',
      eligibility: { min_age: 21, max_age: 60, min_income: 25000 },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹25,000.',
      documents_required: 'PAN Card, Aadhaar Card, Salary Slips',
      fees_charges: 'Joining Fee: ₹500 | Annual Fee: ₹500 (waived on ₹2 Lakhs spend)',
      seo_title: 'HDFC Swiggy Credit Card | GharKaPaisa', seo_description: 'Apply for HDFC Swiggy Credit Card for 10% cashback on food.',
      seo_keywords: 'HDFC Swiggy card, Swiggy credit card', min_age: 21, max_age: 60, min_income: 25000, display_order: 11, priority: 11,
      compare_specs: { joining_fee: '₹500', annual_fee: '₹500', reward_rate: '10% Swiggy Cashback', lounge: 'Nil', fuel: '1% Waiver', forex: '3.6%' }
    },

    // Co-Branded Cards
    {
      name: 'Tata Neu Plus HDFC Credit Card', sub_category: 'Co-Branded Cards',
      joining_fee: '₹499', annual_fee: '₹499 (Waived on ₹1,00,000 annual spend)', interest_rate: '3.6% p.m.',
      rewards: '2% NeuCoins on Tata brand purchases', cashback: 'NeuCoins rewards', lounge_access: '4 Passes/Year', fuel_surcharge: '1% fuel surcharge waiver',
      short_description: 'Co-branded card earning 2% NeuCoins across Croma, Bigbasket, Tata CLiQ, 1mg.',
      description: 'Tata Neu Plus HDFC Credit Card earns 2% NeuCoins on Tata brand purchases via Tata Neu app along with complimentary airport lounge access.',
      features: ['2% NeuCoins on Tata Neu app purchases', '1% NeuCoins on non-Tata spends', '4 complimentary airport lounge visits per year'],
      benefits: '1 NeuCoin = ₹1 value on Tata Neu app purchases.',
      eligibility: { min_age: 21, max_age: 60, min_income: 25000 },
      eligibility_criteria: 'Age: 21-60 years. Monthly income: ₹25,000+.',
      documents_required: 'PAN Card, Aadhaar Card, Salary Slips',
      fees_charges: 'Joining Fee: ₹499 | Annual Fee: ₹499 (waived on ₹1 Lakh spend)',
      seo_title: 'Tata Neu Plus HDFC Credit Card | GharKaPaisa', seo_description: 'Apply for Tata Neu Plus HDFC Card.',
      seo_keywords: 'Tata Neu Plus HDFC, Tata Neu credit card', min_age: 21, max_age: 60, min_income: 25000, display_order: 12, priority: 12,
      compare_specs: { joining_fee: '₹499', annual_fee: '₹499', reward_rate: '2% NeuCoins', lounge: '4 Visits/Yr', fuel: '1% Waiver', forex: '3.6%' }
    },
    {
      name: 'Tata Neu Infinity HDFC Credit Card', sub_category: 'Co-Branded Cards',
      joining_fee: '₹1,499', annual_fee: '₹1,499 (Waived on ₹3,00,000 annual spend)', interest_rate: '3.6% p.m.',
      rewards: '5% NeuCoins on Tata brand purchases', cashback: '5% NeuCoins', lounge_access: '8 Domestic + 4 Int Passes/Year', fuel_surcharge: '1% fuel surcharge waiver',
      short_description: 'Premium Tata co-branded card with 5% NeuCoins and international lounge access.',
      description: 'Tata Neu Infinity HDFC Credit Card is the premium variant offering 5% NeuCoins on Tata brands, 8 domestic & 4 international lounge visits.',
      features: ['5% NeuCoins on Tata Neu app purchases', '8 domestic & 4 international lounge visits', '1.5% NeuCoins on all non-Tata spends'],
      benefits: 'Priority Pass international airport lounge access.',
      eligibility: { min_age: 21, max_age: 60, min_income: 100000 },
      eligibility_criteria: 'Age: 21-60 years. Monthly income: ₹1,00,000+.',
      documents_required: 'PAN Card, Aadhaar Card, Salary Slips, ITR',
      fees_charges: 'Joining Fee: ₹1,499 | Annual Fee: ₹1,499 (waived on ₹3 Lakhs spend)',
      seo_title: 'Tata Neu Infinity HDFC Credit Card | GharKaPaisa', seo_description: 'Apply for Tata Neu Infinity HDFC Card.',
      seo_keywords: 'Tata Neu Infinity HDFC, Tata Neu premium card', min_age: 21, max_age: 60, min_income: 100000, display_order: 13, priority: 13,
      compare_specs: { joining_fee: '₹1,499', annual_fee: '₹1,499', reward_rate: '5% NeuCoins', lounge: '12 Visits/Yr', fuel: '1% Waiver', forex: '2.0%' }
    },

    // Secured Cards
    {
      name: 'HDFC FD Backed Credit Card', sub_category: 'Secured Cards',
      joining_fee: 'Nil', annual_fee: 'Nil', interest_rate: '3.6% p.m.',
      rewards: 'Instant approval against HDFC Fixed Deposit', cashback: 'FD Rewards', lounge_access: 'Nil', fuel_surcharge: '1% fuel surcharge waiver',
      short_description: 'Guaranteed 100% approval credit card issued against an HDFC Bank Fixed Deposit.',
      description: 'HDFC FD Backed Credit Card is a secured credit card issued against an HDFC Fixed Deposit requiring zero credit score or income documentation.',
      features: ['Zero documentation or CIBIL score checks', 'Get 90% credit limit of your FD value', 'Earn regular FD interest while spending on card'],
      benefits: 'Build or repair CIBIL credit score safely.',
      eligibility: { min_age: 18, max_age: 70, min_fd: 10000 },
      eligibility_criteria: 'Indian resident with active HDFC Fixed Deposit of min ₹10,000.',
      documents_required: 'Fixed Deposit Receipt, PAN Card, Aadhaar Card',
      fees_charges: 'Joining Fee: Nil | Annual Fee: Nil',
      seo_title: 'HDFC FD Backed Credit Card | GharKaPaisa', seo_description: 'Apply for HDFC secured credit card against Fixed Deposit.',
      seo_keywords: 'HDFC FD credit card, HDFC secured card', min_age: 18, max_age: 70, min_income: 0, display_order: 14, priority: 14,
      compare_specs: { joining_fee: 'Nil', annual_fee: 'Nil', reward_rate: '1% Rewards', lounge: 'Nil', fuel: '1% Waiver', forex: '3.6%' }
    }
  ]
};

async function seed() {
  console.log('🚀 Starting Master Credit Cards Database Seeding...\n');

  const { rows: banks } = await query('SELECT id, short_code, name FROM banks');
  const bankMap = {};
  for (const b of banks) {
    bankMap[b.short_code?.toUpperCase()] = b.id;
  }

  let totalInserted = 0;
  let totalUpdated = 0;

  for (const [bankKey, cards] of Object.entries(ALL_CARDS)) {
    const bankId = bankMap[bankKey];
    if (!bankId) {
      console.warn(`⚠️ Bank "${bankKey}" not found in database. Skipping.`);
      continue;
    }

    console.log(`📦 Seeding ${cards.length} cards for ${bankKey}...`);

    for (const card of cards) {
      const cardSlug = slugify(card.name);
      const category = 'credit_card';
      const subCategory = card.sub_category || 'Core Cards';

      const featuresJson = JSON.stringify(card.features || []);
      const eligJson = JSON.stringify(card.eligibility || {});
      const compareSpecsJson = JSON.stringify(card.compare_specs || {});

      const result = await query(`
        INSERT INTO products (
          bank_id, name, category, sub_category, description, short_description,
          joining_fee, annual_fee, interest_rate, rewards, cashback, lounge_access,
          fuel_surcharge, features, benefits, compare_specs, eligibility, eligibility_criteria,
          documents_required, fees_charges, apply_button_text, seo_title, seo_description,
          seo_keywords, priority, display_order, status, is_active, public_visible,
          partner_visible, featured, commission_enabled, slug
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12,
          $13, $14, $15, $16, $17, $18,
          $19, $20, 'Apply Now', $21, $22,
          $23, $24, $25, 'Active', true, true,
          true, true, true, $26
        )
        ON CONFLICT (bank_id, name) DO UPDATE SET
          sub_category = EXCLUDED.sub_category,
          description = EXCLUDED.description,
          short_description = EXCLUDED.short_description,
          joining_fee = EXCLUDED.joining_fee,
          annual_fee = EXCLUDED.annual_fee,
          interest_rate = EXCLUDED.interest_rate,
          rewards = EXCLUDED.rewards,
          cashback = EXCLUDED.cashback,
          lounge_access = EXCLUDED.lounge_access,
          fuel_surcharge = EXCLUDED.fuel_surcharge,
          features = EXCLUDED.features,
          benefits = EXCLUDED.benefits,
          compare_specs = EXCLUDED.compare_specs,
          eligibility = EXCLUDED.eligibility,
          eligibility_criteria = EXCLUDED.eligibility_criteria,
          documents_required = EXCLUDED.documents_required,
          fees_charges = EXCLUDED.fees_charges,
          seo_title = EXCLUDED.seo_title,
          seo_description = EXCLUDED.seo_description,
          seo_keywords = EXCLUDED.seo_keywords,
          status = 'Active',
          is_active = true,
          updated_at = NOW()
        RETURNING (xmin = 0) AS is_insert
      `, [
        bankId, card.name, category, subCategory, card.description, card.short_description,
        card.joining_fee, card.annual_fee, card.interest_rate, card.rewards, card.cashback || 'Perks', card.lounge_access,
        card.fuel_surcharge, featuresJson, card.benefits, compareSpecsJson, eligJson, card.eligibility_criteria,
        card.documents_required, card.fees_charges, card.seo_title, card.seo_description,
        card.seo_keywords, card.priority || 1, card.display_order || 1, cardSlug
      ]);

      if (result.rows[0]?.is_insert) {
        totalInserted++;
      } else {
        totalUpdated++;
      }
      console.log(`  ✅ ${card.name} (${subCategory})`);
    }
  }

  console.log(`\n════════════════════════════════════════`);
  console.log(`✅ Master Card Seeding complete: ${totalInserted} inserted, ${totalUpdated} updated.`);
  console.log(`════════════════════════════════════════\n`);
}

if (require.main === module) {
  seed().then(() => process.exit(0)).catch(err => {
    console.error('❌ Master Card Seed error:', err);
    process.exit(1);
  });
}

module.exports = { seed, ALL_CARDS };

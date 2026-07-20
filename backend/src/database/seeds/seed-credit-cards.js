/**
 * Seed Script: Credit Card Products
 * Inserts all credit card products for all banks into the products table.
 * Run: node backend/src/database/seeds/seed-credit-cards.js
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const { query, pool } = require('../../config/database');

// ─── Helper ─────────────────────────────────────────────────────
function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// ─── Card Data ──────────────────────────────────────────────────
const ALL_CARDS = {

  // ═══════════════════════════════════════════════════════════════
  // 1. HDFC BANK — 21 Cards
  // ═══════════════════════════════════════════════════════════════
  HDFC: [
    {
      name: 'HDFC Freedom Credit Card',
      category: 'credit_card',
      short_description: 'Perfect entry-level card for daily spends',
      description: 'HDFC Freedom Credit Card is an entry-level card designed for first-time credit card users. It offers reward points on everyday purchases including groceries, dining, and utility bills. With no annual fee in the first year and easy approval criteria, it is ideal for building a credit history.',
      annual_fee: '₹500 (Waived on ₹50,000 annual spend)',
      features: [
        '5X reward points on dining and grocery spends',
        '1% fuel surcharge waiver at all fuel stations',
        'Complimentary access to domestic airport lounges (2/year)',
        'Zero lost card liability',
        'EMI conversion on transactions above ₹2,500'
      ],
      benefits: 'Reward points redeemable against flights, hotel stays, and merchandise. 1% fuel surcharge waiver. 15% discount on dining at partner restaurants.',
      eligibility: { min_age: 21, max_age: 60, min_income: 15000, employment: 'Salaried / Self-Employed' },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹15,000 (salaried) or ₹3,00,000 annual income (self-employed). Good CIBIL score (700+).',
      documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Last 6 months bank statement, Passport-size photo',
      fees_charges: 'Joining Fee: ₹500 | Annual Fee: ₹500 (waived on ₹50,000 spend) | Interest Rate: 3.49% per month (41.88% p.a.) | Late Payment: ₹100-₹1,300 | Cash Advance Fee: 2.5% (min ₹500)',
      seo_title: 'HDFC Freedom Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for HDFC Freedom Credit Card. Earn 5X rewards on dining and groceries, 1% fuel surcharge waiver, and complimentary lounge access.',
      seo_keywords: 'HDFC Freedom credit card, HDFC entry level card, HDFC rewards card, apply HDFC card online',
      min_age: 21, max_age: 60, min_income: 15000, display_order: 1, priority: 1,
    },
    {
      name: 'HDFC MoneyBack+ Credit Card',
      category: 'credit_card',
      short_description: '10X CashPoints on popular online merchants',
      description: 'HDFC MoneyBack+ Credit Card offers accelerated cashback on online shopping, bill payments, and everyday transactions. It provides 10X CashPoints on partner merchants like Amazon, Flipkart, and Swiggy, making it ideal for digital-savvy spenders.',
      annual_fee: '₹500 (Waived on ₹50,000 annual spend)',
      features: [
        '10X CashPoints on Amazon, Flipkart, Swiggy, and BigBasket',
        '2 CashPoints per ₹150 on all other spends',
        '1% fuel surcharge waiver at all fuel stations',
        'Up to 15% discount at partner dining outlets',
        'Contactless payments enabled'
      ],
      benefits: '10X reward points on SmartBuy portal purchases. CashPoints redeemable as statement credit. Complimentary membership to dining programs.',
      eligibility: { min_age: 21, max_age: 60, min_income: 20000, employment: 'Salaried / Self-Employed' },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹20,000 (salaried). Good CIBIL score (700+).',
      documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Last 6 months bank statement',
      fees_charges: 'Joining Fee: ₹500 | Annual Fee: ₹500 (waived on ₹50,000 spend) | Interest Rate: 3.49% per month | Late Payment: ₹100-₹1,300',
      seo_title: 'HDFC MoneyBack+ Credit Card – 10X CashPoints | GharKaPaisa',
      seo_description: 'Apply for HDFC MoneyBack+ Credit Card. Earn 10X CashPoints on Amazon, Flipkart, Swiggy and more.',
      seo_keywords: 'HDFC MoneyBack plus, HDFC cashback card, HDFC 10X rewards card',
      min_age: 21, max_age: 60, min_income: 20000, display_order: 2, priority: 2,
    },
    {
      name: 'HDFC Millennia Credit Card',
      category: 'credit_card',
      short_description: '5% cashback on top online shopping brands',
      description: 'HDFC Millennia Credit Card is designed for millennials who shop online frequently. It offers 5% cashback on Amazon, Flipkart, and other online spends, along with 1% cashback on offline purchases. The card also comes with complimentary airport lounge access.',
      annual_fee: '₹1,000 (Waived on ₹1,00,000 annual spend)',
      features: [
        '5% cashback on Amazon, Flipkart, and online spends (capped at ₹750/month)',
        '1% cashback on offline and wallet spends',
        '2.5% cashback on all UPI transactions via HDFC PayZapp',
        '4 complimentary domestic airport lounge visits per year',
        'Up to 15% discount at partner restaurants'
      ],
      benefits: 'Cashback auto-credited as CashPoints. Airport lounge access via Mastercard program. Zero liability on lost card. EMI conversion facility.',
      eligibility: { min_age: 21, max_age: 60, min_income: 25000, employment: 'Salaried / Self-Employed' },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹25,000 (salaried) or ₹6,00,000 annual income (self-employed). CIBIL score 720+.',
      documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Last 6 months bank statement, Passport-size photo',
      fees_charges: 'Joining Fee: ₹1,000 | Annual Fee: ₹1,000 (waived on ₹1,00,000 spend) | Interest Rate: 3.49% per month | Late Payment: ₹100-₹1,300 | Foreign Currency Fee: 3.5%',
      seo_title: 'HDFC Millennia Credit Card – 5% Cashback Online | GharKaPaisa',
      seo_description: 'Apply for HDFC Millennia Credit Card. Get 5% cashback on Amazon and Flipkart and 4 free lounge visits.',
      seo_keywords: 'HDFC Millennia card, HDFC 5% cashback card, HDFC online shopping card',
      min_age: 21, max_age: 60, min_income: 25000, display_order: 3, priority: 3,
    },
    {
      name: 'HDFC Regalia Gold Credit Card',
      category: 'credit_card',
      short_description: 'Premium travel and luxury lifestyle card',
      description: 'HDFC Regalia Gold Credit Card is a premium card offering unparalleled travel and lifestyle privileges. Earn accelerated reward points on travel bookings, enjoy complimentary airport lounge access worldwide, and get access to exclusive Visa Infinite concierge services.',
      annual_fee: '₹2,500 (Waived on ₹3,00,000 annual spend)',
      features: [
        '6X reward points on travel, dining, and entertainment via SmartBuy',
        'Complimentary Priority Pass membership with 6 international lounge visits',
        '12 domestic lounge visits per year',
        'Golf privileges at select courses',
        'Comprehensive travel insurance cover of ₹1 Crore'
      ],
      benefits: '1% fuel surcharge waiver. Zero foreign currency markup on international spends. Access to Visa Luxury Hotel Collection. Milestone reward of 5,000 bonus points on ₹5 lakh spend.',
      eligibility: { min_age: 21, max_age: 60, min_income: 60000, employment: 'Salaried / Self-Employed' },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹60,000 (salaried) or ₹15,00,000 annual income (self-employed). CIBIL score 750+.',
      documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Last 6 months bank statement, Form 16 / ITR',
      fees_charges: 'Joining Fee: ₹2,500 | Annual Fee: ₹2,500 (waived on ₹3,00,000 spend) | Interest Rate: 3.49% per month | Foreign Currency Fee: 2% | Cash Advance Fee: 2.5%',
      seo_title: 'HDFC Regalia Gold Credit Card – Premium Travel Card | GharKaPaisa',
      seo_description: 'Apply for HDFC Regalia Gold Card. Get Priority Pass lounge access, 6X travel rewards, and ₹1 Crore travel insurance.',
      seo_keywords: 'HDFC Regalia Gold, HDFC premium card, HDFC travel credit card, Priority Pass HDFC',
      min_age: 21, max_age: 60, min_income: 60000, display_order: 4, priority: 4,
    },
    {
      name: 'HDFC BizGrow Credit Card',
      category: 'credit_card',
      short_description: 'Tailored for growing business expenses',
      description: 'HDFC BizGrow Credit Card is designed for small and medium business owners. It offers accelerated reward points on business-related spends including office supplies, telecom, and advertising. The card comes with a dedicated business expense management dashboard.',
      annual_fee: '₹500 (Waived on ₹1,50,000 annual spend)',
      features: [
        '3X reward points on business supplies, telecom, and advertising',
        'Up to 50 days interest-free credit period',
        'Detailed monthly business expense reports',
        '1% fuel surcharge waiver',
        'EMI facility on large business purchases'
      ],
      benefits: 'Business expense categorization reports. Reward points redeemable for travel and merchandise. Supplementary cards for employees.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000, employment: 'Self-Employed / Business Owner' },
      eligibility_criteria: 'Age: 21-65 years. Minimum business vintage: 2 years. Annual turnover: ₹5,00,000+. Good CIBIL score (700+).',
      documents_required: 'PAN Card, Aadhaar Card, Business registration certificate, Last 2 years ITR, Last 6 months bank statement',
      fees_charges: 'Joining Fee: ₹500 | Annual Fee: ₹500 (waived on ₹1,50,000 spend) | Interest Rate: 3.49% per month',
      seo_title: 'HDFC BizGrow Credit Card – Business Card | GharKaPaisa',
      seo_description: 'Apply for HDFC BizGrow Credit Card. Earn 3X rewards on business expenses with up to 50 days interest-free period.',
      seo_keywords: 'HDFC BizGrow, HDFC business credit card, HDFC SME card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 5, priority: 5,
    },
    {
      name: 'HDFC BizPower Credit Card',
      category: 'credit_card',
      short_description: 'Powering business spends with premium rewards',
      description: 'HDFC BizPower Credit Card is a premium business card for established enterprises. It offers enhanced credit limits, premium lounge access, and accelerated rewards on high-value business transactions. Ideal for companies with significant monthly business expenditures.',
      annual_fee: '₹2,500 (Waived on ₹3,00,000 annual spend)',
      features: [
        '4X reward points on travel, dining, and business supplies',
        'Complimentary domestic and international lounge access',
        'Enhanced credit limits for business needs',
        'Comprehensive travel and purchase protection insurance',
        'Priority customer service line'
      ],
      benefits: 'Expense management tools. 1% fuel surcharge waiver. Reward points transferable to airline miles. Access to business networking events.',
      eligibility: { min_age: 21, max_age: 65, min_income: 50000, employment: 'Self-Employed / Business Owner' },
      eligibility_criteria: 'Age: 21-65 years. Minimum business vintage: 3 years. Annual turnover: ₹15,00,000+. CIBIL score 750+.',
      documents_required: 'PAN Card, Aadhaar Card, Business registration certificate, GST certificate, Last 2 years ITR, Last 6 months bank statement',
      fees_charges: 'Joining Fee: ₹2,500 | Annual Fee: ₹2,500 (waived on ₹3,00,000 spend) | Interest Rate: 3.49% per month',
      seo_title: 'HDFC BizPower Credit Card – Premium Business Card | GharKaPaisa',
      seo_description: 'Apply for HDFC BizPower Credit Card. Get 4X rewards, lounge access, and enhanced credit limits for your business.',
      seo_keywords: 'HDFC BizPower, HDFC premium business card, HDFC corporate card',
      min_age: 21, max_age: 65, min_income: 50000, display_order: 6, priority: 6,
    },
    {
      name: 'HDFC BizFirst Credit Card',
      category: 'credit_card',
      short_description: 'Smart cashbacks on business utilities and supplies',
      description: 'HDFC BizFirst Credit Card is a starter business credit card for new entrepreneurs and freelancers. It offers cashback on utility payments, office supplies, and internet/telecom services, making it the perfect first business card.',
      annual_fee: '₹500 (Waived on ₹1,00,000 annual spend)',
      features: [
        '5% cashback on utility and telecom bill payments',
        '2X reward points on office supplies and stationery',
        'Up to 45 days interest-free period',
        'Zero joining fee with welcome vouchers worth ₹500',
        'Fuel surcharge waiver up to ₹100/month'
      ],
      benefits: 'Cashback on recurring business expenses. Easy EMI conversion for equipment purchases. Monthly expense summary report.',
      eligibility: { min_age: 21, max_age: 65, min_income: 20000, employment: 'Self-Employed / Freelancer' },
      eligibility_criteria: 'Age: 21-65 years. Minimum annual income: ₹2,40,000. Business vintage: 1 year+. CIBIL score 700+.',
      documents_required: 'PAN Card, Aadhaar Card, Business proof, Last 1 year ITR, Last 3 months bank statement',
      fees_charges: 'Joining Fee: ₹500 | Annual Fee: ₹500 (waived on ₹1,00,000 spend) | Interest Rate: 3.49% per month',
      seo_title: 'HDFC BizFirst Credit Card – Starter Business Card | GharKaPaisa',
      seo_description: 'Apply for HDFC BizFirst Credit Card. Get 5% cashback on utility bills and smart rewards for small businesses.',
      seo_keywords: 'HDFC BizFirst, HDFC starter business card, HDFC freelancer card',
      min_age: 21, max_age: 65, min_income: 20000, display_order: 7, priority: 7,
    },
    {
      name: 'HDFC Pixel Play Credit Card',
      category: 'co_branded_card',
      short_description: 'Customizable benefits in a digital-first avatar',
      description: 'HDFC Pixel Play Credit Card is a fully customizable, digital-first credit card that lets you pick your own reward categories. Choose from shopping, dining, travel, or entertainment and earn boosted rewards on the categories that matter to you the most. Lifetime free.',
      annual_fee: 'Lifetime Free',
      features: [
        'Choose your own 5X reward category (shopping, dining, travel, or entertainment)',
        '1% cashback on all other spends',
        'Zero joining fee and zero annual fee (Lifetime Free)',
        'Instant virtual card issuance on approval',
        'Contactless tap-and-pay enabled'
      ],
      benefits: 'Customizable rewards. Free movie tickets via BookMyShow. Partner merchant discounts. Zero liability on unauthorized transactions.',
      eligibility: { min_age: 21, max_age: 60, min_income: 20000, employment: 'Salaried / Self-Employed' },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹20,000. CIBIL score 700+.',
      documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Bank statement',
      fees_charges: 'Joining Fee: Nil | Annual Fee: Nil (Lifetime Free) | Interest Rate: 3.49% per month | Late Payment: ₹100-₹1,300',
      seo_title: 'HDFC Pixel Play Credit Card – Lifetime Free | GharKaPaisa',
      seo_description: 'Apply for HDFC Pixel Play Card. Lifetime free with customizable 5X rewards on your choice of category.',
      seo_keywords: 'HDFC Pixel Play, HDFC lifetime free card, HDFC customizable card',
      min_age: 21, max_age: 60, min_income: 20000, display_order: 8, priority: 8, featured: true,
    },
    {
      name: 'HDFC Pixel Go Credit Card',
      category: 'co_branded_card',
      short_description: 'Smart lifestyle benefits on the go',
      description: 'HDFC Pixel Go Credit Card is a lifestyle-focused digital card offering rewards on travel, food delivery, and OTT subscriptions. With zero annual fee forever and instant digital issuance, it is the perfect card for young professionals.',
      annual_fee: 'Lifetime Free',
      features: [
        '5X reward points on Swiggy, Zomato, and food delivery apps',
        '3X reward points on OTT subscriptions (Netflix, Hotstar, Amazon Prime)',
        'Zero joining fee and zero annual fee (Lifetime Free)',
        'Instant virtual card on approval',
        'Complimentary movie tickets (BOGO) on BookMyShow'
      ],
      benefits: 'OTT and food delivery rewards. Free movie tickets. Easy EMI on electronics. Zero liability policy.',
      eligibility: { min_age: 21, max_age: 60, min_income: 18000, employment: 'Salaried / Self-Employed' },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹18,000. CIBIL score 700+.',
      documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Bank statement',
      fees_charges: 'Joining Fee: Nil | Annual Fee: Nil (Lifetime Free) | Interest Rate: 3.49% per month | Late Payment: ₹100-₹1,300',
      seo_title: 'HDFC Pixel Go Credit Card – Lifetime Free Lifestyle Card | GharKaPaisa',
      seo_description: 'Apply for HDFC Pixel Go Card. Lifetime free with 5X rewards on food delivery and OTT subscriptions.',
      seo_keywords: 'HDFC Pixel Go, HDFC lifestyle card, HDFC food delivery rewards',
      min_age: 21, max_age: 60, min_income: 18000, display_order: 9, priority: 9, featured: true,
    },
    {
      name: 'Tata Neu Plus HDFC Bank Credit Card',
      category: 'co_branded_card',
      short_description: '2% NeuCoins back on Neu spend and partners',
      description: 'Tata Neu Plus HDFC Bank Credit Card offers accelerated NeuCoins on purchases across the Tata ecosystem including BigBasket, Croma, Westside, and Tata CLiQ. Earn 2% NeuCoins on Tata partners and 0.5% on other spends.',
      annual_fee: '₹499 (Waived on ₹50,000 annual spend)',
      features: [
        '2% NeuCoins on Tata Neu partner brands',
        '5% NeuCoins on BigBasket and Croma purchases',
        '0.5% NeuCoins on all other spends',
        'Complimentary Tata Neu Gold membership',
        '1% fuel surcharge waiver'
      ],
      benefits: 'NeuCoins redeemable 1:1 as ₹1 on Tata Neu app. Tata Gold membership included. Exclusive offers on Tata brands.',
      eligibility: { min_age: 21, max_age: 60, min_income: 20000, employment: 'Salaried / Self-Employed' },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹20,000. CIBIL score 700+.',
      documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Bank statement',
      fees_charges: 'Joining Fee: ₹499 | Annual Fee: ₹499 (waived on ₹50,000 spend) | Interest Rate: 3.49% per month',
      seo_title: 'Tata Neu Plus HDFC Credit Card – NeuCoins Rewards | GharKaPaisa',
      seo_description: 'Apply for Tata Neu Plus HDFC Card. Earn 2-5% NeuCoins on BigBasket, Croma, and Tata brands.',
      seo_keywords: 'Tata Neu Plus HDFC, HDFC Tata card, NeuCoins credit card',
      min_age: 21, max_age: 60, min_income: 20000, display_order: 10, priority: 10,
    },
    {
      name: 'Tata Neu Infinity HDFC Bank Credit Card',
      category: 'co_branded_card',
      short_description: '5% NeuCoins back on Neu spend and partners',
      description: 'Tata Neu Infinity HDFC Bank Credit Card is the premium version of the Tata Neu card, offering 5% NeuCoins on all Tata Neu partner spends and 1.5% on other transactions. It comes with complimentary lounge access and premium Tata Neu Platinum membership.',
      annual_fee: '₹1,499 (Waived on ₹2,00,000 annual spend)',
      features: [
        '5% NeuCoins on Tata Neu partner brands',
        '10% NeuCoins on BigBasket and Croma purchases',
        '1.5% NeuCoins on all other spends',
        'Complimentary Tata Neu Platinum membership',
        '4 complimentary domestic lounge visits per year'
      ],
      benefits: 'Premium NeuCoin earning rate. Tata Platinum membership. Airport lounge access. Priority customer support.',
      eligibility: { min_age: 21, max_age: 60, min_income: 35000, employment: 'Salaried / Self-Employed' },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹35,000. CIBIL score 720+.',
      documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Last 6 months bank statement',
      fees_charges: 'Joining Fee: ₹1,499 | Annual Fee: ₹1,499 (waived on ₹2,00,000 spend) | Interest Rate: 3.49% per month',
      seo_title: 'Tata Neu Infinity HDFC Credit Card – Premium NeuCoins | GharKaPaisa',
      seo_description: 'Apply for Tata Neu Infinity HDFC Card. Earn 5-10% NeuCoins with lounge access and Platinum membership.',
      seo_keywords: 'Tata Neu Infinity HDFC, HDFC Tata premium card, NeuCoins Infinity card',
      min_age: 21, max_age: 60, min_income: 35000, display_order: 11, priority: 11,
    },
    {
      name: 'Swiggy HDFC Bank Credit Card',
      category: 'co_branded_card',
      short_description: '10% cashback on Swiggy spends',
      description: 'Swiggy HDFC Bank Credit Card is a food-lovers card offering 10% cashback on all Swiggy orders including food delivery, Instamart, and Dineout. Also earn 5% cashback on online spends and 1% on offline transactions.',
      annual_fee: '₹500 (Waived on ₹2,00,000 annual spend)',
      features: [
        '10% cashback on Swiggy food delivery, Instamart, and Dineout',
        '5% cashback on online spends',
        '1% cashback on offline spends',
        'Complimentary Swiggy One membership worth ₹1,499',
        'Welcome vouchers worth ₹500'
      ],
      benefits: 'Swiggy One membership included. Cashback auto-credited. Movie ticket discounts. Fuel surcharge waiver.',
      eligibility: { min_age: 21, max_age: 60, min_income: 20000, employment: 'Salaried / Self-Employed' },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹20,000. CIBIL score 700+.',
      documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Bank statement',
      fees_charges: 'Joining Fee: ₹500 | Annual Fee: ₹500 (waived on ₹2,00,000 spend) | Interest Rate: 3.49% per month',
      seo_title: 'Swiggy HDFC Credit Card – 10% Cashback on Food | GharKaPaisa',
      seo_description: 'Apply for Swiggy HDFC Card. Get 10% cashback on Swiggy orders and complimentary Swiggy One membership.',
      seo_keywords: 'Swiggy HDFC card, HDFC food delivery card, Swiggy cashback card',
      min_age: 21, max_age: 60, min_income: 20000, display_order: 12, priority: 12,
    },
    {
      name: 'IndianOil HDFC Bank Credit Card',
      category: 'co_branded_card',
      short_description: 'Earn up to 50 Liters of free fuel annually',
      description: 'IndianOil HDFC Bank Credit Card is designed for motorists. Earn fuel points on every IndianOil fuel purchase and save up to 50 liters of free fuel per year. Also offers rewards on grocery, dining, and other everyday spends.',
      annual_fee: '₹500 (Waived on ₹50,000 annual spend)',
      features: [
        'Up to 50 liters of free fuel per year via FuelPoints',
        '5% FuelPoints on IndianOil fuel purchases',
        '5X reward points on grocery and dining',
        '1% fuel surcharge waiver at all fuel stations',
        'Zero joining fee in first year'
      ],
      benefits: 'FuelPoints redeemable at IndianOil stations. 1% fuel surcharge waiver. Grocery and dining rewards.',
      eligibility: { min_age: 21, max_age: 60, min_income: 15000, employment: 'Salaried / Self-Employed' },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹15,000. CIBIL score 700+.',
      documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Bank statement',
      fees_charges: 'Joining Fee: ₹500 | Annual Fee: ₹500 (waived on ₹50,000 spend) | Interest Rate: 3.49% per month',
      seo_title: 'IndianOil HDFC Credit Card – Free Fuel Card | GharKaPaisa',
      seo_description: 'Apply for IndianOil HDFC Card. Save up to 50 liters of free fuel per year with 5% FuelPoints.',
      seo_keywords: 'IndianOil HDFC card, HDFC fuel card, IndianOil fuel credit card',
      min_age: 21, max_age: 60, min_income: 15000, display_order: 13, priority: 13,
    },
    {
      name: 'IRCTC HDFC Bank Credit Card',
      category: 'co_branded_card',
      short_description: 'Save on railway tickets booking via IRCTC',
      description: 'IRCTC HDFC Bank Credit Card is the perfect card for frequent train travelers. Earn reward points on every IRCTC booking, get transaction fee waivers, and enjoy complimentary railway lounge access.',
      annual_fee: '₹500 (Waived on ₹50,000 annual spend)',
      features: [
        '10% value back on IRCTC bookings (up to ₹500/month)',
        'Transaction fee waiver on IRCTC website',
        '5X reward points on dining and grocery',
        'Complimentary railway lounge access (4/year)',
        '1% fuel surcharge waiver'
      ],
      benefits: 'IRCTC transaction fee waiver. Railway lounge access. Reward points redeemable on IRCTC bookings.',
      eligibility: { min_age: 21, max_age: 60, min_income: 15000, employment: 'Salaried / Self-Employed' },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹15,000. CIBIL score 700+.',
      documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Bank statement',
      fees_charges: 'Joining Fee: ₹500 | Annual Fee: ₹500 (waived on ₹50,000 spend) | Interest Rate: 3.49% per month',
      seo_title: 'IRCTC HDFC Credit Card – Save on Train Tickets | GharKaPaisa',
      seo_description: 'Apply for IRCTC HDFC Card. Get 10% value back on IRCTC bookings and railway lounge access.',
      seo_keywords: 'IRCTC HDFC card, HDFC railway card, IRCTC credit card',
      min_age: 21, max_age: 60, min_income: 15000, display_order: 14, priority: 14,
    },
    {
      name: 'HDFC Diners Club Privilege Credit Card',
      category: 'co_branded_card',
      short_description: 'Exclusive global lounge access and dining benefits',
      description: 'HDFC Diners Club Privilege Credit Card offers premium lifestyle benefits including unlimited domestic airport lounge access, international lounge visits, golf privileges, and accelerated rewards on travel and dining.',
      annual_fee: '₹2,500 (Waived on ₹3,00,000 annual spend)',
      features: [
        'Unlimited domestic airport lounge access',
        '6 complimentary international lounge visits per year',
        '4X reward points on dining, travel, and entertainment',
        'Golf privileges at select courses',
        'Complimentary Dineout Passport membership'
      ],
      benefits: 'Unlimited domestic lounge access. International Priority Pass. Golf course access. Dineout Passport dining benefits.',
      eligibility: { min_age: 21, max_age: 60, min_income: 40000, employment: 'Salaried / Self-Employed' },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹40,000. CIBIL score 720+.',
      documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Last 6 months bank statement, Form 16 / ITR',
      fees_charges: 'Joining Fee: ₹2,500 | Annual Fee: ₹2,500 (waived on ₹3,00,000 spend) | Interest Rate: 3.49% per month',
      seo_title: 'HDFC Diners Club Privilege – Premium Dining & Lounge Card | GharKaPaisa',
      seo_description: 'Apply for HDFC Diners Club Privilege. Get unlimited lounge access, golf privileges, and 4X dining rewards.',
      seo_keywords: 'HDFC Diners Club Privilege, HDFC lounge card, Diners Club India',
      min_age: 21, max_age: 60, min_income: 40000, display_order: 15, priority: 15,
    },
    {
      name: 'HDFC Diners Club Black Credit Card',
      category: 'co_branded_card',
      short_description: 'Super premium card for global travelers',
      description: 'HDFC Diners Club Black Credit Card is the ultimate premium card offering unlimited airport lounge access worldwide, 10X reward points on SmartBuy, complimentary annual memberships (Club Marriott, Amazon Prime, etc.), and comprehensive global travel insurance.',
      annual_fee: '₹10,000 (Waived on ₹5,00,000 annual spend)',
      features: [
        'Unlimited international and domestic airport lounge access',
        '10X reward points on SmartBuy portal (flights, hotels)',
        '2X reward points on dining, travel, and entertainment',
        'Complimentary Club Marriott, Amazon Prime, Swiggy One, and more',
        'Air accident insurance cover of ₹2 Crore'
      ],
      benefits: 'Unlimited global lounge access. ₹2 Crore travel insurance. Complimentary annual memberships worth ₹15,000+. Zero foreign currency markup.',
      eligibility: { min_age: 21, max_age: 60, min_income: 175000, employment: 'Salaried / Self-Employed' },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹1,75,000 (net). CIBIL score 750+. Typically upgrade from Diners Club Privilege.',
      documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Last 6 months bank statement, Form 16 / ITR',
      fees_charges: 'Joining Fee: ₹10,000 | Annual Fee: ₹10,000 (waived on ₹5,00,000 spend) | Interest Rate: 3.49% per month | Foreign Currency Fee: Nil',
      seo_title: 'HDFC Diners Club Black – Ultra Premium Card | GharKaPaisa',
      seo_description: 'Apply for HDFC Diners Club Black. Unlimited worldwide lounge access, 10X SmartBuy rewards, and complimentary premium memberships.',
      seo_keywords: 'HDFC Diners Club Black, HDFC super premium card, HDFC ultra premium card',
      min_age: 21, max_age: 60, min_income: 175000, display_order: 16, priority: 16,
    },
    {
      name: 'Marriott Bonvoy HDFC Bank Credit Card',
      category: 'co_branded_card',
      short_description: 'Complimentary hotel nights and loyalty points',
      description: 'Marriott Bonvoy HDFC Bank Credit Card lets you earn Marriott Bonvoy points on every transaction, redeemable for hotel stays at 8,000+ properties worldwide. Enjoy complimentary Marriott Bonvoy Gold Elite status and free night awards.',
      annual_fee: '₹3,000 (Waived on ₹3,00,000 annual spend)',
      features: [
        '8 Marriott Bonvoy points per ₹150 on travel, dining, and entertainment',
        '4 Marriott Bonvoy points per ₹150 on all other spends',
        'Complimentary Marriott Bonvoy Gold Elite status',
        '1 Free Night Award (up to 15,000 points) on ₹5 lakh annual spend',
        'Access to Marriott Bonvoy member rates and promotions'
      ],
      benefits: 'Marriott Gold Elite status (room upgrades, late checkout). Free night award on milestone spend. Points never expire with activity.',
      eligibility: { min_age: 21, max_age: 60, min_income: 50000, employment: 'Salaried / Self-Employed' },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹50,000. CIBIL score 720+.',
      documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Last 6 months bank statement',
      fees_charges: 'Joining Fee: ₹3,000 | Annual Fee: ₹3,000 (waived on ₹3,00,000 spend) | Interest Rate: 3.49% per month',
      seo_title: 'Marriott Bonvoy HDFC Credit Card – Hotel Rewards | GharKaPaisa',
      seo_description: 'Apply for Marriott Bonvoy HDFC Card. Earn Bonvoy points, free nights, and Gold Elite status at 8,000+ hotels.',
      seo_keywords: 'Marriott Bonvoy HDFC, HDFC hotel card, Marriott credit card India',
      min_age: 21, max_age: 60, min_income: 50000, display_order: 17, priority: 17,
    },
    {
      name: 'Shoppers Stop Black HDFC Bank Credit Card',
      category: 'co_branded_card',
      short_description: 'Elite membership and premium rewards at Shoppers Stop',
      description: 'Shoppers Stop Black HDFC Bank Credit Card offers Black Card membership at Shoppers Stop with exclusive benefits including extra discounts, reward points on fashion purchases, and access to members-only sales and preview events.',
      annual_fee: '₹4,500 (Waived on ₹5,00,000 annual spend)',
      features: [
        'Complimentary Shoppers Stop Black Card membership (worth ₹4,000)',
        '6X reward points on Shoppers Stop and group brands',
        '3X reward points on dining and entertainment',
        'First Citizen points on every Shoppers Stop purchase',
        'Access to members-only sale previews and events'
      ],
      benefits: 'Shoppers Stop Black membership included. First Citizen loyalty points. Extra discounts during sales. Priority access to new collections.',
      eligibility: { min_age: 21, max_age: 60, min_income: 45000, employment: 'Salaried / Self-Employed' },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹45,000. CIBIL score 720+.',
      documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Last 6 months bank statement',
      fees_charges: 'Joining Fee: ₹4,500 | Annual Fee: ₹4,500 (waived on ₹5,00,000 spend) | Interest Rate: 3.49% per month',
      seo_title: 'Shoppers Stop Black HDFC Card – Fashion Rewards | GharKaPaisa',
      seo_description: 'Apply for Shoppers Stop Black HDFC Card. Get Black Card membership and 6X rewards on fashion shopping.',
      seo_keywords: 'Shoppers Stop Black HDFC, HDFC fashion card, Shoppers Stop credit card',
      min_age: 21, max_age: 60, min_income: 45000, display_order: 18, priority: 18,
    },
    {
      name: 'Shoppers Stop HDFC Bank Credit Card',
      category: 'co_branded_card',
      short_description: 'Accelerated reward points on fashion shopping',
      description: 'Shoppers Stop HDFC Bank Credit Card offers First Citizen membership and accelerated reward points on purchases at Shoppers Stop, HomeStop, and Crossword. Ideal for fashion enthusiasts looking for everyday shopping rewards.',
      annual_fee: '₹500 (Waived on ₹1,00,000 annual spend)',
      features: [
        'Complimentary First Citizen Gold membership',
        '4X reward points on Shoppers Stop purchases',
        '2X reward points on dining',
        'Welcome vouchers worth ₹500',
        'Extra discount during End of Season Sales'
      ],
      benefits: 'First Citizen Gold membership. Welcome vouchers. Extra EOSS discounts. Reward points redeemable at Shoppers Stop.',
      eligibility: { min_age: 21, max_age: 60, min_income: 20000, employment: 'Salaried / Self-Employed' },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹20,000. CIBIL score 700+.',
      documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Bank statement',
      fees_charges: 'Joining Fee: ₹500 | Annual Fee: ₹500 (waived on ₹1,00,000 spend) | Interest Rate: 3.49% per month',
      seo_title: 'Shoppers Stop HDFC Credit Card – Shopping Rewards | GharKaPaisa',
      seo_description: 'Apply for Shoppers Stop HDFC Card. Get First Citizen membership and 4X rewards on fashion shopping.',
      seo_keywords: 'Shoppers Stop HDFC, HDFC shopping card, First Citizen credit card',
      min_age: 21, max_age: 60, min_income: 20000, display_order: 19, priority: 19,
    },
    {
      name: 'HDFC Credit Card Against Existing FD',
      category: 'fd_card',
      short_description: 'Get credit limit mapped directly against your existing FD',
      description: 'HDFC Credit Card Against Existing FD is a secured credit card where your existing fixed deposit serves as collateral. Get a credit limit of up to 90% of your FD value with no income proof required. Perfect for students, homemakers, and those building credit history.',
      annual_fee: 'Nil',
      features: [
        'Credit limit up to 90% of FD value',
        'No income proof required',
        'FD continues to earn interest',
        'Reward points on every transaction',
        'Easy upgrade path to regular credit cards'
      ],
      benefits: 'Build credit score with secured card. FD earns full interest. No annual fee. Easy approval without income proof.',
      eligibility: { min_age: 18, max_age: 65, min_income: 0, employment: 'Any (FD holder)' },
      eligibility_criteria: 'Age: 18-65 years. Must have an existing HDFC Bank FD of ₹5,000+. No income proof required.',
      documents_required: 'PAN Card, Aadhaar Card, HDFC Bank FD receipt/statement',
      fees_charges: 'Joining Fee: Nil | Annual Fee: Nil | Interest Rate: 3.49% per month | FD Lien: Yes',
      seo_title: 'HDFC FD Credit Card – Secured Card Against FD | GharKaPaisa',
      seo_description: 'Apply for HDFC Credit Card against your Fixed Deposit. No income proof, nil fee, and credit limit up to 90% of FD.',
      seo_keywords: 'HDFC FD credit card, HDFC secured card, credit card against FD',
      min_age: 18, max_age: 65, min_income: 0, display_order: 20, priority: 20,
    },
    {
      name: 'HDFC New FD Based Credit Card',
      category: 'fd_card',
      short_description: 'Open a new FD instantly to unlock HDFC credit power',
      description: 'HDFC New FD Based Credit Card allows you to open a new fixed deposit and instantly get a credit card with a limit of up to 90% of the FD amount. Your FD earns full interest while you build credit history.',
      annual_fee: 'Nil',
      features: [
        'Open a new FD starting from ₹5,000',
        'Credit limit up to 90% of new FD value',
        'FD earns full interest rate',
        'No income proof required',
        'Build credit score for future unsecured cards'
      ],
      benefits: 'Instant FD creation and card approval. Full interest on FD. Zero annual fee. Build credit history.',
      eligibility: { min_age: 18, max_age: 65, min_income: 0, employment: 'Any' },
      eligibility_criteria: 'Age: 18-65 years. Must open a new HDFC Bank FD of ₹5,000+. No income proof required.',
      documents_required: 'PAN Card, Aadhaar Card, Funds for FD creation',
      fees_charges: 'Joining Fee: Nil | Annual Fee: Nil | Interest Rate: 3.49% per month | FD Lien: Yes',
      seo_title: 'HDFC New FD Credit Card – Open FD Get Card | GharKaPaisa',
      seo_description: 'Apply for HDFC New FD Credit Card. Open a FD from ₹5,000 and get instant credit card with nil fee.',
      seo_keywords: 'HDFC new FD card, HDFC secured FD card, open FD get credit card',
      min_age: 18, max_age: 65, min_income: 0, display_order: 21, priority: 21,
    },
  ],

  // ═══════════════════════════════════════════════════════════════
  // 2. SBI CARD — 12 Cards
  // ═══════════════════════════════════════════════════════════════
  SBI: [
    {
      name: 'SBI SimplySAVE Credit Card',
      category: 'credit_card',
      short_description: '10X points on dining, movies, grocery and department stores',
      description: 'SBI SimplySAVE Credit Card rewards your everyday spending with 10X Reward Points on dining, movies, grocery, and department store purchases. One of SBI Cards most popular offerings for daily shoppers.',
      annual_fee: '₹499 (Waived on ₹1,00,000 annual spend)',
      features: ['10X Reward Points on dining, movies, grocery, and department stores', '1 Reward Point per ₹100 on all other spends', '1% fuel surcharge waiver', 'Up to 20% discount at partner restaurants', 'E-Gift vouchers on annual fee reversal'],
      benefits: '10X accelerated rewards on everyday categories. Dining discounts. Fuel savings. Flexible redemption against flights, merchandise, and vouchers.',
      eligibility: { min_age: 21, max_age: 60, min_income: 20000, employment: 'Salaried / Self-Employed' },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹20,000. CIBIL score 700+.',
      documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Last 3 months bank statement',
      fees_charges: 'Joining Fee: ₹499 | Annual Fee: ₹499 (waived on ₹1,00,000 spend) | Interest Rate: 3.35% per month (40.2% p.a.)',
      seo_title: 'SBI SimplySAVE Credit Card – 10X Rewards | GharKaPaisa',
      seo_description: 'Apply for SBI SimplySAVE Credit Card. Earn 10X rewards on dining, grocery, movies, and more.',
      seo_keywords: 'SBI SimplySAVE, SBI rewards card, SBI grocery card',
      min_age: 21, max_age: 60, min_income: 20000, display_order: 1, priority: 1,
    },
    {
      name: 'SBI SimplyCLICK Credit Card',
      category: 'credit_card',
      short_description: '10X points on Amazon, BookMyShow, Cleartrip, Lenskart',
      description: 'SBI SimplyCLICK Credit Card is designed for online shoppers. Earn 10X Reward Points on Amazon, Cleartrip, BookMyShow, Lenskart, and other partner merchants. Also earn 5X points on all other online spends.',
      annual_fee: '₹499 (Waived on ₹1,00,000 annual spend)',
      features: ['10X Reward Points on Amazon, BookMyShow, Cleartrip, and Lenskart', '5X Reward Points on all online spends', '1 Reward Point per ₹100 on offline spends', 'Welcome gift of Amazon voucher worth ₹500', '1% fuel surcharge waiver'],
      benefits: '10X rewards on top online merchants. Amazon welcome voucher. Milestone benefits. Flexible point redemption.',
      eligibility: { min_age: 21, max_age: 60, min_income: 20000, employment: 'Salaried / Self-Employed' },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹20,000. CIBIL score 700+.',
      documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Last 3 months bank statement',
      fees_charges: 'Joining Fee: ₹499 | Annual Fee: ₹499 (waived on ₹1,00,000 spend) | Interest Rate: 3.35% per month',
      seo_title: 'SBI SimplyCLICK Credit Card – Online Shopping Rewards | GharKaPaisa',
      seo_description: 'Apply for SBI SimplyCLICK Card. Get 10X rewards on Amazon, BookMyShow, and top online brands.',
      seo_keywords: 'SBI SimplyCLICK, SBI online shopping card, SBI Amazon card',
      min_age: 21, max_age: 60, min_income: 20000, display_order: 2, priority: 2,
    },
    {
      name: 'BPCL SBI Card OCTANE',
      category: 'co_branded_card',
      short_description: '7.25% value back on BPCL fuel purchases',
      description: 'BPCL SBI Card OCTANE is a premium fuel card offering 7.25% value back on BPCL fuel purchases plus 30X reward points on dining and movies. Ideal for high fuel spenders and frequent travelers.',
      annual_fee: '₹1,499 (Waived on ₹4,00,000 annual spend)',
      features: ['7.25% value back on BPCL fuel purchases', '30X Reward Points on dining and movies', '10X Reward Points on grocery and department stores', 'Complimentary domestic lounge access (4/year)', '1% fuel surcharge waiver at all fuel stations'],
      benefits: '7.25% fuel savings at BPCL. 30X dining rewards. Airport lounge access. Movie ticket discounts.',
      eligibility: { min_age: 21, max_age: 60, min_income: 30000, employment: 'Salaried / Self-Employed' },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹30,000. CIBIL score 720+.',
      documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Last 6 months bank statement',
      fees_charges: 'Joining Fee: ₹1,499 | Annual Fee: ₹1,499 (waived on ₹4,00,000 spend) | Interest Rate: 3.35% per month',
      seo_title: 'BPCL SBI Card OCTANE – Premium Fuel Card | GharKaPaisa',
      seo_description: 'Apply for BPCL SBI Card OCTANE. Save 7.25% on BPCL fuel with 30X dining rewards and lounge access.',
      seo_keywords: 'BPCL SBI OCTANE, SBI fuel card, BPCL fuel credit card',
      min_age: 21, max_age: 60, min_income: 30000, display_order: 3, priority: 3,
    },
    {
      name: 'BPCL SBI Credit Card',
      category: 'co_branded_card',
      short_description: '4.25% value back on fuel spends',
      description: 'BPCL SBI Credit Card offers 4.25% value back on BPCL fuel purchases along with 13X reward points on dining and movies. A cost-effective fuel rewards card for daily commuters.',
      annual_fee: '₹499 (Waived on ₹1,00,000 annual spend)',
      features: ['4.25% value back on BPCL fuel purchases', '13X Reward Points on dining and movies', '1% fuel surcharge waiver', 'Welcome gift of ₹500 fuel voucher', 'Milestone benefit of ₹500 voucher on ₹1 lakh spend'],
      benefits: '4.25% fuel savings at BPCL. Dining and movie rewards. Fuel surcharge waiver. Welcome and milestone vouchers.',
      eligibility: { min_age: 21, max_age: 60, min_income: 20000, employment: 'Salaried / Self-Employed' },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹20,000. CIBIL score 700+.',
      documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Last 3 months bank statement',
      fees_charges: 'Joining Fee: ₹499 | Annual Fee: ₹499 (waived on ₹1,00,000 spend) | Interest Rate: 3.35% per month',
      seo_title: 'BPCL SBI Credit Card – Fuel Rewards Card | GharKaPaisa',
      seo_description: 'Apply for BPCL SBI Card. Get 4.25% value back on BPCL fuel and 13X rewards on dining.',
      seo_keywords: 'BPCL SBI card, SBI fuel rewards card, BPCL fuel card',
      min_age: 21, max_age: 60, min_income: 20000, display_order: 4, priority: 4,
    },
    {
      name: 'SBI Card PULSE',
      category: 'credit_card',
      short_description: 'Stay fit with complimentary Noise smartwatch & health benefits',
      description: 'SBI Card PULSE is a health and fitness focused credit card. Get a complimentary Noise smartwatch on activation, earn accelerated rewards on fitness and wellness spends, and enjoy health insurance benefits.',
      annual_fee: '₹1,499 (Waived on ₹3,00,000 annual spend)',
      features: ['Complimentary Noise smartwatch on card activation', '10X Reward Points on health, fitness, and wellness spends', '5X Reward Points on all online spends', 'Complimentary health check-up packages', 'Airport lounge access (4/year)'],
      benefits: 'Free Noise smartwatch. 10X health and fitness rewards. Health check-up packages. Airport lounge access.',
      eligibility: { min_age: 21, max_age: 60, min_income: 30000, employment: 'Salaried / Self-Employed' },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹30,000. CIBIL score 720+.',
      documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Last 6 months bank statement',
      fees_charges: 'Joining Fee: ₹1,499 | Annual Fee: ₹1,499 (waived on ₹3,00,000 spend) | Interest Rate: 3.35% per month',
      seo_title: 'SBI Card PULSE – Health & Fitness Card | GharKaPaisa',
      seo_description: 'Apply for SBI Card PULSE. Get a free Noise smartwatch and 10X rewards on health and fitness.',
      seo_keywords: 'SBI PULSE card, SBI fitness card, SBI health credit card',
      min_age: 21, max_age: 60, min_income: 30000, display_order: 5, priority: 5,
    },
    {
      name: 'Tata Neu SBI Credit Card',
      category: 'co_branded_card',
      short_description: 'Co-branded shopping rewards on the Neu app',
      description: 'Tata Neu SBI Credit Card lets you earn NeuCoins on everyday purchases across the Tata ecosystem. Get up to 5% NeuCoins on Tata brands and 1% on all other spends.',
      annual_fee: '₹499 (Waived on ₹1,00,000 annual spend)',
      features: ['5% NeuCoins on Tata Neu partner brands', '1% NeuCoins on all other spends', 'NeuCoins redeemable 1:1 as ₹1', 'Welcome benefit of 500 NeuCoins', '1% fuel surcharge waiver'],
      benefits: '5% NeuCoins on Tata ecosystem. Welcome NeuCoins. Fuel savings. NeuCoins never expire with activity.',
      eligibility: { min_age: 21, max_age: 60, min_income: 20000, employment: 'Salaried / Self-Employed' },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹20,000. CIBIL score 700+.',
      documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Bank statement',
      fees_charges: 'Joining Fee: ₹499 | Annual Fee: ₹499 (waived on ₹1,00,000 spend) | Interest Rate: 3.35% per month',
      seo_title: 'Tata Neu SBI Credit Card – NeuCoins Rewards | GharKaPaisa',
      seo_description: 'Apply for Tata Neu SBI Card. Earn 5% NeuCoins on Tata brands and 1% on all spends.',
      seo_keywords: 'Tata Neu SBI card, SBI Tata card, NeuCoins SBI',
      min_age: 21, max_age: 60, min_income: 20000, display_order: 6, priority: 6,
    },
    {
      name: 'IRCTC SBI Card Premier',
      category: 'co_branded_card',
      short_description: 'Up to 10% value back on AC ticket bookings',
      description: 'IRCTC SBI Card Premier offers up to 10% value back on IRCTC AC ticket bookings, transaction fee waiver, and complimentary railway lounge access. The best card for frequent premium train travelers.',
      annual_fee: '₹1,499 (Waived on ₹2,00,000 annual spend)',
      features: ['Up to 10% value back on AC 1, 2, 3 bookings via IRCTC', 'IRCTC convenience fee waiver', 'Complimentary railway lounge access (8/year)', '5X reward points on dining', 'Welcome gift of 350 bonus reward points'],
      benefits: '10% value back on premium train tickets. IRCTC fee waiver. 8 railway lounge visits. Dining rewards.',
      eligibility: { min_age: 21, max_age: 60, min_income: 30000, employment: 'Salaried / Self-Employed' },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹30,000. CIBIL score 720+.',
      documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Last 6 months bank statement',
      fees_charges: 'Joining Fee: ₹1,499 | Annual Fee: ₹1,499 (waived on ₹2,00,000 spend) | Interest Rate: 3.35% per month',
      seo_title: 'IRCTC SBI Card Premier – Railway Rewards Card | GharKaPaisa',
      seo_description: 'Apply for IRCTC SBI Card Premier. Save 10% on AC train bookings with railway lounge access.',
      seo_keywords: 'IRCTC SBI Premier, SBI railway card, IRCTC premium card',
      min_age: 21, max_age: 60, min_income: 30000, display_order: 7, priority: 7,
    },
    {
      name: 'Apollo SBI Credit Card',
      category: 'co_branded_card',
      short_description: 'Accelerated points on Apollo pharmacy & healthcare',
      description: 'Apollo SBI Credit Card is a healthcare-focused card offering accelerated reward points at Apollo Hospitals, Apollo Pharmacy, and Apollo 24|7 app. Includes complimentary health check-ups and telemedicine consultations.',
      annual_fee: '₹499 (Waived on ₹1,00,000 annual spend)',
      features: ['5X Reward Points on Apollo Pharmacy and Apollo 24|7 purchases', '2X Reward Points on all online medical spends', 'Complimentary annual health check-up worth ₹1,000', 'Free telemedicine consultations (4/year)', '1% fuel surcharge waiver'],
      benefits: '5X healthcare rewards. Annual health check-up. Telemedicine consultations. Apollo Circle membership benefits.',
      eligibility: { min_age: 21, max_age: 60, min_income: 20000, employment: 'Salaried / Self-Employed' },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹20,000. CIBIL score 700+.',
      documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Bank statement',
      fees_charges: 'Joining Fee: ₹499 | Annual Fee: ₹499 (waived on ₹1,00,000 spend) | Interest Rate: 3.35% per month',
      seo_title: 'Apollo SBI Credit Card – Healthcare Rewards | GharKaPaisa',
      seo_description: 'Apply for Apollo SBI Card. Earn 5X rewards at Apollo with free health check-ups and telemedicine.',
      seo_keywords: 'Apollo SBI card, SBI healthcare card, Apollo pharmacy card',
      min_age: 21, max_age: 60, min_income: 20000, display_order: 8, priority: 8,
    },
    {
      name: 'Air India SBI Signature Credit Card',
      category: 'co_branded_card',
      short_description: 'Earn Air India flying returns miles on every spend',
      description: 'Air India SBI Signature Credit Card earns Flying Returns miles on every purchase. Get complimentary lounge access, priority check-in, and free excess baggage allowance on Air India flights.',
      annual_fee: '₹4,999 (Waived on ₹5,00,000 annual spend)',
      features: ['4 Air India Flying Returns miles per ₹100 on Air India spends', '2 miles per ₹100 on all other spends', 'Complimentary domestic and international lounge access', 'Priority check-in and boarding on Air India', 'Free excess baggage of 15 kg on Air India'],
      benefits: 'Flying Returns miles earning. Priority Air India privileges. Lounge access. Excess baggage allowance. Trident Privilege membership.',
      eligibility: { min_age: 21, max_age: 60, min_income: 50000, employment: 'Salaried / Self-Employed' },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹50,000. CIBIL score 750+.',
      documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Last 6 months bank statement, Form 16 / ITR',
      fees_charges: 'Joining Fee: ₹4,999 | Annual Fee: ₹4,999 (waived on ₹5,00,000 spend) | Interest Rate: 3.35% per month',
      seo_title: 'Air India SBI Signature Credit Card – Miles Card | GharKaPaisa',
      seo_description: 'Apply for Air India SBI Signature Card. Earn Flying Returns miles, lounge access, and priority Air India privileges.',
      seo_keywords: 'Air India SBI card, SBI miles card, Flying Returns credit card',
      min_age: 21, max_age: 60, min_income: 50000, display_order: 9, priority: 9,
    },
    {
      name: 'Air India SBI Platinum Credit Card',
      category: 'co_branded_card',
      short_description: 'Save on domestic and international air travel',
      description: 'Air India SBI Platinum Credit Card is an affordable way to earn Flying Returns miles. Get miles on everyday transactions, enjoy discounts on Air India tickets, and earn accelerated miles on travel bookings.',
      annual_fee: '₹1,499 (Waived on ₹2,00,000 annual spend)',
      features: ['3 Flying Returns miles per ₹100 on Air India spends', '1 mile per ₹100 on all other spends', 'Welcome bonus of 2,000 Flying Returns miles', 'Discount on Air India ticket bookings', '1% fuel surcharge waiver'],
      benefits: 'Flying Returns miles. Welcome bonus miles. Air India ticket discounts. Fuel surcharge waiver.',
      eligibility: { min_age: 21, max_age: 60, min_income: 30000, employment: 'Salaried / Self-Employed' },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹30,000. CIBIL score 700+.',
      documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Bank statement',
      fees_charges: 'Joining Fee: ₹1,499 | Annual Fee: ₹1,499 (waived on ₹2,00,000 spend) | Interest Rate: 3.35% per month',
      seo_title: 'Air India SBI Platinum Credit Card | GharKaPaisa',
      seo_description: 'Apply for Air India SBI Platinum Card. Earn Flying Returns miles on every spend.',
      seo_keywords: 'Air India SBI Platinum, SBI travel card, Air India miles card',
      min_age: 21, max_age: 60, min_income: 30000, display_order: 10, priority: 10,
    },
    {
      name: 'Club Vistara SBI Prime Credit Card',
      category: 'co_branded_card',
      short_description: 'Complimentary premium economy tickets on Vistara',
      description: 'Club Vistara SBI Prime Credit Card offers complimentary premium economy tickets on Vistara airlines, accelerated CV Points, and Club Vistara Silver membership. Perfect for frequent Vistara flyers.',
      annual_fee: '₹2,999 (Waived on ₹3,00,000 annual spend)',
      features: ['1 complimentary premium economy ticket on ₹2 lakh spend', 'Club Vistara Silver membership', '6 CV Points per ₹100 on Vistara bookings', '2 CV Points per ₹100 on all other spends', 'Complimentary lounge access (4/year)'],
      benefits: 'Free premium economy flight. Club Vistara Silver membership. Accelerated CV Points. Airport lounge access.',
      eligibility: { min_age: 21, max_age: 60, min_income: 50000, employment: 'Salaried / Self-Employed' },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹50,000. CIBIL score 720+.',
      documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Last 6 months bank statement',
      fees_charges: 'Joining Fee: ₹2,999 | Annual Fee: ₹2,999 (waived on ₹3,00,000 spend) | Interest Rate: 3.35% per month',
      seo_title: 'Club Vistara SBI Prime Credit Card | GharKaPaisa',
      seo_description: 'Apply for Club Vistara SBI Prime Card. Get free premium economy flights and Club Vistara membership.',
      seo_keywords: 'Club Vistara SBI Prime, SBI Vistara card, Vistara credit card',
      min_age: 21, max_age: 60, min_income: 50000, display_order: 11, priority: 11,
    },
    {
      name: 'Club Vistara SBI Credit Card',
      category: 'co_branded_card',
      short_description: 'Complimentary tickets and Club Vistara membership',
      description: 'Club Vistara SBI Credit Card offers complimentary economy tickets on Vistara, Club Vistara membership, and CV Points earning on everyday transactions.',
      annual_fee: '₹1,499 (Waived on ₹1,50,000 annual spend)',
      features: ['1 complimentary economy ticket on ₹1.5 lakh spend', 'Club Vistara membership', '4 CV Points per ₹100 on Vistara bookings', '1 CV Point per ₹100 on all other spends', '1% fuel surcharge waiver'],
      benefits: 'Free economy flight. Club Vistara membership. CV Points on all spends. Fuel savings.',
      eligibility: { min_age: 21, max_age: 60, min_income: 25000, employment: 'Salaried / Self-Employed' },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹25,000. CIBIL score 700+.',
      documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Bank statement',
      fees_charges: 'Joining Fee: ₹1,499 | Annual Fee: ₹1,499 (waived on ₹1,50,000 spend) | Interest Rate: 3.35% per month',
      seo_title: 'Club Vistara SBI Credit Card | GharKaPaisa',
      seo_description: 'Apply for Club Vistara SBI Card. Get free economy flights and Club Vistara membership.',
      seo_keywords: 'Club Vistara SBI, SBI Vistara economy card, Vistara card',
      min_age: 21, max_age: 60, min_income: 25000, display_order: 12, priority: 12,
    },
  ],

  // ═══════════════════════════════════════════════════════════════
  // 3. AXIS BANK — 12 Cards
  // ═══════════════════════════════════════════════════════════════
  AXIS: [
    {
      name: 'Axis Bank Neo Credit Card', category: 'credit_card', short_description: 'Zomato, BookMyShow and utility bill discounts', annual_fee: 'Lifetime Free', featured: true,
      description: 'Axis Bank Neo Credit Card offers accelerated rewards on food delivery, movie tickets, and utility payments. With zero annual fee for life, it is one of the best entry-level credit cards available.',
      features: ['Zomato and Swiggy cashback up to ₹100/month', 'BookMyShow BOGO on movie tickets', '5% cashback on utility bill payments', 'Zero joining fee and annual fee (Lifetime Free)', 'Contactless payments enabled'],
      benefits: 'Food delivery cashback. Free movie tickets. Utility bill savings. Zero annual fee forever.',
      eligibility: { min_age: 21, max_age: 60, min_income: 15000, employment: 'Salaried / Self-Employed' },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹15,000. CIBIL score 700+.',
      documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Bank statement',
      fees_charges: 'Joining Fee: Nil | Annual Fee: Nil (Lifetime Free) | Interest Rate: 3.4% per month (40.8% p.a.)',
      seo_title: 'Axis Bank Neo Credit Card – Lifetime Free | GharKaPaisa', seo_description: 'Apply for Axis Bank Neo Card. Lifetime free with Zomato cashback and BookMyShow BOGO.', seo_keywords: 'Axis Neo card, Axis lifetime free card, Axis Zomato card',
      min_age: 21, max_age: 60, min_income: 15000, display_order: 1, priority: 1,
    },
    {
      name: 'Axis Bank ACE Credit Card', category: 'credit_card', short_description: '2% unlimited cashback on Google Pay spends', annual_fee: '₹499 (Waived on ₹2,00,000 annual spend)',
      description: 'Axis Bank ACE Credit Card offers 2% unlimited cashback on Google Pay transactions, 5% cashback on bill payments, and 1% on all other spends. No cap on cashback earnings.',
      features: ['2% cashback on Google Pay transactions (no cap)', '5% cashback on bill payments via Google Pay', '1% cashback on all other spends', '4 complimentary domestic lounge visits/year', '1% fuel surcharge waiver'],
      benefits: 'Unlimited cashback on Google Pay. Bill payment rewards. Lounge access. Fuel savings.',
      eligibility: { min_age: 21, max_age: 60, min_income: 25000, employment: 'Salaried / Self-Employed' },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹25,000. CIBIL score 700+.',
      documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Bank statement',
      fees_charges: 'Joining Fee: ₹499 | Annual Fee: ₹499 (waived on ₹2,00,000 spend) | Interest Rate: 3.4% per month',
      seo_title: 'Axis Bank ACE Credit Card – 2% Google Pay Cashback | GharKaPaisa', seo_description: 'Apply for Axis ACE Card. Get 2% unlimited cashback on Google Pay and 5% on bills.', seo_keywords: 'Axis ACE card, Axis Google Pay card, Axis cashback card',
      min_age: 21, max_age: 60, min_income: 25000, display_order: 2, priority: 2,
    },
    {
      name: 'Axis Bank MY Zone Credit Card', category: 'credit_card', short_description: 'Buy 1 Get 1 Free on movie tickets', annual_fee: 'Lifetime Free', featured: true,
      description: 'Axis Bank MY Zone Credit Card is a lifestyle card offering Buy 1 Get 1 Free on BookMyShow movie tickets. Lifetime free with rewards on dining and shopping.',
      features: ['Buy 1 Get 1 Free on BookMyShow (up to 3 times/month)', '5X eDGE reward points on dining and entertainment', '2X eDGE reward points on all spends', 'Zero annual fee (Lifetime Free)', 'Welcome voucher worth ₹250'],
      benefits: 'BOGO movie tickets. Dining and entertainment rewards. Welcome voucher. Zero annual fee.',
      eligibility: { min_age: 21, max_age: 60, min_income: 15000, employment: 'Salaried / Self-Employed' },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹15,000. CIBIL score 700+.',
      documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Bank statement',
      fees_charges: 'Joining Fee: Nil | Annual Fee: Nil (Lifetime Free) | Interest Rate: 3.4% per month',
      seo_title: 'Axis Bank MY Zone Credit Card – Free Movies | GharKaPaisa', seo_description: 'Apply for Axis MY Zone Card. Buy 1 Get 1 Free on movies with lifetime zero fee.', seo_keywords: 'Axis MY Zone, Axis movie card, Axis free card',
      min_age: 21, max_age: 60, min_income: 15000, display_order: 3, priority: 3,
    },
    {
      name: 'Axis Bank Rewards Credit Card', category: 'credit_card', short_description: '10X reward points on department stores and apparel', annual_fee: '₹1,000 (Waived on ₹2,50,000 annual spend)',
      description: 'Axis Bank Rewards Credit Card offers 10X eDGE reward points on department stores, apparel, and dining. A solid mid-tier rewards card for shopping enthusiasts.',
      features: ['10X eDGE reward points on department stores and apparel', '5X eDGE reward points on dining', '1 eDGE reward point per ₹100 on other spends', 'Welcome bonus of 500 eDGE points', '4 domestic lounge visits/year'],
      benefits: '10X rewards on fashion shopping. Dining rewards. Welcome bonus. Lounge access.',
      eligibility: { min_age: 21, max_age: 60, min_income: 25000, employment: 'Salaried / Self-Employed' },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹25,000. CIBIL score 720+.',
      documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Last 6 months bank statement',
      fees_charges: 'Joining Fee: ₹1,000 | Annual Fee: ₹1,000 (waived on ₹2,50,000 spend) | Interest Rate: 3.4% per month',
      seo_title: 'Axis Bank Rewards Credit Card – 10X Shopping Points | GharKaPaisa', seo_description: 'Apply for Axis Rewards Card. Earn 10X points on department stores and apparel.', seo_keywords: 'Axis Rewards card, Axis shopping card, Axis 10X points',
      min_age: 21, max_age: 60, min_income: 25000, display_order: 4, priority: 4,
    },
    {
      name: 'Axis Bank Flipkart Credit Card', category: 'co_branded_card', short_description: '5% unlimited cashback on Flipkart purchases', annual_fee: '₹500 (Waived on ₹2,00,000 annual spend)',
      description: 'Axis Bank Flipkart Credit Card gives 5% unlimited cashback on Flipkart, Myntra, and Cleartrip. Plus 4% on preferred merchants and 1.5% on all other spends.',
      features: ['5% unlimited cashback on Flipkart, Myntra, and Cleartrip', '4% cashback on preferred merchants (Swiggy, PVR, Uber)', '1.5% cashback on all other spends', 'Welcome voucher of ₹500', '4 complimentary lounge visits/year'],
      benefits: '5% Flipkart cashback. 4% on lifestyle brands. 1.5% on everything else. Lounge access.',
      eligibility: { min_age: 21, max_age: 60, min_income: 20000, employment: 'Salaried / Self-Employed' },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹20,000. CIBIL score 700+.',
      documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Bank statement',
      fees_charges: 'Joining Fee: ₹500 | Annual Fee: ₹500 (waived on ₹2,00,000 spend) | Interest Rate: 3.4% per month',
      seo_title: 'Axis Bank Flipkart Credit Card – 5% Cashback | GharKaPaisa', seo_description: 'Apply for Axis Flipkart Card. Get 5% unlimited cashback on Flipkart and Myntra.', seo_keywords: 'Axis Flipkart card, Flipkart credit card, Axis online shopping card',
      min_age: 21, max_age: 60, min_income: 20000, display_order: 5, priority: 5,
    },
    {
      name: 'Axis Bank IndianOil Credit Card', category: 'co_branded_card', short_description: 'Accelerated reward points on fuel purchases', annual_fee: '₹500 (Waived on ₹50,000 annual spend)',
      description: 'Axis Bank IndianOil Credit Card offers accelerated rewards on fuel and everyday shopping. Earn extra points on IndianOil fuel purchases and save with fuel surcharge waiver.',
      features: ['4% value back on IndianOil fuel purchases', '20X eDGE reward points on IndianOil spends', '5X eDGE reward points on grocery and dining', '1% fuel surcharge waiver at all stations', 'Welcome benefit of 250 eDGE points'],
      benefits: '4% fuel savings. 20X IndianOil rewards. Grocery and dining bonus. Fuel surcharge waiver.',
      eligibility: { min_age: 21, max_age: 60, min_income: 15000, employment: 'Salaried / Self-Employed' },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹15,000. CIBIL score 700+.',
      documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Bank statement',
      fees_charges: 'Joining Fee: ₹500 | Annual Fee: ₹500 (waived on ₹50,000 spend) | Interest Rate: 3.4% per month',
      seo_title: 'Axis Bank IndianOil Credit Card – Fuel Rewards | GharKaPaisa', seo_description: 'Apply for Axis IndianOil Card. Get 4% value back on fuel and 20X rewards at IndianOil.', seo_keywords: 'Axis IndianOil card, Axis fuel card, IndianOil credit card',
      min_age: 21, max_age: 60, min_income: 15000, display_order: 6, priority: 6,
    },
    {
      name: 'Axis Bank Atlas Credit Card', category: 'credit_card', short_description: 'Miles-focused premium card for frequent flyers', annual_fee: '₹5,000 (Waived on ₹7,50,000 annual spend)',
      description: 'Axis Bank Atlas Credit Card is a miles-centric premium card. Earn EDGE MILES on every transaction, redeemable for flights on any airline with no blackout dates.',
      features: ['5 EDGE MILES per ₹100 on travel spends', '2 EDGE MILES per ₹100 on all other spends', 'Complimentary Priority Pass with 8 international visits', '8 complimentary domestic lounge visits', 'Milestone bonus of 5,000 MILES on ₹5 lakh spend'],
      benefits: 'EDGE MILES on any airline. Priority Pass. Milestone bonus. Zero forex markup on select currencies.',
      eligibility: { min_age: 21, max_age: 60, min_income: 75000, employment: 'Salaried / Self-Employed' },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹75,000. CIBIL score 750+.',
      documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Last 6 months bank statement, Form 16 / ITR',
      fees_charges: 'Joining Fee: ₹5,000 | Annual Fee: ₹5,000 (waived on ₹7,50,000 spend) | Interest Rate: 3.4% per month',
      seo_title: 'Axis Bank Atlas Credit Card – Miles Premium Card | GharKaPaisa', seo_description: 'Apply for Axis Atlas Card. Earn EDGE MILES on every spend with Priority Pass lounge access.', seo_keywords: 'Axis Atlas card, Axis miles card, Axis premium travel card',
      min_age: 21, max_age: 60, min_income: 75000, display_order: 7, priority: 7,
    },
    {
      name: 'Axis Bank Select Credit Card', category: 'credit_card', short_description: 'Elite lifestyle rewards with priority pass lounge access', annual_fee: '₹3,000 (Waived on ₹5,00,000 annual spend)',
      description: 'Axis Bank Select Credit Card offers elite lifestyle privileges including Priority Pass lounge access, golf sessions, and accelerated rewards on travel and dining.',
      features: ['Complimentary Priority Pass with 4 international visits', '8 domestic lounge visits/year', '10X eDGE reward points on travel bookings', '5X eDGE reward points on dining', 'Complimentary golf sessions (4/year)'],
      benefits: 'Priority Pass. Golf sessions. 10X travel rewards. Premium concierge services.',
      eligibility: { min_age: 21, max_age: 60, min_income: 50000, employment: 'Salaried / Self-Employed' },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹50,000. CIBIL score 750+.',
      documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Last 6 months bank statement',
      fees_charges: 'Joining Fee: ₹3,000 | Annual Fee: ₹3,000 (waived on ₹5,00,000 spend) | Interest Rate: 3.4% per month',
      seo_title: 'Axis Bank Select Credit Card – Elite Lifestyle Card | GharKaPaisa', seo_description: 'Apply for Axis Select Card. Get Priority Pass, golf sessions, and 10X travel rewards.', seo_keywords: 'Axis Select card, Axis premium card, Axis Priority Pass card',
      min_age: 21, max_age: 60, min_income: 50000, display_order: 8, priority: 8,
    },
    {
      name: 'Axis Bank Privilege Credit Card', category: 'credit_card', short_description: 'Double activation benefits and milestone rewards', annual_fee: '₹1,500 (Waived on ₹2,50,000 annual spend)',
      description: 'Axis Bank Privilege Credit Card offers double activation benefits, milestone reward points, and a good balance of travel and lifestyle privileges.',
      features: ['Double activation benefits worth ₹1,000', '5X eDGE reward points on travel and dining', '4 complimentary domestic lounge visits/year', 'Milestone bonus of 3,000 eDGE points on ₹3 lakh spend', '1% fuel surcharge waiver'],
      benefits: 'Double activation benefits. Milestone rewards. Lounge access. Travel and dining rewards.',
      eligibility: { min_age: 21, max_age: 60, min_income: 30000, employment: 'Salaried / Self-Employed' },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹30,000. CIBIL score 720+.',
      documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Last 6 months bank statement',
      fees_charges: 'Joining Fee: ₹1,500 | Annual Fee: ₹1,500 (waived on ₹2,50,000 spend) | Interest Rate: 3.4% per month',
      seo_title: 'Axis Bank Privilege Credit Card | GharKaPaisa', seo_description: 'Apply for Axis Privilege Card. Get double activation benefits and 5X travel rewards.', seo_keywords: 'Axis Privilege card, Axis mid-tier card',
      min_age: 21, max_age: 60, min_income: 30000, display_order: 9, priority: 9,
    },
    {
      name: 'Axis Bank Vistara Credit Card', category: 'co_branded_card', short_description: 'Complimentary economy flight tickets', annual_fee: '₹1,500 (Waived on ₹2,00,000 annual spend)',
      description: 'Axis Bank Vistara Credit Card offers complimentary economy flight tickets and Club Vistara membership for frequent Vistara travelers.',
      features: ['1 complimentary economy ticket on ₹1.5 lakh spend', 'Club Vistara Silver membership', '4 CV Points per ₹100 on Vistara bookings', '1 CV Point per ₹100 on other spends', '4 domestic lounge visits/year'],
      benefits: 'Free economy flights. Club Vistara membership. CV Points earning. Airport lounge access.',
      eligibility: { min_age: 21, max_age: 60, min_income: 30000, employment: 'Salaried / Self-Employed' },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹30,000. CIBIL score 700+.',
      documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Bank statement',
      fees_charges: 'Joining Fee: ₹1,500 | Annual Fee: ₹1,500 (waived on ₹2,00,000 spend) | Interest Rate: 3.4% per month',
      seo_title: 'Axis Bank Vistara Credit Card | GharKaPaisa', seo_description: 'Apply for Axis Vistara Card. Get free economy flights and Club Vistara membership.', seo_keywords: 'Axis Vistara card, Axis airline card, Vistara credit card',
      min_age: 21, max_age: 60, min_income: 30000, display_order: 10, priority: 10,
    },
    {
      name: 'Axis Bank Vistara Infinite Credit Card', category: 'co_branded_card', short_description: 'Complimentary business class ticket and gold membership', annual_fee: '₹10,000 (Waived on ₹10,00,000 annual spend)',
      description: 'Axis Bank Vistara Infinite Credit Card is a super-premium card offering complimentary business class tickets, Club Vistara Gold membership, and unlimited lounge access.',
      features: ['1 complimentary business class ticket on ₹7.5 lakh spend', 'Club Vistara Gold membership', '12 CV Points per ₹100 on Vistara bookings', '4 CV Points per ₹100 on other spends', 'Unlimited domestic and international lounge access'],
      benefits: 'Free business class flights. Club Vistara Gold. Unlimited lounges. Premium concierge.',
      eligibility: { min_age: 21, max_age: 60, min_income: 150000, employment: 'Salaried / Self-Employed' },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹1,50,000. CIBIL score 750+.',
      documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Last 6 months bank statement, Form 16 / ITR',
      fees_charges: 'Joining Fee: ₹10,000 | Annual Fee: ₹10,000 (waived on ₹10,00,000 spend) | Interest Rate: 3.4% per month',
      seo_title: 'Axis Bank Vistara Infinite – Business Class Card | GharKaPaisa', seo_description: 'Apply for Axis Vistara Infinite. Free business class flights, Gold membership, and unlimited lounges.', seo_keywords: 'Axis Vistara Infinite, Axis business class card, Axis super premium card',
      min_age: 21, max_age: 60, min_income: 150000, display_order: 11, priority: 11,
    },
    {
      name: 'Axis Bank Aura Credit Card', category: 'credit_card', short_description: 'Health and wellness focused credit card', annual_fee: '₹734 (inclusive of GST)',
      description: 'Axis Bank Aura Credit Card focuses on health and wellness benefits including complimentary health check-ups, pharmacy discounts, and OPD cover. Offers eDGE reward points on all transactions.',
      features: ['Complimentary health check-up worth ₹1,499', 'OPD cover of ₹5,000 via Medibuddy', '10% discount at partner pharmacies', '5X eDGE reward points on health and wellness', 'Complimentary personal accident cover of ₹2 lakh'],
      benefits: 'Health check-up included. OPD cover. Pharmacy discounts. Personal accident insurance.',
      eligibility: { min_age: 21, max_age: 60, min_income: 15000, employment: 'Salaried / Self-Employed' },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹15,000. CIBIL score 700+.',
      documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Bank statement',
      fees_charges: 'Joining Fee: ₹734 | Annual Fee: ₹734 | Interest Rate: 3.4% per month',
      seo_title: 'Axis Bank Aura Credit Card – Health & Wellness | GharKaPaisa', seo_description: 'Apply for Axis Aura Card. Get free health check-ups, OPD cover, and pharmacy discounts.', seo_keywords: 'Axis Aura card, Axis health card, Axis wellness card',
      min_age: 21, max_age: 60, min_income: 15000, display_order: 12, priority: 12,
    },
  ],

  // ═══════════════════════════════════════════════════════════════
  // 4. ICICI BANK — 7 Cards
  // ═══════════════════════════════════════════════════════════════
  ICICI: [
    {
      name: 'ICICI Platinum Chip Credit Card', category: 'credit_card', short_description: 'Classic lifetime free shopping card with rewards', annual_fee: 'Lifetime Free', featured: true,
      description: 'ICICI Platinum Chip Credit Card is a lifetime free card with chip-based security, reward points on shopping, and fuel surcharge waiver. Ideal for first-time cardholders.',
      features: ['Zero joining fee and zero annual fee (Lifetime Free)', '2 PAYBACK points per ₹100 on all spends', '1% fuel surcharge waiver', 'EMI conversion on purchases above ₹2,500', 'Zero lost card liability'],
      benefits: 'Lifetime free. PAYBACK points. Fuel savings. EMI facility. Secure chip technology.',
      eligibility: { min_age: 21, max_age: 60, min_income: 15000, employment: 'Salaried / Self-Employed' },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹15,000. CIBIL score 700+.',
      documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Bank statement',
      fees_charges: 'Joining Fee: Nil | Annual Fee: Nil (Lifetime Free) | Interest Rate: 3.4% per month (40.8% p.a.)',
      seo_title: 'ICICI Platinum Chip Credit Card – Lifetime Free | GharKaPaisa', seo_description: 'Apply for ICICI Platinum Chip Card. Lifetime free with reward points and fuel surcharge waiver.', seo_keywords: 'ICICI Platinum Chip, ICICI free card, ICICI basic card',
      min_age: 21, max_age: 60, min_income: 15000, display_order: 1, priority: 1,
    },
    {
      name: 'ICICI Coral Credit Card', category: 'credit_card', short_description: 'BookMyShow discounts, dining rewards and lounge access', annual_fee: '₹500 (Waived on ₹1,50,000 annual spend)',
      description: 'ICICI Coral Credit Card offers Buy 1 Get 1 on BookMyShow, dining privileges, and complimentary lounge access. A well-rounded mid-tier lifestyle card.',
      features: ['Buy 1 Get 1 Free on BookMyShow movie tickets (2 per month)', '4 PAYBACK points per ₹100 on dining and entertainment', '2 complimentary domestic lounge visits/year', '1% fuel surcharge waiver', 'Welcome voucher of ₹500'],
      benefits: 'BOGO movie tickets. Dining rewards. Lounge access. Welcome voucher. Fuel savings.',
      eligibility: { min_age: 21, max_age: 60, min_income: 25000, employment: 'Salaried / Self-Employed' },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹25,000. CIBIL score 720+.',
      documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Last 6 months bank statement',
      fees_charges: 'Joining Fee: ₹500 | Annual Fee: ₹500 (waived on ₹1,50,000 spend) | Interest Rate: 3.4% per month',
      seo_title: 'ICICI Coral Credit Card – Movie & Dining Card | GharKaPaisa', seo_description: 'Apply for ICICI Coral Card. BOGO movie tickets, dining rewards, and lounge access.', seo_keywords: 'ICICI Coral card, ICICI movie card, ICICI dining card',
      min_age: 21, max_age: 60, min_income: 25000, display_order: 2, priority: 2,
    },
    {
      name: 'ICICI Rubyx Credit Card', category: 'credit_card', short_description: 'Dual engine credit card with premium privileges', annual_fee: '₹3,000 (Waived on ₹5,00,000 annual spend)',
      description: 'ICICI Rubyx Credit Card is a premium dual-engine card offering boosted rewards on travel and dining, complimentary lounge access, and golf privileges.',
      features: ['6 PAYBACK points per ₹100 on travel and dining', '2 PAYBACK points per ₹100 on all other spends', 'Complimentary Priority Pass with 2 international visits', '4 domestic lounge visits/year', 'Golf privileges (2 sessions/quarter)'],
      benefits: '6X travel and dining rewards. Priority Pass. Golf sessions. Premium customer service.',
      eligibility: { min_age: 21, max_age: 60, min_income: 50000, employment: 'Salaried / Self-Employed' },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹50,000. CIBIL score 750+.',
      documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Last 6 months bank statement, Form 16',
      fees_charges: 'Joining Fee: ₹3,000 | Annual Fee: ₹3,000 (waived on ₹5,00,000 spend) | Interest Rate: 3.4% per month',
      seo_title: 'ICICI Rubyx Credit Card – Premium Dual Engine Card | GharKaPaisa', seo_description: 'Apply for ICICI Rubyx Card. Get 6X travel rewards, Priority Pass, and golf privileges.', seo_keywords: 'ICICI Rubyx card, ICICI premium card, ICICI travel card',
      min_age: 21, max_age: 60, min_income: 50000, display_order: 3, priority: 3,
    },
    {
      name: 'ICICI Sapphiro Credit Card', category: 'credit_card', short_description: 'Super premium lifestyle and travel benefits', annual_fee: '₹6,500 (Waived on ₹8,00,000 annual spend)',
      description: 'ICICI Sapphiro Credit Card is a super premium card offering unmatched travel benefits, unlimited lounge access, and the highest reward earn rates in the ICICI portfolio.',
      features: ['10 PAYBACK points per ₹100 on travel bookings', '4 PAYBACK points per ₹100 on all other spends', 'Unlimited domestic and international lounge access', 'Complimentary Marriott Gold Elite membership', 'Comprehensive travel insurance of ₹1 Crore'],
      benefits: '10X travel rewards. Unlimited lounges. Marriott Gold Elite. ₹1 Crore insurance. Zero forex on select currencies.',
      eligibility: { min_age: 21, max_age: 60, min_income: 100000, employment: 'Salaried / Self-Employed' },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹1,00,000. CIBIL score 750+.',
      documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Last 6 months bank statement, Form 16 / ITR',
      fees_charges: 'Joining Fee: ₹6,500 | Annual Fee: ₹6,500 (waived on ₹8,00,000 spend) | Interest Rate: 3.4% per month | Foreign Currency Fee: Nil',
      seo_title: 'ICICI Sapphiro Credit Card – Super Premium | GharKaPaisa', seo_description: 'Apply for ICICI Sapphiro Card. Unlimited lounge access, 10X travel rewards, and Marriott Gold.', seo_keywords: 'ICICI Sapphiro, ICICI super premium, ICICI unlimited lounge card',
      min_age: 21, max_age: 60, min_income: 100000, display_order: 4, priority: 4,
    },
    {
      name: 'Amazon Pay ICICI Bank Credit Card', category: 'co_branded_card', short_description: 'Unlimited cashback for Amazon Prime members', annual_fee: 'Lifetime Free', featured: true,
      description: 'Amazon Pay ICICI Bank Credit Card offers unlimited 5% cashback for Prime members on Amazon purchases, 2% at Amazon partner merchants, and 1% on all other spends. Zero fee forever.',
      features: ['5% cashback on Amazon for Prime members (3% non-Prime)', '2% cashback at Amazon Pay partner merchants', '1% cashback on all other spends', 'Zero joining fee and zero annual fee (Lifetime Free)', 'Instant approval and virtual card issuance'],
      benefits: '5% Amazon cashback. Partner merchant rewards. Lifetime free. Instant approval.',
      eligibility: { min_age: 21, max_age: 60, min_income: 15000, employment: 'Salaried / Self-Employed' },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹15,000. CIBIL score 700+.',
      documents_required: 'PAN Card, Aadhaar Card, Amazon account',
      fees_charges: 'Joining Fee: Nil | Annual Fee: Nil (Lifetime Free) | Interest Rate: 3.4% per month',
      seo_title: 'Amazon Pay ICICI Credit Card – 5% Cashback | GharKaPaisa', seo_description: 'Apply for Amazon Pay ICICI Card. Get 5% unlimited cashback on Amazon with lifetime zero fee.', seo_keywords: 'Amazon ICICI card, Amazon cashback card, Amazon credit card India',
      min_age: 21, max_age: 60, min_income: 15000, display_order: 5, priority: 5,
    },
    {
      name: 'ICICI Coral RuPay Credit Card', category: 'co_branded_card', short_description: 'UPI merchant payments with movie & dining rewards', annual_fee: 'Lifetime Free', featured: true,
      description: 'ICICI Coral RuPay Credit Card enables UPI credit card payments at merchants. Earn reward points on dining and movies with zero annual fee.',
      features: ['Pay via UPI at any merchant (RuPay network)', 'Buy 1 Get 1 on BookMyShow (2 per month)', '4 PAYBACK points per ₹100 on dining', 'Zero annual fee (Lifetime Free)', '1% fuel surcharge waiver'],
      benefits: 'UPI credit card payments. BOGO movie tickets. Dining rewards. Fuel savings.',
      eligibility: { min_age: 21, max_age: 60, min_income: 15000, employment: 'Salaried / Self-Employed' },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹15,000. CIBIL score 700+.',
      documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Bank statement',
      fees_charges: 'Joining Fee: Nil | Annual Fee: Nil (Lifetime Free) | Interest Rate: 3.4% per month',
      seo_title: 'ICICI Coral RuPay Credit Card – UPI Card | GharKaPaisa', seo_description: 'Apply for ICICI Coral RuPay Card. UPI payments, BOGO movies, and lifetime free.', seo_keywords: 'ICICI Coral RuPay, ICICI UPI card, RuPay credit card',
      min_age: 21, max_age: 60, min_income: 15000, display_order: 6, priority: 6,
    },
    {
      name: 'ICICI MakeMyTrip Signature Credit Card', category: 'co_branded_card', short_description: 'MakeMyTrip holiday vouchers and travel privileges', annual_fee: '₹2,500 (Waived on ₹3,00,000 annual spend)',
      description: 'ICICI MakeMyTrip Signature Credit Card offers MyCash rewards on travel bookings, complimentary MakeMyTrip vouchers, and airport lounge access for frequent travelers.',
      features: ['Up to 10% MyCash on MakeMyTrip bookings', 'Welcome MakeMyTrip voucher worth ₹5,000', '4 domestic lounge visits/year', '2 PAYBACK points per ₹100 on all spends', '1% fuel surcharge waiver'],
      benefits: '10% MakeMyTrip MyCash. ₹5,000 welcome voucher. Lounge access. Travel rewards.',
      eligibility: { min_age: 21, max_age: 60, min_income: 40000, employment: 'Salaried / Self-Employed' },
      eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹40,000. CIBIL score 720+.',
      documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Last 6 months bank statement',
      fees_charges: 'Joining Fee: ₹2,500 | Annual Fee: ₹2,500 (waived on ₹3,00,000 spend) | Interest Rate: 3.4% per month',
      seo_title: 'ICICI MakeMyTrip Signature Card – Travel Rewards | GharKaPaisa', seo_description: 'Apply for ICICI MMT Card. Get ₹5,000 MakeMyTrip voucher and 10% MyCash on bookings.', seo_keywords: 'ICICI MakeMyTrip card, ICICI travel card, MMT credit card',
      min_age: 21, max_age: 60, min_income: 40000, display_order: 7, priority: 7,
    },
  ],

  // ═══════════════════════════════════════════════════════════════
  // 5. KOTAK MAHINDRA BANK — 6 Cards
  // ═══════════════════════════════════════════════════════════════
  KOTAK: [
    { name: 'Kotak League Platinum Credit Card', category: 'credit_card', short_description: 'Premium rewards and milestone benefits with zero annual fee', annual_fee: 'Lifetime Free', featured: true, description: 'Kotak League Platinum Card is a lifetime free card offering milestone rewards, lounge access, and everyday shopping benefits.', features: ['Lifetime free – zero joining and annual fee', '4 reward points per ₹150 on all spends', 'Milestone bonus of 3,000 points on ₹75,000 spend', '2 complimentary domestic lounge visits/year', '1% fuel surcharge waiver'], benefits: 'Lifetime free. Milestone rewards. Lounge access. Fuel savings.', eligibility: { min_age: 21, max_age: 60, min_income: 15000 }, eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹15,000. CIBIL score 700+.', documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Bank statement', fees_charges: 'Joining Fee: Nil | Annual Fee: Nil (Lifetime Free) | Interest Rate: 3.4% per month', seo_title: 'Kotak League Platinum – Lifetime Free Card | GharKaPaisa', seo_description: 'Apply for Kotak League Platinum. Lifetime free with milestone rewards and lounge access.', seo_keywords: 'Kotak League Platinum, Kotak free card, Kotak rewards card', min_age: 21, max_age: 60, min_income: 15000, display_order: 1, priority: 1 },
    { name: 'Kotak Mojo Platinum Credit Card', category: 'credit_card', short_description: 'Mojo points on everyday spends and lounge access', annual_fee: '₹1,000 (Waived on ₹2,00,000 annual spend)', description: 'Kotak Mojo Platinum Credit Card offers Mojo Points on everyday spends, lounge access, and entertainment benefits.', features: ['4 Mojo Points per ₹150 on all spends', '10X Mojo Points on entertainment and dining', '4 domestic lounge visits/year', 'Buy 1 Get 1 on BookMyShow', '1% fuel surcharge waiver'], benefits: '10X entertainment rewards. BOGO movies. Lounge access. Fuel savings.', eligibility: { min_age: 21, max_age: 60, min_income: 25000 }, eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹25,000. CIBIL score 720+.', documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Last 6 months bank statement', fees_charges: 'Joining Fee: ₹1,000 | Annual Fee: ₹1,000 (waived on ₹2,00,000 spend) | Interest Rate: 3.4% per month', seo_title: 'Kotak Mojo Platinum – Entertainment Card | GharKaPaisa', seo_description: 'Apply for Kotak Mojo Platinum. 10X entertainment rewards, BOGO movies, and lounge access.', seo_keywords: 'Kotak Mojo card, Kotak entertainment card, Kotak movie card', min_age: 21, max_age: 60, min_income: 25000, display_order: 2, priority: 2 },
    { name: 'Kotak Royal Signature Credit Card', category: 'credit_card', short_description: 'Travel rewards and complimentary lounge visits', annual_fee: '₹999 (Waived on ₹3,00,000 annual spend)', description: 'Kotak Royal Signature Credit Card offers premium travel and dining rewards, Priority Pass lounge access, and golf privileges.', features: ['8 reward points per ₹150 on travel and dining', '4 reward points per ₹150 on all other spends', 'Complimentary Priority Pass with 2 international visits', '8 domestic lounge visits/year', 'Golf privileges (2 sessions/quarter)'], benefits: '8X travel rewards. Priority Pass. Golf sessions. Dining privileges.', eligibility: { min_age: 21, max_age: 60, min_income: 50000 }, eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹50,000. CIBIL score 750+.', documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Last 6 months bank statement', fees_charges: 'Joining Fee: ₹999 | Annual Fee: ₹999 (waived on ₹3,00,000 spend) | Interest Rate: 3.4% per month', seo_title: 'Kotak Royal Signature – Travel Card | GharKaPaisa', seo_description: 'Apply for Kotak Royal Signature. Priority Pass, 8X travel rewards, and golf privileges.', seo_keywords: 'Kotak Royal Signature, Kotak travel card, Kotak Priority Pass', min_age: 21, max_age: 60, min_income: 50000, display_order: 3, priority: 3 },
    { name: 'Kotak Zen Signature Credit Card', category: 'credit_card', short_description: 'Premium travel privileges and lifestyle rewards', annual_fee: '₹1,500 (Waived on ₹3,00,000 annual spend)', description: 'Kotak Zen Signature Credit Card offers a curated set of travel and wellness benefits including complimentary spa sessions, lounge access, and enhanced rewards.', features: ['10 reward points per ₹150 on travel', '5 reward points per ₹150 on all other spends', '4 domestic lounge visits/year', 'Complimentary spa sessions (2/year)', '1% fuel surcharge waiver'], benefits: '10X travel rewards. Spa sessions. Lounge access. Fuel savings.', eligibility: { min_age: 21, max_age: 60, min_income: 40000 }, eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹40,000. CIBIL score 720+.', documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Last 6 months bank statement', fees_charges: 'Joining Fee: ₹1,500 | Annual Fee: ₹1,500 (waived on ₹3,00,000 spend) | Interest Rate: 3.4% per month', seo_title: 'Kotak Zen Signature – Premium Lifestyle Card | GharKaPaisa', seo_description: 'Apply for Kotak Zen Signature. 10X travel rewards, spa sessions, and lounge access.', seo_keywords: 'Kotak Zen Signature, Kotak lifestyle card, Kotak premium card', min_age: 21, max_age: 60, min_income: 40000, display_order: 4, priority: 4 },
    { name: 'Kotak 811 Dream Different Credit Card', category: 'fd_card', short_description: 'FD-backed credit card with interest on FD and zero annual fee', annual_fee: 'Lifetime Free', featured: true, description: 'Kotak 811 Dream Different Credit Card is a secured credit card backed by a fixed deposit. Your FD earns full interest while you get a credit card with up to 90% of FD value as credit limit.', features: ['Credit limit up to 90% of FD value', 'FD continues to earn full interest', 'Zero joining fee and zero annual fee (Lifetime Free)', 'Reward points on every transaction', 'Build credit history for future unsecured cards'], benefits: 'Build credit score. FD earns interest. No annual fee. Easy approval.', eligibility: { min_age: 18, max_age: 65, min_income: 0 }, eligibility_criteria: 'Age: 18-65 years. Must have Kotak FD of ₹5,000+. No income proof needed.', documents_required: 'PAN Card, Aadhaar Card, Kotak 811 account', fees_charges: 'Joining Fee: Nil | Annual Fee: Nil | Interest Rate: 3.4% per month', seo_title: 'Kotak 811 Dream Different – FD Credit Card | GharKaPaisa', seo_description: 'Apply for Kotak 811 Dream Different Card. FD-backed, lifetime free, build your credit score.', seo_keywords: 'Kotak 811 card, Kotak FD card, Kotak secured card', min_age: 18, max_age: 65, min_income: 0, display_order: 5, priority: 5 },
    { name: 'Kotak Myntra Credit Card', category: 'co_branded_card', short_description: 'Instant discount on Myntra and cashback on spends', annual_fee: '₹500 (Waived on ₹1,50,000 annual spend)', description: 'Kotak Myntra Credit Card offers instant discounts on Myntra purchases, cashback on lifestyle spends, and rewards on everyday transactions.', features: ['7.5% instant discount on Myntra purchases', '5% cashback on partner lifestyle brands', '1% cashback on all other spends', 'Welcome Myntra voucher worth ₹500', '2 domestic lounge visits/year'], benefits: '7.5% Myntra savings. Lifestyle cashback. Welcome voucher. Lounge access.', eligibility: { min_age: 21, max_age: 60, min_income: 20000 }, eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹20,000. CIBIL score 700+.', documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Bank statement', fees_charges: 'Joining Fee: ₹500 | Annual Fee: ₹500 (waived on ₹1,50,000 spend) | Interest Rate: 3.4% per month', seo_title: 'Kotak Myntra Credit Card – Fashion Rewards | GharKaPaisa', seo_description: 'Apply for Kotak Myntra Card. Get 7.5% instant discount on Myntra and lifestyle cashback.', seo_keywords: 'Kotak Myntra card, Kotak fashion card, Myntra credit card', min_age: 21, max_age: 60, min_income: 20000, display_order: 6, priority: 6 },
  ],

  // ═══════════════════════════════════════════════════════════════
  // 6. BANK OF BARODA — 7 Cards
  // ═══════════════════════════════════════════════════════════════
  BOB: [
    { name: 'BOB Eterna Credit Card', category: 'credit_card', short_description: 'Premium travel and dining rewards with lounge access', annual_fee: '₹2,499 (Waived on ₹4,00,000 annual spend)', description: 'BOB Eterna Credit Card offers premium travel and dining rewards with Priority Pass lounge access and comprehensive travel insurance.', features: ['6X reward points on travel and dining', 'Complimentary Priority Pass with 4 international visits', '8 domestic lounge visits/year', 'Travel insurance cover of ₹50 lakh', 'Golf privileges'], benefits: '6X travel rewards. Priority Pass. Travel insurance. Golf access.', eligibility: { min_age: 21, max_age: 60, min_income: 50000 }, eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹50,000. CIBIL score 750+.', documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Last 6 months bank statement', fees_charges: 'Joining Fee: ₹2,499 | Annual Fee: ₹2,499 (waived on ₹4,00,000 spend) | Interest Rate: 3.49% per month', seo_title: 'BOB Eterna Credit Card – Premium Travel Card | GharKaPaisa', seo_description: 'Apply for BOB Eterna Card. Priority Pass, 6X travel rewards, and ₹50 lakh insurance.', seo_keywords: 'BOB Eterna, Bank of Baroda premium card, BOB travel card', min_age: 21, max_age: 60, min_income: 50000, display_order: 1, priority: 1 },
    { name: 'BOB Premier Credit Card', category: 'credit_card', short_description: '5X rewards on travel and dining', annual_fee: '₹1,000 (Waived on ₹2,00,000 annual spend)', description: 'BOB Premier Credit Card offers 5X rewards on travel and dining with lounge access and milestone benefits.', features: ['5X reward points on travel and dining', '4 domestic lounge visits/year', 'Milestone bonus of 2,000 points on ₹2 lakh spend', '1% fuel surcharge waiver', 'Welcome voucher of ₹500'], benefits: '5X travel and dining rewards. Lounge access. Milestone bonus.', eligibility: { min_age: 21, max_age: 60, min_income: 30000 }, eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹30,000. CIBIL score 720+.', documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Last 6 months bank statement', fees_charges: 'Joining Fee: ₹1,000 | Annual Fee: ₹1,000 (waived on ₹2,00,000 spend) | Interest Rate: 3.49% per month', seo_title: 'BOB Premier Credit Card – Travel & Dining | GharKaPaisa', seo_description: 'Apply for BOB Premier Card. 5X travel and dining rewards with lounge access.', seo_keywords: 'BOB Premier, Bank of Baroda mid card, BOB rewards card', min_age: 21, max_age: 60, min_income: 30000, display_order: 2, priority: 2 },
    { name: 'BOB Easy Credit Card', category: 'credit_card', short_description: '5X rewards on grocery and department stores', annual_fee: 'Lifetime Free', featured: true, description: 'BOB Easy Credit Card is a lifetime free card offering 5X rewards on grocery and department stores with everyday shopping benefits.', features: ['5X reward points on grocery and department stores', '2 reward points per ₹100 on all other spends', 'Zero joining fee and zero annual fee (Lifetime Free)', '1% fuel surcharge waiver', 'EMI conversion facility'], benefits: '5X grocery rewards. Lifetime free. Fuel savings. EMI facility.', eligibility: { min_age: 21, max_age: 60, min_income: 15000 }, eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹15,000. CIBIL score 700+.', documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Bank statement', fees_charges: 'Joining Fee: Nil | Annual Fee: Nil (Lifetime Free) | Interest Rate: 3.49% per month', seo_title: 'BOB Easy Credit Card – Lifetime Free | GharKaPaisa', seo_description: 'Apply for BOB Easy Card. 5X grocery rewards with lifetime zero fee.', seo_keywords: 'BOB Easy card, Bank of Baroda free card, BOB grocery card', min_age: 21, max_age: 60, min_income: 15000, display_order: 3, priority: 3 },
    { name: 'BOB Select Credit Card', category: 'credit_card', short_description: 'Accelerated points on dining and online shopping', annual_fee: '₹750 (Waived on ₹1,50,000 annual spend)', description: 'BOB Select Credit Card offers accelerated points on dining and online shopping with entertainment discounts.', features: ['5X reward points on dining and online shopping', '2X reward points on all other spends', 'BookMyShow BOGO (2 per month)', '2 domestic lounge visits/year', '1% fuel surcharge waiver'], benefits: 'Dining and online shopping rewards. BOGO movies. Lounge access.', eligibility: { min_age: 21, max_age: 60, min_income: 20000 }, eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹20,000. CIBIL score 700+.', documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Bank statement', fees_charges: 'Joining Fee: ₹750 | Annual Fee: ₹750 (waived on ₹1,50,000 spend) | Interest Rate: 3.49% per month', seo_title: 'BOB Select Credit Card – Dining & Shopping | GharKaPaisa', seo_description: 'Apply for BOB Select Card. 5X rewards on dining and online shopping.', seo_keywords: 'BOB Select, Bank of Baroda Select card, BOB dining card', min_age: 21, max_age: 60, min_income: 20000, display_order: 4, priority: 4 },
    { name: 'BOB HPCL Energy Credit Card', category: 'co_branded_card', short_description: 'Save on fuel and LPG cylinder bookings', annual_fee: '₹499 (Waived on ₹50,000 annual spend)', description: 'BOB HPCL Energy Card offers fuel savings at HPCL stations and cashback on LPG cylinder bookings.', features: ['5% cashback on HPCL fuel purchases', '2.5% cashback on LPG cylinder booking', '1% fuel surcharge waiver', '2X reward points on grocery spends', 'Welcome fuel voucher of ₹250'], benefits: '5% HPCL fuel savings. LPG cashback. Fuel surcharge waiver.', eligibility: { min_age: 21, max_age: 60, min_income: 15000 }, eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹15,000. CIBIL score 700+.', documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Bank statement', fees_charges: 'Joining Fee: ₹499 | Annual Fee: ₹499 (waived on ₹50,000 spend) | Interest Rate: 3.49% per month', seo_title: 'BOB HPCL Energy Card – Fuel Savings | GharKaPaisa', seo_description: 'Apply for BOB HPCL Energy Card. Save 5% on HPCL fuel and cashback on LPG.', seo_keywords: 'BOB HPCL card, Bank of Baroda fuel card, HPCL credit card', min_age: 21, max_age: 60, min_income: 15000, display_order: 5, priority: 5 },
    { name: 'BOB Prime Credit Card', category: 'fd_card', short_description: 'FD-backed credit card with zero joining fee', annual_fee: 'Lifetime Free', description: 'BOB Prime Credit Card is a secured credit card backed by a Bank of Baroda fixed deposit. Build your credit history with zero annual fee.', features: ['Credit limit up to 80% of FD value', 'Zero joining and annual fee', 'FD earns full interest', 'Reward points on every transaction', 'Build credit history'], benefits: 'FD-backed secure card. Zero fees. Build credit score.', eligibility: { min_age: 18, max_age: 65, min_income: 0 }, eligibility_criteria: 'Age: 18-65 years. BOB FD of ₹10,000+. No income proof needed.', documents_required: 'PAN Card, Aadhaar Card, BOB FD receipt', fees_charges: 'Joining Fee: Nil | Annual Fee: Nil | Interest Rate: 3.49% per month', seo_title: 'BOB Prime Credit Card – FD Secured Card | GharKaPaisa', seo_description: 'Apply for BOB Prime Card. FD-backed, zero fee, build your credit score.', seo_keywords: 'BOB Prime card, BOB FD card, Bank of Baroda secured card', min_age: 18, max_age: 65, min_income: 0, display_order: 6, priority: 6 },
    { name: 'BOB Snapdeal Credit Card', category: 'co_branded_card', short_description: 'Up to 5% cashback on Snapdeal shopping', annual_fee: '₹249', description: 'BOB Snapdeal Credit Card offers cashback on Snapdeal purchases and everyday shopping rewards.', features: ['5% cashback on Snapdeal purchases', '1% cashback on all other spends', 'Welcome Snapdeal voucher worth ₹500', '1% fuel surcharge waiver', 'EMI conversion facility'], benefits: '5% Snapdeal cashback. Welcome voucher. Fuel savings.', eligibility: { min_age: 21, max_age: 60, min_income: 15000 }, eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹15,000. CIBIL score 700+.', documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips', fees_charges: 'Joining Fee: ₹249 | Annual Fee: ₹249 | Interest Rate: 3.49% per month', seo_title: 'BOB Snapdeal Credit Card | GharKaPaisa', seo_description: 'Apply for BOB Snapdeal Card. 5% cashback on Snapdeal shopping.', seo_keywords: 'BOB Snapdeal, Bank of Baroda Snapdeal card', min_age: 21, max_age: 60, min_income: 15000, display_order: 7, priority: 7 },
  ],

  // ═══════════════════════════════════════════════════════════════
  // 7. YES BANK — 5 Cards
  // ═══════════════════════════════════════════════════════════════
  YES: [
    { name: 'Yes Bank BYOC Credit Card', category: 'credit_card', short_description: 'Build Your Own Card with custom rewards categories', annual_fee: '₹499 (Waived on ₹1,00,000 annual spend)', description: 'Yes Bank BYOC (Build Your Own Card) Credit Card lets you choose your reward categories for boosted earning rates. Customize between travel, dining, shopping, or fuel.', features: ['Choose 3 preferred categories for 10X reward points', '1 reward point per ₹100 on all other spends', 'BookMyShow BOGO (2 per month)', '2 domestic lounge visits/year', '1% fuel surcharge waiver'], benefits: 'Custom 10X rewards. BOGO movies. Lounge access.', eligibility: { min_age: 21, max_age: 60, min_income: 20000 }, eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹20,000. CIBIL score 700+.', documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Bank statement', fees_charges: 'Joining Fee: ₹499 | Annual Fee: ₹499 (waived on ₹1,00,000 spend) | Interest Rate: 3.49% per month', seo_title: 'Yes Bank BYOC Credit Card – Custom Rewards | GharKaPaisa', seo_description: 'Apply for Yes Bank BYOC Card. Build your own rewards card with 10X on chosen categories.', seo_keywords: 'Yes Bank BYOC, Yes Bank custom card, BYOC credit card', min_age: 21, max_age: 60, min_income: 20000, display_order: 1, priority: 1 },
    { name: 'Yes Prosperity Edge Credit Card', category: 'credit_card', short_description: 'Accelerated reward points and lifestyle benefits', annual_fee: '₹399', description: 'Yes Prosperity Edge Credit Card offers accelerated rewards on lifestyle spends with dining and movie benefits.', features: ['5X reward points on dining and entertainment', '2 reward points per ₹100 on all spends', 'BookMyShow BOGO', 'Welcome voucher of ₹250', '1% fuel surcharge waiver'], benefits: '5X lifestyle rewards. BOGO movies. Welcome voucher.', eligibility: { min_age: 21, max_age: 60, min_income: 15000 }, eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹15,000. CIBIL score 700+.', documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Bank statement', fees_charges: 'Joining Fee: ₹399 | Annual Fee: ₹399 | Interest Rate: 3.49% per month', seo_title: 'Yes Prosperity Edge Credit Card | GharKaPaisa', seo_description: 'Apply for Yes Prosperity Edge Card. 5X lifestyle rewards and BOGO movies.', seo_keywords: 'Yes Prosperity Edge, Yes Bank rewards card', min_age: 21, max_age: 60, min_income: 15000, display_order: 2, priority: 2 },
    { name: 'Yes Premia Credit Card', category: 'credit_card', short_description: 'Travel rewards with complimentary lounge access', annual_fee: '₹999 (Waived on ₹2,00,000 annual spend)', description: 'Yes Premia Credit Card offers travel rewards, Priority Pass lounge access, and enhanced points on travel and dining.', features: ['8X reward points on travel bookings', '4X reward points on dining', 'Complimentary Priority Pass with 2 international visits', '4 domestic lounge visits/year', '1% fuel surcharge waiver'], benefits: '8X travel rewards. Priority Pass. Dining rewards.', eligibility: { min_age: 21, max_age: 60, min_income: 40000 }, eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹40,000. CIBIL score 720+.', documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Last 6 months bank statement', fees_charges: 'Joining Fee: ₹999 | Annual Fee: ₹999 (waived on ₹2,00,000 spend) | Interest Rate: 3.49% per month', seo_title: 'Yes Premia Credit Card – Travel Card | GharKaPaisa', seo_description: 'Apply for Yes Premia Card. 8X travel rewards and Priority Pass lounge access.', seo_keywords: 'Yes Premia, Yes Bank travel card, Yes Bank lounge card', min_age: 21, max_age: 60, min_income: 40000, display_order: 3, priority: 3 },
    { name: 'Yes Bank Paisabazaar Step Up Credit Card', category: 'fd_card', short_description: 'FD-backed secured credit card to build credit score', annual_fee: 'Lifetime Free', featured: true, description: 'Yes Bank Paisabazaar Step Up Credit Card is a secured card backed by an FD. Build your credit score with zero annual fee.', features: ['Credit limit up to 80% of FD value', 'Zero joining fee and annual fee', 'FD earns full interest', 'Reward points on transactions', 'Monthly CIBIL score updates'], benefits: 'Build credit score. FD earns interest. Monthly CIBIL updates. Zero fee.', eligibility: { min_age: 18, max_age: 65, min_income: 0 }, eligibility_criteria: 'Age: 18-65 years. Yes Bank FD of ₹10,000+. No income proof needed.', documents_required: 'PAN Card, Aadhaar Card', fees_charges: 'Joining Fee: Nil | Annual Fee: Nil | Interest Rate: 3.49% per month', seo_title: 'Yes Bank Step Up Credit Card – Build Credit | GharKaPaisa', seo_description: 'Apply for Yes Bank Step Up Card. FD-backed, lifetime free, build your CIBIL score.', seo_keywords: 'Yes Bank Step Up, Yes Bank FD card, Paisabazaar Step Up card', min_age: 18, max_age: 65, min_income: 0, display_order: 4, priority: 4 },
    { name: 'Yes Bank BYOC RuPay Credit Card', category: 'co_branded_card', short_description: 'UPI-first custom rewards credit card', annual_fee: '₹499', description: 'Yes Bank BYOC RuPay Credit Card offers custom rewards categories with UPI credit card payment capability via the RuPay network.', features: ['UPI payments via RuPay network', 'Choose 3 preferred categories for 10X rewards', '2 reward points per ₹100 on all spends', '1% fuel surcharge waiver', 'Contactless tap-and-pay'], benefits: 'UPI credit card payments. Custom 10X rewards. Fuel savings.', eligibility: { min_age: 21, max_age: 60, min_income: 15000 }, eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹15,000. CIBIL score 700+.', documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips', fees_charges: 'Joining Fee: ₹499 | Annual Fee: ₹499 | Interest Rate: 3.49% per month', seo_title: 'Yes Bank BYOC RuPay – UPI Credit Card | GharKaPaisa', seo_description: 'Apply for Yes Bank BYOC RuPay. Custom rewards with UPI payments.', seo_keywords: 'Yes BYOC RuPay, Yes Bank UPI card, RuPay BYOC card', min_age: 21, max_age: 60, min_income: 15000, display_order: 5, priority: 5 },
  ],

  // ═══════════════════════════════════════════════════════════════
  // 8. IDFC FIRST BANK — 3 Cards
  // ═══════════════════════════════════════════════════════════════
  IDFC: [
    { name: 'IDFC FIRST Classic Credit Card', category: 'credit_card', short_description: 'Lifetime free with interest-free cash withdrawals', annual_fee: 'Lifetime Free', featured: true, description: 'IDFC FIRST Classic Credit Card is lifetime free with never-expiring reward points and interest-free cash withdrawals up to 48 days.', features: ['Lifetime free – zero joining and annual fee', 'Interest-free cash withdrawals (up to 48 days)', '10X reward points on shopping via IDFC FIRST app', '6 reward points per ₹150 on all spends', 'Never-expiring reward points'], benefits: 'Lifetime free. Interest-free ATM cash. Never-expiring points.', eligibility: { min_age: 21, max_age: 60, min_income: 20000 }, eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹20,000. CIBIL score 700+.', documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips', fees_charges: 'Joining Fee: Nil | Annual Fee: Nil | Interest Rate: 3.49% per month', seo_title: 'IDFC FIRST Classic Credit Card – Lifetime Free | GharKaPaisa', seo_description: 'Apply for IDFC FIRST Classic Card. Lifetime free with interest-free ATM withdrawals.', seo_keywords: 'IDFC FIRST Classic, IDFC lifetime free, IDFC credit card', min_age: 21, max_age: 60, min_income: 20000, display_order: 1, priority: 1 },
    { name: 'IDFC FIRST Millennia Credit Card', category: 'credit_card', short_description: 'Lifetime free with high rewards on online spends', annual_fee: 'Lifetime Free', featured: true, description: 'IDFC FIRST Millennia Credit Card is lifetime free with 10X rewards on online shopping and 6X on all other spends.', features: ['10X reward points on online shopping', '6X reward points on all other spends', 'Lifetime free – zero annual fee', '4 complimentary domestic lounge visits/year', 'Interest-free ATM cash withdrawal'], benefits: '10X online rewards. Lounge access. Lifetime free. Interest-free cash.', eligibility: { min_age: 21, max_age: 60, min_income: 25000 }, eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹25,000. CIBIL score 720+.', documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Bank statement', fees_charges: 'Joining Fee: Nil | Annual Fee: Nil | Interest Rate: 3.49% per month', seo_title: 'IDFC FIRST Millennia Credit Card | GharKaPaisa', seo_description: 'Apply for IDFC FIRST Millennia. Lifetime free, 10X online rewards, lounge access.', seo_keywords: 'IDFC FIRST Millennia, IDFC online shopping card', min_age: 21, max_age: 60, min_income: 25000, display_order: 2, priority: 2 },
    { name: 'IDFC FIRST Select Credit Card', category: 'credit_card', short_description: 'Premium benefits, airport lounge access and zero fee', annual_fee: 'Lifetime Free', featured: true, description: 'IDFC FIRST Select Credit Card is a premium lifetime free card with 10X rewards, domestic and international lounge access, and never-expiring points.', features: ['10X reward points on all spends', 'Lifetime free – zero annual fee', '4 complimentary domestic lounge visits/year', '2 international lounge visits/year', 'Interest-free ATM cash withdrawal'], benefits: '10X rewards. International and domestic lounges. Lifetime free. Interest-free cash.', eligibility: { min_age: 21, max_age: 60, min_income: 40000 }, eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹40,000. CIBIL score 720+.', documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Last 6 months bank statement', fees_charges: 'Joining Fee: Nil | Annual Fee: Nil | Interest Rate: 3.49% per month', seo_title: 'IDFC FIRST Select Credit Card – Premium Free | GharKaPaisa', seo_description: 'Apply for IDFC FIRST Select. Premium lifetime free card with 10X rewards and lounge access.', seo_keywords: 'IDFC FIRST Select, IDFC premium free card', min_age: 21, max_age: 60, min_income: 40000, display_order: 3, priority: 3 },
  ],

  // ═══════════════════════════════════════════════════════════════
  // 9. FEDERAL BANK — 2 Cards
  // ═══════════════════════════════════════════════════════════════
  FEDERAL: [
    { name: 'Federal Bank Scapia Credit Card', category: 'credit_card', short_description: 'Premium travel rewards with zero forex markup', annual_fee: 'Lifetime Free', featured: true, description: 'Federal Bank Scapia Credit Card is a premium travel card with zero forex markup, unlimited lounge access, and 10% rewards on international spends. Lifetime free.', features: ['Zero forex markup on international transactions', '10% rewards on international spends', 'Unlimited domestic and international lounge access', 'Lifetime free – zero annual fee', 'Travel insurance cover'], benefits: 'Zero forex markup. Unlimited lounges. 10% international rewards. Lifetime free.', eligibility: { min_age: 21, max_age: 60, min_income: 25000 }, eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹25,000. CIBIL score 700+.', documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips', fees_charges: 'Joining Fee: Nil | Annual Fee: Nil | Forex Fee: Nil', seo_title: 'Federal Bank Scapia Credit Card – Zero Forex | GharKaPaisa', seo_description: 'Apply for Scapia Card. Zero forex, unlimited lounges, and lifetime free.', seo_keywords: 'Scapia credit card, Federal Bank travel card, zero forex card', min_age: 21, max_age: 60, min_income: 25000, display_order: 1, priority: 1 },
    { name: 'Federal Bank OneCard', category: 'credit_card', short_description: 'Zero join fee metal card with custom app controls', annual_fee: 'Lifetime Free', featured: true, description: 'Federal Bank OneCard is a metal credit card with zero fee, 5X rewards, and full control via the OneCard mobile app.', features: ['Metal credit card design', '5X reward points on top categories', 'Zero joining fee and annual fee', 'Full card controls via OneCard app', '1% fuel surcharge waiver'], benefits: 'Metal card. 5X rewards. Full app control. Lifetime free.', eligibility: { min_age: 21, max_age: 60, min_income: 20000 }, eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹20,000. CIBIL score 700+.', documents_required: 'PAN Card, Aadhaar Card', fees_charges: 'Joining Fee: Nil | Annual Fee: Nil | Interest Rate: 3.49% per month', seo_title: 'Federal Bank OneCard – Metal Card | GharKaPaisa', seo_description: 'Apply for Federal Bank OneCard. Metal card, 5X rewards, lifetime free.', seo_keywords: 'OneCard credit card, Federal Bank OneCard, metal credit card', min_age: 21, max_age: 60, min_income: 20000, display_order: 2, priority: 2 },
  ],

  // ═══════════════════════════════════════════════════════════════
  // 10. AU BANK — 1 Card
  // ═══════════════════════════════════════════════════════════════
  AU: [
    { name: 'AU Bank SPONT Credit Card', category: 'credit_card', short_description: 'Customized benefits with zero annual fee', annual_fee: 'Lifetime Free', featured: true, description: 'AU Bank SPONT Credit Card offers customizable reward categories and zero annual fee, making it a versatile everyday spending card.', features: ['Choose your top reward categories', 'Zero joining fee and annual fee', '5X reward points on chosen categories', '1% cashback on all other spends', 'Contactless payments enabled'], benefits: 'Custom rewards. Lifetime free. Contactless. Flexible redemption.', eligibility: { min_age: 21, max_age: 60, min_income: 15000 }, eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹15,000. CIBIL score 700+.', documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips', fees_charges: 'Joining Fee: Nil | Annual Fee: Nil | Interest Rate: 3.49% per month', seo_title: 'AU Bank SPONT Credit Card – Custom Rewards | GharKaPaisa', seo_description: 'Apply for AU Bank SPONT Card. Custom rewards, lifetime free.', seo_keywords: 'AU SPONT card, AU Bank credit card, AU custom rewards card', min_age: 21, max_age: 60, min_income: 15000, display_order: 1, priority: 1 },
  ],

  // ═══════════════════════════════════════════════════════════════
  // 11. INDUSIND BANK — 1 Card
  // ═══════════════════════════════════════════════════════════════
  INDUSIND: [
    { name: 'IndusInd Legend Credit Card', category: 'credit_card', short_description: 'Exclusive travel, dining and golfing privileges', annual_fee: 'Lifetime Free', featured: true, description: 'IndusInd Legend Credit Card offers premium travel, dining, and golf privileges with lifetime free and unlimited lounge access.', features: ['Unlimited domestic airport lounge access', '4 international lounge visits/year', 'Golf privileges at premium courses', '5X reward points on travel and dining', 'Lifetime free – zero annual fee'], benefits: 'Unlimited lounges. Golf access. 5X travel rewards. Lifetime free.', eligibility: { min_age: 21, max_age: 60, min_income: 30000 }, eligibility_criteria: 'Age: 21-60 years. Minimum monthly income: ₹30,000. CIBIL score 720+.', documents_required: 'PAN Card, Aadhaar Card, Latest 3 months salary slips, Bank statement', fees_charges: 'Joining Fee: Nil | Annual Fee: Nil | Interest Rate: 3.49% per month', seo_title: 'IndusInd Legend Credit Card | GharKaPaisa', seo_description: 'Apply for IndusInd Legend Card. Unlimited lounges, golf, and lifetime free.', seo_keywords: 'IndusInd Legend, IndusInd free card, IndusInd premium card', min_age: 21, max_age: 60, min_income: 30000, display_order: 1, priority: 1 },
  ],
};

// ─── Seed Function ──────────────────────────────────────────────
function getSubCategory(cardName, bankKey) {
  const name = cardName.toLowerCase();
  
  // Secured Cards
  if (name.includes('fd backed') || name.includes('secured') || name.includes('insta easy') || name.includes('step up') || name.includes('wow')) {
    return 'Secured Cards';
  }
  
  // Co-Branded Cards
  const coBrandedKeywords = [
    'tata', 'neu', 'marriott', 'pixel', 'paytm', 'intermiles', 'irctc',
    'bpcl', 'air india', 'apollo', 'yatra', 'reliance', 'central',
    'flipkart', 'indianoil', 'samsung', 'airtel', 'vistara', 'freecharge',
    'amazon', 'makemytrip', 'manchester', 'emirates', 'ferrari',
    'myntra', 'pvr', 'indigo', '6e', 'energie', 'snapdeal', 'wellness',
    'paisabazaar', 'byoc', 'scapia', 'onecard', 'wave', 'spont',
    'eazydiner', 'tiger', 'avios', 'lic', 'ashva'
  ];
  
  if (coBrandedKeywords.some(keyword => name.includes(keyword))) {
    return 'Co-Branded Cards';
  }
  
  return 'Core Cards';
}

function extractFeesStructure(feesChargesStr, annualFeeStr) {
  let joining = '₹0';
  let annual = '₹500';
  let interest = '3.5% p.m.';
  let late = 'Up to ₹1300';
  
  if (feesChargesStr) {
    const joiningMatch = feesChargesStr.match(/Joining Fee:\s*(₹\s*\d+(?:,\d+)*|Nil|Free|None)/i);
    if (joiningMatch) joining = joiningMatch[1];
    
    const annualMatch = feesChargesStr.match(/Annual Fee:\s*(₹\s*\d+(?:,\d+)*|Nil|Free|None)/i);
    if (annualMatch) annual = annualMatch[1];
    
    const interestMatch = feesChargesStr.match(/Interest Rate:\s*(\d+(?:\.\d+)?%\s*(?:per month|p\.m\.)?)/i);
    if (interestMatch) interest = interestMatch[1];
  }
  
  if (annualFeeStr && (!annual || annual === '₹500')) {
    annual = annualFeeStr;
  }
  
  return {
    joining_fee: joining,
    annual_fee: annual,
    interest_rate: interest,
    late_payment_charges: late,
    foreign_markup: '3.5%',
    fuel_surcharge: '1% waiver'
  };
}

function getCompareSpecs(card, fees) {
  let lounge = 'Nil';
  if (card.features) {
    for (const f of card.features) {
      if (f.toLowerCase().includes('lounge')) {
        lounge = f;
        break;
      }
    }
  }
  
  let fuel = 'Nil';
  if (card.features) {
    for (const f of card.features) {
      if (f.toLowerCase().includes('fuel')) {
        fuel = '1% Waiver';
        break;
      }
    }
  }
  
  return {
    annual_fee: fees.annual_fee,
    reward_rate: card.short_description || 'Accelerated rewards',
    lounge: lounge,
    fuel: fuel,
    forex: fees.foreign_markup || '3.5%'
  };
}

async function seed() {
  console.log('🚀 Starting credit card product seed...\n');

  // Bank short_code → UUID lookup
  const { rows: banks } = await query('SELECT id, short_code, name FROM banks');
  const bankMap = {};
  for (const b of banks) {
    bankMap[b.short_code?.toUpperCase()] = b.id;
    const nameKey = b.name?.toUpperCase().replace(/\s+/g, '').replace(/BANK$/i, '').replace(/MAHINDRA$/i, '');
    bankMap[nameKey] = b.id;
  }

  console.log('Banks found:', Object.keys(bankMap).join(', '));

  let totalInserted = 0;
  let totalUpdated = 0;

  for (const [bankKey, cards] of Object.entries(ALL_CARDS)) {
    const bankId = bankMap[bankKey];
    if (!bankId) {
      console.warn(`⚠️  Bank "${bankKey}" not found in database. Skipping ${cards.length} cards.`);
      continue;
    }

    console.log(`\n📦 Seeding ${cards.length} cards for ${bankKey}...`);

    for (const card of cards) {
      const cardSlug = slug(card.name);
      
      const subCat = getSubCategory(card.name, bankKey);
      const fees = extractFeesStructure(card.fees_charges, card.annual_fee);
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
        is_featured: card.featured || false,
        is_popular: card.featured || false
      };

      const seoMetadata = {
        meta_title: card.seo_title || card.name,
        meta_description: card.seo_description || card.short_description,
        slug: cardSlug
      };

      const docsArray = card.documents_required ? card.documents_required.split(',').map(d => d.trim()) : ['PAN Card', 'Aadhaar Card', 'Salary Slip'];

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
          visibility, seo_metadata
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,
          $31,$32,$33,$34,$35,$36,$37,
          $38,$39,$40,$41,$42,$43,$44,$45
        )
        ON CONFLICT (bank_id, name) DO UPDATE SET
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
          sub_category = EXCLUDED.sub_category,
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
          is_active = true,
          status = 'Active'
        RETURNING (xmin = 0) AS is_insert
      `, [
        bankId, card.name, card.category, card.description, JSON.stringify(card.features || []), JSON.stringify(card.eligibility || {}),
        'fixed', 0, card.min_age || null, card.max_age || null, card.min_income || null,
        card.display_order || 0, fees.annual_fee, card.short_description || null, card.benefits || null,
        card.fees_charges || null, card.eligibility_criteria || null, card.documents_required || null,
        'Apply Now', card.seo_title || null, card.seo_description || null, card.seo_keywords || null,
        card.priority || 0, 'Active', true, true, true,
        card.featured || false, true, cardSlug,
        subCat, fees.joining_fee, fees.interest_rate, card.short_description || null, card.short_description || null,
        compareSpecs.lounge, compareSpecs.fuel, JSON.stringify(compareSpecs), JSON.stringify(fees),
        JSON.stringify(commissions), JSON.stringify(card.features || []), JSON.stringify(card.benefits ? [{ title: 'Key Benefits', description: card.benefits }] : []), JSON.stringify(docsArray),
        JSON.stringify(visibility), JSON.stringify(seoMetadata)
      ]);

      if (result.rows[0]?.is_insert) {
        totalInserted++;
      } else {
        totalUpdated++;
      }
      console.log(`  ✅ ${card.name} (${subCat})`);
    }
  }

  console.log(`\n════════════════════════════════════════`);
  console.log(`✅ Seed complete: ${totalInserted} inserted, ${totalUpdated} updated.`);
  console.log(`════════════════════════════════════════\n`);
}

// ─── Run ────────────────────────────────────────────────────────
seed()
  .then(() => {
    console.log('Done. Exiting.');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Seed error:', err);
    process.exit(1);
  });

/**
 * Seed Script: Credit Card Products
 * Inserts all credit card products for all 13 banks into the products table.
 * Run: node backend/src/database/seeds/seed-credit-cards.js
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const { query } = require('../../config/database');

// ─── Helper ─────────────────────────────────────────────────────
function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// ─── Card Data ──────────────────────────────────────────────────
const ALL_CARDS = {
  HDFC: [
    {
      name: 'HDFC Freedom Credit Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: 'Entry-level credit card offering rewards on dining, grocery, and everyday utility spends.',
      description: 'HDFC Freedom Credit Card provides entry-level credit card offering rewards on dining, grocery, and everyday utility spends. Designed to offer max savings and convenience.',
      annual_fee: '₹500 (Waived on ₹50,000 annual spend)',
      features: [
        'Entry-level credit card offering rewards on dining, grocery, and everyday utility spends.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Entry-level credit card offering rewards on dining, grocery, and everyday utility spends. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹500 (Waived on ₹50,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'HDFC Freedom Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for HDFC Freedom Credit Card. Entry-level credit card offering rewards on dining, grocery, and everyday utility spends.',
      seo_keywords: 'hdfc freedom credit card, apply hdfc credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 1, priority: 1
    },
    {
      name: 'HDFC MoneyBack+ Credit Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: '10X CashPoints on popular online merchants like Amazon, Flipkart, Swiggy and BigBasket.',
      description: 'HDFC MoneyBack+ Credit Card provides 10x cashpoints on popular online merchants like amazon, flipkart, swiggy and bigbasket. Designed to offer max savings and convenience.',
      annual_fee: '₹500 (Waived on ₹50,000 annual spend)',
      features: [
        '10X CashPoints on popular online merchants like Amazon, Flipkart, Swiggy and BigBasket.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: '10X CashPoints on popular online merchants like Amazon, Flipkart, Swiggy and BigBasket. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹500 (Waived on ₹50,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'HDFC MoneyBack+ Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for HDFC MoneyBack+ Credit Card. 10X CashPoints on popular online merchants like Amazon, Flipkart, Swiggy and BigBasket.',
      seo_keywords: 'hdfc moneyback+ credit card, apply hdfc credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 2, priority: 2
    },
    {
      name: 'HDFC Millennia Credit Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: '5% cashback on top online shopping brands and complimentary domestic airport lounge access.',
      description: 'HDFC Millennia Credit Card provides 5% cashback on top online shopping brands and complimentary domestic airport lounge access. Designed to offer max savings and convenience.',
      annual_fee: '₹1,000 (Waived on ₹1,00,000 annual spend)',
      features: [
        '5% cashback on top online shopping brands and complimentary domestic airport lounge access.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: '5% cashback on top online shopping brands and complimentary domestic airport lounge access. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹1,000 (Waived on ₹1,00,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'HDFC Millennia Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for HDFC Millennia Credit Card. 5% cashback on top online shopping brands and complimentary domestic airport lounge access.',
      seo_keywords: 'hdfc millennia credit card, apply hdfc credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 3, priority: 3
    },
    {
      name: 'HDFC Regalia Gold Credit Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: 'Premium travel and lifestyle card with 12 domestic and 6 international lounge visits per year.',
      description: 'HDFC Regalia Gold Credit Card provides premium travel and lifestyle card with 12 domestic and 6 international lounge visits per year. Designed to offer max savings and convenience.',
      annual_fee: '₹2,500 (Waived on ₹3,00,000 annual spend)',
      features: [
        'Premium travel and lifestyle card with 12 domestic and 6 international lounge visits per year.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Premium travel and lifestyle card with 12 domestic and 6 international lounge visits per year. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹2,500 (Waived on ₹3,00,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'HDFC Regalia Gold Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for HDFC Regalia Gold Credit Card. Premium travel and lifestyle card with 12 domestic and 6 international lounge visits per year.',
      seo_keywords: 'hdfc regalia gold credit card, apply hdfc credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 4, priority: 4
    },
    {
      name: 'HDFC Regalia Credit Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: 'Classic luxury lifestyle card offering travel vouchers, priority pass membership, and dining rewards.',
      description: 'HDFC Regalia Credit Card provides classic luxury lifestyle card offering travel vouchers, priority pass membership, and dining rewards. Designed to offer max savings and convenience.',
      annual_fee: '₹2,500 (Waived on ₹3,00,000 annual spend)',
      features: [
        'Classic luxury lifestyle card offering travel vouchers, priority pass membership, and dining rewards.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Classic luxury lifestyle card offering travel vouchers, priority pass membership, and dining rewards. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹2,500 (Waived on ₹3,00,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'HDFC Regalia Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for HDFC Regalia Credit Card. Classic luxury lifestyle card offering travel vouchers, priority pass membership, and dining rewards.',
      seo_keywords: 'hdfc regalia credit card, apply hdfc credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 5, priority: 5
    },
    {
      name: 'HDFC BizGrow Credit Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: 'Tailored for small business owners and freelancers with 55 days interest-free period.',
      description: 'HDFC BizGrow Credit Card provides tailored for small business owners and freelancers with 55 days interest-free period. Designed to offer max savings and convenience.',
      annual_fee: '₹500 (Waived on ₹50,000 annual spend)',
      features: [
        'Tailored for small business owners and freelancers with 55 days interest-free period.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Tailored for small business owners and freelancers with 55 days interest-free period. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹500 (Waived on ₹50,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'HDFC BizGrow Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for HDFC BizGrow Credit Card. Tailored for small business owners and freelancers with 55 days interest-free period.',
      seo_keywords: 'hdfc bizgrow credit card, apply hdfc credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 6, priority: 6
    },
    {
      name: 'HDFC BizPower Credit Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: 'Commercial card with accelerated rewards on Google Ads, AWS, telecom, and business travel.',
      description: 'HDFC BizPower Credit Card provides commercial card with accelerated rewards on google ads, aws, telecom, and business travel. Designed to offer max savings and convenience.',
      annual_fee: '₹2,500 (Waived on ₹3,00,000 annual spend)',
      features: [
        'Commercial card with accelerated rewards on Google Ads, AWS, telecom, and business travel.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Commercial card with accelerated rewards on Google Ads, AWS, telecom, and business travel. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹2,500 (Waived on ₹3,00,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'HDFC BizPower Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for HDFC BizPower Credit Card. Commercial card with accelerated rewards on Google Ads, AWS, telecom, and business travel.',
      seo_keywords: 'hdfc bizpower credit card, apply hdfc credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 7, priority: 7
    },
    {
      name: 'HDFC BizFirst Credit Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: 'Entry-level commercial card with cashback on operational costs and utility bills.',
      description: 'HDFC BizFirst Credit Card provides entry-level commercial card with cashback on operational costs and utility bills. Designed to offer max savings and convenience.',
      annual_fee: '₹500 (Waived on ₹50,000 annual spend)',
      features: [
        'Entry-level commercial card with cashback on operational costs and utility bills.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Entry-level commercial card with cashback on operational costs and utility bills. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹500 (Waived on ₹50,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'HDFC BizFirst Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for HDFC BizFirst Credit Card. Entry-level commercial card with cashback on operational costs and utility bills.',
      seo_keywords: 'hdfc bizfirst credit card, apply hdfc credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 8, priority: 8
    },
    {
      name: 'HDFC Diners Club Privilege Credit Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: 'Premium lifestyle card with Diners Club privileges, golf rounds, and BOGO movie tickets.',
      description: 'HDFC Diners Club Privilege Credit Card provides premium lifestyle card with diners club privileges, golf rounds, and bogo movie tickets. Designed to offer max savings and convenience.',
      annual_fee: '₹2,500 (Waived on ₹3,00,000 annual spend)',
      features: [
        'Premium lifestyle card with Diners Club privileges, golf rounds, and BOGO movie tickets.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Premium lifestyle card with Diners Club privileges, golf rounds, and BOGO movie tickets. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹2,500 (Waived on ₹3,00,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'HDFC Diners Club Privilege Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for HDFC Diners Club Privilege Credit Card. Premium lifestyle card with Diners Club privileges, golf rounds, and BOGO movie tickets.',
      seo_keywords: 'hdfc diners club privilege credit card, apply hdfc credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 9, priority: 9
    },
    {
      name: 'HDFC Diners Club Black Credit Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: 'Ultra-premium super card with unlimited lounge access globally and 10X rewards on SmartBuy.',
      description: 'HDFC Diners Club Black Credit Card provides ultra-premium super card with unlimited lounge access globally and 10x rewards on smartbuy. Designed to offer max savings and convenience.',
      annual_fee: '₹10,000 (Waived on ₹5,00,000 annual spend)',
      features: [
        'Ultra-premium super card with unlimited lounge access globally and 10X rewards on SmartBuy.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Ultra-premium super card with unlimited lounge access globally and 10X rewards on SmartBuy. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 150000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹1,50,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹10,000 (Waived on ₹5,00,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'HDFC Diners Club Black Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for HDFC Diners Club Black Credit Card. Ultra-premium super card with unlimited lounge access globally and 10X rewards on SmartBuy.',
      seo_keywords: 'hdfc diners club black credit card, apply hdfc credit card',
      min_age: 21, max_age: 65, min_income: 150000, display_order: 10, priority: 10
    },
    {
      name: 'HDFC Infinia Credit Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: 'Flagship metal credit card with 1:1 reward redemption for flights and unlimited lounge access.',
      description: 'HDFC Infinia Credit Card provides flagship metal credit card with 1:1 reward redemption for flights and unlimited lounge access. Designed to offer max savings and convenience.',
      annual_fee: '₹12,500 (Waived on ₹10,00,000 annual spend)',
      features: [
        'Flagship metal credit card with 1:1 reward redemption for flights and unlimited lounge access.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Flagship metal credit card with 1:1 reward redemption for flights and unlimited lounge access. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹12,500 (Waived on ₹10,00,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'HDFC Infinia Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for HDFC Infinia Credit Card. Flagship metal credit card with 1:1 reward redemption for flights and unlimited lounge access.',
      seo_keywords: 'hdfc infinia credit card, apply hdfc credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 11, priority: 11
    },
    {
      name: 'Swiggy HDFC Bank Credit Card',
      category: 'co_branded_card',
      sub_category: 'Co-Branded Cards',
      short_description: '10% cashback on Swiggy food delivery, Instamart, and Dineout plus 5% on online apps.',
      description: 'Swiggy HDFC Bank Credit Card provides 10% cashback on swiggy food delivery, instamart, and dineout plus 5% on online apps. Designed to offer max savings and convenience.',
      annual_fee: '₹500 (Waived on ₹2,00,000 annual spend)',
      features: [
        '10% cashback on Swiggy food delivery, Instamart, and Dineout plus 5% on online apps.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: '10% cashback on Swiggy food delivery, Instamart, and Dineout plus 5% on online apps. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹500 (Waived on ₹2,00,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'Swiggy HDFC Bank Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for Swiggy HDFC Bank Credit Card. 10% cashback on Swiggy food delivery, Instamart, and Dineout plus 5% on online apps.',
      seo_keywords: 'swiggy hdfc bank credit card, apply hdfc credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 12, priority: 12
    },
    {
      name: 'Tata Neu Plus HDFC Credit Card',
      category: 'co_branded_card',
      sub_category: 'Co-Branded Cards',
      short_description: '2% NeuCoins on Tata Neu app purchases and Tata brands like Croma, BigBasket, and Westside.',
      description: 'Tata Neu Plus HDFC Credit Card provides 2% neucoins on tata neu app purchases and tata brands like croma, bigbasket, and westside. Designed to offer max savings and convenience.',
      annual_fee: '₹499 (Waived on ₹1,00,000 annual spend)',
      features: [
        '2% NeuCoins on Tata Neu app purchases and Tata brands like Croma, BigBasket, and Westside.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: '2% NeuCoins on Tata Neu app purchases and Tata brands like Croma, BigBasket, and Westside. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹499 (Waived on ₹1,00,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'Tata Neu Plus HDFC Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for Tata Neu Plus HDFC Credit Card. 2% NeuCoins on Tata Neu app purchases and Tata brands like Croma, BigBasket, and Westside.',
      seo_keywords: 'tata neu plus hdfc credit card, apply hdfc credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 13, priority: 13
    },
    {
      name: 'Tata Neu Infinity HDFC Credit Card',
      category: 'co_branded_card',
      sub_category: 'Co-Branded Cards',
      short_description: '5% NeuCoins on Tata brands, UPI transactions, and complimentary domestic & international lounge access.',
      description: 'Tata Neu Infinity HDFC Credit Card provides 5% neucoins on tata brands, upi transactions, and complimentary domestic & international lounge access. Designed to offer max savings and convenience.',
      annual_fee: '₹1,499 (Waived on ₹3,00,000 annual spend)',
      features: [
        '5% NeuCoins on Tata brands, UPI transactions, and complimentary domestic & international lounge access.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: '5% NeuCoins on Tata brands, UPI transactions, and complimentary domestic & international lounge access. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹1,499 (Waived on ₹3,00,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'Tata Neu Infinity HDFC Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for Tata Neu Infinity HDFC Credit Card. 5% NeuCoins on Tata brands, UPI transactions, and complimentary domestic & international lounge access.',
      seo_keywords: 'tata neu infinity hdfc credit card, apply hdfc credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 14, priority: 14
    },
    {
      name: 'IndianOil HDFC Bank Credit Card',
      category: 'co_branded_card',
      sub_category: 'Co-Branded Cards',
      short_description: 'Earn up to 50 Litres of free fuel annually at IndianOil outlets with Fuel Points.',
      description: 'IndianOil HDFC Bank Credit Card provides earn up to 50 litres of free fuel annually at indianoil outlets with fuel points. Designed to offer max savings and convenience.',
      annual_fee: '₹500 (Waived on ₹50,000 annual spend)',
      features: [
        'Earn up to 50 Litres of free fuel annually at IndianOil outlets with Fuel Points.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Earn up to 50 Litres of free fuel annually at IndianOil outlets with Fuel Points. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹500 (Waived on ₹50,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'IndianOil HDFC Bank Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for IndianOil HDFC Bank Credit Card. Earn up to 50 Litres of free fuel annually at IndianOil outlets with Fuel Points.',
      seo_keywords: 'indianoil hdfc bank credit card, apply hdfc credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 15, priority: 15
    },
    {
      name: 'IRCTC HDFC Bank Credit Card',
      category: 'co_branded_card',
      sub_category: 'Co-Branded Cards',
      short_description: '5X reward points on IRCTC train ticket bookings and executive railway lounge access.',
      description: 'IRCTC HDFC Bank Credit Card provides 5x reward points on irctc train ticket bookings and executive railway lounge access. Designed to offer max savings and convenience.',
      annual_fee: '₹500 (Waived on ₹1,50,000 annual spend)',
      features: [
        '5X reward points on IRCTC train ticket bookings and executive railway lounge access.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: '5X reward points on IRCTC train ticket bookings and executive railway lounge access. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹500 (Waived on ₹1,50,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'IRCTC HDFC Bank Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for IRCTC HDFC Bank Credit Card. 5X reward points on IRCTC train ticket bookings and executive railway lounge access.',
      seo_keywords: 'irctc hdfc bank credit card, apply hdfc credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 16, priority: 16
    },
    {
      name: 'Marriott Bonvoy HDFC Bank Credit Card',
      category: 'co_branded_card',
      sub_category: 'Co-Branded Cards',
      short_description: 'Complimentary Free Night Award every year, Marriott Silver Status, and airport lounge access.',
      description: 'Marriott Bonvoy HDFC Bank Credit Card provides complimentary free night award every year, marriott silver status, and airport lounge access. Designed to offer max savings and convenience.',
      annual_fee: '₹3,000 (No fee waiver)',
      features: [
        'Complimentary Free Night Award every year, Marriott Silver Status, and airport lounge access.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Complimentary Free Night Award every year, Marriott Silver Status, and airport lounge access. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹3,000 (No fee waiver) | Interest Rate: 3.49% p.m.',
      seo_title: 'Marriott Bonvoy HDFC Bank Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for Marriott Bonvoy HDFC Bank Credit Card. Complimentary Free Night Award every year, Marriott Silver Status, and airport lounge access.',
      seo_keywords: 'marriott bonvoy hdfc bank credit card, apply hdfc credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 17, priority: 17
    },
    {
      name: 'Shoppers Stop HDFC Credit Card',
      category: 'co_branded_card',
      sub_category: 'Co-Branded Cards',
      short_description: '3% First Citizen reward points on Shoppers Stop apparel and fashion shopping.',
      description: 'Shoppers Stop HDFC Credit Card provides 3% first citizen reward points on shoppers stop apparel and fashion shopping. Designed to offer max savings and convenience.',
      annual_fee: 'Lifetime Free',
      features: [
        '3% First Citizen reward points on Shoppers Stop apparel and fashion shopping.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: '3% First Citizen reward points on Shoppers Stop apparel and fashion shopping. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: Nil | Annual Fee: Lifetime Free | Interest Rate: 3.49% p.m.',
      seo_title: 'Shoppers Stop HDFC Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for Shoppers Stop HDFC Credit Card. 3% First Citizen reward points on Shoppers Stop apparel and fashion shopping.',
      seo_keywords: 'shoppers stop hdfc credit card, apply hdfc credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 18, priority: 18
    },
    {
      name: 'Shoppers Stop Black HDFC Credit Card',
      category: 'co_branded_card',
      sub_category: 'Co-Branded Cards',
      short_description: '7% First Citizen reward points, VIP shopping tier, and complimentary lounge access.',
      description: 'Shoppers Stop Black HDFC Credit Card provides 7% first citizen reward points, vip shopping tier, and complimentary lounge access. Designed to offer max savings and convenience.',
      annual_fee: '₹4,500 (Waived on ₹4,00,000 annual spend)',
      features: [
        '7% First Citizen reward points, VIP shopping tier, and complimentary lounge access.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: '7% First Citizen reward points, VIP shopping tier, and complimentary lounge access. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹4,500 (Waived on ₹4,00,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'Shoppers Stop Black HDFC Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for Shoppers Stop Black HDFC Credit Card. 7% First Citizen reward points, VIP shopping tier, and complimentary lounge access.',
      seo_keywords: 'shoppers stop black hdfc credit card, apply hdfc credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 19, priority: 19
    },
    {
      name: 'Paytm HDFC Credit Card',
      category: 'co_branded_card',
      sub_category: 'Co-Branded Cards',
      short_description: '3% cashback on Paytm app recharges, utility bill payments, and movie bookings.',
      description: 'Paytm HDFC Credit Card provides 3% cashback on paytm app recharges, utility bill payments, and movie bookings. Designed to offer max savings and convenience.',
      annual_fee: '₹500 (Waived on ₹50,000 annual spend)',
      features: [
        '3% cashback on Paytm app recharges, utility bill payments, and movie bookings.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: '3% cashback on Paytm app recharges, utility bill payments, and movie bookings. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹500 (Waived on ₹50,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'Paytm HDFC Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for Paytm HDFC Credit Card. 3% cashback on Paytm app recharges, utility bill payments, and movie bookings.',
      seo_keywords: 'paytm hdfc credit card, apply hdfc credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 20, priority: 20
    },
    {
      name: 'HDFC Credit Card Against Existing FD',
      category: 'fd_card',
      sub_category: 'Secured Cards',
      short_description: '100% instant approval against existing HDFC Fixed Deposit with zero income documents.',
      description: 'HDFC Credit Card Against Existing FD provides 100% instant approval against existing hdfc fixed deposit with zero income documents. Designed to offer max savings and convenience.',
      annual_fee: 'Lifetime Free',
      features: [
        '100% instant approval against existing HDFC Fixed Deposit with zero income documents.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: '100% instant approval against existing HDFC Fixed Deposit with zero income documents. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 18, max_age: 65, min_income: 0 },
      eligibility_criteria: 'Age 18-65 years. Monthly income ₹0+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: Nil | Annual Fee: Lifetime Free | Interest Rate: 3.49% p.m.',
      seo_title: 'HDFC Credit Card Against Existing FD – Apply Online | GharKaPaisa',
      seo_description: 'Apply for HDFC Credit Card Against Existing FD. 100% instant approval against existing HDFC Fixed Deposit with zero income documents.',
      seo_keywords: 'hdfc credit card against existing fd, apply hdfc credit card',
      min_age: 18, max_age: 65, min_income: 0, display_order: 21, priority: 21
    },
    {
      name: 'HDFC FD Based Credit Card',
      category: 'fd_card',
      sub_category: 'Secured Cards',
      short_description: 'Guaranteed credit card approval on opening a new HDFC Fixed Deposit.',
      description: 'HDFC FD Based Credit Card provides guaranteed credit card approval on opening a new hdfc fixed deposit. Designed to offer max savings and convenience.',
      annual_fee: 'Lifetime Free',
      features: [
        'Guaranteed credit card approval on opening a new HDFC Fixed Deposit.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Guaranteed credit card approval on opening a new HDFC Fixed Deposit. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 18, max_age: 65, min_income: 0 },
      eligibility_criteria: 'Age 18-65 years. Monthly income ₹0+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: Nil | Annual Fee: Lifetime Free | Interest Rate: 3.49% p.m.',
      seo_title: 'HDFC FD Based Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for HDFC FD Based Credit Card. Guaranteed credit card approval on opening a new HDFC Fixed Deposit.',
      seo_keywords: 'hdfc fd based credit card, apply hdfc credit card',
      min_age: 18, max_age: 65, min_income: 0, display_order: 22, priority: 22
    }
  ],

  SBI: [
    {
      name: 'SBI SimplySAVE Credit Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: '10X reward points on dining, movies, grocery shopping, and departmental store spends.',
      description: 'SBI SimplySAVE Credit Card provides 10x reward points on dining, movies, grocery shopping, and departmental store spends. Designed to offer max savings and convenience.',
      annual_fee: '₹499 (Waived on ₹1,00,000 annual spend)',
      features: [
        '10X reward points on dining, movies, grocery shopping, and departmental store spends.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: '10X reward points on dining, movies, grocery shopping, and departmental store spends. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹499 (Waived on ₹1,00,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'SBI SimplySAVE Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for SBI SimplySAVE Credit Card. 10X reward points on dining, movies, grocery shopping, and departmental store spends.',
      seo_keywords: 'sbi simplysave credit card, apply sbi credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 1, priority: 1
    },
    {
      name: 'SBI SimplyCLICK Credit Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: '10X reward points on online shopping with partner brands Amazon, BookMyShow, Cleartrip, Lenskart.',
      description: 'SBI SimplyCLICK Credit Card provides 10x reward points on online shopping with partner brands amazon, bookmyshow, cleartrip, lenskart. Designed to offer max savings and convenience.',
      annual_fee: '₹499 (Waived on ₹1,00,000 annual spend)',
      features: [
        '10X reward points on online shopping with partner brands Amazon, BookMyShow, Cleartrip, Lenskart.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: '10X reward points on online shopping with partner brands Amazon, BookMyShow, Cleartrip, Lenskart. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹499 (Waived on ₹1,00,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'SBI SimplyCLICK Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for SBI SimplyCLICK Credit Card. 10X reward points on online shopping with partner brands Amazon, BookMyShow, Cleartrip, Lenskart.',
      seo_keywords: 'sbi simplyclick credit card, apply sbi credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 2, priority: 2
    },
    {
      name: 'SBI PRIME Credit Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: 'Premium rewards credit card offering ₹3,000 welcome gift vouchers, lounge access, and milestone benefits.',
      description: 'SBI PRIME Credit Card provides premium rewards credit card offering ₹3,000 welcome gift vouchers, lounge access, and milestone benefits. Designed to offer max savings and convenience.',
      annual_fee: '₹2,999 (Waived on ₹3,00,000 annual spend)',
      features: [
        'Premium rewards credit card offering ₹3,000 welcome gift vouchers, lounge access, and milestone benefits.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Premium rewards credit card offering ₹3,000 welcome gift vouchers, lounge access, and milestone benefits. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹2,999 (Waived on ₹3,00,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'SBI PRIME Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for SBI PRIME Credit Card. Premium rewards credit card offering ₹3,000 welcome gift vouchers, lounge access, and milestone benefits.',
      seo_keywords: 'sbi prime credit card, apply sbi credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 3, priority: 3
    },
    {
      name: 'SBI Elite Credit Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: 'Super premium credit card with complimentary movie tickets worth ₹6,000/yr, Club Vistara membership, and lounge access.',
      description: 'SBI Elite Credit Card provides super premium credit card with complimentary movie tickets worth ₹6,000/yr, club vistara membership, and lounge access. Designed to offer max savings and convenience.',
      annual_fee: '₹4,999 (Waived on ₹10,00,000 annual spend)',
      features: [
        'Super premium credit card with complimentary movie tickets worth ₹6,000/yr, Club Vistara membership, and lounge access.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Super premium credit card with complimentary movie tickets worth ₹6,000/yr, Club Vistara membership, and lounge access. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹4,999 (Waived on ₹10,00,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'SBI Elite Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for SBI Elite Credit Card. Super premium credit card with complimentary movie tickets worth ₹6,000/yr, Club Vistara membership, and lounge access.',
      seo_keywords: 'sbi elite credit card, apply sbi credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 4, priority: 4
    },
    {
      name: 'SBI Pulse Credit Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: 'Health & fitness focused credit card with complimentary Noise smartwatch and Cult.pass LIVE membership.',
      description: 'SBI Pulse Credit Card provides health & fitness focused credit card with complimentary noise smartwatch and cult.pass live membership. Designed to offer max savings and convenience.',
      annual_fee: '₹1,499 (Waived on ₹2,00,000 annual spend)',
      features: [
        'Health & fitness focused credit card with complimentary Noise smartwatch and Cult.pass LIVE membership.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Health & fitness focused credit card with complimentary Noise smartwatch and Cult.pass LIVE membership. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹1,499 (Waived on ₹2,00,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'SBI Pulse Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for SBI Pulse Credit Card. Health & fitness focused credit card with complimentary Noise smartwatch and Cult.pass LIVE membership.',
      seo_keywords: 'sbi pulse credit card, apply sbi credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 5, priority: 5
    },
    {
      name: 'SBI Cashback Credit Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: '5% cashback on all online merchants without merchant restrictions.',
      description: 'SBI Cashback Credit Card provides 5% cashback on all online merchants without merchant restrictions. Designed to offer max savings and convenience.',
      annual_fee: '₹999 (Waived on ₹2,00,000 annual spend)',
      features: [
        '5% cashback on all online merchants without merchant restrictions.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: '5% cashback on all online merchants without merchant restrictions. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹999 (Waived on ₹2,00,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'SBI Cashback Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for SBI Cashback Credit Card. 5% cashback on all online merchants without merchant restrictions.',
      seo_keywords: 'sbi cashback credit card, apply sbi credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 6, priority: 6
    },
    {
      name: 'SBI Aurum Credit Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: 'Exclusive super-premium card with metal design, Flight & Apple vouchers, and dedicated concierge service.',
      description: 'SBI Aurum Credit Card provides exclusive super-premium card with metal design, flight & apple vouchers, and dedicated concierge service. Designed to offer max savings and convenience.',
      annual_fee: '₹9,999 (Waived on ₹12,00,000 annual spend)',
      features: [
        'Exclusive super-premium card with metal design, Flight & Apple vouchers, and dedicated concierge service.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Exclusive super-premium card with metal design, Flight & Apple vouchers, and dedicated concierge service. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹9,999 (Waived on ₹12,00,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'SBI Aurum Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for SBI Aurum Credit Card. Exclusive super-premium card with metal design, Flight & Apple vouchers, and dedicated concierge service.',
      seo_keywords: 'sbi aurum credit card, apply sbi credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 7, priority: 7
    },
    {
      name: 'SBI Unnati Credit Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: 'Everyday rewards card issued to build credit history with 1 reward point per ₹100 spend.',
      description: 'SBI Unnati Credit Card provides everyday rewards card issued to build credit history with 1 reward point per ₹100 spend. Designed to offer max savings and convenience.',
      annual_fee: 'Free for first 4 years (Then ₹499)',
      features: [
        'Everyday rewards card issued to build credit history with 1 reward point per ₹100 spend.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Everyday rewards card issued to build credit history with 1 reward point per ₹100 spend. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: Nil | Annual Fee: Free for first 4 years (Then ₹499) | Interest Rate: 3.49% p.m.',
      seo_title: 'SBI Unnati Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for SBI Unnati Credit Card. Everyday rewards card issued to build credit history with 1 reward point per ₹100 spend.',
      seo_keywords: 'sbi unnati credit card, apply sbi credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 8, priority: 8
    },
    {
      name: 'BPCL SBI Card',
      category: 'co_branded_card',
      sub_category: 'Co-Branded Cards',
      short_description: '4.25% valueback (13X reward points) on fuel transactions at Bharat Petroleum stations.',
      description: 'BPCL SBI Card provides 4.25% valueback (13x reward points) on fuel transactions at bharat petroleum stations. Designed to offer max savings and convenience.',
      annual_fee: '₹499 (Waived on ₹50,000 annual spend)',
      features: [
        '4.25% valueback (13X reward points) on fuel transactions at Bharat Petroleum stations.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: '4.25% valueback (13X reward points) on fuel transactions at Bharat Petroleum stations. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹499 (Waived on ₹50,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'BPCL SBI Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for BPCL SBI Card. 4.25% valueback (13X reward points) on fuel transactions at Bharat Petroleum stations.',
      seo_keywords: 'bpcl sbi card, apply sbi credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 9, priority: 9
    },
    {
      name: 'BPCL SBI Octane Card',
      category: 'co_branded_card',
      sub_category: 'Co-Branded Cards',
      short_description: '7.25% valueback (25X reward points) on BPCL fuel & lubricant purchases + domestic lounge access.',
      description: 'BPCL SBI Octane Card provides 7.25% valueback (25x reward points) on bpcl fuel & lubricant purchases + domestic lounge access. Designed to offer max savings and convenience.',
      annual_fee: '₹1,499 (Waived on ₹2,00,000 annual spend)',
      features: [
        '7.25% valueback (25X reward points) on BPCL fuel & lubricant purchases + domestic lounge access.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: '7.25% valueback (25X reward points) on BPCL fuel & lubricant purchases + domestic lounge access. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹1,499 (Waived on ₹2,00,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'BPCL SBI Octane Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for BPCL SBI Octane Card. 7.25% valueback (25X reward points) on BPCL fuel & lubricant purchases + domestic lounge access.',
      seo_keywords: 'bpcl sbi octane card, apply sbi credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 10, priority: 10
    },
    {
      name: 'IRCTC SBI Platinum Card',
      category: 'co_branded_card',
      sub_category: 'Co-Branded Cards',
      short_description: 'Up to 10% valueback as Reward Points on train ticket bookings via IRCTC website/app.',
      description: 'IRCTC SBI Platinum Card provides up to 10% valueback as reward points on train ticket bookings via irctc website/app. Designed to offer max savings and convenience.',
      annual_fee: '₹500 (Waived on ₹50,000 annual spend)',
      features: [
        'Up to 10% valueback as Reward Points on train ticket bookings via IRCTC website/app.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Up to 10% valueback as Reward Points on train ticket bookings via IRCTC website/app. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹500 (Waived on ₹50,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'IRCTC SBI Platinum Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for IRCTC SBI Platinum Card. Up to 10% valueback as Reward Points on train ticket bookings via IRCTC website/app.',
      seo_keywords: 'irctc sbi platinum card, apply sbi credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 11, priority: 11
    },
    {
      name: 'Air India SBI Signature Card',
      category: 'co_branded_card',
      sub_category: 'Co-Branded Cards',
      short_description: 'Up to 30 reward points per ₹100 spent on Air India ticket bookings and 20,000 welcome reward points.',
      description: 'Air India SBI Signature Card provides up to 30 reward points per ₹100 spent on air india ticket bookings and 20,000 welcome reward points. Designed to offer max savings and convenience.',
      annual_fee: '₹4,999 (No fee waiver)',
      features: [
        'Up to 30 reward points per ₹100 spent on Air India ticket bookings and 20,000 welcome reward points.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Up to 30 reward points per ₹100 spent on Air India ticket bookings and 20,000 welcome reward points. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹4,999 (No fee waiver) | Interest Rate: 3.49% p.m.',
      seo_title: 'Air India SBI Signature Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for Air India SBI Signature Card. Up to 30 reward points per ₹100 spent on Air India ticket bookings and 20,000 welcome reward points.',
      seo_keywords: 'air india sbi signature card, apply sbi credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 12, priority: 12
    },
    {
      name: 'Air India SBI Platinum Card',
      category: 'co_branded_card',
      sub_category: 'Co-Branded Cards',
      short_description: '15 reward points per ₹100 on Air India bookings and 5,000 welcome reward points.',
      description: 'Air India SBI Platinum Card provides 15 reward points per ₹100 on air india bookings and 5,000 welcome reward points. Designed to offer max savings and convenience.',
      annual_fee: '₹1,499 (No fee waiver)',
      features: [
        '15 reward points per ₹100 on Air India bookings and 5,000 welcome reward points.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: '15 reward points per ₹100 on Air India bookings and 5,000 welcome reward points. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹1,499 (No fee waiver) | Interest Rate: 3.49% p.m.',
      seo_title: 'Air India SBI Platinum Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for Air India SBI Platinum Card. 15 reward points per ₹100 on Air India bookings and 5,000 welcome reward points.',
      seo_keywords: 'air india sbi platinum card, apply sbi credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 13, priority: 13
    },
    {
      name: 'Apollo SBI Card',
      category: 'co_branded_card',
      sub_category: 'Co-Branded Cards',
      short_description: 'Up to 10% instant savings on medicines, lab tests, and health checkups at Apollo Pharmacy.',
      description: 'Apollo SBI Card provides up to 10% instant savings on medicines, lab tests, and health checkups at apollo pharmacy. Designed to offer max savings and convenience.',
      annual_fee: '₹499 (Waived on ₹1,00,000 annual spend)',
      features: [
        'Up to 10% instant savings on medicines, lab tests, and health checkups at Apollo Pharmacy.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Up to 10% instant savings on medicines, lab tests, and health checkups at Apollo Pharmacy. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹499 (Waived on ₹1,00,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'Apollo SBI Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for Apollo SBI Card. Up to 10% instant savings on medicines, lab tests, and health checkups at Apollo Pharmacy.',
      seo_keywords: 'apollo sbi card, apply sbi credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 14, priority: 14
    },
    {
      name: 'Reliance SBI Card',
      category: 'co_branded_card',
      sub_category: 'Co-Branded Cards',
      short_description: 'Accelerated reward points across Reliance Retail stores (Reliance Smart, Trends, Digital, JioMart).',
      description: 'Reliance SBI Card provides accelerated reward points across reliance retail stores (reliance smart, trends, digital, jiomart). Designed to offer max savings and convenience.',
      annual_fee: '₹499 (Waived on ₹1,00,000 annual spend)',
      features: [
        'Accelerated reward points across Reliance Retail stores (Reliance Smart, Trends, Digital, JioMart).',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Accelerated reward points across Reliance Retail stores (Reliance Smart, Trends, Digital, JioMart). 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹499 (Waived on ₹1,00,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'Reliance SBI Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for Reliance SBI Card. Accelerated reward points across Reliance Retail stores (Reliance Smart, Trends, Digital, JioMart).',
      seo_keywords: 'reliance sbi card, apply sbi credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 15, priority: 15
    },
    {
      name: 'SBI Secured Credit Card Against FD',
      category: 'fd_card',
      sub_category: 'Secured Cards',
      short_description: 'Secured credit card against SBI Fixed Deposit with 100% approval rate and no income proof.',
      description: 'SBI Secured Credit Card Against FD provides secured credit card against sbi fixed deposit with 100% approval rate and no income proof. Designed to offer max savings and convenience.',
      annual_fee: '₹499 (Waived on ₹50,000 annual spend)',
      features: [
        'Secured credit card against SBI Fixed Deposit with 100% approval rate and no income proof.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Secured credit card against SBI Fixed Deposit with 100% approval rate and no income proof. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 18, max_age: 65, min_income: 0 },
      eligibility_criteria: 'Age 18-65 years. Monthly income ₹0+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹499 (Waived on ₹50,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'SBI Secured Credit Card Against FD – Apply Online | GharKaPaisa',
      seo_description: 'Apply for SBI Secured Credit Card Against FD. Secured credit card against SBI Fixed Deposit with 100% approval rate and no income proof.',
      seo_keywords: 'sbi secured credit card against fd, apply sbi credit card',
      min_age: 18, max_age: 65, min_income: 0, display_order: 16, priority: 16
    }
  ],

  ICICI: [
    {
      name: 'ICICI Coral Credit Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: 'Earn 2X reward points on dining and shopping, discount on BookMyShow, and lounge access.',
      description: 'ICICI Coral Credit Card provides earn 2x reward points on dining and shopping, discount on bookmyshow, and lounge access. Designed to offer max savings and convenience.',
      annual_fee: '₹500 (Waived on ₹1,50,000 annual spend)',
      features: [
        'Earn 2X reward points on dining and shopping, discount on BookMyShow, and lounge access.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Earn 2X reward points on dining and shopping, discount on BookMyShow, and lounge access. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹500 (Waived on ₹1,50,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'ICICI Coral Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for ICICI Coral Credit Card. Earn 2X reward points on dining and shopping, discount on BookMyShow, and lounge access.',
      seo_keywords: 'icici coral credit card, apply icici credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 1, priority: 1
    },
    {
      name: 'ICICI Rubyx Credit Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: 'Dual-card privilege offering 25% off on movie tickets, golf rounds, and domestic lounge access.',
      description: 'ICICI Rubyx Credit Card provides dual-card privilege offering 25% off on movie tickets, golf rounds, and domestic lounge access. Designed to offer max savings and convenience.',
      annual_fee: '₹3,000 (Waived on ₹3,00,000 annual spend)',
      features: [
        'Dual-card privilege offering 25% off on movie tickets, golf rounds, and domestic lounge access.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Dual-card privilege offering 25% off on movie tickets, golf rounds, and domestic lounge access. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹3,000 (Waived on ₹3,00,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'ICICI Rubyx Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for ICICI Rubyx Credit Card. Dual-card privilege offering 25% off on movie tickets, golf rounds, and domestic lounge access.',
      seo_keywords: 'icici rubyx credit card, apply icici credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 2, priority: 2
    },
    {
      name: 'ICICI Sapphiro Credit Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: 'Premium travel and lifestyle card with complimentary lounge access, golf privileges, and BOGO movie tickets.',
      description: 'ICICI Sapphiro Credit Card provides premium travel and lifestyle card with complimentary lounge access, golf privileges, and bogo movie tickets. Designed to offer max savings and convenience.',
      annual_fee: '₹6,500 (Waived on ₹6,00,000 annual spend)',
      features: [
        'Premium travel and lifestyle card with complimentary lounge access, golf privileges, and BOGO movie tickets.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Premium travel and lifestyle card with complimentary lounge access, golf privileges, and BOGO movie tickets. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹6,500 (Waived on ₹6,00,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'ICICI Sapphiro Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for ICICI Sapphiro Credit Card. Premium travel and lifestyle card with complimentary lounge access, golf privileges, and BOGO movie tickets.',
      seo_keywords: 'icici sapphiro credit card, apply icici credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 3, priority: 3
    },
    {
      name: 'ICICI Emeralde Credit Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: 'Super-premium credit card with unlimited domestic & international lounge visits and zero cancellation fee on bookings.',
      description: 'ICICI Emeralde Credit Card provides super-premium credit card with unlimited domestic & international lounge visits and zero cancellation fee on bookings. Designed to offer max savings and convenience.',
      annual_fee: '₹12,000 (Waived on ₹10,00,000 annual spend)',
      features: [
        'Super-premium credit card with unlimited domestic & international lounge visits and zero cancellation fee on bookings.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Super-premium credit card with unlimited domestic & international lounge visits and zero cancellation fee on bookings. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 150000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹1,50,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹12,000 (Waived on ₹10,00,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'ICICI Emeralde Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for ICICI Emeralde Credit Card. Super-premium credit card with unlimited domestic & international lounge visits and zero cancellation fee on bookings.',
      seo_keywords: 'icici emeralde credit card, apply icici credit card',
      min_age: 21, max_age: 65, min_income: 150000, display_order: 4, priority: 4
    },
    {
      name: 'ICICI Platinum Chip Credit Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: 'Classic lifetime free shopping card with ICICI Culinary Treats dining discounts and fuel waiver.',
      description: 'ICICI Platinum Chip Credit Card provides classic lifetime free shopping card with icici culinary treats dining discounts and fuel waiver. Designed to offer max savings and convenience.',
      annual_fee: 'Lifetime Free',
      features: [
        'Classic lifetime free shopping card with ICICI Culinary Treats dining discounts and fuel waiver.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Classic lifetime free shopping card with ICICI Culinary Treats dining discounts and fuel waiver. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: Nil | Annual Fee: Lifetime Free | Interest Rate: 3.49% p.m.',
      seo_title: 'ICICI Platinum Chip Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for ICICI Platinum Chip Credit Card. Classic lifetime free shopping card with ICICI Culinary Treats dining discounts and fuel waiver.',
      seo_keywords: 'icici platinum chip credit card, apply icici credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 5, priority: 5
    },
    {
      name: 'ICICI HPCL Super Saver Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: '5% savings on HPCL fuel purchases, utility bills, and departmental store purchases.',
      description: 'ICICI HPCL Super Saver Card provides 5% savings on hpcl fuel purchases, utility bills, and departmental store purchases. Designed to offer max savings and convenience.',
      annual_fee: '₹500 (Waived on ₹1,50,000 annual spend)',
      features: [
        '5% savings on HPCL fuel purchases, utility bills, and departmental store purchases.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: '5% savings on HPCL fuel purchases, utility bills, and departmental store purchases. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹500 (Waived on ₹1,50,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'ICICI HPCL Super Saver Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for ICICI HPCL Super Saver Card. 5% savings on HPCL fuel purchases, utility bills, and departmental store purchases.',
      seo_keywords: 'icici hpcl super saver card, apply icici credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 6, priority: 6
    },
    {
      name: 'Amazon Pay ICICI Credit Card',
      category: 'co_branded_card',
      sub_category: 'Co-Branded Cards',
      short_description: '5% unlimited cashback for Amazon Prime members and 3% for non-Prime members credited to Amazon Pay balance.',
      description: 'Amazon Pay ICICI Credit Card provides 5% unlimited cashback for amazon prime members and 3% for non-prime members credited to amazon pay balance. Designed to offer max savings and convenience.',
      annual_fee: 'Lifetime Free',
      features: [
        '5% unlimited cashback for Amazon Prime members and 3% for non-Prime members credited to Amazon Pay balance.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: '5% unlimited cashback for Amazon Prime members and 3% for non-Prime members credited to Amazon Pay balance. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: Nil | Annual Fee: Lifetime Free | Interest Rate: 3.49% p.m.',
      seo_title: 'Amazon Pay ICICI Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for Amazon Pay ICICI Credit Card. 5% unlimited cashback for Amazon Prime members and 3% for non-Prime members credited to Amazon Pay balance.',
      seo_keywords: 'amazon pay icici credit card, apply icici credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 7, priority: 7
    },
    {
      name: 'MakeMyTrip ICICI Signature Card',
      category: 'co_branded_card',
      sub_category: 'Co-Branded Cards',
      short_description: 'Accelerated MyCash on MakeMyTrip hotel and flight bookings plus airport lounge access.',
      description: 'MakeMyTrip ICICI Signature Card provides accelerated mycash on makemytrip hotel and flight bookings plus airport lounge access. Designed to offer max savings and convenience.',
      annual_fee: '₹2,500 (Welcome MMT MyCash ₹1,500)',
      features: [
        'Accelerated MyCash on MakeMyTrip hotel and flight bookings plus airport lounge access.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Accelerated MyCash on MakeMyTrip hotel and flight bookings plus airport lounge access. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹2,500 (Welcome MMT MyCash ₹1,500) | Interest Rate: 3.49% p.m.',
      seo_title: 'MakeMyTrip ICICI Signature Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for MakeMyTrip ICICI Signature Card. Accelerated MyCash on MakeMyTrip hotel and flight bookings plus airport lounge access.',
      seo_keywords: 'makemytrip icici signature card, apply icici credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 8, priority: 8
    },
    {
      name: 'MakeMyTrip ICICI Platinum Card',
      category: 'co_branded_card',
      sub_category: 'Co-Branded Cards',
      short_description: 'Entry travel card with MyCash rewards on MakeMyTrip travel bookings.',
      description: 'MakeMyTrip ICICI Platinum Card provides entry travel card with mycash rewards on makemytrip travel bookings. Designed to offer max savings and convenience.',
      annual_fee: '₹500 (Welcome MMT MyCash ₹500)',
      features: [
        'Entry travel card with MyCash rewards on MakeMyTrip travel bookings.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Entry travel card with MyCash rewards on MakeMyTrip travel bookings. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹500 (Welcome MMT MyCash ₹500) | Interest Rate: 3.49% p.m.',
      seo_title: 'MakeMyTrip ICICI Platinum Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for MakeMyTrip ICICI Platinum Card. Entry travel card with MyCash rewards on MakeMyTrip travel bookings.',
      seo_keywords: 'makemytrip icici platinum card, apply icici credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 9, priority: 9
    },
    {
      name: 'Emirates Skywards ICICI Card',
      category: 'co_branded_card',
      sub_category: 'Co-Branded Cards',
      short_description: 'Earn Skywards Miles directly on all spends and enjoy Emirates Silver tier status perks.',
      description: 'Emirates Skywards ICICI Card provides earn skywards miles directly on all spends and enjoy emirates silver tier status perks. Designed to offer max savings and convenience.',
      annual_fee: '₹10,000 (Welcome Skywards Miles)',
      features: [
        'Earn Skywards Miles directly on all spends and enjoy Emirates Silver tier status perks.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Earn Skywards Miles directly on all spends and enjoy Emirates Silver tier status perks. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 150000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹1,50,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹10,000 (Welcome Skywards Miles) | Interest Rate: 3.49% p.m.',
      seo_title: 'Emirates Skywards ICICI Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for Emirates Skywards ICICI Card. Earn Skywards Miles directly on all spends and enjoy Emirates Silver tier status perks.',
      seo_keywords: 'emirates skywards icici card, apply icici credit card',
      min_age: 21, max_age: 65, min_income: 150000, display_order: 10, priority: 10
    },
    {
      name: 'Manchester United ICICI Card',
      category: 'co_branded_card',
      sub_category: 'Co-Branded Cards',
      short_description: 'Co-branded sports card offering discounts on official Manchester United merchandise and match trip entry.',
      description: 'Manchester United ICICI Card provides co-branded sports card offering discounts on official manchester united merchandise and match trip entry. Designed to offer max savings and convenience.',
      annual_fee: '₹499 (Waived on ₹1,50,000 annual spend)',
      features: [
        'Co-branded sports card offering discounts on official Manchester United merchandise and match trip entry.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Co-branded sports card offering discounts on official Manchester United merchandise and match trip entry. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹499 (Waived on ₹1,50,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'Manchester United ICICI Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for Manchester United ICICI Card. Co-branded sports card offering discounts on official Manchester United merchandise and match trip entry.',
      seo_keywords: 'manchester united icici card, apply icici credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 11, priority: 11
    },
    {
      name: 'ICICI FD Backed Credit Card',
      category: 'fd_card',
      sub_category: 'Secured Cards',
      short_description: 'Secured credit card against ICICI Fixed Deposit (Instant Platinum Chip / Coral FD card) with no income proof.',
      description: 'ICICI FD Backed Credit Card provides secured credit card against icici fixed deposit (instant platinum chip / coral fd card) with no income proof. Designed to offer max savings and convenience.',
      annual_fee: 'Lifetime Free',
      features: [
        'Secured credit card against ICICI Fixed Deposit (Instant Platinum Chip / Coral FD card) with no income proof.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Secured credit card against ICICI Fixed Deposit (Instant Platinum Chip / Coral FD card) with no income proof. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 18, max_age: 65, min_income: 0 },
      eligibility_criteria: 'Age 18-65 years. Monthly income ₹0+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: Nil | Annual Fee: Lifetime Free | Interest Rate: 3.49% p.m.',
      seo_title: 'ICICI FD Backed Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for ICICI FD Backed Credit Card. Secured credit card against ICICI Fixed Deposit (Instant Platinum Chip / Coral FD card) with no income proof.',
      seo_keywords: 'icici fd backed credit card, apply icici credit card',
      min_age: 18, max_age: 65, min_income: 0, display_order: 12, priority: 12
    }
  ],

  AXIS: [
    {
      name: 'Axis ACE Credit Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: '5% unlimited cashback on Google Pay utility bills and 2% unlimited cashback on Swiggy, Zomato, Ola.',
      description: 'Axis ACE Credit Card provides 5% unlimited cashback on google pay utility bills and 2% unlimited cashback on swiggy, zomato, ola. Designed to offer max savings and convenience.',
      annual_fee: '₹499 (Waived on ₹2,00,000 annual spend)',
      features: [
        '5% unlimited cashback on Google Pay utility bills and 2% unlimited cashback on Swiggy, Zomato, Ola.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: '5% unlimited cashback on Google Pay utility bills and 2% unlimited cashback on Swiggy, Zomato, Ola. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹499 (Waived on ₹2,00,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'Axis ACE Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for Axis ACE Credit Card. 5% unlimited cashback on Google Pay utility bills and 2% unlimited cashback on Swiggy, Zomato, Ola.',
      seo_keywords: 'axis ace credit card, apply axis credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 1, priority: 1
    },
    {
      name: 'Axis Neo Credit Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: 'Discounts on Zomato, BookMyShow, Paytm bill payments, and Amazon shopping.',
      description: 'Axis Neo Credit Card provides discounts on zomato, bookmyshow, paytm bill payments, and amazon shopping. Designed to offer max savings and convenience.',
      annual_fee: 'Lifetime Free',
      features: [
        'Discounts on Zomato, BookMyShow, Paytm bill payments, and Amazon shopping.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Discounts on Zomato, BookMyShow, Paytm bill payments, and Amazon shopping. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: Nil | Annual Fee: Lifetime Free | Interest Rate: 3.49% p.m.',
      seo_title: 'Axis Neo Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for Axis Neo Credit Card. Discounts on Zomato, BookMyShow, Paytm bill payments, and Amazon shopping.',
      seo_keywords: 'axis neo credit card, apply axis credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 2, priority: 2
    },
    {
      name: 'Axis Flipkart Credit Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: '5% unlimited cashback on Flipkart purchases and 1.5% on all online & offline spends.',
      description: 'Axis Flipkart Credit Card provides 5% unlimited cashback on flipkart purchases and 1.5% on all online & offline spends. Designed to offer max savings and convenience.',
      annual_fee: '₹500 (Waived on ₹3,50,000 annual spend)',
      features: [
        '5% unlimited cashback on Flipkart purchases and 1.5% on all online & offline spends.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: '5% unlimited cashback on Flipkart purchases and 1.5% on all online & offline spends. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹500 (Waived on ₹3,50,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'Axis Flipkart Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for Axis Flipkart Credit Card. 5% unlimited cashback on Flipkart purchases and 1.5% on all online & offline spends.',
      seo_keywords: 'axis flipkart credit card, apply axis credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 3, priority: 3
    },
    {
      name: 'Axis Select Credit Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: 'Premium lifestyle credit card with BigBasket & Swiggy discounts and complimentary lounge visits.',
      description: 'Axis Select Credit Card provides premium lifestyle credit card with bigbasket & swiggy discounts and complimentary lounge visits. Designed to offer max savings and convenience.',
      annual_fee: '₹3,000 (Waived on ₹8,00,000 annual spend)',
      features: [
        'Premium lifestyle credit card with BigBasket & Swiggy discounts and complimentary lounge visits.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Premium lifestyle credit card with BigBasket & Swiggy discounts and complimentary lounge visits. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹3,000 (Waived on ₹8,00,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'Axis Select Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for Axis Select Credit Card. Premium lifestyle credit card with BigBasket & Swiggy discounts and complimentary lounge visits.',
      seo_keywords: 'axis select credit card, apply axis credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 4, priority: 4
    },
    {
      name: 'Axis Magnus Credit Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: 'Luxury travel credit card offering 12 EDGE points per ₹200, unlimited airport lounge access, and concierge service.',
      description: 'Axis Magnus Credit Card provides luxury travel credit card offering 12 edge points per ₹200, unlimited airport lounge access, and concierge service. Designed to offer max savings and convenience.',
      annual_fee: '₹12,500 (Waived on ₹25,00,000 annual spend)',
      features: [
        'Luxury travel credit card offering 12 EDGE points per ₹200, unlimited airport lounge access, and concierge service.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Luxury travel credit card offering 12 EDGE points per ₹200, unlimited airport lounge access, and concierge service. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹12,500 (Waived on ₹25,00,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'Axis Magnus Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for Axis Magnus Credit Card. Luxury travel credit card offering 12 EDGE points per ₹200, unlimited airport lounge access, and concierge service.',
      seo_keywords: 'axis magnus credit card, apply axis credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 5, priority: 5
    },
    {
      name: 'Axis Reserve Credit Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: 'Ultra-exclusive luxury credit card with 50 guest lounge visits, Club Marriott membership, and chauffeured airport transfers.',
      description: 'Axis Reserve Credit Card provides ultra-exclusive luxury credit card with 50 guest lounge visits, club marriott membership, and chauffeured airport transfers. Designed to offer max savings and convenience.',
      annual_fee: '₹50,000 (Waived on ₹35,00,000 annual spend)',
      features: [
        'Ultra-exclusive luxury credit card with 50 guest lounge visits, Club Marriott membership, and chauffeured airport transfers.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Ultra-exclusive luxury credit card with 50 guest lounge visits, Club Marriott membership, and chauffeured airport transfers. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹50,000 (Waived on ₹35,00,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'Axis Reserve Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for Axis Reserve Credit Card. Ultra-exclusive luxury credit card with 50 guest lounge visits, Club Marriott membership, and chauffeured airport transfers.',
      seo_keywords: 'axis reserve credit card, apply axis credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 6, priority: 6
    },
    {
      name: 'Axis Privilege Credit Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: 'Double activation shopping vouchers worth ₹5,000 and milestone reward points.',
      description: 'Axis Privilege Credit Card provides double activation shopping vouchers worth ₹5,000 and milestone reward points. Designed to offer max savings and convenience.',
      annual_fee: '₹1,500 (Waived on ₹2,50,000 annual spend)',
      features: [
        'Double activation shopping vouchers worth ₹5,000 and milestone reward points.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Double activation shopping vouchers worth ₹5,000 and milestone reward points. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹1,500 (Waived on ₹2,50,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'Axis Privilege Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for Axis Privilege Credit Card. Double activation shopping vouchers worth ₹5,000 and milestone reward points.',
      seo_keywords: 'axis privilege credit card, apply axis credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 7, priority: 7
    },
    {
      name: 'Axis My Zone Credit Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: 'Buy 1 Get 1 free movie tickets on Paytm Movies, SonyLIV subscription, and Swiggy discounts.',
      description: 'Axis My Zone Credit Card provides buy 1 get 1 free movie tickets on paytm movies, sonyliv subscription, and swiggy discounts. Designed to offer max savings and convenience.',
      annual_fee: 'Lifetime Free',
      features: [
        'Buy 1 Get 1 free movie tickets on Paytm Movies, SonyLIV subscription, and Swiggy discounts.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Buy 1 Get 1 free movie tickets on Paytm Movies, SonyLIV subscription, and Swiggy discounts. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: Nil | Annual Fee: Lifetime Free | Interest Rate: 3.49% p.m.',
      seo_title: 'Axis My Zone Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for Axis My Zone Credit Card. Buy 1 Get 1 free movie tickets on Paytm Movies, SonyLIV subscription, and Swiggy discounts.',
      seo_keywords: 'axis my zone credit card, apply axis credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 8, priority: 8
    },
    {
      name: 'Flipkart Axis Bank Credit Card',
      category: 'co_branded_card',
      sub_category: 'Co-Branded Cards',
      short_description: '5% unlimited cashback on Flipkart & Myntra and 4 complimentary domestic airport lounge visits.',
      description: 'Flipkart Axis Bank Credit Card provides 5% unlimited cashback on flipkart & myntra and 4 complimentary domestic airport lounge visits. Designed to offer max savings and convenience.',
      annual_fee: '₹500 (Waived on ₹3,50,000 annual spend)',
      features: [
        '5% unlimited cashback on Flipkart & Myntra and 4 complimentary domestic airport lounge visits.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: '5% unlimited cashback on Flipkart & Myntra and 4 complimentary domestic airport lounge visits. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹500 (Waived on ₹3,50,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'Flipkart Axis Bank Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for Flipkart Axis Bank Credit Card. 5% unlimited cashback on Flipkart & Myntra and 4 complimentary domestic airport lounge visits.',
      seo_keywords: 'flipkart axis bank credit card, apply axis credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 9, priority: 9
    },
    {
      name: 'IndianOil Axis Bank Credit Card',
      category: 'co_branded_card',
      sub_category: 'Co-Branded Cards',
      short_description: '100% cashback up to ₹250 on first fuel transaction and 4% value back as Edge Points at IOCL outlets.',
      description: 'IndianOil Axis Bank Credit Card provides 100% cashback up to ₹250 on first fuel transaction and 4% value back as edge points at iocl outlets. Designed to offer max savings and convenience.',
      annual_fee: '₹500 (Waived on ₹50,00,0 annual spend)',
      features: [
        '100% cashback up to ₹250 on first fuel transaction and 4% value back as Edge Points at IOCL outlets.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: '100% cashback up to ₹250 on first fuel transaction and 4% value back as Edge Points at IOCL outlets. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹500 (Waived on ₹50,00,0 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'IndianOil Axis Bank Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for IndianOil Axis Bank Credit Card. 100% cashback up to ₹250 on first fuel transaction and 4% value back as Edge Points at IOCL outlets.',
      seo_keywords: 'indianoil axis bank credit card, apply axis credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 10, priority: 10
    },
    {
      name: 'Samsung Axis Bank Credit Card',
      category: 'co_branded_card',
      sub_category: 'Co-Branded Cards',
      short_description: '10% cashback across Samsung products, electronics, smartphones, and appliance purchases year-round.',
      description: 'Samsung Axis Bank Credit Card provides 10% cashback across samsung products, electronics, smartphones, and appliance purchases year-round. Designed to offer max savings and convenience.',
      annual_fee: '₹500 (Waived on ₹2,00,000 annual spend)',
      features: [
        '10% cashback across Samsung products, electronics, smartphones, and appliance purchases year-round.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: '10% cashback across Samsung products, electronics, smartphones, and appliance purchases year-round. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹500 (Waived on ₹2,00,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'Samsung Axis Bank Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for Samsung Axis Bank Credit Card. 10% cashback across Samsung products, electronics, smartphones, and appliance purchases year-round.',
      seo_keywords: 'samsung axis bank credit card, apply axis credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 11, priority: 11
    },
    {
      name: 'Airtel Axis Bank Credit Card',
      category: 'co_branded_card',
      sub_category: 'Co-Branded Cards',
      short_description: '25% cashback on Airtel mobile, DTH & Broadband bills, 10% on Swiggy, Zomato, BigBasket.',
      description: 'Airtel Axis Bank Credit Card provides 25% cashback on airtel mobile, dth & broadband bills, 10% on swiggy, zomato, bigbasket. Designed to offer max savings and convenience.',
      annual_fee: '₹500 (Waived on ₹2,00,000 annual spend)',
      features: [
        '25% cashback on Airtel mobile, DTH & Broadband bills, 10% on Swiggy, Zomato, BigBasket.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: '25% cashback on Airtel mobile, DTH & Broadband bills, 10% on Swiggy, Zomato, BigBasket. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹500 (Waived on ₹2,00,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'Airtel Axis Bank Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for Airtel Axis Bank Credit Card. 25% cashback on Airtel mobile, DTH & Broadband bills, 10% on Swiggy, Zomato, BigBasket.',
      seo_keywords: 'airtel axis bank credit card, apply axis credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 12, priority: 12
    },
    {
      name: 'Axis FD Credit Card',
      category: 'fd_card',
      sub_category: 'Secured Cards',
      short_description: 'Secured credit card issued instantly against Axis Fixed Deposit with no income verification.',
      description: 'Axis FD Credit Card provides secured credit card issued instantly against axis fixed deposit with no income verification. Designed to offer max savings and convenience.',
      annual_fee: 'Lifetime Free',
      features: [
        'Secured credit card issued instantly against Axis Fixed Deposit with no income verification.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Secured credit card issued instantly against Axis Fixed Deposit with no income verification. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 18, max_age: 65, min_income: 0 },
      eligibility_criteria: 'Age 18-65 years. Monthly income ₹0+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: Nil | Annual Fee: Lifetime Free | Interest Rate: 3.49% p.m.',
      seo_title: 'Axis FD Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for Axis FD Credit Card. Secured credit card issued instantly against Axis Fixed Deposit with no income verification.',
      seo_keywords: 'axis fd credit card, apply axis credit card',
      min_age: 18, max_age: 65, min_income: 0, display_order: 13, priority: 13
    }
  ],

  KOTAK: [
    {
      name: 'Kotak League Platinum Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: '8X reward points on select categories and movie ticket discounts via PVR vouchers.',
      description: 'Kotak League Platinum Card provides 8x reward points on select categories and movie ticket discounts via pvr vouchers. Designed to offer max savings and convenience.',
      annual_fee: '₹500 (Waived on ₹50,000 annual spend)',
      features: [
        '8X reward points on select categories and movie ticket discounts via PVR vouchers.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: '8X reward points on select categories and movie ticket discounts via PVR vouchers. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹500 (Waived on ₹50,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'Kotak League Platinum Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for Kotak League Platinum Card. 8X reward points on select categories and movie ticket discounts via PVR vouchers.',
      seo_keywords: 'kotak league platinum card, apply kotak credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 1, priority: 1
    },
    {
      name: 'Kotak Mojo Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: '2.5 Mojo Points per ₹100 spent online and airport lounge access benefits.',
      description: 'Kotak Mojo Card provides 2.5 mojo points per ₹100 spent online and airport lounge access benefits. Designed to offer max savings and convenience.',
      annual_fee: '₹1,000 (Waived on ₹1,00,000 annual spend)',
      features: [
        '2.5 Mojo Points per ₹100 spent online and airport lounge access benefits.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: '2.5 Mojo Points per ₹100 spent online and airport lounge access benefits. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹1,000 (Waived on ₹1,00,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'Kotak Mojo Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for Kotak Mojo Card. 2.5 Mojo Points per ₹100 spent online and airport lounge access benefits.',
      seo_keywords: 'kotak mojo card, apply kotak credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 2, priority: 2
    },
    {
      name: 'Kotak White Reserve Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: 'Exclusive luxury card earning White Pass value back on top premium brands and flights.',
      description: 'Kotak White Reserve Card provides exclusive luxury card earning white pass value back on top premium brands and flights. Designed to offer max savings and convenience.',
      annual_fee: '₹12,500 (Waived on ₹10,00,000 annual spend)',
      features: [
        'Exclusive luxury card earning White Pass value back on top premium brands and flights.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Exclusive luxury card earning White Pass value back on top premium brands and flights. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹12,500 (Waived on ₹10,00,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'Kotak White Reserve Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for Kotak White Reserve Card. Exclusive luxury card earning White Pass value back on top premium brands and flights.',
      seo_keywords: 'kotak white reserve card, apply kotak credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 3, priority: 3
    },
    {
      name: 'Kotak Zen Signature Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: '10 Zen points on apparel & shopping spends + domestic airport lounge access.',
      description: 'Kotak Zen Signature Card provides 10 zen points on apparel & shopping spends + domestic airport lounge access. Designed to offer max savings and convenience.',
      annual_fee: '₹1,500 (Waived on ₹1,50,000 annual spend)',
      features: [
        '10 Zen points on apparel & shopping spends + domestic airport lounge access.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: '10 Zen points on apparel & shopping spends + domestic airport lounge access. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹1,500 (Waived on ₹1,50,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'Kotak Zen Signature Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for Kotak Zen Signature Card. 10 Zen points on apparel & shopping spends + domestic airport lounge access.',
      seo_keywords: 'kotak zen signature card, apply kotak credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 4, priority: 4
    },
    {
      name: 'Kotak Royale Signature Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: '4X reward points on dining, travel, international spends and complimentary lounge access.',
      description: 'Kotak Royale Signature Card provides 4x reward points on dining, travel, international spends and complimentary lounge access. Designed to offer max savings and convenience.',
      annual_fee: '₹999 (Waived on ₹1,00,000 annual spend)',
      features: [
        '4X reward points on dining, travel, international spends and complimentary lounge access.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: '4X reward points on dining, travel, international spends and complimentary lounge access. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹999 (Waived on ₹1,00,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'Kotak Royale Signature Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for Kotak Royale Signature Card. 4X reward points on dining, travel, international spends and complimentary lounge access.',
      seo_keywords: 'kotak royale signature card, apply kotak credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 5, priority: 5
    },
    {
      name: 'Myntra Kotak Credit Card',
      category: 'co_branded_card',
      sub_category: 'Co-Branded Cards',
      short_description: '7.5% instant discount on Myntra app orders and 1.5% cashback on all other spends.',
      description: 'Myntra Kotak Credit Card provides 7.5% instant discount on myntra app orders and 1.5% cashback on all other spends. Designed to offer max savings and convenience.',
      annual_fee: '₹500 (Waived on ₹50,000 annual spend)',
      features: [
        '7.5% instant discount on Myntra app orders and 1.5% cashback on all other spends.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: '7.5% instant discount on Myntra app orders and 1.5% cashback on all other spends. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹500 (Waived on ₹50,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'Myntra Kotak Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for Myntra Kotak Credit Card. 7.5% instant discount on Myntra app orders and 1.5% cashback on all other spends.',
      seo_keywords: 'myntra kotak credit card, apply kotak credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 6, priority: 6
    },
    {
      name: 'PVR Kotak Credit Card',
      category: 'co_branded_card',
      sub_category: 'Co-Branded Cards',
      short_description: 'Free PVR movie tickets worth ₹400 every month on achieving spend milestone.',
      description: 'PVR Kotak Credit Card provides free pvr movie tickets worth ₹400 every month on achieving spend milestone. Designed to offer max savings and convenience.',
      annual_fee: '₹999 (Waived on ₹50,000 annual spend)',
      features: [
        'Free PVR movie tickets worth ₹400 every month on achieving spend milestone.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Free PVR movie tickets worth ₹400 every month on achieving spend milestone. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹999 (Waived on ₹50,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'PVR Kotak Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for PVR Kotak Credit Card. Free PVR movie tickets worth ₹400 every month on achieving spend milestone.',
      seo_keywords: 'pvr kotak credit card, apply kotak credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 7, priority: 7
    },
    {
      name: 'IndianOil Kotak Credit Card',
      category: 'co_branded_card',
      sub_category: 'Co-Branded Cards',
      short_description: '4% value back as reward points on fuel purchases at IndianOil petrol pumps.',
      description: 'IndianOil Kotak Credit Card provides 4% value back as reward points on fuel purchases at indianoil petrol pumps. Designed to offer max savings and convenience.',
      annual_fee: '₹499 (Waived on ₹50,000 annual spend)',
      features: [
        '4% value back as reward points on fuel purchases at IndianOil petrol pumps.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: '4% value back as reward points on fuel purchases at IndianOil petrol pumps. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹499 (Waived on ₹50,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'IndianOil Kotak Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for IndianOil Kotak Credit Card. 4% value back as reward points on fuel purchases at IndianOil petrol pumps.',
      seo_keywords: 'indianoil kotak credit card, apply kotak credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 8, priority: 8
    },
    {
      name: 'Kotak FD Credit Card',
      category: 'fd_card',
      sub_category: 'Secured Cards',
      short_description: '100% FD backed credit card (811 Dream Different) with zero annual fee and instant approval.',
      description: 'Kotak FD Credit Card provides 100% fd backed credit card (811 dream different) with zero annual fee and instant approval. Designed to offer max savings and convenience.',
      annual_fee: 'Lifetime Free',
      features: [
        '100% FD backed credit card (811 Dream Different) with zero annual fee and instant approval.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: '100% FD backed credit card (811 Dream Different) with zero annual fee and instant approval. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 18, max_age: 65, min_income: 0 },
      eligibility_criteria: 'Age 18-65 years. Monthly income ₹0+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: Nil | Annual Fee: Lifetime Free | Interest Rate: 3.49% p.m.',
      seo_title: 'Kotak FD Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for Kotak FD Credit Card. 100% FD backed credit card (811 Dream Different) with zero annual fee and instant approval.',
      seo_keywords: 'kotak fd credit card, apply kotak credit card',
      min_age: 18, max_age: 65, min_income: 0, display_order: 9, priority: 9
    }
  ],

  YES: [
    {
      name: 'YES Prosperity Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: 'Everyday reward points on dining and retail shopping with interest-free ATM withdrawals.',
      description: 'YES Prosperity Card provides everyday reward points on dining and retail shopping with interest-free atm withdrawals. Designed to offer max savings and convenience.',
      annual_fee: '₹399 (Waived on ₹50,000 annual spend)',
      features: [
        'Everyday reward points on dining and retail shopping with interest-free ATM withdrawals.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Everyday reward points on dining and retail shopping with interest-free ATM withdrawals. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹399 (Waived on ₹50,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'YES Prosperity Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for YES Prosperity Card. Everyday reward points on dining and retail shopping with interest-free ATM withdrawals.',
      seo_keywords: 'yes prosperity card, apply yes credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 1, priority: 1
    },
    {
      name: 'YES Elite+ Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: 'Accelerated reward points on online spends, dining, and complimentary lounge access.',
      description: 'YES Elite+ Card provides accelerated reward points on online spends, dining, and complimentary lounge access. Designed to offer max savings and convenience.',
      annual_fee: '₹999 (Waived on ₹1,00,000 annual spend)',
      features: [
        'Accelerated reward points on online spends, dining, and complimentary lounge access.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Accelerated reward points on online spends, dining, and complimentary lounge access. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹999 (Waived on ₹1,00,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'YES Elite+ Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for YES Elite+ Card. Accelerated reward points on online spends, dining, and complimentary lounge access.',
      seo_keywords: 'yes elite+ card, apply yes credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 2, priority: 2
    },
    {
      name: 'YES Wellness Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: 'Health & wellness perks including consultations, health checkups, and fitness discounts.',
      description: 'YES Wellness Card provides health & wellness perks including consultations, health checkups, and fitness discounts. Designed to offer max savings and convenience.',
      annual_fee: '₹1,499 (Waived on ₹2,00,000 annual spend)',
      features: [
        'Health & wellness perks including consultations, health checkups, and fitness discounts.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Health & wellness perks including consultations, health checkups, and fitness discounts. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹1,499 (Waived on ₹2,00,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'YES Wellness Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for YES Wellness Card. Health & wellness perks including consultations, health checkups, and fitness discounts.',
      seo_keywords: 'yes wellness card, apply yes credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 3, priority: 3
    },
    {
      name: 'YES Reserv Credit Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: '24 Reward Points per ₹200 spent on subscription & travel bookings + lounge access.',
      description: 'YES Reserv Credit Card provides 24 reward points per ₹200 spent on subscription & travel bookings + lounge access. Designed to offer max savings and convenience.',
      annual_fee: '₹1,999 (Waived on ₹3,00,000 annual spend)',
      features: [
        '24 Reward Points per ₹200 spent on subscription & travel bookings + lounge access.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: '24 Reward Points per ₹200 spent on subscription & travel bookings + lounge access. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹1,999 (Waived on ₹3,00,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'YES Reserv Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for YES Reserv Credit Card. 24 Reward Points per ₹200 spent on subscription & travel bookings + lounge access.',
      seo_keywords: 'yes reserv credit card, apply yes credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 4, priority: 4
    },
    {
      name: 'YES Marquee Credit Card',
      category: 'co_branded_card',
      sub_category: 'Co-Branded Cards',
      short_description: 'Ultra-premium card offering 36 Reward Points per ₹200 on online purchases and unlimited international lounge access.',
      description: 'YES Marquee Credit Card provides ultra-premium card offering 36 reward points per ₹200 on online purchases and unlimited international lounge access. Designed to offer max savings and convenience.',
      annual_fee: '₹9,999 (Waived on ₹12,00,000 annual spend)',
      features: [
        'Ultra-premium card offering 36 Reward Points per ₹200 on online purchases and unlimited international lounge access.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Ultra-premium card offering 36 Reward Points per ₹200 on online purchases and unlimited international lounge access. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹9,999 (Waived on ₹12,00,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'YES Marquee Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for YES Marquee Credit Card. Ultra-premium card offering 36 Reward Points per ₹200 on online purchases and unlimited international lounge access.',
      seo_keywords: 'yes marquee credit card, apply yes credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 5, priority: 5
    },
    {
      name: 'YES Paisabazaar Credit Card',
      category: 'co_branded_card',
      sub_category: 'Co-Branded Cards',
      short_description: 'Co-branded StepUp credit card with Paisabazaar offering cashback rewards and credit score build benefits.',
      description: 'YES Paisabazaar Credit Card provides co-branded stepup credit card with paisabazaar offering cashback rewards and credit score build benefits. Designed to offer max savings and convenience.',
      annual_fee: 'Lifetime Free',
      features: [
        'Co-branded StepUp credit card with Paisabazaar offering cashback rewards and credit score build benefits.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Co-branded StepUp credit card with Paisabazaar offering cashback rewards and credit score build benefits. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: Nil | Annual Fee: Lifetime Free | Interest Rate: 3.49% p.m.',
      seo_title: 'YES Paisabazaar Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for YES Paisabazaar Credit Card. Co-branded StepUp credit card with Paisabazaar offering cashback rewards and credit score build benefits.',
      seo_keywords: 'yes paisabazaar credit card, apply yes credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 6, priority: 6
    },
    {
      name: 'YES FD Backed Credit Card',
      category: 'fd_card',
      sub_category: 'Secured Cards',
      short_description: 'Secured credit card against YES Bank Fixed Deposit with instant digital onboarding.',
      description: 'YES FD Backed Credit Card provides secured credit card against yes bank fixed deposit with instant digital onboarding. Designed to offer max savings and convenience.',
      annual_fee: 'Lifetime Free',
      features: [
        'Secured credit card against YES Bank Fixed Deposit with instant digital onboarding.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Secured credit card against YES Bank Fixed Deposit with instant digital onboarding. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 18, max_age: 65, min_income: 0 },
      eligibility_criteria: 'Age 18-65 years. Monthly income ₹0+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: Nil | Annual Fee: Lifetime Free | Interest Rate: 3.49% p.m.',
      seo_title: 'YES FD Backed Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for YES FD Backed Credit Card. Secured credit card against YES Bank Fixed Deposit with instant digital onboarding.',
      seo_keywords: 'yes fd backed credit card, apply yes credit card',
      min_age: 18, max_age: 65, min_income: 0, display_order: 7, priority: 7
    }
  ],

  IDFC: [
    {
      name: 'IDFC FIRST Classic Credit Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: 'Lifetime free card offering 10X reward points on milestone spends, low interest rates, and roadside assistance.',
      description: 'IDFC FIRST Classic Credit Card provides lifetime free card offering 10x reward points on milestone spends, low interest rates, and roadside assistance. Designed to offer max savings and convenience.',
      annual_fee: 'Lifetime Free',
      features: [
        'Lifetime free card offering 10X reward points on milestone spends, low interest rates, and roadside assistance.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Lifetime free card offering 10X reward points on milestone spends, low interest rates, and roadside assistance. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: Nil | Annual Fee: Lifetime Free | Interest Rate: 3.49% p.m.',
      seo_title: 'IDFC FIRST Classic Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for IDFC FIRST Classic Credit Card. Lifetime free card offering 10X reward points on milestone spends, low interest rates, and roadside assistance.',
      seo_keywords: 'idfc first classic credit card, apply idfc credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 1, priority: 1
    },
    {
      name: 'IDFC FIRST Millennia Credit Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: 'Lifetime free card with 10X rewards on online shopping, lounge access, and interest-free cash withdrawal.',
      description: 'IDFC FIRST Millennia Credit Card provides lifetime free card with 10x rewards on online shopping, lounge access, and interest-free cash withdrawal. Designed to offer max savings and convenience.',
      annual_fee: 'Lifetime Free',
      features: [
        'Lifetime free card with 10X rewards on online shopping, lounge access, and interest-free cash withdrawal.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Lifetime free card with 10X rewards on online shopping, lounge access, and interest-free cash withdrawal. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: Nil | Annual Fee: Lifetime Free | Interest Rate: 3.49% p.m.',
      seo_title: 'IDFC FIRST Millennia Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for IDFC FIRST Millennia Credit Card. Lifetime free card with 10X rewards on online shopping, lounge access, and interest-free cash withdrawal.',
      seo_keywords: 'idfc first millennia credit card, apply idfc credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 2, priority: 2
    },
    {
      name: 'IDFC FIRST Select Credit Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: 'Premium lifetime free card with 10X rewards, domestic & international lounge access, and movie discounts.',
      description: 'IDFC FIRST Select Credit Card provides premium lifetime free card with 10x rewards, domestic & international lounge access, and movie discounts. Designed to offer max savings and convenience.',
      annual_fee: 'Lifetime Free',
      features: [
        'Premium lifetime free card with 10X rewards, domestic & international lounge access, and movie discounts.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Premium lifetime free card with 10X rewards, domestic & international lounge access, and movie discounts. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: Nil | Annual Fee: Lifetime Free | Interest Rate: 3.49% p.m.',
      seo_title: 'IDFC FIRST Select Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for IDFC FIRST Select Credit Card. Premium lifetime free card with 10X rewards, domestic & international lounge access, and movie discounts.',
      seo_keywords: 'idfc first select credit card, apply idfc credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 3, priority: 3
    },
    {
      name: 'IDFC FIRST Wealth Credit Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: 'Ultra-premium lifetime free card with 10X reward points, unlimited airport lounge access, and spa visits.',
      description: 'IDFC FIRST Wealth Credit Card provides ultra-premium lifetime free card with 10x reward points, unlimited airport lounge access, and spa visits. Designed to offer max savings and convenience.',
      annual_fee: 'Lifetime Free',
      features: [
        'Ultra-premium lifetime free card with 10X reward points, unlimited airport lounge access, and spa visits.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Ultra-premium lifetime free card with 10X reward points, unlimited airport lounge access, and spa visits. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: Nil | Annual Fee: Lifetime Free | Interest Rate: 3.49% p.m.',
      seo_title: 'IDFC FIRST Wealth Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for IDFC FIRST Wealth Credit Card. Ultra-premium lifetime free card with 10X reward points, unlimited airport lounge access, and spa visits.',
      seo_keywords: 'idfc first wealth credit card, apply idfc credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 4, priority: 4
    },
    {
      name: 'IDFC FIRST Ashva Credit Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: 'Metal design travel card with low 1% foreign forex markup and accelerated travel rewards.',
      description: 'IDFC FIRST Ashva Credit Card provides metal design travel card with low 1% foreign forex markup and accelerated travel rewards. Designed to offer max savings and convenience.',
      annual_fee: '₹2,999 (Waived on ₹3,00,000 annual spend)',
      features: [
        'Metal design travel card with low 1% foreign forex markup and accelerated travel rewards.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Metal design travel card with low 1% foreign forex markup and accelerated travel rewards. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹2,999 (Waived on ₹3,00,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'IDFC FIRST Ashva Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for IDFC FIRST Ashva Credit Card. Metal design travel card with low 1% foreign forex markup and accelerated travel rewards.',
      seo_keywords: 'idfc first ashva credit card, apply idfc credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 5, priority: 5
    },
    {
      name: 'IDFC FIRST Mayura Credit Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: 'Super-premium metal credit card with zero forex markup fee and unlimited airport lounge access.',
      description: 'IDFC FIRST Mayura Credit Card provides super-premium metal credit card with zero forex markup fee and unlimited airport lounge access. Designed to offer max savings and convenience.',
      annual_fee: '₹5,999 (Waived on ₹6,00,000 annual spend)',
      features: [
        'Super-premium metal credit card with zero forex markup fee and unlimited airport lounge access.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Super-premium metal credit card with zero forex markup fee and unlimited airport lounge access. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹5,999 (Waived on ₹6,00,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'IDFC FIRST Mayura Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for IDFC FIRST Mayura Credit Card. Super-premium metal credit card with zero forex markup fee and unlimited airport lounge access.',
      seo_keywords: 'idfc first mayura credit card, apply idfc credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 6, priority: 6
    },
    {
      name: 'FIRST WOW Card',
      category: 'co_branded_card',
      sub_category: 'Co-Branded Cards',
      short_description: 'Zero forex fee, guaranteed approval co-branded secured card with 4X reward points.',
      description: 'FIRST WOW Card provides zero forex fee, guaranteed approval co-branded secured card with 4x reward points. Designed to offer max savings and convenience.',
      annual_fee: 'Lifetime Free',
      features: [
        'Zero forex fee, guaranteed approval co-branded secured card with 4X reward points.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Zero forex fee, guaranteed approval co-branded secured card with 4X reward points. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: Nil | Annual Fee: Lifetime Free | Interest Rate: 3.49% p.m.',
      seo_title: 'FIRST WOW Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for FIRST WOW Card. Zero forex fee, guaranteed approval co-branded secured card with 4X reward points.',
      seo_keywords: 'first wow card, apply idfc credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 7, priority: 7
    },
    {
      name: 'IDFC FIRST WOW FD Credit Card',
      category: 'fd_card',
      sub_category: 'Secured Cards',
      short_description: 'Lifetime free FD-backed credit card with zero forex markup and 100% approval rate.',
      description: 'IDFC FIRST WOW FD Credit Card provides lifetime free fd-backed credit card with zero forex markup and 100% approval rate. Designed to offer max savings and convenience.',
      annual_fee: 'Lifetime Free',
      features: [
        'Lifetime free FD-backed credit card with zero forex markup and 100% approval rate.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Lifetime free FD-backed credit card with zero forex markup and 100% approval rate. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 18, max_age: 65, min_income: 0 },
      eligibility_criteria: 'Age 18-65 years. Monthly income ₹0+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: Nil | Annual Fee: Lifetime Free | Interest Rate: 3.49% p.m.',
      seo_title: 'IDFC FIRST WOW FD Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for IDFC FIRST WOW FD Credit Card. Lifetime free FD-backed credit card with zero forex markup and 100% approval rate.',
      seo_keywords: 'idfc first wow fd credit card, apply idfc credit card',
      min_age: 18, max_age: 65, min_income: 0, display_order: 8, priority: 8
    }
  ],

  BOB: [
    {
      name: 'BOB Prime Credit Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: '1% cashback on all spends, zero annual fee, and easy approval.',
      description: 'BOB Prime Credit Card provides 1% cashback on all spends, zero annual fee, and easy approval. Designed to offer max savings and convenience.',
      annual_fee: 'Lifetime Free',
      features: [
        '1% cashback on all spends, zero annual fee, and easy approval.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: '1% cashback on all spends, zero annual fee, and easy approval. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: Nil | Annual Fee: Lifetime Free | Interest Rate: 3.49% p.m.',
      seo_title: 'BOB Prime Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for BOB Prime Credit Card. 1% cashback on all spends, zero annual fee, and easy approval.',
      seo_keywords: 'bob prime credit card, apply bob credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 1, priority: 1
    },
    {
      name: 'BOB Eterna Credit Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: '7X reward points on travel, dining, and online shopping + unlimited lounge access.',
      description: 'BOB Eterna Credit Card provides 7x reward points on travel, dining, and online shopping + unlimited lounge access. Designed to offer max savings and convenience.',
      annual_fee: '₹2,499 (Waived on ₹2,50,000 annual spend)',
      features: [
        '7X reward points on travel, dining, and online shopping + unlimited lounge access.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: '7X reward points on travel, dining, and online shopping + unlimited lounge access. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹2,499 (Waived on ₹2,50,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'BOB Eterna Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for BOB Eterna Credit Card. 7X reward points on travel, dining, and online shopping + unlimited lounge access.',
      seo_keywords: 'bob eterna credit card, apply bob credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 2, priority: 2
    },
    {
      name: 'BOB Premier Credit Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: '5X reward points on travel, dining, and utility bill spends.',
      description: 'BOB Premier Credit Card provides 5x reward points on travel, dining, and utility bill spends. Designed to offer max savings and convenience.',
      annual_fee: '₹1,000 (Waived on ₹1,20,000 annual spend)',
      features: [
        '5X reward points on travel, dining, and utility bill spends.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: '5X reward points on travel, dining, and utility bill spends. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹1,000 (Waived on ₹1,20,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'BOB Premier Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for BOB Premier Credit Card. 5X reward points on travel, dining, and utility bill spends.',
      seo_keywords: 'bob premier credit card, apply bob credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 3, priority: 3
    },
    {
      name: 'BOB Easy Credit Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: '5X reward points on groceries, department store purchases, and movies.',
      description: 'BOB Easy Credit Card provides 5x reward points on groceries, department store purchases, and movies. Designed to offer max savings and convenience.',
      annual_fee: '₹500 (Waived on ₹35,000 annual spend)',
      features: [
        '5X reward points on groceries, department store purchases, and movies.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: '5X reward points on groceries, department store purchases, and movies. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹500 (Waived on ₹35,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'BOB Easy Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for BOB Easy Credit Card. 5X reward points on groceries, department store purchases, and movies.',
      seo_keywords: 'bob easy credit card, apply bob credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 4, priority: 4
    },
    {
      name: 'HPCL BOB ENERGIE Card',
      category: 'co_branded_card',
      sub_category: 'Co-Branded Cards',
      short_description: '24 reward points per ₹150 spent at HPCL fuel pumps and LPG cylinder refills.',
      description: 'HPCL BOB ENERGIE Card provides 24 reward points per ₹150 spent at hpcl fuel pumps and lpg cylinder refills. Designed to offer max savings and convenience.',
      annual_fee: '₹499 (Waived on ₹50,000 annual spend)',
      features: [
        '24 reward points per ₹150 spent at HPCL fuel pumps and LPG cylinder refills.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: '24 reward points per ₹150 spent at HPCL fuel pumps and LPG cylinder refills. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹499 (Waived on ₹50,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'HPCL BOB ENERGIE Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for HPCL BOB ENERGIE Card. 24 reward points per ₹150 spent at HPCL fuel pumps and LPG cylinder refills.',
      seo_keywords: 'hpcl bob energie card, apply bob credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 5, priority: 5
    },
    {
      name: 'IRCTC BOB Credit Card',
      category: 'co_branded_card',
      sub_category: 'Co-Branded Cards',
      short_description: 'Up to 40 reward points per ₹100 spent on IRCTC train ticket bookings.',
      description: 'IRCTC BOB Credit Card provides up to 40 reward points per ₹100 spent on irctc train ticket bookings. Designed to offer max savings and convenience.',
      annual_fee: '₹500 (Waived on ₹1,00,000 annual spend)',
      features: [
        'Up to 40 reward points per ₹100 spent on IRCTC train ticket bookings.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Up to 40 reward points per ₹100 spent on IRCTC train ticket bookings. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹500 (Waived on ₹1,00,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'IRCTC BOB Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for IRCTC BOB Credit Card. Up to 40 reward points per ₹100 spent on IRCTC train ticket bookings.',
      seo_keywords: 'irctc bob credit card, apply bob credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 6, priority: 6
    },
    {
      name: 'BOB FD Credit Card',
      category: 'fd_card',
      sub_category: 'Secured Cards',
      short_description: 'Secured credit card against Bank of Baroda Fixed Deposit with zero income verification.',
      description: 'BOB FD Credit Card provides secured credit card against bank of baroda fixed deposit with zero income verification. Designed to offer max savings and convenience.',
      annual_fee: 'Lifetime Free',
      features: [
        'Secured credit card against Bank of Baroda Fixed Deposit with zero income verification.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Secured credit card against Bank of Baroda Fixed Deposit with zero income verification. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 18, max_age: 65, min_income: 0 },
      eligibility_criteria: 'Age 18-65 years. Monthly income ₹0+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: Nil | Annual Fee: Lifetime Free | Interest Rate: 3.49% p.m.',
      seo_title: 'BOB FD Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for BOB FD Credit Card. Secured credit card against Bank of Baroda Fixed Deposit with zero income verification.',
      seo_keywords: 'bob fd credit card, apply bob credit card',
      min_age: 18, max_age: 65, min_income: 0, display_order: 7, priority: 7
    }
  ],

  FEDERAL: [
    {
      name: 'Federal Bank Celesta Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: 'Premium lifestyle credit card offering 3X rewards, airport lounge access, and golf games.',
      description: 'Federal Bank Celesta Card provides premium lifestyle credit card offering 3x rewards, airport lounge access, and golf games. Designed to offer max savings and convenience.',
      annual_fee: '₹3,000 (Waived on ₹3,00,000 annual spend)',
      features: [
        'Premium lifestyle credit card offering 3X rewards, airport lounge access, and golf games.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Premium lifestyle credit card offering 3X rewards, airport lounge access, and golf games. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹3,000 (Waived on ₹3,00,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'Federal Bank Celesta Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for Federal Bank Celesta Card. Premium lifestyle credit card offering 3X rewards, airport lounge access, and golf games.',
      seo_keywords: 'federal bank celesta card, apply federal credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 1, priority: 1
    },
    {
      name: 'Federal Bank Imperio Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: '3X rewards on groceries & healthcare, airport lounge visits, and dining discounts.',
      description: 'Federal Bank Imperio Card provides 3x rewards on groceries & healthcare, airport lounge visits, and dining discounts. Designed to offer max savings and convenience.',
      annual_fee: '₹1,500 (Waived on ₹1,50,000 annual spend)',
      features: [
        '3X rewards on groceries & healthcare, airport lounge visits, and dining discounts.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: '3X rewards on groceries & healthcare, airport lounge visits, and dining discounts. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹1,500 (Waived on ₹1,50,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'Federal Bank Imperio Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for Federal Bank Imperio Card. 3X rewards on groceries & healthcare, airport lounge visits, and dining discounts.',
      seo_keywords: 'federal bank imperio card, apply federal credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 2, priority: 2
    },
    {
      name: 'Federal Bank Signet Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: '3X rewards on electronics and apparel shopping with complimentary lounge access.',
      description: 'Federal Bank Signet Card provides 3x rewards on electronics and apparel shopping with complimentary lounge access. Designed to offer max savings and convenience.',
      annual_fee: '₹750 (Waived on ₹75,000 annual spend)',
      features: [
        '3X rewards on electronics and apparel shopping with complimentary lounge access.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: '3X rewards on electronics and apparel shopping with complimentary lounge access. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹750 (Waived on ₹75,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'Federal Bank Signet Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for Federal Bank Signet Card. 3X rewards on electronics and apparel shopping with complimentary lounge access.',
      seo_keywords: 'federal bank signet card, apply federal credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 3, priority: 3
    },
    {
      name: 'Federal Bank Scapia Credit Card',
      category: 'co_branded_card',
      sub_category: 'Co-Branded Cards',
      short_description: 'Zero forex markup travel card with 10% Scapia coins on all spends and unlimited lounge access.',
      description: 'Federal Bank Scapia Credit Card provides zero forex markup travel card with 10% scapia coins on all spends and unlimited lounge access. Designed to offer max savings and convenience.',
      annual_fee: 'Lifetime Free',
      features: [
        'Zero forex markup travel card with 10% Scapia coins on all spends and unlimited lounge access.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Zero forex markup travel card with 10% Scapia coins on all spends and unlimited lounge access. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: Nil | Annual Fee: Lifetime Free | Interest Rate: 3.49% p.m.',
      seo_title: 'Federal Bank Scapia Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for Federal Bank Scapia Credit Card. Zero forex markup travel card with 10% Scapia coins on all spends and unlimited lounge access.',
      seo_keywords: 'federal bank scapia credit card, apply federal credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 4, priority: 4
    },
    {
      name: 'Federal Bank OneCard',
      category: 'co_branded_card',
      sub_category: 'Co-Branded Cards',
      short_description: 'Metal credit card with zero annual fee, 5X rewards on top spend categories, and instant mobile app control.',
      description: 'Federal Bank OneCard provides metal credit card with zero annual fee, 5x rewards on top spend categories, and instant mobile app control. Designed to offer max savings and convenience.',
      annual_fee: 'Lifetime Free',
      features: [
        'Metal credit card with zero annual fee, 5X rewards on top spend categories, and instant mobile app control.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Metal credit card with zero annual fee, 5X rewards on top spend categories, and instant mobile app control. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: Nil | Annual Fee: Lifetime Free | Interest Rate: 3.49% p.m.',
      seo_title: 'Federal Bank OneCard – Apply Online | GharKaPaisa',
      seo_description: 'Apply for Federal Bank OneCard. Metal credit card with zero annual fee, 5X rewards on top spend categories, and instant mobile app control.',
      seo_keywords: 'federal bank onecard, apply federal credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 5, priority: 5
    },
    {
      name: 'Federal Bank FD Credit Card',
      category: 'fd_card',
      sub_category: 'Secured Cards',
      short_description: '100% instant approval card issued against Federal Bank Fixed Deposit.',
      description: 'Federal Bank FD Credit Card provides 100% instant approval card issued against federal bank fixed deposit. Designed to offer max savings and convenience.',
      annual_fee: 'Lifetime Free',
      features: [
        '100% instant approval card issued against Federal Bank Fixed Deposit.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: '100% instant approval card issued against Federal Bank Fixed Deposit. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 18, max_age: 65, min_income: 0 },
      eligibility_criteria: 'Age 18-65 years. Monthly income ₹0+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: Nil | Annual Fee: Lifetime Free | Interest Rate: 3.49% p.m.',
      seo_title: 'Federal Bank FD Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for Federal Bank FD Credit Card. 100% instant approval card issued against Federal Bank Fixed Deposit.',
      seo_keywords: 'federal bank fd credit card, apply federal credit card',
      min_age: 18, max_age: 65, min_income: 0, display_order: 6, priority: 6
    }
  ],

  RBL: [
    {
      name: 'RBL Platinum Maxima',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: '10X reward points on dining, entertainment, utility bill payments, and fuel.',
      description: 'RBL Platinum Maxima provides 10x reward points on dining, entertainment, utility bill payments, and fuel. Designed to offer max savings and convenience.',
      annual_fee: '₹2,000 (Waived on ₹2,50,000 annual spend)',
      features: [
        '10X reward points on dining, entertainment, utility bill payments, and fuel.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: '10X reward points on dining, entertainment, utility bill payments, and fuel. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹2,000 (Waived on ₹2,50,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'RBL Platinum Maxima – Apply Online | GharKaPaisa',
      seo_description: 'Apply for RBL Platinum Maxima. 10X reward points on dining, entertainment, utility bill payments, and fuel.',
      seo_keywords: 'rbl platinum maxima, apply rbl credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 1, priority: 1
    },
    {
      name: 'RBL World Safari Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: 'Zero forex markup credit card designed for international travelers with lounge access.',
      description: 'RBL World Safari Card provides zero forex markup credit card designed for international travelers with lounge access. Designed to offer max savings and convenience.',
      annual_fee: '₹3,000 (Waived on ₹5,00,000 annual spend)',
      features: [
        'Zero forex markup credit card designed for international travelers with lounge access.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Zero forex markup credit card designed for international travelers with lounge access. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹3,000 (Waived on ₹5,00,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'RBL World Safari Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for RBL World Safari Card. Zero forex markup credit card designed for international travelers with lounge access.',
      seo_keywords: 'rbl world safari card, apply rbl credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 2, priority: 2
    },
    {
      name: 'RBL Icon Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: 'Super-premium credit card offering 20 reward points per ₹100 spent, golf access, and lounge privileges.',
      description: 'RBL Icon Card provides super-premium credit card offering 20 reward points per ₹100 spent, golf access, and lounge privileges. Designed to offer max savings and convenience.',
      annual_fee: '₹5,000 (Waived on ₹8,00,000 annual spend)',
      features: [
        'Super-premium credit card offering 20 reward points per ₹100 spent, golf access, and lounge privileges.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Super-premium credit card offering 20 reward points per ₹100 spent, golf access, and lounge privileges. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹5,000 (Waived on ₹8,00,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'RBL Icon Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for RBL Icon Card. Super-premium credit card offering 20 reward points per ₹100 spent, golf access, and lounge privileges.',
      seo_keywords: 'rbl icon card, apply rbl credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 3, priority: 3
    },
    {
      name: 'RBL ShopRite Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: '20 reward points per ₹100 on grocery purchases and 10% off on movie tickets.',
      description: 'RBL ShopRite Card provides 20 reward points per ₹100 on grocery purchases and 10% off on movie tickets. Designed to offer max savings and convenience.',
      annual_fee: '₹500 (Waived on ₹1,50,000 annual spend)',
      features: [
        '20 reward points per ₹100 on grocery purchases and 10% off on movie tickets.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: '20 reward points per ₹100 on grocery purchases and 10% off on movie tickets. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹500 (Waived on ₹1,50,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'RBL ShopRite Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for RBL ShopRite Card. 20 reward points per ₹100 on grocery purchases and 10% off on movie tickets.',
      seo_keywords: 'rbl shoprite card, apply rbl credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 4, priority: 4
    },
    {
      name: 'Bajaj Finserv RBL Card',
      category: 'co_branded_card',
      sub_category: 'Co-Branded Cards',
      short_description: 'SuperCard features with emergency cash advance, interest-free personal loan facility, and reward points.',
      description: 'Bajaj Finserv RBL Card provides supercard features with emergency cash advance, interest-free personal loan facility, and reward points. Designed to offer max savings and convenience.',
      annual_fee: '₹999 (Waived on ₹1,00,000 annual spend)',
      features: [
        'SuperCard features with emergency cash advance, interest-free personal loan facility, and reward points.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'SuperCard features with emergency cash advance, interest-free personal loan facility, and reward points. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹999 (Waived on ₹1,00,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'Bajaj Finserv RBL Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for Bajaj Finserv RBL Card. SuperCard features with emergency cash advance, interest-free personal loan facility, and reward points.',
      seo_keywords: 'bajaj finserv rbl card, apply rbl credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 5, priority: 5
    },
    {
      name: 'BookMyShow RBL Card',
      category: 'co_branded_card',
      sub_category: 'Co-Branded Cards',
      short_description: 'Free movie tickets worth ₹500 every month on BookMyShow app.',
      description: 'BookMyShow RBL Card provides free movie tickets worth ₹500 every month on bookmyshow app. Designed to offer max savings and convenience.',
      annual_fee: '₹500 (Waived on ₹1,50,000 annual spend)',
      features: [
        'Free movie tickets worth ₹500 every month on BookMyShow app.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Free movie tickets worth ₹500 every month on BookMyShow app. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹500 (Waived on ₹1,50,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'BookMyShow RBL Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for BookMyShow RBL Card. Free movie tickets worth ₹500 every month on BookMyShow app.',
      seo_keywords: 'bookmyshow rbl card, apply rbl credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 6, priority: 6
    },
    {
      name: 'Zomato RBL Card',
      category: 'co_branded_card',
      sub_category: 'Co-Branded Cards',
      short_description: '5% Edition Cash on Zomato food orders and Blinkit grocery deliveries.',
      description: 'Zomato RBL Card provides 5% edition cash on zomato food orders and blinkit grocery deliveries. Designed to offer max savings and convenience.',
      annual_fee: '₹500 (Waived on ₹1,00,000 annual spend)',
      features: [
        '5% Edition Cash on Zomato food orders and Blinkit grocery deliveries.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: '5% Edition Cash on Zomato food orders and Blinkit grocery deliveries. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹500 (Waived on ₹1,00,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'Zomato RBL Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for Zomato RBL Card. 5% Edition Cash on Zomato food orders and Blinkit grocery deliveries.',
      seo_keywords: 'zomato rbl card, apply rbl credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 7, priority: 7
    },
    {
      name: 'RBL FD Credit Card',
      category: 'fd_card',
      sub_category: 'Secured Cards',
      short_description: 'Secured credit card against RBL Bank Fixed Deposit with guaranteed approval and zero income proof.',
      description: 'RBL FD Credit Card provides secured credit card against rbl bank fixed deposit with guaranteed approval and zero income proof. Designed to offer max savings and convenience.',
      annual_fee: 'Lifetime Free',
      features: [
        'Secured credit card against RBL Bank Fixed Deposit with guaranteed approval and zero income proof.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Secured credit card against RBL Bank Fixed Deposit with guaranteed approval and zero income proof. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 18, max_age: 65, min_income: 0 },
      eligibility_criteria: 'Age 18-65 years. Monthly income ₹0+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: Nil | Annual Fee: Lifetime Free | Interest Rate: 3.49% p.m.',
      seo_title: 'RBL FD Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for RBL FD Credit Card. Secured credit card against RBL Bank Fixed Deposit with guaranteed approval and zero income proof.',
      seo_keywords: 'rbl fd credit card, apply rbl credit card',
      min_age: 18, max_age: 65, min_income: 0, display_order: 8, priority: 8
    }
  ],

  EQUITAS: [
    {
      name: 'Equitas Credit Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: 'Entry-level rewards card with cashback on daily grocery, fuel, and utility bill spends.',
      description: 'Equitas Credit Card provides entry-level rewards card with cashback on daily grocery, fuel, and utility bill spends. Designed to offer max savings and convenience.',
      annual_fee: '₹499 (Waived on ₹50,000 annual spend)',
      features: [
        'Entry-level rewards card with cashback on daily grocery, fuel, and utility bill spends.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Entry-level rewards card with cashback on daily grocery, fuel, and utility bill spends. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹499 (Waived on ₹50,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'Equitas Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for Equitas Credit Card. Entry-level rewards card with cashback on daily grocery, fuel, and utility bill spends.',
      seo_keywords: 'equitas credit card, apply equitas credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 1, priority: 1
    },
    {
      name: 'Equitas Privilege Credit Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: 'Accelerated reward points on dining & travel, airport lounge access, and movie discounts.',
      description: 'Equitas Privilege Credit Card provides accelerated reward points on dining & travel, airport lounge access, and movie discounts. Designed to offer max savings and convenience.',
      annual_fee: '₹1,000 (Waived on ₹1,50,000 annual spend)',
      features: [
        'Accelerated reward points on dining & travel, airport lounge access, and movie discounts.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Accelerated reward points on dining & travel, airport lounge access, and movie discounts. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹1,000 (Waived on ₹1,50,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'Equitas Privilege Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for Equitas Privilege Credit Card. Accelerated reward points on dining & travel, airport lounge access, and movie discounts.',
      seo_keywords: 'equitas privilege credit card, apply equitas credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 2, priority: 2
    },
    {
      name: 'Equitas FD Credit Card',
      category: 'fd_card',
      sub_category: 'Secured Cards',
      short_description: 'Secured credit card against Equitas Small Finance Bank Fixed Deposit with 100% instant approval.',
      description: 'Equitas FD Credit Card provides secured credit card against equitas small finance bank fixed deposit with 100% instant approval. Designed to offer max savings and convenience.',
      annual_fee: 'Lifetime Free',
      features: [
        'Secured credit card against Equitas Small Finance Bank Fixed Deposit with 100% instant approval.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Secured credit card against Equitas Small Finance Bank Fixed Deposit with 100% instant approval. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 18, max_age: 65, min_income: 0 },
      eligibility_criteria: 'Age 18-65 years. Monthly income ₹0+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: Nil | Annual Fee: Lifetime Free | Interest Rate: 3.49% p.m.',
      seo_title: 'Equitas FD Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for Equitas FD Credit Card. Secured credit card against Equitas Small Finance Bank Fixed Deposit with 100% instant approval.',
      seo_keywords: 'equitas fd credit card, apply equitas credit card',
      min_age: 18, max_age: 65, min_income: 0, display_order: 3, priority: 3
    }
  ],

  DCB: [
    {
      name: 'DCB Platinum Credit Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: 'Classic shopping card offering cash rewards on everyday purchases and utility bill payments.',
      description: 'DCB Platinum Credit Card provides classic shopping card offering cash rewards on everyday purchases and utility bill payments. Designed to offer max savings and convenience.',
      annual_fee: '₹499 (Waived on ₹50,000 annual spend)',
      features: [
        'Classic shopping card offering cash rewards on everyday purchases and utility bill payments.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Classic shopping card offering cash rewards on everyday purchases and utility bill payments. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹499 (Waived on ₹50,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'DCB Platinum Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for DCB Platinum Credit Card. Classic shopping card offering cash rewards on everyday purchases and utility bill payments.',
      seo_keywords: 'dcb platinum credit card, apply dcb credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 1, priority: 1
    },
    {
      name: 'DCB Signature Credit Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: 'Premium rewards credit card with domestic lounge access and dining privileges.',
      description: 'DCB Signature Credit Card provides premium rewards credit card with domestic lounge access and dining privileges. Designed to offer max savings and convenience.',
      annual_fee: '₹1,499 (Waived on ₹1,50,000 annual spend)',
      features: [
        'Premium rewards credit card with domestic lounge access and dining privileges.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Premium rewards credit card with domestic lounge access and dining privileges. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹1,499 (Waived on ₹1,50,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'DCB Signature Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for DCB Signature Credit Card. Premium rewards credit card with domestic lounge access and dining privileges.',
      seo_keywords: 'dcb signature credit card, apply dcb credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 2, priority: 2
    },
    {
      name: 'DCB Infinite Credit Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: 'Super-premium credit card with dedicated concierge services, golf access, and air travel perks.',
      description: 'DCB Infinite Credit Card provides super-premium credit card with dedicated concierge services, golf access, and air travel perks. Designed to offer max savings and convenience.',
      annual_fee: '₹4,999 (Waived on ₹5,00,000 annual spend)',
      features: [
        'Super-premium credit card with dedicated concierge services, golf access, and air travel perks.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Super-premium credit card with dedicated concierge services, golf access, and air travel perks. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹4,999 (Waived on ₹5,00,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'DCB Infinite Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for DCB Infinite Credit Card. Super-premium credit card with dedicated concierge services, golf access, and air travel perks.',
      seo_keywords: 'dcb infinite credit card, apply dcb credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 3, priority: 3
    },
    {
      name: 'DCB FD Credit Card',
      category: 'fd_card',
      sub_category: 'Secured Cards',
      short_description: 'Secured credit card issued against DCB Fixed Deposit with no credit score check.',
      description: 'DCB FD Credit Card provides secured credit card issued against dcb fixed deposit with no credit score check. Designed to offer max savings and convenience.',
      annual_fee: 'Lifetime Free',
      features: [
        'Secured credit card issued against DCB Fixed Deposit with no credit score check.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Secured credit card issued against DCB Fixed Deposit with no credit score check. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 18, max_age: 65, min_income: 0 },
      eligibility_criteria: 'Age 18-65 years. Monthly income ₹0+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: Nil | Annual Fee: Lifetime Free | Interest Rate: 3.49% p.m.',
      seo_title: 'DCB FD Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for DCB FD Credit Card. Secured credit card issued against DCB Fixed Deposit with no credit score check.',
      seo_keywords: 'dcb fd credit card, apply dcb credit card',
      min_age: 18, max_age: 65, min_income: 0, display_order: 4, priority: 4
    }
  ],

  INDUSIND: [
    {
      name: 'IndusInd Legend Credit Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: 'Exclusive travel, dining and golfing privileges with unlimited domestic lounge access.',
      description: 'IndusInd Legend Credit Card provides exclusive travel, dining and golfing privileges with unlimited domestic lounge access. Designed to offer max savings and convenience.',
      annual_fee: 'Lifetime Free',
      features: [
        'Exclusive travel, dining and golfing privileges with unlimited domestic lounge access.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Exclusive travel, dining and golfing privileges with unlimited domestic lounge access. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: Nil | Annual Fee: Lifetime Free | Interest Rate: 3.49% p.m.',
      seo_title: 'IndusInd Legend Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for IndusInd Legend Credit Card. Exclusive travel, dining and golfing privileges with unlimited domestic lounge access.',
      seo_keywords: 'indusind legend credit card, apply indusind credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 1, priority: 1
    },
    {
      name: 'IndusInd Platinum Aura Edge',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: 'Customizable reward plans across dining, shopping, travel, and utility bill spends.',
      description: 'IndusInd Platinum Aura Edge provides customizable reward plans across dining, shopping, travel, and utility bill spends. Designed to offer max savings and convenience.',
      annual_fee: '₹500 (Waived on ₹50,000 annual spend)',
      features: [
        'Customizable reward plans across dining, shopping, travel, and utility bill spends.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Customizable reward plans across dining, shopping, travel, and utility bill spends. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹500 (Waived on ₹50,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'IndusInd Platinum Aura Edge – Apply Online | GharKaPaisa',
      seo_description: 'Apply for IndusInd Platinum Aura Edge. Customizable reward plans across dining, shopping, travel, and utility bill spends.',
      seo_keywords: 'indusind platinum aura edge, apply indusind credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 2, priority: 2
    },
    {
      name: 'IndusInd Pinnacle Credit Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: 'Super-premium credit card with 2.5 reward points per ₹100, golf rounds, and complimentary flight vouchers.',
      description: 'IndusInd Pinnacle Credit Card provides super-premium credit card with 2.5 reward points per ₹100, golf rounds, and complimentary flight vouchers. Designed to offer max savings and convenience.',
      annual_fee: '₹12,000 (No annual fee from 2nd year)',
      features: [
        'Super-premium credit card with 2.5 reward points per ₹100, golf rounds, and complimentary flight vouchers.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Super-premium credit card with 2.5 reward points per ₹100, golf rounds, and complimentary flight vouchers. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 150000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹1,50,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹12,000 (No annual fee from 2nd year) | Interest Rate: 3.49% p.m.',
      seo_title: 'IndusInd Pinnacle Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for IndusInd Pinnacle Credit Card. Super-premium credit card with 2.5 reward points per ₹100, golf rounds, and complimentary flight vouchers.',
      seo_keywords: 'indusind pinnacle credit card, apply indusind credit card',
      min_age: 21, max_age: 65, min_income: 150000, display_order: 3, priority: 3
    },
    {
      name: 'IndusInd Nexxt Credit Card',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: 'Interactive credit card with built-in LED buttons to switch between Payment Options (Credit, Rewards, EMI).',
      description: 'IndusInd Nexxt Credit Card provides interactive credit card with built-in led buttons to switch between payment options (credit, rewards, emi). Designed to offer max savings and convenience.',
      annual_fee: '₹1,499 (Waived on ₹1,50,000 annual spend)',
      features: [
        'Interactive credit card with built-in LED buttons to switch between Payment Options (Credit, Rewards, EMI).',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Interactive credit card with built-in LED buttons to switch between Payment Options (Credit, Rewards, EMI). 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹1,499 (Waived on ₹1,50,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'IndusInd Nexxt Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for IndusInd Nexxt Credit Card. Interactive credit card with built-in LED buttons to switch between Payment Options (Credit, Rewards, EMI).',
      seo_keywords: 'indusind nexxt credit card, apply indusind credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 4, priority: 4
    },
    {
      name: 'IndusInd Avios Visa Infinite',
      category: 'credit_card',
      sub_category: 'Core Cards',
      short_description: 'Ultra-luxurious airline card earning British Airways & Qatar Airways Avios points directly on spends.',
      description: 'IndusInd Avios Visa Infinite provides ultra-luxurious airline card earning british airways & qatar airways avios points directly on spends. Designed to offer max savings and convenience.',
      annual_fee: '₹40,000 (Welcome Avios points)',
      features: [
        'Ultra-luxurious airline card earning British Airways & Qatar Airways Avios points directly on spends.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Ultra-luxurious airline card earning British Airways & Qatar Airways Avios points directly on spends. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 150000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹1,50,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹40,000 (Welcome Avios points) | Interest Rate: 3.49% p.m.',
      seo_title: 'IndusInd Avios Visa Infinite – Apply Online | GharKaPaisa',
      seo_description: 'Apply for IndusInd Avios Visa Infinite. Ultra-luxurious airline card earning British Airways & Qatar Airways Avios points directly on spends.',
      seo_keywords: 'indusind avios visa infinite, apply indusind credit card',
      min_age: 21, max_age: 65, min_income: 150000, display_order: 5, priority: 5
    },
    {
      name: 'IndusInd EazyDiner Card',
      category: 'co_branded_card',
      sub_category: 'Co-Branded Cards',
      short_description: '25% extra discount up to ₹1,000 on EazyDiner dining payments + complimentary EazyDiner Prime membership.',
      description: 'IndusInd EazyDiner Card provides 25% extra discount up to ₹1,000 on eazydiner dining payments + complimentary eazydiner prime membership. Designed to offer max savings and convenience.',
      annual_fee: '₹1,999 (Waived on ₹2,00,000 annual spend)',
      features: [
        '25% extra discount up to ₹1,000 on EazyDiner dining payments + complimentary EazyDiner Prime membership.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: '25% extra discount up to ₹1,000 on EazyDiner dining payments + complimentary EazyDiner Prime membership. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹1,999 (Waived on ₹2,00,000 annual spend) | Interest Rate: 3.49% p.m.',
      seo_title: 'IndusInd EazyDiner Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for IndusInd EazyDiner Card. 25% extra discount up to ₹1,000 on EazyDiner dining payments + complimentary EazyDiner Prime membership.',
      seo_keywords: 'indusind eazydiner card, apply indusind credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 6, priority: 6
    },
    {
      name: 'IndusInd Club Vistara Explorer',
      category: 'co_branded_card',
      sub_category: 'Co-Branded Cards',
      short_description: 'Complimentary Business Class flight tickets, Club Vistara Gold status, and zero forex fee.',
      description: 'IndusInd Club Vistara Explorer provides complimentary business class flight tickets, club vistara gold status, and zero forex fee. Designed to offer max savings and convenience.',
      annual_fee: '₹40,000 (Welcome Business Class ticket)',
      features: [
        'Complimentary Business Class flight tickets, Club Vistara Gold status, and zero forex fee.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Complimentary Business Class flight tickets, Club Vistara Gold status, and zero forex fee. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 150000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹1,50,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹40,000 (Welcome Business Class ticket) | Interest Rate: 3.49% p.m.',
      seo_title: 'IndusInd Club Vistara Explorer – Apply Online | GharKaPaisa',
      seo_description: 'Apply for IndusInd Club Vistara Explorer. Complimentary Business Class flight tickets, Club Vistara Gold status, and zero forex fee.',
      seo_keywords: 'indusind club vistara explorer, apply indusind credit card',
      min_age: 21, max_age: 65, min_income: 150000, display_order: 7, priority: 7
    },
    {
      name: 'IndusInd Club Vistara Pioneer',
      category: 'co_branded_card',
      sub_category: 'Co-Branded Cards',
      short_description: 'Complimentary Premium Economy flight tickets and Club Vistara Silver status.',
      description: 'IndusInd Club Vistara Pioneer provides complimentary premium economy flight tickets and club vistara silver status. Designed to offer max savings and convenience.',
      annual_fee: '₹10,000 (Welcome Premium Economy ticket)',
      features: [
        'Complimentary Premium Economy flight tickets and Club Vistara Silver status.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Complimentary Premium Economy flight tickets and Club Vistara Silver status. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 150000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹1,50,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: As per card policy | Annual Fee: ₹10,000 (Welcome Premium Economy ticket) | Interest Rate: 3.49% p.m.',
      seo_title: 'IndusInd Club Vistara Pioneer – Apply Online | GharKaPaisa',
      seo_description: 'Apply for IndusInd Club Vistara Pioneer. Complimentary Premium Economy flight tickets and Club Vistara Silver status.',
      seo_keywords: 'indusind club vistara pioneer, apply indusind credit card',
      min_age: 21, max_age: 65, min_income: 150000, display_order: 8, priority: 8
    },
    {
      name: 'IndusInd Samman RuPay Card',
      category: 'co_branded_card',
      sub_category: 'Co-Branded Cards',
      short_description: 'Government employee special RuPay credit card with UPI linkability and cashback benefits.',
      description: 'IndusInd Samman RuPay Card provides government employee special rupay credit card with upi linkability and cashback benefits. Designed to offer max savings and convenience.',
      annual_fee: 'Lifetime Free',
      features: [
        'Government employee special RuPay credit card with UPI linkability and cashback benefits.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Government employee special RuPay credit card with UPI linkability and cashback benefits. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 21, max_age: 65, min_income: 25000 },
      eligibility_criteria: 'Age 21-65 years. Monthly income ₹25,000+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: Nil | Annual Fee: Lifetime Free | Interest Rate: 3.49% p.m.',
      seo_title: 'IndusInd Samman RuPay Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for IndusInd Samman RuPay Card. Government employee special RuPay credit card with UPI linkability and cashback benefits.',
      seo_keywords: 'indusind samman rupay card, apply indusind credit card',
      min_age: 21, max_age: 65, min_income: 25000, display_order: 9, priority: 9
    },
    {
      name: 'IndusInd FD Credit Card',
      category: 'fd_card',
      sub_category: 'Secured Cards',
      short_description: 'Secured credit card against IndusInd Fixed Deposit with zero income verification and lifetime free benefits.',
      description: 'IndusInd FD Credit Card provides secured credit card against indusind fixed deposit with zero income verification and lifetime free benefits. Designed to offer max savings and convenience.',
      annual_fee: 'Lifetime Free',
      features: [
        'Secured credit card against IndusInd Fixed Deposit with zero income verification and lifetime free benefits.',
        '1% fuel surcharge waiver across India',
        'Zero lost card liability protection',
        'Contactless & EMI payment enabled'
      ],
      benefits: 'Secured credit card against IndusInd Fixed Deposit with zero income verification and lifetime free benefits. 1% fuel surcharge waiver and dining rewards.',
      eligibility: { min_age: 18, max_age: 65, min_income: 0 },
      eligibility_criteria: 'Age 18-65 years. Monthly income ₹0+ or active FD.',
      documents_required: 'PAN Card, Aadhaar Card, Income Slips / Bank Statement',
      fees_charges: 'Joining Fee: Nil | Annual Fee: Lifetime Free | Interest Rate: 3.49% p.m.',
      seo_title: 'IndusInd FD Credit Card – Apply Online | GharKaPaisa',
      seo_description: 'Apply for IndusInd FD Credit Card. Secured credit card against IndusInd Fixed Deposit with zero income verification and lifetime free benefits.',
      seo_keywords: 'indusind fd credit card, apply indusind credit card',
      min_age: 18, max_age: 65, min_income: 0, display_order: 10, priority: 10
    }
  ],

};

// ─── Seed Function ──────────────────────────────────────────────
function getSubCategory(card) {
  if (card.sub_category) return card.sub_category;
  const name = card.name.toLowerCase();
  if (name.includes('fd') || name.includes('secured') || name.includes('step up') || name.includes('wow')) return 'Secured Cards';
  if (card.category === 'co_branded_card') return 'Co-Branded Cards';
  return 'Core Cards';
}

function extractFeesStructure(feesChargesStr, annualFeeStr) {
  let joining = '₹0';
  let annual = '₹500';
  let interest = '3.5% p.m.';
  
  if (feesChargesStr) {
    const joiningMatch = feesChargesStr.match(/Joining Fee:\s*(₹\s*\d+(?:,\d+)*|Nil|Free|None)/i);
    if (joiningMatch) joining = joiningMatch[1];
    
    const annualMatch = feesChargesStr.match(/Annual Fee:\s*(₹\s*\d+(?:,\d+)*|Nil|Free|None)/i);
    if (annualMatch) annual = annualMatch[1];
  }
  
  if (annualFeeStr) annual = annualFeeStr;
  
  return {
    joining_fee: joining,
    annual_fee: annual,
    interest_rate: interest,
    late_payment_charges: 'Up to ₹1300',
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
  
  return {
    annual_fee: fees.annual_fee,
    reward_rate: card.short_description || 'Accelerated rewards',
    lounge: lounge,
    fuel: '1% Waiver',
    forex: '3.5%'
  };
}

async function seed() {
  console.log('🚀 Starting credit card product seed for 13 banks...\n');

  // 1. Ensure all 13 Banks exist in database
  const BANK_DEFINITIONS = [
    { name: 'HDFC Bank', short_code: 'HDFC' },
    { name: 'State Bank of India', short_code: 'SBI' },
    { name: 'ICICI Bank', short_code: 'ICICI' },
    { name: 'Axis Bank', short_code: 'AXIS' },
    { name: 'Kotak Mahindra Bank', short_code: 'KOTAK' },
    { name: 'YES Bank', short_code: 'YES' },
    { name: 'IDFC FIRST Bank', short_code: 'IDFC' },
    { name: 'Bank of Baroda', short_code: 'BOB' },
    { name: 'Federal Bank', short_code: 'FEDERAL' },
    { name: 'RBL Bank', short_code: 'RBL' },
    { name: 'Equitas Small Finance Bank', short_code: 'EQUITAS' },
    { name: 'DCB Bank', short_code: 'DCB' },
    { name: 'IndusInd Bank', short_code: 'INDUSIND' }
  ];

  for (const b of BANK_DEFINITIONS) {
    await query(
      `INSERT INTO banks (name, short_code) VALUES ($1, $2) ON CONFLICT (short_code) DO NOTHING`,
      [b.name, b.short_code]
    );
  }

  // 2. Fetch Bank IDs
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
      console.warn(`⚠️  Bank "${bankKey}" not found in database. Skipping ${cards.length} cards.`);
      continue;
    }

    console.log(`\n📦 Seeding ${cards.length} cards for ${bankKey}...`);

    for (const card of cards) {
      const cardSlug = slug(card.name);
      const subCat = getSubCategory(card);
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

      const docsArray = card.documents_required ? card.documents_required.split(',').map(d => d.trim()) : ['PAN Card', 'Aadhaar Card'];

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
if (require.main === module) {
  seed()
    .then(() => {
      console.log('Done. Exiting.');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Seed error:', err);
      process.exit(1);
    });
}

module.exports = { ALL_CARDS, seed };

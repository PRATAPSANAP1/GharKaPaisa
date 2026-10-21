const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../../backend/.env') });
const { query } = require('../../config/database');
const logger = require('../../config/logger');

function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/**
 * 10 Canonical CIBIL-Based Personal Loan Providers & Products
 * 
 * Group 1: Bank (3 Products)
 * 1. Indusind bank VPL
 * 2. IDFC bank
 * 3. HDFC PL 10 sec
 * 
 * Group 2: Finance (7 Products)
 * 1. Finable
 * 2. Punawalla Finance
 * 3. Bajaj Finance
 * 4. KreditBee
 * 5. Tata Capital
 * 6. Unity
 * 7. Ram Fincorp
 */

const CIBIL_BANKS_AND_ENTITIES = [
  { name: 'IndusInd Bank', short_code: 'INDUSIND' },
  { name: 'IDFC First Bank', short_code: 'IDFC' },
  { name: 'HDFC Bank', short_code: 'HDFC' },
  { name: 'Finable', short_code: 'FINABLE' },
  { name: 'Punawalla Finance', short_code: 'PUNAWALLA' },
  { name: 'Bajaj Finance', short_code: 'BAJAJ' },
  { name: 'KreditBee', short_code: 'KREDITBEE' },
  { name: 'Tata Capital', short_code: 'TATACAPITAL' },
  { name: 'Unity', short_code: 'UNITY' },
  { name: 'Ram Fincorp', short_code: 'RAMFINCORP' },
];

const CIBIL_PERSONAL_LOAN_PRODUCTS = [
  // ─── GROUP 1: CIBIL BASED - BANK (3 Products) ──────────────────────────
  {
    bank_code: 'INDUSIND',
    bank_name: 'IndusInd Bank',
    name: 'Indusind bank VPL',
    category: 'personal_loan',
    sub_category: 'Personal Loan',
    loan_type: 'cibil',
    provider_type: 'bank',
    short_description: 'Verified Personal Loan (VPL) from IndusInd Bank with instant approval based on CIBIL score.',
    description: 'IndusInd Bank VPL (Verified Personal Loan) offers instant disbursal to savings account with minimal documentation, competitive interest rates, and flexible tenure for credit-worthy individuals.',
    annual_fee: '10.49% p.a.',
    interest_rate: '10.49% p.a.',
    processing_fee: 'Up to 1.5% + GST',
    time_period: '12 - 60 Months',
    disbursal_time: 'Within 2 Hours',
    min_amount: '50000',
    max_amount: '2500000',
    min_income: 25000,
    min_age: 21,
    max_age: 60,
    cibil_required: 720,
    badge: 'Verified VPL',
    display_order: 1,
    features: [
      'Verified Personal Loan (VPL) with express digital processing',
      'Instant online approval based on CIBIL credit track record',
      'Zero physical documentation required for pre-approved customers',
      'Flexible repayment tenure up to 60 months'
    ],
    eligibility_criteria: 'CIBIL score 720+ with clean repayment track record and regular monthly income.',
    documents_required: 'PAN Card, Aadhaar Card, Bank Statement (3 Months)'
  },
  {
    bank_code: 'IDFC',
    bank_name: 'IDFC First Bank',
    name: 'IDFC bank',
    category: 'personal_loan',
    sub_category: 'Personal Loan',
    loan_type: 'cibil',
    provider_type: 'bank',
    short_description: 'Instant paperless personal loan from IDFC First Bank with attractive interest rates and flexible tenures.',
    description: 'IDFC bank Personal Loan provides instant digital loan approval based on CIBIL score, offering zero foreclosure fees on select tenures and flexible repayment up to 60 months.',
    annual_fee: '10.49% p.a.',
    interest_rate: '10.49% p.a.',
    processing_fee: 'Up to 2.0% + GST',
    time_period: '12 - 60 Months',
    disbursal_time: 'Instant (10 Seconds)',
    min_amount: '50000',
    max_amount: '4000000',
    min_income: 25000,
    min_age: 21,
    max_age: 60,
    cibil_required: 730,
    badge: 'Popular Choice',
    display_order: 2,
    features: [
      'Instant credit decisioning based on credit score',
      'Attractive interest rates starting at 10.49% p.a.',
      'Minimal documentation with 100% paperless digital journey',
      'Flexible tenures from 12 to 60 months with easy EMI'
    ],
    eligibility_criteria: 'Indian citizen aged 21-60 with CIBIL score 730+ and active banking account.',
    documents_required: 'PAN Card, Aadhaar Card, Bank Statement'
  },
  {
    bank_code: 'HDFC',
    bank_name: 'HDFC Bank',
    name: 'HDFC PL 10 sec',
    category: 'personal_loan',
    sub_category: 'Personal Loan',
    loan_type: 'cibil',
    provider_type: 'bank',
    short_description: '10-Second instant personal loan disbursal directly to account with pre-approved CIBIL offer.',
    description: 'HDFC PL 10 sec is HDFC Bank\'s fastest personal loan with instant funds transferred directly to your bank account in 10 seconds. 100% digital with no physical paperwork required.',
    annual_fee: '10.50% p.a.',
    interest_rate: '10.50% p.a.',
    processing_fee: 'Up to 1.5% + GST',
    time_period: '12 - 60 Months',
    disbursal_time: 'Instant (10 Seconds)',
    min_amount: '50000',
    max_amount: '4000000',
    min_income: 25000,
    min_age: 21,
    max_age: 60,
    cibil_required: 750,
    badge: '10-Sec Disbursal',
    display_order: 3,
    features: [
      '10-second instant disbursal directly to bank account',
      'Pre-approved offer based on CIBIL track record',
      'Zero paperwork and instant online sanction letter',
      'Flexible repayment tenure up to 5 years'
    ],
    eligibility_criteria: 'Pre-approved or CIBIL score 750+ applicants with valid PAN and KYC.',
    documents_required: 'PAN Card, Aadhaar Card, NetBanking Login / Statement'
  },

  // ─── GROUP 2: CIBIL BASED - FINANCE (7 Products) ───────────────────────
  {
    bank_code: 'FINABLE',
    bank_name: 'Finable',
    name: 'Finable',
    category: 'personal_loan',
    sub_category: 'Personal Loan',
    loan_type: 'cibil',
    provider_type: 'finance',
    short_description: 'Fast digital credit line and personal loan from Finable with quick CIBIL evaluation.',
    description: 'Finable provides paperless instant personal loans directly to your bank account with streamlined CIBIL credit score evaluation, transparent pricing, and flexible repayment EMIs.',
    annual_fee: '11.99% p.a.',
    interest_rate: '11.99% p.a.',
    processing_fee: 'Up to 2.0% + GST',
    time_period: '6 - 36 Months',
    disbursal_time: 'Instant (10 Seconds)',
    min_amount: '25000',
    max_amount: '1000000',
    min_income: 20000,
    min_age: 21,
    max_age: 58,
    cibil_required: 700,
    badge: 'Fast Cash',
    display_order: 4,
    features: [
      'Digital personal loan with rapid CIBIL verification',
      'Collateral-free instant online cash transfer',
      'Transparent charges with no hidden fees',
      'Convenient flexible EMI repayment options'
    ],
    eligibility_criteria: 'Salaried or self-employed with minimum monthly income ₹20,000 and CIBIL score 700+.',
    documents_required: 'PAN Card, Aadhaar Card, 3 Months Bank Statement'
  },
  {
    bank_code: 'PUNAWALLA',
    bank_name: 'Punawalla Finance',
    name: 'Punawalla Finance',
    category: 'personal_loan',
    sub_category: 'Personal Loan',
    loan_type: 'cibil',
    provider_type: 'finance',
    short_description: 'Collateral-free personal loans from Punawalla Finance with swift approval and minimal paperwork.',
    description: 'Punawalla Finance offers instant sanction personal loans with high approval rates on credit scores, competitive interest rates, and zero hidden charges for personal and professional needs.',
    annual_fee: '11.50% p.a.',
    interest_rate: '11.50% p.a.',
    processing_fee: 'Up to 1.5% + GST',
    time_period: '12 - 60 Months',
    disbursal_time: 'Within 2 Hours',
    min_amount: '50000',
    max_amount: '3000000',
    min_income: 25000,
    min_age: 22,
    max_age: 58,
    cibil_required: 710,
    badge: 'Quick Disbursal',
    display_order: 5,
    features: [
      'Fast-track loan approval powered by credit score evaluation',
      'High sanction limits with minimal documentation',
      'Zero foreclosure charges after qualifying period',
      'Instant sanction letter delivered online'
    ],
    eligibility_criteria: 'Age 22-58 years with regular salary/income and credit score 710+.',
    documents_required: 'PAN Card, Aadhaar Card, Latest Salary Slips'
  },
  {
    bank_code: 'BAJAJ',
    bank_name: 'Bajaj Finance',
    name: 'Bajaj Finance',
    category: 'personal_loan',
    sub_category: 'Personal Loan',
    loan_type: 'cibil',
    provider_type: 'finance',
    short_description: 'Instant personal loan up to ₹40 Lakhs from Bajaj Finance with Flexi Loan facility.',
    description: 'Bajaj Finance provides high-value personal loans with instant online approval, flexible Flexi-hybrid repayment, and quick disbursal directly to your account within 24 hours.',
    annual_fee: '11.00% p.a.',
    interest_rate: '11.00% p.a.',
    processing_fee: 'Up to 2.0% + GST',
    time_period: '12 - 72 Months',
    disbursal_time: 'Instant (10 Seconds)',
    min_amount: '50000',
    max_amount: '4000000',
    min_income: 25000,
    min_age: 21,
    max_age: 60,
    cibil_required: 720,
    badge: 'Flexi Loan',
    display_order: 6,
    features: [
      'Flexi-loan facility with withdraw & repay on-demand',
      'Quick online approval for CIBIL 720+ applicants',
      'Up to ₹40 Lakhs pre-approved credit line',
      'Disbursal within 24 hours of approval'
    ],
    eligibility_criteria: 'CIBIL score 720+ with steady employment and verified bank statements.',
    documents_required: 'PAN Card, Aadhaar Card, Salary Slips, Bank Statement'
  },
  {
    bank_code: 'KREDITBEE',
    bank_name: 'KreditBee',
    name: 'KreditBee',
    category: 'personal_loan',
    sub_category: 'Personal Loan',
    loan_type: 'cibil',
    provider_type: 'finance',
    short_description: '100% digital personal loans up to ₹5 Lakhs from KreditBee disbursed in 10 minutes.',
    description: 'KreditBee offers instant personal loans for salaried and self-employed individuals with quick CIBIL verification, online KYC, and direct money transfer to your bank account.',
    annual_fee: '12.50% p.a.',
    interest_rate: '12.50% p.a.',
    processing_fee: 'Up to 2.5% + GST',
    time_period: '3 - 24 Months',
    disbursal_time: 'Instant (10 Seconds)',
    min_amount: '10000',
    max_amount: '500000',
    min_income: 15000,
    min_age: 21,
    max_age: 55,
    cibil_required: 680,
    badge: '10-Min Disbursal',
    display_order: 7,
    features: [
      '100% digital process completed in 10 minutes',
      'Direct bank transfer upon CIBIL verification',
      'Flexible micro-ticket and personal loan options',
      'Minimal documentation via video KYC'
    ],
    eligibility_criteria: 'Age 21-55 years with monthly income ₹15,000+ and valid PAN/Aadhaar.',
    documents_required: 'PAN Card, Aadhaar Card, Selfie Video KYC'
  },
  {
    bank_code: 'TATACAPITAL',
    bank_name: 'Tata Capital',
    name: 'Tata Capital',
    category: 'personal_loan',
    sub_category: 'Personal Loan',
    loan_type: 'cibil',
    provider_type: 'finance',
    short_description: 'Trusted personal loans from Tata Capital with attractive interest rates and quick online sanction.',
    description: 'Tata Capital offers multi-purpose personal loans for medical emergencies, travel, weddings, or home renovation with fast CIBIL-score verification and flexible repayment tenures up to 6 years.',
    annual_fee: '10.99% p.a.',
    interest_rate: '10.99% p.a.',
    processing_fee: 'Up to 1.75% + GST',
    time_period: '12 - 72 Months',
    disbursal_time: 'Within 2 Hours',
    min_amount: '50000',
    max_amount: '3500000',
    min_income: 25000,
    min_age: 21,
    max_age: 58,
    cibil_required: 720,
    badge: 'Tata Trust',
    display_order: 8,
    features: [
      'Trusted Tata brand with customized loan offerings',
      'Instant digital sanction based on credit score',
      'Competitive interest rates starting at 10.99%',
      'Flexible repayment options up to 6 years'
    ],
    eligibility_criteria: 'Salaried/Self-employed with CIBIL score 720+ and minimum 1 year work experience.',
    documents_required: 'PAN Card, Aadhaar Card, 3 Months Salary Slips, Bank Statement'
  },
  {
    bank_code: 'UNITY',
    bank_name: 'Unity',
    name: 'Unity',
    category: 'personal_loan',
    sub_category: 'Personal Loan',
    loan_type: 'cibil',
    provider_type: 'finance',
    short_description: 'Quick digital personal loans from Unity with simplified eligibility and competitive EMIs.',
    description: 'Unity provides hassle-free personal loans with swift credit assessment based on CIBIL score, transparent fees, and rapid disbursal directly to your account.',
    annual_fee: '12.00% p.a.',
    interest_rate: '12.00% p.a.',
    processing_fee: 'Up to 2.0% + GST',
    time_period: '12 - 48 Months',
    disbursal_time: 'Same Day Disbursal',
    min_amount: '25000',
    max_amount: '1500000',
    min_income: 20000,
    min_age: 21,
    max_age: 60,
    cibil_required: 700,
    badge: 'Easy EMI',
    display_order: 9,
    features: [
      'Simple and quick digital personal loan',
      'Fast turnaround time with CIBIL score checks',
      'Transparent terms and affordable monthly EMIs',
      'Dedicated customer support and doorstep assistance'
    ],
    eligibility_criteria: 'Age 21-60 with regular monthly income ₹20,000+ and credit score 700+.',
    documents_required: 'PAN Card, Aadhaar Card, Bank Statement'
  },
  {
    bank_code: 'RAMFINCORP',
    bank_name: 'Ram Fincorp',
    name: 'Ram Fincorp',
    category: 'personal_loan',
    sub_category: 'Personal Loan',
    loan_type: 'cibil',
    provider_type: 'finance',
    short_description: 'Convenient and flexible personal loans from Ram Fincorp with easy credit score approval.',
    description: 'Ram Fincorp offers quick personal loans designed for urgent financial needs with minimal verification delays, prompt CIBIL assessment, and flexible repayment tenures.',
    annual_fee: '12.50% p.a.',
    interest_rate: '12.50% p.a.',
    processing_fee: 'Up to 2.0% + GST',
    time_period: '6 - 36 Months',
    disbursal_time: 'Within 24 Hours',
    min_amount: '20000',
    max_amount: '2000000',
    min_income: 20000,
    min_age: 21,
    max_age: 60,
    cibil_required: 690,
    badge: 'Fast Approval',
    display_order: 10,
    features: [
      'Quick personal loan disbursal with minimal paperwork',
      'Tailored loan amounts for diverse financial needs',
      'Hassle-free digital application and verification',
      'Flexible tenure and competitive rates'
    ],
    eligibility_criteria: 'Indian resident with monthly income ₹20,000+ and credit score 690+.',
    documents_required: 'PAN Card, Aadhaar Card, Bank Statement'
  }
];

async function seedCibilPersonalLoanProducts() {
  logger.info('[CIBIL PL Seeder] Starting CIBIL Personal Loan products verification & seed...');

  // 1. Ensure all Bank & Finance institutions exist in banks table
  for (const b of CIBIL_BANKS_AND_ENTITIES) {
    try {
      await query(`
        INSERT INTO banks (name, short_code, is_active, status)
        VALUES ($1, $2, true, 'Active')
        ON CONFLICT (short_code) DO UPDATE SET
          name = EXCLUDED.name,
          is_active = true,
          status = 'Active'
      `, [b.name, b.short_code]);
    } catch (bErr) {
      logger.warn(`[CIBIL PL Seeder] Bank ${b.name} notice:`, bErr.message);
    }
  }

  // 2. Fetch all Banks to get their UUIDs
  const { rows: banks } = await query(`SELECT id, name, short_code FROM banks`);
  const bankMap = {};
  for (const b of banks) {
    if (b.short_code) bankMap[b.short_code.toUpperCase()] = b.id;
    if (b.name) bankMap[b.name.toLowerCase().trim()] = b.id;
  }

  let insertedCount = 0;
  let updatedCount = 0;

  // 3. Insert or Update all 10 products
  for (const p of CIBIL_PERSONAL_LOAN_PRODUCTS) {
    const bankId = bankMap[p.bank_code.toUpperCase()] || bankMap[p.bank_name.toLowerCase().trim()];
    if (!bankId) {
      logger.warn(`[CIBIL PL Seeder] Bank ID not found for ${p.bank_name} (${p.bank_code}). Skipping.`);
      continue;
    }

    const productSlug = slug(p.name);
    const eligibilityPayload = {
      loan_type: p.loan_type,
      provider_type: p.provider_type,
      min_age: p.min_age,
      max_age: p.max_age,
      min_income: p.min_income,
      cibil_required: p.cibil_required,
      min_amount: p.min_amount,
      max_amount: p.max_amount,
      disbursal_time: p.disbursal_time,
      interest_rate: p.interest_rate,
      processing_fee: p.processing_fee
    };

    const feesStructure = {
      annual_fee: p.annual_fee,
      interest_rate: p.interest_rate,
      processing_fee: p.processing_fee
    };

    const compareSpecs = {
      annual_fee: p.processing_fee,
      reward_rate: p.disbursal_time,
      lounge: `Up to ₹${(Number(p.max_amount) / 100000).toFixed(0)} Lakhs`
    };

    const visibility = {
      show_on_website: true,
      show_in_partner: true,
      is_featured: p.display_order <= 3,
      is_popular: p.display_order <= 5
    };

    const seoMetadata = {
      meta_title: `${p.name} - Apply Online | GharKaPaisa`,
      meta_description: p.short_description || p.description,
      slug: productSlug
    };

    try {
      const res = await query(`
        INSERT INTO products (
          bank_id, name, category, sub_category, description, features, eligibility,
          commission_type, commission_value, min_age, max_age, min_income,
          display_order, annual_fee, time_period, image_url,
          short_description, commission_enabled, featured, public_visible,
          partner_visible, eligibility_criteria, documents_required, benefits,
          apply_button_text, seo_title, seo_description, seo_keywords,
          status, is_active, slug, badge,
          joining_fee, processing_fee, interest_rate,
          compare_specs, fees_structure, features_list, benefits_list, required_documents,
          visibility, seo_metadata
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12,
          $13, $14, $15, $16,
          $17, $18, $19, $20,
          $21, $22, $23, $24,
          $25, $26, $27, $28,
          $29, $30, $31, $32,
          $33, $34, $35,
          $36, $37, $38, $39, $40,
          $41, $42
        )
        ON CONFLICT (bank_id, name) DO UPDATE SET
          category = EXCLUDED.category,
          sub_category = EXCLUDED.sub_category,
          description = EXCLUDED.description,
          features = EXCLUDED.features,
          eligibility = EXCLUDED.eligibility,
          display_order = EXCLUDED.display_order,
          annual_fee = EXCLUDED.annual_fee,
          time_period = EXCLUDED.time_period,
          short_description = EXCLUDED.short_description,
          public_visible = true,
          partner_visible = true,
          status = 'Active',
          is_active = true,
          badge = EXCLUDED.badge,
          joining_fee = EXCLUDED.joining_fee,
          processing_fee = EXCLUDED.processing_fee,
          interest_rate = EXCLUDED.interest_rate,
          compare_specs = EXCLUDED.compare_specs,
          fees_structure = EXCLUDED.fees_structure,
          features_list = EXCLUDED.features_list,
          required_documents = EXCLUDED.required_documents,
          visibility = EXCLUDED.visibility,
          seo_metadata = EXCLUDED.seo_metadata
        RETURNING id
      `, [
        bankId, p.name, p.category, p.sub_category, p.description,
        JSON.stringify(p.features), JSON.stringify(eligibilityPayload),
        'fixed', 1500, p.min_age, p.max_age, p.min_income,
        p.display_order, p.annual_fee, p.time_period, null,
        p.short_description, true, p.display_order <= 3, true,
        true, p.eligibility_criteria, p.documents_required, JSON.stringify(p.features),
        'Apply Now', `${p.name} - Apply Online | GharKaPaisa`, p.short_description, `${p.name}, personal loan, cibil loan`,
        'Active', true, productSlug, p.badge,
        'Nil', p.processing_fee, p.interest_rate,
        JSON.stringify(compareSpecs), JSON.stringify(feesStructure),
        JSON.stringify(p.features), JSON.stringify(p.features),
        JSON.stringify(p.documents_required.split(', ')),
        JSON.stringify(visibility), JSON.stringify(seoMetadata)
      ]);

      if (res.rowCount > 0) {
        insertedCount++;
      }
    } catch (prodErr) {
      logger.warn(`[CIBIL PL Seeder] Error seeding ${p.name}:`, prodErr.message);
    }
  }

  logger.info(`[CIBIL PL Seeder] Completed seeding ${insertedCount} CIBIL Personal Loan products.`);
  return { success: true, count: insertedCount };
}

module.exports = {
  CIBIL_BANKS_AND_ENTITIES,
  CIBIL_PERSONAL_LOAN_PRODUCTS,
  seedCibilPersonalLoanProducts
};

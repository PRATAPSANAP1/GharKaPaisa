/**
 * personalLoanHelpers.js
 * Helpers for GharKaPaisa Personal Loan flow:
 * - Provider classification: Bank vs Finance (NBFC)
 * - Eligibility classification: CIBIL-Based vs Income-Based
 * - Canonical provider lists and matching utilities
 * - Preset product templates for CIBIL-Based Bank & Finance products
 */

export const FINANCE_COMPANIES = [
  { id: 'finable', label: 'Finable', match: ['finable'] },
  { id: 'punawalla', label: 'Punawalla Finance', match: ['punawalla', 'poonawalla'] },
  { id: 'bajaj', label: 'Bajaj Finance', match: ['bajaj'] },
  { id: 'kreditbee', label: 'KreditBee', match: ['kreditbee', 'kredit bee'] },
  { id: 'tata-capital', label: 'Tata Capital', match: ['tata capital', 'tata on fly'] },
  { id: 'unity', label: 'Unity', match: ['unity'] },
  { id: 'ram-fincorp', label: 'Ram Fincorp', match: ['ramfin', 'ram fincorp', 'ramfincorp'] },
];

export const FINANCE_COMPANY_OPTIONS = [
  'All Finance Companies',
  'Finable',
  'Punawalla Finance',
  'Bajaj Finance',
  'KreditBee',
  'Tata Capital',
  'Unity',
  'Ram Fincorp'
];

export const BANK_OPTIONS = [
  'All Banks',
  'HDFC Bank',
  'ICICI Bank',
  'State Bank of India',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'IDFC First Bank',
  'IndusInd Bank',
  'Federal Bank',
  'Bank of Baroda',
  'YES Bank'
];

// Canonical ID for IDFC Personal Loan
export const IDFC_PERSONAL_LOAN_ID = '621d282c-832e-4cce-8344-b4a80ddf6fc4';

// Stable CIBIL Bank Personal Loan product IDs (verified from database)
export const CIBIL_BANK_PRODUCT_IDS = [
  IDFC_PERSONAL_LOAN_ID,
];

// Verified Slugs for CIBIL Bank Personal Loan products
export const CIBIL_BANK_SLUGS = [
  'indusind-bank-vpl',
  'indusind-vpl',
  'idfc-bank',
  'idfc-bank-personal-loan',
  'idfc-personal-loan',
  'hdfc-pl-10sec',
  'hdfc-pl-10-sec',
  'hdfc-pl-10sec-bank',
  'hdfc-10sec-personal-loan'
];

// IndusInd Bank UUID from database banks table
export const INDUSIND_BANK_ID = '7eda6d99-10e2-4bf8-bbe5-9de0b1b0fc9c';

// Bank dropdown and quick-filter chip options for CIBIL-Based Personal Loans
export const CIBIL_BANK_OPTIONS = [
  'All Banks',
  'IndusInd Bank',
  'IDFC First Bank',
  'IDFC Bank',
  'HDFC Bank'
];

// Bank dropdown and quick-filter chip options for Income-Based Personal Loans
export const INCOME_BANK_OPTIONS = [
  'All Banks',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'State Bank of India'
];

// ─────────────────────────────────────────────────────────────────────────────
// PRESET PRODUCT DEFINITIONS FOR CIBIL-BASED LOANS
// ─────────────────────────────────────────────────────────────────────────────

export const CIBIL_BANK_PRESET_PRODUCTS = [
  {
    name: 'Indusind bank VPL',
    bank_name: 'IndusInd Bank',
    bank_code: 'INDUSIND',
    loan_type: 'cibil',
    provider_type: 'bank',
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
    features: [
      'Verified Personal Loan (VPL) with express digital processing',
      'Instant online approval based on CIBIL credit track record',
      'Zero physical documentation required for pre-approved customers',
      'Flexible repayment tenure up to 60 months'
    ]
  },
  {
    name: 'IDFC bank',
    bank_name: 'IDFC First Bank',
    bank_code: 'IDFC',
    loan_type: 'cibil',
    provider_type: 'bank',
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
    features: [
      'Instant credit decisioning based on credit score',
      'Attractive interest rates starting at 10.49% p.a.',
      'Minimal documentation with 100% paperless digital journey',
      'Flexible tenures from 12 to 60 months with easy EMI'
    ]
  },
  {
    name: 'HDFC PL 10 sec',
    bank_name: 'HDFC Bank',
    bank_code: 'HDFC',
    loan_type: 'cibil',
    provider_type: 'bank',
    description: "HDFC PL 10 sec is HDFC Bank's fastest personal loan with instant funds transferred directly to your bank account in 10 seconds. 100% digital with no physical paperwork required.",
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
    features: [
      '10-second instant disbursal directly to bank account',
      'Pre-approved offer based on CIBIL track record',
      'Zero paperwork and instant online sanction letter',
      'Flexible repayment tenure up to 5 years'
    ]
  }
];

export const CIBIL_FINANCE_PRESET_PRODUCTS = [
  {
    name: 'Finable',
    bank_name: 'Finable',
    bank_code: 'FINABLE',
    loan_type: 'cibil',
    provider_type: 'finance',
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
    features: [
      'Digital personal loan with rapid CIBIL verification',
      'Collateral-free instant online cash transfer',
      'Transparent charges with no hidden fees',
      'Convenient flexible EMI repayment options'
    ]
  },
  {
    name: 'Punawalla Finance',
    bank_name: 'Punawalla Finance',
    bank_code: 'PUNAWALLA',
    loan_type: 'cibil',
    provider_type: 'finance',
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
    features: [
      'Fast-track loan approval powered by credit score evaluation',
      'High sanction limits with minimal documentation',
      'Zero foreclosure charges after qualifying period',
      'Instant sanction letter delivered online'
    ]
  },
  {
    name: 'Bajaj Finance',
    bank_name: 'Bajaj Finance',
    bank_code: 'BAJAJ',
    loan_type: 'cibil',
    provider_type: 'finance',
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
    features: [
      'Flexi-loan facility with withdraw & repay on-demand',
      'Quick online approval for CIBIL 720+ applicants',
      'Up to ₹40 Lakhs pre-approved credit line',
      'Disbursal within 24 hours of approval'
    ]
  },
  {
    name: 'KreditBee',
    bank_name: 'KreditBee',
    bank_code: 'KREDITBEE',
    loan_type: 'cibil',
    provider_type: 'finance',
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
    features: [
      '100% digital process completed in 10 minutes',
      'Direct bank transfer upon CIBIL verification',
      'Flexible micro-ticket and personal loan options',
      'Minimal documentation via video KYC'
    ]
  },
  {
    name: 'Tata Capital',
    bank_name: 'Tata Capital',
    bank_code: 'TATACAPITAL',
    loan_type: 'cibil',
    provider_type: 'finance',
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
    features: [
      'Trusted Tata brand with customized loan offerings',
      'Instant digital sanction based on credit score',
      'Competitive interest rates starting at 10.99%',
      'Flexible repayment options up to 6 years'
    ]
  },
  {
    name: 'Unity',
    bank_name: 'Unity',
    bank_code: 'UNITY',
    loan_type: 'cibil',
    provider_type: 'finance',
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
    features: [
      'Simple and quick digital personal loan',
      'Fast turnaround time with CIBIL score checks',
      'Transparent terms and affordable monthly EMIs',
      'Dedicated customer support and doorstep assistance'
    ]
  },
  {
    name: 'Ram Fincorp',
    bank_name: 'Ram Fincorp',
    bank_code: 'RAMFINCORP',
    loan_type: 'cibil',
    provider_type: 'finance',
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
    features: [
      'Quick personal loan disbursal with minimal paperwork',
      'Tailored loan amounts for diverse financial needs',
      'Hassle-free digital application and verification',
      'Flexible tenure and competitive rates'
    ]
  }
];

/**
 * Check if a product belongs to a Finance / NBFC company.
 */
export const isFinanceProduct = (p) => {
  if (!p) return false;

  // 1. Explicit provider_type set in Super Admin / product data
  const elig = (typeof p.eligibility === 'object' && p.eligibility !== null) ? p.eligibility : {};
  const explicitProvider = String(p.provider_type || elig.provider_type || '').toLowerCase().trim();
  if (explicitProvider === 'finance') return true;
  if (explicitProvider === 'bank') return false;

  const bName = String(p.bank_name || '').toLowerCase();
  const bCode = String(p.bank_code || '').toLowerCase();
  const pName = String(p.name || '').toLowerCase();

  // Match against the canonical finance companies
  const matchesCanonical = FINANCE_COMPANIES.some(fc =>
    fc.match.some(m => bName.includes(m) || bCode.includes(m) || pName.includes(m))
  );
  if (matchesCanonical) return true;

  // General NBFC / digital lender keywords
  return (
    bName.includes('finance') ||
    bName.includes('fincorp') ||
    bName.includes('fintech') ||
    bName.includes('kredit') ||
    bName.includes('moneyview') ||
    bName.includes('navi') ||
    bName.includes('paysense')
  );
};

/**
 * Check if a product belongs to a commercial Bank.
 */
export const isBankProduct = (p) => {
  if (!p) return false;
  return !isFinanceProduct(p);
};

/**
 * Check if a bank product belongs to the 3 designated CIBIL-Based products:
 *  1. Indusind bank VPL — product-level match on 'vpl' or 'indusind bank vpl'
 *  2. IDFC bank — match on 'idfc bank', 'idfc personal loan', or canonical UUID
 *  3. HDFC PL 10 sec — product-level match on '10sec', '10 sec', 'hdfc pl'
 */
export const isCibilBankProduct = (p) => {
  if (!p) return false;

  // 0. Explicit loan_type set in Super Admin / product data
  const elig = (typeof p.eligibility === 'object' && p.eligibility !== null) ? p.eligibility : {};
  const explicitLoanType = String(p.loan_type || elig.loan_type || elig.type || '').toLowerCase().trim();
  if (explicitLoanType === 'cibil') return true;
  if (explicitLoanType === 'income') return false;

  // 1. Stable UUID matching (verified against database)
  if (p.id && CIBIL_BANK_PRODUCT_IDS.includes(p.id)) return true;

  // 2. Stable Slug matching
  const slug = String(p.slug || '').toLowerCase().trim();
  if (slug && CIBIL_BANK_SLUGS.includes(slug)) return true;

  const pName = String(p.name || '').toLowerCase().trim();

  // 3. Indusind bank VPL — product specifically Verified Personal Loan (VPL)
  if (
    pName.includes('vpl') ||
    slug.includes('vpl') ||
    pName.includes('indusind bank vpl')
  ) {
    return true;
  }

  // 4. IDFC bank / IDFC Personal Loan
  if (
    p.id === IDFC_PERSONAL_LOAN_ID ||
    slug === 'idfc-personal-loan' ||
    slug === 'idfc-bank' ||
    slug === 'idfc-bank-personal-loan' ||
    pName === 'idfc bank' ||
    pName === 'idfc personal loan' ||
    (pName.includes('idfc') && (p.category === 'personal_loan' || p.category === 'loans'))
  ) {
    return true;
  }

  // 5. HDFC PL 10 sec — product must specifically be the 10-second instant loan
  // Note: Regular 'HDFC Personal Loan' is an Income-Based product requiring salary slips/ITR
  if (
    pName.includes('10sec') ||
    pName.includes('10 sec') ||
    pName.includes('10-sec') ||
    pName.includes('hdfc pl') ||
    slug.includes('hdfc-pl-10sec')
  ) {
    return true;
  }

  return false;
};

/**
 * Determine if a personal loan product is CIBIL-Based or Income-Based.
 * - Bank Personal Loans:
 *   - CIBIL-Based: Indusind bank VPL, IDFC bank, HDFC PL 10 sec
 *   - Income-Based: All other bank Personal Loan products
 * - Finance / NBFC Personal Loans: Evaluated via metadata/sub_category/eligibility criteria
 */
export const getLoanEligibilityType = (p) => {
  if (!p) return 'cibil';

  // 0. Explicit loan_type set in Super Admin / product data
  const elig = (typeof p.eligibility === 'object' && p.eligibility !== null) ? p.eligibility : {};
  const explicitLoanType = String(p.loan_type || elig.loan_type || elig.type || '').toLowerCase().trim();
  if (explicitLoanType === 'cibil') return 'cibil';
  if (explicitLoanType === 'income') return 'income';

  // Bank Personal Loans: strict eligibility partitioning
  if (isBankProduct(p)) {
    return isCibilBankProduct(p) ? 'cibil' : 'income';
  }

  // 1. Explicit sub_category in database
  const subCat = String(p.sub_category || '').toLowerCase().trim();
  if (subCat.includes('cibil')) return 'cibil';
  if (subCat.includes('income') || subCat.includes('salary')) return 'income';

  // 2. Explicit eligibility JSONB object in database
  const basis = String(elig.basis || elig.eligibility_type || '').toLowerCase();
  if (basis.includes('cibil')) return 'cibil';
  if (basis.includes('income') || basis.includes('salary')) return 'income';

  if (elig.cibil_required && (!elig.min_income || Number(elig.min_income) === 0)) return 'cibil';
  if (elig.min_income && Number(elig.min_income) > 0 && !elig.cibil_required) return 'income';

  // 3. Eligibility criteria text
  const crit = String(p.eligibility_criteria || '').toLowerCase();
  if (crit.includes('cibil based') || crit.includes('cibil score based')) return 'cibil';
  if (crit.includes('income based') || crit.includes('salary based')) return 'income';

  // 4. Product features & descriptions
  const featStr = (Array.isArray(p.features) ? p.features.join(' ') : String(p.features || '')).toLowerCase();
  const descStr = String(p.description || '').toLowerCase();
  const combined = `${featStr} ${descStr}`;

  if (
    combined.includes('cibil') ||
    combined.includes('credit score') ||
    combined.includes('pre-approved') ||
    combined.includes('same day approval') ||
    combined.includes('minimal docs')
  ) {
    return 'cibil';
  }
  if (
    combined.includes('govt employees') ||
    combined.includes('salary slip') ||
    combined.includes('income proof') ||
    combined.includes('itr') ||
    combined.includes('doorstep service')
  ) {
    return 'income';
  }

  return 'cibil';
};

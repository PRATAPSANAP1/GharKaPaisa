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
  'IndusInd Bank',
  'YES Bank',
  'ICICI Bank',
  'Kotak Mahindra Bank',
  'Axis Bank',
  'IDFC First Bank'
];

// ─────────────────────────────────────────────────────────────────────────────
// OFFICIAL & PARTNER UTM TRACKING LINKS FOR FINANCE / NBFC LOANS
// ─────────────────────────────────────────────────────────────────────────────
export const FINANCE_PRODUCT_LINKS = {
  'tata': 'https://www.wishfin.com/tata/home?source=FWRey_July&utm_source=FW38&utm_medium=SMS&utm_campaign=promotion&utm_content=check_offer&utm_term=tata',
  'tata-capital': 'https://www.wishfin.com/tata/home?source=FWRey_July&utm_source=FW38&utm_medium=SMS&utm_campaign=promotion&utm_content=check_offer&utm_term=tata',
  'tata capital': 'https://www.wishfin.com/tata/home?source=FWRey_July&utm_source=FW38&utm_medium=SMS&utm_campaign=promotion&utm_content=check_offer&utm_term=tata',
  'tata on fly': 'https://www.wishfin.com/tata/home?source=FWRey_July&utm_source=FW38&utm_medium=SMS&utm_campaign=promotion&utm_content=check_offer&utm_term=tata',
  'tata on fly-utm': 'https://www.wishfin.com/tata/home?source=FWRey_July&utm_source=FW38&utm_medium=SMS&utm_campaign=promotion&utm_content=check_offer&utm_term=tata',

  'prefr': 'https://www.wishfin.com/prefr/home?source=Rey_june26_FW18',
  'prefr utm': 'https://www.wishfin.com/prefr/home?source=Rey_june26_FW18',
  'finable': 'https://www.wishfin.com/prefr/home?source=Rey_june26_FW18',
  'finaable': 'https://www.wishfin.com/prefr/home?source=Rey_june26_FW18',

  'ramfincorp': 'https://applyonline.ramfincorp.com/?utm_source=Wishfin49&utm_campaign=default_campaign&utm_medium=default_medium&utm_trackingid=FW_30',
  'ram fincorp': 'https://applyonline.ramfincorp.com/?utm_source=Wishfin49&utm_campaign=default_campaign&utm_medium=default_medium&utm_trackingid=FW_30',
  'ramfincorp utm': 'https://applyonline.ramfincorp.com/?utm_source=Wishfin49&utm_campaign=default_campaign&utm_medium=default_medium&utm_trackingid=FW_30',

  'kreditbee': 'https://www.wishfin.com/kreditbee/home?source=fin41',
  'kreditbee link-utm': 'https://www.wishfin.com/kreditbee/home?source=fin41',
  'kredit bee': 'https://www.wishfin.com/kreditbee/home?source=fin41',

  'unity': 'https://loans.theunitybank.com/unity-pl-ui/page/exclusion/login/logindetails?utm_source=Partner&utm_medium=Wishfin&utm_campaign=finwizz11',
  'unity bank': 'https://loans.theunitybank.com/unity-pl-ui/page/exclusion/login/logindetails?utm_source=Partner&utm_medium=Wishfin&utm_campaign=finwizz11',

  'poonawalla': 'https://instant-pocket-loan.poonawallafincorp.com/?redirectto=primepl&utm_DSA_Code=PUP00228&UTM_Partner_Name=WISHFIN&UTM_Partner_Medium=SMS&UTM_Partner_AgentCode=PFLWISHFIN&UTM_Partner_ReferenceID=WF_FW_REY_PR_26',
  'poonawalla utm': 'https://instant-pocket-loan.poonawallafincorp.com/?redirectto=primepl&utm_DSA_Code=PUP00228&UTM_Partner_Name=WISHFIN&UTM_Partner_Medium=SMS&UTM_Partner_AgentCode=PFLWISHFIN&UTM_Partner_ReferenceID=WF_FW_REY_PR_26',
  'punawalla': 'https://instant-pocket-loan.poonawallafincorp.com/?redirectto=primepl&utm_DSA_Code=PUP00228&UTM_Partner_Name=WISHFIN&UTM_Partner_Medium=SMS&UTM_Partner_AgentCode=PFLWISHFIN&UTM_Partner_ReferenceID=WF_FW_REY_PR_26',
  'punawalla finance': 'https://instant-pocket-loan.poonawallafincorp.com/?redirectto=primepl&utm_DSA_Code=PUP00228&UTM_Partner_Name=WISHFIN&UTM_Partner_Medium=SMS&UTM_Partner_AgentCode=PFLWISHFIN&UTM_Partner_ReferenceID=WF_FW_REY_PR_26',

  'bajaj': 'https://www.bajajfinserv.in/personal-loan',
  'bajaj finance': 'https://www.bajajfinserv.in/personal-loan'
};

/**
 * Resolve direct UTM application link for a Finance product.
 */
export const getFinanceDirectUrl = (productOrName) => {
  if (!productOrName) return null;
  const pName = typeof productOrName === 'string'
    ? productOrName
    : (productOrName.name || productOrName.bank_name || productOrName.bank_code || '');
  const n = pName.toLowerCase().trim();

  if (n.includes('tata') || n.includes('fly')) return FINANCE_PRODUCT_LINKS['tata'];
  if (n.includes('prefr') || n.includes('finable') || n.includes('finaable')) return FINANCE_PRODUCT_LINKS['prefr'];
  if (n.includes('ramfin') || n.includes('ram fincorp')) return FINANCE_PRODUCT_LINKS['ramfincorp'];
  if (n.includes('kredit') || n.includes('kreditbee')) return FINANCE_PRODUCT_LINKS['kreditbee'];
  if (n.includes('unity')) return FINANCE_PRODUCT_LINKS['unity'];
  if (n.includes('poonawalla') || n.includes('punawalla')) return FINANCE_PRODUCT_LINKS['poonawalla'];
  if (n.includes('bajaj')) return FINANCE_PRODUCT_LINKS['bajaj'];

  return null;
};

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
    partner_url: FINANCE_PRODUCT_LINKS['prefr'],
    public_url: FINANCE_PRODUCT_LINKS['prefr'],
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
    partner_url: FINANCE_PRODUCT_LINKS['poonawalla'],
    public_url: FINANCE_PRODUCT_LINKS['poonawalla'],
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
    partner_url: FINANCE_PRODUCT_LINKS['bajaj'],
    public_url: FINANCE_PRODUCT_LINKS['bajaj'],
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
    partner_url: FINANCE_PRODUCT_LINKS['kreditbee'],
    public_url: FINANCE_PRODUCT_LINKS['kreditbee'],
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
    partner_url: FINANCE_PRODUCT_LINKS['tata'],
    public_url: FINANCE_PRODUCT_LINKS['tata'],
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
    partner_url: FINANCE_PRODUCT_LINKS['unity'],
    public_url: FINANCE_PRODUCT_LINKS['unity'],
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
    partner_url: FINANCE_PRODUCT_LINKS['ramfincorp'],
    public_url: FINANCE_PRODUCT_LINKS['ramfincorp'],
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

// ─────────────────────────────────────────────────────────────────────────────
// PRESET PRODUCT DEFINITIONS FOR INCOME-BASED LOANS (BANK & FINANCE)
// ─────────────────────────────────────────────────────────────────────────────

export const INCOME_BANK_PRESET_PRODUCTS = [
  {
    name: 'HDFC',
    bank_name: 'HDFC Bank',
    bank_code: 'HDFC',
    loan_type: 'income',
    provider_type: 'bank',
    description: 'HDFC Bank Income-based Personal Loan offers quick sanction up to ₹40 Lakhs for salaried individuals with low interest rates, flexible tenure up to 5 years, and paperless salary verification.',
    annual_fee: '10.50% p.a.',
    interest_rate: '10.50% p.a.',
    processing_fee: 'Up to 2.50% + GST',
    time_period: '12 - 60 Months',
    disbursal_time: 'Within 24 Hours',
    min_amount: '50000',
    max_amount: '4000000',
    min_income: 25000,
    min_age: 21,
    max_age: 60,
    cibil_required: 700,
    badge: 'Top Salaried',
    features: [
      'Competitive interest rates for salaried employees',
      'Instant sanction with NetBanking statement upload',
      'Flexible repayment tenure up to 60 months',
      'Special discounted rates for top corporate employees'
    ]
  },
  {
    name: 'Indusind',
    bank_name: 'IndusInd Bank',
    bank_code: 'INDUSIND',
    loan_type: 'income',
    provider_type: 'bank',
    description: 'IndusInd Bank Income-based Personal Loan provides tailor-made financing for salaried and self-employed professionals with swift income assessment and direct account crediting.',
    annual_fee: '10.49% p.a.',
    interest_rate: '10.49% p.a.',
    processing_fee: 'Up to 2.0% + GST',
    time_period: '12 - 60 Months',
    disbursal_time: 'Within 24 Hours',
    min_amount: '30000',
    max_amount: '2500000',
    min_income: 25000,
    min_age: 21,
    max_age: 60,
    cibil_required: 680,
    badge: 'Quick Sanction',
    features: [
      'Flexible loan amounts up to ₹25 Lakhs',
      'Simple income proof via NetBanking or ITR',
      'Customized monthly EMI repayment options',
      'Doorstep document assistance for fast approval'
    ]
  },
  {
    name: 'Yes',
    bank_name: 'YES Bank',
    bank_code: 'YES',
    loan_type: 'income',
    provider_type: 'bank',
    description: 'YES Bank Personal Loan offers hassle-free funding for medical emergencies, travel, weddings, or business needs based on salary and income records with 1-minute in-principle approval.',
    annual_fee: '10.99% p.a.',
    interest_rate: '10.99% p.a.',
    processing_fee: 'Up to 2.0% + GST',
    time_period: '12 - 60 Months',
    disbursal_time: 'Same Day Disbursal',
    min_amount: '100000',
    max_amount: '4000000',
    min_income: 25000,
    min_age: 21,
    max_age: 60,
    cibil_required: 680,
    badge: '1-Min Approval',
    features: [
      '1-minute in-principle online loan approval',
      'No collateral or guarantor required',
      'Attractive interest rates for salaried applicants',
      'Part-prepayment and easy foreclosure options'
    ]
  },
  {
    name: 'ICICI',
    bank_name: 'ICICI Bank',
    bank_code: 'ICICI',
    loan_type: 'income',
    provider_type: 'bank',
    description: 'ICICI Bank Income-based Personal Loan delivers instant digital sanction up to ₹50 Lakhs with minimum paperwork and salary verification for salaried customers.',
    annual_fee: '10.75% p.a.',
    interest_rate: '10.75% p.a.',
    processing_fee: 'Up to 2.0% + GST',
    time_period: '12 - 72 Months',
    disbursal_time: 'Within 2 Hours',
    min_amount: '50000',
    max_amount: '5000000',
    min_income: 30000,
    min_age: 21,
    max_age: 58,
    cibil_required: 700,
    badge: 'High Value',
    features: [
      'High loan sanction up to ₹50 Lakhs',
      'Flexible repayment tenure up to 72 months',
      'Pre-approved offers for salary account holders',
      '100% paperless e-sign digital loan journey'
    ]
  },
  {
    name: 'Kotak',
    bank_name: 'Kotak Mahindra Bank',
    bank_code: 'KOTAK',
    loan_type: 'income',
    provider_type: 'bank',
    description: 'Kotak Mahindra Bank Personal Loan provides fast online approval and funds in account in under 3 seconds after digital verification of salary slips and income proof.',
    annual_fee: '10.99% p.a.',
    interest_rate: '10.99% p.a.',
    processing_fee: 'Up to 2.5% + GST',
    time_period: '12 - 60 Months',
    disbursal_time: 'Instant (10 Seconds)',
    min_amount: '50000',
    max_amount: '4000000',
    min_income: 25000,
    min_age: 21,
    max_age: 60,
    cibil_required: 680,
    badge: 'Instant Cash',
    features: [
      'Super-fast disbursal in 3 seconds post verification',
      'Minimal paperwork for salaried professionals',
      'Attractive interest rates and transparent fees',
      'Flexible EMI tenure options up to 5 years'
    ]
  },
  {
    name: 'AXIS',
    bank_name: 'Axis Bank',
    bank_code: 'AXIS',
    loan_type: 'income',
    provider_type: 'bank',
    description: 'Axis Bank 24x7 Personal Loan delivers end-to-end digital approval for salaried applicants based on income and bank statement verification with instant funds crediting.',
    annual_fee: '10.75% p.a.',
    interest_rate: '10.75% p.a.',
    processing_fee: 'Up to 2.0% + GST',
    time_period: '12 - 60 Months',
    disbursal_time: 'Same Day Disbursal',
    min_amount: '50000',
    max_amount: '4000000',
    min_income: 25000,
    min_age: 21,
    max_age: 60,
    cibil_required: 700,
    badge: '24x7 Digital',
    features: [
      'End-to-end paperless digital process',
      'Disbursal within minutes of income verification',
      'Flexible repayment tenure up to 5 years',
      'Zero prepayment charges after select period'
    ]
  },
  {
    name: 'IDFC',
    bank_name: 'IDFC First Bank',
    bank_code: 'IDFC',
    loan_type: 'income',
    provider_type: 'bank',
    description: 'IDFC FIRST Bank Income-based Personal Loan offers attractive interest rates, zero foreclosure charges on select tenures, and flexible loan amounts for salaried individuals.',
    annual_fee: '10.49% p.a.',
    interest_rate: '10.49% p.a.',
    processing_fee: 'Up to 2.0% + GST',
    time_period: '12 - 60 Months',
    disbursal_time: 'Within 2 Hours',
    min_amount: '50000',
    max_amount: '4000000',
    min_income: 25000,
    min_age: 21,
    max_age: 60,
    cibil_required: 700,
    badge: 'Zero Foreclosure',
    features: [
      'Zero foreclosure charges after 3 EMIs',
      'Instant sanction with online salary slip upload',
      'Competitive interest rates starting at 10.49%',
      'Flexible EMI options up to 60 months'
    ]
  }
];

export const INCOME_FINANCE_PRESET_PRODUCTS = [
  {
    name: 'Finable',
    bank_name: 'Finable',
    bank_code: 'FINABLE',
    loan_type: 'income',
    provider_type: 'finance',
    partner_url: FINANCE_PRODUCT_LINKS['prefr'],
    public_url: FINANCE_PRODUCT_LINKS['prefr'],
    description: 'Finable Income-based Personal Loan provides paperless instant cash directly to your bank account with streamlined salary evaluation, transparent pricing, and flexible repayment EMIs.',
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
    cibil_required: 680,
    badge: 'Salary Approved',
    features: [
      'Digital personal loan with rapid salary verification',
      'Collateral-free instant online cash transfer',
      'Transparent charges with no hidden fees',
      'Convenient flexible EMI repayment options'
    ]
  },
  {
    name: 'Punawalla Finance',
    bank_name: 'Punawalla Finance',
    bank_code: 'PUNAWALLA',
    loan_type: 'income',
    provider_type: 'finance',
    partner_url: FINANCE_PRODUCT_LINKS['poonawalla'],
    public_url: FINANCE_PRODUCT_LINKS['poonawalla'],
    description: 'Punawalla Finance offers instant sanction personal loans for salaried and self-employed individuals with high approval rates on salary slips and competitive interest rates.',
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
    cibil_required: 680,
    badge: 'Quick Disbursal',
    features: [
      'Fast-track loan approval powered by salary verification',
      'High sanction limits with minimal documentation',
      'Zero foreclosure charges after qualifying period',
      'Instant sanction letter delivered online'
    ]
  },
  {
    name: 'Bajaj Finance',
    bank_name: 'Bajaj Finance',
    bank_code: 'BAJAJ',
    loan_type: 'income',
    provider_type: 'finance',
    partner_url: FINANCE_PRODUCT_LINKS['bajaj'],
    public_url: FINANCE_PRODUCT_LINKS['bajaj'],
    description: 'Bajaj Finance provides high-value personal loans with instant online approval, flexible Flexi-hybrid repayment, and quick disbursal based on monthly income and salary proofs.',
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
    cibil_required: 680,
    badge: 'Flexi Loan',
    features: [
      'Flexi-loan facility with withdraw & repay on-demand',
      'Quick online approval for salaried applicants',
      'Up to ₹40 Lakhs pre-approved credit line',
      'Disbursal within 24 hours of approval'
    ]
  },
  {
    name: 'KreditBee',
    bank_name: 'KreditBee',
    bank_code: 'KREDITBEE',
    loan_type: 'income',
    provider_type: 'finance',
    partner_url: FINANCE_PRODUCT_LINKS['kreditbee'],
    public_url: FINANCE_PRODUCT_LINKS['kreditbee'],
    description: 'KreditBee offers instant personal loans for salaried and self-employed individuals with quick salary slip verification, online KYC, and direct money transfer to your bank account.',
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
    cibil_required: 650,
    badge: '10-Min Disbursal',
    features: [
      '100% digital process completed in 10 minutes',
      'Direct bank transfer upon salary verification',
      'Flexible micro-ticket and personal loan options',
      'Minimal documentation via video KYC'
    ]
  },
  {
    name: 'Tata Capital',
    bank_name: 'Tata Capital',
    bank_code: 'TATACAPITAL',
    loan_type: 'income',
    provider_type: 'finance',
    partner_url: FINANCE_PRODUCT_LINKS['tata'],
    public_url: FINANCE_PRODUCT_LINKS['tata'],
    description: 'Tata Capital offers multi-purpose personal loans for salaried individuals with fast income verification and flexible repayment tenures up to 6 years.',
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
    cibil_required: 680,
    badge: 'Tata Trust',
    features: [
      'Trusted Tata brand with customized loan offerings',
      'Instant digital sanction based on income proofs',
      'Competitive interest rates starting at 10.99%',
      'Flexible repayment options up to 6 years'
    ]
  },
  {
    name: 'Unity',
    bank_name: 'Unity',
    bank_code: 'UNITY',
    loan_type: 'income',
    provider_type: 'finance',
    partner_url: FINANCE_PRODUCT_LINKS['unity'],
    public_url: FINANCE_PRODUCT_LINKS['unity'],
    description: 'Unity provides hassle-free personal loans with swift income assessment based on salary proofs, transparent fees, and rapid disbursal directly to your account.',
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
    cibil_required: 680,
    badge: 'Easy EMI',
    features: [
      'Simple and quick digital personal loan',
      'Fast turnaround time with income verification',
      'Transparent terms and affordable monthly EMIs',
      'Dedicated customer support and doorstep assistance'
    ]
  },
  {
    name: 'Ram Fincorp',
    bank_name: 'Ram Fincorp',
    bank_code: 'RAMFINCORP',
    loan_type: 'income',
    provider_type: 'finance',
    partner_url: FINANCE_PRODUCT_LINKS['ramfincorp'],
    public_url: FINANCE_PRODUCT_LINKS['ramfincorp'],
    description: 'Ram Fincorp offers quick personal loans designed for urgent financial needs with minimal verification delays, prompt salary assessment, and flexible repayment tenures.',
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
    cibil_required: 680,
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

/**
 * Checks whether a given product belongs to a specified subcategory.
 * Applies comprehensive rules for loan subcategories (home-loan, personal-loan, business-loan, lap, etc.)
 * as well as insurance subcategories and generic slug matching.
 *
 * @param {Object} p - The product object
 * @param {string} subCat - The subcategory slug or label (e.g. 'home-loan', 'personal-loan')
 * @returns {boolean}
 */
export const isProductOfSubCategory = (p, subCat) => {
  if (!subCat || subCat === 'all' || String(subCat).toLowerCase() === 'all') return true;
  if (!p) return false;

  const rawSlug = String(subCat).toLowerCase().trim();
  const slug = rawSlug.replace(/[-_]/g, ' ').trim();
  const pCat = String(p.category || '').toLowerCase().trim();
  const pSub = String(p.sub_category || '').toLowerCase().trim();
  const pName = String(p.name || '').toLowerCase().trim();

  // 1. HOME LOAN
  if (rawSlug === 'home-loan' || rawSlug === 'home_loan' || rawSlug === 'home' || slug === 'home loan') {
    return (
      pCat === 'home_loan' ||
      pCat.includes('home_loan') ||
      pCat.includes('homeloan') ||
      pSub.includes('home loan') ||
      pSub === 'home' ||
      pName.includes('home loan') ||
      pName.includes('housing loan') ||
      pName.includes('home purchase') ||
      pName.includes('home construction') ||
      pName.includes('plot loan')
    );
  }

  // 2. PERSONAL LOAN
  if (rawSlug === 'personal-loan' || rawSlug === 'personal_loan' || rawSlug === 'personal' || slug === 'personal loan') {
    // Exclude credit card loans, loc/eoc, smart emi, home loans, car loans, business loans
    const isLocEocOrCardLoan = (
      ['loan_on_credit_card', 'loc_eoc', 'smart_emi', 'loc', 'eoc', 'card_on_loan'].includes(pCat) ||
      pSub.includes('credit card') ||
      pSub.includes('loc') ||
      pSub.includes('eoc') ||
      pSub.includes('smart emi') ||
      pName.includes('on credit card') ||
      pName.includes('smart emi') ||
      pName.includes('limit to cash') ||
      pName.includes('encash')
    );
    if (isLocEocOrCardLoan) return false;

    if (pCat === 'home_loan' || pCat.includes('home_loan') || pName.includes('home loan')) return false;
    if (pCat === 'business_loan' || pCat.includes('business') || pName.includes('business loan')) return false;
    if (pCat === 'used_car_loan' || pCat.includes('car') || pName.includes('car loan')) return false;
    if (pCat.includes('gold') || pName.includes('gold loan')) return false;

    return (
      pCat === 'personal_loan' ||
      pCat === 'instant_loan' ||
      pCat.includes('personal') ||
      pSub.includes('personal') ||
      pName.includes('personal loan') ||
      pName.includes('xpress credit') ||
      pName.includes('cash loan')
    );
  }

  // 3. BUSINESS LOAN / MSME / SME
  if (
    rawSlug === 'business-loan' ||
    rawSlug === 'business_loan' ||
    rawSlug === 'business' ||
    slug === 'business loan' ||
    slug === 'msme loan' ||
    slug === 'sme loan'
  ) {
    return (
      pCat === 'business_loan' ||
      pCat.includes('business') ||
      pSub.includes('business') ||
      pSub.includes('msme') ||
      pSub.includes('sme') ||
      pName.includes('business loan') ||
      pName.includes('msme') ||
      pName.includes('sme loan') ||
      pName.includes('commercial loan')
    );
  }

  // 4. LOAN AGAINST PROPERTY (LAP / LAC)
  if (
    rawSlug === 'loan-against-property' ||
    rawSlug === 'lap' ||
    rawSlug === 'lac' ||
    slug === 'loan against property' ||
    slug === 'lap'
  ) {
    return (
      pCat === 'lac' ||
      pCat.includes('property') ||
      pCat.includes('lap') ||
      pSub.includes('property') ||
      pSub.includes('lap') ||
      pName.includes('against property') ||
      pName.includes('loan against property') ||
      pName.includes('mortgage') ||
      pName.includes('lap')
    );
  }

  // 5. VEHICLE / CAR / AUTO / BIKE / TWO WHEELER LOAN
  if (
    rawSlug === 'vehicle-loan' ||
    rawSlug === 'car-loan' ||
    rawSlug === 'auto-loan' ||
    rawSlug === 'bike-loan' ||
    rawSlug === 'used-car-loan' ||
    slug.includes('vehicle') ||
    slug.includes('car loan') ||
    slug.includes('bike')
  ) {
    return (
      pCat === 'used_car_loan' ||
      pCat.includes('car') ||
      pCat.includes('vehicle') ||
      pCat.includes('auto') ||
      pCat.includes('bike') ||
      pSub.includes('car') ||
      pSub.includes('vehicle') ||
      pSub.includes('auto') ||
      pSub.includes('bike') ||
      pName.includes('car loan') ||
      pName.includes('vehicle loan') ||
      pName.includes('auto loan') ||
      pName.includes('bike loan') ||
      pName.includes('two wheeler')
    );
  }

  // 6. GOLD LOAN
  if (rawSlug === 'gold-loan' || rawSlug === 'gold_loan' || rawSlug === 'gold' || slug === 'gold loan') {
    return (
      pCat.includes('gold') ||
      pSub.includes('gold') ||
      pName.includes('gold loan') ||
      pName.includes('gold')
    );
  }

  // 7. EDUCATION LOAN
  if (
    rawSlug === 'education-loan' ||
    rawSlug === 'edu-loan' ||
    rawSlug === 'education_loan' ||
    slug === 'education loan'
  ) {
    return (
      pCat === 'education_loan' ||
      pCat.includes('education') ||
      pSub.includes('education') ||
      pSub.includes('student') ||
      pName.includes('education loan') ||
      pName.includes('student loan')
    );
  }

  // 8. LOAN ON CREDIT CARD / SMART EMI / LOC / EOC
  if (
    rawSlug === 'loan-on-credit-card' ||
    rawSlug === 'smart-emi' ||
    rawSlug === 'loc-eoc' ||
    rawSlug === 'loc' ||
    rawSlug === 'eoc' ||
    slug.includes('credit card') ||
    slug.includes('smart emi') ||
    slug === 'loc' ||
    slug === 'eoc'
  ) {
    return (
      ['loan_on_credit_card', 'smart_emi', 'loc_eoc', 'loc', 'eoc', 'card_on_loan'].includes(pCat) ||
      pSub.includes('credit card') ||
      pSub.includes('loc') ||
      pSub.includes('eoc') ||
      pSub.includes('smart emi') ||
      pName.includes('on credit card') ||
      pName.includes('dial-a-loan') ||
      pName.includes('instant personal loan on card') ||
      pName.includes('insta loan') ||
      pName.includes('jumbo loan') ||
      pName.includes('split-n-pay') ||
      pName.includes('encash')
    );
  }

  // 9. HEALTH INSURANCE
  if (rawSlug === 'health-insurance' || rawSlug === 'health' || slug === 'health insurance') {
    return (
      pCat === 'health_insurance' ||
      pCat.includes('health') ||
      pSub.includes('health') ||
      pName.includes('health') ||
      pName.includes('mediclaim') ||
      pName.includes('hospital')
    );
  }

  // 10. LIFE INSURANCE
  if (rawSlug === 'life-insurance' || rawSlug === 'life' || slug === 'life insurance') {
    return (
      pCat === 'life_insurance' ||
      pCat.includes('life') ||
      pSub.includes('life') ||
      pName.includes('life insurance') ||
      pName.includes('life plan')
    );
  }

  // 11. GENERAL / MOTOR / VEHICLE INSURANCE
  if (
    rawSlug === 'general-insurance' ||
    rawSlug === 'motor-insurance' ||
    rawSlug === 'car-insurance' ||
    slug.includes('general') ||
    slug.includes('motor')
  ) {
    return (
      pCat === 'general_insurance' ||
      pCat.includes('general') ||
      pCat.includes('motor') ||
      pCat.includes('vehicle') ||
      pSub.includes('general') ||
      pSub.includes('motor') ||
      pSub.includes('vehicle') ||
      pName.includes('motor') ||
      pName.includes('general') ||
      pName.includes('vehicle insurance') ||
      pName.includes('car insurance')
    );
  }

  // 12. TERM INSURANCE
  if (rawSlug === 'term-insurance' || rawSlug === 'term' || slug === 'term insurance') {
    return (
      pCat.includes('term') ||
      pSub.includes('term') ||
      pName.includes('term insurance') ||
      pName.includes('term plan')
    );
  }

  // 13. FALLBACK / GENERAL MATCH
  if (pSub && (pSub.toLowerCase() === slug || pSub.toLowerCase().replace(/[-_]/g, ' ') === slug)) return true;
  if (pCat && (pCat.toLowerCase() === rawSlug || pCat.toLowerCase().replace(/[-_]/g, ' ') === slug)) return true;

  const words = slug.split(/\s+/).filter(w => w.length > 2 && w !== 'loan' && w !== 'insurance');
  if (words.length > 0) {
    const allWordsMatch = words.every(w => pCat.includes(w) || pSub.includes(w) || pName.includes(w));
    if (allWordsMatch) return true;
  }

  return false;
};


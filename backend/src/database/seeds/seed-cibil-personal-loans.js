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
  { name: 'ICICI Bank', short_code: 'ICICI' },
  { name: 'Kotak Mahindra Bank', short_code: 'KOTAK' },
  { name: 'Axis Bank', short_code: 'AXIS' },
  { name: 'YES Bank', short_code: 'YES' },
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
    documents_required: 'PAN Card, Aadhaar Card, 3 Months Bank Statement',
    partner_url: 'https://www.wishfin.com/prefr/home?source=Rey_june26_FW18',
    public_url: 'https://www.wishfin.com/prefr/home?source=Rey_june26_FW18'
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
    documents_required: 'PAN Card, Aadhaar Card, Latest Salary Slips',
    partner_url: 'https://instant-pocket-loan.poonawallafincorp.com/?redirectto=primepl&utm_DSA_Code=PUP00228&UTM_Partner_Name=WISHFIN&UTM_Partner_Medium=SMS&UTM_Partner_AgentCode=PFLWISHFIN&UTM_Partner_ReferenceID=WF_FW_REY_PR_26',
    public_url: 'https://instant-pocket-loan.poonawallafincorp.com/?redirectto=primepl&utm_DSA_Code=PUP00228&UTM_Partner_Name=WISHFIN&UTM_Partner_Medium=SMS&UTM_Partner_AgentCode=PFLWISHFIN&UTM_Partner_ReferenceID=WF_FW_REY_PR_26'
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
    documents_required: 'PAN Card, Aadhaar Card, Salary Slips, Bank Statement',
    partner_url: 'https://www.bajajfinserv.in/personal-loan',
    public_url: 'https://www.bajajfinserv.in/personal-loan'
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
    documents_required: 'PAN Card, Aadhaar Card, Selfie Video KYC',
    partner_url: 'https://www.wishfin.com/kreditbee/home?source=fin41',
    public_url: 'https://www.wishfin.com/kreditbee/home?source=fin41'
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
    documents_required: 'PAN Card, Aadhaar Card, 3 Months Salary Slips, Bank Statement',
    partner_url: 'https://www.wishfin.com/tata/home?source=FWRey_July&utm_source=FW38&utm_medium=SMS&utm_campaign=promotion&utm_content=check_offer&utm_term=tata',
    public_url: 'https://www.wishfin.com/tata/home?source=FWRey_July&utm_source=FW38&utm_medium=SMS&utm_campaign=promotion&utm_content=check_offer&utm_term=tata'
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
    documents_required: 'PAN Card, Aadhaar Card, Bank Statement',
    partner_url: 'https://loans.theunitybank.com/unity-pl-ui/page/exclusion/login/logindetails?utm_source=Partner&utm_medium=Wishfin&utm_campaign=finwizz11',
    public_url: 'https://loans.theunitybank.com/unity-pl-ui/page/exclusion/login/logindetails?utm_source=Partner&utm_medium=Wishfin&utm_campaign=finwizz11'
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
    partner_url: 'https://applyonline.ramfincorp.com/?utm_source=Wishfin49&utm_campaign=default_campaign&utm_medium=default_medium&utm_trackingid=FW_30',
    public_url: 'https://applyonline.ramfincorp.com/?utm_source=Wishfin49&utm_campaign=default_campaign&utm_medium=default_medium&utm_trackingid=FW_30'
  },

  // ─── GROUP 3: INCOME BASED - BANK (7 Products) ──────────────────────────
  {
    bank_code: 'HDFC',
    bank_name: 'HDFC Bank',
    name: 'HDFC Personal Loan',
    category: 'personal_loan',
    sub_category: 'Personal Loan',
    loan_type: 'income',
    provider_type: 'bank',
    short_description: 'Low-interest salary & income based personal loan from HDFC Bank with high loan amounts.',
    description: 'HDFC Personal Loan offers flexible funding up to ₹40 Lakhs based on verified salary slips and ITR documents with preferential rates for corporate employees.',
    annual_fee: '10.50% p.a.',
    interest_rate: '10.50% p.a.',
    processing_fee: 'Up to 1.5% + GST',
    time_period: '12 - 72 Months',
    disbursal_time: 'Within 24 Hours',
    min_amount: '50000',
    max_amount: '4000000',
    min_income: 25000,
    min_age: 21,
    max_age: 60,
    cibil_required: 700,
    badge: 'High Value',
    display_order: 11,
    features: [
      'Loan amounts up to ₹40 Lakhs based on income proof',
      'Flexible repayment tenure up to 6 years (72 months)',
      'Special discounted interest rates for salaried employees',
      'Easy digital verification of salary slips & bank statements'
    ],
    eligibility_criteria: 'Salaried/self-employed with minimum monthly income ₹25,000 and valid income proof.',
    documents_required: 'PAN Card, Aadhaar Card, 3 Months Salary Slips, 6 Months Bank Statement'
  },
  {
    bank_code: 'INDUSIND',
    bank_name: 'IndusInd Bank',
    name: 'IndusInd Personal Loan',
    category: 'personal_loan',
    sub_category: 'Personal Loan',
    loan_type: 'income',
    provider_type: 'bank',
    short_description: 'Fast digital personal loan from IndusInd Bank with quick salary slip evaluation.',
    description: 'IndusInd Bank Income Personal Loan offers collateral-free financing tailored to your income profile with instant online documentation and quick disbursal.',
    annual_fee: '10.49% p.a.',
    interest_rate: '10.49% p.a.',
    processing_fee: 'Up to 2.0% + GST',
    time_period: '12 - 60 Months',
    disbursal_time: 'Within 24 Hours',
    min_amount: '50000',
    max_amount: '2500000',
    min_income: 25000,
    min_age: 21,
    max_age: 60,
    cibil_required: 700,
    badge: 'Fast Processing',
    display_order: 12,
    features: [
      'Multi-purpose personal loan based on verified earnings',
      'Minimal paperwork with digital salary slip upload',
      'Competitive interest rates starting at 10.49% p.a.',
      'Flexible tenure choices from 1 to 5 years'
    ],
    eligibility_criteria: 'Indian citizen aged 21-60 with regular monthly salary ₹25,000+.',
    documents_required: 'PAN Card, Aadhaar Card, Salary Slips, Bank Statement'
  },
  {
    bank_code: 'YES',
    bank_name: 'YES Bank',
    name: 'YES Bank Personal Loan',
    category: 'personal_loan',
    sub_category: 'Personal Loan',
    loan_type: 'income',
    provider_type: 'bank',
    short_description: 'Competitive personal loans from YES Bank with flexible repayment and attractive interest rates.',
    description: 'YES Bank Personal Loan provides swift funding for personal, medical, or lifestyle expenses with transparent terms and flexible tenures up to 60 months.',
    annual_fee: '10.99% p.a.',
    interest_rate: '10.99% p.a.',
    processing_fee: 'Up to 2.0% + GST',
    time_period: '12 - 60 Months',
    disbursal_time: 'Within 24 Hours',
    min_amount: '100000',
    max_amount: '4000000',
    min_income: 25000,
    min_age: 21,
    max_age: 60,
    cibil_required: 700,
    badge: 'Flexible EMI',
    display_order: 13,
    features: [
      'High loan quantum up to ₹40 Lakhs based on income',
      'Quick digital sanction and paperless document verification',
      'Flexible EMI tenure up to 5 years',
      'Transparent charges with no hidden fees'
    ],
    eligibility_criteria: 'Salaried individual earning minimum ₹25,000/month with valid KYC.',
    documents_required: 'PAN Card, Aadhaar Card, 3 Months Salary Slips, 3 Months Bank Statement'
  },
  {
    bank_code: 'ICICI',
    bank_name: 'ICICI Bank',
    name: 'ICICI Bank Personal Loan',
    category: 'personal_loan',
    sub_category: 'Personal Loan',
    loan_type: 'income',
    provider_type: 'bank',
    short_description: 'Instant paperless income loan from ICICI Bank with flexible tenure up to 72 months.',
    description: 'ICICI Bank Personal Loan offers convenient digital borrowing based on income verification with pre-approved offers for corporate salary account holders.',
    annual_fee: '10.65% p.a.',
    interest_rate: '10.65% p.a.',
    processing_fee: 'Up to 2.25% + GST',
    time_period: '12 - 72 Months',
    disbursal_time: 'Within 24 Hours',
    min_amount: '50000',
    max_amount: '5000000',
    min_income: 30000,
    min_age: 23,
    max_age: 58,
    cibil_required: 700,
    badge: 'Popular Bank',
    display_order: 14,
    features: [
      'Loan amounts up to ₹50 Lakhs based on income proof',
      'Repayment tenure from 12 to 72 months',
      'Special terms for ICICI salary account holders',
      'End-to-end digital paperless processing'
    ],
    eligibility_criteria: 'Salaried employee with monthly take-home salary ₹30,000+.',
    documents_required: 'PAN Card, Aadhaar Card, 3 Months Salary Slips, 6 Months Bank Statement'
  },
  {
    bank_code: 'KOTAK',
    bank_name: 'Kotak Mahindra Bank',
    name: 'Kotak Personal Loan',
    category: 'personal_loan',
    sub_category: 'Personal Loan',
    loan_type: 'income',
    provider_type: 'bank',
    short_description: 'Quick online personal loan from Kotak Mahindra Bank with minimal documentation.',
    description: 'Kotak Personal Loan provides fast access to funds for medical emergencies, weddings, home improvement, or travel based on verified income.',
    annual_fee: '10.99% p.a.',
    interest_rate: '10.99% p.a.',
    processing_fee: 'Up to 2.5% + GST',
    time_period: '12 - 60 Months',
    disbursal_time: 'Within 24 Hours',
    min_amount: '50000',
    max_amount: '4000000',
    min_income: 25000,
    min_age: 21,
    max_age: 58,
    cibil_required: 700,
    badge: 'Quick Disbursal',
    display_order: 15,
    features: [
      'Quick loan disbursal into bank account within 24 hours',
      'Loans up to ₹40 Lakhs tailored to your income level',
      'Minimal documentation with simple online verification',
      'Flexible tenures from 12 to 60 months'
    ],
    eligibility_criteria: 'Salaried individual earning ₹25,000+ (for Kotak account holders) or ₹30,000+ (others).',
    documents_required: 'PAN Card, Aadhaar Card, 3 Months Salary Slips, Bank Statement'
  },
  {
    bank_code: 'AXIS',
    bank_name: 'Axis Bank',
    name: 'Axis Bank Personal Loan',
    category: 'personal_loan',
    sub_category: 'Personal Loan',
    loan_type: 'income',
    provider_type: 'bank',
    short_description: 'Attractive interest rates & transparent terms on Axis Bank Personal Loans.',
    description: 'Axis Bank Personal Loan gives you instant digital liquidity based on your income documents with zero prepayment charges on select tenures.',
    annual_fee: '10.49% p.a.',
    interest_rate: '10.49% p.a.',
    processing_fee: 'Up to 2.0% + GST',
    time_period: '12 - 60 Months',
    disbursal_time: 'Within 24 Hours',
    min_amount: '50000',
    max_amount: '4000000',
    min_income: 25000,
    min_age: 21,
    max_age: 60,
    cibil_required: 700,
    badge: 'Transparent Rates',
    display_order: 16,
    features: [
      'Borrow up to ₹40 Lakhs based on salary and income track record',
      'Repayment tenure ranging from 12 to 60 months',
      '100% digital application and document upload',
      'Part-prepayment option available'
    ],
    eligibility_criteria: 'Salaried employee with monthly net income ₹25,000+ and age 21-60.',
    documents_required: 'PAN Card, Aadhaar Card, Salary Slips, 6 Months Bank Statement'
  },
  {
    bank_code: 'IDFC',
    bank_name: 'IDFC First Bank',
    name: 'IDFC First Personal Loan',
    category: 'personal_loan',
    sub_category: 'Personal Loan',
    loan_type: 'income',
    provider_type: 'bank',
    short_description: 'Transparent personal loan from IDFC First Bank with zero foreclosure fees on select terms.',
    description: 'IDFC First Bank Personal Loan offers customer-friendly personal loans based on income verification with competitive interest rates and flexible tenures.',
    annual_fee: '10.49% p.a.',
    interest_rate: '10.49% p.a.',
    processing_fee: 'Up to 2.0% + GST',
    time_period: '12 - 60 Months',
    disbursal_time: 'Within 24 Hours',
    min_amount: '50000',
    max_amount: '4000000',
    min_income: 25000,
    min_age: 21,
    max_age: 60,
    cibil_required: 700,
    badge: 'Customer First',
    display_order: 17,
    features: [
      'Transparent pricing with competitive interest rates',
      'Higher eligibility based on complete household income',
      'Flexible tenures up to 5 years',
      'Quick paperless digital approval'
    ],
    eligibility_criteria: 'Indian citizen with monthly income ₹25,000+ and active banking account.',
    documents_required: 'PAN Card, Aadhaar Card, 3 Months Salary Slips, Bank Statement'
  },

  // ─── GROUP 4: INCOME BASED - FINANCE (7 Products with UTM links) ───────
  {
    bank_code: 'FINABLE',
    bank_name: 'Finable',
    name: 'Finable Income Loan',
    category: 'personal_loan',
    sub_category: 'Personal Loan',
    loan_type: 'income',
    provider_type: 'finance',
    short_description: 'Quick salary-based personal loan from Finable with easy document verification.',
    description: 'Finable Income Personal Loan provides immediate digital cash transfers directly to your bank account with streamlined salary slip evaluation.',
    annual_fee: '11.99% p.a.',
    interest_rate: '11.99% p.a.',
    processing_fee: 'Up to 2.0% + GST',
    time_period: '6 - 36 Months',
    disbursal_time: 'Within 2 Hours',
    min_amount: '25000',
    max_amount: '1000000',
    min_income: 15000,
    min_age: 21,
    max_age: 58,
    cibil_required: 650,
    badge: 'Fast Cash',
    display_order: 18,
    partner_url: 'https://www.wishfin.com/prefr/home?source=Rey_june26_FW18',
    public_url: 'https://www.wishfin.com/prefr/home?source=Rey_june26_FW18',
    features: [
      'Instant income verification via digital net-banking/salary slip',
      'Collateral-free cash disbursed to savings account in hours',
      'Affordable interest rates for salaried workforce',
      'Flexible EMIs with convenient auto-debit'
    ],
    eligibility_criteria: 'Salaried individual earning minimum ₹15,000/month with valid KYC.',
    documents_required: 'PAN Card, Aadhaar Card, 3 Months Salary Slips / Bank Statement'
  },
  {
    bank_code: 'PUNAWALLA',
    bank_name: 'Punawalla Finance',
    name: 'Punawalla Income Loan',
    category: 'personal_loan',
    sub_category: 'Personal Loan',
    loan_type: 'income',
    provider_type: 'finance',
    short_description: 'Fast digital personal loans from Poonawalla Fincorp based on salary & income proof.',
    description: 'Poonawalla Fincorp Personal Loan offers swift funding up to ₹30 Lakhs with minimum documentation, attractive interest rates, and transparent digital process.',
    annual_fee: '9.99% p.a.',
    interest_rate: '9.99% p.a.',
    processing_fee: 'Up to 2.0% + GST',
    time_period: '12 - 60 Months',
    disbursal_time: 'Within 24 Hours',
    min_amount: '50000',
    max_amount: '3000000',
    min_income: 20000,
    min_age: 22,
    max_age: 58,
    cibil_required: 680,
    badge: 'Top NBFC',
    display_order: 19,
    partner_url: 'https://instant-pocket-loan.poonawallafincorp.com/?redirectto=primepl&utm_DSA_Code=PUP00228&UTM_Partner_Name=WISHFIN&UTM_Partner_Medium=SMS&UTM_Partner_AgentCode=PFLWISHFIN&UTM_Partner_ReferenceID=WF_FW_REY_PR_26',
    public_url: 'https://instant-pocket-loan.poonawallafincorp.com/?redirectto=primepl&utm_DSA_Code=PUP00228&UTM_Partner_Name=WISHFIN&UTM_Partner_Medium=SMS&UTM_Partner_AgentCode=PFLWISHFIN&UTM_Partner_ReferenceID=WF_FW_REY_PR_26',
    features: [
      'High loan amounts up to ₹30 Lakhs based on income proof',
      'Industry-leading low interest rates starting at 9.99% p.a.',
      'Zero hidden charges with 100% transparent fee structure',
      'Flexible tenures up to 60 months'
    ],
    eligibility_criteria: 'Salaried individual with monthly income ₹20,000+ and age 22-58.',
    documents_required: 'PAN Card, Aadhaar Card, 3 Months Salary Slips, Bank Statement'
  },
  {
    bank_code: 'BAJAJ',
    bank_name: 'Bajaj Finance',
    name: 'Bajaj Finance Income Loan',
    category: 'personal_loan',
    sub_category: 'Personal Loan',
    loan_type: 'income',
    provider_type: 'finance',
    short_description: 'Instant paperless personal loan from Bajaj Finserv with pre-approved income offers.',
    description: 'Bajaj Finance Personal Loan offers funds up to ₹40 Lakhs with quick approval, flexi loan facility, and convenient EMIs for salaried and professional borrowers.',
    annual_fee: '11.00% p.a.',
    interest_rate: '11.00% p.a.',
    processing_fee: 'Up to 3.0% + GST',
    time_period: '12 - 96 Months',
    disbursal_time: 'Instant (10 Seconds)',
    min_amount: '50000',
    max_amount: '4000000',
    min_income: 25000,
    min_age: 21,
    max_age: 67,
    cibil_required: 685,
    badge: 'Flexi Loan',
    display_order: 20,
    partner_url: 'https://www.bajajfinserv.in/personal-loan',
    public_url: 'https://www.bajajfinserv.in/personal-loan',
    features: [
      'Flexi Hybrid loan option to reduce monthly EMIs up to 45%',
      'Extended tenure options up to 96 months',
      'Speedy disbursal within 24 hours of approval',
      'Minimal paperwork for salaried professionals'
    ],
    eligibility_criteria: 'Indian citizen aged 21-67 with regular monthly salary ₹25,000+.',
    documents_required: 'PAN Card, Aadhaar Card, Salary Slips (2 Months), Bank Statement (3 Months)'
  },
  {
    bank_code: 'KREDITBEE',
    bank_name: 'KreditBee',
    name: 'KreditBee Income Loan',
    category: 'personal_loan',
    sub_category: 'Personal Loan',
    loan_type: 'income',
    provider_type: 'finance',
    short_description: 'Fast digital personal loans up to ₹5 Lakhs for salaried employees from KreditBee.',
    description: 'KreditBee provides instant personal loans directly to your bank account with fast income proof verification and flexible repayment options.',
    annual_fee: '13.00% p.a.',
    interest_rate: '13.00% p.a.',
    processing_fee: 'Up to 2.5% + GST',
    time_period: '3 - 24 Months',
    disbursal_time: 'Within 15 Minutes',
    min_amount: '10000',
    max_amount: '500000',
    min_income: 15000,
    min_age: 21,
    max_age: 50,
    cibil_required: 650,
    badge: '15-Min Loan',
    display_order: 21,
    partner_url: 'https://www.wishfin.com/kreditbee/home?source=fin41',
    public_url: 'https://www.wishfin.com/kreditbee/home?source=fin41',
    features: [
      'Funds disbursed directly to account within 15 minutes',
      'Low minimum income threshold starting from ₹15,000/month',
      '100% digital paperless onboarding via app / web',
      'Repayment options from 3 to 24 months'
    ],
    eligibility_criteria: 'Salaried individual aged 21-50 with monthly income ₹15,000+.',
    documents_required: 'PAN Card, Aadhaar Card, Salary Slip / Net-Banking Statement'
  },
  {
    bank_code: 'TATACAPITAL',
    bank_name: 'Tata Capital',
    name: 'Tata Capital Income Loan',
    category: 'personal_loan',
    sub_category: 'Personal Loan',
    loan_type: 'income',
    provider_type: 'finance',
    short_description: 'Trusted personal loans from Tata Capital with multi-purpose funding up to ₹35 Lakhs.',
    description: 'Tata Capital Personal Loan offers transparent terms, flexible EMIs, and rapid approval based on income documentation with the trust of Tata.',
    annual_fee: '10.99% p.a.',
    interest_rate: '10.99% p.a.',
    processing_fee: 'Up to 2.5% + GST',
    time_period: '12 - 72 Months',
    disbursal_time: 'Within 24 Hours',
    min_amount: '40000',
    max_amount: '3500000',
    min_income: 20000,
    min_age: 21,
    max_age: 58,
    cibil_required: 700,
    badge: 'Tata Trust',
    display_order: 22,
    partner_url: 'https://www.wishfin.com/tata/home?source=FWRey_July&utm_source=FW38&utm_medium=SMS&utm_campaign=promotion&utm_content=check_offer&utm_term=tata',
    public_url: 'https://www.wishfin.com/tata/home?source=FWRey_July&utm_source=FW38&utm_medium=SMS&utm_campaign=promotion&utm_content=check_offer&utm_term=tata',
    features: [
      'Trusted financial partner with zero hidden costs',
      'High loan value up to ₹35 Lakhs based on salary',
      'Repayment tenure up to 6 years (72 months)',
      'Prepayment and part-prepayment flexibility'
    ],
    eligibility_criteria: 'Salaried individual earning minimum ₹20,000/month with valid KYC.',
    documents_required: 'PAN Card, Aadhaar Card, Salary Slips (3 Months), Bank Statement'
  },
  {
    bank_code: 'UNITY',
    bank_name: 'Unity',
    name: 'Unity Income Loan',
    category: 'personal_loan',
    sub_category: 'Personal Loan',
    loan_type: 'income',
    provider_type: 'finance',
    short_description: 'Fast digital personal loan from Unity Bank with easy salary verification.',
    description: 'Unity Small Finance Bank provides accessible personal loans with quick document checks, competitive interest rates, and simple repayment schedules.',
    annual_fee: '12.00% p.a.',
    interest_rate: '12.00% p.a.',
    processing_fee: 'Up to 2.0% + GST',
    time_period: '6 - 36 Months',
    disbursal_time: 'Within 24 Hours',
    min_amount: '25000',
    max_amount: '1500000',
    min_income: 18000,
    min_age: 21,
    max_age: 60,
    cibil_required: 680,
    badge: 'Easy Approval',
    display_order: 23,
    partner_url: 'https://loans.theunitybank.com/unity-pl-ui/page/exclusion/login/logindetails?utm_source=Partner&utm_medium=Wishfin&utm_campaign=finwizz11',
    public_url: 'https://loans.theunitybank.com/unity-pl-ui/page/exclusion/login/logindetails?utm_source=Partner&utm_medium=Wishfin&utm_campaign=finwizz11',
    features: [
      'Simple paperless digital personal loan journey',
      'Fast turnaround time with income proof verification',
      'Transparent terms and affordable monthly EMIs',
      'Flexible repayment options up to 36 months'
    ],
    eligibility_criteria: 'Indian citizen with monthly income ₹18,000+ and age 21-60.',
    documents_required: 'PAN Card, Aadhaar Card, Salary Slips, Bank Statement'
  },
  {
    bank_code: 'RAMFINCORP',
    bank_name: 'Ram Fincorp',
    name: 'Ram Fincorp Income Loan',
    category: 'personal_loan',
    sub_category: 'Personal Loan',
    loan_type: 'income',
    provider_type: 'finance',
    short_description: 'Convenient and flexible income based personal loans from Ram Fincorp.',
    description: 'Ram Fincorp offers quick personal loans designed for urgent financial needs with minimal verification delays and flexible repayment tenures.',
    annual_fee: '12.50% p.a.',
    interest_rate: '12.50% p.a.',
    processing_fee: 'Up to 2.0% + GST',
    time_period: '6 - 36 Months',
    disbursal_time: 'Within 24 Hours',
    min_amount: '20000',
    max_amount: '2000000',
    min_income: 18000,
    min_age: 21,
    max_age: 60,
    cibil_required: 670,
    badge: 'Fast Cash',
    display_order: 24,
    partner_url: 'https://applyonline.ramfincorp.com/?utm_source=Wishfin49&utm_campaign=default_campaign&utm_medium=default_medium&utm_trackingid=FW_30',
    public_url: 'https://applyonline.ramfincorp.com/?utm_source=Wishfin49&utm_campaign=default_campaign&utm_medium=default_medium&utm_trackingid=FW_30',
    features: [
      'Quick personal loan disbursal with minimal paperwork',
      'Tailored loan amounts based on income slips',
      'Hassle-free digital application and verification',
      'Flexible tenure and competitive rates'
    ],
    eligibility_criteria: 'Indian resident with monthly income ₹18,000+ and valid KYC.',
    documents_required: 'PAN Card, Aadhaar Card, Bank Statement, Salary Proof'
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

  // 3. Insert or Update all Personal Loan products
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
      // 1. Check if product already exists by (bank_id, name), name, or slug
      const { rows: existingProds } = await query(
        `SELECT id, slug FROM products WHERE (bank_id = $1 AND LOWER(name) = LOWER($2)) OR LOWER(name) = LOWER($2) OR slug = $3 LIMIT 1`,
        [bankId, p.name, productSlug]
      );

      let targetId = existingProds[0]?.id || null;
      let finalSlug = productSlug;

      // Check if target slug is already claimed by any other product
      const { rows: slugConflicts } = await query(
        `SELECT id FROM products WHERE slug = $1 ${targetId ? 'AND id != $2' : ''} LIMIT 1`,
        targetId ? [productSlug, targetId] : [productSlug]
      );
      if (slugConflicts.length > 0) {
        finalSlug = `${productSlug}-${p.bank_code.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      }
      seoMetadata.slug = finalSlug;

      if (targetId) {
        await query(`
          UPDATE products SET
            bank_id = $1,
            name = $2,
            category = $3,
            sub_category = $4,
            description = $5,
            features = $6,
            eligibility = $7,
            display_order = $8,
            annual_fee = $9,
            time_period = $10,
            short_description = $11,
            public_visible = true,
            partner_visible = true,
            status = 'Active',
            is_active = true,
            badge = $12,
            joining_fee = $13,
            processing_fee = $14,
            interest_rate = $15,
            compare_specs = $16,
            fees_structure = $17,
            features_list = $18,
            required_documents = $19,
            visibility = $20,
            seo_metadata = $21,
            slug = $22,
            partner_url = $23,
            public_url = $24
          WHERE id = $25
        `, [
          bankId, p.name, p.category, p.sub_category, p.description,
          JSON.stringify(p.features), JSON.stringify(eligibilityPayload),
          p.display_order, p.annual_fee, p.time_period, p.short_description,
          p.badge, 'Nil', p.processing_fee, p.interest_rate,
          JSON.stringify(compareSpecs), JSON.stringify(feesStructure),
          JSON.stringify(p.features), JSON.stringify(p.documents_required.split(', ')),
          JSON.stringify(visibility), JSON.stringify(seoMetadata),
          finalSlug, p.partner_url || null, p.public_url || null, targetId
        ]);
        insertedCount++;
        logger.info(`[CIBIL PL Seeder] Updated product: ${p.name}`);
      } else {
        await query(`
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
            visibility, seo_metadata, partner_url, public_url
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
            $41, $42, $43, $44
          )
        `, [
          bankId, p.name, p.category, p.sub_category, p.description,
          JSON.stringify(p.features), JSON.stringify(eligibilityPayload),
          'fixed', 1500, p.min_age, p.max_age, p.min_income,
          p.display_order, p.annual_fee, p.time_period, null,
          p.short_description, true, p.display_order <= 3, true,
          true, p.eligibility_criteria, p.documents_required, JSON.stringify(p.features),
          'Apply Now', `${p.name} - Apply Online | GharKaPaisa`, p.short_description, `${p.name}, personal loan, cibil loan`,
          'Active', true, finalSlug, p.badge,
          'Nil', p.processing_fee, p.interest_rate,
          JSON.stringify(compareSpecs), JSON.stringify(feesStructure),
          JSON.stringify(p.features), JSON.stringify(p.features),
          JSON.stringify(p.documents_required.split(', ')),
          JSON.stringify(visibility), JSON.stringify(seoMetadata),
          p.partner_url || null, p.public_url || null
        ]);
        insertedCount++;
        logger.info(`[CIBIL PL Seeder] Inserted product: ${p.name}`);
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

/**
 * personalLoanHelpers.js
 * Helpers for GharKaPaisa Personal Loan flow:
 * - Provider classification: Bank vs Finance (NBFC)
 * - Eligibility classification: CIBIL-Based vs Income-Based
 * - Canonical provider lists and matching utilities
 */

export const FINANCE_COMPANIES = [
  { id: 'finable', label: 'Finable', match: ['finable'] },
  { id: 'poonawalla', label: 'Poonawalla Finance', match: ['poonawalla'] },
  { id: 'bajaj', label: 'Bajaj Finance', match: ['bajaj'] },
  { id: 'kreditbee', label: 'KreditBee', match: ['kreditbee', 'kredit bee'] },
  { id: 'tata-capital', label: 'Tata Capital', match: ['tata capital', 'tata on fly'] },
  { id: 'unity', label: 'Unity', match: ['unity'] },
  { id: 'ram-fincorp', label: 'Ram Fincorp', match: ['ramfin', 'ram fincorp', 'ramfincorp'] },
];

export const FINANCE_COMPANY_OPTIONS = [
  'All Finance Companies',
  'Finable',
  'Poonawalla Finance',
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

// Canonical ID for IDFC Personal Loan (the single real CIBIL-Based bank product in database)
export const IDFC_PERSONAL_LOAN_ID = '621d282c-832e-4cce-8344-b4a80ddf6fc4';

// Stable CIBIL Bank Personal Loan product IDs (verified from database)
// HDFC PL (10sec) and IndusInd Bank VPL do not exist as records in the database currently.
export const CIBIL_BANK_PRODUCT_IDS = [
  IDFC_PERSONAL_LOAN_ID,
];

// Verified Slugs for CIBIL Bank Personal Loan products
export const CIBIL_BANK_SLUGS = [
  'hdfc-pl-10sec',
  'hdfc-pl-10sec-bank',
  'hdfc-10sec-personal-loan',
  'idfc-personal-loan',
  'indusind-bank-vpl',
  'indusind-vpl'
];

// IndusInd Bank UUID from database banks table
export const INDUSIND_BANK_ID = '7eda6d99-10e2-4bf8-bbe5-9de0b1b0fc9c';

// Bank dropdown and quick-filter chip options for CIBIL-Based Personal Loans
export const CIBIL_BANK_OPTIONS = [
  'All Banks',
  'IDFC First Bank',
  'HDFC Bank',
  'IndusInd Bank'
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

/**
 * Check if a product belongs to a Finance / NBFC company.
 */
export const isFinanceProduct = (p) => {
  if (!p) return false;
  const bName = String(p.bank_name || '').toLowerCase();
  const bCode = String(p.bank_code || '').toLowerCase();
  const pName = String(p.name || '').toLowerCase();

  // Match against the 7 canonical finance companies
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
 *  1. HDFC PL (10sec) — product-level match on '10sec' (NOT regular HDFC Personal Loan)
 *  2. IndusInd Bank VPL — product-level match on 'vpl'
 *  3. IDFC Personal Loan — canonical product ID 621d282c-832e-4cce-8344-b4a80ddf6fc4
 */
export const isCibilBankProduct = (p) => {
  if (!p) return false;

  // 1. Stable UUID matching (verified against database)
  if (p.id && CIBIL_BANK_PRODUCT_IDS.includes(p.id)) return true;

  // 2. Stable Slug matching
  const slug = String(p.slug || '').toLowerCase().trim();
  if (slug && CIBIL_BANK_SLUGS.includes(slug)) return true;

  const pName = String(p.name || '').toLowerCase().trim();

  // 3. HDFC PL (10sec) — product must specifically be the 10-second instant loan
  // Note: Regular 'HDFC Personal Loan' is an Income-Based product requiring salary slips/ITR
  if (
    pName.includes('10sec') ||
    pName.includes('10 sec') ||
    pName.includes('10-sec')
  ) {
    return true;
  }

  // 4. IndusInd Bank VPL — product must specifically be the Verified Personal Loan (VPL)
  if (
    pName.includes('vpl') ||
    slug.includes('vpl')
  ) {
    return true;
  }

  // 5. IDFC Personal Loan — verified by ID, slug, or exact name
  if (
    p.id === IDFC_PERSONAL_LOAN_ID ||
    slug === 'idfc-personal-loan' ||
    (pName === 'idfc personal loan' && p.category === 'personal_loan')
  ) {
    return true;
  }

  return false;
};

/**
 * Determine if a personal loan product is CIBIL-Based or Income-Based.
 * - Bank Personal Loans:
 *   - CIBIL-Based: IndusInd Bank VPL, IDFC Bank, HDFC pl 10sec bank
 *   - Income-Based: All other bank Personal Loan products
 * - Finance / NBFC Personal Loans: Evaluated via metadata/sub_category/eligibility criteria
 */
export const getLoanEligibilityType = (p) => {
  if (!p) return 'cibil';

  // Bank Personal Loans: strict eligibility partitioning
  if (isBankProduct(p)) {
    return isCibilBankProduct(p) ? 'cibil' : 'income';
  }

  // 1. Explicit sub_category in database
  const subCat = String(p.sub_category || '').toLowerCase().trim();
  if (subCat.includes('cibil')) return 'cibil';
  if (subCat.includes('income') || subCat.includes('salary')) return 'income';

  // 2. Explicit eligibility JSONB object in database
  const elig = (typeof p.eligibility === 'object' && p.eligibility !== null) ? p.eligibility : {};
  const basis = String(elig.loan_type || elig.type || elig.basis || elig.eligibility_type || '').toLowerCase();
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

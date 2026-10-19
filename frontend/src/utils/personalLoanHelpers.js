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
 * Determine if a personal loan product is CIBIL-Based or Income-Based.
 * Evaluates:
 *  1. p.sub_category (explicit column in database)
 *  2. p.eligibility (JSONB metadata)
 *  3. p.eligibility_criteria text
 *  4. Features / description keywords
 *  5. Bank-specific standard product mapping
 */
export const getLoanEligibilityType = (p) => {
  if (!p) return 'cibil';

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

  // 5. Standard mapping for existing seeded bank personal loans:
  // - SBI Xpress Credit (salary package based) & Axis Personal Loan (document/doorstep based) -> Income-Based
  // - HDFC, ICICI, IDFC, Kotak (instant disbursal / pre-approved / minimal docs) -> CIBIL-Based
  const bCode = String(p.bank_code || '').toUpperCase();
  const pName = String(p.name || '').toLowerCase();
  if (bCode === 'SBI' || pName.includes('xpress credit') || bCode === 'AXIS') {
    return 'income';
  }
  if (bCode === 'HDFC' || bCode === 'ICICI' || bCode === 'IDFC' || bCode === 'KOTAK') {
    return 'cibil';
  }

  return 'cibil';
};

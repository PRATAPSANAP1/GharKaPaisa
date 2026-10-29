import { getFinanceDirectUrl } from '../../../../utils/personalLoanHelpers.js';

/**
 * Validates that a URL string uses an approved http: or https: scheme.
 */
export const isSafeHttpUrl = (rawUrl) => {
  if (typeof rawUrl !== 'string') return false;
  const trimmed = rawUrl.trim();
  if (!trimmed || /\s/.test(trimmed)) return false;
  try {
    const parsed = new URL(trimmed);
    const protocol = String(parsed.protocol || '').toLowerCase();
    return (protocol === 'http:' || protocol === 'https:') && Boolean(parsed.hostname);
  } catch (_) {
    return false;
  }
};

/**
 * Utility to resolve direct application links for bank & finance products.
 * Database products table is the single source of truth for partner_url / application_url,
 * with canonical UTM tracking link fallback for Personal Loan Finance products.
 */
export const getBankApplyLink = (cardName, bankId, productObj = null) => {
  const product = productObj || (typeof cardName === 'object' ? cardName : null) || (typeof bankId === 'object' ? bankId : null);
  
  if (!product && typeof cardName !== 'string') return null;

  const rawUrl = (
    product?.employee_referral_url ||
    product?.employeeReferralUrl ||
    product?.partner_url ||
    product?.partnerUrl ||
    product?.application_url ||
    product?.applicationUrl ||
    product?.apply_url ||
    product?.applyUrl ||
    product?.redirect_url ||
    product?.redirectUrl ||
    product?.public_url ||
    product?.publicUrl ||
    product?.bank_link ||
    product?.direct_process_url ||
    product?.directProcessUrl ||
    product?.bank_direct_process_url ||
    product?.bankDirectProcessUrl ||
    null
  );

  if (rawUrl && String(rawUrl).trim()) {
    const cleanUrl = String(rawUrl).trim();
    const nameLower = String(product?.name || product?.cardName || cardName || '').toLowerCase();
    const bankLower = String(product?.bank_name || product?.bank_code || bankId || '').toLowerCase();

    // Guard against cross-bank link contamination (e.g. non-SBI bank with SBI domain)
    const isSbiUrl = cleanUrl.toLowerCase().includes('sbicard.com') || cleanUrl.toLowerCase().includes('sbi.co.in');
    const isNonSbiBank = (bankLower && !bankLower.includes('sbi')) || (nameLower && !nameLower.includes('sbi') && !nameLower.includes('state bank'));
    
    if (isSbiUrl && isNonSbiBank) {
      console.warn(`[URL_RESOLVER_GUARD] Rejected cross-bank SBI URL on non-SBI product '${product?.name || cardName}'`);
      return null;
    }

    return cleanUrl;
  }

  const nameLower = String(product?.name || product?.cardName || cardName || '').toLowerCase();
  const bankLower = String(product?.bank_name || product?.bank_code || bankId || '').toLowerCase();

  // Fallback: Resolve canonical Adobe process URL for Tata Floater Adobe cards
  if (nameLower.includes('floater') || (nameLower.includes('adobe') && (bankLower.includes('tata') || bankLower.includes('hdfc')))) {
    return 'https://applyonline.hdfc.bank.in/cards/credit-cards.html?CHANNELSOURCE=TDCC&DEDUPE=N&DSACode=XYOH&LGcode=PTN01&LCcode=PTN01&LC2=A089&SMcode=A31964#nbb';
  }

  // Fallback: Resolve canonical direct UTM link for personal loan finance partners
  const financeUtmUrl = getFinanceDirectUrl(product || cardName);
  if (financeUtmUrl) {
    return financeUtmUrl;
  }

  return null;
};

const TATA_BANK_ID = '1eacfa67-1187-48c7-adde-8a6edcfe9969';
const TATA_NEU_DIRECT_FALLBACK_LINK = 'https://applyonline.hdfc.bank.in/cards/credit-cards.html?CHANNELSOURCE=TDCC&DEDUPE=N&DSACode=XYOH&LGcode=YOH5&LCcode=YOH5&LC2=A222&SMcode=S54558';

/**
 * Checks whether a product is a Tata Neu Plus or Tata Neu Infinity card
 * under TATA CO-BRAND HDFC BANK (excluding Business and Floater variants).
 */
export const isTataNeuPlusOrInfinity = (product) => {
  if (!product) return false;
  const nameUpper = String(
    product?.name || product?.cardName || (typeof product === 'string' ? product : '')
  ).toUpperCase();
  const matchesName =
    (nameUpper.includes('TATA NEU INFINITY') || nameUpper.includes('TATA NEU PLUS')) &&
    !nameUpper.includes('BUSINESS') &&
    !nameUpper.includes('FLOATER');
  if (!matchesName) return false;

  const bankId = String(product?.bank_id || '').trim();
  if (bankId) {
    if (bankId === TATA_BANK_ID) return true;
    const bankUpper = String(product?.bank_name || product?.bank_code || bankId).toUpperCase();
    return bankUpper.includes('TATA') || bankUpper.includes('HDFC');
  }
  return true;
};

/**
 * Resolves the Direct Process link for a product when the user chooses Direct Process (direct_bank).
 * Precedence:
 * 1. Configured bank-specific Direct Process link (bank_direct_process_link) for the product's bank.
 * 2. Existing product-level or Direct Process fallback (getBankApplyLink).
 * 3. Last-resort default for Tata Neu Plus / Tata Neu Infinity.
 * 4. null if no valid link exists anywhere.
 */
export const getDirectProcessLink = (productObj, cardName = '', bankId = '') => {
  const product = productObj || (typeof cardName === 'object' ? cardName : null);
  if (!product && !cardName) return null;

  const bankConfiguredLink =
    product?.bank_direct_process_link ||
    product?.bank?.direct_process_link ||
    product?.direct_process_link ||
    null;

  if (bankConfiguredLink && isSafeHttpUrl(bankConfiguredLink)) {
    return String(bankConfiguredLink).trim();
  }

  const fallbackLink = getBankApplyLink(
    cardName || product?.name || '',
    bankId || product?.bank_code || product?.bank_name || '',
    product
  );

  if (fallbackLink && isSafeHttpUrl(fallbackLink)) {
    return String(fallbackLink).trim();
  }

  const candidateProduct = product || { name: cardName, bank_id: bankId };
  if (isTataNeuPlusOrInfinity(candidateProduct)) {
    return TATA_NEU_DIRECT_FALLBACK_LINK;
  }

  return null;
};

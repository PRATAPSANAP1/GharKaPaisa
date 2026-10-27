import { getFinanceDirectUrl } from '../../../../utils/personalLoanHelpers';

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

/**
 * Utility to resolve direct application links for bank products.
 * Database products table is the single source of truth for partner_url / application_url.
 */
export const getBankApplyLink = (cardName, bankId, productObj = null) => {
  const product = productObj || (typeof cardName === 'object' ? cardName : null) || (typeof bankId === 'object' ? bankId : null);
  
  if (!product) return null;

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
    null
  );

  if (!rawUrl || !String(rawUrl).trim()) return null;
  
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
};

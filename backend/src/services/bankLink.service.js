/**
 * bankLink.service.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Authoritative link resolution service for Bank Direct Process links,
 * partner links, and canonical product apply links.
 * 
 * Centralizing link resolution here breaks the circular dependency between:
 *   - backend/src/modules/super-admin/bankDirectLinks.controller.js
 *   - backend/src/modules/crm/lead.controller.js
 */

const FINANCE_PRODUCT_LINKS_BACKEND = {
  tata: 'https://www.wishfin.com/tata/home?source=FWRey_July&utm_source=FW38&utm_medium=SMS&utm_campaign=promotion&utm_content=check_offer&utm_term=tata',
  prefr: 'https://www.wishfin.com/prefr/home?source=Rey_june26_FW18',
  finable: 'https://www.wishfin.com/prefr/home?source=Rey_june26_FW18',
  ramfincorp: 'https://applyonline.ramfincorp.com/?utm_source=Wishfin49&utm_campaign=default_campaign&utm_medium=default_medium&utm_trackingid=FW_30',
  kreditbee: 'https://www.wishfin.com/kreditbee/home?source=fin41',
  unity: 'https://loans.theunitybank.com/unity-pl-ui/page/exclusion/login/logindetails?utm_source=Partner&utm_medium=Wishfin&utm_campaign=finwizz11',
  poonawalla: 'https://instant-pocket-loan.poonawallafincorp.com/?redirectto=primepl&utm_DSA_Code=PUP00228&UTM_Partner_Name=WISHFIN&UTM_Partner_Medium=SMS&UTM_Partner_AgentCode=PFLWISHFIN&UTM_Partner_ReferenceID=WF_FW_REY_PR_26',
  punawalla: 'https://instant-pocket-loan.poonawallafincorp.com/?redirectto=primepl&utm_DSA_Code=PUP00228&UTM_Partner_Name=WISHFIN&UTM_Partner_Medium=SMS&UTM_Partner_AgentCode=PFLWISHFIN&UTM_Partner_ReferenceID=WF_FW_REY_PR_26',
  bajaj: 'https://www.bajajfinserv.in/personal-loan'
};

/**
 * Validates that a Direct Process link is a non-empty, well-formed HTTP/HTTPS URL.
 * Rejects javascript:, data:, file:, and other unsafe schemes.
 */
const validateDirectProcessUrl = (rawUrl) => {
  if (typeof rawUrl !== 'string') {
    return { valid: false, message: 'Direct Process Link is required and must be a string.' };
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return { valid: false, message: 'Direct Process Link cannot be empty.' };
  }

  if (/\s/.test(trimmed) || /[\u0000-\u001F\u007F]/.test(trimmed)) {
    return { valid: false, message: 'Direct Process Link contains invalid whitespace or control characters.' };
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch (_) {
    return { valid: false, message: 'Please enter a valid URL (e.g. https://bank.example.com/apply).' };
  }

  const protocol = String(parsed.protocol || '').toLowerCase();
  if (protocol !== 'http:' && protocol !== 'https:') {
    return {
      valid: false,
      message: 'Unsupported URL scheme. Only http:// and https:// URLs are allowed.'
    };
  }

  const hostname = String(parsed.hostname || '').trim().toLowerCase();
  if (!hostname || (!hostname.includes('.') && hostname !== 'localhost')) {
    return { valid: false, message: 'Direct Process Link must include a valid domain name.' };
  }

  return { valid: true, url: parsed.toString() };
};

/**
 * Resolves a fallback or direct bank application link for products.
 */
function getBankApplyLinkBackend(productName, bankName, productObj = null) {
  const product = productObj || (typeof productName === 'object' ? productName : null);
  const nameStr = String(productName || productObj?.name || product?.name || '').toLowerCase();
  const bankStr = String(bankName || productObj?.bank_name || product?.bank_name || '').toLowerCase();

  const url = (
    productObj?.partner_url ||
    productObj?.application_url ||
    productObj?.apply_url ||
    productObj?.redirect_url ||
    productObj?.public_url ||
    productObj?.direct_process_url ||
    productObj?.bank_direct_process_url ||
    productObj?.directProcessUrl ||
    productObj?.bankDirectProcessUrl ||
    product?.partner_url ||
    product?.application_url ||
    product?.apply_url ||
    product?.redirect_url ||
    product?.public_url ||
    product?.direct_process_url ||
    product?.bank_direct_process_url ||
    product?.directProcessUrl ||
    product?.bankDirectProcessUrl ||
    ""
  );

  let cleanUrl = String(url || '').trim();

  // If URL is missing, check canonical UTM links for Finance NBFC partners or Tata Adobe floater
  if (!cleanUrl) {
    const nameUpper = nameStr.toUpperCase();
    const prodBankId = String(productObj?.bank_id || product?.bank_id || '').trim();
    const isTargetTataNeu =
      (nameUpper.includes('TATA NEU INFINITY') || nameUpper.includes('TATA NEU PLUS')) &&
      !nameUpper.includes('BUSINESS') &&
      !nameUpper.includes('FLOATER') &&
      (!prodBankId || prodBankId === '1eacfa67-1187-48c7-adde-8a6edcfe9969' || bankStr.includes('tata') || bankStr.includes('hdfc'));

    if (isTargetTataNeu) {
      cleanUrl = 'https://applyonline.hdfc.bank.in/cards/credit-cards.html?CHANNELSOURCE=TDCC&DEDUPE=N&DSACode=XYOH&LGcode=YOH5&LCcode=YOH5&LC2=A222&SMcode=S54558';
    } else if (nameStr.includes('floater') || (nameStr.includes('adobe') && (bankStr.includes('tata') || bankStr.includes('hdfc')))) {
      cleanUrl = 'https://applyonline.hdfc.bank.in/cards/credit-cards.html?CHANNELSOURCE=TDCC&DEDUPE=N&DSACode=XYOH&LGcode=PTN01&LCcode=PTN01&LC2=A089&SMcode=A31964#nbb';
    } else if (nameStr.includes('tata') || bankStr.includes('tata')) {
      cleanUrl = FINANCE_PRODUCT_LINKS_BACKEND.tata;
    } else if (nameStr.includes('finable') || nameStr.includes('prefr') || bankStr.includes('finable')) {
      cleanUrl = FINANCE_PRODUCT_LINKS_BACKEND.finable;
    } else if (nameStr.includes('ram') || bankStr.includes('ram')) {
      cleanUrl = FINANCE_PRODUCT_LINKS_BACKEND.ramfincorp;
    } else if (nameStr.includes('kredit') || bankStr.includes('kredit')) {
      cleanUrl = FINANCE_PRODUCT_LINKS_BACKEND.kreditbee;
    } else if (nameStr.includes('unity') || bankStr.includes('unity')) {
      cleanUrl = FINANCE_PRODUCT_LINKS_BACKEND.unity;
    } else if (nameStr.includes('poonawalla') || nameStr.includes('punawalla') || bankStr.includes('poonawalla') || bankStr.includes('punawalla')) {
      cleanUrl = FINANCE_PRODUCT_LINKS_BACKEND.poonawalla;
    } else if (nameStr.includes('bajaj') || bankStr.includes('bajaj')) {
      cleanUrl = FINANCE_PRODUCT_LINKS_BACKEND.bajaj;
    }
  }

  if (!cleanUrl) return "";

  const isSbiUrl = cleanUrl.toLowerCase().includes('sbicard.com') || cleanUrl.toLowerCase().includes('sbi.co.in');
  const isSbiBankOrProduct = bankStr.includes('sbi') || bankStr.includes('state bank') || nameStr.includes('sbi') || nameStr.includes('state bank');
  
  if (isSbiUrl && !isSbiBankOrProduct) {
    return "";
  }

  return cleanUrl;
}

/**
 * Resolves the effective Direct Process link for a product record.
 * Precedence:
 * 1. Bank-specific Direct Process link configured for the product's bank (bank_direct_process_links)
 * 2. Product-level or Direct Process fallback (partner_url / public_url / getBankApplyLinkBackend)
 * 3. null if no valid link exists anywhere
 */
const resolveDirectProcessLinkForProductRow = (product, fallbackFn = getBankApplyLinkBackend) => {
  if (!product) return { url: null, source: 'none' };

  const bankDirectUrl = typeof product.bank_direct_process_link === 'string'
    ? product.bank_direct_process_link.trim()
    : '';
  if (bankDirectUrl) {
    const check = validateDirectProcessUrl(bankDirectUrl);
    if (check.valid) {
      return { url: check.url, source: 'bank_direct_process_link' };
    }
  }

  const productLevelCandidates = [
    product.employee_referral_url,
    product.partner_url,
    product.application_url,
    product.apply_url,
    product.redirect_url,
    product.public_url,
    product.bank_link
  ];

  for (const candidate of productLevelCandidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      const check = validateDirectProcessUrl(candidate.trim());
      if (check.valid) {
        return { url: check.url, source: 'product_fallback' };
      }
    }
  }

  const effectiveFallbackFn = typeof fallbackFn === 'function' ? fallbackFn : getBankApplyLinkBackend;
  if (typeof effectiveFallbackFn === 'function') {
    const fallbackUrl = effectiveFallbackFn(product.name, product.bank_name || product.bank_code, product);
    if (typeof fallbackUrl === 'string' && fallbackUrl.trim()) {
      const check = validateDirectProcessUrl(fallbackUrl.trim());
      if (check.valid) {
        return { url: check.url, source: 'bank_default_fallback' };
      }
    }
  }

  return { url: null, source: 'none' };
};

module.exports = {
  FINANCE_PRODUCT_LINKS_BACKEND,
  validateDirectProcessUrl,
  getBankApplyLinkBackend,
  resolveDirectProcessLinkForProductRow
};


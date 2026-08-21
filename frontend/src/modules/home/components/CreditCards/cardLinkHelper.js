/**
 * Utility to resolve direct application links for various bank cards.
 */
export const getBankApplyLink = (cardName, bankId, productObj = null) => {
  const nameLower = (typeof cardName === 'string' ? cardName : (cardName?.name || cardName?.cardName || '')).toLowerCase();
  const bankLower = (typeof bankId === 'string' ? bankId : (bankId?.bank_name || bankId?.bank_code || bankId?.bankId || '')).toLowerCase();

  // Axis Bank Cards (connect all to the Axis referral link)
  if (bankLower === 'axis' || nameLower.includes('axis')) {
    return "https://web.axis.bank.in/DigitalChannel/WebForm/?ipa68&axisreferralcode=WMMNYOH1_9640841";
  }

  // IndusInd Bank Cards (connect all to IndusInd link)
  if (bankLower === 'indusind' || bankLower === 'indus' || nameLower.includes('indusind') || nameLower.includes('indus')) {
    return "https://induseasycredit.indusind.bank.in/customer/credit-card/new-lead?utm_source=assisted&utm_medium=IBLV9763WESTIBL131260%20&utm_campaign=Credit-Card&utm_content=1";
  }

  // SBI Bank Cards (connect all to SBI link)
  if (bankLower === 'sbi' || nameLower.includes('sbi') || nameLower.includes('state bank')) {
    return "https://www.sbicard.com/corecards/?CHN=OMLG&GEMID1=ABC1&GEMID2=YOH01";
  }

  // IDFC Bank Cards (connect all to IDFC link)
  if (bankLower === 'idfc' || nameLower.includes('idfc')) {
    return "https://my.idfcfirst.bank.in/apply/cc?utm_source=partner&utm_medium=MywishMarketplaces&utm_campaign=WFYOU01";
  }

  // BOB Bank Cards (connect all to the BOB link)
  if (bankLower === 'bob' || nameLower.includes('bob') || nameLower.includes('baroda')) {
    return "https://mycard.bobcard.tech/?utm_source=urbanmoney&utm_medium=urbanmoney_aq&utm_campaign=APAY1001";
  }

  // Federal Bank / Scapia Cards (make Scapia Federal Card correct)
  if (bankLower === 'federal' || nameLower.includes('federal') || nameLower.includes('scapia') || nameLower.includes('scapiya')) {
    return "https://apply.scapia.cards/landing_page?utm_source=RKPL_offline&utm_medium=DSA&utm_campaign=VK_MOHYHS1_content=travel&utm_term=card";
  }

  // DCB Bank Cards (and handle user's bcb typo)
  if (bankLower === 'dcb' || bankLower === 'bcb' || nameLower.includes('dcb') || nameLower.includes('bcb')) {
    return "https://get.novio.in/j84P/va2pvtwb";
  }

  // SBM Bank Cards
  if (bankLower === 'sbm' || nameLower.includes('sbm')) {
    return "https://get.novio.in/j84P/7tnakuu8";
  }

  const defaultHdfcLink = "https://applyonline.hdfc.bank.in/cards/credit-cards.html?utm_content=DGPI&Channel=DSA&DSACode=XYOH&SMCode=S54558&LGcode=&LCcode=DIGIX1&LC2=DIGIX1#nbb";

  // HDFC Card specific links mapping
  const hdfcLinks = {
    // Standard / Core Cards
    "freedom": "https://applyonline.hdfc.bank.in/cards/credit-cards.html?CHANNELSOURCE=RUPY&DSACode=XYOH&LGcode=&LCcode=DIGIX1&LC2=DIGIX1&SMcode=S54558#nbb",
    "indianoil": "https://applyonline.hdfc.bank.in/cards/credit-cards.html?CHANNELSOURCE=RUPY&DSACode=XYOH&LGcode=&LCcode=DIGIX1&LC2=DIGIX1&SMcode=S54558#nbb",
    "swiggy": "https://applyonline.hdfc.bank.in/cards/credit-cards.html?CHANNELSOURCE=SWCC&DSACode=XYOH&LGcode=&LCcode=DIGIX1&LC2=DIGIX1&SMcode=S54558#nbb",
    "tataneuplus": "https://applyonline.hdfc.bank.in/cards/credit-cards.html?CHANNELSOURCE=TDCC&DEDUPE=N&DSACode=XYOH&LGcode=&LCcode=DIGIX1&LC2=DIGIX1&SMcode=S54558#nbb",
    "pixelplay": "https://applyonline.hdfc.bank.in/cards/credit-cards.html?CHANNELSOURCE=ZETA&DSACode=XYOH&LGcode=&LCcode=DIGIX1&LC2=DIGIX1&SMcode=S54558#nbb",
    "bizgrow": "https://applyonline.hdfc.bank.in/cards/credit-cards.html?CHANNELSOURCE=BIZC&XSELLINS=Y&CHANNEL=DSA&DSACode=XYOH&LGcode=&LCcode=DIGIX1&LC2=DIGIX1&SMcode=S54558#nbb",
    "bizfirst": "https://applyonline.hdfc.bank.in/cards/credit-cards.html?CHANNELSOURCE=BIZC&XSELLINS=Y&CHANNEL=DSA&DSACode=XYOH&LGcode=&LCcode=DIGIX1&LC2=DIGIX1&SMcode=S54558#nbb",
    "bizpower": "https://applyonline.hdfc.bank.in/cards/credit-cards.html?CHANNELSOURCE=BIZC&XSELLINS=Y&CHANNEL=DSA&DSACode=XYOH&LGcode=&LCcode=DIGIX1&LC2=DIGIX1&SMcode=S54558#nbb",
    "moneyback": "https://applyonline.hdfc.bank.in/cards/credit-cards.html?utm_content=DGPI&Channel=DSA&DSACode=XYOH&SMCode=S54558&LGcode=&LCcode=DIGIX1&LC2=DIGIX1#nbb",
    "giga": "https://applyonline.hdfc.bank.in/cards/credit-cards.html?CHANNELSOURCE=GIGA#nbb&XSELLINS=Y&CHANNEL=DSA&DSACode=XYOH&LGcode=&LCcode=DIGIX11&LC2=DIGIX1&SMcode=S54558%23nbb",
    "irctc": "https://applyonline.hdfc.bank.in/cards/credit-cards.html?CHANNELSOURCE=IRCT&DSACode=XYOH&LGcode=&LCcode=DIGIX1&LC2=DIGIX1&SMcode=S54558#nbb",

    // Premium Cards
    "millennia": "https://applyonline.hdfc.bank.in/cards/credit-cards.html?utm_content=DGPI&Channel=DSA&DSACode=XYOH&SMCode=S54558&LGcode=&LCcode=DIGIX1&LC2=DIGIX1#nbb",
    "dinersprivilege": "https://applyonline.hdfc.bank.in/cards/credit-cards.html?CHANNELSOURCE=DINE&DSACode=XYOH&LGcode=&LCcode=DIGIX1&LC2=DIGIX1&SMcode=S54558#nbb",
    "tataneuinfinity": "https://applyonline.hdfc.bank.in/cards/credit-cards.html?CHANNELSOURCE=TDCC&DEDUPE=N&DSACode=XYOH&LGcode=&LCcode=DIGIX1&LC2=DIGIX1&SMcode=S54558#nbb",
    "pixelgo": "https://applyonline.hdfc.bank.in/cards/credit-cards.html?CHANNELSOURCE=ZETA&DSACode=XYOH&LGcode=&LCcode=DIGIX1&LC2=DIGIX1&SMcode=S54558#nbb",

    // Super Premium Cards
    "regaliagold": "https://applyonline.hdfc.bank.in/cards/credit-cards.html?utm_content=DGPI&Channel=DSA&DSACode=XYOH&SMCode=S54558&LGcode=&LCcode=DIGIX1&LC2=DIGIX1#nbb",
    "regalia": "https://applyonline.hdfc.bank.in/cards/credit-cards.html?utm_content=DGPI&Channel=DSA&DSACode=XYOH&SMCode=S54558&LGcode=&LCcode=DIGIX1&LC2=DIGIX1#nbb",
    "marriott": "https://applyonline.hdfc.bank.in/cards/credit-cards.html?CHANNELSOURCE=MRTB&DEDUPE=N&DSACode=XYOH&LGcode=&LCcode=DIGIX1&LC2=DIGIX1&SMcode=S54558#nbb",
    "marriot": "https://applyonline.hdfc.bank.in/cards/credit-cards.html?CHANNELSOURCE=MRTB&DEDUPE=N&DSACode=XYOH&LGcode=&LCcode=DIGIX1&LC2=DIGIX1&SMcode=S54558#nbb",
    "dinersblack": "https://applyonline.hdfc.bank.in/cards/credit-cards.html?CHANNELSOURCE=DINE&DSACode=XYOH&LGcode=&LCcode=DIGIX1&LC2=DIGIX1&SMcode=S54558#nbb",
    "dinnerblack": "https://applyonline.hdfc.bank.in/cards/credit-cards.html?CHANNELSOURCE=DINE&DSACode=XYOH&LGcode=&LCcode=DIGIX1&LC2=DIGIX1&SMcode=S54558#nbb",

    // Secured Cards
    "securedexistingfd": "https://applyonline.hdfc.bank.in/digital/etb-fixed-deposit-cc?Channel=DSA&LGCode=XYOH&SMCode=SS4558&LC1=GHAR01&LC2=GHAR01&DSACode=XYOH#nbb",
    "securednewfd": "https://pixel.hdfc.bank.in/pixel-onboard/landing/?flow=FDLien&sourcing.assist.channelCode=DSA&sourcing.assist.branchCode=XYOH&sourcing.assist.employeeCode=S54558&sourcing.assist.dsaCode=XYOH&sourcing.assist.lgCode=GHAR01&sourcing.assist.lc1Code=GHAR01&sourcing.assist.lc2Code=GHAR01&sourcing.assist.dsaCode=XYOH"
  };

  // Check matching HDFC card names
  const key = Object.keys(hdfcLinks).find(k => nameLower.replace(/[^a-z0-9]/g, '').includes(k));
  if (key) {
    return hdfcLinks[key];
  }

  // Fallback HDFC link
  if (bankLower === 'hdfc' || nameLower.includes('hdfc')) {
    return defaultHdfcLink;
  }

  // FALLBACK: Database URL if no hardcoded rule matched
  const extractUrl = (obj) => {
    if (!obj || typeof obj !== 'object') return null;
    const url = obj.partner_url || obj.partnerUrl || obj.application_url || obj.applicationUrl || obj.public_url || obj.publicUrl || obj.apply_url || obj.applyUrl || obj.redirect_url || obj.redirectUrl || obj.bank_link;
    return (url && String(url).trim()) ? String(url).trim() : null;
  };

  const explicitUrl = extractUrl(productObj) || extractUrl(cardName) || extractUrl(bankId);
  if (explicitUrl) return explicitUrl;

  return null;
};

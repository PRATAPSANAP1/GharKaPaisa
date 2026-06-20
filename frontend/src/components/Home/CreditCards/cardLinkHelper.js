/**
 * Utility to resolve direct application links for various bank cards.
 */
export const getBankApplyLink = (cardName, bankId) => {
  const nameLower = (cardName || '').toLowerCase();
  const bankLower = (bankId || '').toLowerCase();

  // Axis Bank Cards (connect all to the Axis referral link)
  if (bankLower === 'axis' || nameLower.includes('axis')) {
    return "https://web.axis.bank.in/DigitalChannel/WebForm/?ipa177&axisreferralcode=WMMNYOH1";
  }

  // BOB Bank Cards (connect all to the BOB link)
  if (bankLower === 'bob' || nameLower.includes('bob') || nameLower.includes('baroda')) {
    return "https://mycard.bobcard.tech/?utm_source=urbanmoney&utm_medium=urbanmoney_aq&utm_campaign=GHAR01";
  }

  // Federal Bank / Scapia Cards (make Scapia Federal Card correct)
  if (bankLower === 'federal' || nameLower.includes('federal') || nameLower.includes('scapia') || nameLower.includes('scapiya')) {
    return "https://apply.scapia.cards/landing_page?utm_source=RKPL_offline&utm_medium=DSA&utm_campaign=VK_MOHYHS1_content=travel&utm_term=card";
  }

  // HDFC Card specific links mapping
  const hdfcLinks = {
    "pixelplay": "https://applyonline.hdfcbank.com/cards/credit-cards.html?CHANNELSOURCE=ZETA&DSACode=XYOH&LGcode=GHAR01&LCcode=GHAR01&LC2=GHAR01&SMcode=554558#nbb",
    "pixelgo": "https://applyonline.hdfcbank.com/cards/credit-cards.html?CHANNELSOURCE=ZETA&DSACode=XYOH&LGcode=GHAR01&LCcode=GHAR01&LC2=GHAR01&SMcode=554558#nbb",
    "tataneuplus": "https://applyonline.hdfcbank.com/cards/credit-cards.html?CHANNELSOURCE=TDCC&DEDUPE=N&DSACode=XYOH&LGcode=GHAR01&LCcode=GHAR01&LC2=GHAR01&SMcode=554558",
    "tataneuinfinity": "https://applyonline.hdfcbank.com/cards/credit-cards.html?CHANNELSOURCE=TDCC&DEDUPE=N&DSACode=XYOH&LGcode=GHAR01&LCcode=GHAR01&LC2=GHAR01&SMcode=554558",
    "swiggy": "https://applyonline.hdfcbank.com/cards/credit-cards.html?CHANNELSOURCE=SWCC&DSACode=XYOH&LGcode=GHAR01&LCcode=GHAR01&LC2=GHAR01&SMcode=554558#nbb",
    "indianoil": "https://applyonline.hdfcbank.com/cards/credit-cards.html?TUNC=FLOAT&CHANNELSOURCE=INDIANOIL&DSACODE=XYOH&LGcode=GHAR01&LCcode=GHAR01&LC2=GHAR01&SMcode=554558#nbb",
    "irctc": "https://applyonline.hdfcbank.com/cards/credit-cards.html?CHANNELSOURCE=IRCTC&DSACode=XYOH&LGcode=GHAR01&LCcode=GHAR01&LC2=GHAR01&SMcode=554558#nbb",
    "dinersprivilege": "https://applyonline.hdfcbank.com/cards/credit-cards.html?CHANNELSOURCE=DINE&DSACode=XYOH&LGcode=GHAR01&LCcode=GHAR01&LC2=GHAR01&SMcode=554558#nbb",
    "dinersblack": "https://applyonline.hdfcbank.com/cards/credit-cards.html?CHANNELSOURCE=DINE&DSACode=XYOH&LGcode=GHAR01&LCcode=GHAR01&LC2=GHAR01&SMcode=554558#nbb",
    "marriott": "https://applyonline.hdfcbank.com/cards/credit-cards.html?CHANNELSOURCE=MRTB&DEDUPE=N&DSACode=XYOH&LGcode=GHAR01&LCcode=GHAR01&LC2=GHAR01&SMcode=554558#nbb",
    "securedexistingfd": "https://applyonline.hdfcbank.com/digital/etb-fixed-deposit-cc?Channel=DSA&LGCode=XYOH&SMCode=S54558&LC1=GHAR01&LC2=GHAR01&DSACode=XYOH#nbb",
    "securednewfd": "https://pixel.hdfcbank.com/pixel-onboard/landing/?flow=FDLien&sourcing.assist.channelCode=DSA&sourcing.assist.branchCode=XYOH&sourcing.assist.employeeCode=S54558&sourcing.assist.dsaCode=XYOH&sourcing.assist.lgCode=GHAR01&sourcing.assist.lc1Code=GHAR01&sourcing.assist.lc2Code=GHAR01&sourcing.assist.sourcingPartnerCode=GHAR01"
  };

  // Check matching HDFC card names
  const key = Object.keys(hdfcLinks).find(k => nameLower.replace(/[^a-z0-9]/g, '').includes(k));
  if (key) {
    return hdfcLinks[key];
  }

  // Fallback HDFC link
  if (bankLower === 'hdfc' || nameLower.includes('hdfc')) {
    return "https://applyonline.hdfcbank.com/cards/credit-cards.html?CHANNELSOURCE=ZETA&DSACode=XYOH&LGcode=GHAR01&LCcode=GHAR01&LC2=GHAR01&SMcode=554558#nbb";
  }

  return null;
};

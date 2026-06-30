/**
 * Utility to resolve direct application links for various bank cards.
 */
export const getBankApplyLink = (cardName, bankId) => {
  const nameLower = (cardName || '').toLowerCase();
  const bankLower = (bankId || '').toLowerCase();

  // Axis Bank Cards (connect all to the Axis referral link)
  if (bankLower === 'axis' || nameLower.includes('axis')) {
    return "https://web.axis.bank.in/DigitalChannel/WebForm/?ipa68&axisreferralcode=WMMNYOH1_964083";
  }

  // SBI Bank Cards (connect all to SBI link)
  if (bankLower === 'sbi' || nameLower.includes('sbi') || nameLower.includes('state bank')) {
    return "https://www.sbicard.com/corecards/?CHN=OMLG&GEMID1=ABC1&GEMID2=YOH01";
  }

  // IDFC Bank Cards (connect all to IDFC link)
  if (bankLower === 'idfc' || nameLower.includes('idfc')) {
    return "https://www.idfcfirst.bank.in/credit-card/ntb-diy/apply";
  }

  // BOB Bank Cards (connect all to the BOB link)
  if (bankLower === 'bob' || nameLower.includes('bob') || nameLower.includes('baroda')) {
    return "https://mycard.bobcard.tech/?utm_source=urbanmoney&utm_medium=urbanmoney_aq&utm_campaign=APAY30";
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

  const floatLink = "https://applyonline.hdfcbank.com/cards/credit-cards.html?FUNC=FLOAT&CHANNEL=DSA&DSACODE=XYOH&LGcode=GHAR01&LCcode=GHAR01&LC2=GHAR01&SMcode=S54558";

  // HDFC Card specific links mapping
  const hdfcLinks = {
    "freedom": floatLink,
    "regaliagold": floatLink,
    "moneyback": floatLink,
    "bizgrow": floatLink,
    "shoppersstopblack": floatLink,
    "shoppersstop": floatLink,
    "bizpower": floatLink,
    "bizfirst": floatLink,
    "pixelplay": "https://applyonline.hdfcbank.com/cards/credit-cards.html?CHANNELSOURCE=ZETA&DSACode=XYOH&LGcode=GHAR01&LCcode=GHAR01&LC2=GHAR01&SMcode=S54558#nbb",
    "pixelgo": "https://applyonline.hdfcbank.com/cards/credit-cards.html?CHANNELSOURCE=ZETA&DSACode=XYOH&LGcode=GHAR01&LCcode=GHAR01&LC2=GHAR01&SMcode=S54558#nbb",
    "tataneuplus": "https://www.tataneu.com/creditcard/",
    "tataneuinfinity": "https://www.tataneu.com/creditcard/",
    "swiggy": "https://applyonline.hdfcbank.com/cards/credit-cards.html?CHANNELSOURCE=SWCC&DSACode=XYOH&LGcode=GHAR01&LCcode=GHAR01&LC2=GHAR01&SMcode=S54558#nbb",
    "indianoil": "https://applyonline.hdfcbank.com/cards/credit-cards.html?FUNC=FLOAT&CHANNEL=DSA&DSACODE=XYOH&LGcode=GHAR01&LCcode=GHAR01&LC2=GHAR01&SMcode=S54558#nbb",
    "irctc": "https://applyonline.hdfcbank.com/cards/credit-cards.html?CHANNELSOURCE=IRCT&DSACode=XYOH&LGcode=GHAR01&LCcode=GHAR01&LC2=GHAR01&SMcode=S54558#nbb",
    "dinersprivilege": "https://applyonline.hdfcbank.com/cards/credit-cards.html?CHANNELSOURCE=DINE&DSACode=XYOH&LGcode=GHAR01&LCcode=GHAR01&LC2=GHAR01&SMcode=S54558#nbb",
    "dinersblack": "https://applyonline.hdfcbank.com/cards/credit-cards.html?CHANNELSOURCE=DINE&DSACode=XYOH&LGcode=GHAR01&LCcode=GHAR01&LC2=GHAR01&SMcode=S54558#nbb",
    "marriott": "https://applyonline.hdfcbank.com/cards/credit-cards.html?CHANNELSOURCE=MRTB&DEDUPE=N&DSACode=XYOH&LGcode=GHAR01&LCcode=GHAR01&LC2=GHAR01&SMcode=S54558#nbb",
    "securedexistingfd": "https://applyonline.hdfcbank.com/digital/etb-fixed-deposit-cc?Channel=DSA&LGCode=XYOH&SMCode=SS4558&LC1=GHAR01&LC2=GHAR01&DSACode=XYOH#nbb",
    "securednewfd": "https://pixel.hdfcbank.in/pixel-onboard/landing/?flow=FDLien&sourcing.assist.channelCode=DSA&sourcing.assist.branchCode=XYOH&sourcing.assist.employeeCode=S54558&sourcing.assist.dsaCode=XYOH&sourcing.assist.lgCode=GHAR01&sourcing.assist.lc1Code=GHAR01&sourcing.assist.lc2Code=GHAR01&sourcing.assist.dsaCode=XYOH"
  };

  // Check matching HDFC card names
  const key = Object.keys(hdfcLinks).find(k => nameLower.replace(/[^a-z0-9]/g, '').includes(k));
  if (key) {
    return hdfcLinks[key];
  }

  // Fallback HDFC link
  if (bankLower === 'hdfc' || nameLower.includes('hdfc')) {
    return "https://applyonline.hdfcbank.com/cards/credit-cards.html?CHANNELSOURCE=ZETA&DSACode=XYOH&LGcode=GHAR01&LCcode=GHAR01&LC2=GHAR01&SMcode=S54558#nbb";
  }

  return null;
};

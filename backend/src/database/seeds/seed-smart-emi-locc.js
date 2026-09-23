const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const { query } = require('../../config/database');
const logger = require('../../config/logger');

function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/**
 * Full product catalog for Loan on Credit Card and EMI on Credit Card (Smart EMI)
 * across all major Indian banks.
 */
const LOAN_ON_CARD_AND_SMART_EMI_PRODUCTS = [
  // ── 1. HDFC BANK ───────────────────────────────────────────
  {
    bank_name: 'HDFC Bank',
    short_code: 'HDFC',
    name: 'HDFC Bank Insta Loan & Jumbo Loan',
    category: 'loan_on_credit_card',
    sub_category: 'Loan on Credit Card',
    short_description: 'Over-and-above credit limit pre-approved instant cash loan transferred directly to savings account.',
    description: 'HDFC Bank Insta Loan and Insta Jumbo Loan provide pre-approved instant cash funds credited to your savings account in 10 seconds. Jumbo Loans do not block your credit card spending limit.',
    annual_fee: '₹999 + GST Fee',
    joining_fee: 'Nil',
    interest_rate: '11.49% - 15.50% p.a.',
    time_period: '12 - 60 Months',
    badge: 'Pre-Approved',
    features: [
      'Instant 10-second credit disbursal directly to bank account',
      'Insta Jumbo Loan option over and above existing credit limit',
      'Zero physical documentation required',
      'Flexible foreclosure options after 12 EMIs'
    ],
    eligibility_criteria: 'Pre-approved HDFC Bank Credit Cardholders with good repayment history.'
  },
  {
    bank_name: 'HDFC Bank',
    short_code: 'HDFC',
    name: 'HDFC Bank SmartEMI on Credit Card',
    category: 'smart_emi',
    sub_category: 'EMI on Credit Card',
    short_description: 'Convert HDFC credit card purchases into flexible EMIs up to 48 months with low interest rates.',
    description: 'HDFC Bank SmartEMI allows cardholders to convert large purchases or credit card statement balances into easy monthly EMIs via NetBanking, MyCards app, or SMS.',
    annual_fee: '₹199 + GST Fee',
    joining_fee: 'Nil',
    interest_rate: '1.15% per month (13.80% p.a.)',
    time_period: '3 - 48 Months',
    badge: 'Popular Scheme',
    features: [
      'Instant 1-click conversion via NetBanking & MobileBanking',
      'Convert purchases within 60 days of transaction',
      'No-Cost EMI options across 5,000+ top retail & online merchants',
      'Retain original reward points earned before conversion'
    ],
    eligibility_criteria: 'HDFC Bank Credit Cardholders with unutilized credit limit.'
  },

  // ── 2. STATE BANK OF INDIA (SBI CARD) ──────────────────────
  {
    bank_name: 'State Bank of India',
    short_code: 'SBI',
    name: 'SBI Card Encash & Encash Inline',
    category: 'loan_on_credit_card',
    sub_category: 'Loan on Credit Card',
    short_description: 'Instant pre-approved cash loan credited via NEFT with ZERO documentation.',
    description: 'SBI Card Encash & Encash Inline offer pre-approved money directly into your bank account via instant NEFT transfer or cheque disbursal.',
    annual_fee: '1% (Min ₹500, Max ₹1,000)',
    joining_fee: 'Nil',
    interest_rate: '12.50% - 16.00% p.a.',
    time_period: '12 - 48 Months',
    badge: 'Popular Choice',
    features: [
      'Instant NEFT transfer within 48 hours to any bank account',
      'Encash Inline option blocks existing limit while Encash gives over-limit funds',
      'Zero income documentation or branch visits',
      'Convenient auto-debit billing on monthly card statement'
    ],
    eligibility_criteria: 'Active SBI Credit Cardholders in good credit standing.'
  },
  {
    bank_name: 'State Bank of India',
    short_code: 'SBI',
    name: 'SBI Card Flexipay & Balance Transfer on EMI',
    category: 'smart_emi',
    sub_category: 'EMI on Credit Card',
    short_description: 'Convert transactions above ₹2,500 into flexible EMIs or transfer external card balance.',
    description: 'SBI Card Flexipay allows you to convert transactions over ₹2,500 into easy EMIs. Balance Transfer on EMI lets you transfer other credit card balances to SBI Card at lower interest.',
    annual_fee: '1% (Min ₹99)',
    joining_fee: 'Nil',
    interest_rate: '1.25% per month (15.00% p.a.)',
    time_period: '3 - 36 Months',
    badge: 'Flexi Option',
    features: [
      'Convert transactions within 30 days of purchase via SBI Card App',
      'Transfer outstanding balances from other bank credit cards to SBI EMI',
      'Choice of 6, 9, 12, 24, or 36 month tenures',
      'Instant processing with zero physical paper submission'
    ],
    eligibility_criteria: 'Primary SBI Cardholders with transactions above ₹2,500.'
  },

  // ── 3. ICICI BANK ───────────────────────────────────────────
  {
    bank_name: 'ICICI Bank',
    short_code: 'ICICI',
    name: 'ICICI Bank Dial-a-Loan & Instant Personal Loan on Card',
    category: 'loan_on_credit_card',
    sub_category: 'Loan on Credit Card',
    short_description: 'Instant pre-approved cash loan credited directly into any bank account via iMobile.',
    description: 'ICICI Bank Dial-a-Loan on Credit Card provides instant cash transfer to your bank account with minimal interest rates and zero paperwork.',
    annual_fee: 'Flat ₹499 + GST',
    joining_fee: 'Nil',
    interest_rate: '11.99% - 14.99% p.a.',
    time_period: '12 - 36 Months',
    badge: 'Low Processing Fee',
    features: [
      'Instant funds disbursal directly to any bank account via iMobile',
      'Zero impact on existing credit card spending limit',
      'Reduced interest rates for active cardholders',
      'Repay in easy 12 to 36 month EMIs'
    ],
    eligibility_criteria: 'Pre-approved ICICI Bank Credit Cardholders.'
  },
  {
    bank_name: 'ICICI Bank',
    short_code: 'ICICI',
    name: 'ICICI Bank Instant EMI & Balance Transfer on EMI',
    category: 'smart_emi',
    sub_category: 'EMI on Credit Card',
    short_description: 'Convert retail or online purchases instantly into easy EMIs on ICICI Credit Card.',
    description: 'ICICI Bank Instant EMI allows instant conversion of high-value merchant purchases or card unbilled transactions into affordable EMIs.',
    annual_fee: 'Flat ₹199 + GST',
    joining_fee: 'Nil',
    interest_rate: '1.08% per month (13.00% p.a.)',
    time_period: '3 - 24 Months',
    badge: 'Instant Checkout',
    features: [
      'Instant checkout EMI at Amazon, Flipkart, Croma, and 10,000+ stores',
      'Convert past purchases into EMIs via iMobile app',
      'Consolidate other bank card balances into ICICI EMIs',
      'No pre-closure penalty after 6 EMI payments'
    ],
    eligibility_criteria: 'ICICI Bank Credit Cardholders.'
  },

  // ── 4. AXIS BANK ────────────────────────────────────────────
  {
    bank_name: 'Axis Bank',
    short_code: 'AXIS',
    name: 'Axis Bank Instant Cash & Jumbo Loan on Card',
    category: 'loan_on_credit_card',
    sub_category: 'Loan on Credit Card',
    short_description: 'Pre-approved cash disbursal directly from Axis Mobile NetBanking.',
    description: 'Axis Bank Instant Cash on Credit Card lets cardholders withdraw instant cash loans directly to their bank account using Axis Mobile or Internet Banking.',
    annual_fee: '1.5% (Max ₹1,500)',
    joining_fee: 'Nil',
    interest_rate: '13.00% - 16.50% p.a.',
    time_period: '6 - 36 Months',
    badge: 'Fast Transfer',
    features: [
      'Instant NetBanking cash transfer within seconds',
      'Zero branch visits or paperwork',
      'Transparent repayment schedule in monthly credit card statement',
      'Jumbo option over credit limit for select customers'
    ],
    eligibility_criteria: 'Axis Bank Primary Credit Cardholders.'
  },
  {
    bank_name: 'Axis Bank',
    short_code: 'AXIS',
    name: 'Axis Bank Dial-a-Convert & 2EMI on Credit Card',
    category: 'smart_emi',
    sub_category: 'EMI on Credit Card',
    short_description: 'Split credit card outstanding balances or transactions into stress-free monthly installments.',
    description: 'Axis Bank Dial-a-Convert allows converting card purchases over ₹2,500 into flexible EMIs up to 36 months.',
    annual_fee: '1.5% (Min ₹150)',
    joining_fee: 'Nil',
    interest_rate: '1.20% per month (14.40% p.a.)',
    time_period: '3 - 36 Months',
    badge: 'Fast Convert',
    features: [
      'Convert transactions up to 60 days old',
      '24x7 conversion capability directly via Axis Mobile app',
      'Flat processing fee with zero paper verification',
      'Retain credit card reward points earned'
    ],
    eligibility_criteria: 'Axis Bank Primary Credit Cardholders.'
  },

  // ── 5. IDFC FIRST BANK ──────────────────────────────────────
  {
    bank_name: 'IDFC First Bank',
    short_code: 'IDFC',
    name: 'IDFC FIRST Bank Card Limit to Cash Loan',
    category: 'loan_on_credit_card',
    sub_category: 'Loan on Credit Card',
    short_description: 'Convert card limit to 24x7 instant cash disbursal with ZERO processing fees.',
    description: 'IDFC FIRST Bank Card Limit to Cash Loan offers 1-click cash disbursal directly to bank account with zero processing fee.',
    annual_fee: 'ZERO Processing Fee',
    joining_fee: 'Nil',
    interest_rate: '12.00% - 15.00% p.a.',
    time_period: '3 - 24 Months',
    badge: 'Zero Processing Fee',
    features: [
      '1-click instant digital execution on IDFC FIRST Mobile App',
      'Zero processing fee for select pre-approved customers',
      'Interest-free cash window for select premium cardholders',
      'Zero paper documentation'
    ],
    eligibility_criteria: 'IDFC FIRST Bank Credit Cardholders.'
  },
  {
    bank_name: 'IDFC First Bank',
    short_code: 'IDFC',
    name: 'IDFC FIRST Bank Instant Card EMI Conversion',
    category: 'smart_emi',
    sub_category: 'EMI on Credit Card',
    short_description: 'Low interest rate purchase conversion for IDFC FIRST credit cards.',
    description: 'IDFC FIRST Bank Card EMI allows splitting transactions into convenient monthly installments with low interest rates.',
    annual_fee: 'Nil / Zero Processing Fee',
    joining_fee: 'Nil',
    interest_rate: '1.00% per month (12.00% p.a.)',
    time_period: '3 - 24 Months',
    badge: 'Zero Fee EMI',
    features: [
      '0% processing fee for select cardholders',
      'Seamless digital execution via IDFC FIRST Bank app',
      'Flexible tenure options from 3 to 24 months',
      'Transparent monthly statement billing'
    ],
    eligibility_criteria: 'Active IDFC FIRST Bank Credit Cardholders.'
  },

  // ── 6. KOTAK MAHINDRA BANK ──────────────────────────────────
  {
    bank_name: 'Kotak Mahindra Bank',
    short_code: 'KOTAK',
    name: 'Kotak Mahindra Bank Smart Loan on Credit Card',
    category: 'loan_on_credit_card',
    sub_category: 'Loan on Credit Card',
    short_description: 'Customized pre-approved limit based on card history with IMPS instant disbursal.',
    description: 'Kotak Smart Loan on Credit Card offers quick cash disbursal via IMPS directly into your savings account.',
    annual_fee: '₹750 + GST',
    joining_fee: 'Nil',
    interest_rate: '12.99% - 16.00% p.a.',
    time_period: '12 - 48 Months',
    badge: 'High Conversion',
    features: [
      'Instant IMPS cash disbursal to any bank account',
      'Auto-debit billing on credit card statement',
      'Zero foreclosure fees after 6 EMIs',
      'Pre-approved offer based on track record'
    ],
    eligibility_criteria: 'Kotak Mahindra Credit Cardholders.'
  },
  {
    bank_name: 'Kotak Mahindra Bank',
    short_code: 'KOTAK',
    name: 'Kotak Mahindra Bank Smart EMI & Balance Transfer',
    category: 'smart_emi',
    sub_category: 'EMI on Credit Card',
    short_description: 'Convert high-value spend into manageable EMIs with Kotak Credit Cards.',
    description: 'Kotak Smart EMI allows cardholders to split high transactions into EMIs directly through Kotak 811 App or SMS.',
    annual_fee: '₹199 + GST',
    joining_fee: 'Nil',
    interest_rate: '1.25% per month (15.00% p.a.)',
    time_period: '3 - 48 Months',
    badge: 'High Approval',
    features: [
      'Convert purchases online or via SMS keyword',
      'Instant 1-Tap EMI conversion on Kotak 811 App',
      'Balance Transfer on EMI option available for other card balances',
      'Foreclosure option available anytime'
    ],
    eligibility_criteria: 'Kotak Bank Credit Cardholders.'
  },

  // ── 7. RBL BANK ─────────────────────────────────────────────
  {
    bank_name: 'RBL Bank',
    short_code: 'RBL',
    name: 'RBL Bank Split-N-Pay Cash Loan on Credit Card',
    category: 'loan_on_credit_card',
    sub_category: 'Loan on Credit Card',
    short_description: 'Pre-approved instant cash loan transferred directly to bank account.',
    description: 'RBL Bank Split-N-Pay Cash Loan provides pre-approved instant money against your RBL credit card limit with simple monthly repayment.',
    annual_fee: '1.5% (Min ₹500)',
    joining_fee: 'Nil',
    interest_rate: '13.50% - 17.00% p.a.',
    time_period: '12 - 36 Months',
    badge: 'Instant Cash',
    features: [
      'Instant fund transfer to bank account via RBL MyCard app',
      'Zero paper verification',
      'Flexible tenures up to 36 months',
      'Transparent billing in monthly card statement'
    ],
    eligibility_criteria: 'RBL Credit Cardholders in good credit standing.'
  },
  {
    bank_name: 'RBL Bank',
    short_code: 'RBL',
    name: 'RBL Bank Split-N-Pay EMI Conversion',
    category: 'smart_emi',
    sub_category: 'EMI on Credit Card',
    short_description: 'Split single or multiple transaction items into EMIs instantly.',
    description: 'RBL Bank Split-N-Pay EMI lets you convert retail or online purchases into flexible monthly installments.',
    annual_fee: '₹150 + GST',
    joining_fee: 'Nil',
    interest_rate: '1.16% per month (14.00% p.a.)',
    time_period: '3 - 24 Months',
    badge: 'Easy Split',
    features: [
      'Split single or multiple transaction items into EMIs',
      'Special zero interest promotional windows on top brands',
      'Zero foreclosure fees option',
      'Instant conversion via RBL MyCard Mobile App'
    ],
    eligibility_criteria: 'Primary RBL Credit Cardholders.'
  },

  // ── 8. INDUSIND BANK ────────────────────────────────────────
  {
    bank_name: 'IndusInd Bank',
    short_code: 'INDUSIND',
    name: 'IndusInd Bank Instant Cash on Credit Card (IndusMoney)',
    category: 'loan_on_credit_card',
    sub_category: 'Loan on Credit Card',
    short_description: 'Instant credit card cash disbursal directly to account with flexible EMIs.',
    description: 'IndusInd Bank IndusMoney on Credit Card enables cardholders to get pre-approved instant cash transferred directly into their savings account.',
    annual_fee: '1% (Min ₹500)',
    joining_fee: 'Nil',
    interest_rate: '12.50% - 16.50% p.a.',
    time_period: '6 - 36 Months',
    badge: 'Instant Disbursal',
    features: [
      'Instant transfer via IndusMobile app',
      'Pre-approved cash credit line',
      'Flexible repayment terms',
      'Zero documentation required'
    ],
    eligibility_criteria: 'Active IndusInd Bank Credit Cardholders.'
  },
  {
    bank_name: 'IndusInd Bank',
    short_code: 'INDUSIND',
    name: 'IndusInd Bank Merchant & Post-Purchase EMI',
    category: 'smart_emi',
    sub_category: 'EMI on Credit Card',
    short_description: 'Convert high value purchases into monthly EMIs with attractive interest rates.',
    description: 'IndusInd Bank EMI facility lets cardholders convert high-value purchases at merchant checkout or post-purchase into easy monthly EMIs.',
    annual_fee: '₹199 + GST',
    joining_fee: 'Nil',
    interest_rate: '1.15% per month (13.80% p.a.)',
    time_period: '3 - 24 Months',
    badge: 'Low Interest',
    features: [
      'Merchant EMI checkout across Amazon, Flipkart, and leading stores',
      'Post-purchase EMI conversion via IndusMobile App',
      'Flexible tenure choices (3, 6, 9, 12, 18, 24 months)',
      'Transparent monthly billing'
    ],
    eligibility_criteria: 'IndusInd Credit Cardholders.'
  },

  // ── 9. AU SMALL FINANCE BANK ─────────────────────────────────
  {
    bank_name: 'AU Small Finance Bank',
    short_code: 'AU',
    name: 'AU Small Finance Bank Instant Cash Loan on Card',
    category: 'loan_on_credit_card',
    sub_category: 'Loan on Credit Card',
    short_description: 'Customized pre-approved cash loan limit against AU credit card.',
    description: 'AU Bank Loan on Credit Card offers cardholders quick cash access transferred directly into their bank account via AU 0101 app.',
    annual_fee: '1% (Min ₹500)',
    joining_fee: 'Nil',
    interest_rate: '13.00% - 16.00% p.a.',
    time_period: '6 - 36 Months',
    badge: 'Pre-Approved',
    features: [
      'Instant digital disbursal via AU 0101 App',
      'Zero income documentation required',
      'Pre-approved limit over credit line',
      'Auto debit EMI billing'
    ],
    eligibility_criteria: 'Pre-approved AU Small Finance Bank Credit Cardholders.'
  },
  {
    bank_name: 'AU Small Finance Bank',
    short_code: 'AU',
    name: 'AU Small Finance Bank Merchant & Flexi EMI',
    category: 'smart_emi',
    sub_category: 'EMI on Credit Card',
    short_description: 'Convert AU card spends into easy EMIs with customized app features.',
    description: 'AU Bank EMI on Credit Card enables cardholders to split purchases over ₹2,000 into affordable monthly installments via AU 0101 app.',
    annual_fee: '₹199 + GST',
    joining_fee: 'Nil',
    interest_rate: '1.20% per month (14.40% p.a.)',
    time_period: '3 - 24 Months',
    badge: 'Customizable EMI',
    features: [
      'Convert transactions directly on AU 0101 App',
      'No-cost EMI offers with major retail partners',
      'Flexible repayment tenure options',
      'Retain reward points on initial spend'
    ],
    eligibility_criteria: 'AU Credit Cardholders.'
  },

  // ── 10. FEDERAL BANK / SCAPIA ────────────────────────────────
  {
    bank_name: 'Federal Bank',
    short_code: 'FEDERAL',
    name: 'Federal Bank Card Cash Loan',
    category: 'loan_on_credit_card',
    sub_category: 'Loan on Credit Card',
    short_description: 'Instant cash transfer to savings account via FedMobile app.',
    description: 'Federal Bank Card Cash Loan provides instant cash loan facility against credit card limit with simple monthly repayment.',
    annual_fee: '1% (Min ₹499)',
    joining_fee: 'Nil',
    interest_rate: '12.99% - 15.99% p.a.',
    time_period: '6 - 36 Months',
    badge: 'Fast Credit',
    features: [
      'Instant funds disbursal to FedMobile linked account',
      '100% digital execution with zero paperwork',
      'Competitive interest rates',
      'Convenient monthly statement billing'
    ],
    eligibility_criteria: 'Federal Bank Credit Cardholders.'
  },
  {
    bank_name: 'Federal Bank',
    short_code: 'FEDERAL',
    name: 'Federal Bank Instant Credit Card EMI',
    category: 'smart_emi',
    sub_category: 'EMI on Credit Card',
    short_description: 'Convert travel, electronics, and retail spends into easy EMIs via FedMobile.',
    description: 'Federal Bank Instant EMI lets cardholders convert high-value purchases into easy monthly EMIs.',
    annual_fee: '₹149 + GST',
    joining_fee: 'Nil',
    interest_rate: '1.15% per month (13.80% p.a.)',
    time_period: '3 - 24 Months',
    badge: 'Easy EMI',
    features: [
      'Instant conversion on FedMobile & Scapia app',
      'Zero foreclosure fees after 3 EMIs',
      'Flexible tenures from 3 to 24 months',
      'No-cost EMI deals at leading stores'
    ],
    eligibility_criteria: 'Federal Bank & Scapia Credit Cardholders.'
  },

  // ── 11. YES BANK ────────────────────────────────────────────
  {
    bank_name: 'YES Bank',
    short_code: 'YES',
    name: 'YES Bank Quick Loan on Credit Card',
    category: 'loan_on_credit_card',
    sub_category: 'Loan on Credit Card',
    short_description: 'Instant digital approval & cash funds transfer for YES Bank cardholders.',
    description: 'YES Bank Quick Loan on Credit Card offers pre-approved cash loans credited directly into your bank account.',
    annual_fee: '1% (Min ₹500)',
    joining_fee: 'Nil',
    interest_rate: '12.50% - 16.00% p.a.',
    time_period: '12 - 48 Months',
    badge: 'Quick Disbursal',
    features: [
      'Instant digital approval via YES Online & IRIS app',
      'No physical documentation required',
      'Flexible tenures up to 48 months',
      'Repay in easy EMIs added to monthly statement'
    ],
    eligibility_criteria: 'YES Bank Credit Cardholders.'
  },
  {
    bank_name: 'YES Bank',
    short_code: 'YES',
    name: 'YES Bank Speed EMI & Balance Transfer',
    category: 'smart_emi',
    sub_category: 'EMI on Credit Card',
    short_description: 'Convert transactions or external credit card balance into easy YES Bank EMIs.',
    description: 'YES Bank Speed EMI allows instant conversion of card purchases or external credit card balances into manageable monthly EMIs.',
    annual_fee: '₹199 + GST',
    joining_fee: 'Nil',
    interest_rate: '1.20% per month (14.40% p.a.)',
    time_period: '3 - 36 Months',
    badge: 'Speed EMI',
    features: [
      'Convert purchases within 30 days via YES Online / IRIS App',
      'Balance Transfer on EMI for other bank credit card balances',
      'Flexible repayment options',
      'Low processing fees'
    ],
    eligibility_criteria: 'Primary YES Bank Credit Cardholders.'
  },

  // ── 12. BANK OF BARODA (BOBCARD) ────────────────────────────
  {
    bank_name: 'Bank of Baroda',
    short_code: 'BOB',
    name: 'BOBCARD Cash on Card Loan',
    category: 'loan_on_credit_card',
    sub_category: 'Loan on Credit Card',
    short_description: 'Pre-approved cash loan against BOBCARD credit limit.',
    description: 'BOBCARD Cash on Card provides cardholders with instant cash loan options directly into their bank account.',
    annual_fee: '1% (Min ₹500)',
    joining_fee: 'Nil',
    interest_rate: '13.00% - 16.50% p.a.',
    time_period: '6 - 36 Months',
    badge: 'Pre-Approved',
    features: [
      'Direct NEFT cash transfer to bank account',
      'Zero paper documentation',
      'Auto debit monthly billing',
      'Pre-approved based on card usage track record'
    ],
    eligibility_criteria: 'BOBCARD Credit Cardholders in good standing.'
  },
  {
    bank_name: 'BOBCARD EMI & Balance Transfer on EMI',
    short_code: 'BOB',
    name: 'BOBCARD EMI & Balance Transfer on EMI',
    category: 'smart_emi',
    sub_category: 'EMI on Credit Card',
    short_description: 'Convert BOBCARD transactions into easy monthly EMIs.',
    description: 'BOBCARD EMI facility allows splitting purchases over ₹2,500 into easy EMIs via BOBCARD Mobile app.',
    annual_fee: '₹199 + GST',
    joining_fee: 'Nil',
    interest_rate: '1.25% per month (15.00% p.a.)',
    time_period: '3 - 24 Months',
    badge: 'Easy Conversion',
    features: [
      'Convert transactions over ₹2,500 into EMIs',
      'Balance transfer from other cards to BOBCARD EMI',
      'Flexible tenure selection',
      'Simple mobile app conversion'
    ],
    eligibility_criteria: 'Active BOBCARD Credit Cardholders.'
  },

  // ── 13. STANDARD CHARTERED BANK ─────────────────────────────
  {
    bank_name: 'Standard Chartered Bank',
    short_code: 'SCB',
    name: 'Standard Chartered Instant Cash on Credit Card',
    category: 'loan_on_credit_card',
    sub_category: 'Loan on Credit Card',
    short_description: 'Instant pre-approved cash loan transferred via SC Mobile.',
    description: 'Standard Chartered Instant Cash on Credit Card provides quick funds transfer to any savings account in India with minimal documentation.',
    annual_fee: '1% (Min ₹500)',
    joining_fee: 'Nil',
    interest_rate: '12.00% - 15.50% p.a.',
    time_period: '12 - 48 Months',
    badge: 'Instant Funds',
    features: [
      'Instant funds disbursal via SC Mobile app',
      'No income proof or collateral required',
      'Choice of flexible EMIs',
      'Competitive interest rate structure'
    ],
    eligibility_criteria: 'Standard Chartered Credit Cardholders.'
  },
  {
    bank_name: 'Standard Chartered Bank',
    short_code: 'SCB',
    name: 'Standard Chartered Kuch Bhi EMI & Balance Transfer',
    category: 'smart_emi',
    sub_category: 'EMI on Credit Card',
    short_description: 'Convert any transaction into easy EMIs with Kuch Bhi EMI scheme.',
    description: 'Standard Chartered Kuch Bhi EMI allows converting transactions into flexible EMIs directly via mobile app or online banking.',
    annual_fee: '₹199 + GST',
    joining_fee: 'Nil',
    interest_rate: '1.15% per month (13.80% p.a.)',
    time_period: '3 - 36 Months',
    badge: 'Kuch Bhi EMI',
    features: [
      'Convert any transaction above ₹2,000 into EMI',
      'Balance Transfer on EMI option available for other card balances',
      'Instant digital processing via SC Mobile',
      'Flexible repayment tenure options'
    ],
    eligibility_criteria: 'Standard Chartered Credit Cardholders.'
  },

  // ── 14. CANARA BANK ─────────────────────────────────────────
  {
    bank_name: 'Canara Bank',
    short_code: 'CANARA',
    name: 'Canara Bank Credit Card Cash Loan',
    category: 'loan_on_credit_card',
    sub_category: 'Loan on Credit Card',
    short_description: 'Pre-approved cash loan facility for Canara credit cardholders.',
    description: 'Canara Bank Credit Card Cash Loan offers quick cash advance facility against credit card limit directly into bank account.',
    annual_fee: '1% (Min ₹300)',
    joining_fee: 'Nil',
    interest_rate: '13.00% - 16.00% p.a.',
    time_period: '6 - 36 Months',
    badge: 'Public Sector Trust',
    features: [
      'Direct credit to Canara Bank account',
      'Transparent interest structure',
      'Minimal processing charges',
      'Auto-debit from monthly statement'
    ],
    eligibility_criteria: 'Canara Bank Credit Cardholders.'
  },
  {
    bank_name: 'Canara Bank',
    short_code: 'CANARA',
    name: 'Canara Bank Credit Card Purchase EMI',
    category: 'smart_emi',
    sub_category: 'EMI on Credit Card',
    short_description: 'Convert retail purchases into easy monthly EMIs.',
    description: 'Canara Bank Credit Card EMI allows splitting high-value card purchases into affordable monthly installments.',
    annual_fee: '₹100 + GST',
    joining_fee: 'Nil',
    interest_rate: '1.20% per month (14.40% p.a.)',
    time_period: '3 - 24 Months',
    badge: 'Low Processing Fee',
    features: [
      'Convert purchases over ₹2,500 into EMIs',
      'Nominal processing fee',
      'Flexible tenure options',
      'Easy request via netbanking or mobile app'
    ],
    eligibility_criteria: 'Canara Credit Cardholders.'
  },

  // ── 15. UNION BANK OF INDIA ─────────────────────────────────
  {
    bank_name: 'Union Bank of India',
    short_code: 'UNION',
    name: 'Union Bank Credit Card Cash Advance Loan',
    category: 'loan_on_credit_card',
    sub_category: 'Loan on Credit Card',
    short_description: 'Instant cash advance loan against Union Bank credit card.',
    description: 'Union Bank Credit Card Cash Advance Loan allows cardholders to transfer cash against credit limit into their bank account.',
    annual_fee: '1% (Min ₹300)',
    joining_fee: 'Nil',
    interest_rate: '13.50% - 16.50% p.a.',
    time_period: '6 - 36 Months',
    badge: 'Public Sector Trust',
    features: [
      'Direct account transfer',
      'Zero branch visit for pre-approved users',
      'Clear monthly EMI schedule',
      'Flexible tenures up to 36 months'
    ],
    eligibility_criteria: 'Union Bank Credit Cardholders.'
  },
  {
    bank_name: 'Union Bank of India',
    short_code: 'UNION',
    name: 'Union Bank Credit Card EMI Scheme',
    category: 'smart_emi',
    sub_category: 'EMI on Credit Card',
    short_description: 'Convert card spends into easy monthly installments.',
    description: 'Union Bank Credit Card EMI Scheme lets cardholders convert high-value purchases into EMIs with low monthly interest.',
    annual_fee: '₹100 + GST',
    joining_fee: 'Nil',
    interest_rate: '1.25% per month (15.00% p.a.)',
    time_period: '3 - 24 Months',
    badge: 'Standard EMI',
    features: [
      'Convert transactions above ₹2,500 into EMIs',
      'Nominal processing fee',
      'Flexible 3 to 24 month tenures',
      'Simple request via mobile app / netbanking'
    ],
    eligibility_criteria: 'Union Bank Credit Cardholders.'
  }
];

async function seedSmartEmiAndLoccProducts() {
  logger.info('🚀 Starting seeding for Loan on Credit Card & Smart EMI products...');

  // Ensure Enum values exist in PostgreSQL for product_category if needed
  try {
    await query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_category') THEN
          CREATE TYPE product_category AS ENUM ('credit_card', 'co_branded_card', 'fd_card', 'personal_loan', 'instant_loan', 'business_loan', 'home_loan', 'loan_against_property', 'vehicle_loan', 'gold_loan', 'education_loan', 'health_insurance', 'life_insurance', 'general_insurance', 'savings_account', 'demat_account', 'fixed_deposit', 'mutual_fund', 'loan_on_credit_card', 'smart_emi');
        ELSE
          ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'loan_on_credit_card';
          ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'smart_emi';
        END IF;
      END $$;
    `);
  } catch (enumErr) {
    logger.warn('Product category enum note:', enumErr.message);
  }

  // Fetch all banks
  const { rows: banks } = await query(`SELECT id, name, short_code FROM banks`);
  const bankMap = {};
  banks.forEach(b => {
    if (b.short_code) bankMap[b.short_code.toUpperCase()] = b.id;
    const lower = b.name.toLowerCase();
    if (lower.includes('hdfc')) bankMap['HDFC_NAME'] = b.id;
    if (lower.includes('sbi') || lower.includes('state bank')) bankMap['SBI_NAME'] = b.id;
    if (lower.includes('icici')) bankMap['ICICI_NAME'] = b.id;
    if (lower.includes('axis')) bankMap['AXIS_NAME'] = b.id;
    if (lower.includes('idfc')) bankMap['IDFC_NAME'] = b.id;
    if (lower.includes('kotak')) bankMap['KOTAK_NAME'] = b.id;
    if (lower.includes('rbl')) bankMap['RBL_NAME'] = b.id;
    if (lower.includes('indusind')) bankMap['INDUSIND_NAME'] = b.id;
    if (lower.includes('au small') || lower.includes('au bank')) bankMap['AU_NAME'] = b.id;
    if (lower.includes('federal')) bankMap['FEDERAL_NAME'] = b.id;
    if (lower.includes('yes')) bankMap['YES_NAME'] = b.id;
    if (lower.includes('baroda') || lower.includes('bob')) bankMap['BOB_NAME'] = b.id;
    if (lower.includes('standard chartered')) bankMap['SCB_NAME'] = b.id;
    if (lower.includes('canara')) bankMap['CANARA_NAME'] = b.id;
    if (lower.includes('union')) bankMap['UNION_NAME'] = b.id;
  });

  const defaultBankId = banks[0]?.id || null;

  let insertedCount = 0;
  let updatedCount = 0;

  for (const prod of LOAN_ON_CARD_AND_SMART_EMI_PRODUCTS) {
    let targetBankId = bankMap[prod.short_code?.toUpperCase()] || bankMap[`${prod.short_code?.toUpperCase()}_NAME`] || defaultBankId;

    if (!targetBankId) {
      // Create bank if missing
      try {
        const { rows: newBank } = await query(
          `INSERT INTO banks (name, short_code, is_active) VALUES ($1, $2, true) ON CONFLICT (short_code) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
          [prod.bank_name, prod.short_code]
        );
        targetBankId = newBank[0]?.id;
        bankMap[prod.short_code] = targetBankId;
      } catch (bErr) {
        logger.error(`Failed to create bank ${prod.bank_name}:`, bErr.message);
        targetBankId = defaultBankId;
      }
    }

    const prodSlug = slug(prod.name);
    const featuresJson = JSON.stringify(prod.features || []);

    try {
      const res = await query(`
        INSERT INTO products (
          bank_id, name, category, sub_category, description, short_description,
          annual_fee, joining_fee, interest_rate, time_period, badge,
          features, eligibility_criteria, is_active, status, public_visible, partner_visible,
          slug, commission_type, commission_value
        ) VALUES (
          $1, $2, $3::product_category, $4, $5, $6,
          $7, $8, $9, $10, $11,
          $12::jsonb, $13, true, 'Active', true, true,
          $14, 'fixed', 500
        )
        ON CONFLICT (bank_id, name) DO UPDATE SET
          category = EXCLUDED.category,
          sub_category = EXCLUDED.sub_category,
          description = EXCLUDED.description,
          short_description = EXCLUDED.short_description,
          annual_fee = EXCLUDED.annual_fee,
          joining_fee = EXCLUDED.joining_fee,
          interest_rate = EXCLUDED.interest_rate,
          time_period = EXCLUDED.time_period,
          badge = EXCLUDED.badge,
          features = EXCLUDED.features,
          eligibility_criteria = EXCLUDED.eligibility_criteria,
          slug = EXCLUDED.slug,
          is_active = true,
          status = 'Active'
        RETURNING (xmin = 0) AS is_insert
      `, [
        targetBankId, prod.name, prod.category, prod.sub_category, prod.description, prod.short_description,
        prod.annual_fee, prod.joining_fee, prod.interest_rate, prod.time_period, prod.badge,
        featuresJson, prod.eligibility_criteria, prodSlug
      ]);

      if (res.rows[0]?.is_insert) {
        insertedCount++;
      } else {
        updatedCount++;
      }
      logger.info(`  ✅ Saved Product: ${prod.name} (${prod.category})`);
    } catch (err) {
      // Fallback query without enum cast if enum cast fails
      try {
        await query(`
          INSERT INTO products (
            bank_id, name, category, sub_category, description, short_description,
            annual_fee, joining_fee, interest_rate, time_period, badge,
            features, eligibility_criteria, is_active, status, public_visible, partner_visible,
            slug, commission_type, commission_value
          ) VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10, $11,
            $12::jsonb, $13, true, 'Active', true, true,
            $14, 'fixed', 500
          )
          ON CONFLICT (bank_id, name) DO UPDATE SET
            category = EXCLUDED.category,
            sub_category = EXCLUDED.sub_category,
            description = EXCLUDED.description,
            short_description = EXCLUDED.short_description,
            annual_fee = EXCLUDED.annual_fee,
            joining_fee = EXCLUDED.joining_fee,
            interest_rate = EXCLUDED.interest_rate,
            time_period = EXCLUDED.time_period,
            badge = EXCLUDED.badge,
            features = EXCLUDED.features,
            eligibility_criteria = EXCLUDED.eligibility_criteria,
            slug = EXCLUDED.slug,
            is_active = true,
            status = 'Active'
        `, [
          targetBankId, prod.name, prod.category, prod.sub_category, prod.description, prod.short_description,
          prod.annual_fee, prod.joining_fee, prod.interest_rate, prod.time_period, prod.badge,
          featuresJson, prod.eligibility_criteria, prodSlug
        ]);
        updatedCount++;
        logger.info(`  ✅ Saved Product (fallback): ${prod.name}`);
      } catch (fallbackErr) {
        logger.error(`  ❌ Error saving product ${prod.name}:`, fallbackErr.message);
      }
    }
  }

  logger.info(`🎉 Finished seeding Smart EMI & LOCC products. Inserted: ${insertedCount}, Updated: ${updatedCount}`);
}

if (require.main === module) {
  seedSmartEmiAndLoccProducts()
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error('Fatal error in seeding:', err);
      process.exit(1);
    });
}

module.exports = { LOAN_ON_CARD_AND_SMART_EMI_PRODUCTS, seedSmartEmiAndLoccProducts };

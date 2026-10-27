const { query } = require('../../config/database');
const logger = require('../../config/logger');

async function migrateAddTataFloaterAdobeProduct() {
  logger.info('[MIGRATION] Adding/Verifying "Tata Floater Adobe Credit Card" for TATA CO-BRAND HDFC BANK...');

  try {
    const TATA_HDFC_BANK_ID = '1eacfa67-1187-48c7-adde-8a6edcfe9969';
    const TATA_HDFC_BANK_NAME = 'TATA CO-BRAND HDFC BANK';
    const TATA_HDFC_BANK_CODE = 'TATA_HDFC';

    // 1. Ensure TATA CO-BRAND HDFC BANK exists in banks table
    await query(`
      INSERT INTO banks (id, name, short_code, is_active, status)
      VALUES ($1, $2, $3, true, 'Active')
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        short_code = EXCLUDED.short_code,
        is_active = true,
        status = 'Active'
    `, [TATA_HDFC_BANK_ID, TATA_HDFC_BANK_NAME, TATA_HDFC_BANK_CODE]);

    logger.info('[MIGRATION] TATA CO-BRAND HDFC BANK verified in banks table.');

    // 2. Prepare Tata Floater Adobe Credit Card specification
    const productName = 'Tata Floater Adobe Credit Card';
    const productSlug = 'tata-floater-adobe-credit-card';
    const category = 'co_branded_card';
    const subCategory = 'Co-Branded Cards';
    const shortDesc = 'Instant Tata Floater credit card on existing HDFC limit via official Adobe digital onboarding.';
    const fullDesc = 'Tata Floater Adobe Credit Card allows existing HDFC Bank credit cardholders to instantly obtain a co-branded Tata Floater credit card sharing their existing card limit with zero separate paperwork via the Adobe digital journey.';
    const annualFee = 'Lifetime Free / As per variant';
    const joiningFee = 'Nil';
    const interestRate = '3.6% p.m.';
    const adobeUrl = 'https://applyonline.hdfc.bank.in/cards/credit-cards.html?CHANNELSOURCE=TDCC&DEDUPE=N&DSACode=XYOH&LGcode=PTN01&LCcode=PTN01&LC2=A089&SMcode=A31964#nbb';
    const imageUrl = 'https://d28wu8o6itv89p.cloudfront.net/images/TataNeuInfinityHDFCCardpng-1681283626786.png';

    const features = [
      'Instant Floater card issuance on existing HDFC Bank Credit Card limit',
      'Processed via official HDFC Bank Adobe Digital Onboarding journey',
      'Earn up to 5% NeuCoins on Tata Neu App & partner Tata brands',
      '1.5% NeuCoins on UPI transactions with RuPay credit card variant',
      'Zero separate physical documentation required for existing cardholders',
      '1% fuel surcharge waiver across all fuel stations in India'
    ];

    const benefits = 'Instant approval on shared credit limit, Tata Neu rewards on UPI & brand spends, zero paperwork via official Adobe process.';
    const eligibility = { min_age: 21, max_age: 65, min_income: 25000 };
    const eligibilityCriteria = 'Existing HDFC Bank Credit Card holder with good repayment history, or applicant with monthly income ₹25,000+.';
    const documentsRequired = 'PAN Card, Aadhaar Card';
    const feesCharges = 'Joining Fee: Nil | Annual Fee: Lifetime Free / As per variant | Interest Rate: 3.6% p.m.';

    const feesStructure = {
      joining_fee: joiningFee,
      annual_fee: annualFee,
      interest_rate: interestRate
    };

    const compareSpecs = {
      joining_fee: joiningFee,
      annual_fee: annualFee,
      rewards: shortDesc,
      lounge_access: 'Available',
      fuel_surcharge: '1% Waiver',
      forex_markup: '3.5%'
    };

    const commissions = {
      partner_commission: 1500,
      sub_partner_commission: 300,
      super_partner_commission: 200,
      admin_commission: 500
    };

    const visibility = {
      show_on_website: true,
      show_in_partner: true,
      is_featured: false,
      is_popular: true
    };

    const seoTitle = 'Tata Floater Adobe Credit Card – Apply Online | GharKaPaisa';
    const seoDescription = 'Apply for Tata Floater Adobe Credit Card. Instant Floater card issuance on existing HDFC card limit via Adobe digital process.';
    const seoKeywords = 'tata floater adobe credit card, tata floater hdfc credit card, tata neu floater adobe, apply hdfc credit card';
    const seoMetadata = {
      meta_title: seoTitle,
      meta_description: seoDescription,
      slug: productSlug
    };

    const docsArray = ['PAN Card', 'Aadhaar Card'];

    // 3. Insert or update the product record in products table
    const result = await query(`
      INSERT INTO products (
        bank_id, name, category, description, features, eligibility,
        commission_type, commission_value, min_age, max_age, min_income,
        display_order, annual_fee, short_description, benefits,
        fees_charges, eligibility_criteria, documents_required,
        apply_button_text, seo_title, seo_description, seo_keywords,
        priority, status, is_active, public_visible, partner_visible,
        featured, commission_enabled, slug,
        sub_category, joining_fee, interest_rate, rewards, cashback,
        lounge_access, fuel_surcharge, compare_specs, fees_structure,
        commissions_json, features_list, benefits_list, required_documents,
        visibility, seo_metadata, image_url, partner_url, public_url
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,
        $31,$32,$33,$34,$35,$36,$37,
        $38,$39,$40,$41,$42,$43,$44,$45,$46,$47,$48
      )
      ON CONFLICT (bank_id, name) DO UPDATE SET
        category = EXCLUDED.category,
        sub_category = EXCLUDED.sub_category,
        description = EXCLUDED.description,
        features = EXCLUDED.features,
        eligibility = EXCLUDED.eligibility,
        display_order = EXCLUDED.display_order,
        annual_fee = EXCLUDED.annual_fee,
        short_description = EXCLUDED.short_description,
        benefits = EXCLUDED.benefits,
        fees_charges = EXCLUDED.fees_charges,
        eligibility_criteria = EXCLUDED.eligibility_criteria,
        documents_required = EXCLUDED.documents_required,
        seo_title = EXCLUDED.seo_title,
        seo_description = EXCLUDED.seo_description,
        seo_keywords = EXCLUDED.seo_keywords,
        priority = EXCLUDED.priority,
        slug = EXCLUDED.slug,
        joining_fee = EXCLUDED.joining_fee,
        interest_rate = EXCLUDED.interest_rate,
        rewards = EXCLUDED.rewards,
        cashback = EXCLUDED.cashback,
        lounge_access = EXCLUDED.lounge_access,
        fuel_surcharge = EXCLUDED.fuel_surcharge,
        compare_specs = EXCLUDED.compare_specs,
        fees_structure = EXCLUDED.fees_structure,
        commissions_json = EXCLUDED.commissions_json,
        features_list = EXCLUDED.features_list,
        benefits_list = EXCLUDED.benefits_list,
        required_documents = EXCLUDED.required_documents,
        visibility = EXCLUDED.visibility,
        seo_metadata = EXCLUDED.seo_metadata,
        image_url = COALESCE(EXCLUDED.image_url, products.image_url),
        partner_url = EXCLUDED.partner_url,
        public_url = EXCLUDED.public_url,
        is_active = true,
        status = 'Active'
      RETURNING id, (xmin = 0) AS is_insert
    `, [
      TATA_HDFC_BANK_ID, productName, category, fullDesc, JSON.stringify(features), JSON.stringify(eligibility),
      'fixed', 500, eligibility.min_age, eligibility.max_age, eligibility.min_income,
      5, annualFee, shortDesc, benefits,
      feesCharges, eligibilityCriteria, documentsRequired,
      'Apply Now', seoTitle, seoDescription, seoKeywords,
      5, 'Active', true, true, true,
      false, true, productSlug,
      subCategory, joiningFee, interestRate, shortDesc, shortDesc,
      'Available', '1% Waiver', JSON.stringify(compareSpecs), JSON.stringify(feesStructure),
      JSON.stringify(commissions), JSON.stringify(features), JSON.stringify([{ title: 'Key Benefits', description: benefits }]), JSON.stringify(docsArray),
      JSON.stringify(visibility), JSON.stringify(seoMetadata), imageUrl, adobeUrl, adobeUrl
    ]);

    const row = result.rows[0];
    logger.info(`[MIGRATION COMPLETE] Successfully ${row?.is_insert ? 'inserted' : 'updated'} "${productName}" (ID: ${row?.id}) under TATA CO-BRAND HDFC BANK.`);
    return true;
  } catch (err) {
    logger.error('Error during Tata Floater Adobe Credit Card migration:', err.message);
    throw err;
  }
}

if (require.main === module) {
  migrateAddTataFloaterAdobeProduct()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = { migrateAddTataFloaterAdobeProduct };

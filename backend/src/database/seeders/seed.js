const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const { query } = require('../../config/database');
const logger = require('../../config/logger');

const BANKS = [
  { name: 'HDFC Bank', short_code: 'HDFC' },
  { name: 'State Bank of India', short_code: 'SBI' },
  { name: 'ICICI Bank', short_code: 'ICICI' },
  { name: 'Axis Bank', short_code: 'AXIS' },
  { name: 'Kotak Mahindra Bank', short_code: 'KOTAK' },
  { name: 'RBL Bank', short_code: 'RBL' },
  { name: 'AU Small Finance Bank', short_code: 'AU' },
  { name: 'IDFC First Bank', short_code: 'IDFC' },
  { name: 'YES Bank', short_code: 'YES' },
  { name: 'Federal Bank', short_code: 'FEDERAL' },
  { name: 'Equitas Small Finance Bank', short_code: 'EQUITAS' },
  { name: 'DCB Bank', short_code: 'DCB' },
  { name: 'IndusInd Bank', short_code: 'INDUSIND' },
  { name: 'KreditBee', short_code: 'KREDITBEE' },
  { name: 'MoneyView', short_code: 'MONEYVIEW' },
  { name: 'Navi', short_code: 'NAVI' },
  { name: 'PaySense', short_code: 'PAYSENSE' },
  { name: 'Star Health', short_code: 'STARHEALTH' },
  { name: 'HDFC Ergo', short_code: 'HDFCERGO' },
  { name: 'ICICI Lombard', short_code: 'ICICILOMBARD' },
  { name: 'Scapia', short_code: 'SCAPIA' },
  { name: 'Tata', short_code: 'TATA' },
];

const seed = async () => {
  logger.info('Seeding database...');

  // Banks
  for (const bank of BANKS) {
    await query(
      `INSERT INTO banks (name, short_code) VALUES ($1, $2) ON CONFLICT (short_code) DO NOTHING`,
      [bank.name, bank.short_code]
    );
  }
  logger.info(`Seeded ${BANKS.length} banks`);

  // Fetch bank IDs
  const { rows: banks } = await query(`SELECT id, short_code FROM banks`);
  const bankMap = Object.fromEntries(banks.map(b => [b.short_code, b.id]));

  // Products
  const PRODUCTS = [
    // Credit Cards
    { bank: 'HDFC', name: 'HDFC Pixel Card', category: 'credit_card', commission: 1200, features: ['Customizable rewards','Digital first card'] },
    { bank: 'HDFC', name: 'HDFC Millennia Credit Card', category: 'credit_card', commission: 1200, features: ['5% cashback','Lounge access','Zero forex markup'] },
    { bank: 'HDFC', name: 'HDFC Regalia Gold', category: 'credit_card', commission: 1800, features: ['Premium rewards','Golf access','Travel insurance'] },
    { bank: 'SBI', name: 'SBI SimplyCLICK', category: 'credit_card', commission: 950, features: ['10x rewards online','Amazon voucher','Fuel surcharge waiver'] },
    { bank: 'ICICI', name: 'ICICI Amazon Pay', category: 'credit_card', commission: 1100, features: ['5% Amazon cashback','1% everywhere','No annual fee'] },
    { bank: 'AXIS', name: 'Axis Ace Credit Card', category: 'credit_card', commission: 1050, features: ['5% on bill payments','2% on food delivery','Free Google Pay'] },
    { bank: 'KOTAK', name: 'Kotak 811 #DreamDifferent', category: 'credit_card', commission: 1000, features: ['Lifetime free','Railway lounge','Online rewards'] },
    { bank: 'RBL', name: 'RBL Shoprite', category: 'credit_card', commission: 900, features: ['Grocery rewards','Movie discounts','Fuel waiver'] },
    { bank: 'AU', name: 'AU LIT Credit Card', category: 'credit_card', commission: 850, features: ['Customizable benefits','Health & wellness','Travel perks'] },
    { bank: 'IDFC', name: 'IDFC FIRST Select', category: 'credit_card', commission: 900, features: ['Lifetime free','10x rewards','Roadside assistance'] },
    // Co-branded
    { bank: 'HDFC', name: 'Tata Neu HDFC', category: 'co_branded_card', commission: 1400, features: ['5% NeuCoins','Tata brand rewards','Lounge access'] },
    { bank: 'SBI', name: 'Tata Neu SBI', category: 'co_branded_card', commission: 1300, features: ['Tata ecosystem','NeuCoins rewards','Movie offers'] },
    { bank: 'FEDERAL', name: 'Scapia Federal', category: 'co_branded_card', commission: 1150, features: ['Zero forex','Travel rewards','Lounge access'] },
    { bank: 'YES', name: 'YES Novio', category: 'co_branded_card', commission: 1000, features: ['UPI credit','Lifestyle rewards','Movie benefits'] },
    { bank: 'YES', name: 'YES ZAG', category: 'co_branded_card', commission: 950, features: ['Zero fuel surcharge','Reward points','Dining offers'] },
    { bank: 'YES', name: 'YES POP Card', category: 'co_branded_card', commission: 900, features: ['Cashback on shopping','Welcome vouchers','Easy EMI'] },
    // FD Cards
    { bank: 'HDFC', name: 'HDFC MoneyBack+ FD Card', category: 'fd_card', commission: 700, features: ['FD-backed limit','Build credit score','No income proof'] },
    { bank: 'IDFC', name: 'IDFC FIRST WOW! Card', category: 'fd_card', commission: 650, features: ['FD-backed','Zero fees','Lifetime free'] },
    // Personal Loans
    { bank: 'HDFC', name: 'HDFC Personal Loan', category: 'personal_loan', commission: 3500, features: ['Up to ₹40L','48hr disbursal','Minimal docs'] },
    { bank: 'ICICI', name: 'ICICI Personal Loan', category: 'personal_loan', commission: 3200, features: ['Up to ₹50L','Flexi EMI','Pre-approved offers'] },
    { bank: 'SBI', name: 'SBI Xpress Credit', category: 'personal_loan', commission: 2800, features: ['Up to ₹20L','Low interest','Govt employees preferred'] },
    { bank: 'AXIS', name: 'Axis Personal Loan', category: 'personal_loan', commission: 3000, features: ['Up to ₹40L','Digital process','Doorstep service'] },
    { bank: 'KOTAK', name: 'Kotak Personal Loan', category: 'personal_loan', commission: 2900, features: ['Up to ₹35L','Same day approval','Zero prepayment'] },
    { bank: 'IDFC', name: 'IDFC Personal Loan', category: 'personal_loan', commission: 2700, features: ['Up to ₹40L','Low EMI','Flexible tenure'] },
    // Instant Loans
    { bank: 'KREDITBEE', name: 'KreditBee Personal Loan', category: 'instant_loan', commission: 1200, features: ['Up to ₹5L','5 min approval','Students eligible'] },
    { bank: 'MONEYVIEW', name: 'MoneyView Loan', category: 'instant_loan', commission: 1100, features: ['Up to ₹10L','Low CIBIL accepted','Instant disbursal'] },
    { bank: 'NAVI', name: 'Navi Personal Loan', category: 'instant_loan', commission: 1000, features: ['Up to ₹20L','100% digital','No branch visit'] },
    { bank: 'PAYSENSE', name: 'PaySense Personal Loan', category: 'instant_loan', commission: 1050, features: ['Up to ₹5L','No credit history needed','EMI plans'] },
    // Insurance
    { bank: 'STARHEALTH', name: 'Star Health Comprehensive', category: 'health_insurance', commission: 2500, features: ['Up to 1Cr cover','Cashless hospitals','Day-1 cover'] },
    { bank: 'HDFCERGO', name: 'HDFC Ergo Optima Restore', category: 'health_insurance', commission: 2200, features: ['Auto restore','No room rent cap','Wellness rewards'] },
    { bank: 'ICICILOMBARD', name: 'ICICI Lombard Complete Health', category: 'health_insurance', commission: 2100, features: ['Home treatment cover','Teleconsultation','Global cover option'] },
  ];

  for (const p of PRODUCTS) {
    if (!bankMap[p.bank]) continue;
    await query(`
      INSERT INTO products (bank_id, name, category, commission_type, commission_value, features, is_active)
      VALUES ($1, $2, $3, 'fixed', $4, $5, true)
      ON CONFLICT (bank_id, name) DO NOTHING
    `, [bankMap[p.bank], p.name, p.category, p.commission, JSON.stringify(p.features)]);
  }
  logger.info(`Seeded ${PRODUCTS.length} products`);

  // Super Admin
  const bcrypt = require('bcrypt');
  const hashedPassword = await bcrypt.hash('gharkapaisa.in', 10);
  await query(`DELETE FROM users WHERE role = 'super_admin' AND email NOT IN ($1, $2)`, ['sharadyohesa@gmail.com', 'pratapsanap14@gmail.com']);
  
  await query(`
    INSERT INTO users (email, mobile, firebase_uid, role, status, full_name, password_hash, email_verified)
    VALUES ('sharadyohesa@gmail.com', '8087179438', 'seed-superadmin-uid', 'super_admin', 'active', 'Sharad Yohesa', $1, TRUE)
    ON CONFLICT (email) DO UPDATE SET firebase_uid = 'seed-superadmin-uid', mobile = '8087179438', role = 'super_admin', status = 'active', full_name = 'Sharad Yohesa', password_hash = $1, email_verified = TRUE
  `, [hashedPassword]);

  await query(`
    INSERT INTO users (email, mobile, firebase_uid, role, status, full_name, password_hash, email_verified)
    VALUES ('pratapsanap14@gmail.com', '9370470692', 'seed-superadmin-uid2', 'super_admin', 'active', 'Pratap Sanap', $1, TRUE)
    ON CONFLICT (email) DO UPDATE SET firebase_uid = 'seed-superadmin-uid2', mobile = '9370470692', role = 'super_admin', status = 'active', full_name = 'Pratap Sanap', password_hash = $1, email_verified = TRUE
  `, [hashedPassword]);
  logger.info('Super admins seeded with credentials');

  logger.info('✅ Seeding complete');
  process.exit(0);
};

seed().catch(err => {
  logger.error('Seed failed', err);
  process.exit(1);
});

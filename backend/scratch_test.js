require('dotenv').config();
const { query } = require('./src/config/database');

async function check() {
  try {
    const kycCols = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'kyc_documents'
    `);
    console.log('kyc_documents columns:');
    kycCols.rows.forEach(r => console.log(`- ${r.column_name} (${r.data_type})`));

    const videoCols = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'partner_videos'
    `);
    console.log('\npartner_videos columns:');
    videoCols.rows.forEach(r => console.log(`- ${r.column_name} (${r.data_type})`));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();

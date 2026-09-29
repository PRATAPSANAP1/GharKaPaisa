const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { query, pool } = require('../config/database');
const logger = require('../config/logger');
const faceBiometricProvider = require('../services/biometric/faceBiometric.provider');
const { uploadToS3 } = require('../services/aws/s3.service');

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'gharkapaisa-production-storage';

const ENV_CONFIGS = [
  {
    code: 'BKG1',
    fileName: 'bkg1.png',
    name: 'Reception / Front Desk Environment',
    description: 'Reception/front desk area reference view',
  },
  {
    code: 'BKG2',
    fileName: 'bkg2.png',
    name: 'Elevator / Waiting Area Environment',
    description: 'Elevator and waiting area reference view',
  },
  {
    code: 'BKG3',
    fileName: 'bkg3.png',
    name: 'Office Entrance / Corridor Environment',
    description: 'Office entrance and corridor reference view',
  },
  {
    code: 'BKG4',
    fileName: 'bkg4.png',
    name: 'Reception / Workstation / Interior Environment',
    description: 'Reception, workstation and office interior reference view',
  },
];

async function importEnvironmentReferences() {
  console.log('====================================================');
  console.log('IMPORTING APPROVED OFFICE ENVIRONMENT REFERENCES');
  console.log('====================================================');

  const rootDir = path.resolve(__dirname, '../../../');

  for (const config of ENV_CONFIGS) {
    const filePath = path.join(rootDir, config.fileName);
    if (!fs.existsSync(filePath)) {
      console.warn(`[SKIP] Image file ${config.fileName} not found at ${filePath}`);
      continue;
    }

    try {
      const buffer = fs.readFileSync(filePath);
      faceBiometricProvider.validateFaceQuality(buffer, 'image/png');
      const hash = faceBiometricProvider.calculateImageHash(buffer);

      const s3Folder = `biometric/environment/${config.code}`;
      const s3FileName = `1.png`;

      console.log(`Uploading ${config.code} (${config.fileName}, ${buffer.length} bytes) to private S3...`);
      const s3Result = await uploadToS3(buffer, s3FileName, s3Folder);

      const { rows } = await query(
        `INSERT INTO attendance_environment_references 
         (reference_code, reference_name, s3_bucket, s3_key, image_hash, environment_status, capture_description, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'ACTIVE', $6, NOW())
         ON CONFLICT (reference_code) DO UPDATE 
         SET reference_name = EXCLUDED.reference_name,
             s3_bucket = EXCLUDED.s3_bucket,
             s3_key = EXCLUDED.s3_key,
             image_hash = EXCLUDED.image_hash,
             environment_status = 'ACTIVE',
             capture_description = EXCLUDED.capture_description,
             updated_at = NOW()
         RETURNING id, reference_code, reference_name, environment_status, image_hash`,
        [config.code, config.name, BUCKET_NAME, s3Result.key, hash, config.description]
      );

      console.log(`[SUCCESS] Registered ${config.code}: ${rows[0].reference_name} (Hash: ${hash.substring(0, 16)}...)`);
    } catch (err) {
      console.error(`[ERROR] Failed to import ${config.code}:`, err.message);
    }
  }

  console.log('====================================================');
  console.log('ENVIRONMENT IMPORT COMPLETE');
  console.log('====================================================');
}

if (require.main === module) {
  importEnvironmentReferences()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('Environment import failed:', err);
      await pool.end();
      process.exit(1);
    });
}

module.exports = { importEnvironmentReferences };

const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('../../utils/logger');

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET;
if (!BUCKET) {
  logger.error('AWS_S3_BUCKET not configured — file uploads will fail');
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const MIME_MAP = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.pdf': 'application/pdf',
};

// Multer memory storage (file goes to memory, then we push to S3)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const FORBIDDEN_EXTS = ['.exe', '.bat', '.js', '.zip', '.rar', '.sh'];

  if (FORBIDDEN_EXTS.includes(ext)) {
    return cb(new Error('Forbidden file type detected'), false);
  }

  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and PDF files are allowed'), false);
  }
};

// Multer upload instance
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE },
});

// Upload a buffer to S3
const uploadToS3 = async (buffer, originalName, folder = 'kyc') => {
  const ext = path.extname(originalName);
  const key = `${folder}/${uuidv4()}${ext}`;

  await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: MIME_MAP[ext.toLowerCase()] || 'application/octet-stream',
    ServerSideEncryption: 'AES256',
  }));

  const region = process.env.AWS_REGION || 'ap-south-1';
  const url = region === 'us-east-1'
    ? `https://${BUCKET}.s3.amazonaws.com/${key}`
    : `https://${BUCKET}.s3.${region}.amazonaws.com/${key}`;

  logger.info(`Uploaded to S3: ${key}`);
  return { url, key };
};

// Generate a temporary signed URL (for secure document viewing)
const getSignedDownloadUrl = async (key, expiresInSeconds = 3600) => {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
};

// Delete from S3
const deleteFromS3 = async (key) => {
  await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  logger.info(`Deleted from S3: ${key}`);
};

module.exports = { upload, uploadToS3, getSignedDownloadUrl, deleteFromS3 };

const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('../../config/logger');

const s3Options = {
  region: process.env.AWS_REGION || 'ap-south-1',
};

if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  s3Options.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
}

const s3Client = new S3Client(s3Options);

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
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
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

const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska', 'video/mov'];
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

const videoFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.mp4', '.webm', '.mov', '.mkv', '']; // Allow empty extension for raw blobs
  const allowedMimeTypes = [...ALLOWED_VIDEO_TYPES, 'application/octet-stream', 'audio/mp4']; // Allow octet-stream and audio/mp4 for iOS Safari blobs

  if (
    allowedExts.includes(ext) || 
    allowedMimeTypes.includes(file.mimetype) || 
    file.originalname === 'blob' ||
    file.mimetype.startsWith('video/') ||
    file.mimetype.startsWith('audio/')
  ) {
    cb(null, true);
  } else {
    cb(new Error('Only MP4, WebM, and MOV video formats are allowed'), false);
  }
};

const uploadVideo = multer({
  storage,
  fileFilter: videoFileFilter,
  limits: { fileSize: MAX_VIDEO_SIZE },
});

const genericFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const FORBIDDEN_EXTS = ['.exe', '.bat', '.js', '.zip', '.rar', '.sh'];

  if (FORBIDDEN_EXTS.includes(ext)) {
    return cb(new Error('Forbidden file type detected'), false);
  }
  cb(null, true);
};

const uploadGeneric = multer({
  storage,
  fileFilter: genericFileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// Helper to convert an S3 key to CloudFront public CDN URL
const getCloudFrontUrl = (key) => {
  if (!key) return key;
  const domain = (process.env.AWS_CLOUDFRONT_URL || 'https://d18qh1l6j6vziz.cloudfront.net').replace(/\/+$/, '');
  const cleanKey = key.replace(/^\/+/, '');
  const prefix = cleanKey.startsWith('public/') ? '' : 'public/';
  return `${domain}/${prefix}${cleanKey}`;
};

// Upload a buffer to S3
const uploadToS3 = async (buffer, originalName, folder = 'kyc', customFileName = null) => {
  let ext = path.extname(originalName).toLowerCase();
  if (!ext || ext === '') {
    ext = '.mp4'; // Default to mp4 if extension is missing (e.g. raw iOS Safari blob upload)
  }
  const fileName = customFileName ? (customFileName.endsWith(ext) ? customFileName : `${customFileName}${ext}`) : `${uuidv4()}${ext}`;
  const key = `${folder}/${fileName}`;

  await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: MIME_MAP[ext] || (ext === '.webp' ? 'image/webp' : 'application/octet-stream'),
    ServerSideEncryption: 'AES256',
  }));

  const isPublicAsset = folder.startsWith('public') || folder.startsWith('banks') || folder.startsWith('banners') || folder.startsWith('products');
  const url = isPublicAsset ? getCloudFrontUrl(key) : (
    (process.env.AWS_REGION || 'ap-south-1') === 'us-east-1'
      ? `https://${BUCKET}.s3.amazonaws.com/${key}`
      : `https://${BUCKET}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${key}`
  );

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

module.exports = { upload, uploadVideo, uploadGeneric, uploadToS3, getSignedDownloadUrl, deleteFromS3, getCloudFrontUrl };


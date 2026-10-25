/**
 * Standard Document Types and Normalization Enums for GharKaPaisa
 * Provides canonical definitions across KYC, verification, and employee documents.
 */

const DOCUMENT_TYPES = Object.freeze({
  PAN: 'pan',
  AADHAAR: 'aadhaar',
  BANK_PROOF: 'bank_proof',
  VIDEO: 'video',
  FACE_BIOMETRIC: 'face_biometric',
  PHOTO: 'photo',
  EDUCATION_CERTIFICATE: 'education_certificate',
  OFFER_LETTER: 'offer_letter',
  RESUME: 'resume',
  EXPERIENCE_LETTER: 'experience_letter'
});

const VIDEO_DOCUMENT_TYPES = Object.freeze([
  'video',
  'terms_video',
  'video_verification',
  'video_teleprompter'
]);

const BANK_DOCUMENT_TYPES = Object.freeze([
  'bank',
  'bank_proof',
  'bank_passbook',
  'cheque',
  'passbook'
]);

const AADHAAR_DOCUMENT_TYPES = Object.freeze([
  'aadhaar',
  'aadhaar_card',
  'aadhaar_front',
  'aadhaar_back'
]);

const PAN_DOCUMENT_TYPES = Object.freeze([
  'pan',
  'pan_card'
]);

const FACE_DOCUMENT_TYPES = Object.freeze([
  'face',
  'face_biometric',
  'biometric',
  'face_verification'
]);

const PHOTO_DOCUMENT_TYPES = Object.freeze([
  'photo',
  'photograph',
  'profile_photo'
]);

const DOCUMENT_TYPE_ALIASES = Object.freeze({
  // PAN
  'pan': DOCUMENT_TYPES.PAN,
  'pan_card': DOCUMENT_TYPES.PAN,

  // Aadhaar
  'aadhaar': DOCUMENT_TYPES.AADHAAR,
  'aadhaar_card': DOCUMENT_TYPES.AADHAAR,
  'aadhaar_front': DOCUMENT_TYPES.AADHAAR,
  'aadhaar_back': DOCUMENT_TYPES.AADHAAR,

  // Bank Proof
  'bank': DOCUMENT_TYPES.BANK_PROOF,
  'bank_proof': DOCUMENT_TYPES.BANK_PROOF,
  'bank_passbook': DOCUMENT_TYPES.BANK_PROOF,
  'cheque': DOCUMENT_TYPES.BANK_PROOF,
  'passbook': DOCUMENT_TYPES.BANK_PROOF,

  // Video Verification
  'video': DOCUMENT_TYPES.VIDEO,
  'terms_video': DOCUMENT_TYPES.VIDEO,
  'video_verification': DOCUMENT_TYPES.VIDEO,
  'video_teleprompter': DOCUMENT_TYPES.VIDEO,

  // Face Biometric
  'face': DOCUMENT_TYPES.FACE_BIOMETRIC,
  'face_biometric': DOCUMENT_TYPES.FACE_BIOMETRIC,
  'biometric': DOCUMENT_TYPES.FACE_BIOMETRIC,
  'face_verification': DOCUMENT_TYPES.FACE_BIOMETRIC,

  // Photo
  'photo': DOCUMENT_TYPES.PHOTO,
  'photograph': DOCUMENT_TYPES.PHOTO,
  'profile_photo': DOCUMENT_TYPES.PHOTO,

  // Employment / Education Docs
  'offer_letter': DOCUMENT_TYPES.OFFER_LETTER,
  'education_certificate': DOCUMENT_TYPES.EDUCATION_CERTIFICATE,
  'resume': DOCUMENT_TYPES.RESUME,
  'experience_letter': DOCUMENT_TYPES.EXPERIENCE_LETTER
});

/**
 * Normalizes any document type string or alias into its canonical DOCUMENT_TYPES constant.
 * @param {string} type 
 * @returns {string} canonical document type
 */
function normalizeDocumentType(type) {
  if (!type || typeof type !== 'string') return '';
  const cleaned = type.toLowerCase().trim();
  return DOCUMENT_TYPE_ALIASES[cleaned] || cleaned;
}

function isVideoDocument(type) {
  if (!type || typeof type !== 'string') return false;
  return VIDEO_DOCUMENT_TYPES.includes(type.toLowerCase().trim());
}

function isBankDocument(type) {
  if (!type || typeof type !== 'string') return false;
  return BANK_DOCUMENT_TYPES.includes(type.toLowerCase().trim());
}

function isAadhaarDocument(type) {
  if (!type || typeof type !== 'string') return false;
  return AADHAAR_DOCUMENT_TYPES.includes(type.toLowerCase().trim());
}

function isPanDocument(type) {
  if (!type || typeof type !== 'string') return false;
  return PAN_DOCUMENT_TYPES.includes(type.toLowerCase().trim());
}

function isFaceBiometricDocument(type) {
  if (!type || typeof type !== 'string') return false;
  return FACE_DOCUMENT_TYPES.includes(type.toLowerCase().trim());
}

module.exports = {
  DOCUMENT_TYPES,
  VIDEO_DOCUMENT_TYPES,
  BANK_DOCUMENT_TYPES,
  AADHAAR_DOCUMENT_TYPES,
  PAN_DOCUMENT_TYPES,
  FACE_DOCUMENT_TYPES,
  PHOTO_DOCUMENT_TYPES,
  DOCUMENT_TYPE_ALIASES,
  normalizeDocumentType,
  isVideoDocument,
  isBankDocument,
  isAadhaarDocument,
  isPanDocument,
  isFaceBiometricDocument
};

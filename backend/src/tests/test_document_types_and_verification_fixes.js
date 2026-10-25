const assert = require('assert');
const {
  DOCUMENT_TYPES,
  normalizeDocumentType,
  isVideoDocument,
  isBankDocument,
  isAadhaarDocument,
  isPanDocument,
  isFaceBiometricDocument
} = require('../constants/documentTypes');

console.log('--- TEST 1: Canonical Document Types & Aliases ---');
assert.strictEqual(normalizeDocumentType('video'), 'video');
assert.strictEqual(normalizeDocumentType('terms_video'), 'video');
assert.strictEqual(normalizeDocumentType('video_verification'), 'video');
assert.strictEqual(normalizeDocumentType('video_teleprompter'), 'video');
assert.strictEqual(normalizeDocumentType('VIDEO'), 'video');

assert.strictEqual(normalizeDocumentType('bank'), 'bank_proof');
assert.strictEqual(normalizeDocumentType('bank_proof'), 'bank_proof');
assert.strictEqual(normalizeDocumentType('bank_passbook'), 'bank_proof');
assert.strictEqual(normalizeDocumentType('cheque'), 'bank_proof');
assert.strictEqual(normalizeDocumentType('passbook'), 'bank_proof');

assert.strictEqual(normalizeDocumentType('face'), 'face_biometric');
assert.strictEqual(normalizeDocumentType('face_biometric'), 'face_biometric');
assert.strictEqual(normalizeDocumentType('biometric'), 'face_biometric');

assert.strictEqual(normalizeDocumentType('pan'), 'pan');
assert.strictEqual(normalizeDocumentType('pan_card'), 'pan');

assert.strictEqual(normalizeDocumentType('aadhaar'), 'aadhaar');
assert.strictEqual(normalizeDocumentType('aadhaar_card'), 'aadhaar');
assert.strictEqual(normalizeDocumentType('aadhaar_front'), 'aadhaar');
console.log('✔ All document aliases normalize accurately to canonical enums');

console.log('--- TEST 2: Type Predicates ---');
assert.strictEqual(isVideoDocument('video'), true);
assert.strictEqual(isVideoDocument('terms_video'), true);
assert.strictEqual(isVideoDocument('video_verification'), true);
assert.strictEqual(isVideoDocument('pan'), false);

assert.strictEqual(isBankDocument('bank'), true);
assert.strictEqual(isBankDocument('bank_proof'), true);
assert.strictEqual(isBankDocument('bank_passbook'), true);
assert.strictEqual(isBankDocument('video'), false);

assert.strictEqual(isFaceBiometricDocument('face'), true);
assert.strictEqual(isFaceBiometricDocument('face_biometric'), true);
assert.strictEqual(isFaceBiometricDocument('biometric'), true);
assert.strictEqual(isFaceBiometricDocument('bank'), false);

assert.strictEqual(isPanDocument('pan'), true);
assert.strictEqual(isPanDocument('pan_card'), true);

assert.strictEqual(isAadhaarDocument('aadhaar'), true);
assert.strictEqual(isAadhaarDocument('aadhaar_card'), true);
console.log('✔ Type predicates correctly classify document aliases');

console.log('--- TEST 3: Action-Specific Payload Resolution (Simulation) ---');
// Test simulation of verify-document resolution
function simulateVerifyDocResolution(body) {
  let { document_type, status, rejection_reason, video_action, video_reason, bank_action, bank_proof_action, biometric_action } = body;
  if (!document_type) {
    if (video_action) {
      document_type = 'video';
      status = video_action;
      rejection_reason = video_reason || rejection_reason;
    } else if (bank_proof_action || bank_action) {
      document_type = 'bank_proof';
      status = bank_proof_action || bank_action;
    } else if (biometric_action) {
      document_type = 'face_biometric';
      status = biometric_action;
    }
  } else {
    if (isVideoDocument(document_type) && video_action && !status) {
      status = video_action;
    } else if (isBankDocument(document_type) && (bank_proof_action || bank_action) && !status) {
      status = bank_proof_action || bank_action;
    } else if (isFaceBiometricDocument(document_type) && biometric_action && !status) {
      status = biometric_action;
    }
  }
  return { document_type: normalizeDocumentType(document_type), status, rejection_reason };
}

const resVideo = simulateVerifyDocResolution({ video_action: 'VERIFIED', video_reason: null });
assert.strictEqual(resVideo.document_type, 'video');
assert.strictEqual(resVideo.status, 'VERIFIED');

const resVideoWithDoc = simulateVerifyDocResolution({ document_type: 'terms_video', video_action: 'REJECTED', video_reason: 'Script unclear' });
assert.strictEqual(resVideoWithDoc.document_type, 'video');
assert.strictEqual(resVideoWithDoc.status, 'REJECTED');

const resBank = simulateVerifyDocResolution({ bank_action: 'APPROVED' });
assert.strictEqual(resBank.document_type, 'bank_proof');
assert.strictEqual(resBank.status, 'APPROVED');

const resBio = simulateVerifyDocResolution({ biometric_action: 'FLAGGED', rejection_reason: 'Blurry selfie' });
assert.strictEqual(resBio.document_type, 'face_biometric');
assert.strictEqual(resBio.status, 'FLAGGED');
console.log('✔ Action-specific payload resolution correctly resolves video_action, bank_action, and biometric_action');

console.log('========================================');
console.log('🎉 ALL DOCUMENT TYPE & VERIFICATION FIX TESTS PASSED!');
console.log('========================================');

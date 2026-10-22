const express = require('express');
const router = express.Router();
const { authenticate, syncUser } = require('../../middleware/authentication/auth.middleware');
const { upload } = require('../../services/aws/s3.service');
const ctrl = require('./attendance-verification.controller');

// All verification endpoints require authenticated user session
router.use(authenticate, syncUser);

// 1. Create verification session
router.post(['/session', '/session/', '/verification/session', '/verification/session/'], ctrl.createSession);

// 2. Initiate liveness session
router.post(['/liveness/session', '/liveness/session/', '/verification/liveness/session', '/verification/liveness/session/'], ctrl.createLivenessSession);

// 3. Issue short-lived temporary AWS credentials for browser-side liveness challenge
router.post(['/liveness/credentials', '/liveness/credentials/', '/verification/liveness/credentials', '/verification/liveness/credentials/'], ctrl.getLivenessCredentials);

// 4. Validate liveness session result
router.post(['/liveness/result', '/liveness/result/', '/verification/liveness/result', '/verification/liveness/result/'], ctrl.validateLivenessResult);

// 5. Complete verification pipeline (Liveness -> Face -> Environment -> Policy)
router.post(['/complete', '/complete/', '/verification/complete', '/verification/complete/'], upload.single('face_image'), ctrl.completeVerification);

// 6. Get session status
router.get(['/session/:sessionId', '/session/:sessionId/', '/verification/session/:sessionId', '/verification/session/:sessionId/'], ctrl.getSessionStatus);

module.exports = router;

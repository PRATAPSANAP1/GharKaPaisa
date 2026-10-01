const express = require('express');
const router = express.Router();
const { authenticate, syncUser } = require('../../middleware/authentication/auth.middleware');
const { upload } = require('../../services/aws/s3.service');
const ctrl = require('./attendance-verification.controller');

// All verification endpoints require authenticated user session
router.use(authenticate, syncUser);

// 1. Create verification session
router.post('/session', ctrl.createSession);

// 2. Initiate liveness session
router.post('/liveness/session', ctrl.createLivenessSession);

// 3. Issue short-lived temporary AWS credentials for browser-side liveness challenge
router.post('/liveness/credentials', ctrl.getLivenessCredentials);

// 4. Validate liveness session result
router.post('/liveness/result', ctrl.validateLivenessResult);

// 4. Complete verification pipeline (Liveness -> Face -> Environment -> Policy)
router.post('/complete', upload.single('face_image'), ctrl.completeVerification);

// 5. Get session status
router.get('/session/:sessionId', ctrl.getSessionStatus);

module.exports = router;

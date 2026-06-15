const express = require('express');
const router = express.Router();
const jwtAuth = require('../middleware/jwtAuth.middleware');
const partnerCtrl = require('../controllers/partner.controller');
const authCtrl = require('../controllers/auth.controller');
const { upload } = require('../services/s3.service');
const { validate, registerRules } = require('../middleware/validation.middleware');

const kycUpload = upload.fields([
  { name: 'aadhaar', maxCount: 1 },
  { name: 'pan', maxCount: 1 },
  { name: 'gst_cert', maxCount: 1 },
  { name: 'cancelled_cheque', maxCount: 1 },
]);

// All routes require authenticated Firebase token
router.use(jwtAuth);

router.post('/register', registerRules, validate, authCtrl.register);
router.post('/upload-docs', kycUpload, partnerCtrl.uploadSelfKYC);
router.get('/profile', partnerCtrl.getSelfProfile);

module.exports = router;

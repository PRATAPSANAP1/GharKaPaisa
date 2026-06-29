const express = require('express');
const router = express.Router();
const jwtAuth = require('../../middleware/jwtAuth.middleware.js');
const partnerCtrl = require('../../controllers/partner/partner.controller.js');
const authCtrl = require('../../controllers/auth/auth.controller.js');
const { upload } = require('../../services/partner/s3.service.js');
const { validate, registerRules } = require('../../middleware/validation.middleware.js');

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
router.get('/customers', partnerCtrl.listPartnerCustomers);
router.get('/training', partnerCtrl.getTrainingModules);

module.exports = router;

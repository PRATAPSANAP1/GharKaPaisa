const express = require('express');
const router  = express.Router();
const controller = require('./location.controller');

router.get('/pincode/:pincode', controller.getPincodeInfo);
router.get('/sbi-pincodes/suggestions', controller.getSbiPincodeSuggestions);
router.get('/check-sbi-pincode/:pincode', controller.checkSbiPincode);

module.exports = router;

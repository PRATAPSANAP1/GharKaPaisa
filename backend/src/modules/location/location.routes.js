const express = require('express');
const router  = express.Router();
const controller = require('./location.controller');

router.get('/pincode/:pincode', controller.getPincodeInfo);

module.exports = router;

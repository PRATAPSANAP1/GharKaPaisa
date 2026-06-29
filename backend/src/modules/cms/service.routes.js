const express = require('express');
const router = express.Router();
const { submitRequest } = require('./service.controller.js');

router.post('/request', submitRequest);

module.exports = router;

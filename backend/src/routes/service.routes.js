const express = require('express');
const router = express.Router();
const { submitRequest } = require('../controllers/service.controller');

router.post('/request', submitRequest);

module.exports = router;

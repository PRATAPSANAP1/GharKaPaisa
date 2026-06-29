const express = require('express');
const router = express.Router();
const { submitRequest } = require('../../controllers/cms/service.controller.js');

router.post('/request', submitRequest);

module.exports = router;

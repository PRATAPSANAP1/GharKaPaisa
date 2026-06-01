const express = require('express');
const router = express.Router();
const constituencyController = require('../controllers/constituencyController');

// Health check
router.get('/health', constituencyController.getHealth);

// GET /api/constituency/:id
router.get('/constituency/:id', constituencyController.getConstituency);

module.exports = router;

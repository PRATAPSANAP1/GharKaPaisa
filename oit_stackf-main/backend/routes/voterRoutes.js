const express = require('express');
const router = express.Router();
const { getVoters } = require('../controllers/voterController');

router.get('/voters', getVoters);

module.exports = router;

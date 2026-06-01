const express = require('express');
const { getLeaderboard } = require('../controllers/leaderboardController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, getLeaderboard);

module.exports = router;


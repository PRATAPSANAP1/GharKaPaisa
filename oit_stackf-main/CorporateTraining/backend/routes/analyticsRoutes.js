const express = require('express');
const {
  getDashboardStats,
  getStudentAnalytics,
  getTestAnalytics,
  getCategoryAnalytics,
} = require('../controllers/analyticsController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

const router = express.Router();

router.use(auth);
router.use(admin);

router.get('/dashboard', getDashboardStats);
router.get('/students', getStudentAnalytics);
router.get('/tests', getTestAnalytics);
router.get('/categories', getCategoryAnalytics);

module.exports = router;


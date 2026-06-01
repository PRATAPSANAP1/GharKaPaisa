const express = require('express');
const {
  getMyResults,
  getResultDetail,
  getAllResults,
  getResultStats,
} = require('../controllers/resultController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

const router = express.Router();

router.use(auth);

router.get('/my', getMyResults);
router.get('/my/:id', getResultDetail);

router.get('/admin/all', admin, getAllResults);
router.get('/admin/stats/:testId', admin, getResultStats);

module.exports = router;


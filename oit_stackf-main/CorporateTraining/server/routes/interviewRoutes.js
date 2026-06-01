const express = require('express');
const {
  startInterview,
  sendAnswer,
  endInterview,
  getInterviewHistory,
} = require('../controllers/interviewController');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.post('/start', startInterview);
router.post('/answer', sendAnswer);
router.post('/end', endInterview);
router.get('/history', getInterviewHistory);

module.exports = router;


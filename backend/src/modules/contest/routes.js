const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

const { authenticateToken, requireAdmin } = require('../../middlewares/auth/auth');
const {
  listContests,
  getContestById,
  createContest,
  updateContest,
  deleteContest
} = require('./controller.js');

// Public & Employee contest routes (optional token authentication)
router.get('/', listContests);
router.get('/:id', getContestById);

// Admin / Super Admin routes
router.post('/', upload.single('banner'), createContest);
router.put('/:id', upload.single('banner'), updateContest);
router.delete('/:id', deleteContest);

module.exports = router;

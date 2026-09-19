const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

const jwtAuth = require('../../middleware/authentication/jwtAuth.middleware.js');
const roleCheck = require('../../middleware/authorization/role.middleware.js');
const { optionalAuth } = require('../../middleware/authentication/auth.middleware.js');
const {
  listContests,
  getContestById,
  createContest,
  updateContest,
  deleteContest
} = require('./controller.js');

// Public & Employee contest routes (optional token authentication)
router.get('/', optionalAuth, listContests);
router.get('/:id', optionalAuth, getContestById);

// Admin / Super Admin routes
router.post('/', jwtAuth, roleCheck('ADMIN', 'SUPER_ADMIN'), upload.single('banner'), createContest);
router.put('/:id', jwtAuth, roleCheck('ADMIN', 'SUPER_ADMIN'), upload.single('banner'), updateContest);
router.delete('/:id', jwtAuth, roleCheck('ADMIN', 'SUPER_ADMIN'), deleteContest);

module.exports = router;

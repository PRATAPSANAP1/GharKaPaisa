const express = require('express');
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getUserStats,
} = require('../controllers/userController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

const router = express.Router();

router.use(auth);
router.use(admin);

router.get('/', getUsers);
router.get('/:id', getUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.get('/:id/stats', getUserStats);

module.exports = router;


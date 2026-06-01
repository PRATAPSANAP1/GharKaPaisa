const express = require('express');
const { body } = require('express-validator');
const {
  register,
  login,
  getProfile,
  updateProfile,
  forgotPassword,
  resetPassword,
  refreshAuthToken,
  logout,
  logoutAll
} = require('../controllers/authController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please enter a valid email address').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Please enter a valid email address').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const forgotPasswordValidation = [
  body('email').isEmail().withMessage('Please enter a valid email address').normalizeEmail(),
];

const resetPasswordValidation = [
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
];

const profileValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('phone').optional().trim(),
  body('college').optional().trim(),
  body('branch').optional().trim(),
  body('year').optional().trim(),
  body('profileImage').optional().trim(),
];

router.post('/register', validate(registerValidation), register);
router.post('/login', authLimiter, validate(loginValidation), login);
router.post('/forgot-password', validate(forgotPasswordValidation), forgotPassword);
router.post('/reset-password/:token', validate(resetPasswordValidation), resetPassword);
router.post('/refresh', refreshAuthToken);
router.post('/logout', logout);
router.post('/logout-all', auth, logoutAll);

router.get('/profile', auth, getProfile);
router.put('/profile', auth, validate(profileValidation), updateProfile);

module.exports = router;


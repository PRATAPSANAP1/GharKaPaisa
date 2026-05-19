const express = require('express');
const { body } = require('express-validator');
const { login, register } = require('../controllers/authController');

const router = express.Router();

const loginValidation = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
  body('role').isIn(['admin', 'employee', 'agent']).withMessage('Invalid role'),
];

const registerValidation = [
  body('name').notEmpty().withMessage('Name required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
  body('role').isIn(['admin', 'employee', 'agent']).withMessage('Invalid role'),
];

router.post('/login', loginValidation, login);
router.post('/register', registerValidation, register);

module.exports = router;

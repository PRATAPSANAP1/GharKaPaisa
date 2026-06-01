const express = require('express');
const { body } = require('express-validator');
const {
  getTests,
  getTest,
  createTest,
  updateTest,
  deleteTest,
  startTest,
  saveAnswer,
  submitTest,
} = require('../controllers/testController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const validate = require('../middleware/validate');

const router = express.Router();

const testValidation = [
  body('name').trim().notEmpty().withMessage('Test name is required'),
  body('questions').isArray({ min: 1 }).withMessage('At least one question is required'),
  body('totalTime').isInt({ min: 1 }).withMessage('Total time in minutes is required'),
];

router.get('/', auth, getTests);
router.get('/:id', auth, getTest);
router.post('/:id/start', auth, startTest);
router.patch('/results/:resultId/save-answer', auth, saveAnswer);
router.post('/:id/submit', auth, submitTest);

router.post('/', auth, admin, validate(testValidation), createTest);
router.put('/:id', auth, admin, updateTest);
router.delete('/:id', auth, admin, deleteTest);

module.exports = router;


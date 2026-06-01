const express = require('express');
const { body } = require('express-validator');
const {
  getQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  bulkImportQuestions,
} = require('../controllers/questionController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const validate = require('../middleware/validate');

const router = express.Router();

const questionValidation = [
  body('question').trim().notEmpty().withMessage('Question text is required'),
  body('options').isArray({ min: 2, max: 6 }).withMessage('Options must be an array with 2 to 6 choices'),
  body('correctAnswer').isInt().withMessage('Correct answer index is required and must be an integer'),
  body('category').isMongoId().withMessage('Category ID must be a valid Mongo ID'),
  body('subcategory').optional().isMongoId().withMessage('Subcategory ID must be a valid Mongo ID'),
];

router.use(auth);
router.use(admin);

router.get('/', getQuestions);
router.get('/:id', getQuestion);
router.post('/', validate(questionValidation), createQuestion);
router.put('/:id', updateQuestion);
router.delete('/:id', deleteQuestion);
router.post('/bulk', bulkImportQuestions);

module.exports = router;


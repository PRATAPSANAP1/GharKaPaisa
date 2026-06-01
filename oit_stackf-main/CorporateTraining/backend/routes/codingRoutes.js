const express = require('express');
const { body } = require('express-validator');
const {
  getProblems,
  getProblem,
  createProblem,
  updateProblem,
  deleteProblem,
  runCode,
  submitCode,
  getMySubmissions,
} = require('../controllers/codingController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const validate = require('../middleware/validate');

const router = express.Router();

const problemValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('difficulty').isIn(['easy', 'medium', 'hard']).withMessage('Difficulty must be easy, medium, or hard'),
  body('testCases').isArray({ min: 1 }).withMessage('At least one test case is required'),
];

router.use(auth);

router.get('/problems', getProblems);
router.get('/problems/:id', getProblem);
router.post('/run', runCode);
router.post('/submit', submitCode);
router.get('/submissions/:problemId', getMySubmissions);

router.post('/problems', admin, validate(problemValidation), createProblem);
router.put('/problems/:id', admin, updateProblem);
router.delete('/problems/:id', admin, deleteProblem);

module.exports = router;

